@echo off
echo Starting Management Web App Services...

REM Start backend server in new window
start "Backend Server" cmd /k "cd server && node index.js"

REM Wait a moment for server to initialize
timeout /t 3 /nobreak >nul

REM Start frontend client in new window
start "Frontend Client" cmd /k "cd client && npm start"

echo.
echo All services started!
echo Backend Server: http://localhost:5000
echo Frontend Client: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul
