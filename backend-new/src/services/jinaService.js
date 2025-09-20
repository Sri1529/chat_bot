const axios = require('axios');
const config = require('../config');

let jinaConfig = null;

async function initialize() {
  try {
    jinaConfig = {
      apiKey: config.jina.apiKey,
      model: config.jina.model,
      baseUrl: config.jina.baseUrl
    };

    return jinaConfig;
  } catch (error) {
    throw error;
  }
}

async function getEmbeddings(texts) {
  try {
    if (!jinaConfig) {
      throw new Error('Jina service not initialized');
    }

    if (!Array.isArray(texts)) {
      texts = [texts];
    }

    const response = await axios.post(
      `${jinaConfig.baseUrl}/embeddings`,
      {
        model: jinaConfig.model,
        input: texts
      },
      {
        headers: {
          'Authorization': `Bearer ${jinaConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    if (!response.data || !response.data.data) {
      throw new Error('Invalid response from Jina API');
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
