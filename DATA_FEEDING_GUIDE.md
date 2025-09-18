# 📰 **DATA FEEDING GUIDE - HOW THE AI GETS ITS KNOWLEDGE**

This document explains how data is fed into the VoiceBot system, including news ingestion, data sources, processing pipeline, and how the AI gains knowledge about AI, technology, healthcare, and other topics.

## **📋 TABLE OF CONTENTS**
1. [Data Sources Overview](#1-data-sources-overview)
2. [News Ingestion Pipeline](#2-news-ingestion-pipeline)
3. [Data Processing Flow](#3-data-processing-flow)
4. [Vector Database Storage](#4-vector-database-storage)
5. [RAG Pipeline Integration](#5-rag-pipeline-integration)
6. [Manual Data Upload](#6-manual-data-upload)
7. [Data Categories and Topics](#7-data-categories-and-topics)

---

## **1. DATA SOURCES OVERVIEW**

### **1.1 RSS News Feeds (Primary Source)**

The system automatically ingests news from multiple RSS feeds covering different topics:

```javascript
// backend-new/src/config/index.js
news: {
  rssFeeds: [
    'https://feeds.bbci.co.uk/news/rss.xml',        // BBC News - General news
    'https://rss.cnn.com/rss/edition.rss',          // CNN - International news
    'https://feeds.reuters.com/reuters/topNews',    // Reuters - Business & politics
    'https://feeds.npr.org/1001/rss.xml',           // NPR - Public radio news
    'https://feeds.feedburner.com/oreilly/radar'    // O'Reilly Radar - Tech insights
  ],
  maxArticles: 50,        // Maximum articles per ingestion cycle
  updateInterval: 3600000 // Update every hour (1 hour in milliseconds)
}
```

### **1.2 Data Categories Covered**

The RSS feeds provide comprehensive coverage of:

- **🤖 AI & Technology**: Latest AI developments, machine learning breakthroughs, tech innovations
- **🏥 Healthcare**: Medical AI applications, drug discovery, healthcare technology
- **💰 Finance**: Fintech innovations, AI in banking, trading algorithms
- **🌍 Current Events**: Global news, politics, economics, social issues
- **🔬 Research & Development**: Scientific breakthroughs, research papers, innovations
- **🏢 Business**: Industry trends, startup news, corporate developments

---

## **2. NEWS INGESTION PIPELINE**

### **2.1 Automatic Ingestion Process**

```javascript
// backend-new/src/services/newsService.js
async function ingestNews() {
  try {
    console.log('Starting news ingestion...');
    
    const allArticles = [];
    
    // Step 1: Fetch articles from all RSS feeds
    for (const feedUrl of config.news.rssFeeds) {
      const articles = await fetchRSSFeed(feedUrl);
      allArticles.push(...articles);
    }
    
    console.log(`Fetched ${allArticles.length} articles from RSS feeds`);
    
    // Step 2: Limit articles to prevent overload
    const limitedArticles = allArticles.slice(0, config.news.maxArticles);
    
    // Step 3: Process each article
    const processedArticles = [];
    for (const article of limitedArticles) {
      const processedArticle = await processArticle(article);
      if (processedArticle) {
        processedArticles.push(processedArticle);
      }
    }
    
    // Step 4: Create vectors and store in Pinecone
    let totalVectors = 0;
    for (const article of processedArticles) {
      const vectors = await createArticleVectors(article);
      if (vectors.length > 0) {
        await pineconeService.upsertVectors(vectors);
        totalVectors += vectors.length;
      }
    }
    
    console.log(`News ingestion completed. Stored ${totalVectors} vectors in Pinecone`);
    return { articlesProcessed: processedArticles.length, vectorsStored: totalVectors };
  } catch (error) {
    console.error('Error during news ingestion:', error);
    throw error;
  }
}
```

### **2.2 Scheduled Ingestion**

```javascript
// Automatic scheduling
function startIngestion() {
  // Run initial ingestion immediately
  ingestNews().catch(console.error);
  
  // Set up periodic ingestion every hour
  ingestionInterval = setInterval(() => {
    ingestNews().catch(console.error);
  }, config.news.updateInterval);
  
  console.log(`News ingestion scheduled every ${config.news.updateInterval / 1000 / 60} minutes`);
}
```

---

## **3. DATA PROCESSING FLOW**

### **3.1 RSS Feed Fetching**

```javascript
// Fetch RSS feed content
async function fetchRSSFeed(feedUrl) {
  try {
    console.log(`Fetching RSS feed: ${feedUrl}`);
    const feed = await parser.parseURL(feedUrl);
    return feed.items || [];
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    return [];
  }
}
```

**What happens:**
1. **RSS Parser**: Uses `rss-parser` library to fetch and parse RSS feeds
2. **Timeout Handling**: 10-second timeout per feed
3. **Error Recovery**: Continues with other feeds if one fails
4. **Data Extraction**: Extracts title, description, link, publication date

### **3.2 Article Content Scraping**

```javascript
// Scrape full article content from URLs
async function scrapeArticleContent(articleUrl) {
  try {
    const response = await axios.get(articleUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'VoiceBot News Ingestion Service/1.0'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside').remove();
    
    // Try to find main content using common selectors
    const contentSelectors = [
      'article',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content',
      'main',
      '.main-content',
      '[role="main"]'
    ];
    
    let content = '';
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        if (content.length > 200) { // Minimum content length
          break;
        }
      }
    }
    
    // Fallback to body if no specific content found
    if (!content || content.length < 200) {
      content = $('body').text().trim();
    }
    
    // Clean up content
    content = content
      .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
      .replace(/\n+/g, '\n')    // Replace multiple newlines with single newline
      .trim();
    
    return content;
  } catch (error) {
    console.error(`Error scraping article content from ${articleUrl}:`, error);
    return '';
  }
}
```

**What happens:**
1. **HTTP Request**: Fetches full article HTML
2. **Content Extraction**: Uses Cheerio to parse HTML and extract text
3. **Smart Selectors**: Tries multiple CSS selectors to find main content
4. **Content Cleaning**: Removes scripts, styles, navigation, and cleans up text
5. **Quality Check**: Ensures minimum content length (200 characters)

### **3.3 Article Processing**

```javascript
// Process individual article
async function processArticle(article) {
  try {
    const articleId = uuidv4();
    const content = await scrapeArticleContent(article.link);
    
    // Skip articles with insufficient content
    if (!content || content.length < 100) {
      console.log(`Skipping article with insufficient content: ${article.title}`);
      return null;
    }
    
    const articleData = {
      id: articleId,
      title: article.title || 'Untitled',
      description: article.contentSnippet || article.description || '',
      content: content,
      url: article.link,
      publishedDate: article.pubDate || new Date().toISOString(),
      source: article.link ? new URL(article.link).hostname : 'unknown',
      category: 'news'
    };
    
    return articleData;
  } catch (error) {
    console.error(`Error processing article: ${article.title}`, error);
    return null;
  }
}
```

**Article Data Structure:**
```javascript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "AI Breakthrough in Medical Diagnosis",
  description: "New AI system can diagnose diseases with 95% accuracy...",
  content: "Full article text content...",
  url: "https://example.com/article",
  publishedDate: "2024-01-01T10:00:00Z",
  source: "example.com",
  category: "news"
}
```

---

## **4. VECTOR DATABASE STORAGE**

### **4.1 Text Chunking**

```javascript
// Create manageable chunks from articles
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
```

**Chunking Strategy:**
- **Chunk Size**: 1000 characters per chunk
- **Overlap**: 200 characters overlap between chunks
- **Word Boundaries**: Breaks at word boundaries when possible
- **Context Preservation**: Overlap ensures context isn't lost

### **4.2 Embedding Generation**

```javascript
// Create embeddings for text chunks
async function createArticleVectors(article) {
  try {
    // Combine title, description, and content
    const fullText = `${article.title}\n\n${article.description}\n\n${article.content}`;
    const chunks = pineconeService.chunkText(fullText, config.rag.chunkSize, config.rag.chunkOverlap);
    
    if (chunks.length === 0) {
      console.log(`No chunks created for article: ${article.title}`);
      return [];
    }
    
    // Generate embeddings for all chunks
    const embeddings = await pineconeEmbeddingsService.getBatchEmbeddings(chunks);
    
    // Create vectors for Pinecone
    const vectors = chunks.map((chunk, index) => ({
      id: `${article.id}_chunk_${index}`,
      values: embeddings[index],  // 1024-dimensional vector
      metadata: {
        articleId: article.id,
        title: article.title,
        description: article.description,
        url: article.url,
        publishedDate: article.publishedDate,
        source: article.source,
        category: article.category,
        chunkIndex: index,
        chunkText: chunk,
        chunkLength: chunk.length
      }
    }));
    
    return vectors;
  } catch (error) {
    console.error(`Error creating vectors for article: ${article.title}`, error);
    return [];
  }
}
```

**Vector Structure:**
```javascript
{
  id: "article-123_chunk_0",
  values: [0.1, -0.3, 0.7, ...], // 1024-dimensional embedding
  metadata: {
    articleId: "article-123",
    title: "AI Breakthrough in Medical Diagnosis",
    description: "New AI system...",
    url: "https://example.com/article",
    publishedDate: "2024-01-01T10:00:00Z",
    source: "example.com",
    category: "news",
    chunkIndex: 0,
    chunkText: "AI systems are revolutionizing medical diagnosis...",
    chunkLength: 856
  }
}
```

### **4.3 Pinecone Storage**

```javascript
// Store vectors in Pinecone
await pineconeService.upsertVectors(vectors);

// Pinecone service implementation
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
```

---

## **5. RAG PIPELINE INTEGRATION**

### **5.1 Query Processing**

When a user asks a question, the system:

```javascript
// 1. Generate embedding for user query
const queryEmbedding = await pineconeEmbeddingsService.getEmbedding(userQuery);

// 2. Search Pinecone for relevant content
const searchResults = await pineconeService.queryVectors(queryEmbedding, 5);

// 3. Build context from search results
let relevantContext = '';
if (searchResults.matches && searchResults.matches.length > 0) {
  relevantContext = searchResults.matches.map((match, index) => {
    return `Article ${index + 1}: ${match.metadata.title}\n${match.metadata.chunkText}`;
  }).join('\n\n');
}
```

### **5.2 Context-Aware Response Generation**

```javascript
// Build comprehensive prompt with context
const systemPrompt = `You are a helpful AI assistant that answers questions based on news articles and current events. Use the provided context to give accurate and informative answers.

${relevantContext ? `Relevant News Articles:
${relevantContext}

` : ''}${conversationContext ? `Recent Conversation:
${conversationContext}

` : ''}Instructions:
- Answer based on the provided news articles when available
- If no relevant articles are found, provide a general helpful response
- Be conversational and engaging
- Cite specific articles when referencing information
- If you don't know something, say so honestly`;

// Generate response using Gemini
const response = await services.gemini.generateResponse(userQuery, systemPrompt);
```

---

## **6. MANUAL DATA UPLOAD**

### **6.1 API Endpoint for Manual Upload**

```javascript
// POST /api/news/upload - Manual article upload
router.post('/upload', [
  body('articles').isArray().withMessage('Articles must be an array'),
  body('articles.*.title').notEmpty().withMessage('Article title is required'),
  body('articles.*.content').notEmpty().withMessage('Article content is required'),
  body('articles.*.url').optional().isURL().withMessage('Article URL must be valid'),
  body('articles.*.publishedAt').optional().isISO8601().withMessage('Published date must be valid ISO8601')
], validateRequest, async (req, res) => {
  try {
    const { articles } = req.body;
    const services = getServices();
    
    console.log(`📰 Uploading ${articles.length} news articles...`);
    
    const allVectors = [];
    
    // Process each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`📰 Processing article ${i + 1}/${articles.length}: ${article.title}`);
      
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
            url: article.url || '',
            publishedAt: article.publishedAt || new Date().toISOString(),
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
    let uploadedCount = 0;
    
    for (let i = 0; i < allVectors.length; i += batchSize) {
      const batch = allVectors.slice(i, i + batchSize);
      await services.pinecone.upsertVectors(batch);
      uploadedCount += batch.length;
    }
    
    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedCount} vectors from ${articles.length} articles`,
      data: {
        articlesProcessed: articles.length,
        vectorsUploaded: uploadedCount,
        batchesProcessed: Math.ceil(allVectors.length / batchSize)
      }
    });
  } catch (error) {
    console.error('Error uploading news articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload news articles',
      message: error.message
    });
  }
});
```

### **6.2 Manual Upload Example**

```bash
# Upload articles via cURL
curl -X POST http://localhost:3001/api/news/upload \
  -H "Content-Type: application/json" \
  -d '{
    "articles": [
      {
        "title": "Latest AI Breakthrough in Healthcare",
        "content": "Researchers have developed a new AI system that can diagnose diseases with unprecedented accuracy...",
        "url": "https://example.com/ai-healthcare-breakthrough",
        "publishedAt": "2024-01-01T10:00:00Z"
      },
      {
        "title": "Machine Learning in Financial Services",
        "content": "Banks are increasingly adopting machine learning algorithms for risk assessment and fraud detection...",
        "url": "https://example.com/ml-finance",
        "publishedAt": "2024-01-01T11:00:00Z"
      }
    ]
  }'
```

---

## **7. DATA CATEGORIES AND TOPICS**

### **7.1 AI & Technology Coverage**

**Sources:**
- O'Reilly Radar (tech insights)
- BBC Technology section
- CNN Tech news
- Reuters technology coverage

**Topics Covered:**
- Machine learning breakthroughs
- Natural language processing advances
- Computer vision innovations
- Robotics developments
- AI ethics and policy
- Tech industry trends
- Startup innovations

### **7.2 Healthcare AI Coverage**

**Sources:**
- Medical news from all RSS feeds
- Healthcare technology articles
- Medical research publications

**Topics Covered:**
- AI in medical diagnosis
- Drug discovery using AI
- Medical imaging analysis
- Personalized medicine
- Healthcare automation
- Medical device innovations
- Clinical trial optimization

### **7.3 Finance & AI Coverage**

**Sources:**
- Reuters financial news
- Business sections of all feeds
- Fintech industry coverage

**Topics Covered:**
- Algorithmic trading
- Risk assessment AI
- Fraud detection systems
- Banking automation
- Cryptocurrency AI applications
- Insurance technology
- Payment processing innovations

### **7.4 Research & Development**

**Sources:**
- Academic news from all feeds
- Research institution updates
- Scientific breakthrough coverage

**Topics Covered:**
- Scientific discoveries
- Research methodology advances
- Academic publications
- Innovation in various fields
- Technology transfer
- Patent developments

---

## **8. DATA FLOW SUMMARY**

### **Complete Data Pipeline:**

```
1. RSS Feeds → 2. Article Fetching → 3. Content Scraping → 4. Text Chunking → 5. Embedding Generation → 6. Vector Storage → 7. RAG Query → 8. Context Retrieval → 9. AI Response
```

### **Data Sources:**
- **BBC News**: General news, technology, healthcare
- **CNN**: International news, business, tech
- **Reuters**: Business news, financial technology
- **NPR**: Public interest stories, research
- **O'Reilly Radar**: Deep tech insights, AI trends

### **Update Frequency:**
- **Automatic**: Every hour (configurable)
- **Manual**: Via API endpoint
- **Real-time**: New articles become available for queries immediately after ingestion

### **Data Quality:**
- **Content Filtering**: Minimum 200 characters per article
- **Source Verification**: Only from trusted news sources
- **Content Cleaning**: Removes ads, navigation, scripts
- **Chunking Strategy**: Preserves context with overlap

This comprehensive data feeding system ensures the AI has access to the latest, most relevant information across all major topics, enabling it to provide accurate, up-to-date responses about AI, technology, healthcare, finance, and current events.
