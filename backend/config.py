import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "yes")

    # PostgreSQL Relational Database (Authoritative Source of Truth)
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", "5432"))
    DB_NAME = os.getenv("DB_NAME", "digital_library")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")

    # Print every SQL statement to the server terminal (SQL_LOG=0 turns it off)
    SQL_LOG = os.getenv("SQL_LOG", "1").lower() in ("true", "1", "yes")
    SQL_LOG_MAX = int(os.getenv("SQL_LOG_MAX", "400"))   # characters shown per statement

    # MongoDB Document Store (Module 6 Activity Telemetry)
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "digital_library_events")

    # Library Circulation Rules
    MAX_BORROW_DAYS = int(os.getenv("MAX_BORROW_DAYS", "14"))
    MAX_RESERVATIONS_PER_USER = int(os.getenv("MAX_RESERVATIONS_PER_USER", "3"))
    RESERVATION_EXPIRY_DAYS = int(os.getenv("RESERVATION_EXPIRY_DAYS", "2"))
    DAILY_OVERDUE_FINE = float(os.getenv("DAILY_OVERDUE_FINE", "1.00"))
