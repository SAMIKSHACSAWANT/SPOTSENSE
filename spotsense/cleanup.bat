@echo off
title SpotSense Cleanup

echo ================================================
echo           SpotSense Cleanup Script
echo ================================================
echo.

echo This script will remove the original project folders after migration.
echo The following directories will be removed:
echo   - smart-parking-frontend
echo   - smart-parking-system
echo   - Pyt
echo   - All unnecessary .bat files in the root directory
echo.
echo IMPORTANT: Make sure you have successfully migrated everything to
echo the spotsense directory before running this script.
echo.
set /p confirm=Are you sure you want to continue? (y/n): 

if /i not "%confirm%"=="y" (
    echo Operation cancelled by user.
    pause
    exit /b 0
)

echo.
echo Removing original folders...

REM Remove smart-parking-frontend
if exist ..\smart-parking-frontend (
    echo Removing smart-parking-frontend...
    rmdir /S /Q ..\smart-parking-frontend
)

REM Remove smart-parking-system
if exist ..\smart-parking-system (
    echo Removing smart-parking-system...
    rmdir /S /Q ..\smart-parking-system
)

REM Remove Pyt folder
if exist ..\Pyt (
    echo Removing Pyt folder...
    rmdir /S /Q ..\Pyt
)

REM Remove unnecessary .bat files
echo Removing unnecessary .bat files...
if exist ..\project_cleanup.bat del ..\project_cleanup.bat
if exist ..\run_optimized.bat del ..\run_optimized.bat
if exist ..\run-frontend.bat del ..\run-frontend.bat
if exist ..\run_single_server.bat del ..\run_single_server.bat
if exist ..\start_server.bat del ..\start_server.bat
if exist ..\run_updated.bat del ..\run_updated.bat
if exist ..\install_packages.bat del ..\install_packages.bat
if exist ..\run_project.bat del ..\run_project.bat
if exist ..\setup_project.bat del ..\setup_project.bat
if exist ..\push_to_remote.bat del ..\push_to_remote.bat
if exist ..\setup_git.bat del ..\setup_git.bat
if exist ..\cleanup.bat del ..\cleanup.bat
if exist ..\run_servers.bat del ..\run_servers.bat

echo.
echo ================================================
echo Cleanup completed successfully!
echo All original project folders and unnecessary
echo batch files have been removed.
echo ================================================

pause 