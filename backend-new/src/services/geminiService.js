const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

let genAI = null;
let model = null;

async function initialize() {
  try {
    if (!config.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    model = genAI.getGenerativeModel({ 
      model: config.gemini.model,
      generationConfig: {
        maxOutputTokens: config.gemini.maxTokens,
        temperature: config.gemini.temperature,
      }
    });

    console.log(`Gemini service initialized with model: ${config.gemini.model}`);
    return model;
  } catch (error) {
    console.error('Failed to initialize Gemini service:', error);
    throw error;
  }
}

async function generateResponse(query, context = '') {
  try {
    if (!model) {
      throw new Error('Gemini model not initialized');
    }

    const systemPrompt = `You are a helpful AI assistant. Use the provided context to answer the user's question accurately and concisely. If the context doesn't contain relevant information, say "I don't have enough information to answer your question based on the available context."

Context:
${context}

Instructions:
- Be helpful and conversational
- Use the context to provide accurate answers
- If the context is insufficient, acknowledge this limitation
- Keep responses concise but informative
- Maintain a friendly tone`;

    const prompt = `${systemPrompt}

User Question: ${query}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Generated response from Gemini');
    return text;
  } catch (error) {
    console.error('Error generating response with Gemini:', error);
    throw error;
  }
}

async function generateStreamingResponse(query, context = '') {
  try {
    if (!model) {
      throw new Error('Gemini model not initialized');
    }

    const systemPrompt = `You are a helpful AI assistant. Use the provided context to answer the user's question accurately and concisely. If the context doesn't contain relevant information, say "I don't have enough information to answer your question based on the available context."

Context:
${context}

Instructions:
- Be helpful and conversational
- Use the context to provide accurate answers
- If the context is insufficient, acknowledge this limitation
- Keep responses concise but informative
- Maintain a friendly tone`;

    const prompt = `${systemPrompt}

User Question: ${query}`;

    const result = await model.generateContentStream(prompt);
    
    return result.stream;
  } catch (error) {
    console.error('Error generating streaming response with Gemini:', error);
    throw error;
  }
}

async function summarizeText(text, maxLength = 200) {
  try {
    if (!model) {
      throw new Error('Gemini model not initialized');
    }

    const prompt = `Please summarize the following text in ${maxLength} characters or less, keeping the most important information:

${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return summary;
  } catch (error) {
    console.error('Error summarizing text with Gemini:', error);
    throw error;
  }
}

async function extractKeywords(text) {
  try {
    if (!model) {
      throw new Error('Gemini model not initialized');
    }

    const prompt = `Extract the main keywords and topics from the following text. Return them as a comma-separated list:

${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const keywords = response.text();

    return keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
  } catch (error) {
    console.error('Error extracting keywords with Gemini:', error);
    throw error;
  }
}

module.exports = {
  initialize,
  generateResponse,
  generateStreamingResponse,
  summarizeText,
  extractKeywords
};
