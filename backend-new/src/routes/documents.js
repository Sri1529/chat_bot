const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getServices } = require('../services');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept text files, PDFs, and common document formats
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
      'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only text, PDF, Word, and Markdown files are allowed.'));
    }
  }
});

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

// Function to extract text from different file types
async function extractTextFromFile(filePath, mimetype) {
  try {
    if (mimetype === 'text/plain' || mimetype === 'text/markdown') {
      return await fs.readFile(filePath, 'utf8');
    } else if (mimetype === 'application/json') {
      const content = await fs.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(content);
      return JSON.stringify(jsonData, null, 2);
    } else if (mimetype === 'application/pdf') {
      // For PDF, you would need a PDF parser like pdf-parse
      // For now, return a placeholder
      return `[PDF content from ${path.basename(filePath)} - PDF parsing not implemented yet]`;
    } else if (mimetype.includes('word')) {
      // For Word documents, you would need a Word parser
      // For now, return a placeholder
      return `[Word document content from ${path.basename(filePath)} - Word parsing not implemented yet]`;
    }
    
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw error;
  }
}

// Function to chunk text
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

// POST /api/documents/upload - Upload and process documents
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const services = getServices();
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const mimetype = req.file.mimetype;


    // Extract text from file
    const textContent = await extractTextFromFile(filePath, mimetype);
    
    if (!textContent || textContent.trim().length < 100) {
      // Clean up file
      await fs.unlink(filePath);
      return res.status(400).json({
        success: false,
        error: 'Document content too short or empty'
      });
    }

    // Create document metadata
    const documentId = uuidv4();
    const documentData = {
      id: documentId,
      title: fileName,
      content: textContent,
      fileName: fileName,
      fileSize: fileSize,
      mimetype: mimetype,
      uploadedAt: new Date().toISOString(),
      category: req.body.category || 'general'
    };

    // Chunk the document
    const chunks = chunkText(textContent, 1000, 200);

    // Generate embeddings for chunks
    const embeddings = await services.pineconeEmbeddings.getBatchEmbeddings(chunks);

    // Create vectors for Pinecone
    const vectors = chunks.map((chunk, index) => ({
      id: `${documentId}_chunk_${index}`,
      values: embeddings[index],
      metadata: {
        documentId: documentId,
        title: fileName,
        content: chunk,
        fullContent: textContent,
        fileName: fileName,
        fileSize: fileSize,
        mimetype: mimetype,
        uploadedAt: documentData.uploadedAt,
        category: documentData.category,
        chunkIndex: index,
        totalChunks: chunks.length,
        type: 'document',
        created_at: new Date().toISOString()
      }
    }));

    // Upload to Pinecone
    await services.pinecone.upsertVectors(vectors);

    // Clean up uploaded file
    await fs.unlink(filePath);

    res.json({
      success: true,
      message: `Document "${fileName}" processed and uploaded successfully`,
      data: {
        documentId: documentId,
        fileName: fileName,
        fileSize: fileSize,
        chunksCreated: chunks.length,
        vectorsUploaded: vectors.length,
        category: documentData.category,
        uploadedAt: documentData.uploadedAt
      }
    });

  } catch (error) {
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process document',
      message: error.message
    });
  }
});

// POST /api/documents/text - Upload text content directly
router.post('/text', [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').optional().isString().withMessage('Category must be a string')
], validateRequest, async (req, res) => {
  try {
    const { title, content, category = 'general' } = req.body;
    const services = getServices();


    if (content.trim().length < 100) {
      return res.status(400).json({
        success: false,
        error: 'Content too short (minimum 100 characters)'
      });
    }

    // Create document metadata
    const documentId = uuidv4();
    const documentData = {
      id: documentId,
      title: title,
      content: content,
      uploadedAt: new Date().toISOString(),
      category: category
    };

    // Chunk the content
    const chunks = chunkText(content, 1000, 200);

    // Generate embeddings for chunks
    const embeddings = await services.pineconeEmbeddings.getBatchEmbeddings(chunks);

    // Create vectors for Pinecone
    const vectors = chunks.map((chunk, index) => ({
      id: `${documentId}_chunk_${index}`,
      values: embeddings[index],
      metadata: {
        documentId: documentId,
        title: title,
        content: chunk,
        fullContent: content,
        uploadedAt: documentData.uploadedAt,
        category: category,
        chunkIndex: index,
        totalChunks: chunks.length,
        type: 'text_document',
        created_at: new Date().toISOString()
      }
    }));

    // Upload to Pinecone
    await services.pinecone.upsertVectors(vectors);

    res.json({
      success: true,
      message: `Text document "${title}" processed and uploaded successfully`,
      data: {
        documentId: documentId,
        title: title,
        chunksCreated: chunks.length,
        vectorsUploaded: vectors.length,
        category: category,
        uploadedAt: documentData.uploadedAt
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process text document',
      message: error.message
    });
  }
});

// GET /api/documents/search - Search documents
router.get('/search', async (req, res) => {
  try {
    const { query: searchQuery, category, limit = 5 } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const services = getServices();

    // Generate query embedding
    const queryEmbedding = await services.pineconeEmbeddings.getEmbedding(searchQuery);

    // Build filter for Pinecone
    const filter = { type: { $in: ['document', 'text_document'] } };
    if (category) {
      filter.category = { $eq: category };
    }

    // Search Pinecone
    const searchResults = await services.pinecone.queryVectors(
      queryEmbedding,
      parseInt(limit),
      filter
    );

    const documents = searchResults.matches?.map(match => ({
      id: match.id,
      documentId: match.metadata.documentId,
      title: match.metadata.title,
      content: match.metadata.content,
      fileName: match.metadata.fileName,
      category: match.metadata.category,
      uploadedAt: match.metadata.uploadedAt,
      chunkIndex: match.metadata.chunkIndex,
      totalChunks: match.metadata.totalChunks,
      score: match.score
    })) || [];

    res.json({
      success: true,
      data: {
        query: searchQuery,
        documents,
        totalFound: documents.length,
        category: category || 'all'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search documents',
      message: error.message
    });
  }
});

// GET /api/documents/stats - Get document statistics
router.get('/stats', async (req, res) => {
  try {
    const services = getServices();
    
    // Get index stats
    const stats = await services.pinecone.getIndexStats();
    
    res.json({
      success: true,
      data: {
        totalVectors: stats.totalVectorCount || 0,
        message: 'Document statistics retrieved successfully'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get document statistics',
      message: error.message
    });
  }
});

module.exports = router;
