-- ============================================================================
-- DIGITAL LIBRARY BOOK RESERVATION AND RECOMMENDATION SYSTEM
-- Database Views Definition (DBMS Module 2: Views & Schema Abstraction)
-- ============================================================================

-- Drop views in reverse dependency order
DROP VIEW IF EXISTS v_book_recommendations CASCADE;
DROP VIEW IF EXISTS v_department_circulation_stats CASCADE;
DROP VIEW IF EXISTS v_reservation_queues CASCADE;
DROP VIEW IF EXISTS v_overdue_loans CASCADE;
DROP VIEW IF EXISTS v_active_loans CASCADE;
DROP VIEW IF EXISTS v_book_inventory CASCADE;
DROP VIEW IF EXISTS v_book_catalog CASCADE;

-- ----------------------------------------------------------------------------
-- 1. VIEW: v_book_catalog
-- Comprehensive catalog view denormalizing books, authors, publisher, category,
-- and real-time average star ratings. Simplifies frontend search queries.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_book_catalog AS
SELECT 
    b.book_id,
    b.title,
    b.isbn,
    b.publication_year,
    b.description,
    b.cover_image_url,
    c.category_id,
    c.category_name,
    p.publisher_id,
    p.publisher_name,
    COALESCE(STRING_AGG(a.author_name, ', ' ORDER BY ba.author_order), 'Unknown Author') AS authors,
    COALESCE(ROUND(AVG(r.rating), 2), 0.00) AS average_rating,
    COUNT(DISTINCT r.review_id) AS total_reviews
FROM books b
JOIN categories c ON b.category_id = c.category_id
LEFT JOIN publishers p ON b.publisher_id = p.publisher_id
LEFT JOIN book_authors ba ON b.book_id = ba.book_id
LEFT JOIN authors a ON ba.author_id = a.author_id
LEFT JOIN reviews r ON b.book_id = r.book_id
GROUP BY 
    b.book_id, b.title, b.isbn, b.publication_year, 
    b.description, b.cover_image_url, c.category_id, 
    c.category_name, p.publisher_id, p.publisher_name;

-- ----------------------------------------------------------------------------
-- 2. VIEW: v_book_inventory
-- Live copy inventory summary per title.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_book_inventory AS
SELECT 
    b.book_id,
    b.title,
    COUNT(bc.copy_id) AS total_copies,
    COUNT(CASE WHEN bc.status = 'AVAILABLE' THEN 1 END) AS available_copies,
    COUNT(CASE WHEN bc.status = 'LOANED' THEN 1 END) AS loaned_copies,
    COUNT(CASE WHEN bc.status = 'RESERVED' THEN 1 END) AS reserved_copies,
    COUNT(CASE WHEN bc.status = 'MAINTENANCE' THEN 1 END) AS maintenance_copies,
    COUNT(CASE WHEN bc.status = 'WITHDRAWN' THEN 1 END) AS withdrawn_copies
FROM books b
LEFT JOIN book_copies bc ON b.book_id = bc.book_id
GROUP BY b.book_id, b.title;

-- ----------------------------------------------------------------------------
-- 3. VIEW: v_active_loans
-- Real-time active borrowing records for librarians and patrons.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_active_loans AS
SELECT 
    l.loan_id,
    u.user_id,
    u.full_name AS student_name,
    u.email,
    u.department,
    b.book_id,
    b.title AS book_title,
    bc.copy_id,
    bc.barcode,
    bc.shelf_location,
    l.checkout_at,
    l.due_at,
    CASE 
        WHEN l.due_at < CURRENT_TIMESTAMP THEN 'OVERDUE'
        ELSE 'ON_TIME'
    END AS timing_status,
    ROUND(CAST(EXTRACT(EPOCH FROM (l.due_at - CURRENT_TIMESTAMP))/86400 AS NUMERIC), 1) AS days_until_due
FROM loans l
JOIN users u ON l.user_id = u.user_id
JOIN book_copies bc ON l.copy_id = bc.copy_id
JOIN books b ON bc.book_id = b.book_id
WHERE l.status IN ('ACTIVE', 'OVERDUE');

-- ----------------------------------------------------------------------------
-- 4. VIEW: v_overdue_loans
-- Dedicated circulation report for overdue tracking and fine collection.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_overdue_loans AS
SELECT 
    l.loan_id,
    u.user_id,
    u.full_name AS borrower_name,
    u.email,
    u.phone,
    b.title,
    bc.barcode,
    l.checkout_at,
    l.due_at,
    CURRENT_DATE - CAST(l.due_at AS DATE) AS days_overdue,
    (CURRENT_DATE - CAST(l.due_at AS DATE)) * 1.00 AS calculated_fine,
    l.fine_amount AS recorded_fine,
    l.is_fine_paid
FROM loans l
JOIN users u ON l.user_id = u.user_id
JOIN book_copies bc ON l.copy_id = bc.copy_id
JOIN books b ON bc.book_id = b.book_id
WHERE (l.status = 'OVERDUE' OR (l.status = 'ACTIVE' AND l.due_at < CURRENT_TIMESTAMP));

-- ----------------------------------------------------------------------------
-- 5. VIEW: v_reservation_queues
-- Active reservation queues ordered by FIFO queue position.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_reservation_queues AS
SELECT 
    r.reservation_id,
    b.book_id,
    b.title AS book_title,
    u.user_id,
    u.full_name AS patron_name,
    u.email,
    r.reserved_at,
    r.status,
    r.queue_position,
    r.expires_at
FROM reservations r
JOIN books b ON r.book_id = b.book_id
JOIN users u ON r.user_id = u.user_id
WHERE r.status IN ('WAITING', 'READY');

-- ----------------------------------------------------------------------------
-- 6. VIEW: v_department_circulation_stats
-- Aggregate management metrics for administrative dashboards.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_department_circulation_stats AS
SELECT 
    COALESCE(u.department, 'Unknown') AS department,
    COUNT(DISTINCT u.user_id) AS registered_patrons,
    COUNT(l.loan_id) AS total_checkouts,
    COUNT(CASE WHEN l.status = 'ACTIVE' THEN 1 END) AS current_active_loans,
    SUM(l.fine_amount) AS total_fines_levied,
    COUNT(DISTINCT r.review_id) AS reviews_contributed
FROM users u
LEFT JOIN loans l ON u.user_id = l.user_id
LEFT JOIN reviews r ON u.user_id = r.user_id
GROUP BY u.department;
