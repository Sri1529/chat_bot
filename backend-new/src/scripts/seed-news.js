#!/usr/bin/env node

require('dotenv').config();
const { initializeServices } = require('../services');

async function seedNews() {
  try {
    console.log('🌱 Starting news seeding...');
    
    // Initialize services
    const services = await initializeServices();
    
    // Run news ingestion
    const result = await services.news.ingestNews();
    
    console.log('✅ News seeding completed successfully!');
    console.log(`📊 Articles processed: ${result.articlesProcessed}`);
    console.log(`🔢 Vectors stored: ${result.vectorsStored}`);
    
    // Get index stats
    const stats = await services.pinecone.getIndexStats();
    console.log(`📈 Total vectors in index: ${stats.totalVectorCount || 0}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ News seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedNews();
}

module.exports = { seedNews };
