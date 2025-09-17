# 🚀 Quick Start Guide - Voice Chatbot

## 📋 Prerequisites
- Node.js 16+ and npm
- Python 3.11+
- AWS Account with S3 Vector Store access
- OpenAI API Key

## ⚡ Quick Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.template .env
# Edit .env with your AWS and OpenAI credentials
uvicorn app.main:app --host 0.0.0.0 --port 5001 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
PORT=5000 npm start
```

### 3. Access Application
- **Frontend**: http://localhost:5000
- **Backend**: http://localhost:5001

## 🎯 How It Works (Simple)

1. **Speak** → Click microphone and speak your question
2. **Process** → System converts speech to text
3. **Search** → Backend searches your vector database for relevant information
4. **Generate** → AI creates response based on found information
5. **Speak Back** → System converts response to speech and plays it

## 🔧 Environment Variables

Create `backend/.env`:
```bash
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_VECTOR_STORE_BUCKET=your_bucket
DOC_INDEX_NAME=vault-ai-index
OPENAI_API_KEY=your_openai_key
```

## 📁 Key Files

- **Frontend Voice**: `frontend/src/hooks/useVoiceToText.ts`
- **Backend Vector Search**: `backend/app/services/vector_store_service.py`
- **Backend LLM**: `backend/app/services/llm_service.py`
- **WebSocket Handler**: `backend/app/main.py`

## 🐳 Docker Setup (Alternative)

```bash
docker-compose up --build
```

## ❓ Troubleshooting

- **Voice not working**: Check browser permissions for microphone
- **No responses**: Verify AWS credentials and vector store setup
- **Connection issues**: Ensure both frontend (5000) and backend (5001) are running

For detailed API flow, see `API_FLOW_DOCUMENTATION.md`
