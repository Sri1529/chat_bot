const redisService = require('./redisService');
const pineconeService = require('./pineconeService');
const geminiService = require('./geminiService');
const pineconeEmbeddingsService = require('./pineconeEmbeddingsService');
const newsService = require('./newsService');

let services = {};

async function initializeServices() {
  try {
    // Initialize Redis with fallback
    console.log('🔧 Initializing Redis service...');
    try {
      await redisService.initialize();
      services.redis = redisService;
      console.log('✅ Redis service initialized');
    } catch (redisError) {
      console.warn('⚠️ Redis service failed to initialize:', redisError.message);
      console.warn('⚠️ Continuing without Redis - sessions will not persist');
      services.redis = null;
    }

    console.log('🔧 Initializing Pinecone service...');
    services.pinecone = pineconeService;
    await pineconeService.initialize();
    console.log('✅ Pinecone service initialized');

    console.log('🔧 Initializing Gemini service...');
    services.gemini = geminiService;
    await geminiService.initialize();
    console.log('✅ Gemini service initialized');

    console.log('🔧 Initializing Pinecone embeddings service...');
    services.pineconeEmbeddings = pineconeEmbeddingsService;
    await pineconeEmbeddingsService.initialize();
    console.log('✅ Pinecone embeddings service initialized');

    console.log('🔧 Initializing News service...');
    services.news = newsService;
    await newsService.initialize();
    console.log('✅ News service initialized');

    // Start news ingestion in background (optional)
    console.log('📰 News service ready (ingestion can be started manually)');
    // services.news.startIngestion(); // Commented out for now

    return services;
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    throw error;
  }
}

function getServices() {
  if (!services.pinecone || !services.gemini || !services.pineconeEmbeddings) {
    throw new Error('Services not initialized. Call initializeServices() first.');
  }
  return services;
}

module.exports = {
  initializeServices,
  getServices
};
