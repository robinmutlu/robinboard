import copy
import os
from pymongo import MongoClient

db = None


def build_default_day_plan(
    lesson_duration=40,
    break_duration=10,
    lunch_duration=40,
    lunch_after_lesson=5,
    afternoon_break_duration=None,
):
    if afternoon_break_duration is None:
        afternoon_break_duration = break_duration

    blocks = []
    for lesson_index in range(1, 9):
        blocks.append({"type": "lesson", "duration": lesson_duration})
        if lesson_index == 8:
            continue

        if lesson_index == lunch_after_lesson:
            blocks.append({"type": "lunch", "duration": lunch_duration})
        else:
            selected_break = (
                afternoon_break_duration if lesson_index > lunch_after_lesson else break_duration
            )
            blocks.append({"type": "break", "duration": selected_break})
    return {"startTime": "08:00", "blocks": blocks}


DEFAULT_BELL_CONFIG = {
    "days": {
        "Pazartesi": build_default_day_plan(),
        "Salı": build_default_day_plan(),
        "Çarşamba": build_default_day_plan(),
        "Perşembe": build_default_day_plan(),
        "Cuma": build_default_day_plan(lunch_duration=50, afternoon_break_duration=5),
        "Cumartesi": {"startTime": "08:00", "blocks": []},
        "Pazar": {"startTime": "08:00", "blocks": []},
    }
}


DEFAULT_SETTINGS = {
    "schoolName": "Seyit Mustafa Çelik Fen Lisesi",
    "isEmergency": False,
    "emergencyMessage": "Acil durum! Lütfen toplanma alanına gidiniz.",
    "marqueeText": "Hoş geldiniz. Burası RobinBoard dijital pano sistemi.",
    "weatherCity": "Mardin",
    "weatherApiKey": "",
    "dutyTeachers": "",
    "birthdays": "",
    "dutySchedule": {
        "Pazartesi": {"Bahçe": "", "Zemin": "", "1.Kat": "", "2.Kat": ""},
        "Salı": {"Bahçe": "", "Zemin": "", "1.Kat": "", "2.Kat": ""},
        "Çarşamba": {"Bahçe": "", "Zemin": "", "1.Kat": "", "2.Kat": ""},
        "Perşembe": {"Bahçe": "", "Zemin": "", "1.Kat": "", "2.Kat": ""},
        "Cuma": {"Bahçe": "", "Zemin": "", "1.Kat": "", "2.Kat": ""},
    },
    "dutyRotationStartDate": "",
    "bellConfig": DEFAULT_BELL_CONFIG,
}


def init_db(app=None):
    global db
    mongo_uri = os.getenv("MONGO_URI")

    if not mongo_uri:
        print("HATA: MONGO_URI bulunamadı.")
        return

    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        print("MongoDB bağlantısı başarılı.")

        db = client["RobinBoardDB"]
        init_collections()
    except Exception as exc:
        print(f"MongoDB bağlantı hatası: {exc}")


def init_collections():
    if db is None:
        return

    if db.settings.count_documents({}) == 0:
        db.settings.insert_one(copy.deepcopy(DEFAULT_SETTINGS))
        print("Varsayılan ayarlar oluşturuldu.")
    else:
        current = db.settings.find_one({}, {"_id": 0}) or {}
        missing = {key: value for key, value in DEFAULT_SETTINGS.items() if key not in current}
        if missing:
            db.settings.update_one({}, {"$set": missing})

    if "students" not in db.list_collection_names():
        db.create_collection("students")

    if "schedule" not in db.list_collection_names():
        db.create_collection("schedule")

    if "media_files" not in db.list_collection_names():
        db.create_collection("media_files")


def get_db():
    global db
    if db is None:
        init_db()
    return db

