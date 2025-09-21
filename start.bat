@echo off
echo 🚀 CMOS Service Manager
echo =========================

REM Check if services are running
netstat -an | findstr :5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Services are already running!
    echo    Backend: http://localhost:5000
    echo    Frontend: http://localhost:3000
    echo.
    echo Options:
    echo    • Use start.bat -force to restart services
    echo    • Use kill-services.bat to stop services
    echo.
    set /p response="Do you want to restart services? (y/N): "
    if /i "%response%"=="y" (
        echo 🔄 Restarting services...
        goto :restart
    ) else (
        echo    Services left running.
        pause
        exit /b 0
    )
) else (
    echo ✅ No services running, starting fresh...
    goto :start
)

:restart
echo 🛑 Stopping all running services...

REM Kill Node.js processes
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo table /nh 2^>nul') do (
    echo    Killing Node.js process %%i
    taskkill /f /pid %%i >nul 2>&1
)

REM Kill npm processes
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq npm.cmd" /fo table /nh 2^>nul') do (
    echo    Killing npm process %%i
    taskkill /f /pid %%i >nul 2>&1
)

REM Kill processes using ports
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000') do (
    echo    Killing process using port 5000: %%i
    taskkill /f /pid %%i >nul 2>&1
)

for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3000') do (
    echo    Killing process using port 3000: %%i
    taskkill /f /pid %%i >nul 2>&1
)

echo    ✅ All services stopped
timeout /t 3 /nobreak >nul

:start
echo 🚀 Starting all services...

echo    Starting backend server (port 5000)...
start "Backend Server" /min cmd /c "cd server && npm start"

timeout /t 3 /nobreak >nul

echo    Starting frontend server (port 3000)...
start "Frontend Server" /min cmd /c "cd client && npm start"

echo    Waiting for services to initialize...
timeout /t 5 /nobreak >nul

echo.
echo 🎯 Service management completed!
echo    Backend: http://localhost:5000
echo    Frontend: http://localhost:3000
echo.
echo 💡 Tips:
echo    • Use start.bat -force to force restart
echo    • Use kill-services.bat to stop all services
echo    • Check taskbar for minimized command windows
echo.
pause
