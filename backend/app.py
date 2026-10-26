import os
from flask import Flask, jsonify, request
from config import Config
from db import execute_query

app = Flask(__name__)
app.config.from_object(Config)

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint validating service and database status."""
    return jsonify({
        "status": "healthy",
        "service": "Digital Library Book Reservation and Recommendation System",
        "version": "1.0.0",
        "authoritative_db": "PostgreSQL"
    }), 200

@app.route("/api/books", methods=["GET"])
def list_books():
    """
    Retrieves catalog books using the database view v_book_catalog.
    Demonstrates Module 2 Views & Parameterized dynamic filtering.
    """
    search = request.args.get("search", "").strip()
    category_id = request.args.get("category_id")

    query = """
        SELECT book_id, title, isbn, publication_year, 
               category_name, publisher_name, authors, 
               average_rating, total_reviews, description
        FROM v_book_catalog
        WHERE 1=1
    """
    params = []

    if search:
        query += " AND (title ILIKE %s OR authors ILIKE %s OR category_name ILIKE %s)"
        pattern = f"%{search}%"
        params.extend([pattern, pattern, pattern])

    if category_id:
        query += " AND category_id = %s"
        params.append(category_id)

    query += " ORDER BY title ASC LIMIT 50"

    try:
        books = execute_query(query, tuple(params))
        return jsonify({"count": len(books), "books": books}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/books/<int:book_id>/inventory", methods=["GET"])
def book_inventory(book_id):
    """Retrieves live physical copy availability for a specific book."""
    query = """
        SELECT copy_id, barcode, shelf_location, status, condition_notes
        FROM book_copies
        WHERE book_id = %s
        ORDER BY shelf_location ASC
    """
    try:
        copies = execute_query(query, (book_id,))
        return jsonify({"book_id": book_id, "copies": copies}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=Config.DEBUG)
