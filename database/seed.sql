-- ============================================================================
-- DIGITAL LIBRARY BOOK RESERVATION AND RECOMMENDATION SYSTEM
-- Database Sample Seed Data (PostgreSQL 14+)
-- Authoritative Relational Database (Modules 1, 2, 3, 4, 5)
-- ============================================================================

-- Clean out existing rows in reverse dependency order
TRUNCATE TABLE reviews CASCADE;
TRUNCATE TABLE loans CASCADE;
TRUNCATE TABLE reservations CASCADE;
TRUNCATE TABLE book_copies CASCADE;
TRUNCATE TABLE book_authors CASCADE;
TRUNCATE TABLE books CASCADE;
TRUNCATE TABLE authors CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE publishers CASCADE;
TRUNCATE TABLE users CASCADE;

-- Restart primary key auto-increment sequences
ALTER SEQUENCE users_user_id_seq RESTART WITH 1;
ALTER SEQUENCE publishers_publisher_id_seq RESTART WITH 1;
ALTER SEQUENCE categories_category_id_seq RESTART WITH 1;
ALTER SEQUENCE authors_author_id_seq RESTART WITH 1;
ALTER SEQUENCE books_book_id_seq RESTART WITH 1;
ALTER SEQUENCE book_copies_copy_id_seq RESTART WITH 1;
ALTER SEQUENCE reservations_reservation_id_seq RESTART WITH 1;
ALTER SEQUENCE loans_loan_id_seq RESTART WITH 1;
ALTER SEQUENCE reviews_review_id_seq RESTART WITH 1;

-- ----------------------------------------------------------------------------
-- 1. USERS
-- Standard bcrypt hash for development demo accounts:
-- Password: "Password123!" -> hash: $2b$12$e8Yvj6k1v3uL6CjE9i9OzeoZ0gD4G1G6G4k8m4Q6l9f7J2m0q9s5a (demonstrative salt)
-- Includes Admin, Librarian, Faculty, and Students across departments
-- ----------------------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, role, department, phone) VALUES
('System Administrator', 'admin@library.edu', '$2b$12$K1nGwG9rPshZ9F4n2E9eAODRjGqGfWJ.qHkVX2rR5yqXlD2mZ5k1u', 'ADMIN', 'Information Technology', '+91-9876543210'),
('Eleanor Vance', 'eleanor.librarian@library.edu', '$2b$12$K1nGwG9rPshZ9F4n2E9eAODRjGqGfWJ.qHkVX2rR5yqXlD2mZ5k1u', 'LIBRARIAN', 'Library Services', '+91-9876543211'),
('Dr. Alan Turing', 'alan.turing@cs.edu', '$2b$12$K1nGwG9rPshZ9F4n2E9eAODRjGqGfWJ.qHkVX2rR5yqXlD2mZ5k1u', 'FACULTY', 'Computer Science & Engineering', '+91-9876543212'),
('Jinto Joseph', 'jinto.student@cs.edu', '$2b$12$K1nGwG9rPshZ9F4n2E9eAODRjGqGfWJ.qHkVX2rR5yqXlD2mZ5k1u', 'STUDENT', 'Computer Science & Engineering', '+91-9876543213'),
('Ananya Sharma', 'ananya.sharma@cs.edu', '$2b$12$K1nGwG9rPshZ9F4n2E9eAODRjGqGfWJ.qHkVX2rR5yqXlD2mZ5k1u', 'STUDENT', 'Computer Science & Engineering', '+91-9876543214'),
('Rahul Verma', 'rahul.verma@ec.edu', '$2b$12$K1nGwG9rPshZ9F4n2E9eAODRjGqGfWJ.qHkVX2rR5yqXlD2mZ5k1u', 'STUDENT', 'Electronics & Communication', '+91-9876543215'),
('Priya Nair', 'priya.nair@mech.edu', '$2b$12$K1nGwG9rPshZ9F4n2E9eAODRjGqGfWJ.qHkVX2rR5yqXlD2mZ5k1u', 'STUDENT', 'Mechanical Engineering', '+91-9876543216'),
('Kavita Krishnan', 'kavita.k@ai.edu', '$2b$12$K1nGwG9rPshZ9F4n2E9eAODRjGqGfWJ.qHkVX2rR5yqXlD2mZ5k1u', 'STUDENT', 'Data Science & AI', '+91-9876543217'),
('Dev Patel', 'dev.patel@cs.edu', '$2b$12$K1nGwG9rPshZ9F4n2E9eAODRjGqGfWJ.qHkVX2rR5yqXlD2mZ5k1u', 'STUDENT', 'Computer Science & Engineering', '+91-9876543218'),
('Meera Sundaram', 'meera.s@ee.edu', '$2b$12$K1nGwG9rPshZ9F4n2E9eAODRjGqGfWJ.qHkVX2rR5yqXlD2mZ5k1u', 'STUDENT', 'Electrical Engineering', '+91-9876543219');

-- ----------------------------------------------------------------------------
-- 2. PUBLISHERS
-- ----------------------------------------------------------------------------
INSERT INTO publishers (publisher_name, city, country, website) VALUES
('McGraw-Hill Education', 'New York', 'USA', 'https://www.mheducation.com'),
('Pearson Education', 'London', 'UK', 'https://www.pearson.com'),
('O''Reilly Media', 'Sebastopol', 'USA', 'https://www.oreilly.com'),
('MIT Press', 'Cambridge', 'USA', 'https://mitpress.mit.edu'),
('Addison-Wesley Professional', 'Boston', 'USA', 'https://www.informit.com/aw'),
('Morgan Kaufmann', 'San Francisco', 'USA', 'https://www.elsevier.com/morgan-kaufmann');

-- ----------------------------------------------------------------------------
-- 3. CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO categories (category_name, description) VALUES
('Database Systems', 'Relational models, SQL, transactions, indexing, concurrency, and distributed data systems.'),
('Computer Networks', 'Network architectures, protocols, routing algorithms, transport layer, and network security.'),
('Operating Systems', 'Kernel architecture, process synchronization, virtualization, memory management, and file systems.'),
('Algorithms & Data Structures', 'Complexity analysis, sorting, graph algorithms, dynamic programming, and data organization.'),
('Artificial Intelligence & ML', 'Statistical learning, neural networks, knowledge representation, heuristics, and natural language processing.'),
('Software Engineering', 'System architecture, design patterns, microservices, testing paradigms, and agile methodologies.');

-- ----------------------------------------------------------------------------
-- 4. AUTHORS
-- ----------------------------------------------------------------------------
INSERT INTO authors (author_name, biography) VALUES
('Abraham Silberschatz', 'Professor of Computer Science at Yale University; pioneer in database systems and operating systems.'),
('Henry F. Korth', 'Professor of Computer Science and Engineering at Lehigh University; ACM and IEEE Fellow.'),
('S. Sudarshan', 'Subrao M. Nilekani Chair Professor at IIT Bombay; expert in database query processing and optimizations.'),
('Andrew S. Tanenbaum', 'Emeritus Professor of Computer Science at Vrije Universiteit Amsterdam; author of MINIX and OS textbooks.'),
('Thomas H. Cormen', 'Emeritus Professor of Computer Science at Dartmouth College; co-author of CLRS Introduction to Algorithms.'),
('Charles E. Leiserson', 'Professor of Computer Science and Engineering at MIT; high-performance computing researcher.'),
('Ronald L. Rivest', 'MIT Institute Professor; co-inventor of RSA cryptosystem and Turing Award laureate.'),
('Clifford Stein', 'Professor of Industrial Engineering and Operations Research at Columbia University.'),
('Stuart Russell', 'Professor of Computer Science at UC Berkeley; AI researcher and co-author of AIMA.'),
('Peter Norvig', 'Director of Research at Google; former NASA Ames division chief; co-author of AIMA.'),
('Martin Kleppmann', 'Associate Professor at University of Cambridge; author of Designing Data-Intensive Applications.'),
('Robert C. Martin', 'Software craftsman, author of Clean Code and agile manifesto co-signatory.');

-- ----------------------------------------------------------------------------
-- 5. BOOKS
-- Distinct bibliographical works.
-- ----------------------------------------------------------------------------
INSERT INTO books (title, isbn, publication_year, publisher_id, category_id, description) VALUES
('Database System Concepts', '978-0078022159', 2019, 1, 1, 'The foundational textbook on relational database systems, indexing, transactions, and modern big data technologies.'),
('Operating System Concepts', '978-1119800361', 2021, 2, 3, 'Comprehensive guide to processes, threads, CPU scheduling, synchronization, deadlocks, and virtual memory systems.'),
('Introduction to Algorithms (CLRS)', '978-0262046305', 2022, 4, 4, 'The gold standard reference and undergraduate textbook for foundational data structures and algorithm analysis.'),
('Computer Networks: A Systems Approach', '978-0123850591', 2020, 6, 2, 'Principles of computer networking illustrated through working system implementations and real Internet architectures.'),
('Artificial Intelligence: A Modern Approach', '978-0134610993', 2020, 2, 5, 'The leading authoritative survey of intelligent agents, deep learning, logic, and probabilistic reasoning.'),
('Designing Data-Intensive Applications', '978-1449373320', 2017, 3, 1, 'Deep dive into storage engines, replication, partitioning, transactions, consensus, and batch/stream data processing.'),
('Clean Code: A Handbook of Agile Software Craftsmanship', '978-0132350884', 2008, 5, 6, 'Essential guidelines, design heuristics, and code smells for developing maintainable and robust software systems.'),
('Modern Operating Systems', '978-0133591620', 2014, 2, 3, 'In-depth exploration of kernel design, multi-core architecture, virtualization, file systems, and Android/Linux security.');

-- ----------------------------------------------------------------------------
-- 6. BOOK_AUTHORS (Bridge table: Many-to-Many)
-- ----------------------------------------------------------------------------
INSERT INTO book_authors (book_id, author_id, author_order) VALUES
-- Database System Concepts -> Silberschatz, Korth, Sudarshan
(1, 1, 1),
(1, 2, 2),
(1, 3, 3),
-- Operating System Concepts -> Silberschatz
(2, 1, 1),
-- Introduction to Algorithms -> Cormen, Leiserson, Rivest, Stein
(3, 5, 1),
(3, 6, 2),
(3, 7, 3),
(3, 8, 4),
-- Computer Networks -> Tanenbaum
(4, 4, 1),
-- AI: A Modern Approach -> Russell, Norvig
(5, 9, 1),
(5, 10, 2),
-- Designing Data-Intensive Applications -> Kleppmann
(6, 11, 1),
-- Clean Code -> Martin
(7, 12, 1),
-- Modern Operating Systems -> Tanenbaum
(8, 4, 1);

-- ----------------------------------------------------------------------------
-- 7. BOOK_COPIES
-- Physical copy units with unique library barcodes and shelf locations
-- ----------------------------------------------------------------------------
INSERT INTO book_copies (book_id, barcode, shelf_location, status) VALUES
-- Book 1: Database System Concepts (4 copies)
(1, 'BC-DBS-001-A', 'Floor 2, Shelf DB-01', 'AVAILABLE'),
(1, 'BC-DBS-001-B', 'Floor 2, Shelf DB-01', 'LOANED'),
(1, 'BC-DBS-001-C', 'Floor 2, Shelf DB-01', 'LOANED'),
(1, 'BC-DBS-001-D', 'Floor 2, Shelf DB-01', 'MAINTENANCE'),

-- Book 2: Operating System Concepts (3 copies)
(2, 'BC-OS-002-A', 'Floor 2, Shelf OS-03', 'AVAILABLE'),
(2, 'BC-OS-002-B', 'Floor 2, Shelf OS-03', 'LOANED'),
(2, 'BC-OS-002-C', 'Floor 2, Shelf OS-03', 'AVAILABLE'),

-- Book 3: Introduction to Algorithms (CLRS) (3 copies)
(3, 'BC-ALGO-003-A', 'Floor 1, Shelf AL-05', 'LOANED'),
(3, 'BC-ALGO-003-B', 'Floor 1, Shelf AL-05', 'LOANED'),
(3, 'BC-ALGO-003-C', 'Floor 1, Shelf AL-05', 'AVAILABLE'),

-- Book 4: Computer Networks (2 copies)
(4, 'BC-NET-004-A', 'Floor 3, Shelf NW-02', 'AVAILABLE'),
(4, 'BC-NET-004-B', 'Floor 3, Shelf NW-02', 'AVAILABLE'),

-- Book 5: AI: A Modern Approach (3 copies)
(5, 'BC-AI-005-A', 'Floor 3, Shelf AI-01', 'LOANED'),
(5, 'BC-AI-005-B', 'Floor 3, Shelf AI-01', 'AVAILABLE'),
(5, 'BC-AI-005-C', 'Floor 3, Shelf AI-01', 'AVAILABLE'),

-- Book 6: Designing Data-Intensive Applications (3 copies)
(6, 'BC-DDIA-006-A', 'Floor 2, Shelf DB-04', 'AVAILABLE'),
(6, 'BC-DDIA-006-B', 'Floor 2, Shelf DB-04', 'AVAILABLE'),
(6, 'BC-DDIA-006-C', 'Floor 2, Shelf DB-04', 'AVAILABLE'),

-- Book 7: Clean Code (2 copies)
(7, 'BC-SE-007-A', 'Floor 1, Shelf SE-01', 'AVAILABLE'),
(7, 'BC-SE-007-B', 'Floor 1, Shelf SE-01', 'AVAILABLE'),

-- Book 8: Modern Operating Systems (1 copy)
(8, 'BC-MOS-008-A', 'Floor 2, Shelf OS-04', 'AVAILABLE');

-- ----------------------------------------------------------------------------
-- 8. RESERVATIONS
-- Sample reservations showing WAITING queues, READY pickups, and historical logs
-- ----------------------------------------------------------------------------
INSERT INTO reservations (user_id, book_id, reserved_at, status, queue_position, expires_at, fulfilled_at) VALUES
-- Jinto reserved AI Modern Approach (waiting in queue pos 1)
(4, 5, CURRENT_TIMESTAMP - INTERVAL '2 days', 'WAITING', 1, NULL, NULL),
-- Ananya waiting for Introduction to Algorithms (queue pos 1)
(5, 3, CURRENT_TIMESTAMP - INTERVAL '1 day', 'WAITING', 1, NULL, NULL),
-- Rahul reserved Database System Concepts (ready for pickup with 48h expiry)
(6, 1, CURRENT_TIMESTAMP - INTERVAL '18 hours', 'READY', NULL, CURRENT_TIMESTAMP + INTERVAL '30 hours', NULL),
-- Priya has a fulfilled past reservation for Clean Code
(7, 7, CURRENT_TIMESTAMP - INTERVAL '15 days', 'FULFILLED', NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '14 days'),
-- Dev cancelled a reservation for Operating System Concepts
(9, 2, CURRENT_TIMESTAMP - INTERVAL '10 days', 'CANCELLED', NULL, NULL, NULL);

-- ----------------------------------------------------------------------------
-- 9. LOANS
-- Active loans, returned history, and overdue loans to test SQL aggregates & fine queries
-- ----------------------------------------------------------------------------
INSERT INTO loans (user_id, copy_id, checkout_at, due_at, returned_at, status, fine_amount, is_fine_paid) VALUES
-- Active loan 1: Jinto borrowed Database System Concepts (copy 2)
(4, 2, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '9 days', NULL, 'ACTIVE', 0.00, FALSE),

-- Active loan 2: Ananya borrowed Operating System Concepts (copy 6)
(5, 6, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '11 days', NULL, 'ACTIVE', 0.00, FALSE),

-- Overdue active loan: Rahul borrowed Intro to Algorithms (copy 8), checked out 20 days ago, due 6 days ago
(6, 8, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '6 days', NULL, 'OVERDUE', 6.00, FALSE),

-- Active loan: Kavita borrowed AI Modern Approach (copy 12)
(8, 12, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '12 days', NULL, 'ACTIVE', 0.00, FALSE),

-- Active loan: Dev borrowed Intro to Algorithms (copy 9)
(9, 9, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '13 days', NULL, 'ACTIVE', 0.00, FALSE),

-- Returned loan 1: Jinto borrowed & returned Clean Code on time
(4, 17, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '16 days', CURRENT_TIMESTAMP - INTERVAL '20 days', 'RETURNED', 0.00, TRUE),

-- Returned loan 2: Priya borrowed & returned Database System Concepts late with paid fine
(7, 3, CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP - INTERVAL '26 days', CURRENT_TIMESTAMP - INTERVAL '23 days', 'RETURNED', 3.00, TRUE),

-- Returned loan 3: Ananya borrowed & returned DDIA on time
(5, 15, CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP - INTERVAL '11 days', CURRENT_TIMESTAMP - INTERVAL '12 days', 'RETURNED', 0.00, TRUE);

-- ----------------------------------------------------------------------------
-- 10. REVIEWS
-- Student book ratings and qualitative evaluations (ratings 1 - 5)
-- ----------------------------------------------------------------------------
INSERT INTO reviews (user_id, book_id, rating, review_text, created_at) VALUES
(4, 1, 5, 'Outstanding coverage of relational algebra, indexing, and recovery. The B-tree and transaction chapters are unmatched.', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(4, 7, 4, 'Every CS undergrad must read this. Practical advice on naming conventions, functions, and unit testing.', CURRENT_TIMESTAMP - INTERVAL '19 days'),
(5, 1, 5, 'Clear explanation of normal forms (1NF to BCNF). Great illustrations of serializability schedules.', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(5, 6, 5, 'Masterpiece for distributed systems. Brilliant breakdown of storage engines, LSM trees, and consensus protocols.', CURRENT_TIMESTAMP - INTERVAL '8 days'),
(7, 1, 4, 'Very detailed and comprehensive. Some of the SQL query optimization sections are quite advanced.', CURRENT_TIMESTAMP - INTERVAL '22 days'),
(8, 5, 5, 'Superb foundational guide for search heuristics and probability modeling in artificial intelligence.', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(9, 3, 4, 'Classic reference textbook for recurrence relations, dynamic programming, and red-black trees.', CURRENT_TIMESTAMP - INTERVAL '2 days');
