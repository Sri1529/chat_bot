#!/bin/bash

# VoiceBot Quick Start Script
# This script helps you get the VoiceBot application running quickly

set -e

echo "🚀 VoiceBot Quick Start Script"
echo "================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.docker .env
    echo "⚠️  Please edit .env file with your API keys:"
    echo "   - PINECONE_API_KEY"
    echo "   - GEMINI_API_KEY"
    echo "   - JINA_API_KEY"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

echo "🔧 Starting services with Docker Compose..."

# Start services
docker-compose up -d

echo "⏳ Waiting for services to be ready..."

# Wait for backend to be healthy
echo "🔍 Checking backend health..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health/live > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    echo "⏳ Waiting for backend... ($i/30)"
    sleep 2
done

# Wait for frontend to be ready
echo "🔍 Checking frontend..."
for i in {1..15}; do
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    echo "⏳ Waiting for frontend... ($i/15)"
    sleep 2
done

echo ""
echo "🎉 VoiceBot is now running!"
echo "================================"
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:3000"
echo "📊 Health Check: http://localhost:3000/api/health"
echo "📚 API Docs: http://localhost:3000/api/docs"
echo ""
echo "💡 Tips:"
echo "   - Open http://localhost:3001 in your browser"
echo "   - Try asking: 'What are the latest technology trends?'"
echo "   - Use the microphone button for voice input"
echo "   - Check logs with: docker-compose logs -f"
echo ""
echo "🛑 To stop services: docker-compose down"
echo "🔄 To restart: docker-compose restart"
echo ""

# Optional: Seed news articles
read -p "🌱 Would you like to seed news articles? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📰 Seeding news articles..."
    docker-compose exec backend npm run seed
    echo "✅ News articles seeded!"
fi

echo "🎯 Ready to chat with your AI assistant!"