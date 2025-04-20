# PowerShell cleanup script
Write-Host "Starting cleanup process..." -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Create backup directory with timestamp
$backupDir = "backup_$(Get-Date -Format 'yyyyMMdd')"
Write-Host "Creating backup directory: $backupDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

# Backup any unique files
Write-Host "Backing up unique files..." -ForegroundColor Yellow
$componentsDir = Join-Path $backupDir "components"
$modelsDir = Join-Path $backupDir "models"
New-Item -ItemType Directory -Force -Path $componentsDir | Out-Null
New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null

# Backup files if they exist
$filesToBackup = @(
    @{Source = "parking-app-new\src\components\ParkingTicket.js"; Dest = "components\ParkingTicket.js"},
    @{Source = "parking-backend\models\Booking.js"; Dest = "models\Booking.js"}
)

foreach ($file in $filesToBackup) {
    if (Test-Path $file.Source) {
        Copy-Item -Path $file.Source -Destination (Join-Path $backupDir $file.Dest) -Force
        Write-Host "Backed up: $($file.Source)" -ForegroundColor Cyan
    }
}

# Directories to remove
$dirsToRemove = @(
    "parking-app",
    "parking-app-new",
    "parking-backend",
    "parking-frontend",
    "parking-frontend-react",
    "smart-parking-app"
)

# Files to remove
$filesToRemove = @(
    "start.bat",
    "start_frontend.bat",
    "setup.bat",
    "CarParkPos",
    "UniqueID"
)

# Remove directories
Write-Host "`nRemoving old directories..." -ForegroundColor Yellow
foreach ($dir in $dirsToRemove) {
    if (Test-Path $dir) {
        try {
            Remove-Item -Path $dir -Recurse -Force
            Write-Host "Removed directory: $dir" -ForegroundColor Green
        } catch {
            Write-Host "Error removing $dir : $_" -ForegroundColor Red
        }
    }
}

# Remove files
Write-Host "`nRemoving old files..." -ForegroundColor Yellow
foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        try {
            Remove-Item -Path $file -Force
            Write-Host "Removed file: $file" -ForegroundColor Green
        } catch {
            Write-Host "Error removing $file : $_" -ForegroundColor Red
        }
    }
}

# Final status
Write-Host "`nCleanup complete!" -ForegroundColor Green
Write-Host "Backup created in: $backupDir" -ForegroundColor Cyan
Write-Host "`nCurrent project structure:" -ForegroundColor Yellow
Write-Host "smart-parking-frontend/    - Main React frontend"
Write-Host "Pyt/                      - Python backend"
Write-Host "run_servers.bat          - Server startup script"

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 