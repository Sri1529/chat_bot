# Voice Chatbot Setup Guide

This guide will walk you through setting up the voice-enabled chatbot application step by step.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 18+** and npm
- **Python 3.11+** and pip
- **Docker and Docker Compose** (optional, for containerized deployment)
- **Git** (for cloning the repository)

## 🔑 Required Accounts and Keys

You'll need accounts and API keys for:

1. **AWS Account** with S3 Vector Store access
2. **OpenAI Account** with API access
3. **Vector Database** (AWS S3 Vector Store)

## 🚀 Step-by-Step Setup

### Step 1: Environment Preparation

```bash
# Navigate to the project directory
cd /Users/agmac09/Desktop/official/chatbot

# Verify the project structure
ls -la
```

You should see:
```
chatbot/
├── frontend/
├── backend/
├── docker-compose.yml
└── README.md
```

### Step 2: Backend Setup

#### 2.1 Install Python Dependencies

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### 2.2 Configure Environment Variables

```bash
# Copy the example environment file
cp env.example .env

# Edit the environment file
nano .env  # or use your preferred editor
```

**Required Environment Variables:**

```env
# Application Configuration
DEBUG=false
APP_NAME=Voice Chatbot API
APP_VERSION=1.0.0

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_actual_aws_access_key
AWS_SECRET_ACCESS_KEY=your_actual_aws_secret_key
AWS_S3_VECTOR_STORE_BUCKET=your_actual_bucket_name

# OpenAI Configuration
OPENAI_API_KEY=your_actual_openai_api_key

# Vector Store Configuration
DOC_INDEX_NAME=vault-ai-index
EMBEDDING_MODEL_ID=amazon.titan-embed-text-v2:0
VECTOR_DIMENSION=512

# Voice Configuration
VOICE_ENABLED=true
DEFAULT_LANGUAGE=en-US

# CORS Configuration
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]
```

#### 2.3 Test Backend

```bash
# Start the backend server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Test the API:**
```bash
# In another terminal
curl http://localhost:8000/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Voice Chatbot API",
  "version": "1.0.0",
  "voice_enabled": true
}
```

### Step 3: Frontend Setup

#### 3.1 Install Node Dependencies

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
```

#### 3.2 Configure Frontend Environment

Create a `.env` file in the frontend directory:

```bash
# Create frontend environment file
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
EOF
```

#### 3.3 Start Frontend Development Server

```bash
# Start the React development server
npm start
```

The frontend should open automatically at http://localhost:3000

### Step 4: Verify Setup

#### 4.1 Check Backend Health

Visit http://localhost:8000/api/v1/health

#### 4.2 Check API Documentation

Visit http://localhost:8000/docs

#### 4.3 Test Frontend

1. Open http://localhost:3000
2. You should see the voice chatbot interface
3. Check the connection status (should show "Connected")

## 🐳 Docker Setup (Alternative)

If you prefer using Docker:

### Step 1: Prepare Environment

```bash
# Copy environment file
cp backend/env.example .env

# Edit with your actual credentials
nano .env
```

### Step 2: Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 3: Access Services

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔧 Configuration Details

### AWS S3 Vector Store Setup

1. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://your-vector-bucket-name
   ```

2. **Create Vector Index**:
   - Use AWS Console or CLI
   - Index name: `vault-ai-index`
   - Dimension: `512`
   - Metric: `cosine`

3. **Upload Sample Data** (optional):
   ```bash
   # Use the existing bublly-bot to upload sample FAQs
   cd ../bublly-bot
   python upload_products.py
   ```

### OpenAI API Setup

1. **Get API Key**:
   - Visit https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key to your `.env` file

2. **Verify API Access**:
   ```bash
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

## 🧪 Testing the Application

### Test Voice Functionality

1. **Enable Microphone**: Allow microphone access when prompted
2. **Click Microphone**: Start voice recording
3. **Speak**: Say something like "Hello, how are you?"
4. **Check Response**: Verify the AI responds with voice

### Test Text Functionality

1. **Type Message**: Enter text in the input field
2. **Send**: Press Enter or click send
3. **Check Response**: Verify the AI responds

### Test WebSocket Connection

1. **Open Browser Console**: F12 → Console
2. **Check Connection**: Look for WebSocket connection messages
3. **Test Reconnection**: Disconnect and reconnect to test auto-reconnection

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Backend Won't Start

**Error**: `ModuleNotFoundError: No module named 'app'`

**Solution**:
```bash
# Make sure you're in the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run from the correct directory
python -m uvicorn app.main:app --reload
```

#### 2. Frontend Build Errors

**Error**: `Cannot find module` errors

**Solution**:
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. WebSocket Connection Failed

**Error**: `WebSocket connection failed`

**Solution**:
- Check if backend is running on port 8000
- Verify CORS configuration in backend
- Check browser console for detailed errors

#### 4. Voice Recognition Not Working

**Error**: Voice recognition not responding

**Solution**:
- Ensure HTTPS in production (Web Speech API requires secure context)
- Check browser permissions for microphone
- Verify browser support (Chrome, Edge, Safari)

#### 5. AWS/OpenAI API Errors

**Error**: `AWS credentials not found` or `OpenAI API error`

**Solution**:
- Verify `.env` file has correct credentials
- Check AWS credentials have proper permissions
- Verify OpenAI API key is valid and has credits

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Backend
DEBUG=true python -m uvicorn app.main:app --reload

# Frontend
REACT_APP_DEBUG=true npm start
```

### Log Files

Check log files for detailed error information:

```bash
# Backend logs
tail -f backend/logs/app.log
tail -f backend/logs/error.log

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🚀 Production Deployment

### Environment Variables for Production

```env
DEBUG=false
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=production_key
AWS_SECRET_ACCESS_KEY=production_secret
AWS_S3_VECTOR_STORE_BUCKET=prod-vector-bucket
OPENAI_API_KEY=production_openai_key
BACKEND_CORS_ORIGINS=["https://yourdomain.com"]
```

### Security Considerations

1. **Use HTTPS**: Required for Web Speech API
2. **Secure API Keys**: Use environment variables or secret management
3. **CORS Configuration**: Restrict to your domain
4. **Rate Limiting**: Implement rate limiting for API endpoints

### Scaling

1. **Backend**: Use multiple workers with Gunicorn
2. **Frontend**: Use CDN for static assets
3. **Load Balancing**: Use nginx or cloud load balancer
4. **Monitoring**: Add application monitoring

## 📞 Support

If you encounter issues:

1. **Check Logs**: Review backend and frontend logs
2. **Verify Configuration**: Ensure all environment variables are correct
3. **Test Components**: Test backend and frontend separately
4. **Check Dependencies**: Ensure all dependencies are installed correctly

## 🎉 Success!

Once everything is working, you should have:

- ✅ Backend running on http://localhost:8000
- ✅ Frontend running on http://localhost:3000
- ✅ WebSocket connection established
- ✅ Voice recognition working
- ✅ AI responses with voice output
- ✅ Vector similarity search functioning

Enjoy your voice-enabled chatbot! 🎤🤖
