#!/bin/bash

# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate

# Create superuser
echo "Creating admin user..."
echo "Username will be: admin"
echo "Email will be: admin@example.com"
echo ""
echo "Please enter a password when prompted:"

python manage.py createsuperuser --username admin --email admin@example.com

echo ""
echo "✅ User created! You can now login with:"
echo "   Username: admin"
echo "   Password: (the password you just entered)"
