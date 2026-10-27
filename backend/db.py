import logging
from contextlib import contextmanager
from typing import Generator, Any, Optional
from config import Config

logger = logging.getLogger(__name__)

# Handle optional psycopg2 import gracefully if running in environment without binary drivers
try:
    import psycopg2
    from psycopg2 import pool
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    logger.warning("psycopg2 not installed. Database connection pool will be initialized upon driver installation.")

_pg_pool: Optional[Any] = None

if PSYCOPG2_AVAILABLE:
    import re
    import time

    class SqlLoggingCursor(RealDictCursor):
        """RealDictCursor that prints each executed statement to the live terminal feed:
        the SQL with its bound values, execution time and affected/returned rows."""

        def execute(self, query, vars=None):
            start = time.perf_counter()
            try:
                return super().execute(query, vars)
            finally:
                if Config.SQL_LOG:
                    self._log(query, vars, (time.perf_counter() - start) * 1000)

        def _log(self, query, vars, ms):
            from security import activity_log
            hide = "password_hash" in query and vars
            text = query if hide else self.query.decode(errors="replace") if self.query else query
            text = re.sub(r"\s+", " ", text).strip()
            if len(text) > Config.SQL_LOG_MAX:
                text = text[:Config.SQL_LOG_MAX] + " ..."
            if hide:
                text += "   [values hidden]"
            rows = self.rowcount if self.rowcount >= 0 else 0
            activity_log.info(f"\033[90m[SQL     ] {ms:6.1f} ms  {rows:>3} rows :: {text}\033[0m")


def init_db_pool():
    """Initializes the PostgreSQL connection pool."""
    global _pg_pool
    if not PSYCOPG2_AVAILABLE:
        raise RuntimeError("psycopg2 driver is required to connect to PostgreSQL. Run: pip install -r backend/requirements.txt")

    if _pg_pool is None:
        try:
            _pg_pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=20,
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                database=Config.DB_NAME,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                cursor_factory=SqlLoggingCursor
            )
            logger.info("PostgreSQL connection pool initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize PostgreSQL pool: {e}")
            raise

@contextmanager
def get_db_connection() -> Generator[Any, None, None]:
    """
    Context manager yielding a database connection from the pool.
    Automatically manages commits on success and rollback on exceptions (ACID).
    """
    global _pg_pool
    if _pg_pool is None:
        init_db_pool()

    conn = _pg_pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction error; transaction rolled back: {e}")
        raise
    finally:
        _pg_pool.putconn(conn)

def execute_query(query: str, params: tuple = ()) -> list:
    """
    Executes a SELECT query using parameterized arguments to prevent SQL injection.
    Returns list of dicts.
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return cur.fetchall()

def execute_command(command: str, params: tuple = ()) -> int:
    """
    Executes an INSERT, UPDATE, or DELETE command using parameterized arguments.
    Returns the number of affected rows.
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(command, params)
            return cur.rowcount
