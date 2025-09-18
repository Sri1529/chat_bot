#!/bin/bash

# Start Redis and Backend together
echo "🚀 Starting VoiceBot with Redis..."

# Start Redis in background
echo "📦 Starting Redis server..."
redis-server --daemonize yes --port 6379 --appendonly yes

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
while ! redis-cli ping > /dev/null 2>&1; do
  echo "Waiting for Redis..."
  sleep 1
done
echo "✅ Redis is ready!"

# Set Redis URL for the backend
export REDIS_URL="redis://localhost:6379/0"

# Start the backend
echo "🚀 Starting VoiceBot backend..."
exec npm start
