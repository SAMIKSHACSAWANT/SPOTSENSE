@echo off
title SpotSense Optimization

echo ================================================
echo          SpotSense Optimization
echo ================================================
echo.

echo This script will clean up node_modules and optimize the project size.
echo.
set /p confirm=Do you want to continue? (y/n): 

if /i not "%confirm%"=="y" (
    echo Operation cancelled by user.
    pause
    exit /b 0
)

echo.
echo Removing node_modules folder (will be reinstalled)...
if exist frontend\node_modules (
    rmdir /S /Q frontend\node_modules
    echo Node modules removed successfully.
) else (
    echo No node_modules folder found.
)

echo.
echo Cleaning npm cache...
call npm cache clean --force
echo.

echo Reinstalling dependencies with optimized settings...
cd frontend
call npm install --production
echo.

echo Removing development-only files...
echo.

echo ================================================
echo Optimization complete!
echo.
echo You can now use start-all.bat to run the application.
echo ================================================

pause 

git init 
git add . 
git commit -m "Initial commit" 
git remote add origin https://github.com/SAMICSAWANT/codeparking.git 
git push -u origin main 