#!/bin/bash

APP_NAME="roots-rumors"
PROJECT_DIR=$(pwd)
SYSTEMD_DIR="$HOME/.config/systemd/user"
NPM_PATH=$(which npm)
PYTHON_PATH="$PROJECT_DIR/backend/venv/bin/python"
NODE_DIR="$(dirname "$(which node)")"
# Exporting this is critical for systemd to find `node` since NVM doesn't modify global PATH

# Ensure venv exists before pointing service to it
if [ ! -f "$PYTHON_PATH" ]; then
    echo "Error: Backend virtual environment not found."
    echo "Please run './dev_start.sh' at least once to set up environments."
    exit 1
fi

echo "Setting up systemd user services for $APP_NAME..."
mkdir -p "$SYSTEMD_DIR"

# --- Backend Service File ---
cat > "$SYSTEMD_DIR/$APP_NAME-backend.service" <<EOF
[Unit]
Description=Roots & Rumors Backend (Django)
After=network.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR/backend
ExecStart=$PYTHON_PATH manage.py runserver 0.0.0.0:8000
Restart=on-failure
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=default.target
EOF

# --- Frontend Service File ---
cat > "$SYSTEMD_DIR/$APP_NAME-frontend.service" <<EOF
[Unit]
Description=Roots & Rumors Frontend (Next.js)
After=network.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR/frontend
ExecStart=$NPM_PATH run dev
Restart=on-failure
RestartSec=5
Environment=PATH=$NODE_DIR:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[Install]
WantedBy=default.target
EOF

echo "Reloading systemd..."
systemctl --user daemon-reload

echo "Services created:"
echo "  1. $APP_NAME-backend.service"
echo "  2. $APP_NAME-frontend.service"
echo ""
echo "To start them in the background now:"
echo "  systemctl --user start $APP_NAME-backend $APP_NAME-frontend"
echo ""
echo "To enable them to start on login:"
echo "  systemctl --user enable $APP_NAME-backend $APP_NAME-frontend"
echo ""
echo "To view logs:"
echo "  journalctl --user -u $APP_NAME-backend -f"
