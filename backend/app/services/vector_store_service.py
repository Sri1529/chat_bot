import boto3
import json
import uuid
from typing import List, Dict, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class VectorStoreService:
    """Service for managing vector store operations with AWS S3Vectors"""
    
    def __init__(self):
        """Initialize the VectorStoreService with AWS clients"""
        self.bedrock = boto3.client(
            "bedrock-runtime",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        
        self.s3vectors = boto3.client(
            "s3vectors",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        
        logger.info(f"VectorStoreService initialized for region: {settings.AWS_REGION}")
    
    def ensure_index_ready(self) -> bool:
        """Ensure the vector index is ready for use"""
        logger.info(f"Assuming index {settings.DOC_INDEX_NAME} exists and is ready in bucket {settings.AWS_S3_VECTOR_STORE_BUCKET}")
        return True
    
    def chunk_text(self, text: str, chunk_size: int = 1000) -> List[str]:
        """Split text into chunks of specified size"""
        words = text.split()
        chunks = []
        current_chunk = []
        current_size = 0
        
        for word in words:
            if current_size + len(word) + 1 > chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = [word]
                current_size = len(word)
            else:
                current_chunk.append(word)
                current_size += len(word) + 1
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate vector embeddings using Amazon Titan"""
        embeddings = []
        logger.info(f"Generating embeddings for {len(texts)} text chunks using {settings.EMBEDDING_MODEL_ID}")
        
        for i, text in enumerate(texts):
            try:
                body = json.dumps({"inputText": text})
                logger.debug(f"Requesting embedding for chunk {i+1}/{len(texts)} (length: {len(text)} chars)")
                
                response = self.bedrock.invoke_model(
                    modelId=settings.EMBEDDING_MODEL_ID,
                    body=body
                )
                response_body = json.loads(response["body"].read())
                
                if "embedding" not in response_body:
                    logger.error(f"Unexpected response format from Bedrock: {response_body}")
                    raise ValueError("No embedding in response")
                
                embedding = response_body["embedding"]
                
                # Truncate embedding to match the required vector dimension
                if len(embedding) > settings.VECTOR_DIMENSION:
                    logger.info(f"Truncating embedding from {len(embedding)} to {settings.VECTOR_DIMENSION} dimensions")
                    embedding = embedding[:settings.VECTOR_DIMENSION]
                elif len(embedding) < settings.VECTOR_DIMENSION:
                    logger.warning(f"Embedding dimension {len(embedding)} is smaller than required {settings.VECTOR_DIMENSION}")
                    # Pad with zeros if needed
                    embedding = embedding + [0.0] * (settings.VECTOR_DIMENSION - len(embedding))
                
                embeddings.append(embedding)
                logger.debug(f"Generated embedding {i+1}/{len(texts)} with dimension {len(embedding)}")
                
            except Exception as e:
                logger.error(f"Failed to generate embedding for chunk {i+1}: {e}")
                logger.error(f"Text preview: {text[:100]}...")
                raise
        
        logger.info(f"Successfully generated {len(embeddings)} embeddings with {settings.VECTOR_DIMENSION} dimensions")
        return embeddings
    
    def store_vectors(self, vectors: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Store vectors in S3 Vector Store"""
        try:
            logger.info(f"Storing {len(vectors)} vectors in bucket: {settings.AWS_S3_VECTOR_STORE_BUCKET}, index: {settings.DOC_INDEX_NAME}")
            
            response = self.s3vectors.put_vectors(
                vectorBucketName=settings.AWS_S3_VECTOR_STORE_BUCKET,
                indexName=settings.DOC_INDEX_NAME,
                vectors=vectors
            )
            
            logger.info(f"Vectors stored successfully. Response: {response}")
            return response
            
        except Exception as e:
            logger.error(f"Failed to store vectors: {e}")
            logger.error(f"Store error type: {type(e)}")
            raise
    
    def query_vectors(self, query_vector: List[float], organisation_id: int, project_id: int, limit: int = 5) -> Dict[str, Any]:
        """Query vectors for similarity search"""
        try:
            logger.info(f"Querying vectors with filter: org_id={organisation_id}, project_id={project_id}")
            
            response = self.s3vectors.query_vectors(
                vectorBucketName=settings.AWS_S3_VECTOR_STORE_BUCKET,
                indexName=settings.DOC_INDEX_NAME,
                queryVector={"float32": query_vector},
                returnMetadata=True,
                filter={"$and": [
                    {"organisation_id": {"$eq": organisation_id}},
                    {"project_id": {"$eq": project_id}}
                ]},
                topK=limit
            )
            
            logger.info(f"Vector query successful. Retrieved {len(response.get('vectors', []))} vectors")
            return response
            
        except Exception as e:
            logger.error(f"Failed to query vectors: {e}")
            raise
    
    def create_faq_vectors(self, title: str, description: str, content: str, organisation_id: int, project_id: int) -> Dict[str, Any]:
        """Create and store vectors for FAQ content"""
        try:
            # Create FAQ text content
            faq_content = f"Title: {title}\nDescription: {description}\nContent: {content}"
            logger.info(f"FAQ content created: {len(faq_content)} characters")
            
            # Create text chunks
            chunks = self.chunk_text(faq_content)
            if not chunks:
                raise ValueError("Failed to create text chunks")
            
            # Generate embeddings
            embeddings = self.get_embeddings(chunks)
            
            # Create unique key and prepare vectors
            unique_key = str(uuid.uuid4())
            logger.info(f"Generated unique key: {unique_key}")
            
            vectors_to_put = [
                {
                    "key": f"{unique_key}_{i}",
                    "data": {"float32": embedding},
                    "metadata": {
                        "organisation_id": organisation_id,
                        "project_id": project_id,
                        "chunk_id": i,
                        "unique_key": unique_key,
                        "chunk_text": chunk,
                        "title": title,
                        "description": description,
                        "content": content,
                        "content_type": "faq"
                    }
                }
                for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
            ]
            
            # Store vectors
            self.store_vectors(vectors_to_put)
            
            return {
                "unique_key": unique_key,
                "chunk_count": len(chunks),
                "chunks": chunks
            }
            
        except Exception as e:
            logger.error(f"Failed to create FAQ vectors: {e}")
            raise

    def create_product_vectors(self, title: str, price: float, description: str, category: str, image: str, rating: Any, organisation_id: int, project_id: int) -> Dict[str, Any]:
        """Create and store vectors for product content"""
        try:
            # Extract rating values - handle both dict and Pydantic model
            if hasattr(rating, 'rate') and hasattr(rating, 'count'):
                # Pydantic model
                rating_rate = rating.rate
                rating_count = rating.count
            elif isinstance(rating, dict):
                # Dictionary
                rating_rate = rating.get('rate', 0)
                rating_count = rating.get('count', 0)
            else:
                # Fallback
                rating_rate = 0
                rating_count = 0
            
            # Create product text content with all available information
            product_content = f"Title: {title}\nPrice: ${price}\nDescription: {description}\nCategory: {category}\nRating: {rating_rate}/5.0 ({rating_count} reviews)\nImage: {image}"
            logger.info(f"Product content created: {len(product_content)} characters")
            
            # Create text chunks
            chunks = self.chunk_text(product_content)
            if not chunks:
                raise ValueError("Failed to create text chunks")
            
            # Generate embeddings
            embeddings = self.get_embeddings(chunks)
            
            # Create unique key and prepare vectors
            unique_key = str(uuid.uuid4())
            logger.info(f"Generated unique key: {unique_key}")
            
            vectors_to_put = [
                {
                    "key": f"{unique_key}_{i}",
                    "data": {"float32": embedding},
                    "metadata": {
                        "organisation_id": organisation_id,
                        "project_id": project_id,
                        "chunk_id": i,
                        "unique_key": unique_key,
                        "chunk_text": chunk,
                        "title": title,
                        "price": str(price),
                        "category": category,
                        "rating": f"{rating_rate}/{rating_count}",
                        "content_type": "product"
                    }
                }
                for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
            ]
            
            # Store vectors
            self.store_vectors(vectors_to_put)
            
            return {
                "unique_key": unique_key,
                "chunk_count": len(chunks),
                "chunks": chunks
            }
            
        except Exception as e:
            logger.error(f"Failed to create product vectors: {e}")
            raise
