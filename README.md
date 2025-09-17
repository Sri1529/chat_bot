# VoiceBot - AI-Powered Voice Chatbot with RAG Pipeline

A modern, full-stack voice chatbot application with Retrieval-Augmented Generation (RAG) pipeline, built with Node.js, React, Pinecone, and Gemini AI.

## 🚀 Project Overview

This project migrates and rebuilds a voice bot application from Python Flask to a modern Node.js + Express backend with the following key improvements:

- **Backend**: Node.js + Express with REST API
- **Frontend**: React with streaming responses
- **Vector Database**: Pinecone (replacing AWS S3)
- **LLM**: Google Gemini AI (replacing OpenAI)
- **Session Storage**: Redis for chat history
- **RAG Pipeline**: News article ingestion with Jina embeddings
- **Deployment**: Docker + cloud platforms

## 📋 Features

### Backend Features
- ✅ REST API with session-based chat management
- ✅ Pinecone vector database integration
- ✅ Gemini AI for natural language processing
- ✅ Redis for session storage and chat history
- ✅ Jina embeddings for text vectorization
- ✅ News article ingestion from RSS feeds
- ✅ Streaming responses for real-time chat
- ✅ Health checks and monitoring
- ✅ Docker support

### Frontend Features
- ✅ Modern React interface with Tailwind CSS
- ✅ Real-time streaming responses
- ✅ Voice recording capabilities
- ✅ Text-to-speech for bot responses
- ✅ Session management with chat history
- ✅ Responsive design
- ✅ Error handling and loading states

### RAG Pipeline
- ✅ Ingests ~50 news articles from RSS feeds
- ✅ Generates embeddings using Jina AI
- ✅ Stores vectors in Pinecone
- ✅ Retrieves relevant context for user queries
- ✅ Passes context + query to Gemini for final answer

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Node.js Backend│    │   Pinecone DB   │
│                 │    │                 │    │                 │
│  - Chat UI      │◄──►│  - Express API  │◄──►│  - Vector Store │
│  - Voice Rec    │    │  - Redis Cache  │    │  - Similarity   │
│  - TTS          │    │  - RAG Pipeline │    │    Search       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   External APIs │
                       │                 │
                       │  - Gemini AI    │
                       │  - Jina Embed   │
                       │  - RSS Feeds    │
                       └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Redis (sessions)
- **Vector DB**: Pinecone
- **AI/LLM**: Google Gemini
- **Embeddings**: Jina AI
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate limiting

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Audio**: Web Audio API
- **Build**: Create React App

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Deployment**: Render, Railway, Netlify, Vercel
- **Monitoring**: Health checks, logging

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- Docker (optional)
- API Keys:
  - Pinecone API key
  - Google Gemini API key
  - Jina AI API key

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voicebot-main
   ```

2. **Set up environment variables**
   ```bash
   cp env.docker .env
   # Edit .env with your API keys
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/api/health

### Option 2: Local Development

1. **Start Redis**
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Set up Backend**
   ```bash
   cd backend-new
   cp env.example .env
   # Edit .env with your API keys
   npm install
   npm run seed  # Optional: seed news articles
   npm run dev
   ```

3. **Set up Frontend**
   ```bash
   cd frontend-new
   echo "REACT_APP_API_URL=http://localhost:3000/api" > .env
   npm install
   npm start
   ```

## 🔧 Configuration

### Required API Keys

1. **Pinecone** (Vector Database)
   - Sign up at [pinecone.io](https://pinecone.io)
   - Create an index with 768 dimensions
   - Get your API key

2. **Google Gemini** (LLM)
   - Sign up at [Google AI Studio](https://aistudio.google.com)
   - Get your API key
   - Free tier available

3. **Jina AI** (Embeddings)
   - Sign up at [jina.ai](https://jina.ai)
   - Get your API key
   - Free tier available

### Environment Variables

Create `.env` files in both `backend-new/` and `frontend-new/` directories:

**Backend (.env)**
```env
PINECONE_API_KEY=your_pinecone_api_key
GEMINI_API_KEY=your_gemini_api_key
JINA_API_KEY=your_jina_api_key
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:3000/api
```

## 📊 API Endpoints

### Chat Endpoints
- `POST /api/chat` - Send a new chat message
- `GET /api/chat/history/:sessionId` - Get chat history
- `DELETE /api/chat/reset/:sessionId` - Clear chat history
- `POST /api/chat/stream` - Streaming chat responses

### Health Endpoints
- `GET /api/health` - Comprehensive health check
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

## 🚀 Deployment

### Render.com (Backend)

1. Connect your repository to Render
2. Create a new Web Service
3. Set environment variables
4. Deploy using `render.yaml`

### Netlify/Vercel (Frontend)

1. Connect your repository
2. Set build settings
3. Set environment variables
4. Deploy automatically

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individual services
docker build -t voicebot-backend ./backend-new
docker build -t voicebot-frontend ./frontend-new
```

## 🧪 Testing

### Backend Testing
```bash
cd backend-new
npm test
```

### Frontend Testing
```bash
cd frontend-new
npm test
```

### Integration Testing
```bash
# Test the full stack
docker-compose up -d
# Run your integration tests
```

## 📈 Monitoring

### Health Checks
- Backend: `GET /api/health`
- Frontend: Built-in error boundaries
- Docker: Health check containers

### Logging
- Backend: Structured logging with timestamps
- Frontend: Console logging for development
- Docker: Container logs

## 🔄 Migration Notes

### From Python Flask to Node.js Express

**What Changed:**
- ✅ Backend framework: Flask → Express.js
- ✅ Vector DB: AWS S3 → Pinecone
- ✅ LLM: OpenAI → Gemini AI
- ✅ Session storage: In-memory → Redis
- ✅ Embeddings: AWS Bedrock → Jina AI
- ✅ Frontend: Updated React components
- ✅ API: RESTful endpoints with session management

**What Improved:**
- 🚀 Better performance with async/await
- 🔄 Real-time streaming responses
- 💾 Persistent session storage
- 📰 Automated news ingestion
- 🐳 Docker containerization
- ☁️ Cloud deployment ready
- 🔍 Better monitoring and health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed description
3. Include logs and environment details

## 📚 Documentation

- [Backend README](./backend-new/README.md) - Detailed backend documentation
- [Frontend README](./frontend-new/README.md) - Detailed frontend documentation
- [API Documentation](./backend-new/README.md#api-endpoints) - API reference
- [Deployment Guide](./backend-new/README.md#deployment) - Deployment instructions

## 🎯 Roadmap

- [ ] Voice transcription integration
- [ ] Multi-language support
- [ ] Advanced RAG with document uploads
- [ ] User authentication
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] WebSocket real-time updates
- [ ] Advanced caching strategies

---

**Built with ❤️ using modern web technologies**