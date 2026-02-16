import os
import uuid
import requests
from datetime import datetime, timedelta
from functools import wraps

from flask import Blueprint, current_app, jsonify, request, session
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument
from werkzeug.utils import secure_filename

from db import get_db
from realtime import broadcast

api_bp = Blueprint("api", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "mp4", "avi", "mov"}
PUBLIC_SETTINGS_FIELDS = {
    "schoolName",
    "isEmergency",
    "emergencyMessage",
    "marqueeText",
    "weatherCity",
    "dutySchedule",
    "dutyRotationStartDate",
    "bellConfig",
}
TR_WEEKDAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]


def get_monday_iso(date_value):
    monday = date_value - timedelta(days=date_value.weekday())
    return monday.strftime("%Y-%m-%d")


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def admin_required(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        if not session.get("is_admin"):
            return jsonify({"success": False, "message": "Yetkisiz erişim"}), 401
        return handler(*args, **kwargs)

    return wrapper


def serialize_student(student_doc):
    serialized = {key: value for key, value in student_doc.items() if key != "_id"}
    serialized["id"] = str(student_doc.get("_id"))
    return serialized


@api_bp.route("/settings", methods=["GET"])
def get_settings():
    db = get_db()
    if db is None:
        return jsonify({"error": "Database not connected"}), 503

    settings = db.settings.find_one({}, {"_id": 0}) or {}
    if not settings.get("dutyRotationStartDate"):
        rotation_start = get_monday_iso(datetime.now())
        settings["dutyRotationStartDate"] = rotation_start
        db.settings.update_one({}, {"$set": {"dutyRotationStartDate": rotation_start}}, upsert=True)

    if session.get("is_admin"):
        return jsonify(settings)

    public_data = {field: settings.get(field) for field in PUBLIC_SETTINGS_FIELDS if field in settings}
    return jsonify(public_data)


@api_bp.route("/settings/update", methods=["POST"])
@admin_required
def update_settings():
    db = get_db()
    if db is None:
        return jsonify({"error": "Database not connected"}), 503

    data = request.json or {}
    if "dutySchedule" in data and "dutyRotationStartDate" not in data:
        current = db.settings.find_one({}, {"_id": 0, "dutyRotationStartDate": 1}) or {}
        data["dutyRotationStartDate"] = current.get("dutyRotationStartDate") or get_monday_iso(
            datetime.now()
        )
    updated = db.settings.find_one_and_update(
        {},
        {"$set": data},
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
        upsert=True,
    )
    broadcast("settingsChanged", data)
    return jsonify({"success": True, "data": updated or {}})


@api_bp.route("/weather", methods=["GET"])
def get_weather():
    db = get_db()
    if db is None:
        return jsonify({"error": "Database not connected"}), 503

    settings = db.settings.find_one({}, {"_id": 0}) or {}
    city = settings.get("weatherCity", "İstanbul")
    api_key = settings.get("weatherApiKey", "")
    if not api_key:
        return jsonify({"temp": "--", "status": "API Key eksik", "icon": ""})

    try:
        url = (
            "https://api.openweathermap.org/data/2.5/weather"
            f"?q={city}&appid={api_key}&units=metric&lang=tr"
        )
        weather_data = requests.get(url, timeout=5).json()
        if weather_data.get("cod") != 200:
            return jsonify({"temp": "--", "status": "Şehir hatalı", "icon": ""})

        return jsonify(
            {
                "temp": round(weather_data["main"]["temp"]),
                "status": weather_data["weather"][0]["description"].title(),
                "icon": f"https://openweathermap.org/img/wn/{weather_data['weather'][0]['icon']}@4x.png",
            }
        )
    except Exception:
        return jsonify({"temp": "--", "status": "Hata", "icon": ""})


@api_bp.route("/students", methods=["GET", "POST", "DELETE"])
def manage_students():
    db = get_db()
    if db is None:
        return jsonify({"error": "Database not connected"}), 503

    if not session.get("is_admin"):
        return jsonify({"success": False, "message": "Yetkisiz erişim"}), 401

    if request.method == "GET":
        students = [serialize_student(doc) for doc in db.students.find({})]
        return jsonify(students)

    if request.method == "POST":
        data = request.json
        if isinstance(data, list):
            payload = []
            for item in data:
                if not isinstance(item, dict):
                    continue
                payload.append({key: value for key, value in item.items() if key not in {"id", "_id"}})
            if payload:
                db.students.insert_many(payload)
        elif isinstance(data, dict):
            payload = {key: value for key, value in data.items() if key not in {"id", "_id"}}
            db.students.insert_one(payload)
        return jsonify({"success": True})

    db.students.delete_many({})
    return jsonify({"success": True})


@api_bp.route("/students/<student_id>", methods=["DELETE"])
@admin_required
def delete_student(student_id):
    db = get_db()
    if db is None:
        return jsonify({"error": "Database not connected"}), 503

    try:
        oid = ObjectId(student_id)
    except (InvalidId, TypeError):
        return jsonify({"success": False, "message": "Geçersiz öğrenci kimliği"}), 400

    result = db.students.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"success": False, "message": "Öğrenci bulunamadı"}), 404

    return jsonify({"success": True})


@api_bp.route("/birthdays/today", methods=["GET"])
def get_todays_birthdays():
    db = get_db()
    if db is None:
        return jsonify({"error": "Database not connected"}), 503

    now = datetime.now()
    targets = [now]
    include_weekend_preview = now.weekday() == 4  # Cuma
    if include_weekend_preview:
        targets.append(now + timedelta(days=1))  # Cumartesi
        targets.append(now + timedelta(days=2))  # Pazar

    target_keys = [date_value.strftime("%d-%m") for date_value in targets]
    students = list(db.students.find({"birthDate": {"$in": target_keys}}, {"_id": 0}))
    if not students:
        return jsonify({"hasBirthday": False, "text": "", "includesWeekendPreview": include_weekend_preview})

    grouped = {}
    for student in students:
        key = student.get("birthDate")
        grouped.setdefault(key, []).append(student)

    text_parts = []
    for date_value in targets:
        key = date_value.strftime("%d-%m")
        for student in sorted(grouped.get(key, []), key=lambda item: item.get("name", "")):
            label = f"{student.get('name', '')} ({student.get('class', '')})"
            if include_weekend_preview and date_value.weekday() in (5, 6):
                label = f"{label} - {TR_WEEKDAYS[date_value.weekday()]}"
            text_parts.append(label)

    return jsonify(
        {
            "hasBirthday": len(text_parts) > 0,
            "text": ", ".join(text_parts),
            "includesWeekendPreview": include_weekend_preview,
        }
    )


@api_bp.route("/schedule/update", methods=["POST"])
@admin_required
def update_schedule():
    db = get_db()
    if db is None:
        return jsonify({"error": "Database not connected"}), 503

    data = request.json or {}
    db.schedule.replace_one({}, {"days": data}, upsert=True)
    broadcast("scheduleChanged", data)
    return jsonify({"success": True})


@api_bp.route("/schedule/get", methods=["GET"])
def get_schedule_full():
    db = get_db()
    if db is None:
        return jsonify({"error": "Database not connected"}), 503

    data = db.schedule.find_one({}, {"_id": 0}) or {}
    return jsonify(data.get("days", {}))


@api_bp.route("/files", methods=["GET"])
def list_files():
    db = get_db()
    if db is None:
        return jsonify({"error": "Database not connected"}), 503

    folder = current_app.config["UPLOAD_FOLDER"]
    if not os.path.exists(folder):
        os.makedirs(folder, exist_ok=True)

    metadata_cursor = db.media_files.find()
    metadata = {doc["filename"]: doc.get("caption", "") for doc in metadata_cursor}

    files = []
    for filename in sorted(os.listdir(folder)):
        if not allowed_file(filename):
            continue
        files.append(
            {
                "name": filename,
                # Use relative paths so reverse-proxy TLS termination cannot downgrade URLs.
                "url": f"/static/uploads/{filename}",
                "caption": metadata.get(filename, ""),
                "type": "video" if filename.lower().endswith(("mp4", "avi", "mov")) else "image",
            }
        )

    return jsonify(files)


@api_bp.route("/upload", methods=["POST"])
@admin_required
def upload_file():
    if "file" not in request.files:
        return jsonify({"success": False, "message": "Dosya bulunamadı"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "message": "Dosya seçilmedi"}), 400

    if not (file and allowed_file(file.filename)):
        return jsonify({"success": False, "message": "Desteklenmeyen dosya türü"}), 400

    original = secure_filename(file.filename)
    unique = f"{uuid.uuid4().hex[:8]}-{original}"
    folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(folder, exist_ok=True)
    file.save(os.path.join(folder, unique))

    db = get_db()
    if db is None:
        return jsonify({"error": "Database not connected"}), 503
    db.media_files.insert_one({"filename": unique, "caption": ""})
    broadcast("mediaChanged", {"action": "upload", "filename": unique})
    return jsonify({"success": True, "filename": unique})


@api_bp.route("/files/update", methods=["POST"])
@admin_required
def update_file_metadata():
    db = get_db()
    if db is None:
        return jsonify({"error": "Database not connected"}), 503

    data = request.json or {}
    db.media_files.update_one(
        {"filename": data.get("filename")},
        {"$set": {"caption": data.get("caption", "")}},
        upsert=True,
    )
    broadcast("mediaChanged", {"action": "update", "filename": data.get("filename")})
    return jsonify({"success": True})


@api_bp.route("/files/delete", methods=["POST"])
@admin_required
def delete_file():
    db = get_db()
    if db is None:
        return jsonify({"error": "Database not connected"}), 503

    data = request.json or {}
    filename = data.get("filename")
    if not filename:
        return jsonify({"success": False, "message": "Dosya adı eksik"}), 400

    folder = current_app.config["UPLOAD_FOLDER"]
    path = os.path.join(folder, filename)
    if os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass

    db.media_files.delete_one({"filename": filename})
    broadcast("mediaChanged", {"action": "delete", "filename": filename})
    return jsonify({"success": True})


