const redisService = require('./redisService');
const pineconeService = require('./pineconeService');
const geminiService = require('./geminiService');
const pineconeEmbeddingsService = require('./pineconeEmbeddingsService');
const newsService = require('./newsService');

let services = {};

async function initializeServices() {
  try {
    // Initialize Redis with fallback
    try {
      await redisService.initialize();
      services.redis = redisService;
    } catch (redisError) {
      // Redis service failed to initialize, continuing without Redis
      services.redis = null;
    }

    services.pinecone = pineconeService;
    await pineconeService.initialize();

    services.gemini = geminiService;
    await geminiService.initialize();

    services.pineconeEmbeddings = pineconeEmbeddingsService;
    await pineconeEmbeddingsService.initialize();

    services.news = newsService;
    await newsService.initialize();

    // Start news ingestion in background (optional)
    // services.news.startIngestion(); // Commented out for now

    return services;
  } catch (error) {
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
