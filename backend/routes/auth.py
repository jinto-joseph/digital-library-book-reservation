import bcrypt
from flask import Blueprint, jsonify, request, session
from db import execute_query
from security import current_user, log_event, login_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    """Verifies e-mail + password against the bcrypt hash in users and opens a session."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": "E-mail and password are required."}), 400

    rows = execute_query(
        "SELECT user_id, full_name, email, password_hash, role, is_active FROM users WHERE LOWER(email) = %s",
        (email,))
    user = rows[0] if rows else None
    valid = bool(user) and bcrypt.checkpw(password.encode(), user["password_hash"].encode())
    if not valid:
        log_event("FAILED", f"bad credentials for {email}")
        return jsonify({"error": "Invalid e-mail or password."}), 401
    if not user["is_active"]:
        log_event("DENIED", f"inactive account {email}")
        return jsonify({"error": "This account has been deactivated."}), 403

    session.clear()
    session.update(user_id=user["user_id"], full_name=user["full_name"],
                   email=user["email"], role=user["role"])
    log_event("LOGIN", "session started")
    return jsonify({"user": current_user()}), 200


@auth_bp.route("/register", methods=["POST"])
def register():
    """Self-registration always creates a STUDENT; only an admin can grant other roles."""
    data = request.get_json(silent=True) or {}
    name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    department = (data.get("department") or "").strip() or None
    if not name or "@" not in email or len(password) < 8:
        return jsonify({"error": "Name, a valid e-mail and a password of at least 8 characters are required."}), 400
    if execute_query("SELECT 1 FROM users WHERE LOWER(email) = %s", (email,)):
        return jsonify({"error": "An account with this e-mail already exists."}), 409

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()
    user = execute_query(
        """INSERT INTO users (full_name, email, password_hash, role, department)
           VALUES (%s, %s, %s, 'STUDENT', %s)
           RETURNING user_id, full_name, email, role""",
        (name, email, password_hash, department))[0]
    session.clear()
    session.update(user)
    log_event("REGISTER", "new student account created")
    return jsonify({"user": current_user()}), 201


@auth_bp.route("/logout", methods=["POST"])
def logout():
    log_event("LOGOUT", "session ended")
    session.clear()
    return jsonify({"ok": True}), 200


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return jsonify({"user": current_user()}), 200
