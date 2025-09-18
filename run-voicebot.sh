#!/bin/bash

echo "🚀 VoiceBot Docker Setup"
echo "========================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📋 Creating .env from template..."
    cp env.template .env
    echo "✅ .env file created from template"
    echo "🔧 Please edit .env file with your actual API keys before running again"
    echo ""
    echo "Required API keys:"
    echo "  - PINECONE_API_KEY"
    echo "  - GEMINI_API_KEY" 
    echo "  - OPENAI_API_KEY"
    echo ""
    exit 1
fi

# Load environment variables
source .env

# Check if required API keys are set
if [ -z "$PINECONE_API_KEY" ] || [ "$PINECONE_API_KEY" = "your_pinecone_api_key_here" ]; then
    echo "❌ PINECONE_API_KEY not set in .env file"
    exit 1
fi

if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your_gemini_api_key_here" ]; then
    echo "❌ GEMINI_API_KEY not set in .env file"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ]; then
    echo "❌ OPENAI_API_KEY not set in .env file"
    exit 1
fi

echo "✅ Environment variables loaded"

# Build and run with Docker Compose
echo "🐳 Building and starting VoiceBot..."
docker-compose up --build -d

echo ""
echo "🎉 VoiceBot is starting up!"
echo "=========================="
echo "🌐 Backend API: http://localhost:3001"
echo "🌐 Frontend: http://localhost:3000"
echo "📊 Redis: localhost:6379"
echo "📋 Health Check: http://localhost:3001/api/health"
echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
echo ""

# Wait a moment and check if services are running
echo "⏳ Waiting for services to start..."
sleep 10

# Check if backend is responding
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running and healthy!"
else
    echo "⚠️  Backend might still be starting up..."
    echo "📝 Check logs with: docker-compose logs -f voicebot"
fi

echo ""
echo "🎯 Test your VoiceBot:"
echo "curl -X POST http://localhost:3001/api/chat \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"message\":\"Hello!\",\"sessionId\":null}'"
