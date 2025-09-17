const { Pinecone } = require('@pinecone-database/pinecone');
const config = require('../config');

let pinecone = null;
let index = null;

async function initialize() {
  try {
    pinecone = new Pinecone({
      apiKey: config.pinecone.apiKey
    });

    // Get or create index
    const indexName = config.pinecone.indexName;
    const indexes = await pinecone.listIndexes();
    
    if (!indexes.indexes?.find(idx => idx.name === indexName)) {
      console.log(`Pinecone index '${indexName}' not found. Skipping creation for demo purposes.`);
      console.log('Note: You can create the index manually in the Pinecone console.');
    }

    index = pinecone.index(indexName);
    console.log(`Pinecone index '${indexName}' is ready`);
    
    return index;
  } catch (error) {
    console.error('Failed to initialize Pinecone:', error);
    throw error;
  }
}

async function upsertVectors(vectors) {
  try {
    if (!index) {
      throw new Error('Pinecone index not initialized');
    }

    const response = await index.upsert(vectors);
    console.log(`Upserted ${vectors.length} vectors to Pinecone`);
    return response;
  } catch (error) {
    console.error('Error upserting vectors to Pinecone:', error);
    throw error;
  }
}

async function queryVectors(queryVector, topK = 5, filter = {}) {
  try {
    if (!index) {
      throw new Error('Pinecone index not initialized');
    }

    const queryRequest = {
      vector: queryVector,
      topK,
      includeMetadata: true,
      includeValues: false
    };

    if (Object.keys(filter).length > 0) {
      queryRequest.filter = filter;
    }

    const response = await index.query(queryRequest);
    console.log(`Queried Pinecone and found ${response.matches?.length || 0} matches`);
    return response;
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    throw error;
  }
}

async function deleteVectors(ids) {
  try {
    if (!index) {
      throw new Error('Pinecone index not initialized');
    }

    const response = await index.deleteMany(ids);
    console.log(`Deleted ${ids.length} vectors from Pinecone`);
    return response;
  } catch (error) {
    console.error('Error deleting vectors from Pinecone:', error);
    throw error;
  }
}

async function getIndexStats() {
  try {
    if (!index) {
      throw new Error('Pinecone index not initialized');
    }

    const stats = await index.describeIndexStats();
    return stats;
  } catch (error) {
    console.error('Error getting Pinecone index stats:', error);
    throw error;
  }
}

function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);
    
    // Try to break at word boundary
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

module.exports = {
  initialize,
  upsertVectors,
  queryVectors,
  deleteVectors,
  getIndexStats,
  chunkText
};
