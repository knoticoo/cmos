# Stop Services Script for Management Web App
# This script stops all running services

Write-Host "Stopping Management Web App Services..." -ForegroundColor Yellow

# Function to stop processes by name
function Stop-ProcessByName {
    param(
        [string]$ProcessName,
        [string]$Description
    )
    
    try {
        $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        if ($processes) {
            foreach ($proc in $processes) {
                Stop-Process -Id $proc.Id -Force
                Write-Host "Stopped $Description (PID: $($proc.Id))" -ForegroundColor Green
            }
        } else {
            Write-Host "No $Description processes found" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Error stopping $Description`: $_" -ForegroundColor Red
    }
}

# Stop Node.js processes (backend server)
Stop-ProcessByName -ProcessName "node" -Description "Backend Server"

# Stop npm processes (frontend client)
Stop-ProcessByName -ProcessName "npm" -Description "Frontend Client"

# Stop any PowerShell processes running our services
try {
    $ourProcesses = Get-Process -Name "powershell" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*node index.js*" -or $_.CommandLine -like "*npm start*"
    }
    
    if ($ourProcesses) {
        foreach ($proc in $ourProcesses) {
            Stop-Process -Id $proc.Id -Force
            Write-Host "Stopped service process (PID: $($proc.Id))" -ForegroundColor Green
        }
    }
} catch {
    # Ignore errors for this cleanup
}

Write-Host "`nAll services stopped successfully!" -ForegroundColor Green
Write-Host "You can now run .\start-services.ps1 to start them again." -ForegroundColor Cyan
