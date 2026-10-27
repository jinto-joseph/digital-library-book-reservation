from flask import Blueprint, jsonify, request, session
from db import execute_command, execute_query, get_db_connection
from config import Config
from security import (STAFF_ROLES, db_error_message, is_staff, log_event,
                      login_required, roles_required)

library_bp = Blueprint("library", __name__, url_prefix="/api")

# Authors, ratings and copies are aggregated separately before joining so that
# one book never fans out into repeated author names or inflated copy counts.
CATALOG_SQL = """
    SELECT b.book_id, b.title, b.isbn, b.publication_year, b.description,
           c.category_id, c.category_name, p.publisher_name,
           COALESCE(a.authors, 'Unknown Author') AS authors,
           COALESCE(r.average_rating, 0) AS average_rating,
           COALESCE(r.total_reviews, 0) AS total_reviews,
           COALESCE(inv.total_copies, 0) AS total_copies,
           COALESCE(inv.available_copies, 0) AS available_copies,
           COALESCE(inv.loaned_copies, 0) AS loaned_copies
    FROM books b
    JOIN categories c ON c.category_id = b.category_id
    LEFT JOIN publishers p ON p.publisher_id = b.publisher_id
    LEFT JOIN (SELECT ba.book_id, STRING_AGG(au.author_name, ', ' ORDER BY ba.author_order) AS authors
               FROM book_authors ba JOIN authors au ON au.author_id = ba.author_id
               GROUP BY ba.book_id) a ON a.book_id = b.book_id
    LEFT JOIN (SELECT book_id, ROUND(AVG(rating), 2) AS average_rating, COUNT(*) AS total_reviews
               FROM reviews GROUP BY book_id) r ON r.book_id = b.book_id
    LEFT JOIN (SELECT book_id, COUNT(*) AS total_copies,
                      COUNT(*) FILTER (WHERE status = 'AVAILABLE') AS available_copies,
                      COUNT(*) FILTER (WHERE status = 'LOANED') AS loaned_copies
               FROM book_copies GROUP BY book_id) inv ON inv.book_id = b.book_id
"""


# ----------------------------------------------------------------------------
# Catalogue (any logged-in user)
# ----------------------------------------------------------------------------
@library_bp.route("/books", methods=["GET"])
@login_required
def list_books():
    """Catalogue search with optional text and category filters (parameterised)."""
    search = request.args.get("search", "").strip()
    category_id = request.args.get("category_id")
    query = f"SELECT * FROM ({CATALOG_SQL}) cat WHERE 1=1"
    params = []
    if search:
        query += " AND (title ILIKE %s OR authors ILIKE %s OR isbn ILIKE %s)"
        params.extend([f"%{search}%"] * 3)
    if category_id:
        query += " AND category_id = %s"
        params.append(category_id)
    query += " ORDER BY title ASC"
    books = execute_query(query, tuple(params))
    return jsonify({"count": len(books), "books": books}), 200


@library_bp.route("/books/<int:book_id>/inventory", methods=["GET"])
@login_required
def book_inventory(book_id):
    """Live physical copy availability for a specific book."""
    copies = execute_query(
        """SELECT copy_id, barcode, shelf_location, status, condition_notes
           FROM book_copies WHERE book_id = %s ORDER BY barcode""", (book_id,))
    return jsonify({"book_id": book_id, "copies": copies}), 200


@library_bp.route("/stats", methods=["GET"])
@login_required
def stats():
    """Dashboard counters; students see their own loan / reservation counts."""
    own = "" if is_staff() else " AND user_id = %(uid)s"
    row = execute_query(f"""
        SELECT (SELECT COUNT(*) FROM books) AS total_titles,
               (SELECT COUNT(*) FROM book_copies) AS total_copies,
               (SELECT COUNT(*) FROM loans WHERE status IN ('ACTIVE','OVERDUE'){own}) AS active_loans,
               (SELECT COUNT(*) FROM reservations WHERE status IN ('WAITING','READY'){own}) AS reservations
    """, {"uid": session["user_id"]})[0]
    return jsonify(row), 200


# ----------------------------------------------------------------------------
# Loans: students see their own; staff see everyone's and process returns
# ----------------------------------------------------------------------------
@library_bp.route("/loans", methods=["GET"])
@login_required
def list_loans():
    query = """
        SELECT l.loan_id, l.user_id, u.full_name AS student_name, b.title AS book_title,
               bc.copy_id, bc.barcode, l.checkout_at, l.due_at,
               CASE WHEN l.due_at < CURRENT_TIMESTAMP THEN 'OVERDUE' ELSE l.status END AS status,
               GREATEST(l.fine_amount, fn_calculate_overdue_fines(l.loan_id)) AS fine_amount
        FROM loans l
        JOIN users u ON u.user_id = l.user_id
        JOIN book_copies bc ON bc.copy_id = l.copy_id
        JOIN books b ON b.book_id = bc.book_id
        WHERE l.status IN ('ACTIVE', 'OVERDUE')
    """
    params = ()
    if not is_staff():
        query += " AND l.user_id = %s"
        params = (session["user_id"],)
    loans = execute_query(query + " ORDER BY l.due_at ASC", params)
    return jsonify({"loans": loans}), 200


@library_bp.route("/loans/checkout", methods=["POST"])
@login_required
def checkout():
    """Borrows a copy through sp_checkout_book (row-locked, ACID).
    Students may only borrow for themselves; staff may issue to any user_id."""
    data = request.get_json(silent=True) or {}
    book_id = data.get("book_id")
    user_id = data.get("user_id") if is_staff() and data.get("user_id") else session["user_id"]
    if not book_id:
        return jsonify({"error": "book_id is required."}), 400
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""SELECT copy_id, barcode FROM book_copies
                               WHERE book_id = %s AND status = 'AVAILABLE'
                               ORDER BY copy_id LIMIT 1 FOR UPDATE SKIP LOCKED""", (book_id,))
                copy = cur.fetchone()
                if not copy:
                    return jsonify({"error": "No copy is available right now. Join the queue instead."}), 409
                cur.execute("CALL sp_checkout_book(%s, %s, %s)", (user_id, copy["copy_id"], Config.MAX_BORROW_DAYS))
    except Exception as e:
        log_event("FAILED", f"checkout book {book_id}: {db_error_message(e)}")
        return jsonify({"error": db_error_message(e)}), 409
    log_event("CHECKOUT", f"book {book_id} copy {copy['barcode']} -> user {user_id}")
    return jsonify({"ok": True, "barcode": copy["barcode"]}), 201


@library_bp.route("/loans/<int:loan_id>/return", methods=["POST"])
@roles_required(*STAFF_ROLES)
def return_loan(loan_id):
    """Closes a loan through sp_return_book (computes fine, advances the queue)."""
    rows = execute_query("SELECT copy_id FROM loans WHERE loan_id = %s AND status IN ('ACTIVE','OVERDUE')", (loan_id,))
    if not rows:
        return jsonify({"error": "No open loan with that id."}), 404
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("CALL sp_return_book(%s)", (rows[0]["copy_id"],))
    except Exception as e:
        return jsonify({"error": db_error_message(e)}), 409
    log_event("RETURN", f"loan {loan_id} closed")
    return jsonify({"ok": True}), 200


# ----------------------------------------------------------------------------
# Reservations: students manage their own queue entries; staff hand over copies
# ----------------------------------------------------------------------------
@library_bp.route("/reservations", methods=["GET"])
@login_required
def list_reservations():
    query = "SELECT * FROM v_reservation_queues"
    params = ()
    if not is_staff():
        query += " WHERE user_id = %s"
        params = (session["user_id"],)
    rows = execute_query(query + " ORDER BY book_title, status DESC, queue_position NULLS FIRST", params)
    return jsonify({"reservations": rows}), 200


@library_bp.route("/reservations", methods=["POST"])
@roles_required("STUDENT", "FACULTY")
def create_reservation():
    data = request.get_json(silent=True) or {}
    book_id = data.get("book_id")
    uid = session["user_id"]
    active = execute_query("SELECT COUNT(*) AS n FROM reservations WHERE user_id = %s AND status IN ('WAITING','READY')", (uid,))
    if active[0]["n"] >= Config.MAX_RESERVATIONS_PER_USER:
        return jsonify({"error": f"Limit reached: at most {Config.MAX_RESERVATIONS_PER_USER} active reservations."}), 409
    try:
        row = execute_query(
            "INSERT INTO reservations (user_id, book_id, status) VALUES (%s, %s, 'WAITING') RETURNING reservation_id, queue_position",
            (uid, book_id))[0]
    except Exception as e:
        msg = db_error_message(e)
        if "uq_user_book_active_reservation" in msg:
            msg = "You already have an active reservation for this book."
        return jsonify({"error": msg}), 409
    log_event("RESERVE", f"book {book_id} queue position {row['queue_position']}")
    return jsonify(row), 201


@library_bp.route("/reservations/<int:reservation_id>", methods=["DELETE"])
@login_required
def cancel_reservation(reservation_id):
    """Students can cancel only their own reservations; staff can cancel any."""
    query = "UPDATE reservations SET status = 'CANCELLED' WHERE reservation_id = %s AND status IN ('WAITING','READY')"
    params = [reservation_id]
    if not is_staff():
        query += " AND user_id = %s"
        params.append(session["user_id"])
    if execute_command(query, tuple(params)) == 0:
        log_event("DENIED", f"cancel reservation {reservation_id} (not found or not yours)")
        return jsonify({"error": "Reservation not found or not yours."}), 404
    log_event("CANCEL", f"reservation {reservation_id}")
    return jsonify({"ok": True}), 200


@library_bp.route("/reservations/<int:reservation_id>/pickup", methods=["POST"])
@roles_required(*STAFF_ROLES)
def pickup_reservation(reservation_id):
    """Issues the held copy to the patron whose reservation is READY."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT user_id, book_id FROM reservations WHERE reservation_id = %s AND status = 'READY' FOR UPDATE",
                            (reservation_id,))
                res = cur.fetchone()
                if not res:
                    return jsonify({"error": "Reservation is not READY for pickup."}), 409
                cur.execute("""SELECT copy_id FROM book_copies WHERE book_id = %s AND status IN ('RESERVED','AVAILABLE')
                               ORDER BY (status = 'RESERVED') DESC, copy_id LIMIT 1 FOR UPDATE""", (res["book_id"],))
                copy = cur.fetchone()
                if not copy:
                    return jsonify({"error": "No held copy found on the shelf."}), 409
                cur.execute("CALL sp_checkout_book(%s, %s, %s)", (res["user_id"], copy["copy_id"], Config.MAX_BORROW_DAYS))
    except Exception as e:
        return jsonify({"error": db_error_message(e)}), 409
    log_event("PICKUP", f"reservation {reservation_id} -> user {res['user_id']}")
    return jsonify({"ok": True}), 200


# ----------------------------------------------------------------------------
# Recommendations (Query 22 scoring, parameterised for the logged-in user)
# ----------------------------------------------------------------------------
@library_bp.route("/recommendations", methods=["GET"])
@login_required
def recommendations():
    rows = execute_query("""
        WITH mine AS (
            SELECT DISTINCT bc.book_id, b.category_id
            FROM loans l JOIN book_copies bc ON bc.copy_id = l.copy_id JOIN books b ON b.book_id = bc.book_id
            WHERE l.user_id = %(uid)s),
        fav_authors AS (SELECT DISTINCT ba.author_id FROM book_authors ba JOIN mine m ON m.book_id = ba.book_id),
        popular AS (SELECT bc.book_id, COUNT(*) AS borrow_count
                    FROM loans l JOIN book_copies bc ON bc.copy_id = l.copy_id GROUP BY bc.book_id),
        scored AS (
            SELECT cat.*, COALESCE(pop.borrow_count, 0) AS borrow_count,
                   (cat.category_id IN (SELECT category_id FROM mine)) AS same_category,
                   EXISTS (SELECT 1 FROM book_authors ba WHERE ba.book_id = cat.book_id
                           AND ba.author_id IN (SELECT author_id FROM fav_authors)) AS same_author
            FROM (""" + CATALOG_SQL + """) cat
            LEFT JOIN popular pop ON pop.book_id = cat.book_id
            WHERE cat.book_id NOT IN (SELECT book_id FROM mine))
        SELECT *, (CASE WHEN same_category THEN 5 ELSE 0 END + CASE WHEN same_author THEN 3 ELSE 0 END +
                   CASE WHEN average_rating >= 4.0 THEN 2 ELSE 0 END + CASE WHEN borrow_count >= 1 THEN 2 ELSE 0 END) AS score
        FROM scored ORDER BY score DESC, average_rating DESC, title LIMIT 5
    """, {"uid": session["user_id"]})
    for r in rows:
        reasons = []
        if r["same_category"]:
            reasons.append(f"you borrowed books in {r['category_name']}")
        if r["same_author"]:
            reasons.append(f"it shares an author ({r['authors']}) with your past loans")
        if float(r["average_rating"]) >= 4.0:
            reasons.append(f"it is rated {float(r['average_rating']):.1f}★")
        if r["borrow_count"]:
            reasons.append("it is popular with other readers")
        r["reason"] = "Recommended because " + (", ".join(reasons) if reasons else "it is a new arrival in the catalogue") + "."
    return jsonify({"recommendations": rows}), 200


# ----------------------------------------------------------------------------
# Administration (ADMIN only)
# ----------------------------------------------------------------------------
@library_bp.route("/admin/users", methods=["GET"])
@roles_required("ADMIN")
def admin_users():
    users = execute_query("""
        SELECT u.user_id, u.full_name, u.email, u.role, u.department, u.is_active,
               COUNT(l.loan_id) FILTER (WHERE l.status IN ('ACTIVE','OVERDUE')) AS open_loans
        FROM users u LEFT JOIN loans l ON l.user_id = u.user_id
        GROUP BY u.user_id ORDER BY u.role, u.full_name""")
    return jsonify({"users": users}), 200


@library_bp.route("/admin/users/<int:user_id>", methods=["PATCH"])
@roles_required("ADMIN")
def admin_update_user(user_id):
    data = request.get_json(silent=True) or {}
    if user_id == session["user_id"]:
        return jsonify({"error": "You cannot change your own role or status."}), 400
    sets, params = [], []
    if "role" in data:
        if data["role"] not in ("STUDENT", "FACULTY", "LIBRARIAN", "ADMIN"):
            return jsonify({"error": "Unknown role."}), 400
        sets.append("role = %s"); params.append(data["role"])
    if "is_active" in data:
        sets.append("is_active = %s"); params.append(bool(data["is_active"]))
    if not sets:
        return jsonify({"error": "Nothing to update."}), 400
    execute_command(f"UPDATE users SET {', '.join(sets)} WHERE user_id = %s", tuple(params + [user_id]))
    log_event("ADMIN", f"user {user_id} updated: {data}")
    return jsonify({"ok": True}), 200
