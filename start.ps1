# EventHub - Quick Start Script
Write-Host "🚀 Starting EventHub..." -ForegroundColor Cyan

# Start MongoDB via Docker (runs in background)
Write-Host "📦 Starting MongoDB..." -ForegroundColor Yellow
docker run -d --name eventhub-mongo -p 27017:27017 mongo:7 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "MongoDB container may already be running, continuing..." -ForegroundColor Yellow
}

Start-Sleep -Seconds 3

# Seed the database
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
Set-Location backend
node seed.js
Set-Location ..

# Start backend in new window
Write-Host "🛠️  Starting Backend on port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev"

Start-Sleep -Seconds 2

# Start frontend in new window
Write-Host "⚛️  Starting Frontend on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "✅ EventHub is starting up!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "📧 Demo Accounts:" -ForegroundColor Yellow
Write-Host "   Organizer: alice@eventhub.com / password123"
Write-Host "   Attendee:  bob@eventhub.com   / password123"
Write-Host "   Admin:     admin@eventhub.com / password123"
