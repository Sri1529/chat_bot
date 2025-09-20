#!/usr/bin/env node

require('dotenv').config();
const { initializeServices } = require('../services');

async function seedNews() {
  try {
    
    // Initialize services
    const services = await initializeServices();
    
    // Run news ingestion
    const result = await services.news.ingestNews();
    
    
    // Get index stats
    const stats = await services.pinecone.getIndexStats();
    
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedNews();
}

module.exports = { seedNews };
