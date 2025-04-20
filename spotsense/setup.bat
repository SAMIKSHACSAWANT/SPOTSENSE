@echo off
title SpotSense Setup

echo ================================================
echo           SpotSense System Setup
echo ================================================
echo.

REM Check if Python is installed
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.8 or later from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Python and Node.js found. Setting up the project...
echo.

REM Set up backend
echo Setting up backend...
cd backend

REM Create and activate virtual environment
echo Creating Python virtual environment...
python -m venv venv
call venv\Scripts\activate

REM Install backend dependencies
echo Installing Python dependencies...
pip install --upgrade pip
pip install -r requirements.txt

REM Return to root directory
cd ..
echo Backend setup complete.
echo.

REM Set up frontend
echo Setting up frontend...
cd frontend

REM Install frontend dependencies
echo Installing Node.js dependencies...
call npm install

REM Return to root directory
cd ..
echo Frontend setup complete.
echo.

echo ================================================
echo SpotSense has been successfully set up!
echo.
echo To start the application, run: start-all.bat
echo ================================================

pause 