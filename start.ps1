# MetroMate Routing System - Quick Start Script
# Run this script to start both backend and frontend

Write-Host ">>> Starting MetroMate Routing System..." -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[OK] Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python not found! Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found! Please install Node.js" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[Step 1] Setting up Backend..." -ForegroundColor Yellow
Set-Location backend

# Function to find venv python executable
function Get-VenvPython {
    if (Test-Path "venv/Scripts/python.exe") { return ".\venv\Scripts\python.exe" }
    if (Test-Path "venv/bin/python.exe") { return ".\venv\bin\python.exe" }
    return $null
}

$venvPython = Get-VenvPython

# Recreate venv if missing or invalid
if ($null -eq $venvPython) {
    Write-Host "Creating/Recreating virtual environment..." -ForegroundColor Gray
    if (Test-Path "venv") { Remove-Item -Recurse -Force "venv" }
    python -m venv venv
    
    # Check again after creation
    $venvPython = Get-VenvPython
}

# Double check venv creation
if ($null -eq $venvPython) {
    Write-Host "[ERROR] Failed to create virtual environment! Please check your Python installation." -ForegroundColor Red
    Write-Host "Debug hint: Tried to look for venv/Scripts/python.exe and venv/bin/python.exe" -ForegroundColor Gray
    exit 1
}

Write-Host "Using venv python at: $venvPython" -ForegroundColor Gray

Write-Host "Installing/Updating Python packages..." -ForegroundColor Gray
# Use the venv python directly to install packages
& $venvPython -m pip install -q --upgrade pip
& $venvPython -m pip install -q -r requirements.txt

Write-Host "[OK] Backend dependencies installed!" -ForegroundColor Green
Write-Host ""

# Start backend in background using venv python
Write-Host "[Step 2] Starting Backend Server (Port 8000)..." -ForegroundColor Yellow
$backend = Start-Process -FilePath $venvPython -ArgumentList "routing_service.py" -PassThru -NoNewWindow
Start-Sleep -Seconds 3

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
    Write-Host "[OK] Backend is running at http://localhost:8000" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Backend may still be starting... Check http://localhost:8000" -ForegroundColor Yellow
}

Set-Location ..
Write-Host ""

# Start frontend
Write-Host "[Step 3] Starting Frontend (Vite Dev Server)..." -ForegroundColor Yellow
Write-Host "Frontend will open automatically in your browser..." -ForegroundColor Gray
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "MetroMate is running!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start frontend (this will block until stopped)
npm run dev

# Cleanup on exit
Write-Host ""
Write-Host "[STOP] Stopping servers..." -ForegroundColor Red
Stop-Process -Id $backend.Id -Force
Write-Host "[OK] Servers stopped" -ForegroundColor Green
