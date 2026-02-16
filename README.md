# 🚀 RobinBoard

```text
██████╗  ██████╗ ██████╗ ██╗███╗   ██╗██████╗  ██████╗  █████╗ ██████╗ ██████╗
██╔══██╗██╔═══██╗██╔══██╗██║████╗  ██║██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔══██╗
██████╔╝██║   ██║██████╔╝██║██╔██╗ ██║██████╔╝██║   ██║███████║██████╔╝██║  ██║
██╔══██╗██║   ██║██╔══██╗██║██║╚██╗██║██╔══██╗██║   ██║██╔══██║██╔══██╗██║  ██║
██║  ██║╚██████╔╝██████╔╝██║██║ ╚████║██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝
```

🎓 **RobinBoard**: okul ekranları için canlı dijital pano sistemi.

- 🖥️ `/#/` → Görüntüleme ekranı
- 🔐 `/#/admin` → Yönetici giriş
- ⚙️ `/#/admin/dashboard` → Yönetim paneli

---

## ✨ Neler Var?

- 🌤️ Hava durumu, saat/tarih, anlık durum paneli
- 📣 Kayan duyuru bandı
- 🎬 Medya yönetimi (görsel/video + altyazı)
- 👩‍🏫 Nöbet çizelgesi + haftalık yer döngüsü
- 📚 Ders programı + zil saatleri
- 🎂 Doğum günü listesi (Cuma günleri hafta sonu ön izlemesi)
- ⚡ Socket.IO ile anlık güncelleme (`settingsChanged`, `scheduleChanged`, `mediaChanged`)

---

## 🧱 Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Flask + Flask-SocketIO
- **Database**: MongoDB (Atlas önerilir)
- **Deploy**: Docker + Docker Compose + Nginx Proxy Manager

---

## 📁 Proje Yapısı

```text
frontend/
  src/pages/                Display, Login, Admin
  src/components/           ortak bileşenler
  src/components/admin/     admin sekmeleri
backend/
  routes/                   auth.py, api.py
  db.py                     Mongo bağlantısı + varsayılan şema
  static/uploads/           yüklenen medya
deploy/nginx/               reverse proxy örneği
```

---

## 🧪 Local Development

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

Vite proxy:
- `/api`
- `/socket.io`
- `/static/uploads`
→ `http://localhost:5000`

---

## 🔑 Environment Variables

### `backend/.env` (local)

```env
MONGO_URI=mongodb://127.0.0.1:27017/RobinBoardDB
SECRET_KEY=replace-with-a-long-random-string
ADMIN_PASSWORD=replace-with-strong-password
CORS_ORIGINS=http://localhost:5000,http://127.0.0.1:5000,http://localhost:5173,http://127.0.0.1:5173
SESSION_COOKIE_SECURE=false
```

### `.env` (production, compose)

`cp .env.production.example .env`

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/RobinBoardDB?retryWrites=true&w=majority&appName=Cluster0
SECRET_KEY=replace-with-very-long-random-secret
ADMIN_PASSWORD=replace-with-strong-admin-password
CORS_ORIGINS=https://your-domain.com
APP_PORT=3390
SESSION_COOKIE_SECURE=false
```

---

## 🌐 API Endpoints

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/status`

### Core
- `GET /api/settings`
- `POST /api/settings/update`
- `GET /api/weather`
- `GET /api/schedule/get`
- `POST /api/schedule/update`

### Students
- `GET /api/students` (admin)
- `POST /api/students` (admin)
- `DELETE /api/students` (admin)
- `DELETE /api/students/<student_id>` (admin)
- `GET /api/birthdays/today`

### Media
- `GET /api/files`
- `POST /api/upload` (admin)
- `POST /api/files/update` (admin)
- `POST /api/files/delete` (admin)

---

## ⚡ Realtime Events

- `settingsChanged`
- `scheduleChanged`
- `mediaChanged`

`mediaChanged` ile Display tarafı upload/update/delete sonrası medyayı anında yeniler.

---

## 🐳 Production / VPS Deploy

### 1) Build + Run

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### 2) First-run volume permission fix

```bash
docker run --rm -v robinboard_uploads_data:/data alpine sh -c "mkdir -p /data/uploads && chown -R 10001:10001 /data && chmod -R 775 /data"
```

### 3) Operasyon

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml restart app
docker compose -f docker-compose.prod.yml down
```

### 4) Uygulama URL

- `http://YOUR_SERVER_IP:3390/#/`
- `http://YOUR_SERVER_IP:3390/#/admin`

---

## 🧯 Troubleshooting

- **Port dolu**: `.env` içindeki `APP_PORT` değiştir.
- **Session çalışmıyor**:
  - Domain+HTTPS: `SESSION_COOKIE_SECURE=true`
  - Direkt IP+HTTP: `SESSION_COOKIE_SECURE=false`
- **Atlas bağlantı hatası**: kullanıcı/şifre + IP whitelist kontrol et.
- **Eski frontend bundle yükleniyor**: `docker compose build --no-cache` + hard refresh (`Ctrl+F5`).

---

## 🔐 Security Notes

- `backend/.env` dosyasını repoya koyma.
- Güçlü `ADMIN_PASSWORD` ve uzun `SECRET_KEY` kullan.
- Prod’da HTTPS reverse proxy (NPM/Nginx/Caddy) kullan.

---

## 🛠️ Update Flow

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

---

## 👨‍💻 Author

Made with ☕ + 💚 by **rob1n.dev**
