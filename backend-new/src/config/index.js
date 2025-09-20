require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    url: process.env.REDIS_URL || undefined
  },
  
  // Pinecone configuration
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT || 'us-east-1-aws',
    indexName: process.env.PINECONE_INDEX_NAME || 'voicebot-index',
    dimension: parseInt(process.env.PINECONE_DIMENSION) || 768
  },
  
  // Gemini configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7
  },
  
  // Pinecone embeddings configuration
  pineconeEmbeddings: {
    model: process.env.PINECONE_EMBEDDING_MODEL || 'text-embedding-ada-002',
    apiKey: process.env.OPENAI_API_KEY, // Pinecone uses OpenAI embeddings
    baseUrl: 'https://api.openai.com/v1'
  },
  
  // RAG configuration
  rag: {
    topK: parseInt(process.env.RAG_TOP_K) || 5,
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE) || 1000,
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP) || 200
  },
  
  // Session configuration
  session: {
    ttl: parseInt(process.env.SESSION_TTL) || 3600, // 1 hour in seconds
    maxMessages: parseInt(process.env.SESSION_MAX_MESSAGES) || 100
  },
  
  // News ingestion configuration
  news: {
    rssFeeds: [
      'https://feeds.bbci.co.uk/news/rss.xml',
      'https://rss.cnn.com/rss/edition.rss',
      'https://feeds.reuters.com/reuters/topNews',
      'https://feeds.npr.org/1001/rss.xml',
      'https://feeds.feedburner.com/oreilly/radar'
    ],
    maxArticles: parseInt(process.env.NEWS_MAX_ARTICLES) || 50,
    updateInterval: parseInt(process.env.NEWS_UPDATE_INTERVAL) || 3600000 // 1 hour in ms
  }
};

// Validation
const requiredEnvVars = [
  'PINECONE_API_KEY',
  'GEMINI_API_KEY',
  'OPENAI_API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  // Missing required environment variables: ${missingVars}
  // Please check your .env file
  process.exit(1);
}

module.exports = config;
