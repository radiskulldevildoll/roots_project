# 🚀 Quick Start Guide

## Current Status
✅ Backend running on: http://localhost:8000
✅ Frontend running on: http://localhost:3001

## Important: Where to Go

### ❌ WRONG - Don't go to:
- http://localhost:8000 (This is the API backend only - no UI here!)

### ✅ CORRECT - Go to:
- **http://localhost:3001** (This is your app with the beautiful UI)

## Login Information
- **Username**: `admin`
- **Password**: `admin` (or the password you created)

## Steps to Access Your App

1. **Open your browser**
2. **Go to**: http://localhost:3001
3. **You should see**: A dark-themed login page
4. **Enter credentials**: admin / admin
5. **Click**: "Enter Archive"

## If You See a White Page

This means the browser cached the old version. Fix it:

### Option 1: Hard Refresh
- **Windows/Linux**: Press `Ctrl + Shift + R`
- **Mac**: Press `Cmd + Shift + R`

### Option 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Click "Empty Cache and Hard Reload"

### Option 3: Try Incognito/Private Mode
Open the URL in a private/incognito window

## What You Should See

### Login Page
- Dark gray background (#1f2937)
- Emerald green accent color
- "Login" header in emerald
- Username and password fields
- "Enter Archive" button

### After Login - Tree Dashboard
If you have NO people yet:
- Dark gradient background
- Welcome message
- "Add First Person" button

If you have people:
- Family tree with nodes
- Search bar at top
- Minimap in corner
- Stats showing member count

## Troubleshooting

### "Login failed" Error
Make sure both servers are running:
```bash
# Check backend
curl http://localhost:8000/api/auth/jwt/create/

# Should respond (not "connection refused")
```

### White/Blank Screen
1. Clear Next.js cache: `rm -rf frontend/.next`
2. Restart frontend server
3. Hard refresh browser (Ctrl+Shift+R)

### Tree Not Loading
Check browser console (F12) for errors. The frontend needs to talk to backend at port 8000.

## Running Both Servers

### Quick Way (Recommended)
```bash
cd /home/rodney/roots_project
./dev_start.sh
```

### Manual Way
Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

## Remember!
Always use port **3001** for the app UI, not 8000!
