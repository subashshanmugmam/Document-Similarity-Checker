# Quick Setup Script for Document Similarity Checker
# Run this script to set up and test the entire application

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Document Similarity Checker - Quick Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Python version
Write-Host "1. Checking Python version..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
Write-Host "   Found: $pythonVersion" -ForegroundColor Green

if ($pythonVersion -notmatch "Python 3\.10") {
    Write-Host "   WARNING: Python 3.10.x is required!" -ForegroundColor Red
    Write-Host "   Current version may cause compatibility issues." -ForegroundColor Red
    $continue = Read-Host "   Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
}

# Check Node.js
Write-Host ""
Write-Host "2. Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "   Found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "   Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Setup Backend
Write-Host ""
Write-Host "3. Setting up Backend..." -ForegroundColor Yellow
Push-Location backend

# Run verification script
Write-Host "   Running prerequisite checks..." -ForegroundColor Cyan
python verify_setup.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERROR: Prerequisites check failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Install dependencies
Write-Host "   Installing Python dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Backend setup complete!" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Failed to install backend dependencies!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# Setup Frontend
Write-Host ""
Write-Host "4. Setting up Frontend..." -ForegroundColor Yellow
Push-Location frontend

Write-Host "   Installing Node.js dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Frontend setup complete!" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Failed to install frontend dependencies!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# Create .env file if it doesn't exist
Write-Host ""
Write-Host "5. Checking configuration..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Write-Host "   Creating .env file from template..." -ForegroundColor Cyan
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "   .env file created!" -ForegroundColor Green
} else {
    Write-Host "   .env file already exists" -ForegroundColor Green
}

# Success message
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the backend server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   python main.py" -ForegroundColor Gray
Write-Host ""
Write-Host "2. In a new terminal, start the frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open your browser:" -ForegroundColor White
Write-Host "   http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - QUICK_START.md - Setup guide" -ForegroundColor Gray
Write-Host "  - TESTING_GUIDE.md - Testing instructions" -ForegroundColor Gray
Write-Host "  - COMPLETE_DOCUMENTATION.md - Full documentation" -ForegroundColor Gray
Write-Host ""

# Ask if user wants to start servers
$startServers = Read-Host "Would you like to start the servers now? (y/n)"
if ($startServers -eq 'y') {
    Write-Host ""
    Write-Host "Starting backend server..." -ForegroundColor Yellow
    Write-Host "Backend will run at: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "API docs available at: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the backend, then run:" -ForegroundColor Yellow
    Write-Host "  cd frontend" -ForegroundColor Gray
    Write-Host "  npm run dev" -ForegroundColor Gray
    Write-Host ""
    
    Push-Location backend
    python main.py
    Pop-Location
}
