#!/bin/bash
# macOS start script
echo "Building Docker image..."
docker build -t prelegal-app .

# Check if there is an existing container
if [ "$(docker ps -a -q -f name=prelegal-container)" ]; then
    echo "Stopping and removing existing Prelegal container..."
    docker stop prelegal-container
    docker rm prelegal-container
fi

echo "Starting Prelegal container..."
if [ ! -f .env ]; then
    echo "Warning: .env not found. The app may fail to reach the AI without OPENROUTER_API_KEY."
fi
docker run -d --name prelegal-container --env-file .env -p 8000:8000 prelegal-app

echo "Prelegal is running at http://localhost:8000"
