@echo off
title SpotSense Smart Parking System

echo ================================================
echo          SpotSense Smart Parking System
echo ================================================
echo.

REM Check if Python is installed
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.8 or later from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Create Python virtual environment if not exists
if not exist backend\venv (
    echo Creating Python virtual environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
) else (
    echo Python virtual environment already exists.
)

REM Install Node.js dependencies if needed
if not exist frontend\node_modules (
    echo Installing Node.js dependencies...
    cd frontend
    call npm install
    cd ..
) else (
    echo Node.js dependencies already installed.
)

echo.
echo Starting backend server...
start cmd /k "cd backend && venv\Scripts\activate && python app.py"

echo.
echo Starting frontend development server...
start cmd /k "cd frontend && node start.js"

echo.
echo SpotSense Smart Parking System is starting...
echo Frontend will be available at: http://localhost:3001
echo Backend API will be available at: http://localhost:5000
echo.
echo Press any key to shut down all services...
pause

REM Cleanup: kill all related processes
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM python.exe /T >nul 2>&1

echo All services have been stopped.
pause 