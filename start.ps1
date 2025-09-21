# Management Web App - Windows PowerShell Startup Script
# This script installs dependencies, starts services, and handles restarts

param(
    [string]$Action = "start"
)

# Configuration
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Join-Path $ProjectDir "server"
$ClientDir = Join-Path $ProjectDir "client"
$PidFile = Join-Path $ProjectDir ".app.pid"
$LogFile = Join-Path $ProjectDir "app.log"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if Node.js is installed
function Test-NodeInstalled {
    try {
        $nodeVersion = node --version
        $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        return $versionNumber -ge 18
    }
    catch {
        return $false
    }
}

# Function to check if process is running
function Test-IsRunning {
    if (Test-Path $PidFile) {
        $pid = Get-Content $PidFile
        try {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            return $process -ne $null
        }
        catch {
            Remove-Item $PidFile -Force
            return $false
        }
    }
    return $false
}

# Function to stop existing processes
function Stop-Services {
    Write-Status "Checking for running services..."
    
    if (Test-IsRunning) {
        $pid = Get-Content $PidFile
        Write-Warning "Found running process (PID: $pid). Stopping..."
        try {
            Stop-Process -Id $pid -Force
            Start-Sleep -Seconds 2
            Remove-Item $PidFile -Force
            Write-Success "Services stopped"
        }
        catch {
            Write-Warning "Process may have already stopped"
            Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
        }
    }
    else {
        Write-Status "No running services found"
    }
}

# Function to install Node.js
function Install-NodeJS {
    if (-not (Test-NodeInstalled)) {
        Write-Status "Installing Node.js 18.x..."
        try {
            # Download and install Node.js using winget or chocolatey
            if (Get-Command winget -ErrorAction SilentlyContinue) {
                winget install OpenJS.NodeJS
            }
            elseif (Get-Command choco -ErrorAction SilentlyContinue) {
                choco install nodejs --version=18.19.0
            }
            else {
                Write-Error "Please install Node.js 18.x manually from https://nodejs.org/"
                exit 1
            }
        }
        catch {
            Write-Error "Failed to install Node.js. Please install manually from https://nodejs.org/"
            exit 1
        }
    }
    else {
        Write-Success "Node.js $(node --version) already installed"
    }
}

# Function to install project dependencies
function Install-ProjectDeps {
    Write-Status "Installing project dependencies..."
    
    # Install server dependencies
    if (Test-Path $ServerDir) {
        Write-Status "Installing server dependencies..."
        Set-Location $ServerDir
        npm install --production
        Set-Location $ProjectDir
    }
    
    # Install client dependencies
    if (Test-Path $ClientDir) {
        Write-Status "Installing client dependencies..."
        Set-Location $ClientDir
        npm install
        npm run build
        Set-Location $ProjectDir
    }
    
    Write-Success "Project dependencies installed"
}

# Function to create environment file
function Setup-Environment {
    Write-Status "Setting up environment configuration..."
    
    $envFile = Join-Path $ServerDir ".env"
    if (-not (Test-Path $envFile)) {
        Write-Status "Creating .env file..."
        $envContent = @"
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_PATH=./database.sqlite

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@example.com

# PayPal Configuration (Optional)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
"@
        $envContent | Out-File -FilePath $envFile -Encoding UTF8
        Write-Warning "Created default .env file. Please update with your actual configuration!"
    }
    else {
        Write-Success "Environment file already exists"
    }
}

# Function to start services
function Start-Services {
    Write-Status "Starting services..."
    
    # Start server in background
    $serverProcess = Start-Process -FilePath "node" -ArgumentList "index.js" -WorkingDirectory $ServerDir -PassThru -WindowStyle Hidden
    $serverProcess.Id | Out-File -FilePath $PidFile -Encoding ASCII
    
    # Wait a moment for server to start
    Start-Sleep -Seconds 3
    
    # Check if server is running
    if ($serverProcess.HasExited) {
        Write-Error "Failed to start server. Check logs for details."
        exit 1
    }
    else {
        Write-Success "Services started successfully!"
        Write-Status "Server running on: http://localhost:5000"
        Write-Status "Client build available in: $ClientDir\build"
        Write-Status "Process ID: $($serverProcess.Id)"
        Write-Status "Logs: $LogFile"
    }
}

# Function to show status
function Show-Status {
    Write-Status "Application Status:"
    Write-Host "===================="
    
    if (Test-IsRunning) {
        $pid = Get-Content $PidFile
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Success "Server is running (PID: $pid)"
            Write-Status "Server URL: http://localhost:5000"
            Write-Status "Process started: $($process.StartTime)"
        }
        else {
            Write-Warning "PID file exists but process not found"
        }
    }
    else {
        Write-Warning "No services running"
    }
}

# Function to show help
function Show-Help {
    Write-Host "Management Web App - Windows PowerShell Startup Script"
    Write-Host "====================================================="
    Write-Host ""
    Write-Host "Usage: .\start.ps1 [OPTION]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  start     Start/restart the application (default)"
    Write-Host "  stop      Stop the application"
    Write-Host "  restart   Restart the application"
    Write-Host "  status    Show application status"
    Write-Host "  install   Install dependencies only"
    Write-Host "  help      Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\start.ps1                # Start/restart application"
    Write-Host "  .\start.ps1 start          # Start/restart application"
    Write-Host "  .\start.ps1 stop           # Stop application"
    Write-Host "  .\start.ps1 status         # Show status"
}

# Main script logic
switch ($Action.ToLower()) {
    "start" {
        Write-Status "Starting Management Web App..."
        Stop-Services
        Install-NodeJS
        Install-ProjectDeps
        Setup-Environment
        Start-Services
        Show-Status
    }
    "restart" {
        Write-Status "Restarting Management Web App..."
        Stop-Services
        Start-Services
        Show-Status
    }
    "stop" {
        Write-Status "Stopping Management Web App..."
        Stop-Services
        Write-Success "Application stopped"
    }
    "status" {
        Show-Status
    }
    "install" {
        Write-Status "Installing dependencies only..."
        Install-NodeJS
        Install-ProjectDeps
        Setup-Environment
        Write-Success "Dependencies installed. Run '.\start.ps1 start' to start the application."
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Unknown option: $Action"
        Show-Help
        exit 1
    }
}