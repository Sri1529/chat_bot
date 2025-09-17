const redisService = require('./redisService');
const pineconeService = require('./pineconeService');
const geminiService = require('./geminiService');
const pineconeEmbeddingsService = require('./pineconeEmbeddingsService');
const newsService = require('./newsService');

let services = {};

async function initializeServices() {
  try {
    console.log('🔧 Initializing Redis service...');
    await redisService.initialize();
    services.redis = redisService; // Store the service module, not just the initialized result
    console.log('✅ Redis service initialized');

    console.log('🔧 Initializing Pinecone service...');
    services.pinecone = pineconeService; // Store the service module, not just the initialized result
    await pineconeService.initialize();
    console.log('✅ Pinecone service initialized');

    console.log('🔧 Initializing Gemini service...');
    services.gemini = geminiService; // Store the service module, not just the initialized result
    await geminiService.initialize();
    console.log('✅ Gemini service initialized');

    console.log('🔧 Initializing Pinecone embeddings service...');
    services.pineconeEmbeddings = pineconeEmbeddingsService; // Store the service module, not just the initialized result
    await pineconeEmbeddingsService.initialize();
    console.log('✅ Pinecone embeddings service initialized');

    console.log('🔧 Initializing News service...');
    services.news = newsService; // Store the service module, not just the initialized result
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
  if (!services.redis || !services.pinecone || !services.gemini || !services.pineconeEmbeddings) {
    throw new Error('Services not initialized. Call initializeServices() first.');
  }
  return services;
}

module.exports = {
  initializeServices,
  getServices
};
