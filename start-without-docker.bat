@echo off
echo ====================================
echo  Trading Strategy Simulator
echo  Starting WITHOUT Docker
echo  (Faster and Simpler)
echo ====================================
echo.

REM Check if Python is installed
py --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found!
    echo Please install Python 3.11 first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js first.
    pause
    exit /b 1
)

echo [1/5] Checking Backend Setup...
cd backend

REM Create virtual environment if not exists
if not exist venv (
    echo Creating Python virtual environment...
    py -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

echo.
echo [2/5] Installing Python dependencies (this may take 1-2 minutes)...
echo Please wait, installing: FastAPI, Pandas, yfinance, etc.

REM Install with progress
pip install --quiet --upgrade pip
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install Python dependencies!
    echo Trying alternative method...
    pip install fastapi uvicorn pandas numpy yfinance python-dotenv pydantic requests
)

echo [3/5] Starting Backend Server...
REM Start backend in background
start "Backend Server" cmd /k "cd /d %cd% && venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

cd ..

echo.
echo [4/5] Checking Frontend Setup...
cd frontend

REM Check if node_modules exists
if not exist node_modules (
    echo Installing Node.js dependencies...
    echo This is the SLOWEST part, may take 3-5 minutes on first run.
    echo.
    call npm install --legacy-peer-deps
) else (
    echo Node modules already installed, skipping...
)

echo.
echo [5/5] Starting Frontend Server...
REM Start frontend
start "Frontend Server" cmd /k "cd /d %cd% && npm start"

cd ..

echo.
echo ====================================
echo  Services Started Successfully!
echo ====================================
echo.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:3000 (will open shortly)
echo  API Docs: http://localhost:8000/docs
echo.
echo ====================================
echo.
echo Waiting for frontend to start (usually 30-60 seconds)...
echo The browser will open automatically when ready.
echo.
echo Note: Two command windows are running in background.
echo       Close those windows to stop the services.
echo.

REM Wait for frontend to be ready
timeout /t 15 /nobreak >nul
start http://localhost:3000

echo.
echo Done! The application should be opening in your browser.
echo.
pause
