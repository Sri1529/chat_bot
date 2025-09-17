# 🧪 API Testing Guide - VoiceBot

This guide provides comprehensive testing scenarios and cURL commands for all VoiceBot API endpoints.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Health Check](#health-check)
- [Chat API Testing](#chat-api-testing)
- [News API Testing](#news-api-testing)
- [Session Management Testing](#session-management-testing)
- [Error Handling Testing](#error-handling-testing)
- [Performance Testing](#performance-testing)
- [Integration Testing](#integration-testing)

## 🔧 Prerequisites

### **Start Services**
```bash
# Terminal 1: Start Backend
cd backend-new
npm run dev

# Terminal 2: Start Frontend (optional for API testing)
cd frontend-new
npm start

# Terminal 3: Start Redis (if not using Docker)
redis-server
```

### **Verify Services**
```bash
# Check backend health
curl -X GET http://localhost:3001/api/health

# Check Redis connection
redis-cli ping

# Check if services are running
ps aux | grep -E "(node|redis)"
```

## 🏥 Health Check

### **Basic Health Check**
```bash
curl -X GET http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-17T10:30:00.000Z",
  "services": {
    "redis": "connected",
    "pinecone": "connected",
    "gemini": "connected"
  }
}
```

### **Detailed Health Check**
```bash
curl -X GET http://localhost:3001/api/health \
  -H "Accept: application/json" \
  -v
```

## 💬 Chat API Testing

### **1. Basic Chat Test**

#### **New Session Chat**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "message": "Hello, what can you tell me about AI?",
    "sessionId": null
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "message": "AI response about artificial intelligence...",
    "timestamp": "2025-01-17T10:30:00.000Z",
    "metadata": {
      "hasContext": true,
      "articles": [
        {
          "title": "AI Article Title",
          "score": 0.85
        }
      ]
    }
  }
}
```

#### **Continue Existing Session**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me more about machine learning",
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'
```

### **2. Different Query Types**

#### **News-Specific Query**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the latest developments in healthcare AI?",
    "sessionId": null
  }'
```

#### **General Knowledge Query**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the weather like today?",
    "sessionId": null
  }'
```

#### **Follow-up Question**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you explain that in simpler terms?",
    "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'
```

### **3. Edge Cases**

#### **Empty Message**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "",
    "sessionId": null
  }'
```

#### **Very Long Message**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "This is a very long message that tests the system with a lot of text to see how it handles lengthy inputs and whether it can process them correctly without any issues or errors occurring during the processing phase.",
    "sessionId": null
  }'
```

#### **Special Characters**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What about AI in 2024? @#$%^&*()_+{}|:<>?[]\\;'\",./",
    "sessionId": null
  }'
```

## 📰 News API Testing

### **1. Get All News Articles**
```bash
curl -X GET http://localhost:3001/api/news \
  -H "Accept: application/json"
```

### **2. Search News Articles**

#### **Basic Search**
```bash
curl -X GET "http://localhost:3001/api/news/search?query=AI" \
  -H "Accept: application/json"
```

#### **Search with Limit**
```bash
curl -X GET "http://localhost:3001/api/news/search?query=healthcare&limit=3" \
  -H "Accept: application/json"
```

#### **Search with Different Terms**
```bash
# Search for specific topics
curl -X GET "http://localhost:3001/api/news/search?query=machine%20learning" \
  -H "Accept: application/json"

curl -X GET "http://localhost:3001/api/news/search?query=robotics" \
  -H "Accept: application/json"

curl -X GET "http://localhost:3001/api/news/search?query=finance" \
  -H "Accept: application/json"
```

### **3. Get Specific Article**
```bash
curl -X GET http://localhost:3001/api/news/ARTICLE_ID \
  -H "Accept: application/json"
```

### **4. Upload News (RSS)**
```bash
curl -X POST http://localhost:3001/api/news/upload \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://feeds.bbci.co.uk/news/technology/rss.xml",
      "https://rss.cnn.com/rss/edition_technology.rss"
    ],
    "type": "rss"
  }'
```

## 🔄 Session Management Testing

### **1. Create New Session**
```bash
# First message creates session
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I am a new user",
    "sessionId": null
  }'
```

**Save the returned sessionId for next tests!**

### **2. Get Chat History**
```bash
curl -X GET http://localhost:3001/api/chat/history/SESSION_ID_HERE \
  -H "Accept: application/json"
```

### **3. Continue Conversation**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What did I ask you before?",
    "sessionId": "SESSION_ID_HERE"
  }'
```

### **4. Clear Chat History**
```bash
curl -X DELETE http://localhost:3001/api/chat/reset/SESSION_ID_HERE \
  -H "Accept: application/json"
```

### **5. Verify History Cleared**
```bash
curl -X GET http://localhost:3001/api/chat/history/SESSION_ID_HERE \
  -H "Accept: application/json"
```

## ❌ Error Handling Testing

### **1. Invalid Session ID**
```bash
curl -X GET http://localhost:3001/api/chat/history/invalid-session-id \
  -H "Accept: application/json"
```

### **2. Missing Required Fields**
```bash
# Missing message
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": null
  }'
```

### **3. Invalid JSON**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "test",
    "sessionId": null
    // Missing closing brace
```

### **4. Wrong HTTP Method**
```bash
curl -X GET http://localhost:3001/api/chat \
  -H "Accept: application/json"
```

### **5. Non-existent Endpoint**
```bash
curl -X GET http://localhost:3001/api/nonexistent \
  -H "Accept: application/json"
```

## ⚡ Performance Testing

### **1. Concurrent Requests**
```bash
# Test multiple simultaneous requests
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/chat \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"Test message $i\",\"sessionId\":null}" &
done
wait
```

### **2. Load Testing with Apache Bench**
```bash
# Install ab if not available
# brew install httpd (macOS)
# apt-get install apache2-utils (Ubuntu)

# Test chat endpoint
ab -n 100 -c 10 -p chat_data.json -T application/json http://localhost:3001/api/chat

# Create chat_data.json
echo '{"message":"Load test message","sessionId":null}' > chat_data.json
```

### **3. Response Time Testing**
```bash
# Test response time
time curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is artificial intelligence?",
    "sessionId": null
  }'
```

## 🔗 Integration Testing

### **1. Complete Chat Flow**
```bash
#!/bin/bash

# Step 1: Create session
echo "Creating new session..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I want to learn about AI",
    "sessionId": null
  }')

SESSION_ID=$(echo $RESPONSE | jq -r '.data.sessionId')
echo "Session created: $SESSION_ID"

# Step 2: Continue conversation
echo "Continuing conversation..."
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Tell me about machine learning\",
    \"sessionId\": \"$SESSION_ID\"
  }"

# Step 3: Get history
echo "Getting chat history..."
curl -X GET http://localhost:3001/api/chat/history/$SESSION_ID \
  -H "Accept: application/json"

# Step 4: Clear history
echo "Clearing chat history..."
curl -X DELETE http://localhost:3001/api/chat/reset/$SESSION_ID \
  -H "Accept: application/json"
```

### **2. News Integration Test**
```bash
#!/bin/bash

# Step 1: Search for news
echo "Searching for AI news..."
curl -X GET "http://localhost:3001/api/news/search?query=AI&limit=3"

# Step 2: Ask about specific news
echo "Asking about AI news..."
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the latest AI developments?",
    "sessionId": null
  }'
```

## 📊 Test Results Validation

### **Expected Response Patterns**

#### **Successful Chat Response**
- `success: true`
- `data.sessionId` is a valid UUID
- `data.message` contains AI response
- `data.timestamp` is valid ISO date
- `data.metadata.hasContext` is boolean

#### **Successful News Search**
- `success: true`
- `data.articles` is an array
- Each article has `title` and `score`
- `data.total` matches article count

#### **Error Response**
- `success: false`
- `error` contains error message
- Appropriate HTTP status code

### **Performance Benchmarks**
- Chat response time: < 3 seconds
- News search: < 1 second
- Health check: < 100ms
- Concurrent requests: Handle 10+ simultaneous

## 🐛 Debugging Tips

### **1. Check Backend Logs**
```bash
cd backend-new
npm run dev
# Watch console for errors
```

### **2. Test Individual Services**
```bash
# Test Redis
redis-cli ping

# Test Pinecone (replace with your key)
curl -X GET "https://api.pinecone.io/v1/indexes" \
  -H "Api-Key: YOUR_PINECONE_KEY"

# Test Gemini (replace with your key)
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_GEMINI_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### **3. Frontend Network Tab**
1. Open browser DevTools
2. Go to Network tab
3. Send a message
4. Check request/response details

### **4. Common Issues & Solutions**

#### **Backend Not Starting**
- Check if port 3001 is available
- Verify Redis is running
- Check .env file configuration

#### **CORS Errors**
- Verify frontend proxy setting
- Check CORS configuration in backend

#### **Session Not Persisting**
- Check Redis connection
- Verify session ID format
- Check localStorage in browser

---

## 🎯 Quick Test Checklist

- [ ] Health check returns 200
- [ ] Chat creates new session
- [ ] Chat continues existing session
- [ ] News search returns results
- [ ] Session history works
- [ ] Error handling works
- [ ] Performance is acceptable
- [ ] Frontend connects to backend

**Your VoiceBot APIs are fully tested! 🚀**
