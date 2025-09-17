import openai
from typing import List
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class LLMService:
    """Service for managing Large Language Model interactions"""
    
    def __init__(self):
        try:
            # Try to initialize with newer OpenAI client
            self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("LLMService initialized with OpenAI client")
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI client: {e}")
            logger.info("Falling back to legacy OpenAI client initialization")
            try:
                # Fallback to legacy initialization
                openai.api_key = settings.OPENAI_API_KEY
                self.client = None
                logger.info("LLMService initialized with legacy OpenAI client")
            except Exception as fallback_error:
                logger.error(f"Failed to initialize OpenAI client (both methods): {fallback_error}")
                raise
    
    def generate_response(self, query: str, context: str) -> str:
        """Generate AI response based on query and context"""
        try:
            logger.info("Generating AI response with OpenAI")
            
            if self.client:
                # Use newer OpenAI client
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": f"You are a helpful assistant. ONLY use the provided context to answer the user's question. If the context does not contain relevant information to answer the question, respond with exactly: 'No context found for your query.' Do not provide general information or suggestions.\n\nContext:\n{context}"
                        },
                        {"role": "user", "content": query}
                    ],
                    max_tokens=500,
                    temperature=0.7
                )
                llm_answer = response.choices[0].message.content
            else:
                # Use legacy OpenAI client
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": f"You are a helpful assistant. ONLY use the provided context to answer the user's question. If the context does not contain relevant information to answer the question, respond with exactly: 'No context found for your query.' Do not provide general information or suggestions.\n\nContext:\n{context}"
                        },
                        {"role": "user", "content": query}
                    ],
                    max_tokens=500,
                    temperature=0.7
                )
                llm_answer = response.choices[0].message.content
            
            logger.info("AI response generated successfully")
            return llm_answer
            
        except Exception as e:
            logger.error(f"Failed to generate AI response: {e}")
            logger.error(f"LLM error type: {type(e)}")
            raise
    
    def process_query_with_context(self, query: str, relevant_chunks: List[str]) -> str:
        """Process a query with relevant context chunks"""
        
        # Check if this is ONLY a pure greeting (very strict)
        query_lower = query.lower().strip()
        
        # Define pure greeting patterns (exact matches or very simple)
        pure_greetings = [
            'hello', 'hi', 'hey', 'greetings',
            'good morning', 'good afternoon', 'good evening',
            'how are you', 'how do you do'
        ]
        
        # Check if it's EXACTLY a pure greeting (no extra words)
        is_pure_greeting = False
        for greeting in pure_greetings:
            if query_lower == greeting or query_lower == greeting + '!':
                is_pure_greeting = True
                break
        
        # Only respond generically for PURE greetings
        if is_pure_greeting:
            logger.info(f"Pure greeting detected: '{query}' - responding generically")
            return self._generate_greeting_response(query)
        
        # For ALL other queries, use vector search
        logger.info(f"Non-greeting query detected: '{query}' - using vector search")
        
        if not relevant_chunks:
            logger.warning(f"No relevant chunks found for query: '{query}'")
            return self._generate_no_context_response(query)
        
        logger.info(f"Found {len(relevant_chunks)} relevant chunks for query: '{query}'")
        
        # Check if the chunks are actually relevant by checking their content
        # If all chunks are very short or don't contain meaningful content, consider it no context
        meaningful_chunks = [chunk for chunk in relevant_chunks if len(chunk.strip()) > 20]
        if not meaningful_chunks:
            logger.warning(f"No meaningful chunks found for query: '{query}'")
            return self._generate_no_context_response(query)
        
        # Combine chunks into context
        context = "\n\n".join(meaningful_chunks)
        logger.debug(f"Context length for LLM: {len(context)} characters")
        
        # Generate response based on vector similarity
        ai_response = self.generate_response(query, context)

        # --- NEW LOGIC FOR LANGUAGE CONSISTENCY ---
        # Detect the language of the original query
        query_language = self._detect_language(query)
        logger.info(f"Detected query language: {query_language}")

        # If the query was not in English, translate the AI response to English
        if query_language.lower() != "english" and query_language.lower() != "en":
            logger.info(f"Query was in {query_language}, translating AI response to English.")
            try:
                translation_result = self.translate_content(ai_response, target_language="English", source_language=query_language)
                ai_response = translation_result["translated_content"]
                logger.info("AI response translated to English.")
            except Exception as e:
                logger.error(f"Failed to translate AI response to English: {e}. Returning original response.")
        # --- END NEW LOGIC ---
        
        return ai_response
    
    def _generate_greeting_response(self, query: str) -> str:
        """Generate a friendly greeting response"""
        import random
        from datetime import datetime
        
        # Get current time for appropriate greeting
        current_hour = datetime.now().hour
        if current_hour < 12:
            time_greeting = "Good morning"
        elif current_hour < 17:
            time_greeting = "Good afternoon"
        else:
            time_greeting = "Good evening"
        
        greetings = [
            f"{time_greeting}! How can I help you today?",
            f"Hello! {time_greeting}! I'm here to assist you. What would you like to know?",
            f"Hi there! {time_greeting}! How can I be of service today?",
            f"Greetings! {time_greeting}! What can I help you with?",
            f"Hello! {time_greeting}! I'm ready to help. What do you need assistance with?"
        ]
        
        return random.choice(greetings)
    
    def _generate_no_context_response(self, query: str) -> str:
        """Generate a response when no context is found"""
        return "No context found for your query."
    
    def translate_content(self, content: str, target_language: str, source_language: str = None) -> dict:
        """Translate content to the specified target language"""
        try:
            logger.info(f"Translating content to {target_language}")
            
            # Build the translation prompt
            if source_language:
                system_prompt = f"You are a professional translator. Translate the following text from {source_language} to {target_language}. Maintain the original meaning, tone, and formatting. Return only the translated text without any explanations or additional text."
            else:
                system_prompt = f"You are a professional translator. Detect the language of the following text and translate it to {target_language}. Maintain the original meaning, tone, and formatting. Return only the translated text without any explanations or additional text."
            
            if self.client:
                # Use newer OpenAI client
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": content}
                    ],
                    max_tokens=2000,
                    temperature=0.3  # Lower temperature for more consistent translations
                )
                translated_text = response.choices[0].message.content
            else:
                # Use legacy OpenAI client
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": content}
                    ],
                    max_tokens=2000,
                    temperature=0.3
                )
                translated_text = response.choices[0].message.content
            
            # Detect source language if not provided
            if not source_language:
                source_language = self._detect_language(content)
            
            logger.info(f"Content translated successfully to {target_language}")
            
            return {
                "translated_content": translated_text,
                "source_language": source_language,
                "target_language": target_language,
                "translation_confidence": 0.95  # OpenAI models are very reliable for translation
            }
            
        except Exception as e:
            logger.error(f"Failed to translate content: {e}")
            logger.error(f"Translation error type: {type(e)}")
            raise
    
    def _detect_language(self, text: str) -> str:
        """Detect the language of the given text"""
        try:
            logger.debug("Detecting language of text")
            
            system_prompt = "You are a language detection expert. Analyze the following text and respond with ONLY the language name in English (e.g., 'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian', etc.). Do not include any other text or explanations."
            
            if self.client:
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text[:500]}  # Limit text length for language detection
                    ],
                    max_tokens=50,
                    temperature=0.1
                )
                detected_language = response.choices[0].message.content.strip()
            else:
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text[:500]}
                    ],
                    max_tokens=50,
                    temperature=0.1
                )
                detected_language = response.choices[0].message.content.strip()
            
            logger.debug(f"Language detected: {detected_language}")
            return detected_language
            
        except Exception as e:
            logger.warning(f"Language detection failed: {e}, defaulting to 'Unknown'")
            return "Unknown"
