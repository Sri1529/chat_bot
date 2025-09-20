const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getServices } = require('../services');

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Mock embedding generator
function generateMockEmbedding(text) {
  const embedding = [];
  for (let i = 0; i < 1024; i++) {
    embedding.push(Math.random() * 2 - 1);
  }
  return embedding;
}

// Function to chunk text
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);
    
    if (end < text.length) {
      const lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > chunkSize * 0.8) {
        chunk = chunk.slice(0, lastSpace);
        start += lastSpace + 1;
      } else {
        start += chunkSize - overlap;
      }
    } else {
      start = text.length;
    }
    
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

// POST /api/news/upload - Upload news articles to vector database
router.post('/upload', [
  body('articles').isArray().withMessage('Articles must be an array'),
  body('articles.*.title').notEmpty().withMessage('Article title is required'),
  body('articles.*.content').notEmpty().withMessage('Article content is required'),
  body('articles.*.url').optional().isURL().withMessage('Article URL must be valid'),
  body('articles.*.publishedAt').optional().isISO8601().withMessage('Published date must be valid ISO8601')
], validateRequest, async (req, res) => {
  try {
    const { articles } = req.body;
    const services = getServices();
    
    
    const allVectors = [];
    
    // Process each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      // Chunk the article content
      const chunks = chunkText(article.content);
      
      // Create vectors for each chunk
      for (let j = 0; j < chunks.length; j++) {
        const chunk = chunks[j];
        const embedding = generateMockEmbedding(chunk);
        
        const vector = {
          id: uuidv4(),
          values: embedding,
          metadata: {
            title: article.title,
            content: chunk,
            fullContent: article.content,
            url: article.url || '',
            publishedAt: article.publishedAt || new Date().toISOString(),
            chunkIndex: j,
            totalChunks: chunks.length,
            type: 'news_article',
            created_at: new Date().toISOString()
          }
        };
        
        allVectors.push(vector);
      }
    }
    
    
    // Upload to Pinecone in batches
    const batchSize = 100;
    let uploadedCount = 0;
    
    for (let i = 0; i < allVectors.length; i += batchSize) {
      const batch = allVectors.slice(i, i + batchSize);
      
      try {
        await services.pinecone.upsertVectors(batch);
        uploadedCount += batch.length;
      } catch (error) {
        // Continue with next batch
      }
    }
    
    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedCount} vectors from ${articles.length} articles`,
      data: {
        articlesProcessed: articles.length,
        vectorsUploaded: uploadedCount,
        batchesProcessed: Math.ceil(allVectors.length / batchSize)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to upload news articles',
      message: error.message
    });
  }
});

// GET /api/news/search - Search news articles
router.get('/search', [
  query('query').notEmpty().withMessage('Search query is required'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], validateRequest, async (req, res) => {
  try {
    const { query: searchQuery, limit = 5 } = req.query;
    const services = getServices();
    
    
    // Generate query embedding
    const queryEmbedding = generateMockEmbedding(searchQuery);
    
    // Search Pinecone
    const searchResults = await services.pinecone.queryVectors(queryEmbedding, parseInt(limit));
    
    const articles = searchResults.matches?.map(match => ({
      id: match.id,
      title: match.metadata.title,
      content: match.metadata.content,
      url: match.metadata.url,
      publishedAt: match.metadata.publishedAt,
      score: match.score,
      chunkIndex: match.metadata.chunkIndex,
      totalChunks: match.metadata.totalChunks
    })) || [];
    
    res.json({
      success: true,
      data: {
        query: searchQuery,
        articles,
        totalFound: articles.length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search news articles',
      message: error.message
    });
  }
});

// GET /api/news - Get all news articles (with pagination)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validateRequest, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const services = getServices();
    
    // Get index stats
    const stats = await services.pinecone.getIndexStats();
    
    res.json({
      success: true,
      data: {
        totalVectors: stats.totalVectorCount || 0,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((stats.totalVectorCount || 0) / parseInt(limit))
        },
        message: 'Use /api/news/search to find specific articles'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get news information',
      message: error.message
    });
  }
});

// GET /api/news/:id - Get specific news article
router.get('/:id', [
  param('id').isUUID().withMessage('Article ID must be a valid UUID')
], validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const services = getServices();
    
    // Search for the specific article by ID
    const searchResults = await services.pinecone.queryVectors(
      generateMockEmbedding(''), // Empty query to get all
      1000 // Large limit to find the specific article
    );
    
    const article = searchResults.matches?.find(match => match.id === id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
        message: `No article found with ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: {
        id: article.id,
        title: article.metadata.title,
        content: article.metadata.content,
        fullContent: article.metadata.fullContent,
        url: article.metadata.url,
        publishedAt: article.metadata.publishedAt,
        chunkIndex: article.metadata.chunkIndex,
        totalChunks: article.metadata.totalChunks,
        createdAt: article.metadata.created_at
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get news article',
      message: error.message
    });
  }
});

module.exports = router;
