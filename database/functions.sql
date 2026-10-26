-- ============================================================================
-- DIGITAL LIBRARY BOOK RESERVATION AND RECOMMENDATION SYSTEM
-- Database Functions Definition (DBMS Module 2: Stored Functions)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FUNCTION: fn_calculate_overdue_fines
-- Calculates the outstanding fine for a specific loan based on days overdue.
-- Default rate: $1.00 per day past due date.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calculate_overdue_fines(p_loan_id INT)
RETURNS NUMERIC(8, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_due_at TIMESTAMP WITH TIME ZONE;
    v_returned_at TIMESTAMP WITH TIME ZONE;
    v_end_date TIMESTAMP WITH TIME ZONE;
    v_days_overdue INT;
    v_fine_rate NUMERIC(8, 2) := 1.00;
    v_calculated_fine NUMERIC(8, 2) := 0.00;
BEGIN
    SELECT due_at, returned_at 
    INTO v_due_at, v_returned_at
    FROM loans
    WHERE loan_id = p_loan_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan ID % not found.', p_loan_id;
    END IF;

    -- If returned, calculate fine up to returned_at; otherwise calculate up to current time
    v_end_date := COALESCE(v_returned_at, CURRENT_TIMESTAMP);

    IF v_end_date > v_due_at THEN
        v_days_overdue := CEIL(EXTRACT(EPOCH FROM (v_end_date - v_due_at)) / 86400);
        v_calculated_fine := v_days_overdue * v_fine_rate;
    ELSE
        v_calculated_fine := 0.00;
    END IF;

    RETURN v_calculated_fine;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. FUNCTION: fn_get_available_copy_count
-- Returns the count of physically available copies for a given book title.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_available_copy_count(p_book_id INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INT := 0;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM book_copies
    WHERE book_id = p_book_id 
      AND status = 'AVAILABLE';
      
    RETURN v_count;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. FUNCTION: fn_can_user_borrow
-- Verifies whether a patron is eligible to borrow books.
-- Returns FALSE if user is inactive, has overdue loans, or unpaid fines >= $10.00.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_can_user_borrow(p_user_id INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_is_active BOOLEAN;
    v_overdue_count INT;
    v_unpaid_fines NUMERIC(8, 2);
BEGIN
    SELECT is_active INTO v_is_active FROM users WHERE user_id = p_user_id;
    IF NOT FOUND OR NOT v_is_active THEN
        RETURN FALSE;
    END IF;

    -- Check for overdue active loans
    SELECT COUNT(*) INTO v_overdue_count
    FROM loans
    WHERE user_id = p_user_id 
      AND status IN ('ACTIVE', 'OVERDUE')
      AND due_at < CURRENT_TIMESTAMP;

    IF v_overdue_count > 0 THEN
        RETURN FALSE;
    END IF;

    -- Check for accrued unpaid fines
    SELECT COALESCE(SUM(fine_amount), 0.00) INTO v_unpaid_fines
    FROM loans
    WHERE user_id = p_user_id 
      AND is_fine_paid = FALSE;

    IF v_unpaid_fines >= 10.00 THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;
