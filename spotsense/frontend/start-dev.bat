@echo off
echo ===============================================
echo    SpotSense Smart Parking System - Frontend
echo ===============================================
echo.
echo Starting the development server...
echo.
echo The frontend will run on http://localhost:3000
echo and will proxy API requests to the backend on port 5001
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.

cd %~dp0
echo Starting the React frontend...
npm run dev

pause 