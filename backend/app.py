import eventlet

eventlet.monkey_patch()

import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv
from werkzeug.middleware.proxy_fix import ProxyFix

from db import init_db
from realtime import init_realtime
from routes.auth import auth_bp
from routes.api import api_bp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")

load_dotenv(os.path.join(BASE_DIR, ".env"))
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path="")
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
app.config.update(
    SECRET_KEY=os.getenv("SECRET_KEY", "change-me"),
    UPLOAD_FOLDER=UPLOAD_FOLDER,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true",
)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5000,http://127.0.0.1:5000,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins=cors_origins, async_mode="eventlet")
init_realtime(socketio)

with app.app_context():
    init_db(app)

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(api_bp, url_prefix="/api")


@app.route("/static/uploads/<path:filename>")
def serve_uploads(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)

    index_path = os.path.join(app.static_folder, "index.html")
    if not os.path.exists(index_path):
        return (
            "Frontend build dosyalari bulunamadi. "
            "Once frontend klasorunde `npm run build` calistirin."
        )
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    print("==============================================")
    print("RobinBoard server is running")
    print(f"Uploads: {UPLOAD_FOLDER}")
    print("URL:     http://localhost:5000")
    print("==============================================")
    socketio.run(app, host="0.0.0.0", port=5000)
