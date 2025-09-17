# Voice-Enabled Chatbot API Flow Documentation

## 🎯 Overview
This document explains the complete API flow of the voice-enabled chatbot system, from user voice input to AI response generation, including vector search and LLM integration.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Vector Store  │    │   LLM Service   │
│   (React)       │    │   (FastAPI)     │    │   (AWS S3)      │    │   (OpenAI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Complete API Flow

### 1. **User Voice Input** 🎤
```
User speaks → Web Speech API → Text Transcription
```

**Frontend Process:**
- User clicks microphone button
- `useVoiceToText` hook activates Web Speech API
- Browser captures audio and converts to text
- Text is stored in `transcript` state

**Code Location:** `frontend/src/hooks/useVoiceToText.ts`
```typescript
const startRecording = useCallback(() => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setTranscript(transcript);
  };
  recognition.start();
}, []);
```

### 2. **WebSocket Communication** 🔌
```
Frontend → WebSocket → Backend
```

**Frontend Process:**
- `useWebSocket` hook sends transcribed text via WebSocket
- Message format: `{ message: string, organisation_id: number, project_id: number, is_voice: boolean }`

**Code Location:** `frontend/src/hooks/useWebSocket.ts`
```typescript
const sendMessage = useCallback((message: string, isVoice: boolean = false) => {
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify({
      message,
      organisation_id: 1,
      project_id: 1,
      is_voice: isVoice
    }));
  }
}, []);
```

### 3. **Backend WebSocket Handler** 🖥️
```
WebSocket → FastAPI → Message Processing
```

**Backend Process:**
- WebSocket endpoint receives message at `/ws`
- Message is logged and processed
- Text is sent to chat endpoint for further processing

**Code Location:** `backend/app/main.py`
```python
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connected. Total connections: 1")
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            logger.info(f"Received message: {message_data}")
            
            # Process message and send response back
            response = await process_message(message_data)
            await websocket.send_text(json.dumps(response))
```

### 4. **Vector Store Query** 🔍
```
Text → Embeddings → Vector Search → Relevant Chunks
```

**Backend Process:**
- `VectorStoreService` generates embeddings using Amazon Titan
- Queries AWS S3 Vector Store for similar vectors
- Filters by organisation_id and project_id
- Returns top 5 most relevant chunks

**Code Location:** `backend/app/services/vector_store_service.py`
```python
def query_vectors(self, query_vector: List[float], organisation_id: int, project_id: int, limit: int = 5):
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
    return response
```

### 5. **LLM Response Generation** 🤖
```
Query + Context → OpenAI GPT-3.5 → AI Response
```

**Backend Process:**
- `LLMService` combines user query with relevant chunks
- Sends to OpenAI GPT-3.5-turbo for response generation
- Returns contextual AI response

**Code Location:** `backend/app/services/llm_service.py`
```python
def process_query_with_context(self, query: str, relevant_chunks: List[str]) -> str:
    context = "\n\n".join(relevant_chunks)
    
    response = self.client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": f"You are a helpful assistant. Use ONLY the following context to answer the user's question. If the context doesn't contain relevant information to answer the question, respond with exactly 'no context found'.\n\nContext:\n{context}"
            },
            {"role": "user", "content": query}
        ],
        max_tokens=500,
        temperature=0.7
    )
    return response.choices[0].message.content
```

### 6. **Response Back to Frontend** 📤
```
AI Response → WebSocket → Frontend → Text-to-Speech
```

**Frontend Process:**
- Receives AI response via WebSocket
- Displays response in chat interface
- `useTextToSpeech` hook converts text to speech
- User hears the AI response

**Code Location:** `frontend/src/hooks/useTextToSpeech.ts`
```typescript
const speak = useCallback((text: string) => {
  if (isSpeaking) {
    speechSynthesis.cancel();
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onend = () => setIsSpeaking(false);
  utterance.onerror = () => setIsSpeaking(false);
  
  speechSynthesis.speak(utterance);
  setIsSpeaking(true);
}, [isSpeaking]);
```

## 📊 Data Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   USER VOICE    │    │   FRONTEND      │    │   BACKEND       │    │   AWS SERVICES  │
│   INPUT         │    │   (React)       │    │   (FastAPI)     │    │   (S3 + OpenAI) │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │                        │
         │ 1. User speaks         │                        │                        │
         ├───────────────────────►│                        │                        │
         │                        │                        │                        │
         │                        │ 2. Web Speech API      │                        │
         │                        │    converts to text    │                        │
         │                        │                        │                        │
         │                        │ 3. WebSocket send      │                        │
         │                        ├───────────────────────►│                        │
         │                        │                        │                        │
         │                        │                        │ 4. Generate embeddings │
         │                        │                        ├───────────────────────►│
         │                        │                        │                        │
         │                        │                        │ 5. Query vector store │
         │                        │                        ├───────────────────────►│
         │                        │                        │                        │
         │                        │                        │ 6. Get relevant chunks│
         │                        │                        │◄───────────────────────┤
         │                        │                        │                        │
         │                        │                        │ 7. Send to LLM         │
         │                        │                        ├───────────────────────►│
         │                        │                        │                        │
         │                        │                        │ 8. Get AI response     │
         │                        │                        │◄───────────────────────┤
         │                        │                        │                        │
         │                        │ 9. WebSocket response  │                        │
         │                        │◄───────────────────────┤                        │
         │                        │                        │                        │
         │                        │ 10. Display response   │                        │
         │                        │                        │                        │
         │                        │ 11. Text-to-Speech     │                        │
         │                        │    converts to voice   │                        │
         │                        │                        │                        │
         │ 12. User hears response│                        │                        │
         │◄───────────────────────┤                        │                        │
```

## 🔄 Step-by-Step Flow

1. **User Voice Input** → Web Speech API converts speech to text
2. **Text Transcription** → Frontend captures transcribed text
3. **WebSocket Send** → Text sent to backend via WebSocket
4. **Generate Embeddings** → Backend creates vector embeddings using Amazon Titan
5. **Query Vector Store** → Search AWS S3 Vector Store for similar content
6. **Get Relevant Chunks** → Retrieve top 5 most relevant text chunks
7. **Send to LLM** → Send query + context to OpenAI GPT-3.5
8. **Get AI Response** → Receive contextual AI response
9. **WebSocket Response** → Send response back to frontend
10. **Display Response** → Show response in chat interface
11. **Text-to-Speech** → Convert response to speech
12. **Voice Output** → User hears the AI response

## 🔧 API Endpoints

### WebSocket Endpoints
- **`/ws`** - Main WebSocket connection for real-time chat

### HTTP Endpoints
- **`/api/v1/health/`** - Health check endpoint
- **`/api/v1/chat/message`** - HTTP chat message endpoint (POST)

## 🗂️ File Structure

```
chatbot/
├── frontend/
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useVoiceToText.ts      # Voice-to-text functionality
│   │   │   ├── useTextToSpeech.ts     # Text-to-speech functionality
│   │   │   └── useWebSocket.ts        # WebSocket communication
│   │   ├── components/
│   │   │   ├── MessageList.tsx        # Chat message display
│   │   │   └── VoiceRecorder.tsx      # Microphone button
│   │   └── App.tsx                    # Main application component
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   ├── vector_store_service.py # AWS S3 Vector Store integration
│   │   │   ├── llm_service.py         # OpenAI LLM integration
│   │   │   └── voice_service.py       # Voice processing service
│   │   ├── api/v1/endpoints/
│   │   │   ├── chat.py                # Chat endpoints
│   │   │   └── health.py              # Health check endpoint
│   │   └── main.py                    # FastAPI application
└── docker-compose.yml                 # Docker orchestration
```

## 🔑 Environment Variables

### Backend (.env)
```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_VECTOR_STORE_BUCKET=your_bucket_name
DOC_INDEX_NAME=vault-ai-index

# OpenAI Configuration
OPENAI_API_KEY=your_openai_key

# Vector Store Configuration
EMBEDDING_MODEL_ID=amazon.titan-embed-text-v2:0
VECTOR_DIMENSION=512
```

## 🚀 How to Use

1. **Start Backend:**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --host 0.0.0.0 --port 5001 --reload
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   PORT=5000 npm start
   ```

3. **Access Application:**
   - Frontend: http://localhost:5000
   - Backend: http://localhost:5001

## 🔍 Key Features

- **Voice Input**: Real-time speech-to-text conversion
- **Vector Search**: Semantic search through your data
- **AI Responses**: Context-aware responses using OpenAI
- **Voice Output**: Text-to-speech for responses
- **Real-time**: WebSocket-based communication
- **Multi-tenant**: Organisation and project-based filtering

## 🛠️ Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, Web Speech API
- **Backend**: Python, FastAPI, WebSockets
- **Vector Store**: AWS S3 Vector Store, Amazon Titan Embeddings
- **LLM**: OpenAI GPT-3.5-turbo
- **Deployment**: Docker, Docker Compose

## 📝 Message Format

### WebSocket Message (Frontend → Backend)
```json
{
  "message": "Hello, how are you?",
  "organisation_id": 1,
  "project_id": 1,
  "is_voice": true
}
```

### WebSocket Response (Backend → Frontend)
```json
{
  "response": "I'm doing well, thank you for asking!",
  "is_voice": true,
  "timestamp": 1694356789.123
}
```

This documentation provides a complete understanding of how the voice-enabled chatbot processes user input through the entire system pipeline.
