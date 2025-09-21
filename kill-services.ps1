# Kill Services Script - Simple Version
# This script will automatically kill all running Node.js processes and services

Write-Host "Checking for running services..." -ForegroundColor Yellow

# Kill Node.js processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js processes running" -ForegroundColor Red
    foreach ($process in $nodeProcesses) {
        try {
            Write-Host "   Killing process $($process.Id) ($($process.ProcessName))" -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force
            Write-Host "   Process $($process.Id) killed successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "   Failed to kill process $($process.Id): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No Node.js processes found running" -ForegroundColor Green
}

# Kill any processes using port 5000 (backend)
$port5000Processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($port5000Processes) {
    Write-Host "Found processes using port 5000" -ForegroundColor Red
    foreach ($pid in $port5000Processes) {
        try {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "   Killing process $pid ($($process.ProcessName)) using port 5000" -ForegroundColor Yellow
                Stop-Process -Id $pid -Force
                Write-Host "   Process $pid killed successfully" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "   Failed to kill process $pid`: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No processes found using port 5000" -ForegroundColor Green
}

# Kill any processes using port 3000 (frontend)
$port3000Processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($port3000Processes) {
    Write-Host "Found processes using port 3000" -ForegroundColor Red
    foreach ($pid in $port3000Processes) {
        try {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "   Killing process $pid ($($process.ProcessName)) using port 3000" -ForegroundColor Yellow
                Stop-Process -Id $pid -Force
                Write-Host "   Process $pid killed successfully" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "   Failed to kill process $pid`: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No processes found using port 3000" -ForegroundColor Green
}

# Kill any npm processes
$npmProcesses = Get-Process -Name "npm" -ErrorAction SilentlyContinue
if ($npmProcesses) {
    Write-Host "Found $($npmProcesses.Count) npm processes running" -ForegroundColor Red
    foreach ($process in $npmProcesses) {
        try {
            Write-Host "   Killing process $($process.Id) ($($process.ProcessName))" -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force
            Write-Host "   Process $($process.Id) killed successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "   Failed to kill process $($process.Id): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No npm processes found running" -ForegroundColor Green
}

Write-Host ""
Write-Host "Service cleanup completed!" -ForegroundColor Cyan
Write-Host "All running services have been terminated." -ForegroundColor White

# Wait a moment for processes to fully terminate
Start-Sleep -Seconds 2

# Final check
$remainingNodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($remainingNodeProcesses) {
    Write-Host "Warning: Some Node.js processes may still be running" -ForegroundColor Yellow
} else {
    Write-Host "All services successfully terminated!" -ForegroundColor Green
}
