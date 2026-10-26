-- ============================================================================
-- DIGITAL LIBRARY BOOK RESERVATION AND RECOMMENDATION SYSTEM
-- Database Stored Procedures (DBMS Module 2: Stored Procedures & Transactions)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROCEDURE: sp_checkout_book
-- Atomically processes the checkout of a physical copy to an eligible patron.
-- Locks the copy row, validates availability, creates loan, and updates copy status.
-- Demonstrates Module 5 ACID Transaction boundaries.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_checkout_book(
    p_user_id INT,
    p_copy_id INT,
    p_borrow_days INT DEFAULT 14
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_copy_status VARCHAR(20);
    v_book_id INT;
    v_eligible BOOLEAN;
BEGIN
    -- 1. Verify patron borrowing eligibility
    v_eligible := fn_can_user_borrow(p_user_id);
    IF NOT v_eligible THEN
        RAISE EXCEPTION 'Patron ID % is ineligible to checkout books due to account status or unpaid fines.', p_user_id;
    END IF;

    -- 2. Lock the target physical copy row to prevent race conditions (Module 5 Pessimistic Locking)
    SELECT status, book_id 
    INTO v_copy_status, v_book_id
    FROM book_copies
    WHERE copy_id = p_copy_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Physical copy ID % does not exist.', p_copy_id;
    END IF;

    IF v_copy_status <> 'AVAILABLE' AND v_copy_status <> 'RESERVED' THEN
        RAISE EXCEPTION 'Cannot checkout copy ID %: Current status is %.', p_copy_id, v_copy_status;
    END IF;

    -- 3. Insert the new active loan record
    INSERT INTO loans (
        user_id,
        copy_id,
        checkout_at,
        due_at,
        status,
        fine_amount,
        is_fine_paid
    ) VALUES (
        p_user_id,
        p_copy_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + (p_borrow_days || ' days')::INTERVAL,
        'ACTIVE',
        0.00,
        FALSE
    );

    -- 4. Mark copy status as LOANED
    UPDATE book_copies
    SET status = 'LOANED'
    WHERE copy_id = p_copy_id;

    -- 5. If user had an active reservation for this book title, fulfill it
    UPDATE reservations
    SET status = 'FULFILLED',
        fulfilled_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id 
      AND book_id = v_book_id 
      AND status IN ('WAITING', 'READY');

    RAISE NOTICE 'Successfully checked out copy ID % to user ID %.', p_copy_id, p_user_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. PROCEDURE: sp_return_book
-- Atomically processes the return of a physical copy.
-- Computes overdue fines, updates loan record, and checks if a reservation
-- queue exists to transition the copy to 'RESERVED' or 'AVAILABLE'.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_return_book(
    p_copy_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_loan_id INT;
    v_book_id INT;
    v_calculated_fine NUMERIC(8, 2);
    v_next_res_id INT;
BEGIN
    -- 1. Identify active loan for this copy
    SELECT loan_id, copy_id
    INTO v_loan_id
    FROM loans
    WHERE copy_id = p_copy_id 
      AND status IN ('ACTIVE', 'OVERDUE')
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active loan found for copy ID %.', p_copy_id;
    END IF;

    -- 2. Calculate any overdue fine
    v_calculated_fine := fn_calculate_overdue_fines(v_loan_id);

    -- 3. Mark the loan as RETURNED
    UPDATE loans
    SET returned_at = CURRENT_TIMESTAMP,
        status = 'RETURNED',
        fine_amount = v_calculated_fine,
        is_fine_paid = (v_calculated_fine = 0.00)
    WHERE loan_id = v_loan_id;

    -- 4. Check if other patrons are in reservation queue for this book
    SELECT book_id INTO v_book_id FROM book_copies WHERE copy_id = p_copy_id;

    SELECT reservation_id 
    INTO v_next_res_id
    FROM reservations
    WHERE book_id = v_book_id 
      AND status = 'WAITING'
    ORDER BY queue_position ASC NULLS LAST, reserved_at ASC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
        -- Advance next reservation to READY with 48h pickup window
        UPDATE reservations
        SET status = 'READY',
            expires_at = CURRENT_TIMESTAMP + INTERVAL '48 hours',
            queue_position = NULL
        WHERE reservation_id = v_next_res_id;

        -- Set physical copy to RESERVED
        UPDATE book_copies
        SET status = 'RESERVED'
        WHERE copy_id = p_copy_id;

        RAISE NOTICE 'Copy ID % returned. Held as RESERVED for reservation ID %.', p_copy_id, v_next_res_id;
    ELSE
        -- No waiting reservations; return copy to AVAILABLE pool
        UPDATE book_copies
        SET status = 'AVAILABLE'
        WHERE copy_id = p_copy_id;

        RAISE NOTICE 'Copy ID % returned and marked AVAILABLE on shelf.', p_copy_id;
    END IF;
END;
$$;
