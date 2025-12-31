#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
LOG_DIR="./logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKEND_LOG="$LOG_DIR/backend_$TIMESTAMP.log"
FRONTEND_LOG="$LOG_DIR/frontend_$TIMESTAMP.log"
COMBINED_LOG="$LOG_DIR/combined_$TIMESTAMP.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

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

# Detect local IP address for network access
LOCAL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="127.0.0.1"
fi

echo -e "${BLUE}🌱 Roots & Rumors Dev Launcher${NC}"
echo -e "${BLUE}Backend port: $BACKEND_PORT, Frontend port: $FRONTEND_PORT${NC}"
echo -e "${BLUE}Local IP: $LOCAL_IP${NC}"
echo -e "${YELLOW}📝 Logs available in: $LOG_DIR${NC}"
echo -e "${YELLOW}   Backend:  $BACKEND_LOG${NC}"
echo -e "${YELLOW}   Frontend: $FRONTEND_LOG${NC}"
echo -e "${YELLOW}   Combined: $COMBINED_LOG${NC}"

# Function to handle cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Shutting down processes...${NC}"
    kill $(jobs -p) 2>/dev/null
    # Restore .env.local if it was backed up
    if [ -f "frontend/.env.local.backup" ]; then
        mv frontend/.env.local.backup frontend/.env.local
    fi
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
python manage.py makemigrations api 2>&1 | tee -a "$BACKEND_LOG" "$COMBINED_LOG"
python manage.py migrate 2>&1 | tee -a "$BACKEND_LOG" "$COMBINED_LOG"

# Start Server with CORS support for custom frontend port (including local IP for network access)
# Listen on 0.0.0.0 to make it available on the local network
echo "Starting Django..."
{
    echo -e "\n=== Django Backend Started at $(date) ==="
    CORS_ALLOWED_ORIGINS="http://localhost:$FRONTEND_PORT,http://127.0.0.1:$FRONTEND_PORT,http://0.0.0.0:$FRONTEND_PORT,http://$LOCAL_IP:$FRONTEND_PORT" \
    DJANGO_ALLOWED_HOSTS="localhost,127.0.0.1,0.0.0.0,$LOCAL_IP" \
    python manage.py runserver 0.0.0.0:$BACKEND_PORT
} 2>&1 | tee -a "$BACKEND_LOG" "$COMBINED_LOG" &
BACKEND_PID=$!
cd ..

# --- Frontend ---
echo -e "${GREEN}--> Setting up Frontend...${NC}"
cd frontend

# Backup .env.local if it exists (it would override our runtime env vars)
if [ -f ".env.local" ]; then
    echo "Temporarily backing up .env.local..."
    mv .env.local .env.local.backup
fi

# Clear Next.js cache to ensure environment variables are picked up fresh
# This is necessary because NEXT_PUBLIC_* vars are embedded at build time
if [ -d ".next" ]; then
    echo "Clearing Next.js cache for fresh environment variables..."
    rm -rf .next
fi

# Install node_modules if missing
if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install 2>&1 | tee -a "$FRONTEND_LOG" "$COMBINED_LOG"
fi

# Start Next.js with dynamic API URL using local IP for network access
# Use 0.0.0.0 to make it available on the local network
echo "Starting Next.js..."
{
    echo -e "\n=== Next.js Frontend Started at $(date) ==="
    NEXT_PUBLIC_API_URL=http://$LOCAL_IP:$BACKEND_PORT PORT=$FRONTEND_PORT npm run dev -- -H 0.0.0.0
} 2>&1 | tee -a "$FRONTEND_LOG" "$COMBINED_LOG" &
FRONTEND_PID=$!
cd ..

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🚀 App is running!${NC}"
echo -e "${YELLOW}On this machine (localhost):${NC}"
echo -e "Backend:  http://localhost:$BACKEND_PORT"
echo -e "Frontend: http://localhost:$FRONTEND_PORT"
echo -e "${YELLOW}On network (using local IP $LOCAL_IP):${NC}"
echo -e "Backend:  http://$LOCAL_IP:$BACKEND_PORT"
echo -e "Frontend: http://$LOCAL_IP:$FRONTEND_PORT"
echo -e "${YELLOW}📝 Errors logged to: $COMBINED_LOG${NC}"
echo -e "${BLUE}Press Ctrl+C to stop.${NC}"

wait
