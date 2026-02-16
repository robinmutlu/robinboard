import hmac
import os
from flask import Blueprint, jsonify, request, session

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    password = data.get("password", "")

    if not password:
        return jsonify({"success": False, "message": "Şifre girilmedi"}), 400

    admin_pass = os.getenv("ADMIN_PASSWORD")
    if not admin_pass:
        return jsonify({"success": False, "message": "Sunucu hatası: ADMIN_PASSWORD eksik"}), 500

    if hmac.compare_digest(password, admin_pass):
        session["is_admin"] = True
        return jsonify({"success": True, "message": "Giriş başarılı"})

    return jsonify({"success": False, "message": "Hatalı şifre"}), 401


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("is_admin", None)
    return jsonify({"success": True})


@auth_bp.route("/status", methods=["GET"])
def status():
    return jsonify({"authenticated": bool(session.get("is_admin"))})
