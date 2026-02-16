# RobinBoard

RobinBoard, okul ekranları için hazırlanmış canlı bir dijital pano sistemidir.

- `/#/` : Genel görüntüleme ekranı
- `/#/admin` : Yönetici giriş ekranı
- `/#/admin/dashboard` : Yönetim paneli

## Öne Çıkan Özellikler

- Canlı ekran akışı (hava durumu, zil durumu, ders programı, duyurular)
- Medya yönetimi (görsel/video yükleme, başlık düzenleme, silme)
- Nöbet çizelgesi ve haftalık yer döngüsü
- Öğrenci listesi ve doğum günü bildirimleri
- Socket.IO ile anlık güncellemeler (`settingsChanged`, `scheduleChanged`, `mediaChanged`)

## Teknoloji Yığını

- Frontend: React + Vite + TailwindCSS
- Backend: Flask + Flask-SocketIO
- Veritabanı: MongoDB (Atlas veya harici sunucu)
- Deploy: Docker + Docker Compose + Nginx Proxy Manager

## Proje Yapısı

```text
frontend/                 React uygulaması
  src/pages/              Display, Login, Admin sayfaları
  src/components/admin/   Yönetim sekmeleri
backend/                  Flask API + Socket.IO
  routes/                 auth.py, api.py
  db.py                   varsayılan ayarlar + Mongo bağlantısı
  static/uploads/         medya dosyaları
deploy/nginx/             örnek reverse proxy config
```

## Hızlı Başlangıç (Local)

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

Vite, `/api`, `/socket.io` ve `/static/uploads` isteklerini `http://localhost:5000` adresine proxy eder.

## Production (Docker / VPS)

### 1) Ortam dosyası

```bash
cp .env.production.example .env
```

Doldurulması gereken alanlar:

- `MONGO_URI`
- `SECRET_KEY`
- `ADMIN_PASSWORD`
- `CORS_ORIGINS` (örn: `https://board.rob1n.dev`)
- `APP_PORT` (varsayılan: `3390`)
- `SESSION_COOKIE_SECURE` (`true`: HTTPS proxy arkasında, `false`: direkt HTTP test)

### 2) Yayına alma

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### 3) Operasyon

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml restart app
```

## Güvenlik Notları

- `backend/.env` dosyasını repoya eklemeyin.
- Medya ve veri yedekleri için düzenli backup alın.
- Üretimde güçlü `ADMIN_PASSWORD` ve uzun rastgele `SECRET_KEY` kullanın.

## Güncelleme Akışı

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```
