@echo off
title SpotSense - Connection Debugger

echo ================================================
echo      SpotSense Connection Debugger
echo ================================================
echo.

setlocal EnableDelayedExpansion

REM Set colors for better visibility
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "CYAN=[96m"
set "RESET=[0m"

echo %CYAN%Starting connection diagnostics...%RESET%

REM Check network connectivity
echo %YELLOW%Testing network connectivity...%RESET%
ping -n 1 127.0.0.1 > nul
if %errorlevel% neq 0 (
    echo %RED%ERROR: Local loopback network is not responding.%RESET%
    echo %RED%This indicates a serious networking issue with your system.%RESET%
    pause
    exit /b 1
) else (
    echo %GREEN%Basic network connectivity is working%RESET%
)

REM Kill existing processes that might be using required ports
echo %CYAN%Terminating any existing processes on required ports...%RESET%

REM Check if port 3001 is in use (frontend)
netstat -ano | find "LISTENING" | find ":3001" > NUL
if %errorlevel% equ 0 (
    echo %YELLOW%Port 3001 is in use - freeing...%RESET%
    for /f "tokens=5" %%a in ('netstat -ano ^| find "LISTENING" ^| find ":3001"') do (
        echo %YELLOW%Killing process with PID: %%a%RESET%
        taskkill /F /PID %%a > NUL 2>&1
    )
) else (
    echo %GREEN%Port 3001 is available%RESET%
)

REM Check if port 5000 is in use (backend)
netstat -ano | find "LISTENING" | find ":5000" > NUL
if %errorlevel% equ 0 (
    echo %YELLOW%Port 5000 is in use - freeing...%RESET%
    for /f "tokens=5" %%a in ('netstat -ano ^| find "LISTENING" ^| find ":5000"') do (
        echo %YELLOW%Killing process with PID: %%a%RESET%
        taskkill /F /PID %%a > NUL 2>&1
    )
) else (
    echo %GREEN%Port 5000 is available%RESET%
)

REM Kill any existing Python or Node processes from previous runs
echo %YELLOW%Cleaning up any existing processes...%RESET%
taskkill /F /IM python.exe /T > NUL 2>&1
taskkill /F /IM node.exe /T > NUL 2>&1

REM Wait a moment to ensure processes are terminated
timeout /t 2 /nobreak > NUL

REM Create temporary test file to check file permissions
echo %YELLOW%Testing file system permissions...%RESET%
echo test > spotsense_permissions_test.tmp
if not exist spotsense_permissions_test.tmp (
    echo %RED%ERROR: Cannot write to current directory.%RESET%
    echo %RED%Please check file system permissions.%RESET%
    pause
    exit /b 1
) else (
    del spotsense_permissions_test.tmp
    echo %GREEN%File system permissions OK%RESET%
)

REM Check if Python is installed
echo %YELLOW%Checking for Python...%RESET%
where python > NUL 2>&1
if %errorlevel% neq 0 (
    echo %RED%ERROR: Python not found in PATH.%RESET%
    echo %RED%Please install Python 3.8+ and add it to your PATH.%RESET%
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('python --version') do echo %GREEN%%%i is installed%RESET%
)

REM Check if Node.js is installed
echo %YELLOW%Checking for Node.js...%RESET%
where node > NUL 2>&1
if %errorlevel% neq 0 (
    echo %RED%ERROR: Node.js not found in PATH.%RESET%
    echo %RED%Please install Node.js and add it to your PATH.%RESET%
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo %GREEN%Node.js %%i is installed%RESET%
)

REM Check for OpenCV in Python
echo %YELLOW%Checking for required Python packages...%RESET%
cd backend
if not exist venv (
    echo %YELLOW%Creating Python virtual environment...%RESET%
    python -m venv venv
    if %errorlevel% neq 0 (
        echo %RED%ERROR: Failed to create Python virtual environment.%RESET%
        cd ..
        pause
        exit /b 1
    )
)

call venv\Scripts\activate.bat
python -c "import cv2; print('OpenCV version:', cv2.__version__)" > NUL 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%Installing required Python packages...%RESET%
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo %RED%ERROR: Failed to install required Python packages.%RESET%
        cd ..
        pause
        exit /b 1
    ) else {
        echo %GREEN%Required Python packages installed successfully%RESET%
    }
) else (
    echo %GREEN%Required Python packages are already installed%RESET%
)
call venv\Scripts\deactivate.bat
cd ..

REM Check for firewall blockage
echo %YELLOW%Testing for firewall blocking...%RESET%
netsh advfirewall firewall show rule name="SpotSense_Port_5000" > NUL 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%Creating firewall exception for backend port 5000...%RESET%
    netsh advfirewall firewall add rule name="SpotSense_Port_5000" dir=in action=allow protocol=TCP localport=5000 > NUL 2>&1
)

netsh advfirewall firewall show rule name="SpotSense_Port_3001" > NUL 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%Creating firewall exception for frontend port 3001...%RESET%
    netsh advfirewall firewall add rule name="SpotSense_Port_3001" dir=in action=allow protocol=TCP localport=3001 > NUL 2>&1
)

echo %GREEN%Firewall configuration complete%RESET%

REM Start backend in diagnostic mode with verbose output
echo %CYAN%Starting backend server with enhanced debugging...%RESET%
start cmd /k "color 0A && echo BACKEND DIAGNOSTIC MODE && cd backend && call venv\Scripts\activate && set FLASK_ENV=development && set FLASK_DEBUG=1 && python -u app.py"

REM Wait for backend to initialize
echo %YELLOW%Waiting for backend to initialize...%RESET%
timeout /t 5 /nobreak > NUL

REM Test if backend is responding
echo %YELLOW%Testing backend connection...%RESET%
curl -s http://localhost:5000/health > NUL 2>&1
if %errorlevel% neq 0 (
    echo %RED%Warning: Backend does not appear to be responding.%RESET%
    echo %RED%Will still attempt to start frontend, but connection issues may persist.%RESET%
    timeout /t 2 /nobreak > NUL
) else (
    echo %GREEN%Backend is responding correctly%RESET%
)

REM Start frontend with debugging
echo %CYAN%Starting frontend in diagnostic mode...%RESET%
start cmd /k "color 0B && echo FRONTEND DIAGNOSTIC MODE && cd frontend && set DEBUG=* && node start.js"

echo.
echo %GREEN%=====================================================%RESET%
echo %GREEN%  SpotSense is starting in DIAGNOSTIC MODE           %RESET%
echo %GREEN%=====================================================%RESET%
echo.
echo %CYAN%Frontend URL: http://localhost:3001%RESET%
echo %CYAN%Backend API: http://localhost:5000%RESET%
echo %CYAN%Backend Health Check: http://localhost:5000/health%RESET%
echo %CYAN%Video Stream: http://localhost:5000/api/parking/video%RESET%
echo.
echo %YELLOW%Connection troubleshooting tips:%RESET%
echo %YELLOW%1. If browser shows 'ERR_CONNECTION_REFUSED':%RESET%
echo %YELLOW%   - Check if both terminal windows show the servers running%RESET%
echo %YELLOW%   - Try accessing http://127.0.0.1:3001 instead of localhost%RESET%
echo %YELLOW%   - Temporarily disable any antivirus or firewall software%RESET%
echo.
echo %YELLOW%2. If video stream is not working:%RESET%
echo %YELLOW%   - Check if backend console shows 'Video opened successfully'%RESET%
echo %YELLOW%   - Try accessing the video directly at http://localhost:5000/api/parking/video%RESET%
echo %YELLOW%   - Verify that carPark.mp4 is in the correct location%RESET%
echo.
echo %YELLOW%3. If everything is still failing:%RESET%
echo %YELLOW%   - Try restarting your computer%RESET%
echo %YELLOW%   - Check Windows Defender and any antivirus settings%RESET%
echo %YELLOW%   - Use localhost IP (127.0.0.1) instead of 'localhost' in URLs%RESET%
echo.
echo %YELLOW%Press any key to shut down all services when finished debugging...%RESET%
pause > NUL

echo.
echo %CYAN%Cleaning up processes...%RESET%
taskkill /F /IM node.exe /T > NUL 2>&1
taskkill /F /IM python.exe /T > NUL 2>&1

echo %GREEN%All services have been stopped%RESET%
echo %GREEN%Done!%RESET%
pause 