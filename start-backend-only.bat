@echo off
echo ====================================
echo  Starting Backend Server
echo ====================================
echo.

cd backend

REM Remove old venv if exists to start fresh
if exist venv (
    echo Removing old virtual environment...
    rmdir /s /q venv
)

echo Creating new virtual environment...
py -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo ====================================
echo  Installing Dependencies
echo  (This will take 2-3 minutes)
echo ====================================
echo.

REM Upgrade pip first
python -m pip install --upgrade pip

echo.
echo [1/15] Installing fastapi...
python -m pip install fastapi

echo [2/15] Installing uvicorn...
python -m pip install "uvicorn[standard]"

echo [3/15] Installing python-multipart...
python -m pip install python-multipart

echo [4/15] Installing psycopg2-binary...
python -m pip install psycopg2-binary

echo [5/15] Installing python-jose...
python -m pip install "python-jose[cryptography]"

echo [6/15] Installing passlib...
python -m pip install "passlib[bcrypt]"

echo [7/15] Installing python-dotenv...
python -m pip install python-dotenv

echo [8/15] Installing pydantic...
python -m pip install pydantic

echo [9/15] Installing pydantic-settings...
python -m pip install pydantic-settings

echo [10/15] Installing pandas (this is slow, please wait)...
python -m pip install pandas

echo [11/15] Installing numpy...
python -m pip install numpy

echo [12/15] Installing yfinance...
python -m pip install yfinance

echo [13/15] Installing requests...
python -m pip install requests

echo [14/15] Installing python-dateutil...
python -m pip install python-dateutil

echo [15/15] Installing pytz...
python -m pip install pytz

echo.
echo ====================================
echo  All Dependencies Installed!
echo  Starting Backend Server...
echo ====================================
echo.

REM Verify uvicorn is installed
python -m pip show uvicorn >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: uvicorn not installed properly!
    echo Trying to install again...
    python -m pip install uvicorn
)

echo.
echo Backend is starting at:
echo   http://localhost:8000
echo   http://localhost:8000/docs (API Documentation)
echo.
echo Press Ctrl+C to stop the server
echo.
echo ====================================
echo.

REM Start the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
