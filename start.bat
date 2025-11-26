@echo off
echo ====================================
echo  Trading Strategy Simulator
echo  Starting Docker Services...
echo ====================================
echo.

echo Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running!
    echo Please install Docker Desktop first.
    pause
    exit /b 1
)

echo Docker found! Starting services...
echo.

docker-compose up --build

pause
