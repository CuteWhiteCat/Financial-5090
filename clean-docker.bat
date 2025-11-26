@echo off
echo ====================================
echo  Cleaning Docker...
echo ====================================
echo.

echo Stopping all containers...
docker-compose down

echo.
echo Removing all containers...
docker container prune -f

echo.
echo Removing unused images...
docker image prune -f

echo.
echo Removing build cache...
docker builder prune -f

echo.
echo Done! You can now run start.bat again
pause
