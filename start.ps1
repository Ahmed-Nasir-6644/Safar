# MetroMate Routing System - Quick Start Script
# Run this script to start both backend and frontend

Write-Host "🚀 Starting MetroMate Routing System..." -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Step 1: Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location backend
if (!(Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Gray
    python -m venv venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Gray
.\venv\Scripts\Activate.ps1

Write-Host "Installing Python packages..." -ForegroundColor Gray
pip install -q -r requirements.txt

Write-Host "✅ Backend dependencies installed!" -ForegroundColor Green
Write-Host ""

# Start backend in background
Write-Host "🔧 Step 2: Starting Backend Server (Port 8000)..." -ForegroundColor Yellow
$backend = Start-Process -FilePath "python" -ArgumentList "routing_service.py" -PassThru -NoNewWindow
Start-Sleep -Seconds 3

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
    Write-Host "✅ Backend is running at http://localhost:8000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend may still be starting... Check http://localhost:8000" -ForegroundColor Yellow
}

Set-Location ..
Write-Host ""

# Start frontend
Write-Host "🎨 Step 3: Starting Frontend (Vite Dev Server)..." -ForegroundColor Yellow
Write-Host "Frontend will open automatically in your browser..." -ForegroundColor Gray
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🎉 MetroMate is running!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "📍 Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "📍 API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start frontend (this will block until stopped)
npm run dev

# Cleanup on exit
Write-Host ""
Write-Host "🛑 Stopping servers..." -ForegroundColor Red
Stop-Process -Id $backend.Id -Force
Write-Host "✅ Servers stopped" -ForegroundColor Green
