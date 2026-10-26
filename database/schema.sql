-- ============================================================================
-- DIGITAL LIBRARY BOOK RESERVATION AND RECOMMENDATION SYSTEM
-- Database Schema Definition (PostgreSQL 14+)
-- Authoritative Relational Database (Modules 1, 2, 3, 4, 5)
-- ============================================================================

-- Drop existing tables in reverse dependency order for clean idempotent setup
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS book_copies CASCADE;
DROP TABLE IF EXISTS book_authors CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS publishers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores students, faculty, librarians, and administrative staff.
-- Primary Key: user_id
-- Candidate/Unique Keys: email
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT'
        CHECK (role IN ('STUDENT', 'FACULTY', 'LIBRARIAN', 'ADMIN')),
    department VARCHAR(100),
    phone VARCHAR(25),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. PUBLISHERS TABLE
-- Normalized publishing house entities.
-- Primary Key: publisher_id
-- Candidate/Unique Keys: publisher_name
-- ----------------------------------------------------------------------------
CREATE TABLE publishers (
    publisher_id SERIAL PRIMARY KEY,
    publisher_name VARCHAR(150) NOT NULL UNIQUE,
    city VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(200)
);

-- ----------------------------------------------------------------------------
-- 3. CATEGORIES TABLE
-- Academic and general subject classification hierarchy/domains.
-- Primary Key: category_id
-- Candidate/Unique Keys: category_name
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- ----------------------------------------------------------------------------
-- 4. AUTHORS TABLE
-- Creators and contributors for books.
-- Primary Key: author_id
-- ----------------------------------------------------------------------------
CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    author_name VARCHAR(150) NOT NULL,
    biography TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. BOOKS TABLE (Title / Work Entity)
-- Represents the abstract bibliographical work (title/edition).
-- A reservation targets a BOOK (title), not a specific physical copy.
-- Primary Key: book_id
-- Candidate/Unique Keys: isbn
-- Foreign Keys: publisher_id -> publishers, category_id -> categories
-- ----------------------------------------------------------------------------
CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) NOT NULL UNIQUE,
    publication_year INT CHECK (publication_year >= 1400 AND publication_year <= 2100),
    publisher_id INT REFERENCES publishers(publisher_id) ON DELETE SET NULL,
    category_id INT NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    description TEXT,
    cover_image_url VARCHAR(300),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. BOOK_AUTHORS TABLE (M:N Bridge / Associative Entity)
-- Resolves Many-to-Many relationship between Books and Authors.
-- Composite Primary Key: (book_id, author_id)
-- ----------------------------------------------------------------------------
CREATE TABLE book_authors (
    book_id INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    author_id INT NOT NULL REFERENCES authors(author_id) ON DELETE CASCADE,
    author_order INT NOT NULL DEFAULT 1 CHECK (author_order >= 1),
    PRIMARY KEY (book_id, author_id)
);

-- ----------------------------------------------------------------------------
-- 7. BOOK_COPIES TABLE (Physical Item Entity)
-- Represents distinct physical barcode items held on library shelves.
-- Circulation (loans) operates directly upon a physical copy.
-- Primary Key: copy_id
-- Candidate/Unique Keys: barcode
-- Foreign Keys: book_id -> books
-- ----------------------------------------------------------------------------
CREATE TABLE book_copies (
    copy_id SERIAL PRIMARY KEY,
    book_id INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    barcode VARCHAR(50) NOT NULL UNIQUE,
    shelf_location VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'LOANED', 'RESERVED', 'MAINTENANCE', 'WITHDRAWN')),
    condition_notes TEXT,
    acquired_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ----------------------------------------------------------------------------
-- 8. RESERVATIONS TABLE
-- Represents a patron's request to reserve an available title or queue for one.
-- A reservation targets a BOOK (title). When a copy becomes free, the queue
-- advances and status changes from WAITING -> READY.
-- Primary Key: reservation_id
-- Foreign Keys: user_id -> users, book_id -> books
-- ----------------------------------------------------------------------------
CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    reserved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING'
        CHECK (status IN ('WAITING', 'READY', 'FULFILLED', 'CANCELLED', 'EXPIRED')),
    queue_position INT CHECK (queue_position >= 1),
    expires_at TIMESTAMP WITH TIME ZONE,
    fulfilled_at TIMESTAMP WITH TIME ZONE
);

-- Business rule constraint: A user cannot have multiple active (WAITING or READY)
-- reservations for the exact same book title.
CREATE UNIQUE INDEX uq_user_book_active_reservation 
    ON reservations (user_id, book_id) 
    WHERE status IN ('WAITING', 'READY');

-- ----------------------------------------------------------------------------
-- 9. LOANS TABLE (Circulation / Checkouts)
-- Represents a checkout of a physical copy by a library user.
-- Primary Key: loan_id
-- Foreign Keys: user_id -> users, copy_id -> book_copies
-- ----------------------------------------------------------------------------
CREATE TABLE loans (
    loan_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    copy_id INT NOT NULL REFERENCES book_copies(copy_id) ON DELETE RESTRICT,
    checkout_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    returned_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'RETURNED', 'OVERDUE', 'LOST')),
    fine_amount NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (fine_amount >= 0.00),
    is_fine_paid BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (due_at >= checkout_at),
    CHECK (returned_at IS NULL OR returned_at >= checkout_at)
);

-- Critical Concurrency & Data Integrity Rule:
-- Prevent more than one ACTIVE or OVERDUE loan on the exact same physical copy!
-- Partial unique index guarantees at database engine level that no race condition
-- can result in double-booking of a single physical asset.
CREATE UNIQUE INDEX uq_single_active_loan_per_copy 
    ON loans (copy_id) 
    WHERE status IN ('ACTIVE', 'OVERDUE');

-- ----------------------------------------------------------------------------
-- 10. REVIEWS TABLE
-- Patron ratings and reviews for books.
-- Primary Key: review_id
-- Candidate Key / Unique: (user_id, book_id) - one review per user per title
-- Foreign Keys: user_id -> users, book_id -> books
-- ----------------------------------------------------------------------------
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_book_review UNIQUE (user_id, book_id)
);

-- ----------------------------------------------------------------------------
-- BASELINE HELPER INDEXES (Foreign Keys & Common Search Paths)
-- (Module 4 will profile and expand these in indexes.sql)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_books_category ON books(category_id);
CREATE INDEX idx_books_publisher ON books(publisher_id);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_book_copies_book ON book_copies(book_id);
CREATE INDEX idx_book_copies_status ON book_copies(status);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_book_status ON reservations(book_id, status);
CREATE INDEX idx_loans_user_status ON loans(user_id, status);
CREATE INDEX idx_loans_due_at ON loans(due_at) WHERE status = 'ACTIVE';
CREATE INDEX idx_reviews_book ON reviews(book_id);
