const express = require('express');
const { getServices } = require('../services');

const router = express.Router();

// GET /api/health - Health check endpoint
router.get('/', async (req, res) => {
  try {
    const services = getServices();
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {}
    };

    // Check Redis connection
    try {
      await services.redis.ping();
      health.services.redis = { status: 'healthy' };
    } catch (error) {
      health.services.redis = { status: 'unhealthy', error: error.message };
      health.status = 'degraded';
    }

    // Check Pinecone connection
    try {
      const stats = await services.pinecone.getIndexStats();
      health.services.pinecone = { 
        status: 'healthy',
        totalVectors: stats.totalVectorCount || 0
      };
    } catch (error) {
      health.services.pinecone = { status: 'unhealthy', error: error.message };
      health.status = 'degraded';
    }

    // Check Gemini connection
    try {
      await services.gemini.generateResponse('test', 'test context');
      health.services.gemini = { status: 'healthy' };
    } catch (error) {
      health.services.gemini = { status: 'unhealthy', error: error.message };
      health.status = 'degraded';
    }

    // Check Pinecone embeddings
    try {
      const testEmbedding = await services.pineconeEmbeddings.getEmbedding('test');
      health.services.pineconeEmbeddings = { 
        status: 'healthy',
        embeddingDimension: testEmbedding.length
      };
    } catch (error) {
      health.services.pineconeEmbeddings = { status: 'unhealthy', error: error.message };
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /api/health/ready - Readiness probe
router.get('/ready', async (req, res) => {
  try {
    const services = getServices();
    
    // Check if all critical services are ready
    await services.redis.ping();
    await services.pinecone.getIndexStats();
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /api/health/live - Liveness probe
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
