@echo off
title SpotSense Smart Parking System

echo ================================================
echo      SpotSense Smart Parking System - Debug
echo ================================================
echo.

setlocal EnableDelayedExpansion

REM Set colors for better visibility
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "CYAN=[96m"
set "RESET=[0m"

echo %CYAN%Checking prerequisites...%RESET%

REM Check if Python is installed
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.8 or later from https://www.python.org/downloads/%RESET%
    pause
    exit /b 1
) else (
    echo %GREEN%Python found: %RESET%
    python --version
)

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/%RESET%
    pause
    exit /b 1
) else (
    echo %GREEN%Node.js found: %RESET%
    node --version
)

REM Check if required ports are in use
echo %CYAN%Checking if ports are available...%RESET%

REM Check if port 3001 is available (frontend)
netstat -ano | find "LISTENING" | find ":3001" >nul
if %errorlevel% equ 0 (
    echo %YELLOW%WARNING: Port 3001 is already in use.%RESET%
    echo %YELLOW%Attempting to free port 3001...%RESET%
    
    for /f "tokens=5" %%a in ('netstat -ano ^| find "LISTENING" ^| find ":3001"') do (
        echo %YELLOW%Killing process with PID: %%a%RESET%
        taskkill /F /PID %%a
        if !errorlevel! equ 0 (
            echo %GREEN%Successfully freed port 3001%RESET%
        ) else (
            echo %RED%Failed to free port 3001. Please close the application using this port manually.%RESET%
            pause
            exit /b 1
        )
    )
) else (
    echo %GREEN%Port 3001 is available%RESET%
)

REM Check if port 5000 is available (backend)
netstat -ano | find "LISTENING" | find ":5000" >nul
if %errorlevel% equ 0 (
    echo %YELLOW%WARNING: Port 5000 is already in use.%RESET%
    echo %YELLOW%Attempting to free port 5000...%RESET%
    
    for /f "tokens=5" %%a in ('netstat -ano ^| find "LISTENING" ^| find ":5000"') do (
        echo %YELLOW%Killing process with PID: %%a%RESET%
        taskkill /F /PID %%a
        if !errorlevel! equ 0 (
            echo %GREEN%Successfully freed port 5000%RESET%
        ) else (
            echo %RED%Failed to free port 5000. Please close the application using this port manually.%RESET%
            pause
            exit /b 1
        )
    )
) else (
    echo %GREEN%Port 5000 is available%RESET%
)

echo.
echo %CYAN%Setting up Python environment...%RESET%

REM Create Python virtual environment if it doesn't exist
if not exist backend\venv (
    echo %YELLOW%Creating Python virtual environment...%RESET%
    cd backend
    python -m venv venv
    echo %GREEN%Virtual environment created%RESET%
    
    echo %YELLOW%Installing Python dependencies...%RESET%
    call venv\Scripts\activate
    pip install -r requirements.txt
    if !errorlevel! neq 0 (
        echo %RED%Failed to install Python dependencies%RESET%
        pause
        exit /b 1
    ) else (
        echo %GREEN%Python dependencies installed successfully%RESET%
    )
    call deactivate
    cd ..
) else (
    echo %GREEN%Python virtual environment already exists%RESET%
)

echo.
echo %CYAN%Setting up Node.js environment...%RESET%

REM Install Node.js dependencies if needed
if not exist frontend\node_modules (
    echo %YELLOW%Installing Node.js dependencies...%RESET%
    cd frontend
    call npm install
    if !errorlevel! neq 0 (
        echo %RED%Failed to install Node.js dependencies%RESET%
        pause
        exit /b 1
    ) else (
        echo %GREEN%Node.js dependencies installed successfully%RESET%
    )
    cd ..
) else (
    echo %GREEN%Node.js dependencies already installed%RESET%
)

echo.
echo %CYAN%Starting the backend server...%RESET%
start cmd /k "echo Starting backend API server on port 5000... && cd backend && call venv\Scripts\activate && python app.py"

REM Wait a moment for the backend to start
echo %YELLOW%Waiting for backend to initialize...%RESET%
timeout /t 5 /nobreak > nul

echo.
echo %CYAN%Starting the frontend development server...%RESET%
start cmd /k "echo Starting frontend on port 3001... && cd frontend && node start.js"

echo.
echo %GREEN%=====================================================%RESET%
echo %GREEN%  SpotSense Smart Parking System is starting up!     %RESET%
echo %GREEN%=====================================================%RESET%
echo.
echo %CYAN%Frontend will be available at: http://localhost:3001%RESET%
echo %CYAN%Backend API will be available at: http://localhost:5000%RESET%
echo.
echo %YELLOW%If your browser doesn't open automatically, please manually%RESET%
echo %YELLOW%navigate to http://localhost:3001%RESET%
echo.
echo %YELLOW%Press any key to shut down all services when you're done...%RESET%
pause > nul

echo.
echo %CYAN%Shutting down services...%RESET%
taskkill /F /IM node.exe /T > nul 2>&1
taskkill /F /IM python.exe /T > nul 2>&1

echo %GREEN%All services have been stopped%RESET%
echo %GREEN%Thank you for using SpotSense Smart Parking System!%RESET%
pause 