# PowerShell stop script for Windows
Write-Host "Stopping Prelegal container..." -ForegroundColor Cyan
docker stop prelegal-container

Write-Host "Removing Prelegal container..." -ForegroundColor Cyan
docker rm prelegal-container

Write-Host "Prelegal container stopped and removed." -ForegroundColor Green
