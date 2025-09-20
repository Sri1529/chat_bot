const { initializeServices, getServices } = require('../services');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const cheerio = require('cheerio');

// Sample news articles (you can expand this with real RSS feeds)
const newsArticles = [
  {
    title: "Artificial Intelligence Revolutionizes Healthcare",
    content: "Artificial intelligence is transforming healthcare with applications in medical imaging, drug discovery, and personalized treatment plans. AI-powered diagnostic tools can detect diseases earlier and more accurately than traditional methods.",
    url: "https://example.com/ai-healthcare",
    publishedAt: "2025-09-17T10:00:00Z"
  },
  {
    title: "Machine Learning in Financial Services",
    content: "Financial institutions are leveraging machine learning for fraud detection, algorithmic trading, and risk assessment. These AI systems can process vast amounts of data to identify patterns and make predictions.",
    url: "https://example.com/ml-finance",
    publishedAt: "2025-09-17T11:00:00Z"
  },
  {
    title: "Natural Language Processing Advances",
    content: "Recent breakthroughs in natural language processing have enabled more sophisticated chatbots, translation services, and content generation. Large language models can understand context and generate human-like text.",
    url: "https://example.com/nlp-advances",
    publishedAt: "2025-09-17T12:00:00Z"
  },
  {
    title: "Computer Vision in Autonomous Vehicles",
    content: "Computer vision technology is crucial for autonomous vehicles, enabling them to recognize traffic signs, pedestrians, and other vehicles. Advanced neural networks process visual data in real-time for safe navigation.",
    url: "https://example.com/cv-autonomous",
    publishedAt: "2025-09-17T13:00:00Z"
  },
  {
    title: "Deep Learning for Climate Change Research",
    content: "Deep learning models are being used to analyze climate data, predict weather patterns, and optimize renewable energy systems. These AI tools help scientists understand and combat climate change.",
    url: "https://example.com/dl-climate",
    publishedAt: "2025-09-17T14:00:00Z"
  },
  {
    title: "Robotics and AI Integration",
    content: "The integration of AI and robotics is creating more intelligent and autonomous machines. These robots can learn from their environment and adapt to new tasks without explicit programming.",
    url: "https://example.com/robotics-ai",
    publishedAt: "2025-09-17T15:00:00Z"
  },
  {
    title: "Ethical Considerations in AI Development",
    content: "As AI becomes more powerful, ethical considerations around bias, privacy, and accountability become increasingly important. Developers must ensure AI systems are fair, transparent, and beneficial to society.",
    url: "https://example.com/ai-ethics",
    publishedAt: "2025-09-17T16:00:00Z"
  },
  {
    title: "Quantum Computing and AI",
    content: "Quantum computing promises to revolutionize AI by enabling faster processing of complex algorithms. Quantum machine learning could solve problems that are intractable for classical computers.",
    url: "https://example.com/quantum-ai",
    publishedAt: "2025-09-17T17:00:00Z"
  },
  {
    title: "AI in Education and Learning",
    content: "AI is transforming education through personalized learning platforms, intelligent tutoring systems, and automated grading. These tools adapt to individual student needs and learning styles.",
    url: "https://example.com/ai-education",
    publishedAt: "2025-09-17T18:00:00Z"
  },
  {
    title: "The Future of Work with AI",
    content: "AI is reshaping the job market, creating new opportunities while automating routine tasks. Workers need to adapt by developing skills that complement AI capabilities rather than compete with them.",
    url: "https://example.com/ai-future-work",
    publishedAt: "2025-09-17T19:00:00Z"
  }
];

// Mock embedding generator (creates random 1024-dimensional vectors)
function generateMockEmbedding(text) {
  const embedding = [];
  for (let i = 0; i < 1024; i++) {
    // Generate random values between -1 and 1
    embedding.push(Math.random() * 2 - 1);
  }
  return embedding;
}

// Function to chunk text into smaller pieces
function chunkText(text, chunkSize = 500, overlap = 50) {
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

async function uploadNewsData() {
  try {
    
    // Initialize services first
    await initializeServices();
    
    // Get services
    const services = getServices();
    
    // Process each news article
    const allVectors = [];
    
    for (let i = 0; i < newsArticles.length; i++) {
      const article = newsArticles[i];
      
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
            url: article.url,
            publishedAt: article.publishedAt,
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
    for (let i = 0; i < allVectors.length; i += batchSize) {
      const batch = allVectors.slice(i, i + batchSize);
      
      try {
        const result = await services.pinecone.upsertVectors(batch);
      } catch (error) {
        // Continue with next batch
      }
    }
    
    
    // Verify upload
    try {
      const stats = await services.pinecone.getIndexStats();
    } catch (error) {
    }
    
    // Test search
    const testQuery = "What is artificial intelligence?";
    const testEmbedding = generateMockEmbedding(testQuery);
    
    try {
      const searchResults = await services.pinecone.queryVectors(testEmbedding, 3);
      
      searchResults.matches?.forEach((match, index) => {
      });
    } catch (error) {
    }
    
    
  } catch (error) {
    throw error;
  }
}

// Run the upload if this script is executed directly
if (require.main === module) {
  uploadNewsData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

module.exports = { uploadNewsData };
