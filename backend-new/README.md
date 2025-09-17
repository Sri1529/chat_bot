# VoiceBot Backend - Node.js Express API

A modern Node.js Express backend for an AI-powered voice chatbot with RAG (Retrieval-Augmented Generation) pipeline, built with Pinecone vector database, Gemini AI, and Redis session management.

## 🚀 Features

- **REST API** with session-based chat management
- **RAG Pipeline** with news article ingestion and vector search
- **Pinecone Integration** for vector storage and similarity search
- **Gemini AI** for natural language processing
- **Redis** for session storage and chat history
- **Jina Embeddings** for text vectorization
- **Streaming Responses** for real-time chat experience
- **Docker Support** for easy deployment
- **Health Checks** and monitoring endpoints

## 📋 API Endpoints

### Chat Endpoints
- `POST /api/chat` - Send a new chat message
- `GET /api/chat/history/:sessionId` - Get chat history for a session
- `DELETE /api/chat/reset/:sessionId` - Clear chat history for a session
- `POST /api/chat/stream` - Send a message with streaming response

### Health Endpoints
- `GET /api/health` - Comprehensive health check
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Redis (session storage)
- **Vector DB**: Pinecone
- **AI/LLM**: Google Gemini
- **Embeddings**: Jina AI
- **News Sources**: RSS feeds
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate limiting

## 📦 Installation

### Prerequisites

- Node.js 18 or higher
- Redis server
- Pinecone account and API key
- Google AI Studio account and API key
- Jina AI account and API key

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend-new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   # Required API Keys
   PINECONE_API_KEY=your_pinecone_api_key
   GEMINI_API_KEY=your_gemini_api_key
   JINA_API_KEY=your_jina_api_key
   
   # Optional Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   PINECONE_INDEX_NAME=voicebot-index
   GEMINI_MODEL=gemini-1.5-flash
   ```

4. **Start Redis server**
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:alpine
   
   # Or install locally
   redis-server
   ```

5. **Seed news articles (optional)**
   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Set up environment variables**
   ```bash
   cp env.docker .env
   # Edit .env with your API keys
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

This will start:
- Backend API on port 3000
- Frontend on port 3001
- Redis on port 6379

### Using Docker only

1. **Build the image**
   ```bash
   docker build -t voicebot-backend .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e PINECONE_API_KEY=your_key \
     -e GEMINI_API_KEY=your_key \
     -e JINA_API_KEY=your_key \
     -e REDIS_URL=redis://your-redis-host:6379 \
     voicebot-backend
   ```

## ☁️ Cloud Deployment

### Render.com

1. **Connect your repository** to Render
2. **Create a new Web Service**
3. **Set environment variables** in Render dashboard:
   - `PINECONE_API_KEY`
   - `GEMINI_API_KEY`
   - `JINA_API_KEY`
   - `REDIS_URL` (use Render's Redis addon)
4. **Deploy** using the provided `render.yaml`

### Railway

1. **Connect your repository** to Railway
2. **Add Redis service** from Railway marketplace
3. **Set environment variables**:
   - `PINECONE_API_KEY`
   - `GEMINI_API_KEY`
   - `JINA_API_KEY`
4. **Deploy** automatically

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `NODE_ENV` | Environment | development | No |
| `REDIS_HOST` | Redis host | localhost | No |
| `REDIS_PORT` | Redis port | 6379 | No |
| `REDIS_URL` | Redis connection URL | - | No |
| `PINECONE_API_KEY` | Pinecone API key | - | Yes |
| `PINECONE_ENVIRONMENT` | Pinecone environment | us-east-1-aws | No |
| `PINECONE_INDEX_NAME` | Pinecone index name | voicebot-index | No |
| `GEMINI_API_KEY` | Gemini API key | - | Yes |
| `GEMINI_MODEL` | Gemini model | gemini-1.5-flash | No |
| `JINA_API_KEY` | Jina API key | - | Yes |
| `JINA_MODEL` | Jina model | jina-embeddings-v2-base-en | No |

### RAG Configuration

- `RAG_TOP_K`: Number of similar chunks to retrieve (default: 5)
- `RAG_CHUNK_SIZE`: Size of text chunks (default: 1000)
- `RAG_CHUNK_OVERLAP`: Overlap between chunks (default: 200)

### Session Configuration

- `SESSION_TTL`: Session time-to-live in seconds (default: 3600)
- `SESSION_MAX_MESSAGES`: Maximum messages per session (default: 100)

## 📊 API Usage Examples

### Send a Chat Message

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the latest technology trends?",
    "sessionId": "optional-session-id"
  }'
```

### Get Chat History

```bash
curl http://localhost:3000/api/chat/history/your-session-id
```

### Clear Chat History

```bash
curl -X DELETE http://localhost:3000/api/chat/reset/your-session-id
```

### Streaming Chat

```bash
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about AI developments",
    "sessionId": "your-session-id"
  }'
```

## 🔍 Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": {
    "redis": { "status": "healthy" },
    "pinecone": { "status": "healthy", "totalVectors": 1000 },
    "gemini": { "status": "healthy" },
    "jina": { "status": "healthy", "embeddingDimension": 768 }
  }
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run seed` - Seed news articles into Pinecone

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

## 🔄 Migration from Python Flask

This Node.js backend replaces the original Python Flask backend with the following improvements:

- **Better Performance**: Node.js async/await for better concurrency
- **Modern Stack**: Latest Express.js with TypeScript support
- **Enhanced RAG**: More sophisticated news ingestion and vector search
- **Session Management**: Redis-based session storage with TTL
- **Streaming Support**: Real-time response streaming
- **Better Monitoring**: Comprehensive health checks and logging
- **Cloud Ready**: Optimized for cloud deployment platforms
