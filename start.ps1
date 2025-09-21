# Unified Service Management Script
# This script will intelligently manage services:
# - Start services if they're not running
# - Kill and restart services if they are running

param(
    [switch]$Force = $false
)

Write-Host "🚀 CMOS Service Manager" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Function to check if services are running
function Test-ServicesRunning {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    $port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    
    return ($nodeProcesses -or $port5000 -or $port3000)
}

# Function to kill all services
function Stop-AllServices {
    Write-Host "🛑 Stopping all running services..." -ForegroundColor Yellow
    
    # Kill Node.js processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "   Found $($nodeProcesses.Count) Node.js processes" -ForegroundColor Yellow
        foreach ($process in $nodeProcesses) {
            try {
                Write-Host "   Killing process $($process.Id) ($($process.ProcessName))" -ForegroundColor Gray
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
            catch {
                # Ignore errors for processes that might already be dead
            }
        }
    }
    
    # Kill npm processes
    $npmProcesses = Get-Process -Name "npm" -ErrorAction SilentlyContinue
    if ($npmProcesses) {
        Write-Host "   Found $($npmProcesses.Count) npm processes" -ForegroundColor Yellow
        foreach ($process in $npmProcesses) {
            try {
                Write-Host "   Killing process $($process.Id) ($($process.ProcessName))" -ForegroundColor Gray
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
            catch {
                # Ignore errors for processes that might already be dead
            }
        }
    }
    
    # Kill processes using ports
    $port5000Processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    $port3000Processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    
    foreach ($processId in ($port5000Processes + $port3000Processes)) {
        try {
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "   Killing process $processId ($($process.ProcessName)) using port" -ForegroundColor Gray
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
        catch {
            # Ignore errors
        }
    }
    
    # Wait for processes to fully terminate
    Start-Sleep -Seconds 3
    Write-Host "   ✅ All services stopped" -ForegroundColor Green
}

# Function to start services
function Start-AllServices {
    Write-Host "🚀 Starting all services..." -ForegroundColor Yellow
    
    # Start backend server
    Write-Host "   Starting backend server (port 5000)..." -ForegroundColor Gray
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd server; npm start" -WindowStyle Minimized
    
    # Wait a moment for backend to start
    Start-Sleep -Seconds 3
    
    # Start frontend server
    Write-Host "   Starting frontend server (port 3000)..." -ForegroundColor Gray
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd client; npm start" -WindowStyle Minimized
    
    # Wait for services to fully start
    Write-Host "   Waiting for services to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    # Verify services are running
    $maxAttempts = 10
    $attempt = 0
    $servicesReady = $false
    
    while ($attempt -lt $maxAttempts -and -not $servicesReady) {
        $attempt++
        Write-Host "   Checking services... (attempt $attempt/$maxAttempts)" -ForegroundColor Gray
        
        $port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
        $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        
        if ($port5000 -and $port3000) {
            $servicesReady = $true
            Write-Host "   ✅ All services are running!" -ForegroundColor Green
        } else {
            Start-Sleep -Seconds 2
        }
    }
    
    if (-not $servicesReady) {
        Write-Host "   ⚠️  Services may still be starting up..." -ForegroundColor Yellow
    }
}

# Main logic
$servicesRunning = Test-ServicesRunning

if ($servicesRunning -and -not $Force) {
    Write-Host "⚠️  Services are already running!" -ForegroundColor Yellow
    Write-Host "   Backend: http://localhost:5000" -ForegroundColor Gray
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "   • Run with -Force to restart services" -ForegroundColor White
    Write-Host "   • Use .\kill-services.ps1 to stop services" -ForegroundColor White
    Write-Host "   • Use .\start-services.ps1 to start services" -ForegroundColor White
    Write-Host ""
    $response = Read-Host "Do you want to restart services? (y/N)"
    
    if ($response -eq "y" -or $response -eq "Y" -or $response -eq "yes") {
        Stop-AllServices
        Start-AllServices
    } else {
        Write-Host "   Services left running." -ForegroundColor Green
        exit 0
    }
} elseif ($servicesRunning -and $Force) {
    Write-Host "🔄 Force restart requested..." -ForegroundColor Yellow
    Stop-AllServices
    Start-AllServices
} else {
    Write-Host "✅ No services running, starting fresh..." -ForegroundColor Green
    Start-AllServices
}

Write-Host ""
Write-Host "🎯 Service management completed!" -ForegroundColor Cyan
Write-Host "   Backend: http://localhost:5000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   • Use .\start.ps1 -Force to force restart" -ForegroundColor Gray
Write-Host "   • Use .\kill-services.ps1 to stop all services" -ForegroundColor Gray
Write-Host "   • Check taskbar for minimized PowerShell windows" -ForegroundColor Gray
