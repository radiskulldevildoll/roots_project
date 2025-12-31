# 🌳 Roots & Rumors - Quick Start Guide

A beautiful family tree and genealogy application to preserve your family history.

---

## 📋 Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **Git** (for cloning)

---

## 🚀 Quick Setup

### 1. Clone & Enter Project
```bash
git clone https://github.com/radiskulldevildoll/roots_project.git
cd roots_project
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file (IMPORTANT!)
cp .env.example .env  # Edit .env with your settings for production

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start server
python manage.py runserver 0.0.0.0:8000
```

### 3. Frontend Setup (New Terminal)
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file (optional for dev)
cp .env.example .env.local

# Start development server
npm run dev
```

---

## 🌐 Access Your App

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend App** | http://localhost:3000 | Main application UI |
| **Backend API** | http://localhost:8000/api/ | REST API (no UI) |
| **Django Admin** | http://localhost:8000/admin/ | Database admin |

**⚠️ Always use port 3000 for the app** - Port 8000 is API only!

---

## 🔐 Login

### First Time
1. Go to http://localhost:3000
2. You'll see a beautiful dark-themed login page
3. Use the credentials you created with `createsuperuser`

### Registration Requirements
When creating new accounts, passwords must have:
- ✅ At least 8 characters
- ✅ One uppercase letter (A-Z)
- ✅ One lowercase letter (a-z)  
- ✅ One number (0-9)

---

## 📱 Features

### Family Tree (`/dashboard/tree`)
- Interactive tree visualization with drag-and-drop
- Add family members (spouses, children, parents, siblings)
- Upload profile photos
- Confidence levels for uncertain genealogy data
- Search and filter family members
- Vertical/horizontal layout toggle

### Stories (`/dashboard/stories`)
- Write family stories and memories
- Tag people mentioned in stories
- Markdown-supported content
- Date tracking for events

### Media Gallery (`/dashboard/media`)
- Upload photos, videos, documents
- Tag family members in media
- Filter by media type
- Beautiful grid gallery view

---

## ⚙️ Environment Configuration

### Backend (`.env`)
```bash
# Required for production
DJANGO_SECRET_KEY=your-super-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Optional
DJANGO_LOG_LEVEL=INFO
SECURE_SSL_REDIRECT=True
```

### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🛠️ Development

### One-Command Start (After Setup)
```bash
./dev_start.sh  # Starts both backend and frontend
```

### Manual Start
```bash
# Terminal 1 - Backend
cd backend && source venv/bin/activate
python manage.py runserver 0.0.0.0:8000

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

---

## 🐛 Troubleshooting

### White/Blank Screen
```bash
# Clear Next.js cache
rm -rf frontend/.next
npm run dev

# Hard refresh browser
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R
```

### Login Failed
```bash
# Check backend is running
curl http://localhost:8000/api/auth/jwt/create/

# If "connection refused", start backend first
```

### Database Issues
```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
```

### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

---

## 🚀 Production Deployment

### Backend
```bash
# Set environment variables
export DJANGO_SECRET_KEY="generate-a-secure-key"
export DJANGO_DEBUG=False
export DJANGO_ALLOWED_HOSTS="yourdomain.com"
export CORS_ALLOWED_ORIGINS="https://yourdomain.com"
export DATABASE_URL="postgres://..."

# Collect static files
python manage.py collectstatic

# Use gunicorn
pip install gunicorn
gunicorn roots_project.wsgi:application
```

### Frontend
```bash
export NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
npm run build
npm start
```

---

## 📚 More Information

See `ENHANCEMENTS_SUMMARY.md` for:
- Full feature documentation
- Technical architecture
- API endpoints
- Future roadmap

---

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review `ENHANCEMENTS_SUMMARY.md`
3. Open an issue on GitHub

---

**Happy Family Tree Building! 🌳**
