#!/bin/bash
# macOS stop script
echo "Stopping Prelegal container..."
docker stop prelegal-container

echo "Removing Prelegal container..."
docker rm prelegal-container

echo "Prelegal container stopped and removed."
