#!/bin/bash
echo "================================================"
echo " PRAKRITI - AI Disaster Intelligence System"  
echo "================================================"
echo ""

echo "[1/4] Setting up Python virtual environment..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
fi

echo "[2/4] Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt -q

echo "[3/4] Copying environment file..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ".env file created."
fi

echo "[4/4] Starting backend server..."
echo "Backend: http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
echo ""
uvicorn app.main:app --reload --port 8000
