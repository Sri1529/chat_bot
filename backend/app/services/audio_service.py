import openai
import tempfile
import os
import uuid
import logging
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

class AudioService:
    """Service for handling audio transcription and text-to-speech"""
    
    def __init__(self):
        try:
            # Initialize OpenAI client
            self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("AudioService initialized with OpenAI client")
        except Exception as e:
            logger.error(f"Failed to initialize AudioService: {e}")
            raise
    
    def transcribe_audio(self, audio_file_path: str) -> str:
        """
        Transcribe audio file to text using OpenAI Whisper
        
        Args:
            audio_file_path: Path to the audio file
            
        Returns:
            Transcribed text
        """
        try:
            logger.info(f"Transcribing audio file: {audio_file_path}")
            
            with open(audio_file_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
            
            logger.info(f"Transcription completed: {len(transcript)} characters")
            return transcript.strip()
            
        except Exception as e:
            logger.error(f"Failed to transcribe audio: {e}")
            raise
    
    def synthesize_speech(self, text: str, output_path: str) -> str:
        """
        Convert text to speech using OpenAI TTS and save to file
        
        Args:
            text: Text to convert to speech
            output_path: Path where to save the audio file
            
        Returns:
            Path to the generated audio file
        """
        try:
            logger.info(f"Synthesizing speech for text: {text[:100]}...")
            
            response = self.client.audio.speech.create(
                model="tts-1",
                voice="alloy",  # Options: alloy, echo, fable, onyx, nova, shimmer
                input=text,
                response_format="mp3"
            )
            
            # Save the audio file
            with open(output_path, "wb") as audio_file:
                for chunk in response.iter_bytes():
                    audio_file.write(chunk)
            
            logger.info(f"Speech synthesis completed: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Failed to synthesize speech: {e}")
            raise
    
    def create_temp_audio_file(self, extension: str = "mp3") -> str:
        """
        Create a temporary audio file with unique name
        
        Args:
            extension: File extension (default: mp3)
            
        Returns:
            Path to the temporary file
        """
        try:
            # Create temp directory if it doesn't exist
            temp_dir = os.path.join(settings.BASE_DIR, "static", "audio")
            os.makedirs(temp_dir, exist_ok=True)
            
            # Generate unique filename
            unique_id = str(uuid.uuid4())
            filename = f"audio_{unique_id}.{extension}"
            file_path = os.path.join(temp_dir, filename)
            
            logger.info(f"Created temporary audio file: {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Failed to create temporary audio file: {e}")
            raise
    
    def cleanup_audio_file(self, file_path: str) -> None:
        """
        Clean up temporary audio file
        
        Args:
            file_path: Path to the file to delete
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up audio file: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to cleanup audio file {file_path}: {e}")
    
    def get_audio_url(self, file_path: str) -> str:
        """
        Get the URL for serving the audio file
        
        Args:
            file_path: Path to the audio file
            
        Returns:
            URL path for serving the file
        """
        try:
            # Extract filename from path
            filename = os.path.basename(file_path)
            return f"/static/audio/{filename}"
        except Exception as e:
            logger.error(f"Failed to get audio URL: {e}")
            raise
