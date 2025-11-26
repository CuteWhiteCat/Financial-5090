@echo off
echo ====================================
echo  Trading Strategy Simulator
echo  Stopping Docker Services...
echo ====================================
echo.

docker-compose down

echo.
echo Services stopped successfully!
pause
