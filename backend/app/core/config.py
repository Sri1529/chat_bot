from pydantic_settings import BaseSettings
from typing import Optional, List
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Voice Chatbot API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    
    # AWS Configuration
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_S3_VECTOR_STORE_BUCKET: str = os.getenv("AWS_S3_VECTOR_STORE_BUCKET", "")
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Vector Store Configuration
    DOC_INDEX_NAME: str = "vault-ai-index"
    EMBEDDING_MODEL_ID: str = "amazon.titan-embed-text-v2:0"
    VECTOR_DIMENSION: int = 512
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Voice Configuration
    VOICE_ENABLED: bool = True
    DEFAULT_LANGUAGE: str = "en-US"
    
    # WebSocket Configuration
    WS_HEARTBEAT_INTERVAL: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
