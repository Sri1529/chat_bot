const { initializeServices, getServices } = require('../services');
const { v4: uuidv4 } = require('uuid');

// Sample Q&A data
const qaData = [
  {
    question: "What is artificial intelligence?",
    answer: "Artificial Intelligence (AI) is a branch of computer science that aims to create machines and software that can perform tasks typically requiring human intelligence, such as learning, reasoning, problem-solving, perception, and language understanding."
  },
  {
    question: "How does machine learning work?",
    answer: "Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. It works by feeding data to algorithms that can identify patterns and make predictions or decisions."
  },
  {
    question: "What is the difference between AI and machine learning?",
    answer: "AI is the broader concept of machines being able to carry out tasks in a smart way, while machine learning is a specific subset of AI that focuses on the idea that machines should be able to learn and adapt through experience."
  },
  {
    question: "What are neural networks?",
    answer: "Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes (neurons) that process information by passing signals between each other, similar to how the human brain works."
  },
  {
    question: "What is deep learning?",
    answer: "Deep learning is a subset of machine learning that uses neural networks with multiple layers (deep neural networks) to model and understand complex patterns in data. It's particularly effective for tasks like image recognition, natural language processing, and speech recognition."
  },
  {
    question: "What is natural language processing?",
    answer: "Natural Language Processing (NLP) is a field of AI that focuses on the interaction between computers and humans through natural language. It involves teaching computers to understand, interpret, and generate human language in a valuable way."
  },
  {
    question: "What are the applications of AI?",
    answer: "AI has numerous applications including: autonomous vehicles, medical diagnosis, recommendation systems, fraud detection, virtual assistants, language translation, image and speech recognition, robotics, and many more across various industries."
  },
  {
    question: "What is computer vision?",
    answer: "Computer vision is a field of AI that trains computers to interpret and understand visual information from the world. It enables machines to identify and process objects, people, places, and actions in images and videos."
  },
  {
    question: "What is reinforcement learning?",
    answer: "Reinforcement learning is a type of machine learning where an agent learns to make decisions by performing actions in an environment to maximize cumulative reward. It's inspired by behavioral psychology and is used in robotics, gaming, and autonomous systems."
  },
  {
    question: "What are the ethical concerns with AI?",
    answer: "Key ethical concerns with AI include: bias and fairness in algorithms, privacy and data protection, job displacement, autonomous weapons, lack of transparency in decision-making, and the need for accountability and regulation in AI systems."
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

async function uploadQAData() {
  try {
    console.log('🚀 Starting Q&A data upload to Pinecone...');
    
    // Initialize services first
    console.log('🔧 Initializing services...');
    await initializeServices();
    console.log('✅ Services initialized');
    
    // Get services
    const services = getServices();
    
    // Generate mock embeddings for questions
    console.log('📝 Generating mock embeddings for questions...');
    const questionEmbeddings = qaData.map(item => generateMockEmbedding(item.question));
    
    // Prepare vectors for Pinecone
    const vectors = qaData.map((item, index) => ({
      id: uuidv4(),
      values: questionEmbeddings[index],
      metadata: {
        question: item.question,
        answer: item.answer,
        type: 'qa_pair',
        created_at: new Date().toISOString()
      }
    }));
    
    console.log(`📤 Uploading ${vectors.length} Q&A pairs to Pinecone...`);
    
    // Upload to Pinecone
    const result = await services.pinecone.upsertVectors(vectors);
    console.log('✅ Q&A data uploaded successfully!');
    console.log('📊 Upload result:', result);
    
    // Verify upload
    console.log('🔍 Verifying upload...');
    const stats = await services.pinecone.getIndexStats();
    console.log('📈 Index stats:', stats);
    
    // Test search
    console.log('🔍 Testing search functionality...');
    const testQuery = "What is AI?";
    const testEmbedding = generateMockEmbedding(testQuery);
    const searchResults = await services.pinecone.queryVectors(testEmbedding, 3);
    
    console.log('🔍 Search results for "What is AI?":');
    searchResults.matches?.forEach((match, index) => {
      console.log(`${index + 1}. Question: ${match.metadata.question}`);
      console.log(`   Answer: ${match.metadata.answer}`);
      console.log(`   Score: ${match.score}`);
      console.log('---');
    });
    
    console.log('🎉 Q&A data upload and testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error uploading Q&A data:', error);
    throw error;
  }
}

// Run the upload if this script is executed directly
if (require.main === module) {
  uploadQAData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { uploadQAData };
