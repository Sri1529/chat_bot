#!/bin/bash

echo "🐳 Building VoiceBot Docker Image with Redis..."

# Build the Docker image
docker build -f backend-new/Dockerfile.with-redis -t voicebot-with-redis ./backend-new

echo "✅ Docker image built successfully!"

echo "🚀 Starting VoiceBot with Redis..."

# Run the Docker container
docker run -d \
  --name voicebot-app \
  -p 3001:3001 \
  -p 6379:6379 \
  -e PINECONE_API_KEY="$PINECONE_API_KEY" \
  -e GEMINI_API_KEY="$GEMINI_API_KEY" \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  voicebot-with-redis

echo "✅ VoiceBot is running!"
echo "🌐 Backend: http://localhost:3001"
echo "📊 Redis: localhost:6379"
echo "📋 Health Check: http://localhost:3001/api/health"

echo ""
echo "📝 To view logs: docker logs -f voicebot-app"
echo "🛑 To stop: docker stop voicebot-app"
echo "🗑️ To remove: docker rm voicebot-app"
