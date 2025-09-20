@echo off
REM TryOn.ai Startup Script for Windows

echo 🚀 Starting TryOn.ai Application...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

REM Check if .env file exists in backend
if not exist "backend\.env" (
    echo ⚠️  Backend .env file not found. Creating from template...
    copy backend\env.example backend\.env
    echo 📝 Please edit backend\.env and add your GEMINI_API_KEY
    echo    You can get your API key from: https://makersuite.google.com/app/apikey
    pause
)

REM Start backend
echo 🔧 Starting backend server...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

REM Start backend in background
echo 🚀 Starting FastAPI server on http://localhost:8000
start /b python main.py

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo 🎨 Starting frontend server...
cd ..\frontend

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    npm install
)

REM Start frontend
echo 🚀 Starting Next.js server on http://localhost:3000
start /b npm run dev

echo.
echo ✅ TryOn.ai is now running!
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo Press any key to stop both servers
pause >nul

REM Stop processes (this is a simplified approach)
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

echo ✅ Servers stopped
pause
