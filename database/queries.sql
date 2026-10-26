-- ============================================================================
-- DIGITAL LIBRARY BOOK RESERVATION AND RECOMMENDATION SYSTEM
-- Comprehensive SQL Query Pack (DBMS Module 2 & Module 1 Demonstrations)
-- Covers: Joins, Aggregates, Group By, Having, Nested Subqueries, Set Operations,
-- Correlated Subqueries, NULL handling with COALESCE, and Window Functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BASIC CATALOG & AVAILABILITY QUERIES
-- ----------------------------------------------------------------------------

-- Query 1: List all books with author names (concatenated), publisher, and category
SELECT 
    b.book_id,
    b.title,
    b.isbn,
    b.publication_year,
    p.publisher_name,
    c.category_name,
    STRING_AGG(a.author_name, ', ' ORDER BY ba.author_order) AS authors
FROM books b
JOIN categories c ON b.category_id = c.category_id
LEFT JOIN publishers p ON b.publisher_id = p.publisher_id
JOIN book_authors ba ON b.book_id = ba.book_id
JOIN authors a ON ba.author_id = a.author_id
GROUP BY b.book_id, b.title, b.isbn, b.publication_year, p.publisher_name, c.category_name
ORDER BY b.title ASC;

-- Query 2: Search books by title keyword, author name, or category with case-insensitivity
-- Example search term: 'Data'
SELECT DISTINCT
    b.book_id,
    b.title,
    b.isbn,
    c.category_name,
    p.publisher_name
FROM books b
JOIN categories c ON b.category_id = c.category_id
LEFT JOIN publishers p ON b.publisher_id = p.publisher_id
JOIN book_authors ba ON b.book_id = ba.book_id
JOIN authors a ON ba.author_id = a.author_id
WHERE b.title ILIKE '%Data%'
   OR a.author_name ILIKE '%Data%'
   OR c.category_name ILIKE '%Data%';

-- Query 3: Real-time copy inventory breakdown for every book (Total vs Available vs Loaned)
SELECT 
    b.book_id,
    b.title,
    COUNT(bc.copy_id) AS total_copies,
    COUNT(CASE WHEN bc.status = 'AVAILABLE' THEN 1 END) AS available_copies,
    COUNT(CASE WHEN bc.status = 'LOANED' THEN 1 END) AS loaned_copies,
    COUNT(CASE WHEN bc.status = 'MAINTENANCE' THEN 1 END) AS maintenance_copies
FROM books b
LEFT JOIN book_copies bc ON b.book_id = bc.book_id
GROUP BY b.book_id, b.title
ORDER BY available_copies DESC, total_copies DESC;

-- Query 4: Find specific physical copies currently available on shelves for a given book
-- Example for book_id = 1 ('Database System Concepts')
SELECT 
    bc.copy_id,
    bc.barcode,
    bc.shelf_location,
    bc.status,
    bc.condition_notes,
    b.title
FROM book_copies bc
JOIN books b ON bc.book_id = b.book_id
WHERE b.book_id = 1 
  AND bc.status = 'AVAILABLE'
ORDER BY bc.shelf_location ASC;


-- ----------------------------------------------------------------------------
-- 2. CIRCULATION & LOAN TRACKING QUERIES
-- ----------------------------------------------------------------------------

-- Query 5: Active loans with borrower details and due date status
SELECT 
    l.loan_id,
    u.full_name AS student_name,
    u.email,
    b.title,
    bc.barcode,
    bc.shelf_location,
    l.checkout_at,
    l.due_at,
    ROUND(CAST(EXTRACT(EPOCH FROM (l.due_at - CURRENT_TIMESTAMP))/86400 AS NUMERIC), 1) AS days_remaining
FROM loans l
JOIN users u ON l.user_id = u.user_id
JOIN book_copies bc ON l.copy_id = bc.copy_id
JOIN books b ON bc.book_id = b.book_id
WHERE l.status = 'ACTIVE'
ORDER BY l.due_at ASC;

-- Query 6: Overdue loans with calculated fines ($1.00 per overdue day)
SELECT 
    l.loan_id,
    u.user_id,
    u.full_name AS borrower_name,
    u.email,
    u.phone,
    b.title,
    bc.barcode,
    l.due_at,
    CURRENT_DATE - CAST(l.due_at AS DATE) AS days_overdue,
    (CURRENT_DATE - CAST(l.due_at AS DATE)) * 1.00 AS calculated_fine
FROM loans l
JOIN users u ON l.user_id = u.user_id
JOIN book_copies bc ON l.copy_id = bc.copy_id
JOIN books b ON bc.book_id = b.book_id
WHERE l.status IN ('ACTIVE', 'OVERDUE')
  AND l.due_at < CURRENT_TIMESTAMP
ORDER BY days_overdue DESC;

-- Query 7: Complete borrowing history for a specific patron with return status
-- Example for user_id = 4 ('Jinto Joseph')
SELECT 
    l.loan_id,
    b.title,
    bc.barcode,
    l.checkout_at,
    l.due_at,
    COALESCE(CAST(l.returned_at AS VARCHAR), 'NOT RETURNED YET') AS return_date,
    l.status,
    l.fine_amount
FROM loans l
JOIN book_copies bc ON l.copy_id = bc.copy_id
JOIN books b ON bc.book_id = b.book_id
WHERE l.user_id = 4
ORDER BY l.checkout_at DESC;


-- ----------------------------------------------------------------------------
-- 3. RESERVATIONS & QUEUE QUERIES
-- ----------------------------------------------------------------------------

-- Query 8: Active reservation queues per book title with waiting position
SELECT 
    r.reservation_id,
    b.title,
    u.full_name AS patron_name,
    r.reserved_at,
    r.status,
    r.queue_position,
    r.expires_at
FROM reservations r
JOIN books b ON r.book_id = b.book_id
JOIN users u ON r.user_id = u.user_id
WHERE r.status IN ('WAITING', 'READY')
ORDER BY b.book_id ASC, r.queue_position ASC NULLS LAST;

-- Query 9: Books where all physical copies are loaned and reservations exist (High Demand)
SELECT 
    b.book_id,
    b.title,
    COUNT(DISTINCT bc.copy_id) AS total_copies,
    COUNT(DISTINCT CASE WHEN bc.status = 'LOANED' THEN bc.copy_id END) AS loaned_copies,
    COUNT(DISTINCT r.reservation_id) AS active_reservations
FROM books b
JOIN book_copies bc ON b.book_id = bc.book_id
LEFT JOIN reservations r ON b.book_id = r.book_id AND r.status IN ('WAITING', 'READY')
GROUP BY b.book_id, b.title
HAVING COUNT(DISTINCT CASE WHEN bc.status = 'AVAILABLE' THEN bc.copy_id END) = 0
   AND COUNT(DISTINCT r.reservation_id) > 0;


-- ----------------------------------------------------------------------------
-- 4. AGGREGATES, GROUP BY & HAVING (Module 2 Requirements)
-- ----------------------------------------------------------------------------

-- Query 10: Top borrowed books of all time
SELECT 
    b.book_id,
    b.title,
    c.category_name,
    COUNT(l.loan_id) AS total_times_borrowed
FROM books b
JOIN categories c ON b.category_id = c.category_id
JOIN book_copies bc ON b.book_id = bc.book_id
JOIN loans l ON bc.copy_id = l.copy_id
GROUP BY b.book_id, b.title, c.category_name
ORDER BY total_times_borrowed DESC;

-- Query 11: Average book ratings and review counts (using COALESCE for unrated titles)
SELECT 
    b.book_id,
    b.title,
    COALESCE(ROUND(AVG(r.rating), 2), 0.00) AS average_rating,
    COUNT(r.review_id) AS total_reviews
FROM books b
LEFT JOIN reviews r ON b.book_id = r.book_id
GROUP BY b.book_id, b.title
ORDER BY average_rating DESC, total_reviews DESC;

-- Query 12: Categories having more than 1 distinct physical book title (HAVING clause)
SELECT 
    c.category_id,
    c.category_name,
    COUNT(b.book_id) AS book_count
FROM categories c
JOIN books b ON c.category_id = b.category_id
GROUP BY c.category_id, c.category_name
HAVING COUNT(b.book_id) >= 2
ORDER BY book_count DESC;

-- Query 13: Total outstanding and collected fines aggregated by department
SELECT 
    COALESCE(u.department, 'Undeclared') AS department,
    COUNT(l.loan_id) AS total_loans,
    SUM(l.fine_amount) AS total_fines_accrued,
    SUM(CASE WHEN l.is_fine_paid THEN l.fine_amount ELSE 0 END) AS fines_collected,
    SUM(CASE WHEN NOT l.is_fine_paid THEN l.fine_amount ELSE 0 END) AS fines_unpaid
FROM users u
JOIN loans l ON u.user_id = l.user_id
GROUP BY u.department
ORDER BY total_fines_accrued DESC;


-- ----------------------------------------------------------------------------
-- 5. NESTED & CORRELATED SUBQUERIES (Module 2 Requirements)
-- ----------------------------------------------------------------------------

-- Query 14: Books whose average rating is strictly above the library-wide average
SELECT 
    b.book_id,
    b.title,
    ROUND(AVG(r.rating), 2) AS book_avg_rating
FROM books b
JOIN reviews r ON b.book_id = r.book_id
GROUP BY b.book_id, b.title
HAVING AVG(r.rating) > (
    SELECT AVG(rating) FROM reviews
)
ORDER BY book_avg_rating DESC;

-- Query 15: Students who have NEVER borrowed any book in the library (NOT IN subquery)
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    u.department
FROM users u
WHERE u.role = 'STUDENT'
  AND u.user_id NOT IN (
      SELECT DISTINCT user_id 
      FROM loans
  );

-- Query 16: Books that have never been checked out (NOT EXISTS correlated subquery)
SELECT 
    b.book_id,
    b.title,
    b.isbn,
    c.category_name
FROM books b
JOIN categories c ON b.category_id = c.category_id
WHERE NOT EXISTS (
    SELECT 1 
    FROM book_copies bc
    JOIN loans l ON bc.copy_id = l.copy_id
    WHERE bc.book_id = b.book_id
);

-- Query 17: Find the patron who has accrued the highest total fine (Scalar Subquery)
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    SUM(l.fine_amount) AS total_fines
FROM users u
JOIN loans l ON u.user_id = l.user_id
GROUP BY u.user_id, u.full_name, u.email
HAVING SUM(l.fine_amount) = (
    SELECT MAX(patron_total)
    FROM (
        SELECT SUM(fine_amount) AS patron_total
        FROM loans
        GROUP BY user_id
    ) sub
);


-- ----------------------------------------------------------------------------
-- 6. RELATIONAL SET OPERATIONS (Module 1 & 2: UNION, INTERSECT, EXCEPT)
-- ----------------------------------------------------------------------------

-- Query 18: UNION - Complete list of all authors AND publishers as intellectual/commercial stakeholders
SELECT author_name AS entity_name, 'Author' AS entity_type 
FROM authors
UNION
SELECT publisher_name AS entity_name, 'Publisher' AS entity_type 
FROM publishers
ORDER BY entity_name ASC;

-- Query 19: INTERSECT - Books that have BOTH active loans AND active reservations
SELECT b.book_id, b.title
FROM books b
JOIN book_copies bc ON b.book_id = bc.book_id
JOIN loans l ON bc.copy_id = l.copy_id
WHERE l.status IN ('ACTIVE', 'OVERDUE')
INTERSECT
SELECT b.book_id, b.title
FROM books b
JOIN reservations r ON b.book_id = r.book_id
WHERE r.status IN ('WAITING', 'READY');

-- Query 20: EXCEPT - Categories that have cataloged books EXCEPT those that have active overdue loans
SELECT c.category_id, c.category_name
FROM categories c
JOIN books b ON c.category_id = b.category_id
EXCEPT
SELECT c.category_id, c.category_name
FROM categories c
JOIN books b ON c.category_id = b.category_id
JOIN book_copies bc ON b.book_id = bc.book_id
JOIN loans l ON bc.copy_id = l.copy_id
WHERE l.status = 'OVERDUE';


-- ----------------------------------------------------------------------------
-- 7. ADVANCED SQL: WINDOW FUNCTIONS & RECOMMENDATION SEEDING
-- ----------------------------------------------------------------------------

-- Query 21: Rank books within each category by popularity (DENSE_RANK Window Function)
SELECT 
    c.category_name,
    b.title,
    COUNT(l.loan_id) AS borrow_count,
    DENSE_RANK() OVER (
        PARTITION BY c.category_id 
        ORDER BY COUNT(l.loan_id) DESC
    ) AS popularity_rank_in_category
FROM categories c
JOIN books b ON c.category_id = b.category_id
LEFT JOIN book_copies bc ON b.book_id = bc.book_id
LEFT JOIN loans l ON bc.copy_id = l.copy_id
GROUP BY c.category_id, c.category_name, b.book_id, b.title
ORDER BY c.category_name, popularity_rank_in_category;

-- Query 22: Deterministic Recommendation Candidate Generator for User (e.g., user_id = 4)
-- Scores candidate books: +5 same category, +3 same author, +2 high rating, +2 popularity
-- Excludes books already borrowed by the user.
WITH user_borrowed AS (
    SELECT DISTINCT bc.book_id
    FROM loans l
    JOIN book_copies bc ON l.copy_id = bc.copy_id
    WHERE l.user_id = 4
),
user_fav_categories AS (
    SELECT b.category_id, COUNT(*) AS affinity
    FROM loans l
    JOIN book_copies bc ON l.copy_id = bc.copy_id
    JOIN books b ON bc.book_id = b.book_id
    WHERE l.user_id = 4
    GROUP BY b.category_id
),
user_fav_authors AS (
    SELECT ba.author_id, COUNT(*) AS affinity
    FROM loans l
    JOIN book_copies bc ON l.copy_id = bc.copy_id
    JOIN book_authors ba ON bc.book_id = ba.book_id
    WHERE l.user_id = 4
    GROUP BY ba.author_id
),
book_stats AS (
    SELECT 
        b.book_id,
        b.title,
        b.category_id,
        COALESCE(AVG(r.rating), 0) AS avg_rating,
        COUNT(DISTINCT l.loan_id) AS borrow_count
    FROM books b
    LEFT JOIN reviews r ON b.book_id = r.book_id
    LEFT JOIN book_copies bc ON b.book_id = bc.book_id
    LEFT JOIN loans l ON bc.copy_id = l.copy_id
    WHERE b.book_id NOT IN (SELECT book_id FROM user_borrowed)
    GROUP BY b.book_id, b.title, b.category_id
)
SELECT 
    bs.book_id,
    bs.title,
    bs.avg_rating,
    bs.borrow_count,
    (
        CASE WHEN bs.category_id IN (SELECT category_id FROM user_fav_categories) THEN 5 ELSE 0 END +
        CASE WHEN EXISTS (
            SELECT 1 FROM book_authors ba 
            WHERE ba.book_id = bs.book_id 
              AND ba.author_id IN (SELECT author_id FROM user_fav_authors)
        ) THEN 3 ELSE 0 END +
        CASE WHEN bs.avg_rating >= 4.0 THEN 2 ELSE 0 END +
        CASE WHEN bs.borrow_count >= 1 THEN 2 ELSE 0 END
    ) AS recommendation_score
FROM book_stats bs
ORDER BY recommendation_score DESC, bs.avg_rating DESC;
