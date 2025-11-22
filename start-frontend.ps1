# Start Frontend Server
Write-Host "`n🎨 Starting Frontend Server...`n" -ForegroundColor Green
Write-Host "Checking for node_modules..." -ForegroundColor Yellow

cd "s:\Program File\Snew\frontend"

if (!(Test-Path "node_modules")) {
    Write-Host "`n📦 Installing dependencies...`n" -ForegroundColor Cyan
    npm install
}

Write-Host "`n✓ Starting Vite dev server..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173`n" -ForegroundColor Cyan

npm run dev
