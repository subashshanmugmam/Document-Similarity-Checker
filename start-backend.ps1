# Start Backend Server
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:PATH = "C:\Program Files\Java\jdk-17\bin;$env:PATH"

Write-Host "`n🚀 Starting Backend Server (Java 17 + PySpark 4.0.1)...`n" -ForegroundColor Green
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs`n" -ForegroundColor Cyan

cd "s:\Program File\Snew\backend"
python main.py
