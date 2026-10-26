-- ============================================================================
-- DIGITAL LIBRARY BOOK RESERVATION AND RECOMMENDATION SYSTEM
-- ACID Transaction & Concurrency Test Suite (DBMS Module 5)
-- Demonstrates: Atomicity, Consistency, Isolation, Durability, Rollbacks,
-- Pessimistic Row Locking, and Concurrent Checkout Race Condition Prevention.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TEST 1: ATOMICITY & ROLLBACK DEMONSTRATION
-- Goal: Verify that a multi-statement transaction completely rolls back if
-- any step encounters an error, preventing orphaned or partial database states.
-- ----------------------------------------------------------------------------

BEGIN;
-- Step 1: Attempt to create an active loan for copy_id = 1
INSERT INTO loans (user_id, copy_id, checkout_at, due_at, status)
VALUES (4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '14 days', 'ACTIVE');

-- Step 2: Attempt an invalid insert that violates a CHECK constraint (rating = 10, valid is 1-5)
-- This will trigger a CHECK constraint violation and abort the transaction block!
INSERT INTO reviews (user_id, book_id, rating, review_text)
VALUES (4, 1, 10, 'Invalid rating test!');

-- If an error occurs, the entire block is aborted by PostgreSQL
COMMIT; -- Will fail or rollback

-- Verification Query: Check that the loan from Step 1 was NEVER committed!
-- Expected result: 0 rows returned for this new loan
SELECT * FROM loans WHERE user_id = 4 AND copy_id = 1 AND status = 'ACTIVE';


-- ----------------------------------------------------------------------------
-- TEST 2: TWO-SESSION CONCURRENCY RACE CONDITION TEST
-- Goal: Prove that two patrons cannot concurrently check out the exact same physical copy.
-- To execute this test: Open TWO parallel terminal windows connected to PostgreSQL:
-- Window A (Patron Jinto) and Window B (Patron Dev)
-- ----------------------------------------------------------------------------

/*
========================= TERMINAL SESSION A (User 4) =========================
-- Begin transaction and acquire an exclusive row-level lock on copy ID 1
BEGIN;
SELECT copy_id, book_id, status 
FROM book_copies 
WHERE copy_id = 1 
FOR UPDATE;

-- At this point, Session A holds an exclusive lock on copy 1.
-- DO NOT COMMIT YET! Now run Session B in the second window.

INSERT INTO loans (user_id, copy_id, checkout_at, due_at, status)
VALUES (4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '14 days', 'ACTIVE');

UPDATE book_copies 
SET status = 'LOANED' 
WHERE copy_id = 1;

COMMIT;
-- Once Session A commits, Session B will unblock.
===============================================================================

========================= TERMINAL SESSION B (User 9) =========================
-- Concurrently attempt to checkout the SAME copy (copy ID 1)
BEGIN;

-- This query will BLOCK and wait for Session A to release the row lock:
SELECT copy_id, book_id, status 
FROM book_copies 
WHERE copy_id = 1 
FOR UPDATE;

-- When Session A commits, Session B resumes and inspects the new status:
-- Status is now 'LOANED'! Session B must abort checkout:
-- "Cannot checkout copy 1: Status is LOANED"

ROLLBACK;
===============================================================================
*/


-- ----------------------------------------------------------------------------
-- TEST 3: DATABASE-LEVEL PARTIAL UNIQUE INDEX PROTECTION
-- Goal: Even if the application logic failed to check, the PostgreSQL storage
-- engine's partial unique index MUST reject a concurrent double checkout.
-- ----------------------------------------------------------------------------

-- Step 1: Copy 2 is already LOANED to User 4 in seed data.
-- Attempt to directly insert a SECOND active loan on copy 2 for User 5:
INSERT INTO loans (user_id, copy_id, checkout_at, due_at, status)
VALUES (5, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '14 days', 'ACTIVE');

-- EXPECTED RESULT:
-- ERROR: duplicate key value violates unique constraint "uq_single_active_loan_per_copy"
-- DETAIL: Key (copy_id)=(2) already exists.
-- PROOF: The database engine itself makes double checkout physically impossible.


-- ----------------------------------------------------------------------------
-- TEST 4: RESERVATION QUEUE DUPLICATE PROTECTION
-- Goal: Verify that a patron cannot place two concurrent active reservations on one book.
-- ----------------------------------------------------------------------------

-- User 4 already has an active WAITING reservation for Book 5 in seed data.
-- Attempt to insert another active reservation for User 4 on Book 5:
INSERT INTO reservations (user_id, book_id, status)
VALUES (4, 5, 'WAITING');

-- EXPECTED RESULT:
-- ERROR: duplicate key value violates unique constraint "uq_user_book_active_reservation"
-- DETAIL: Key (user_id, book_id)=(4, 5) already exists.
