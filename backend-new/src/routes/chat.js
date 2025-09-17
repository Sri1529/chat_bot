const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getServices } = require('../services');
const config = require('../config');

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

// POST /api/chat - Handle new chat queries
router.post('/', [
  body('message').notEmpty().withMessage('Message is required'),
  body('sessionId').optional().isUUID().withMessage('Session ID must be a valid UUID'),
  body('stream').optional().isBoolean().withMessage('Stream must be a boolean')
], validateRequest, async (req, res) => {
  try {
    const { message, sessionId, stream = false } = req.body;
    const services = getServices();
    
    // Generate session ID if not provided
    const currentSessionId = sessionId || uuidv4();
    
    console.log(`Processing chat message for session: ${currentSessionId}`);
    
    // Add user message to session
    const userMessage = {
      id: uuidv4(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    await services.redis.addMessageToSession(currentSessionId, userMessage);
    
    // Generate query embedding
    const queryEmbedding = await services.pineconeEmbeddings.getEmbedding(message);
    
    // Search for relevant content in Pinecone
    const searchResults = await services.pinecone.queryVectors(
      queryEmbedding,
      config.rag.topK,
      { category: { $eq: 'news' } }
    );
    
    // Extract relevant chunks
    const relevantChunks = (searchResults.matches || [])
      .filter(match => match.score > 0.7) // Filter by relevance score
      .map(match => match.metadata.chunkText)
      .filter(chunk => chunk && chunk.length > 0);
    
    // Generate context
    const context = relevantChunks.join('\n\n');
    
    // Generate AI response
    const aiResponse = await services.gemini.generateResponse(message, context);
    
    // Add bot response to session
    const botMessage = {
      id: uuidv4(),
      text: aiResponse,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      context: relevantChunks.length > 0 ? 'found' : 'not_found'
    };
    
    await services.redis.addMessageToSession(currentSessionId, botMessage);
    
    // Return response
    res.json({
      success: true,
      data: {
        sessionId: currentSessionId,
        response: aiResponse,
        timestamp: new Date().toISOString(),
        contextFound: relevantChunks.length > 0,
        contextChunks: relevantChunks.length
      }
    });
    
  } catch (error) {
    console.error('Error processing chat message:', error);
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
    
    const messages = await services.redis.getSessionHistory(sessionId);
    
    res.json({
      success: true,
      data: {
        sessionId,
        messages,
        messageCount: messages.length
      }
    });
    
  } catch (error) {
    console.error('Error getting chat history:', error);
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
    
    await services.redis.clearSession(sessionId);
    
    res.json({
      success: true,
      data: {
        sessionId,
        message: 'Chat history cleared successfully'
      }
    });
    
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear chat history',
      message: error.message
    });
  }
});

// POST /api/chat/stream - Handle streaming chat responses
router.post('/stream', [
  body('message').notEmpty().withMessage('Message is required'),
  body('sessionId').optional().isUUID().withMessage('Session ID must be a valid UUID')
], validateRequest, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const services = getServices();
    
    // Generate session ID if not provided
    const currentSessionId = sessionId || uuidv4();
    
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Add user message to session
    const userMessage = {
      id: uuidv4(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    await services.redis.addMessageToSession(currentSessionId, userMessage);
    
    // Send session ID
    res.write(`data: ${JSON.stringify({ type: 'session', sessionId: currentSessionId })}\n\n`);
    
    // Generate query embedding
    const queryEmbedding = await services.pineconeEmbeddings.getEmbedding(message);
    
    // Search for relevant content
    const searchResults = await services.pinecone.queryVectors(
      queryEmbedding,
      config.rag.topK,
      { category: { $eq: 'news' } }
    );
    
    // Extract relevant chunks
    const relevantChunks = (searchResults.matches || [])
      .filter(match => match.score > 0.7)
      .map(match => match.metadata.chunkText)
      .filter(chunk => chunk && chunk.length > 0);
    
    const context = relevantChunks.join('\n\n');
    
    // Send context info
    res.write(`data: ${JSON.stringify({ 
      type: 'context', 
      found: relevantChunks.length > 0,
      chunks: relevantChunks.length 
    })}\n\n`);
    
    // Generate streaming response
    const stream = await services.gemini.generateStreamingResponse(message, context);
    
    let fullResponse = '';
    
    for await (const chunk of stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullResponse += chunkText;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`);
      }
    }
    
    // Add bot response to session
    const botMessage = {
      id: uuidv4(),
      text: fullResponse,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      context: relevantChunks.length > 0 ? 'found' : 'not_found'
    };
    
    await services.redis.addMessageToSession(currentSessionId, botMessage);
    
    // Send completion
    res.write(`data: ${JSON.stringify({ type: 'complete', sessionId: currentSessionId })}\n\n`);
    res.end();
    
  } catch (error) {
    console.error('Error processing streaming chat:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
