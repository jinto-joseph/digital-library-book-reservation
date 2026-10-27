import os
from flask import Flask, jsonify, send_from_directory
from config import Config
from routes.auth import auth_bp
from routes.library import library_bp

app = Flask(__name__, static_folder="../frontend", static_url_path="")
app.config.from_object(Config)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SEND_FILE_MAX_AGE_DEFAULT=0,   # never cache frontend files: edits show on the next refresh
)
app.register_blueprint(auth_bp)
app.register_blueprint(library_bp)


@app.route("/")
def index():
    """Serves the frontend application UI."""
    return send_from_directory("../frontend", "index.html")


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint validating service and database status."""
    return jsonify({
        "status": "healthy",
        "service": "Digital Library Book Reservation and Recommendation System",
        "version": "1.1.0",
        "authoritative_db": "PostgreSQL"
    }), 200


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error. See the server terminal for details."}), 500


if __name__ == "__main__":
    # The reloader re-runs this file in a child process; print the banner only once.
    if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        print("\n  Digital Library server  ->  http://localhost:5000")
        print("  Live activity feed below (logins, denials, checkouts, returns, reservations).")
        print("  Python changes reload automatically; refresh the browser after frontend edits.\n")
    app.run(host="0.0.0.0", port=5000, debug=Config.DEBUG)
