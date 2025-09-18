# VoiceBot - AI-Powered Chatbot with RAG Pipeline

A complete AI chatbot application built with React frontend and Node.js backend, featuring Retrieval Augmented Generation (RAG) using Pinecone vector database, Google Gemini AI, and Redis for session management.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Node.js Backend │    │   External APIs │
│                 │    │                 │    │                 │
│ • Chat Interface │◄──►│ • Express Server │◄──►│ • Google Gemini │
│ • Session Mgmt   │    │ • RAG Pipeline  │    │ • OpenAI API    │
│ • Sample Q's     │    │ • Redis Cache   │    │ • Pinecone DB   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- API Keys: Pinecone, Google Gemini, OpenAI

### 1. Clone and Setup
```bash
git clone <your-repo>
cd voicebot-main
```

### 2. Environment Configuration
Create `.env` file in project root:
```bash
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=voicebot-index
PINECONE_DIMENSION=1024

# Google Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7

# OpenAI Configuration (for embeddings)
OPENAI_API_KEY=your_openai_api_key

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# RAG Configuration
RAG_TOP_K=5
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200

# Session Configuration
SESSION_TTL=3600
SESSION_MAX_MESSAGES=100

# News Configuration
NEWS_MAX_ARTICLES=50
NEWS_UPDATE_INTERVAL=3600000
```

### 3. Run with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Or use the convenience script
chmod +x run-voicebot.sh
./run-voicebot.sh
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## 📋 Project Flow - Step by Step

### Phase 1: Application Startup

#### 1.1 Backend Initialization
```javascript
// backend-new/src/app.js
const express = require('express');
const { initializeServices } = require('./services');

async function startServer() {
  // Initialize all services
  await initializeServices();
  
  // Start Express server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
```

**What happens:**
1. **Service Initialization**: All services (Redis, Pinecone, Gemini, OpenAI) are initialized
2. **Database Connection**: Pinecone vector database connection established
3. **AI Service Setup**: Gemini and OpenAI clients configured
4. **Redis Connection**: Session storage system initialized (with fallback)
5. **Express Server**: REST API endpoints registered and server started

#### 1.2 Frontend Initialization
```javascript
// frontend-new/src/App.js
function App() {
  const { 
    chatHistory, 
    sendMessage, 
    clearChatHistory,
    sessionId 
  } = useChat();

  // Load existing session from localStorage
  useEffect(() => {
    loadChatHistory();
  }, []);
}
```

**What happens:**
1. **React App Mounts**: Main application component renders
2. **Chat Hook Initialization**: Custom hook sets up chat functionality
3. **Session Recovery**: Existing session loaded from localStorage
4. **UI Rendering**: Chat interface, sample questions, and controls displayed

### Phase 2: Data Ingestion (RAG Pipeline)

#### 2.1 News Article Ingestion
```bash
# Trigger news ingestion
curl -X POST http://localhost:3001/api/news/ingest
```

**Step-by-step process:**
1. **RSS Feed Parsing**: System fetches news from configured RSS feeds
2. **Content Extraction**: Uses Cheerio to extract article text
3. **Text Chunking**: Articles split into manageable chunks (1000 chars with 200 overlap)
4. **Embedding Generation**: OpenAI API creates vector embeddings for each chunk
5. **Vector Storage**: Embeddings stored in Pinecone with metadata

```javascript
// Example embedding process
const chunks = chunkText(articleContent, 1000, 200);
for (const chunk of chunks) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: chunk.text
  });
  
  await pinecone.upsert([{
    id: generateId(),
    values: embedding.data[0].embedding,
    metadata: {
      text: chunk.text,
      source: article.url,
      title: article.title,
      publishedAt: article.publishedAt
    }
  }]);
}
```

### Phase 3: Chat Interaction Flow

#### 3.1 User Sends Message
```javascript
// Frontend: User types message and clicks send
const handleSendMessage = async (message) => {
  setLoading(true);
  try {
    await sendMessage(message);
  } finally {
    setLoading(false);
  }
};
```

#### 3.2 Backend Processing
```javascript
// backend-new/src/routes/chat-rag.js
router.post('/', async (req, res) => {
  const { message, sessionId } = req.body;
  
  // 1. Store user message in session
  if (services.redis) {
    await services.redis.addMessageToSession(sessionId, userMessage);
  }
  
  // 2. Generate embedding for user query
  const queryEmbedding = await services.pineconeEmbeddings.generateEmbedding(message);
  
  // 3. Search Pinecone for relevant chunks
  const searchResults = await services.pinecone.query({
    vector: queryEmbedding,
    topK: 5,
    includeMetadata: true
  });
  
  // 4. Build context from retrieved chunks
  const context = searchResults.matches.map(match => match.metadata.text).join('\n\n');
  
  // 5. Generate response using Gemini
  const response = await services.gemini.generateResponse(message, context, chatHistory);
  
  // 6. Store AI response in session
  if (services.redis) {
    await services.redis.addMessageToSession(sessionId, aiMessage);
  }
  
  res.json({ response, sessionId });
});
```

#### 3.3 RAG Pipeline Detailed Flow

**Step 1: Query Embedding**
```javascript
// Convert user query to vector
const queryEmbedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: userQuery
});
```

**Step 2: Vector Search**
```javascript
// Search Pinecone for similar content
const searchResults = await pinecone.query({
  vector: queryEmbedding.data[0].embedding,
  topK: 5,
  includeMetadata: true,
  filter: { /* optional filters */ }
});
```

**Step 3: Context Building**
```javascript
// Combine retrieved chunks into context
const context = searchResults.matches
  .map(match => `Source: ${match.metadata.title}\n${match.metadata.text}`)
  .join('\n\n---\n\n');
```

**Step 4: LLM Generation**
```javascript
// Generate response using Gemini with context
const prompt = `
Context from knowledge base:
${context}

User Question: ${userQuery}

Previous conversation:
${chatHistory}

Please provide a helpful response based on the context above.
`;

const response = await gemini.generateContent(prompt);
```

### Phase 4: Session Management

#### 4.1 Redis Session Storage
```javascript
// backend-new/src/services/redisService.js
async function addMessageToSession(sessionId, message) {
  const key = `session:${sessionId}`;
  await client.lPush(key, JSON.stringify(message));
  await client.expire(key, SESSION_TTL); // 1 hour TTL
}
```

**Session Structure:**
```json
{
  "sessionId": "uuid-here",
  "messages": [
    {
      "role": "user",
      "content": "What is AI?",
      "timestamp": "2024-01-01T10:00:00Z"
    },
    {
      "role": "assistant", 
      "content": "AI is...",
      "timestamp": "2024-01-01T10:00:01Z"
    }
  ],
  "ttl": 3600
}
```

#### 4.2 Frontend Session Persistence
```javascript
// frontend-new/src/hooks/useChat.js
const [sessionId, setSessionId] = useState(() => {
  return localStorage.getItem('chatSessionId') || generateSessionId();
});

// Persist session ID
useEffect(() => {
  localStorage.setItem('chatSessionId', sessionId);
}, [sessionId]);
```

### Phase 5: API Endpoints

#### 5.1 Chat Endpoints
```bash
# Send message
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is artificial intelligence?", "sessionId": "your-session-id"}'

# Get chat history
curl http://localhost:3001/api/chat/history/your-session-id

# Clear chat history
curl -X DELETE http://localhost:3001/api/chat/reset/your-session-id
```

#### 5.2 News Management Endpoints
```bash
# Ingest news articles
curl -X POST http://localhost:3001/api/news/ingest

# Get ingestion status
curl http://localhost:3001/api/news/status

# Get available news sources
curl http://localhost:3001/api/news/sources
```

#### 5.3 Health Check
```bash
# Check system health
curl http://localhost:3001/api/health
```

## 🔧 Configuration Details

### API Keys Usage

#### Pinecone API Key
- **Purpose**: Vector database operations
- **Usage**: Storing and querying document embeddings
- **Configuration**: Set in `PINECONE_API_KEY` environment variable

#### Google Gemini API Key
- **Purpose**: Large Language Model for generating responses
- **Usage**: Processing user queries with context from RAG
- **Configuration**: Set in `GEMINI_API_KEY` environment variable

#### OpenAI API Key
- **Purpose**: Generating embeddings for text chunks
- **Usage**: Converting text to vectors for Pinecone storage
- **Configuration**: Set in `OPENAI_API_KEY` environment variable

### Embedding Process

#### Text Chunking Strategy
```javascript
function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    
    chunks.push({
      text: chunk,
      start,
      end
    });
    
    start = end - overlap; // Overlap for context continuity
  }
  
  return chunks;
}
```

#### Vector Dimensions
- **Model**: `text-embedding-3-small`
- **Dimensions**: 1024
- **Pinecone Index**: Configured for 1024 dimensions

### Redis Usage

#### Session Storage
```javascript
// Session key format
session:${sessionId}

// Message structure
{
  "role": "user|assistant",
  "content": "message text",
  "timestamp": "ISO date string"
}
```

#### TTL Management
- **Default TTL**: 3600 seconds (1 hour)
- **Max Messages**: 100 per session
- **Auto-cleanup**: Redis automatically removes expired sessions

## 🐳 Docker Deployment

### Single Container (Backend + Redis)
```bash
# Build image with Redis included
docker build -f backend-new/Dockerfile.with-redis -t voicebot-backend-redis .

# Run container
docker run -p 3001:3001 \
  -e PINECONE_API_KEY=your_key \
  -e GEMINI_API_KEY=your_key \
  -e OPENAI_API_KEY=your_key \
  voicebot-backend-redis
```

### Multi-Container Setup
```bash
# Use Docker Compose
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.production.yml up -d
```

### Docker Compose Services
```yaml
services:
  redis:
    image: redis:7-alpine
    
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend-new
    ports:
      - "3001:3001"
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
  
  frontend:
    build: ./frontend-new
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

## 🚀 Production Deployment

### Render.com Deployment
```yaml
# render.yaml
services:
  - type: web
    name: voicebot-backend
    env: node
    plan: starter
    nodeVersion: 20
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: PINECONE_API_KEY
        sync: false
      - key: GEMINI_API_KEY
        sync: false
      - key: OPENAI_API_KEY
        sync: false

databases:
  - name: voicebot-redis
    plan: starter
```

### Environment Variables for Production
```bash
NODE_ENV=production
PORT=10000
REDIS_URL=redis://redis-connection-string
PINECONE_API_KEY=your_production_key
GEMINI_API_KEY=your_production_key
OPENAI_API_KEY=your_production_key
```

## 📊 Sample Questions

The application includes a comprehensive set of sample questions organized by category:

### AI & Technology
- "What are the latest developments in artificial intelligence?"
- "Tell me about recent AI breakthroughs in healthcare"
- "How is machine learning being used in finance?"

### Healthcare AI
- "How is AI being used in medical diagnosis?"
- "What are the latest AI applications in healthcare?"
- "Tell me about AI-powered drug discovery"

### Research & Development
- "What's new in natural language processing?"
- "Explain the latest robotics innovations"
- "How is AI transforming different industries?"

## 🔍 Troubleshooting

### Common Issues

#### 1. Pinecone Connection Errors
```bash
# Check Pinecone configuration
curl http://localhost:3001/api/health

# Verify API key and environment
echo $PINECONE_API_KEY
echo $PINECONE_ENVIRONMENT
```

#### 2. Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping

# Check Redis logs
docker logs voicebot-redis
```

#### 3. Frontend-Backend Communication
```bash
# Verify backend is running
curl http://localhost:3001/api/health

# Check frontend proxy configuration
# frontend-new/package.json should have:
"proxy": "http://localhost:3001"
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check service initialization
curl http://localhost:3001/api/health
```

## 📁 Project Structure

```
voicebot-main/
├── backend-new/                 # Node.js backend
│   ├── src/
│   │   ├── app.js              # Main application entry
│   │   ├── config/             # Configuration management
│   │   ├── services/           # Service layer (Redis, Pinecone, Gemini)
│   │   ├── routes/             # API routes
│   │   └── scripts/            # Utility scripts
│   ├── Dockerfile              # Backend container
│   ├── Dockerfile.with-redis   # Backend + Redis container
│   └── package.json
├── frontend-new/               # React frontend
│   ├── src/
│   │   ├── App.js             # Main React component
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom React hooks
│   │   └── styles/            # CSS styles
│   ├── Dockerfile             # Frontend container
│   └── package.json
├── docker-compose.yml          # Development setup
├── docker-compose.production.yml # Production setup
├── render.yaml                 # Render.com deployment
└── README.md                   # This file
```

## 🎯 Key Features

- **RAG Pipeline**: Retrieval Augmented Generation for context-aware responses
- **Vector Search**: Pinecone-powered semantic search
- **Session Management**: Redis-based chat history persistence
- **Multi-AI Integration**: Gemini for responses, OpenAI for embeddings
- **Docker Support**: Complete containerization with Docker Compose
- **Production Ready**: Deployment configurations for major platforms
- **Sample Questions**: Built-in question suggestions for users
- **Health Monitoring**: Comprehensive health check endpoints

## 🔄 Data Flow Summary

1. **Startup**: Services initialize → Database connections established
2. **Ingestion**: News articles → Text chunking → Embedding generation → Vector storage
3. **Query**: User message → Query embedding → Vector search → Context retrieval
4. **Generation**: Context + query → Gemini processing → Response generation
5. **Storage**: User message + AI response → Redis session storage
6. **Display**: Response → Frontend rendering → User interaction

This architecture ensures scalable, context-aware AI responses with persistent session management and efficient vector-based information retrieval.
