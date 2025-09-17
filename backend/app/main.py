from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import time
import json
import asyncio
import os
from typing import Dict, List
import logging

from app.core.config import settings
from app.core.logging import setup_logging
from app.services.vector_store_service import VectorStoreService
from app.services.llm_service import LLMService
from app.services.voice_service import VoiceService
from app.api.v1.api import api_router

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Global services
vector_service = None
llm_service = None
voice_service = None

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global vector_service, llm_service, voice_service
    
    # Startup
    logger.info("Starting Voice Chatbot API...")
    logger.info(f"Vector Index: {settings.DOC_INDEX_NAME}")
    logger.info(f"Vector Dimension: {settings.VECTOR_DIMENSION}")
    logger.info(f"Embedding Model: {settings.EMBEDDING_MODEL_ID}")
    logger.info(f"AWS Region: {settings.AWS_REGION}")
    
    # Initialize services
    try:
        vector_service = VectorStoreService()
        llm_service = LLMService()
        voice_service = VoiceService()
        logger.info("All services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Voice Chatbot API...")

def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Voice-enabled chatbot with AI-powered responses using vector similarity search",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Request timing middleware
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response
    
    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Global exception handler: {exc}")
        logger.error(f"Request URL: {request.url}")
        logger.error(f"Request method: {request.method}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error": str(exc)}
        )
    
    # Include API routes
    app.include_router(api_router, prefix=settings.API_V1_STR)
    
    # Mount static files for audio
    static_dir = os.path.join(settings.BASE_DIR, "static")
    os.makedirs(static_dir, exist_ok=True)
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    # WebSocket endpoint
    @app.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket):
        await manager.connect(websocket)
        try:
            while True:
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                    await handle_websocket_message(websocket, message)
                except json.JSONDecodeError:
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "error",
                            "message": "Invalid JSON format"
                        }), 
                        websocket
                    )
        except WebSocketDisconnect:
            manager.disconnect(websocket)
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            manager.disconnect(websocket)
    
    # Root endpoint
    @app.get("/")
    async def root():
        return {
            "message": "Welcome to Voice Chatbot API",
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "health": "/api/v1/health",
            "websocket": "/ws"
        }
    
    return app

async def handle_websocket_message(websocket: WebSocket, message: Dict):
    """Handle incoming WebSocket messages"""
    try:
        message_type = message.get("type")
        
        if message_type == "user_message":
            await handle_user_message(websocket, message)
        elif message_type == "ping":
            await manager.send_personal_message(
                json.dumps({"type": "pong"}), 
                websocket
            )
        else:
            await manager.send_personal_message(
                json.dumps({
                    "type": "error",
                    "message": f"Unknown message type: {message_type}"
                }), 
                websocket
            )
    except Exception as e:
        logger.error(f"Error handling WebSocket message: {e}")
        await manager.send_personal_message(
            json.dumps({
                "type": "error",
                "message": "Internal server error"
            }), 
            websocket
        )

async def handle_user_message(websocket: WebSocket, message: Dict):
    """Handle user message and generate AI response"""
    try:
        user_text = message.get("text", "")
        is_voice = message.get("isVoice", False)
        organisation_id = message.get("organisation_id", 1)
        project_id = message.get("project_id", 1)
        
        if not user_text.strip():
            await manager.send_personal_message(
                json.dumps({
                    "type": "error",
                    "message": "Empty message received"
                }), 
                websocket
            )
            return
        
        logger.info(f"Processing user message: {user_text[:100]}...")
        
        # Send typing indicator
        await manager.send_personal_message(
            json.dumps({"type": "typing", "isTyping": True}), 
            websocket
        )
        
        # Generate query embedding
        query_embeddings = vector_service.get_embeddings([user_text])
        query_vector = query_embeddings[0]
        
        # Search for similar content
        search_results = vector_service.query_vectors(
            query_vector=query_vector,
            organisation_id=organisation_id,
            project_id=project_id,
            limit=5
        )
        
        # Extract relevant chunks
        relevant_chunks = []
        if "vectors" in search_results:
            for vector_data in search_results["vectors"]:
                if "metadata" in vector_data and "chunk_text" in vector_data["metadata"]:
                    relevant_chunks.append(vector_data["metadata"]["chunk_text"])
        
        # Generate AI response
        if relevant_chunks:
            ai_response = llm_service.process_query_with_context(user_text, relevant_chunks)
        else:
            ai_response = "I don't have enough information to answer your question. Please try rephrasing or ask about something else."
        
        # Send response
        response_message = {
            "type": "bot_response",
            "text": ai_response,
            "isVoice": is_voice,
            "timestamp": time.time()
        }
        
        await manager.send_personal_message(
            json.dumps(response_message), 
            websocket
        )
        
        logger.info(f"Sent AI response: {ai_response[:100]}...")
        
    except Exception as e:
        logger.error(f"Error processing user message: {e}")
        await manager.send_personal_message(
            json.dumps({
                "type": "error",
                "message": "Failed to process message"
            }), 
            websocket
        )

# Create app instance
app = create_app()

if __name__ == "__main__":
    import uvicorn
    
    try:
        logger.info("Starting server...")
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Server startup failed: {e}")
        raise
