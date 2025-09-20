const express = require('express');
const { body, param, validationResult } = require('express-validator');
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

// Mock embedding generator (for testing without OpenAI API key)
function generateMockEmbedding(text) {
  const embedding = [];
  for (let i = 0; i < 1024; i++) {
    // Generate random values between -1 and 1
    embedding.push(Math.random() * 2 - 1);
  }
  return embedding;
}

// Real embedding generator using OpenAI API
async function generateRealEmbedding(text) {
  try {
    const services = getServices();
    const embedding = await services.pineconeEmbeddings.getEmbedding(text);
    return embedding;
  } catch (error) {
    // Error generating real embedding, falling back to mock embedding
    return generateMockEmbedding(text);
  }
}

// POST /api/chat - Handle new chat queries with RAG
router.post('/', [
  body('message').notEmpty().withMessage('Message is required'),
  body('sessionId').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }).withMessage('Session ID must be a valid UUID or null'),
  body('stream').optional().isBoolean().withMessage('Stream must be a boolean')
], validateRequest, async (req, res) => {
  try {
    const { message, sessionId, stream = false } = req.body;
    const services = getServices();
    
    // Generate session ID if not provided
    const currentSessionId = sessionId || uuidv4();
    
    
    // Add user message to session (if Redis is available)
    const userMessage = {
      id: uuidv4(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    if (services.redis) {
      await services.redis.addMessageToSession(currentSessionId, userMessage);
    } else {
      // Redis not available - session not persisted
    }
    
    // Generate query embedding using real OpenAI API
    const queryEmbedding = await generateRealEmbedding(message);
    
    // Search for relevant content in Pinecone
    let relevantContext = '';
    let searchResults = [];
    
    try {
      searchResults = await services.pinecone.queryVectors(queryEmbedding, 5);
      
      if (searchResults.matches && searchResults.matches.length > 0) {
        
        // Build context from search results
        relevantContext = searchResults.matches.map((match, index) => {
          return `Article ${index + 1}: ${match.metadata.title}\n${match.metadata.content}`;
        }).join('\n\n');
        
      } else {
        // No relevant articles found in Pinecone
      }
    } catch (error) {
      // Continue without context
    }
    
    // Get chat history for context (if Redis is available)
    const chatHistory = services.redis ? await services.redis.getSessionHistory(currentSessionId) : [];
    const recentHistory = chatHistory.slice(-6); // Last 3 exchanges
    
    // Build conversation context
    let conversationContext = '';
    if (recentHistory.length > 0) {
      conversationContext = recentHistory.map(msg => 
        `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
      ).join('\n');
    }
    
    // Generate response using Gemini with RAG context
    let response;
    try {
      const systemPrompt = `You are a helpful AI assistant that answers questions based on news articles and current events. Use the provided context to give accurate and informative answers.

${relevantContext ? `Relevant News Articles:
${relevantContext}

` : ''}${conversationContext ? `Recent Conversation:
${conversationContext}

` : ''}Instructions:
- Answer based on the provided news articles when available
- If no relevant articles are found, provide a general helpful response
- Be conversational and engaging
- Cite specific articles when referencing information
- If you don't know something, say so honestly`;

      response = await services.gemini.generateResponse(message, systemPrompt);
    } catch (error) {
      response = "I'm sorry, I'm having trouble generating a response right now. Please try again later.";
    }
    
    // Add AI response to session
    const aiMessage = {
      id: uuidv4(),
      text: response,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      metadata: {
        searchResults: searchResults.matches?.length || 0,
        hasContext: !!relevantContext
      }
    };
    
    // Store AI response in session (if Redis is available)
    if (services.redis) {
      await services.redis.addMessageToSession(currentSessionId, aiMessage);
    }
    
    // Return response
    res.json({
      success: true,
      data: {
        sessionId: currentSessionId,
        message: response,
        timestamp: aiMessage.timestamp,
        metadata: {
          searchResults: searchResults.matches?.length || 0,
          hasContext: !!relevantContext,
          articles: searchResults.matches?.map(match => ({
            title: match.metadata.title,
            score: match.score
          })) || []
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      message: error.message
    });
  }
});

// GET /api/chat/history/:sessionId - Get chat history for a session
router.get('/history/:sessionId', [
  param('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
], validateRequest, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const services = getServices();
    
    const messages = services.redis ? await services.redis.getSessionHistory(sessionId) : [];
    
    res.json({
      success: true,
      data: {
        sessionId,
        messages
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get chat history',
      message: error.message
    });
  }
});

// DELETE /api/chat/reset/:sessionId - Clear chat history for a session
router.delete('/reset/:sessionId', [
  param('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
], validateRequest, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const services = getServices();
    
    if (services.redis) {
      await services.redis.clearSession(sessionId);
    }
    
    res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear chat history',
      message: error.message
    });
  }
});

module.exports = router;
