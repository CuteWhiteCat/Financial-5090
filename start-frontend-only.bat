@echo off
echo ====================================
echo  Starting Frontend Server
echo ====================================
echo.

cd frontend

echo.
echo Checking if node_modules exists...

if exist node_modules (
    echo node_modules folder exists!
    echo Skipping installation, starting server...
    goto startserver
)

echo node_modules not found, need to install...
echo.
echo ====================================
echo  Installing Dependencies
echo  This will take 3-5 minutes
echo  Please be patient...
echo ====================================
echo.

REM Use faster registry
echo Setting npm registry to faster mirror...
call npm config set registry https://registry.npmmirror.com

echo.
echo Starting installation...
call npm install --legacy-peer-deps

if %errorlevel% neq 0 (
    echo.
    echo Installation failed with mirror! Trying default registry...
    call npm config set registry https://registry.npmjs.org/
    call npm install --legacy-peer-deps

    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Installation failed!
        echo Please check your internet connection and try again.
        pause
        exit /b 1
    )
)

:startserver
echo.
echo ====================================
echo  Starting React Development Server
echo ====================================
echo.
echo Frontend will be available at:
echo   http://localhost:3000
echo.
echo The browser will open automatically in about 30 seconds.
echo Press Ctrl+C to stop the server.
echo.
echo ====================================
echo.

REM Start the server
call npm start

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start frontend server!
    echo Please check the error messages above.
    pause
    exit /b 1
)

pause
