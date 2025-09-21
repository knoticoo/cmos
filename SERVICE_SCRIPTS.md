# Service Management Scripts

This directory contains scripts to easily start and stop all services for the Management Web App.

## Available Scripts

### PowerShell Scripts (Recommended)

#### `start-services.ps1`
- Starts both backend server and frontend client in the background
- Monitors service health and displays status
- Shows process IDs for each service
- Automatically stops all services when script is terminated

**Usage:**
```powershell
.\start-services.ps1
```

#### `stop-services.ps1`
- Stops all running services
- Cleans up any orphaned processes
- Safe to run multiple times

**Usage:**
```powershell
.\stop-services.ps1
```

### Batch File Alternative

#### `start-services.bat`
- Simple batch file that opens services in separate command windows
- Good for development and debugging
- Services run in visible windows

**Usage:**
```cmd
start-services.bat
```

## Service Information

- **Backend Server**: Runs on port 5000 (http://localhost:5000)
- **Frontend Client**: Runs on port 3000 (http://localhost:3000)
- **Database**: SQLite database files in `server/data/` directory

## Prerequisites

- Node.js installed and in PATH
- All dependencies installed (`npm install` in both `server/` and `client/` directories)

## Troubleshooting

### If services don't start:
1. Check if ports 3000 and 5000 are available
2. Ensure all dependencies are installed
3. Check the console output for error messages

### If you get permission errors:
1. Right-click PowerShell and "Run as Administrator"
2. Or set execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### To stop services manually:
1. Use `stop-services.ps1`
2. Or find and kill Node.js processes in Task Manager
3. Or close the command windows if using the batch file

## Development Workflow

1. **Start development**: `.\start-services.ps1`
2. **Make changes**: Edit code in your preferred editor
3. **Test changes**: Refresh browser (frontend) or restart services (backend)
4. **Stop development**: `.\stop-services.ps1` or Ctrl+C

## Notes

- The PowerShell script provides better process management and monitoring
- The batch file is simpler but less robust
- Services will automatically restart if you make changes to the code (hot reload)
- Database changes require a server restart
