@echo off
title SpotSense Connection Test

echo ===============================================
echo        SpotSense Connection Diagnostics
echo ===============================================
echo.

echo [TEST] Checking if port 5000 is in use...
netstat -ano | findstr :5000 | findstr LISTENING > NUL
if %errorlevel% equ 0 (
    echo [FAIL] Port 5000 is already in use by another application.
    echo        Attempting to free the port...
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
        echo        Killing process with PID: %%a
        taskkill /f /pid %%a
        if !errorlevel! equ 0 (
            echo [PASS] Successfully freed port 5000
        ) else (
            echo [FAIL] Failed to free port 5000
            echo        Please manually close the application using this port.
        )
    )
) else (
    echo [PASS] Port 5000 is available
)

echo.
echo [TEST] Testing network connectivity...
ping -n 1 127.0.0.1 > NUL
if %errorlevel% neq 0 (
    echo [FAIL] Basic network loopback not working
    echo        Your network stack may have issues
) else (
    echo [PASS] Network loopback is working
)

echo.
echo [TEST] Checking for Python...
where python > NUL 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Python not found in PATH
    echo        Please install Python and ensure it's in your PATH
) else (
    echo [PASS] Python found in PATH
)

echo.
echo [TEST] Testing Flask installation...
cd backend
python -c "import flask; print(f'Flask version: {flask.__version__}')" 2>NUL
if %errorlevel% neq 0 (
    echo [FAIL] Flask is not installed
    echo        Installing Flask and dependencies...
    python -m pip install flask flask-cors
) else (
    echo [PASS] Flask is installed
)

echo.
echo [TEST] Checking firewall settings...
netsh advfirewall firewall show rule name="SpotSense_Port_5000" > NUL 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Creating firewall rule for port 5000...
    netsh advfirewall firewall add rule name="SpotSense_Port_5000" dir=in action=allow protocol=TCP localport=5000
) else (
    echo [PASS] Firewall rule exists
)

echo.
echo [TEST] Starting test server...
start "Test Backend Server" cmd /k "cd backend && python test_server.py"
echo        Server starting at http://localhost:5000
echo        Please check if you can access it in your browser.
echo.

echo [TEST] Testing connection to server...
timeout /t 5 /nobreak > NUL

echo Trying to connect to test server...
curl -s http://localhost:5000/health > NUL
if %errorlevel% neq 0 (
    echo [FAIL] Could not connect to test server
    echo        Please try the following:
    echo        1. Check if any security software is blocking connections
    echo        2. Try accessing http://127.0.0.1:5000 instead of localhost
    echo        3. Try disabling Windows Defender Firewall temporarily
) else (
    echo [PASS] Successfully connected to test server
)

echo.
echo ===============================================
echo        Connection Diagnostics Complete
echo ===============================================
echo If server tests passed but you still have issues:
echo 1. Try using http://127.0.0.1:3001 instead of localhost
echo 2. Check if your browser has any proxy settings
echo 3. Try disabling extensions or using incognito mode
echo 4. Make sure both backend and frontend are running
echo.
echo Press any key to exit...
pause > NUL 