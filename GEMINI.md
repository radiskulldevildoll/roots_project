# 🌳 Roots & Rumors - Project Documentation

## Project Overview
Roots & Rumors is a family tree and genealogy application designed to preserve family history through interactive tree visualizations, stories, and media galleries.

## System Architecture

### Backend (Django)
- **Framework:** Django 6.0 + Django REST Framework.
- **Database:** SQLite (default).
- **Authentication:** Djoser + JWT (SimpleJWT).
- **Key Models:** `Person`, `Relationship`, `ParentChildLink`, `Story`, `Media`, `Feedback`.
- **Port:** 8001 (Customized to avoid conflicts).

### Frontend (Next.js)
- **Framework:** Next.js 14 (App Router).
- **Styling:** Tailwind CSS + Lucide Icons.
- **State/Form:** React Hook Form + Zod.
- **Port:** 3001 (Customized to avoid conflicts).

## External Access (Cloudflare)
- **Domain:** `roots.pimpnation.org`
- **Tool:** `cloudflared` tunnel.
- **Config:** `tunnel_config.yml` handles ingress for both Frontend and Backend (API/Admin/Static).

## Key Customizations & Recent Changes

### 🔐 Authentication & Security
- **Minimum Password Length:** Reduced from 8 to **7 characters** in both `backend/roots_project/settings.py` and `frontend/utils/validations.js` to support legacy credentials (e.g., `admin:nitrous`).
- **CORS/Allowed Hosts:** Updated to include `roots.pimpnation.org`.

### 🐞 Feedback System
- **Feature:** Added a "Feedback" button to the dashboard sidebar.
- **Backend:** `Feedback` model stores bug reports and feature requests.
- **Frontend:** `FeedbackModal.js` component for user submissions.

### 🚀 Launcher Updates (`dev_start.sh`)
- Modified to support `NEXT_PUBLIC_API_URL` as an environment variable override.
- Default ports shifted to 8001/3001.

## Setup & Operation

### Starting the Application
```bash
# Set the public API URL and start both services
export NEXT_PUBLIC_API_URL=https://roots.pimpnation.org
./dev_start.sh --backend-port 8001 --frontend-port 3001
```

### Running the Tunnel
```bash
# Start the Cloudflare tunnel with the custom config
cloudflared tunnel --config tunnel_config.yml run roots-project
```

### Database Management
- **Type:** SQLite (`backend/db.sqlite3`).
- **Backup:** `roots_project_backup_[timestamp].tar.gz` exists in the parent directory.
- **Superuser Creation:** Use `python manage.py createsuperuser` or the `create_superuser.py` script.

## Operational Notes
- **API URL:** The frontend **must** be built/started with the correct `NEXT_PUBLIC_API_URL` to ensure browser-side API calls hit the public tunnel endpoint instead of local IP.
- **Static Files:** Django admin static files are routed via the tunnel under `/static/*`.
- **_next:** Explicit ingress rule `/_next/*` is required in Cloudflare to prevent Next.js assets from hitting the Django backend.
