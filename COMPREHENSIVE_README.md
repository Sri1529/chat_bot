# 🎤 VoiceBot - AI-Powered News Assistant

A full-stack voice-enabled chatbot application with Retrieval Augmented Generation (RAG) pipeline, built with React frontend and Node.js/Express backend.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Application Flow](#application-flow)
- [API Endpoints](#api-endpoints)
- [Code Walkthrough](#code-walkthrough)
- [Testing Areas](#testing-areas)
- [Setup Instructions](#setup-instructions)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Express Backend │    │   External APIs │
│                 │    │                 │    │                 │
│  • Chat UI      │◄──►│  • REST API     │◄──►│  • Gemini AI    │
│  • Voice Input  │    │  • Session Mgmt │    │  • Pinecone     │
│  • Text-to-Speech│   │  • RAG Pipeline │    │  • OpenAI       │
│  • Session Storage│   │  • News Ingestion│   │  • Redis        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend (`frontend-new/`)
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Web Speech API** - Voice input
- **Web Audio API** - Audio recording
- **localStorage** - Session persistence

### Backend (`backend-new/`)
- **Node.js 18+** - Runtime
- **Express.js** - Web framework
- **Redis** - Session storage
- **Pinecone** - Vector database
- **Google Gemini** - LLM
- **OpenAI** - Embeddings
- **RSS Parser** - News ingestion
- **Cheerio** - Web scraping

## 📁 Project Structure

```
voicebot-main/
├── frontend-new/                 # React Frontend
│   ├── src/
│   │   ├── App.js               # Main application component
│   │   ├── components/
│   │   │   └── MessageList.js   # Chat message display
│   │   ├── hooks/
│   │   │   ├── useChat.js       # Chat logic & API calls
│   │   │   ├── useAudioRecorder.js # Voice recording
│   │   │   └── useTextToSpeech.js # Text-to-speech
│   │   └── index.js             # App entry point
│   ├── package.json
│   └── Dockerfile
├── backend-new/                  # Node.js Backend
│   ├── src/
│   │   ├── app.js               # Express app setup
│   │   ├── config/
│   │   │   └── index.js         # Configuration
│   │   ├── routes/
│   │   │   ├── chat-rag.js      # RAG-enabled chat
│   │   │   ├── news.js          # News management
│   │   │   └── health.js        # Health check
│   │   ├── services/
│   │   │   ├── index.js         # Service orchestrator
│   │   │   ├── redisService.js  # Redis operations
│   │   │   ├── pineconeService.js # Vector DB
│   │   │   ├── geminiService.js # LLM integration
│   │   │   ├── pineconeEmbeddingsService.js # Embeddings
│   │   │   └── newsService.js   # News ingestion
│   │   └── scripts/
│   │       └── seed-news.js     # Data seeding
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml           # Multi-service setup
└── .env                        # Environment variables
```

## 🔄 Application Flow

### 1. **User Interaction Flow**
```
User Input → Frontend → Backend API → RAG Pipeline → Response → Frontend Display
```

### 2. **RAG Pipeline Flow**
```
User Query → Embedding Generation → Vector Search → Context Retrieval → LLM Generation → Response
```

### 3. **Session Management Flow**
```
New User → Session Creation → Redis Storage → Frontend localStorage → Persistent Chat
```

## 🚀 API Endpoints

### **Base URL**: `http://localhost:3001/api`

### **Chat Endpoints**

#### `POST /chat`
**Purpose**: Send a message and get AI response with RAG
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the latest news about AI?",
    "sessionId": null,
    "stream": false
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-here",
    "message": "AI response text",
    "timestamp": "2025-01-17T10:30:00.000Z",
    "metadata": {
      "hasContext": true,
      "articles": [
        {
          "title": "Article Title",
          "score": 0.85
        }
      ]
    }
  }
}
```

#### `GET /chat/history/:sessionId`
**Purpose**: Retrieve chat history for a session
```bash
curl -X GET http://localhost:3001/api/chat/history/uuid-here
```

#### `DELETE /chat/reset/:sessionId`
**Purpose**: Clear chat history for a session
```bash
curl -X DELETE http://localhost:3001/api/chat/reset/uuid-here
```

### **News Endpoints**

#### `GET /news`
**Purpose**: Get all uploaded news articles
```bash
curl -X GET http://localhost:3001/api/news
```

#### `GET /news/search?query=AI&limit=5`
**Purpose**: Search news articles
```bash
curl -X GET "http://localhost:3001/api/news/search?query=AI&limit=5"
```

#### `POST /news/upload`
**Purpose**: Upload news articles (RSS or manual)
```bash
curl -X POST http://localhost:3001/api/news/upload \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://example.com/rss"],
    "type": "rss"
  }'
```

### **Health Endpoint**

#### `GET /health`
**Purpose**: Check system health
```bash
curl -X GET http://localhost:3001/api/health
```

## 🔍 Code Walkthrough

### **Starting Point: Backend Entry**

#### 1. **`backend-new/src/app.js`** - Main Application
```javascript
// Express app setup
const express = require('express');
const app = express();

// Initialize services
const { initializeServices } = require('./services');

// Routes
app.use('/api/chat', require('./routes/chat-rag'));
app.use('/api/news', require('./routes/news'));
app.use('/api/health', require('./routes/health'));
```

**Key Points**:
- Service initialization happens on startup
- Routes are mounted with `/api` prefix
- Error handling middleware is configured

#### 2. **`backend-new/src/services/index.js`** - Service Orchestrator
```javascript
async function initializeServices() {
  // Initialize Redis
  await redisService.initialize();
  
  // Initialize Pinecone
  await pineconeService.initialize();
  
  // Initialize Gemini
  await geminiService.initialize();
  
  // Initialize Embeddings
  await pineconeEmbeddingsService.initialize();
}
```

**Key Points**:
- All external services are initialized here
- Services are stored in a central object
- Error handling for service failures

#### 3. **`backend-new/src/routes/chat-rag.js`** - RAG Chat Logic
```javascript
router.post('/', async (req, res) => {
  const { message, sessionId } = req.body;
  
  // 1. Generate embedding for user query
  const embedding = await pineconeEmbeddingsService.generateEmbedding(message);
  
  // 2. Search Pinecone for relevant articles
  const searchResults = await pineconeService.query(embedding);
  
  // 3. Generate context from search results
  const context = buildContext(searchResults);
  
  // 4. Generate response using Gemini
  const response = await geminiService.generateResponse(message, context);
  
  // 5. Store in session
  await redisService.addMessageToSession(sessionId, message, response);
});
```

**Key Points**:
- RAG pipeline implementation
- Session management
- Error handling and validation

### **Frontend Entry Point**

#### 1. **`frontend-new/src/App.js`** - Main Component
```javascript
const App = () => {
  const { 
    sendMessage, 
    sendStreamingMessage,
    sessionId,
    chatHistory,
    isLoading 
  } = useChat();
  
  // Chat UI and voice handling
};
```

**Key Points**:
- Uses custom hooks for chat functionality
- Manages voice recording and text-to-speech
- Handles session persistence

#### 2. **`frontend-new/src/hooks/useChat.js`** - Chat Logic
```javascript
const useChat = () => {
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('chatSessionId') || null;
  });
  
  const [chatHistory, setChatHistory] = useState([]);
  
  // Session persistence
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('chatSessionId', sessionId);
    }
  }, [sessionId]);
};
```

**Key Points**:
- Session management with localStorage
- API communication with backend
- Real-time chat history updates

## 🧪 Testing Areas

### **1. Backend API Testing**

#### **Unit Tests**
```bash
cd backend-new
npm test
```

#### **Manual API Testing**
```bash
# Test chat endpoint
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","sessionId":null}'

# Test health endpoint
curl -X GET http://localhost:3001/api/health

# Test news search
curl -X GET "http://localhost:3001/api/news/search?query=AI"
```

### **2. Frontend Testing**

#### **Component Testing**
```bash
cd frontend-new
npm test
```

#### **Integration Testing**
- Test chat flow end-to-end
- Test voice recording functionality
- Test session persistence
- Test error handling

### **3. Service Integration Testing**

#### **Redis Connection**
```bash
# Test Redis connection
redis-cli ping
```

#### **Pinecone Connection**
```bash
# Test Pinecone API
curl -X GET "https://api.pinecone.io/v1/indexes" \
  -H "Api-Key: YOUR_API_KEY"
```

#### **Gemini API**
```bash
# Test Gemini API
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### **4. End-to-End Testing Scenarios**

#### **Scenario 1: New User Chat**
1. Open frontend
2. Send first message
3. Verify session creation
4. Verify response generation
5. Refresh page
6. Verify session persistence

#### **Scenario 2: Voice Chat**
1. Click microphone button
2. Record voice message
3. Verify transcription
4. Verify AI response
5. Verify text-to-speech

#### **Scenario 3: News Search**
1. Ask about specific news topics
2. Verify RAG context retrieval
3. Verify relevant responses
4. Test different query types

## 🚀 Setup Instructions

### **Prerequisites**
- Node.js 18+
- Redis server
- Pinecone account
- Google AI Studio account
- OpenAI account

### **1. Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys
PINECONE_API_KEY=your_pinecone_key
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
REDIS_URL=redis://localhost:6379
```

### **2. Backend Setup**
```bash
cd backend-new
npm install
npm run dev
```

### **3. Frontend Setup**
```bash
cd frontend-new
npm install
npm start
```

### **4. Docker Setup**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### **5. Data Seeding**
```bash
cd backend-new
npm run seed
```

## 🚀 Deployment

### **Backend Deployment (Render/Railway)**
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### **Frontend Deployment (Netlify/Vercel)**
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Deploy automatically

### **Docker Deployment**
```bash
# Build and run
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=3
```

## 🔧 Troubleshooting

### **Common Issues**

#### **1. Backend Not Starting**
- Check Redis connection
- Verify API keys in .env
- Check port 3001 availability

#### **2. Frontend Not Connecting**
- Verify proxy setting in package.json
- Check CORS configuration
- Verify backend is running

#### **3. Pinecone Connection Issues**
- Verify API key and environment
- Check index name and dimensions
- Verify network connectivity

#### **4. Session Not Persisting**
- Check Redis connection
- Verify localStorage in browser
- Check session ID format

### **Debug Commands**
```bash
# Check backend logs
cd backend-new && npm run dev

# Check Redis
redis-cli monitor

# Check Pinecone
curl -X GET "https://api.pinecone.io/v1/indexes" \
  -H "Api-Key: YOUR_API_KEY"
```

## 📊 Performance Monitoring

### **Key Metrics**
- Response time for chat requests
- Pinecone query performance
- Redis session storage efficiency
- Frontend bundle size
- API error rates

### **Monitoring Tools**
- Backend: Morgan logging
- Frontend: React DevTools
- Database: Pinecone metrics
- Cache: Redis monitoring

## 🔒 Security Considerations

### **API Security**
- Rate limiting on endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers

### **Data Privacy**
- Session data encryption
- API key protection
- User data anonymization
- Secure environment variables

## 📈 Future Enhancements

### **Planned Features**
- Multi-language support
- Advanced voice commands
- Real-time news updates
- User authentication
- Analytics dashboard
- Mobile app version

### **Technical Improvements**
- WebSocket for real-time updates
- Caching layer optimization
- Database query optimization
- Frontend performance optimization
- Automated testing pipeline

---

## 🎯 Quick Start Checklist

- [ ] Set up environment variables
- [ ] Start Redis server
- [ ] Run backend: `cd backend-new && npm run dev`
- [ ] Run frontend: `cd frontend-new && npm start`
- [ ] Test API: `curl -X GET http://localhost:3001/api/health`
- [ ] Open browser: `http://localhost:3000`
- [ ] Send test message
- [ ] Verify session persistence
- [ ] Test voice functionality

**Your VoiceBot is ready to use! 🚀**
