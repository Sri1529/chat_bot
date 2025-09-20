# 💬 ChatBot - AI-Powered Chat Assistant

A modern, full-stack chatbot built with React, Node.js, and cutting-edge AI technologies. ChatBot combines natural language processing and Retrieval-Augmented Generation (RAG) to provide intelligent conversations about news and current events.

![ChatBot Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 🌟 Features

- **💬 Text Chat**: Natural conversation interface with your AI assistant
- **🧠 RAG-Powered**: Retrieval-Augmented Generation for accurate, up-to-date responses
- **📰 News Integration**: Get insights on current events and trending topics
- **⚡ Real-time Streaming**: Live response streaming for better user experience
- **🎨 Modern UI**: Beautiful, responsive interface with Tailwind CSS
- **🐳 Docker Ready**: Containerized deployment with Docker Compose
- **🔄 Session Management**: Persistent chat history with Redis
- **🌐 Production Ready**: Optimized for Netlify and cloud deployment

## 🏗️ Tech Stack

### Frontend
- **React 18.2.0** - Modern UI framework with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, customizable icons
- **React Hooks** - Custom hooks for chat and text-to-speech

### Backend
- **Node.js 20** - JavaScript runtime
- **Express.js** - Web application framework
- **Redis** - In-memory data store for sessions
- **Pinecone** - Vector database for embeddings
- **Google Gemini** - Large language model
- **OpenAI API** - Alternative LLM provider
- **Pinecone Embeddings** - Vector embeddings service

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Web server for production
- **Supervisor** - Process management
- **Docker Compose** - Multi-container orchestration

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- API Keys (see Environment Variables section)

### 1. Clone & Setup
```bash
git clone <your-repo-url>
cd chatbot-main
```

### 2. Environment Configuration
Create environment variables for your API keys:

```bash
# Backend (.env)
PINECONE_API_KEY=your_pinecone_key
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Frontend (.env)
REACT_APP_API_URL=http://localhost:3001/api
```

### 3. Docker Deployment (Recommended)
```bash
# Start everything with one command
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access Your Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🛠️ Development Setup

### Backend Development
```bash
cd backend-new
npm install
npm run dev  # Starts with nodemon
```

### Frontend Development
```bash
cd frontend-new
npm install
npm start    # Starts development server
```

## ⚙️ Configuration & Optimization

### TTL (Time To Live) Configuration

ChatBot uses Redis for session management with configurable TTL settings:

```javascript
// Backend Configuration (src/config/index.js)
const config = {
  session: {
    ttl: process.env.SESSION_TTL || 3600,        // 1 hour default
    maxMessages: process.env.SESSION_MAX_MESSAGES || 100
  },
  news: {
    maxArticles: process.env.NEWS_MAX_ARTICLES || 50,
    updateInterval: process.env.NEWS_UPDATE_INTERVAL || 3600000  // 1 hour
  }
};
```

**Environment Variables for TTL:**
```bash
SESSION_TTL=7200              # 2 hours session lifetime
SESSION_MAX_MESSAGES=200      # Max messages per session
NEWS_MAX_ARTICLES=100         # Cache up to 100 news articles
NEWS_UPDATE_INTERVAL=1800000  # Update news every 30 minutes
```

### Cache Warming Strategies

#### 1. Redis Session Warming
```javascript
// Pre-warm popular queries
const warmupQueries = [
  "What's the latest news?",
  "Tell me about technology trends",
  "Current events summary"
];

// Initialize cache on startup
async function warmupCache() {
  for (const query of warmupQueries) {
    await generateEmbedding(query);
    // Pre-populate vector search results
  }
}
```

#### 2. News Cache Warming
```javascript
// Scheduled news updates
const cron = require('node-cron');

// Update news every hour
cron.schedule('0 * * * *', async () => {
  // Warming news cache...
  await updateNewsCache();
  await refreshEmbeddings();
});
```

#### 3. Vector Database Warming
```javascript
// Pre-compute embeddings for common topics
const commonTopics = [
  'artificial intelligence',
  'climate change',
  'technology news',
  'business updates'
];

async function warmupVectorDB() {
  for (const topic of commonTopics) {
    const embedding = await generateEmbedding(topic);
    await pinecone.upsert([{
      id: `warmup-${topic}`,
      values: embedding,
      metadata: { topic, type: 'warmup' }
    }]);
  }
}
```

### Performance Optimization

#### Frontend Optimizations
```javascript
// React.memo for expensive components
const MessageList = React.memo(({ messages }) => {
  // Component logic
});

// useCallback for event handlers
const handleSendMessage = useCallback(async (message) => {
  // Handler logic
}, [dependencies]);

// Lazy loading for heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

#### Backend Optimizations
```javascript
// Connection pooling for Redis
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100
});

// Response caching
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes

app.get('/api/news', async (req, res) => {
  const cacheKey = `news:${req.query.topic}`;
  
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }
  
  const data = await fetchNews(req.query.topic);
  cache.set(cacheKey, data);
  
  // Auto-expire cache
  setTimeout(() => cache.delete(cacheKey), CACHE_TTL);
  
  res.json(data);
});
```

## 🐳 Docker Configuration

### Production Docker Compose
```yaml
services:
  chatbot:
    build:
      context: ./backend-new
      dockerfile: Dockerfile.with-redis
    ports:
      - "3001:3001"
      - "6379:6379"
    environment:
      - NODE_ENV=production
      - SESSION_TTL=7200
      - NEWS_UPDATE_INTERVAL=1800000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Health Checks
```bash
# Check backend health
curl http://localhost:3001/api/health

# Check Redis connection
docker exec chatbot-app redis-cli ping

# Monitor container resources
docker stats chatbot-app
```

## 🌐 Deployment

### Netlify Deployment
1. **Connect Repository**: Link your GitHub repo to Netlify
2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Node version: `18.x`
3. **Environment Variables**:
   - `REACT_APP_API_URL`: Your backend API URL
4. **Deploy**: Automatic deployment on git push

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker Production
```bash
# Build production image
docker build -t chatbot-prod .

# Run with environment
docker run -d \
  -p 3001:3001 \
  -e PINECONE_API_KEY=your_key \
  -e GEMINI_API_KEY=your_key \
  chatbot-prod
```

## 📊 Monitoring & Logging

### Application Monitoring
```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    redis: await checkRedisConnection()
  });
});
```

### Logging Configuration
```javascript
// Structured logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🔧 API Endpoints

### Chat Endpoints
- `POST /api/chat` - Send message to AI
- `GET /api/chat/history/:sessionId` - Get chat history
- `DELETE /api/chat/history/:sessionId` - Clear chat history

### News Endpoints
- `GET /api/news` - Get latest news
- `GET /api/news/:topic` - Get news by topic
- `POST /api/news/refresh` - Refresh news cache

### Health Endpoints
- `GET /api/health` - Application health check
- `GET /api/status` - Detailed status information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini** for powerful language understanding
- **Pinecone** for vector database capabilities
- **React Team** for the amazing framework
- **Tailwind CSS** for beautiful styling
- **Docker** for containerization

## 📞 Support

Having issues? Here's how to get help:

1. **Check the logs**: `docker-compose logs -f`
2. **Verify health**: `curl http://localhost:3001/api/health`
3. **Review configuration**: Check environment variables
4. **Open an issue**: Describe the problem with logs

---

**Built with ❤️ for the AI community**

*Star this repo if you found it helpful!*
