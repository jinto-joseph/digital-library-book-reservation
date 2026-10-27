"""Loads every SQL file into a fresh database and records the validation results
used in the report (report/results.json). Usage: python report/run_validation.py"""
import json, os, sys, time
import psycopg2
from psycopg2 import errors

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "backend"))
from config import Config  # noqa: E402  (reads .env)

LOAD_ORDER = ["schema.sql", "functions.sql", "procedures.sql", "triggers.sql",
              "views.sql", "indexes.sql", "seed.sql", "seed_extended.sql"]


def connect(db=Config.DB_NAME):
    return psycopg2.connect(host=Config.DB_HOST, port=Config.DB_PORT, dbname=db,
                            user=Config.DB_USER, password=Config.DB_PASSWORD)


def recreate_db():
    c = connect("postgres"); c.autocommit = True
    with c.cursor() as cur:
        cur.execute(f"DROP DATABASE IF EXISTS {Config.DB_NAME} WITH (FORCE)")
        cur.execute(f"CREATE DATABASE {Config.DB_NAME}")
    c.close()


def load_files(results):
    conn = connect(); conn.autocommit = True
    for f in LOAD_ORDER:
        sql = open(os.path.join(ROOT, "database", f), encoding="utf-8").read()
        try:
            with conn.cursor() as cur:
                cur.execute(sql)
            results["load"].append({"file": f, "ok": True})
        except Exception as e:
            results["load"].append({"file": f, "ok": False, "error": str(e).strip()})
    conn.close()


def scalar(cur, q, p=None):
    cur.execute(q, p); return cur.fetchone()[0]


def case(results, name, expect, fn):
    """Runs fn(cur) in its own transaction that is always rolled back."""
    conn = connect()
    try:
        with conn.cursor() as cur:
            outcome = fn(cur)
        status = "PASS" if outcome.get("pass") else "FAIL"
    except Exception as e:
        outcome = {"error": f"{type(e).__name__}: {str(e).strip().splitlines()[0]}"}
        status = "PASS" if expect == "error" else "FAIL"
    finally:
        conn.rollback(); conn.close()
    results["tests"].append({"name": name, "expected": expect, "status": status, **outcome})


def expect_error(cur, sql, p=()):
    cur.execute(sql, p)
    return {"pass": False, "note": "statement unexpectedly succeeded"}


def main():
    results = {"load": [], "counts": {}, "tests": [], "explain": [], "queries": {}}
    recreate_db(); load_files(results)
    conn = connect(); conn.autocommit = True
    cur = conn.cursor()
    for t in ["users", "publishers", "categories", "authors", "books", "book_authors",
              "book_copies", "reservations", "loans", "reviews"]:
        results["counts"][t] = scalar(cur, f"SELECT COUNT(*) FROM {t}")
    results["object_counts"] = {
        "views": scalar(cur, "SELECT COUNT(*) FROM pg_views WHERE schemaname='public'"),
        "functions": scalar(cur, "SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f' AND p.proname NOT LIKE 'fn_trg%'"),
        "procedures": scalar(cur, "SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='p'"),
        "triggers": scalar(cur, "SELECT COUNT(*) FROM pg_trigger WHERE NOT tgisinternal"),
        "indexes": scalar(cur, "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public'"),
    }
    # data consistency: copies marked LOANED without an open loan
    results["consistency"] = {
        "loaned_copies_without_loan": scalar(cur, """
            SELECT COUNT(*) FROM book_copies bc WHERE bc.status='LOANED'
              AND NOT EXISTS (SELECT 1 FROM loans l WHERE l.copy_id=bc.copy_id AND l.status IN ('ACTIVE','OVERDUE'))"""),
        "catalog_rows_with_duplicate_authors": scalar(cur, """
            SELECT COUNT(*) FROM v_book_catalog v
             WHERE array_length(string_to_array(v.authors, ', '),1) >
                   (SELECT COUNT(*) FROM book_authors ba WHERE ba.book_id=v.book_id)"""),
    }
    cur.execute("""SELECT u.department, COUNT(l.loan_id) FROM users u LEFT JOIN loans l ON l.user_id=u.user_id
                   GROUP BY u.department ORDER BY 1""")
    true_loans = dict(cur.fetchall())
    cur.execute("SELECT department, total_checkouts FROM v_department_circulation_stats ORDER BY 1")
    view_loans = dict(cur.fetchall())
    results["consistency"]["dept_view_mismatches"] = {
        k: {"actual": true_loans.get(k), "view": v} for k, v in view_loans.items() if true_loans.get(k) != v}

    # sample query outputs for the report
    cur.execute("""SELECT category_name, COUNT(*) AS titles FROM v_book_catalog
                   GROUP BY category_name ORDER BY titles DESC, category_name LIMIT 8""")
    results["queries"]["titles_per_category"] = cur.fetchall()
    cur.execute("SELECT title, total_copies, available_copies, loaned_copies FROM v_book_inventory ORDER BY loaned_copies DESC, title LIMIT 5")
    results["queries"]["inventory_top"] = cur.fetchall()
    cur.close(); conn.close()

    # ---------------- functional / negative test cases ----------------
    def free_copy(cur):
        cur.execute("""SELECT bc.copy_id FROM book_copies bc WHERE bc.status='AVAILABLE'
                       AND NOT EXISTS (SELECT 1 FROM loans l WHERE l.copy_id=bc.copy_id AND l.status IN ('ACTIVE','OVERDUE'))
                       ORDER BY copy_id LIMIT 1""")
        return cur.fetchone()[0]

    def eligible_user(cur):
        cur.execute("SELECT user_id FROM users WHERE role='STUDENT' AND fn_can_user_borrow(user_id) ORDER BY user_id LIMIT 1")
        return cur.fetchone()[0]

    def t_checkout(cur):
        u, c = eligible_user(cur), free_copy(cur)
        cur.execute("CALL sp_checkout_book(%s,%s,14)", (u, c))
        st = scalar(cur, "SELECT status FROM book_copies WHERE copy_id=%s", (c,))
        n = scalar(cur, "SELECT COUNT(*) FROM loans WHERE copy_id=%s AND status='ACTIVE'", (c,))
        return {"pass": st == "LOANED" and n == 1, "detail": f"user {u}, copy {c}: copy status={st}, active loans={n}"}
    case(results, "Valid checkout via sp_checkout_book", "success", t_checkout)

    def t_double(cur):
        u, c = eligible_user(cur), free_copy(cur)
        cur.execute("CALL sp_checkout_book(%s,%s,14)", (u, c))
        cur.execute("CALL sp_checkout_book(%s,%s,14)", (u, c))
        return {"pass": False}
    case(results, "Second checkout of an already loaned copy", "error", t_double)

    def t_return(cur):
        u, c = eligible_user(cur), free_copy(cur)
        cur.execute("CALL sp_checkout_book(%s,%s,14)", (u, c))
        cur.execute("CALL sp_return_book(%s)", (c,))
        st = scalar(cur, "SELECT status FROM book_copies WHERE copy_id=%s", (c,))
        ls = scalar(cur, "SELECT status FROM loans WHERE copy_id=%s ORDER BY loan_id DESC LIMIT 1", (c,))
        return {"pass": st in ("AVAILABLE", "RESERVED") and ls == "RETURNED", "detail": f"copy status={st}, loan status={ls}"}
    case(results, "Return via sp_return_book", "success", t_return)

    def t_fine(cur):
        u, c = eligible_user(cur), free_copy(cur)
        cur.execute("""INSERT INTO loans(user_id,copy_id,checkout_at,due_at,status)
                       VALUES (%s,%s,NOW()-INTERVAL '20 days',NOW()-INTERVAL '6 days','ACTIVE') RETURNING loan_id""", (u, c))
        lid = cur.fetchone()[0]
        fine = scalar(cur, "SELECT fn_calculate_overdue_fines(%s)", (lid,))
        can = scalar(cur, "SELECT fn_can_user_borrow(%s)", (u,))
        return {"pass": float(fine) == 6.0 and can is False, "detail": f"fine={fine}, can_borrow={can}"}
    case(results, "Overdue fine (6 days late) and borrow block", "success", t_fine)

    case(results, "Rating outside 1-5 (CHECK)", "error",
         lambda cur: expect_error(cur, "INSERT INTO reviews(user_id,book_id,rating) VALUES (4,1,10)"))
    case(results, "Duplicate e-mail (UNIQUE)", "error",
         lambda cur: expect_error(cur, "INSERT INTO users(full_name,email,password_hash) VALUES ('X','admin@library.edu','h')"))
    case(results, "Loan for non-existent copy (FOREIGN KEY)", "error",
         lambda cur: expect_error(cur, "INSERT INTO loans(user_id,copy_id,due_at) VALUES (4,99999,NOW()+INTERVAL '1 day')"))
    case(results, "Invalid role value (CHECK)", "error",
         lambda cur: expect_error(cur, "INSERT INTO users(full_name,email,password_hash,role) VALUES ('X','x@y.z','h','HACKER')"))

    def t_dup_res(cur):
        cur.execute("SELECT user_id, book_id FROM reservations WHERE status IN ('WAITING','READY') LIMIT 1")
        u, b = cur.fetchone()
        cur.execute("INSERT INTO reservations(user_id,book_id,status) VALUES (%s,%s,'WAITING')", (u, b))
        return {"pass": False}
    case(results, "Duplicate active reservation (partial UNIQUE index)", "error", t_dup_res)

    def t_queue(cur):
        cur.execute("SELECT book_id FROM books ORDER BY book_id DESC LIMIT 1")
        b = cur.fetchone()[0]
        pos = []
        for u in (5, 6, 7):
            cur.execute("INSERT INTO reservations(user_id,book_id,status) VALUES (%s,%s,'WAITING') RETURNING queue_position", (u, b))
            pos.append(cur.fetchone()[0])
        return {"pass": pos == [1, 2, 3], "detail": f"queue positions assigned = {pos}"}
    case(results, "FIFO queue position trigger", "success", t_queue)

    def t_atomic(cur):
        c = free_copy(cur)
        cur.execute("SAVEPOINT s")
        try:
            cur.execute("INSERT INTO loans(user_id,copy_id,due_at) VALUES (4,%s,NOW()+INTERVAL '14 days')", (c,))
            cur.execute("INSERT INTO reviews(user_id,book_id,rating) VALUES (4,1,10)")
        except errors.CheckViolation:
            cur.execute("ROLLBACK TO SAVEPOINT s")
        n = scalar(cur, "SELECT COUNT(*) FROM loans WHERE copy_id=%s AND status='ACTIVE'", (c,))
        return {"pass": n == 0, "detail": f"active loans on copy {c} after rollback = {n}"}
    case(results, "Atomicity: failed unit rolls back the loan insert", "success", t_atomic)

    # ---------------- concurrency: two sessions, one copy ----------------
    a, b = connect(), connect()
    try:
        ca, cb = a.cursor(), b.cursor()
        c = free_copy(ca)
        ca.execute("CALL sp_checkout_book(4,%s,14)", (c,))           # A holds the row lock, not committed
        cb.execute("SET lock_timeout = '2s'")
        t0 = time.time()
        try:
            cb.execute("CALL sp_checkout_book(5,%s,14)", (c,))
            b_result = "succeeded (unexpected)"
        except Exception as e:
            b_result = f"blocked {time.time()-t0:.1f}s then {type(e).__name__}"
        b.rollback()
        a.commit()
        try:
            cb.execute("CALL sp_checkout_book(5,%s,14)", (c,)); b_after = "succeeded (unexpected)"
        except Exception as e:
            b_after = f"rejected: {str(e).strip().splitlines()[0]}"
        b.rollback()
        winners = scalar(ca, "SELECT COUNT(*) FROM loans WHERE copy_id=%s AND status='ACTIVE'", (c,))
        results["tests"].append({"name": "Concurrent checkout of same copy (FOR UPDATE)", "expected": "one winner",
                                 "status": "PASS" if winners == 1 else "FAIL",
                                 "detail": f"A committed; B while A held lock: {b_result}; B after commit: {b_after}; active loans={winners}"})
        ca.execute("CALL sp_return_book(%s)", (c,)); a.commit()
    finally:
        a.close(); b.close()

    # ---------------- indexing: EXPLAIN ANALYZE with / without index ----------------
    conn = connect(); conn.autocommit = True; cur = conn.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS bench_copies AS
                   SELECT g AS copy_id, 'BC-' || lpad(g::text, 7, '0') AS barcode, (g % 69) + 1 AS book_id,
                          CASE WHEN g % 10 = 0 THEN 'LOANED' ELSE 'AVAILABLE' END AS status
                   FROM generate_series(1, 200000) g""")
    cur.execute("ANALYZE bench_copies")
    probes = [("Barcode point lookup", "SELECT * FROM bench_copies WHERE barcode = 'BC-0154321'",
               "CREATE INDEX bench_barcode_btree ON bench_copies USING btree(barcode)", "B-Tree"),
              ("Barcode point lookup", "SELECT * FROM bench_copies WHERE barcode = 'BC-0154321'",
               "CREATE INDEX bench_barcode_hash ON bench_copies USING hash(barcode)", "Hash"),
              ("Loaned copies of one book", "SELECT * FROM bench_copies WHERE book_id = 17 AND status = 'LOANED'",
               "CREATE INDEX bench_book_status ON bench_copies(book_id, status)", "Composite")]
    for label, q, ddl, kind in probes:
        for idx in ("bench_barcode_btree", "bench_barcode_hash", "bench_book_status"):
            cur.execute(f"DROP INDEX IF EXISTS {idx}")
        def run():
            best = None
            for _ in range(5):
                cur.execute("EXPLAIN (ANALYZE, FORMAT JSON) " + q)
                plan = cur.fetchone()[0][0]
                if best is None or plan["Execution Time"] < best["Execution Time"]:
                    best = plan
            return best["Plan"]["Node Type"], round(best["Execution Time"], 3)
        before = run(); cur.execute(ddl); cur.execute("ANALYZE bench_copies"); after = run()
        results["explain"].append({"query": label, "index": kind, "before_plan": before[0], "before_ms": before[1],
                                   "after_plan": after[0], "after_ms": after[1]})
    cur.execute("DROP TABLE bench_copies")
    results["server_version"] = scalar(cur, "SHOW server_version")
    conn.close()

    out = os.path.join(ROOT, "report", "results.json")
    json.dump(results, open(out, "w"), indent=2, default=str)
    print(json.dumps(results, indent=2, default=str))


if __name__ == "__main__":
    main()
