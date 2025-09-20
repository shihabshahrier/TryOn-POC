#!/bin/bash

# TryOn.ai Startup Script

echo "🚀 Starting TryOn.ai Application..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Creating from template..."
    cp backend/env.example backend/.env
    echo "📝 Please edit backend/.env and add your GEMINI_API_KEY"
    echo "   You can get your API key from: https://makersuite.google.com/app/apikey"
    read -p "Press Enter after adding your API key..."
fi

# Start backend
echo "🔧 Starting backend server..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Start backend in background
echo "🚀 Starting FastAPI server on http://localhost:8000"
python main.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start frontend
echo "🚀 Starting Next.js server on http://localhost:3000"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ TryOn.ai is now running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
