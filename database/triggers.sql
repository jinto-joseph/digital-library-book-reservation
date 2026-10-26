-- ============================================================================
-- DIGITAL LIBRARY BOOK RESERVATION AND RECOMMENDATION SYSTEM
-- Database Triggers Definition (DBMS Module 2: Triggers & Active Databases)
-- ============================================================================

-- Drop triggers and trigger functions in reverse order
DROP TRIGGER IF EXISTS trg_auto_queue_position ON reservations CASCADE;
DROP FUNCTION IF EXISTS fn_trg_assign_queue_position CASCADE;

DROP TRIGGER IF EXISTS trg_sync_copy_status_on_loan ON loans CASCADE;
DROP FUNCTION IF EXISTS fn_trg_sync_copy_status_on_loan CASCADE;

DROP TRIGGER IF EXISTS trg_update_review_timestamp ON reviews CASCADE;
DROP FUNCTION IF EXISTS fn_trg_update_review_timestamp CASCADE;

-- ----------------------------------------------------------------------------
-- 1. TRIGGER: trg_update_review_timestamp
-- Automatically updates updated_at whenever a patron edits their book review.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_update_review_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_review_timestamp
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION fn_trg_update_review_timestamp();

-- ----------------------------------------------------------------------------
-- 2. TRIGGER: trg_sync_copy_status_on_loan
-- Automatically maintains book_copies.status in sync with loan events.
-- When a loan is created (status 'ACTIVE'), sets book_copies.status = 'LOANED'.
-- When a loan is closed (status 'RETURNED'), ensures copy is no longer 'LOANED'.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_sync_copy_status_on_loan()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.status = 'ACTIVE' THEN
            UPDATE book_copies
            SET status = 'LOANED'
            WHERE copy_id = NEW.copy_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.status = 'ACTIVE' AND NEW.status = 'RETURNED' THEN
            -- Only update to AVAILABLE if not already handled by procedure
            UPDATE book_copies
            SET status = 'AVAILABLE'
            WHERE copy_id = NEW.copy_id AND status = 'LOANED';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_copy_status_on_loan
AFTER INSERT OR UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION fn_trg_sync_copy_status_on_loan();

-- ----------------------------------------------------------------------------
-- 3. TRIGGER: trg_auto_queue_position
-- Automatically computes and assigns the next FIFO queue_position when a patron
-- places a WAITING reservation for a book title.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_assign_queue_position()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_max_pos INT;
BEGIN
    IF NEW.status = 'WAITING' AND NEW.queue_position IS NULL THEN
        SELECT COALESCE(MAX(queue_position), 0) INTO v_max_pos
        FROM reservations
        WHERE book_id = NEW.book_id 
          AND status = 'WAITING';

        NEW.queue_position := v_max_pos + 1;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_queue_position
BEFORE INSERT ON reservations
FOR EACH ROW
EXECUTE FUNCTION fn_trg_assign_queue_position();
