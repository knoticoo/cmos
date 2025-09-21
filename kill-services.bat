@echo off
echo 🔍 Checking for running services...

REM Kill Node.js processes
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo table /nh 2^>nul') do (
    echo 🛑 Killing Node.js process %%i
    taskkill /f /pid %%i >nul 2>&1
    if !errorlevel! equ 0 (
        echo    ✅ Process %%i killed successfully
    ) else (
        echo    ❌ Failed to kill process %%i
    )
)

REM Kill npm processes
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq npm.cmd" /fo table /nh 2^>nul') do (
    echo 🛑 Killing npm process %%i
    taskkill /f /pid %%i >nul 2>&1
    if !errorlevel! equ 0 (
        echo    ✅ Process %%i killed successfully
    ) else (
        echo    ❌ Failed to kill process %%i
    )
)

REM Kill processes using port 5000
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000') do (
    echo 🛑 Killing process using port 5000: %%i
    taskkill /f /pid %%i >nul 2>&1
    if !errorlevel! equ 0 (
        echo    ✅ Process %%i killed successfully
    ) else (
        echo    ❌ Failed to kill process %%i
    )
)

REM Kill processes using port 3000
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3000') do (
    echo 🛑 Killing process using port 3000: %%i
    taskkill /f /pid %%i >nul 2>&1
    if !errorlevel! equ 0 (
        echo    ✅ Process %%i killed successfully
    ) else (
        echo    ❌ Failed to kill process %%i
    )
)

echo.
echo 🎯 Service cleanup completed!
echo All running services have been terminated.
pause
