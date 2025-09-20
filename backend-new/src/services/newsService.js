const axios = require('axios');
const Parser = require('rss-parser');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const pineconeService = require('./pineconeService');
const pineconeEmbeddingsService = require('./pineconeEmbeddingsService');

let parser = null;
let ingestionInterval = null;

async function initialize() {
  try {
    parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'VoiceBot News Ingestion Service/1.0'
      }
    });

    return parser;
  } catch (error) {
    throw error;
  }
}

async function fetchRSSFeed(feedUrl) {
  try {
    const feed = await parser.parseURL(feedUrl);
    return feed.items || [];
  } catch (error) {
    return [];
  }
}

async function scrapeArticleContent(articleUrl) {
  try {
    const response = await axios.get(articleUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'VoiceBot News Ingestion Service/1.0'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style, nav, header, footer, aside').remove();
    
    // Try to find main content
    let content = '';
    
    // Common selectors for article content
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
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();
    
    return content;
  } catch (error) {
    return '';
  }
}

async function processArticle(article) {
  try {
    const articleId = uuidv4();
    const content = await scrapeArticleContent(article.link);
    
    if (!content || content.length < 100) {
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
    return null;
  }
}

async function createArticleVectors(article) {
  try {
    // Create text chunks
    const fullText = `${article.title}\n\n${article.description}\n\n${article.content}`;
    const chunks = pineconeService.chunkText(fullText, config.rag.chunkSize, config.rag.chunkOverlap);
    
    if (chunks.length === 0) {
      return [];
    }
    
    // Generate embeddings for chunks
    const embeddings = await pineconeEmbeddingsService.getBatchEmbeddings(chunks);
    
    // Create vectors for Pinecone
    const vectors = chunks.map((chunk, index) => ({
      id: `${article.id}_chunk_${index}`,
      values: embeddings[index],
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
    return [];
  }
}

async function ingestNews() {
  try {
    
    const allArticles = [];
    
    // Fetch articles from all RSS feeds
    for (const feedUrl of config.news.rssFeeds) {
      const articles = await fetchRSSFeed(feedUrl);
      allArticles.push(...articles);
    }
    
    
    // Limit articles
    const limitedArticles = allArticles.slice(0, config.news.maxArticles);
    
    // Process articles
    const processedArticles = [];
    for (const article of limitedArticles) {
      const processedArticle = await processArticle(article);
      if (processedArticle) {
        processedArticles.push(processedArticle);
      }
    }
    
    
    // Create vectors and store in Pinecone
    let totalVectors = 0;
    for (const article of processedArticles) {
      const vectors = await createArticleVectors(article);
      if (vectors.length > 0) {
        await pineconeService.upsertVectors(vectors);
        totalVectors += vectors.length;
      }
    }
    
    return { articlesProcessed: processedArticles.length, vectorsStored: totalVectors };
  } catch (error) {
    throw error;
  }
}

function startIngestion() {
  // Run initial ingestion
  ingestNews().catch(() => {});
  
  // Set up periodic ingestion
  ingestionInterval = setInterval(() => {
    ingestNews().catch(() => {});
  }, config.news.updateInterval);
  
}

function stopIngestion() {
  if (ingestionInterval) {
    clearInterval(ingestionInterval);
    ingestionInterval = null;
  }
}

async function searchNews(query, topK = 5) {
  try {
    // Generate query embedding
    const queryEmbedding = await pineconeEmbeddingsService.getEmbedding(query);
    
    // Search in Pinecone
    const results = await pineconeService.queryVectors(
      queryEmbedding,
      topK,
      { category: { $eq: 'news' } }
    );
    
    return results.matches || [];
  } catch (error) {
    throw error;
  }
}

module.exports = {
  initialize,
  ingestNews,
  startIngestion,
  stopIngestion,
  searchNews,
  fetchRSSFeed,
  processArticle
};
