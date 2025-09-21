# Start Services Script for Management Web App
# This script starts both the backend server and frontend client

Write-Host "Starting Management Web App Services..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Yellow
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Function to start a service in background
function Start-Service {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "Starting $Description..." -ForegroundColor Cyan
    
    # Change to the specified directory
    Push-Location $Path
    
    try {
        # Start the process in background
        $process = Start-Process -FilePath "powershell" -ArgumentList "-Command", $Command -PassThru -WindowStyle Hidden
        
        # Store process ID for later reference
        $global:processes += @{
            Name = $Name
            ProcessId = $process.Id
            Description = $Description
        }
        
        Write-Host "$Description started with PID: $($process.Id)" -ForegroundColor Green
    } catch {
        Write-Host "Error starting $Description`: $_" -ForegroundColor Red
    } finally {
        Pop-Location
    }
}

# Initialize processes array
$global:processes = @()

# Start Backend Server
Start-Service -Name "backend" -Path "server" -Command "node index.js" -Description "Backend Server (Port 5000)"

# Wait a moment for server to initialize
Start-Sleep -Seconds 3

# Start Frontend Client
Start-Service -Name "frontend" -Path "client" -Command "npm start" -Description "Frontend Client (Port 3000)"

# Wait for services to start
Start-Sleep -Seconds 5

Write-Host "`nAll services started successfully!" -ForegroundColor Green
Write-Host "Backend Server: http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend Client: http://localhost:3000" -ForegroundColor Yellow

Write-Host "`nRunning processes:" -ForegroundColor Cyan
foreach ($proc in $global:processes) {
    Write-Host "  - $($proc.Description) (PID: $($proc.ProcessId))" -ForegroundColor White
}

Write-Host "`nTo stop all services, run: .\stop-services.ps1" -ForegroundColor Magenta
Write-Host "Or press Ctrl+C to stop this script" -ForegroundColor Magenta

# Keep script running and show status
try {
    while ($true) {
        Start-Sleep -Seconds 10
        
        # Check if processes are still running
        $allRunning = $true
        foreach ($proc in $global:processes) {
            try {
                $runningProc = Get-Process -Id $proc.ProcessId -ErrorAction SilentlyContinue
                if (-not $runningProc) {
                    Write-Host "$($proc.Description) (PID: $($proc.ProcessId)) has stopped" -ForegroundColor Red
                    $allRunning = $false
                }
            } catch {
                Write-Host "$($proc.Description) (PID: $($proc.ProcessId)) has stopped" -ForegroundColor Red
                $allRunning = $false
            }
        }
        
        if (-not $allRunning) {
            Write-Host "One or more services have stopped. Exiting..." -ForegroundColor Red
            break
        }
    }
} catch {
    Write-Host "`nStopping all services..." -ForegroundColor Yellow
    
    # Stop all processes
    foreach ($proc in $global:processes) {
        try {
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped $($proc.Description) (PID: $($proc.ProcessId))" -ForegroundColor Yellow
        } catch {
            Write-Host "Could not stop $($proc.Description) (PID: $($proc.ProcessId))" -ForegroundColor Red
        }
    }
    
    Write-Host "All services stopped." -ForegroundColor Green
}
