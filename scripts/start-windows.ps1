# PowerShell start script for Windows
Write-Host "Building Docker image..." -ForegroundColor Cyan
docker build -t prelegal-app .

# Check if there is an existing container
$existing = docker ps -a -q --filter "name=prelegal-container"
if ($existing) {
    Write-Host "Stopping and removing existing Prelegal container..." -ForegroundColor Yellow
    docker stop prelegal-container
    docker rm prelegal-container
}

Write-Host "Starting Prelegal container..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Write-Host "Warning: .env not found. The app may fail to reach the AI without OPENROUTER_API_KEY." -ForegroundColor Yellow
}
docker run -d --name prelegal-container --env-file .env -p 8000:8000 prelegal-app

Write-Host "Prelegal is running at http://localhost:8000" -ForegroundColor Green
