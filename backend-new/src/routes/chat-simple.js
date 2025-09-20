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

// POST /api/chat - Handle new chat queries (simplified version without RAG)
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
    
    
    // Add user message to session
    const userMessage = {
      id: uuidv4(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    await services.redis.addMessageToSession(currentSessionId, userMessage);
    
    // Get chat history
    const chatHistory = await services.redis.getSessionHistory(currentSessionId);
    
    // Generate response using Gemini (without RAG for now)
    let response;
    try {
      response = await services.gemini.generateResponse(message, '');
    } catch (error) {
      response = "I'm sorry, I'm having trouble connecting to the AI service right now. Please try again later.";
    }
    
    // Add AI response to session
    const aiMessage = {
      id: uuidv4(),
      text: response,
      sender: 'assistant',
      timestamp: new Date().toISOString()
    };
    
    await services.redis.addMessageToSession(currentSessionId, aiMessage);
    
    // Return response
    res.json({
      success: true,
      data: {
        sessionId: currentSessionId,
        message: response,
        timestamp: aiMessage.timestamp
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
    
    const messages = await services.redis.getSessionHistory(sessionId);
    
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
    
    await services.redis.clearSession(sessionId);
    
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
