-- ============================================================================
-- DIGITAL LIBRARY BOOK RESERVATION AND RECOMMENDATION SYSTEM
-- Database Index Profiling & Storage Optimization (DBMS Module 4: Indexing)
-- Demonstrates: B-Tree Indexes, Composite Indexes, Partial Indexes, Hash Indexes,
-- and query optimization principles.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. B-TREE INDEXES FOR SEARCH & FILTERING
-- B-Tree is PostgreSQL's default self-balancing tree index ($O(\log N)$ lookup).
-- Essential for equality, range queries, prefix matching, and ORDER BY.
-- ----------------------------------------------------------------------------

-- Accelerates catalog search queries matching on book title prefixes or exact titles
CREATE INDEX IF NOT EXISTS idx_books_title_btree 
    ON books USING btree (title);

-- Accelerates catalog queries filtering books by publication year range (e.g. BETWEEN 2015 AND 2023)
CREATE INDEX IF NOT EXISTS idx_books_pub_year 
    ON books USING btree (publication_year);

-- Accelerates user lookups by email in authentication workflows
CREATE INDEX IF NOT EXISTS idx_users_email_btree 
    ON users USING btree (email);


-- ----------------------------------------------------------------------------
-- 2. COMPOSITE (MULTI-COLUMN) INDEXES
-- Optimizes multi-attribute query predicates where columns appear together.
-- Column ordering rule: most selective / equality column first, range/sort second.
-- ----------------------------------------------------------------------------

-- Optimizes: WHERE category_id = ? ORDER BY publication_year DESC
CREATE INDEX IF NOT EXISTS idx_books_category_year 
    ON books (category_id, publication_year DESC);

-- Optimizes: WHERE book_id = ? AND status = ? in reservation queue checks
CREATE INDEX IF NOT EXISTS idx_reservations_book_status_queue 
    ON reservations (book_id, status, queue_position);

-- Optimizes patron history checks: WHERE user_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_loans_user_status_due 
    ON loans (user_id, status, due_at);


-- ----------------------------------------------------------------------------
-- 3. PARTIAL / FILTERED INDEXES
-- Indexes only a subset of table rows meeting a WHERE condition.
-- Extremely compact footprint; faster maintenance overhead during inserts.
-- ----------------------------------------------------------------------------

-- Indexes only ACTIVE or OVERDUE loans to accelerate overdue sweeps without
-- indexing millions of historical RETURNED loans
CREATE INDEX IF NOT EXISTS idx_loans_active_due_partial 
    ON loans (due_at) 
    WHERE status IN ('ACTIVE', 'OVERDUE');

-- Indexes only WAITING reservations to accelerate queue advancement
CREATE INDEX IF NOT EXISTS idx_reservations_waiting_partial 
    ON reservations (book_id, queue_position) 
    WHERE status = 'WAITING';

-- Indexes available shelf copies for rapid checkout lookups
CREATE INDEX IF NOT EXISTS idx_copies_available_partial 
    ON book_copies (book_id, shelf_location) 
    WHERE status = 'AVAILABLE';


-- ----------------------------------------------------------------------------
-- 4. HASH INDEX (Module 4 Comparative Study)
-- In PostgreSQL 10+, Hash indexes are crash-safe (WAL-logged) and provide $O(1)$
-- point equality lookups. They DO NOT support range queries (<, >, BETWEEN).
-- ----------------------------------------------------------------------------

-- Hash index for point lookups on physical barcode scanner inputs
CREATE INDEX IF NOT EXISTS idx_book_copies_barcode_hash 
    ON book_copies USING hash (barcode);


-- ----------------------------------------------------------------------------
-- 5. VERIFICATION & EXPLAIN ANALYZE DEMONSTRATION COMMANDS
-- Run these commands in psql to inspect execution plans and compare Seq Scan vs Index Scan
-- ----------------------------------------------------------------------------

-- Demonstration 1: Index Scan on Book Title Search
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM books WHERE title = 'Database System Concepts';

-- Demonstration 2: Bitmap Index Scan on Active Loans
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM loans WHERE status = 'ACTIVE' AND due_at < CURRENT_TIMESTAMP;

-- Demonstration 3: Hash Index point lookup on Barcode
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM book_copies WHERE barcode = 'BC-DBS-001-A';
