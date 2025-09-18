# 🚀 **REAL-TIME RAG SYSTEM - DOCUMENT UPLOAD & VECTOR SEARCH**

This guide explains how to use the real-time RAG system with document upload capabilities and real vector search functionality.

## **📋 TABLE OF CONTENTS**
1. [System Overview](#1-system-overview)
2. [Document Upload Methods](#2-document-upload-methods)
3. [Real Vector Search](#3-real-vector-search)
4. [API Endpoints](#4-api-endpoints)
5. [Usage Examples](#5-usage-examples)
6. [Document Categories](#6-document-categories)

---

## **1. SYSTEM OVERVIEW**

### **What Changed:**
- ✅ **Real Embeddings**: Replaced mock embeddings with OpenAI API
- ✅ **Document Upload**: Upload files and text directly
- ✅ **Real-time Processing**: Documents processed immediately
- ✅ **Vector Search**: Semantic similarity search using real embeddings
- ✅ **Chunking**: Smart text chunking with overlap
- ✅ **Categories**: Organize documents by topic

### **How It Works:**
```
1. Upload Document → 2. Extract Text → 3. Chunk Text → 4. Generate Embeddings → 5. Store in Pinecone → 6. Real-time Search
```

---

## **2. DOCUMENT UPLOAD METHODS**

### **Method 1: File Upload (Recommended)**

Upload actual files like PDFs, Word docs, text files, etc.

```bash
# Upload a document file
curl -X POST http://localhost:3001/api/documents/upload \
  -F "document=@/path/to/your/document.pdf" \
  -F "category=healthcare"
```

**Supported File Types:**
- 📄 **Text files** (.txt, .md)
- 📊 **PDF files** (.pdf)
- 📝 **Word documents** (.doc, .docx)
- 📋 **JSON files** (.json)

### **Method 2: Direct Text Upload**

Upload text content directly without files.

```bash
# Upload text content
curl -X POST http://localhost:3001/api/documents/text \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI in Healthcare Research",
    "content": "Artificial intelligence is revolutionizing healthcare...",
    "category": "healthcare"
  }'
```

---

## **3. REAL VECTOR SEARCH**

### **How Real Embeddings Work:**

```javascript
// Real embedding generation
async function generateRealEmbedding(text) {
  const services = getServices();
  const embedding = await services.pineconeEmbeddings.getEmbedding(text);
  return embedding; // Real 1024-dimensional vector
}
```

**Real Embedding Characteristics:**
- **Semantic Understanding**: Similar texts get similar vectors
- **Contextual**: "AI" and "artificial intelligence" get similar embeddings
- **Consistent**: Same text always gets same vector
- **Meaningful**: Vectors represent actual text meaning

### **Vector Search Process:**

```javascript
// 1. User asks: "What is AI in healthcare?"
// 2. Generate embedding for query
const queryEmbedding = await generateRealEmbedding("What is AI in healthcare?");

// 3. Search Pinecone for similar vectors
const searchResults = await services.pinecone.queryVectors(queryEmbedding, 5);

// 4. Get relevant document chunks
const relevantChunks = searchResults.matches.map(match => match.metadata.content);

// 5. Provide context to LLM
const context = relevantChunks.join('\n\n');
const response = await gemini.generateResponse(userQuery, context);
```

---

## **4. API ENDPOINTS**

### **4.1 Document Upload Endpoints**

#### **POST /api/documents/upload**
Upload a file document.

**Request:**
```bash
curl -X POST http://localhost:3001/api/documents/upload \
  -F "document=@document.pdf" \
  -F "category=healthcare"
```

**Response:**
```json
{
  "success": true,
  "message": "Document \"document.pdf\" processed and uploaded successfully",
  "data": {
    "documentId": "550e8400-e29b-41d4-a716-446655440000",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "chunksCreated": 15,
    "vectorsUploaded": 15,
    "category": "healthcare",
    "uploadedAt": "2024-01-01T10:00:00Z"
  }
}
```

#### **POST /api/documents/text**
Upload text content directly.

**Request:**
```bash
curl -X POST http://localhost:3001/api/documents/text \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Research Paper",
    "content": "This paper discusses the latest advances in artificial intelligence...",
    "category": "ai"
  }'
```

### **4.2 Search Endpoints**

#### **GET /api/documents/search**
Search uploaded documents.

**Request:**
```bash
curl "http://localhost:3001/api/documents/search?query=artificial%20intelligence&category=healthcare&limit=5"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "artificial intelligence",
    "documents": [
      {
        "id": "doc123_chunk_0",
        "documentId": "doc123",
        "title": "AI in Healthcare",
        "content": "Artificial intelligence is transforming healthcare...",
        "category": "healthcare",
        "score": 0.95,
        "chunkIndex": 0,
        "totalChunks": 15
      }
    ],
    "totalFound": 5,
    "category": "healthcare"
  }
}
```

#### **GET /api/documents/stats**
Get document statistics.

**Request:**
```bash
curl http://localhost:3001/api/documents/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVectors": 1500,
    "message": "Document statistics retrieved successfully"
  }
}
```

### **4.3 Chat Endpoint (Updated)**

#### **POST /api/chat**
Chat with real vector search.

**Request:**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the latest AI developments in healthcare?",
    "sessionId": "your-session-id"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Based on the latest research, AI is revolutionizing healthcare in several ways...",
    "timestamp": "2024-01-01T10:00:00Z",
    "metadata": {
      "searchResults": 5,
      "hasContext": true,
      "articles": [
        {
          "title": "AI in Medical Diagnosis",
          "score": 0.95
        }
      ]
    }
  }
}
```

---

## **5. USAGE EXAMPLES**

### **5.1 Upload Healthcare Documents**

```bash
# Upload multiple healthcare documents
curl -X POST http://localhost:3001/api/documents/upload \
  -F "document=@medical_ai_research.pdf" \
  -F "category=healthcare"

curl -X POST http://localhost:3001/api/documents/upload \
  -F "document=@drug_discovery_ai.docx" \
  -F "category=healthcare"

curl -X POST http://localhost:3001/api/documents/text \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI in Medical Imaging",
    "content": "Artificial intelligence is being used to analyze medical images with unprecedented accuracy...",
    "category": "healthcare"
  }'
```

### **5.2 Upload AI Technology Documents**

```bash
# Upload AI technology documents
curl -X POST http://localhost:3001/api/documents/upload \
  -F "document=@machine_learning_guide.pdf" \
  -F "category=ai"

curl -X POST http://localhost:3001/api/documents/text \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Latest AI Breakthroughs",
    "content": "Recent developments in artificial intelligence include...",
    "category": "ai"
  }'
```

### **5.3 Upload Finance Documents**

```bash
# Upload finance documents
curl -X POST http://localhost:3001/api/documents/upload \
  -F "document=@fintech_ai_report.pdf" \
  -F "category=finance"

curl -X POST http://localhost:3001/api/documents/text \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI in Banking",
    "content": "Banks are adopting AI for fraud detection and risk assessment...",
    "category": "finance"
  }'
```

### **5.4 Chat with Uploaded Documents**

```bash
# Ask about healthcare AI
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How is AI being used in medical diagnosis?",
    "sessionId": "healthcare-session"
  }'

# Ask about AI technology
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the latest machine learning techniques?",
    "sessionId": "ai-session"
  }'

# Ask about finance AI
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How is AI changing the banking industry?",
    "sessionId": "finance-session"
  }'
```

---

## **6. DOCUMENT CATEGORIES**

### **6.1 Healthcare Category**
- Medical AI research papers
- Drug discovery documents
- Medical imaging studies
- Healthcare technology reports
- Clinical trial data

### **6.2 AI Category**
- Machine learning papers
- AI research articles
- Technology reports
- Algorithm documentation
- AI ethics papers

### **6.3 Finance Category**
- Fintech reports
- Banking AI studies
- Trading algorithm papers
- Risk assessment documents
- Payment system research

### **6.4 General Category**
- News articles
- Research papers
- Technical documentation
- Educational content
- Industry reports

---

## **7. REAL-TIME WORKFLOW**

### **Complete Workflow Example:**

```bash
# 1. Upload healthcare document
curl -X POST http://localhost:3001/api/documents/upload \
  -F "document=@healthcare_ai.pdf" \
  -F "category=healthcare"

# Response: Document processed, 15 chunks created, 15 vectors uploaded

# 2. Ask question about healthcare AI
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the benefits of AI in healthcare?",
    "sessionId": "healthcare-session"
  }'

# Response: AI provides context-aware answer based on uploaded document
```

### **What Happens Behind the Scenes:**

1. **Document Upload**: File uploaded and text extracted
2. **Text Chunking**: Content split into 1000-character chunks with 200-character overlap
3. **Embedding Generation**: Each chunk converted to 1024-dimensional vector using OpenAI
4. **Vector Storage**: Vectors stored in Pinecone with metadata
5. **Query Processing**: User question converted to embedding
6. **Similarity Search**: Pinecone finds most similar document chunks
7. **Context Building**: Relevant chunks combined into context
8. **LLM Generation**: Gemini generates response using context

---

## **8. BENEFITS OF REAL-TIME RAG**

### **✅ Advantages:**
- **Real-time Updates**: Upload documents and query immediately
- **Semantic Search**: Find relevant content based on meaning, not keywords
- **Context-Aware**: AI responses based on actual document content
- **Scalable**: Handle large documents with smart chunking
- **Organized**: Categorize documents by topic
- **Accurate**: Real embeddings provide meaningful similarity

### **🚀 Use Cases:**
- **Research Assistant**: Upload papers and ask questions
- **Document Q&A**: Query specific documents
- **Knowledge Base**: Build searchable knowledge from documents
- **Content Analysis**: Find relevant information across documents
- **Real-time Learning**: Continuously add new information

This real-time RAG system provides you with a powerful document-based AI assistant that can understand and answer questions based on your uploaded content!
