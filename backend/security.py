import logging
import sys
from functools import wraps
from flask import jsonify, request, session

# ----------------------------------------------------------------------------
# Live activity feed: every login, denial and circulation event is printed to
# the terminal running the Flask server, alongside Werkzeug's request log.
# ----------------------------------------------------------------------------
COLORS = {
    "LOGIN": "\033[92m", "LOGOUT": "\033[96m", "REGISTER": "\033[92m",
    "DENIED": "\033[91m", "FAILED": "\033[91m", "CHECKOUT": "\033[95m",
    "RETURN": "\033[95m", "RESERVE": "\033[93m", "CANCEL": "\033[93m",
    "PICKUP": "\033[95m", "ADMIN": "\033[94m",
}
RESET = "\033[0m"

activity_log = logging.getLogger("library.activity")
if not activity_log.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s  %(message)s", datefmt="%H:%M:%S"))
    activity_log.addHandler(handler)
    activity_log.setLevel(logging.INFO)
    activity_log.propagate = False

STAFF_ROLES = ("LIBRARIAN", "ADMIN")


def log_event(event: str, detail: str):
    """Prints one colour-coded activity line, tagged with the acting user."""
    who = session.get("email", "anonymous")
    role = session.get("role", "-")
    color = COLORS.get(event, "")
    activity_log.info(f"{color}[{event:<8}]{RESET} {who} ({role}) :: {detail}")


def current_user() -> dict:
    return {
        "user_id": session.get("user_id"),
        "full_name": session.get("full_name"),
        "email": session.get("email"),
        "role": session.get("role"),
    }


def login_required(view):
    """Rejects requests that do not carry a logged-in session (HTTP 401)."""
    @wraps(view)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            log_event("DENIED", f"{request.method} {request.path} -> not logged in")
            return jsonify({"error": "Login required."}), 401
        return view(*args, **kwargs)
    return wrapper


def roles_required(*roles):
    """Allows the view only for the listed roles (HTTP 403 otherwise)."""
    def decorator(view):
        @wraps(view)
        @login_required
        def wrapper(*args, **kwargs):
            if session.get("role") not in roles:
                log_event("DENIED", f"{request.method} {request.path} -> needs {'/'.join(roles)}")
                return jsonify({"error": f"Access denied: {'/'.join(roles)} only."}), 403
            return view(*args, **kwargs)
        return wrapper
    return decorator


def is_staff() -> bool:
    return session.get("role") in STAFF_ROLES


def db_error_message(exc: Exception) -> str:
    """First line of a PostgreSQL error (e.g. a RAISE EXCEPTION from a procedure)."""
    diag = getattr(exc, "diag", None)
    if diag is not None and diag.message_primary:
        return diag.message_primary
    return str(exc).strip().splitlines()[0]
