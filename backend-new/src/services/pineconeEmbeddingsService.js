const axios = require('axios');
const config = require('../config');

let embeddingsConfig = null;

async function initialize() {
  try {
    embeddingsConfig = {
      model: config.pineconeEmbeddings.model,
      apiKey: config.pineconeEmbeddings.apiKey,
      baseUrl: config.pineconeEmbeddings.baseUrl
    };

    return embeddingsConfig;
  } catch (error) {
    throw error;
  }
}

async function getEmbeddings(texts) {
  try {
    if (!embeddingsConfig) {
      throw new Error('Pinecone embeddings service not initialized');
    }

    if (!Array.isArray(texts)) {
      texts = [texts];
    }

    const response = await axios.post(
      `${embeddingsConfig.baseUrl}/embeddings`,
      {
        model: embeddingsConfig.model,
        input: texts
      },
      {
        headers: {
          'Authorization': `Bearer ${embeddingsConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    if (!response.data || !response.data.data) {
      throw new Error('Invalid response from OpenAI API');
    }

    const embeddings = response.data.data.map(item => item.embedding);
    
    return embeddings;
  } catch (error) {
    
    if (error.response) {
    }
    
    throw error;
  }
}

async function getEmbedding(text) {
  try {
    const embeddings = await getEmbeddings([text]);
    return embeddings[0];
  } catch (error) {
    throw error;
  }
}

async function getBatchEmbeddings(texts, batchSize = 10) {
  try {
    const allEmbeddings = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const batchEmbeddings = await getEmbeddings(batch);
      allEmbeddings.push(...batchEmbeddings);
      
      // Add small delay between batches to avoid rate limiting
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return allEmbeddings;
  } catch (error) {
    throw error;
  }
}

async function testConnection() {
  try {
    const testEmbedding = await getEmbedding('test');
    return testEmbedding && testEmbedding.length > 0;
  } catch (error) {
    return false;
  }
}

module.exports = {
  initialize,
  getEmbeddings,
  getEmbedding,
  getBatchEmbeddings,
  testConnection
};
