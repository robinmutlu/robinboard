# RobinBoard

RobinBoard is a school digital signage system:
- Public display (`/#/`)
- Admin login (`/#/admin`)
- Admin dashboard (`/#/admin/dashboard`)

## Tech Stack
- Frontend: React + Vite + Tailwind
- Backend: Flask + Flask-SocketIO
- Database: MongoDB

## Local Development
### 1) Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api`, `/socket.io`, and `/static/uploads` to `http://localhost:5000`.

## Docker Production (VPS)
This repo now includes:
- `Dockerfile` (multi-stage: frontend build + Python runtime)
- `docker-compose.prod.yml` (app container; MongoDB expected via Atlas/remote URI)
- `.env.production.example` (compose environment template)
- `deploy/nginx/robinboard.conf` (reverse proxy sample with WebSocket support)

### 1) Prepare environment
```bash
cp .env.production.example .env
```
Set:
- `MONGO_URI` (MongoDB Atlas connection string)
- `SECRET_KEY`
- `ADMIN_PASSWORD`
- `CORS_ORIGINS` (your HTTPS domain)
- `APP_PORT` (host port, default `3390`)
- `SESSION_COOKIE_SECURE` (`true` behind HTTPS proxy, `false` for direct HTTP access)

### 2) Deploy
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3) Operate
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml restart app
```

### 4) Update
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Notes
- The app is served on port `5000` inside the container.
- Host port is controlled by `APP_PORT` in `.env` (default `3390`).
- Use Nginx/Caddy in front for HTTPS termination and domain routing.
- WebSocket upgrade headers are required for Socket.IO (included in the sample Nginx config).
