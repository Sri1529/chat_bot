from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import logging
import time
import os
from app.services.vector_store_service import VectorStoreService
from app.services.llm_service import LLMService
from app.services.audio_service import AudioService

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
vector_service = VectorStoreService()
llm_service = LLMService()
audio_service = AudioService()

class ChatMessage(BaseModel):
    message: str
    organisation_id: int = 1
    project_id: int = 1
    is_voice: bool = False

class ChatResponse(BaseModel):
    answer: str
    transcript: Optional[str] = None
    audio_url: Optional[str] = None
    is_voice: bool = False
    timestamp: float

@router.post("/message", response_model=ChatResponse)
async def send_message(chat_message: ChatMessage):
    """
    Send a chat message and get AI response using vector search and LLM
    """
    try:
        logger.info(f"Received chat message: {chat_message.message[:100]}...")
        
        # Generate embedding for the query
        query_embeddings = vector_service.get_embeddings([chat_message.message])
        query_vector = query_embeddings[0]
        
        # Query similar vectors from the store
        vector_results = vector_service.query_vectors(
            query_vector=query_vector,
            organisation_id=chat_message.organisation_id,
            project_id=chat_message.project_id,
            limit=5
        )
        
        # Extract relevant chunks from the results
        relevant_chunks = []
        if 'vectors' in vector_results:
            for vector in vector_results['vectors']:
                if 'metadata' in vector and 'chunk_text' in vector['metadata']:
                    relevant_chunks.append(vector['metadata']['chunk_text'])
        
        logger.info(f"Found {len(relevant_chunks)} relevant chunks")
        
        # Generate AI response using the relevant context
        ai_response = llm_service.process_query_with_context(
            query=chat_message.message,
            relevant_chunks=relevant_chunks
        )
        
        response = {
            "response": ai_response,
            "is_voice": chat_message.is_voice,
            "timestamp": time.time()
        }
        
        logger.info(f"Generated response: {ai_response[:100]}...")
        return ChatResponse(**response)
        
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        raise HTTPException(status_code=500, detail="Failed to process message")

@router.post("/chat", response_model=ChatResponse)
async def chat(
    text: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    organisation_id: int = Form(1),
    project_id: int = Form(1)
):
    """
    Handle both text and voice input for chat
    
    - If text is provided: process text directly
    - If audio is provided: transcribe audio, process text, generate response, synthesize audio
    """
    try:
        # Validate input
        if not text and not audio:
            raise HTTPException(status_code=400, detail="Either text or audio must be provided")
        
        if text and audio:
            raise HTTPException(status_code=400, detail="Provide either text or audio, not both")
        
        # Determine input type
        is_voice_input = audio is not None
        user_text = ""
        transcript = None
        
        if is_voice_input:
            # Handle audio input
            logger.info("Processing voice input")
            
            # Save uploaded audio to temporary file
            temp_audio_path = audio_service.create_temp_audio_file("webm")
            try:
                with open(temp_audio_path, "wb") as temp_file:
                    content = await audio.read()
                    temp_file.write(content)
                
                # Transcribe audio
                transcript = audio_service.transcribe_audio(temp_audio_path)
                user_text = transcript
                logger.info(f"Transcribed audio: {transcript[:100]}...")
                
            finally:
                # Clean up temporary audio file
                audio_service.cleanup_audio_file(temp_audio_path)
        else:
            # Handle text input
            logger.info("Processing text input")
            user_text = text.strip()
        
        if not user_text:
            raise HTTPException(status_code=400, detail="No text content found")
        
        # Process the query (same logic for both text and voice)
        query_embeddings = vector_service.get_embeddings([user_text])
        query_vector = query_embeddings[0]
        
        # Query similar vectors from the store
        vector_results = vector_service.query_vectors(
            query_vector=query_vector,
            organisation_id=organisation_id,
            project_id=project_id,
            limit=5
        )
        
        # Extract relevant chunks from the results
        relevant_chunks = []
        if 'vectors' in vector_results:
            for vector in vector_results['vectors']:
                if 'metadata' in vector and 'chunk_text' in vector['metadata']:
                    relevant_chunks.append(vector['metadata']['chunk_text'])
        
        logger.info(f"Found {len(relevant_chunks)} relevant chunks")
        
        # Generate AI response using the relevant context
        ai_response = llm_service.process_query_with_context(
            query=user_text,
            relevant_chunks=relevant_chunks
        )
        
        # Prepare response
        response_data = {
            "answer": ai_response,
            "transcript": transcript,
            "is_voice": is_voice_input,
            "timestamp": time.time()
        }
        
        # Generate audio for voice input
        if is_voice_input:
            try:
                # Create audio file for response
                audio_path = audio_service.create_temp_audio_file("mp3")
                audio_service.synthesize_speech(ai_response, audio_path)
                audio_url = audio_service.get_audio_url(audio_path)
                response_data["audio_url"] = audio_url
                logger.info(f"Generated audio response: {audio_url}")
            except Exception as e:
                logger.error(f"Failed to generate audio response: {e}")
                # Continue without audio if synthesis fails
        
        logger.info(f"Generated response: {ai_response[:100]}...")
        return ChatResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat request: {e}")
        raise HTTPException(status_code=500, detail="Failed to process chat request")
