#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌱 Roots & Rumors Dev Launcher${NC}"

# Function to handle cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Shutting down processes...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup EXIT INT

# --- Backend ---
echo -e "${GREEN}--> Setting up Backend...${NC}"
cd backend

# Create venv if missing
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install deps if needed (simple check)
if [ ! -f "venv/.installed" ]; then
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Migrations
echo "Checking database..."
python manage.py makemigrations api
python manage.py migrate

# Start Server
echo "Starting Django..."
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd ..

# --- Frontend ---
echo -e "${GREEN}--> Setting up Frontend...${NC}"
cd frontend

# Install node_modules if missing
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi

# Start Next.js
echo "Starting Next.js..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🚀 App is running!${NC}"
echo -e "Backend:  http://localhost:8000"
echo -e "Frontend: http://localhost:3000"
echo -e "${BLUE}Press Ctrl+C to stop.${NC}"

wait
