# VPS Deployment Guide (Docker)

This project is production-ready with Docker Compose (`docker-compose.prod.yml`).

## 1) Requirements on VPS
- Ubuntu/Debian VPS
- Docker + Docker Compose plugin installed
- Open firewall port `3390` (or your custom `APP_PORT`)

## 2) Upload Project
Upload `robinboard-vps-deploy.zip` to your server, then:

```bash
mkdir -p ~/apps/robinboard
cd ~/apps/robinboard
unzip ~/robinboard-vps-deploy.zip
```

If unzip created an extra folder layer, enter the folder that contains `docker-compose.prod.yml`.

## 3) Configure Environment (MongoDB Atlas)
```bash
cp .env.production.example .env
nano .env
```

Set:
- `MONGO_URI` (Atlas connection string)
- `SECRET_KEY` (long random string)
- `ADMIN_PASSWORD` (strong password)
- `CORS_ORIGINS` (your public HTTPS URL, e.g. `https://your-domain.com`)
- `APP_PORT` (default `3390`; change if needed)
- `SESSION_COOKIE_SECURE` (`true` if HTTPS termination is active on domain, `false` for direct `http://IP:PORT`)

Atlas checklist:
- Create DB user (Database Access) and use that user in `MONGO_URI`.
- Add VPS IP to Atlas Network Access (or temporary `0.0.0.0/0` for testing).
- Ensure database name in URI matches app usage (`RobinBoardDB`).

## 4) Run in Production
```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

If this is the first run (or after changing volume mount), set volume permissions once:
```bash
docker run --rm -v robinboard_uploads_data:/data alpine sh -c "mkdir -p /data/uploads && chown -R 10001:10001 /data && chmod -R 775 /data"
```

App URL (current mapping):
- `http://YOUR_SERVER_IP:3390/#/`
- `http://YOUR_SERVER_IP:3390/#/admin`

## 5) Update Deployment
After uploading a new package:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 6) Restart / Stop
```bash
docker compose -f docker-compose.prod.yml restart app
docker compose -f docker-compose.prod.yml down
```

## 7) Optional: Nginx + Domain + HTTPS
- Use `deploy/nginx/robinboard.conf` as base.
- Proxy to `127.0.0.1:${APP_PORT}`.
- Keep WebSocket headers (`Upgrade` / `Connection`) for Socket.IO.

## Troubleshooting
- Check app logs: `docker compose -f docker-compose.prod.yml logs -f app`
- If the host port is already used, change `APP_PORT` in `.env` and restart containers.
- If app cannot connect, Atlas usually returns auth/network errors: verify DB user password and IP whitelist.
