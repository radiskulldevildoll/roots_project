#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default ports
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --backend-port)
      BACKEND_PORT="$2"
      shift 2
      ;;
    --frontend-port)
      FRONTEND_PORT="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--backend-port PORT] [--frontend-port PORT]"
      echo "  --backend-port PORT   Backend port (default: 8000)"
      echo "  --frontend-port PORT  Frontend port (default: 3000)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🌱 Roots & Rumors Dev Launcher${NC}"
echo -e "${BLUE}Backend port: $BACKEND_PORT, Frontend port: $FRONTEND_PORT${NC}"

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

# Start Server with CORS support for custom frontend port
echo "Starting Django..."
CORS_ALLOWED_ORIGINS="http://localhost:$FRONTEND_PORT,http://127.0.0.1:$FRONTEND_PORT" python manage.py runserver 0.0.0.0:$BACKEND_PORT &
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

# Start Next.js with dynamic API URL
echo "Starting Next.js..."
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT PORT=$FRONTEND_PORT npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🚀 App is running!${NC}"
echo -e "Backend:  http://localhost:$BACKEND_PORT"
echo -e "Frontend: http://localhost:$FRONTEND_PORT"
echo -e "${BLUE}Press Ctrl+C to stop.${NC}"

wait
