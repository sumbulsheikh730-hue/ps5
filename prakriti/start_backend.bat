@echo off
echo ================================================
echo  PRAKRITI - AI Disaster Intelligence System
echo  Setup and Launch Script (Windows)
echo ================================================
echo.

echo [1/4] Setting up Python virtual environment...
cd backend
if not exist venv (
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

echo.
echo [2/4] Installing Python dependencies...
call venv\Scripts\activate
pip install -r requirements.txt --quiet

echo.
echo [3/4] Copying environment file...
if not exist .env (
    copy .env.example .env
    echo .env file created from example.
) else (
    echo .env already exists.
)

echo.
echo [4/4] Starting backend server...
echo Backend will be available at: http://localhost:8000
echo API docs at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server.
echo.
start "PRAKRITI Backend" cmd /k "call venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo.
echo ================================================
echo  Frontend setup (run in a separate terminal):
echo  cd frontend
echo  npm install
echo  npm run dev
echo ================================================
echo.
pause
