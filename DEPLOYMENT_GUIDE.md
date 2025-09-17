# 🚀 Deployment Guide - VoiceBot

This guide will help you deploy your VoiceBot application to Render and other platforms.

## 📋 Prerequisites

- GitHub repository with your code
- Render.com account
- API keys for external services

## 🔧 **Fix 1: Environment Variables**

### **Required Environment Variables for Render:**

Add these environment variables in your Render dashboard:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-url.netlify.app

# Redis Configuration (Use Render Redis addon)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=voicebot-index
PINECONE_DIMENSION=1024

# Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7

# OpenAI Configuration (for embeddings)
OPENAI_API_KEY=your_openai_api_key_here

# RAG Configuration
RAG_TOP_K=5
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200

# Session Configuration
SESSION_TTL=3600
SESSION_MAX_MESSAGES=100

# News Configuration
NEWS_MAX_ARTICLES=50
NEWS_UPDATE_INTERVAL=3600000
```

## 🔧 **Fix 2: Node.js Compatibility Issues**

The `undici` package has compatibility issues with Node.js 18. We've updated the package.json to require Node.js 20+.

### **Updated package.json:**
- Node.js version: `>=20.0.0`
- Updated all dependencies to latest versions
- Added explicit OpenAI dependency

## 🚀 **Deployment Steps**

### **Step 1: Deploy Backend to Render**

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Connect your GitHub account
   - Select `Sri1529/chat_bot` repository
   - Choose `backend-new` as the root directory

3. **Configure Service**
   - **Name**: `voicebot-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: `20`

4. **Add Environment Variables**
   - Copy all the environment variables from above
   - Paste them in the "Environment Variables" section
   - Replace placeholder values with your actual API keys

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

### **Step 2: Deploy Frontend to Netlify**

1. **Go to Netlify Dashboard**
   - Visit [netlify.com](https://netlify.com)
   - Click "New site from Git"

2. **Connect Repository**
   - Connect your GitHub account
   - Select `Sri1529/chat_bot` repository
   - Choose `frontend-new` as the base directory

3. **Configure Build**
   - **Build Command**: `npm run build`
   - **Publish Directory**: `build`
   - **Node Version**: `20`

4. **Add Environment Variables**
   - `REACT_APP_API_URL`: `https://your-backend-url.onrender.com/api`

5. **Deploy**
   - Click "Deploy site"
   - Wait for deployment to complete

## 🔧 **Troubleshooting**

### **Issue 1: Missing Environment Variables**
```
❌ Missing required environment variables: [ 'PINECONE_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY' ]
```

**Solution:**
- Add all required environment variables in Render dashboard
- Make sure variable names match exactly (case-sensitive)
- Restart the service after adding variables

### **Issue 2: Node.js Compatibility**
```
ReferenceError: File is not defined
```

**Solution:**
- Updated package.json to require Node.js 20+
- Updated all dependencies to latest versions
- This should resolve the undici compatibility issue

### **Issue 3: Redis Connection**
```
Redis connection failed
```

**Solution:**
- Add Redis addon in Render dashboard
- Update `REDIS_URL` environment variable
- Use the Redis URL provided by Render

### **Issue 4: CORS Errors**
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Solution:**
- Update `FRONTEND_URL` environment variable in backend
- Make sure CORS is properly configured
- Check that frontend URL matches exactly

## 📊 **Monitoring and Logs**

### **Render Logs**
- Go to your service dashboard
- Click "Logs" tab
- Monitor for errors and warnings

### **Health Check**
- Test your backend: `https://your-backend-url.onrender.com/api/health`
- Should return: `{"status":"healthy","timestamp":"...","services":{...}}`

### **API Testing**
```bash
# Test chat endpoint
curl -X POST https://your-backend-url.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","sessionId":null}'

# Test health endpoint
curl -X GET https://your-backend-url.onrender.com/api/health
```

## 🔄 **Continuous Deployment**

### **Automatic Deploys**
- Render automatically deploys when you push to main branch
- Netlify automatically deploys when you push to main branch
- No manual intervention needed

### **Manual Deploys**
- Go to service dashboard
- Click "Manual Deploy"
- Select branch and deploy

## 🛡️ **Security Best Practices**

### **Environment Variables**
- Never commit `.env` files to Git
- Use strong, unique API keys
- Rotate keys regularly
- Use different keys for different environments

### **API Security**
- Enable rate limiting
- Use HTTPS only
- Validate all inputs
- Monitor for abuse

### **Database Security**
- Use connection strings with authentication
- Enable SSL/TLS
- Regular backups
- Monitor access logs

## 📈 **Performance Optimization**

### **Backend Optimization**
- Enable compression
- Use Redis for caching
- Optimize database queries
- Monitor response times

### **Frontend Optimization**
- Enable CDN
- Optimize bundle size
- Use lazy loading
- Enable caching

## 🎯 **Success Checklist**

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Netlify
- [ ] All environment variables set
- [ ] Health check passing
- [ ] API endpoints working
- [ ] CORS configured correctly
- [ ] Redis connected
- [ ] Pinecone connected
- [ ] Gemini API working
- [ ] Frontend connecting to backend

## 🆘 **Support**

If you encounter issues:

1. **Check Logs**: Look at Render and Netlify logs
2. **Test Locally**: Make sure it works locally first
3. **Check Environment**: Verify all environment variables
4. **API Keys**: Ensure all API keys are valid
5. **Network**: Check if services can reach each other

**Your VoiceBot should now be successfully deployed! 🚀**
