"""SQL feed: runs .sql files statement by statement and prints each one live in the
terminal with its comment heading, result rows, timing, NOTICE messages and errors.

Usage (from the project folder):
    .venv\\Scripts\\python.exe database\\sql_feed.py queries.sql            # run one file
    .venv\\Scripts\\python.exe database\\sql_feed.py views.sql queries.sql  # several files
    .venv\\Scripts\\python.exe database\\sql_feed.py queries.sql --step     # pause after each statement
    .venv\\Scripts\\python.exe database\\sql_feed.py --rebuild              # recreate the whole database
Options: --rows N (result rows shown, default 8)   --only "Query 6"  (statements whose heading matches)
"""
import argparse
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "backend"))
from config import Config  # noqa: E402  (reads .env)
import psycopg2  # noqa: E402

LOAD_ORDER = ["schema.sql", "functions.sql", "procedures.sql", "triggers.sql",
              "views.sql", "indexes.sql", "seed.sql", "seed_extended.sql"]
DESTRUCTIVE = {"schema.sql", "seed.sql", "seed_extended.sql"}   # these drop or truncate data

os.system("")  # enables ANSI colours in the classic Windows console
C = {"dim": "\033[90m", "head": "\033[96m", "sql": "\033[97m", "ok": "\033[92m", "err": "\033[91m",
     "note": "\033[93m", "file": "\033[95m", "bold": "\033[1m", "end": "\033[0m"}
KEYWORDS = r"\b(SELECT|FROM|WHERE|JOIN|LEFT|INNER|ON|GROUP BY|ORDER BY|HAVING|UNION|INTERSECT|EXCEPT|INSERT INTO|VALUES|" \
           r"UPDATE|SET|DELETE|CREATE|OR REPLACE|TABLE|VIEW|INDEX|UNIQUE|FUNCTION|PROCEDURE|TRIGGER|DROP|IF EXISTS|" \
           r"BEGIN|COMMIT|ROLLBACK|CALL|WITH|AS|AND|OR|NOT|EXISTS|IN|CASE|WHEN|THEN|ELSE|END|LIMIT|DISTINCT|" \
           r"PRIMARY KEY|REFERENCES|CHECK|DEFAULT|RETURNS|LANGUAGE|FOR UPDATE|OVER|PARTITION BY)\b"


def split_statements(sql):
    """Splits a script into (heading, statement) pairs. Understands quotes, comments and
    $$-quoted function bodies so semicolons inside them do not end a statement."""
    out, buf, comments = [], [], []
    i, n = 0, len(sql)
    while i < n:
        ch = sql[i]
        if sql.startswith("--", i):
            end = sql.find("\n", i)
            end = n if end == -1 else end
            line = sql[i + 2:end].strip()
            if not "".join(buf).strip():
                if line and not re.fullmatch(r"[-=]+", line):
                    comments.append(line)
            else:
                buf.append(sql[i:end])
            i = end
            continue
        if sql.startswith("/*", i):
            end = sql.find("*/", i + 2)
            end = n if end == -1 else end + 2
            if "".join(buf).strip():
                buf.append(sql[i:end])
            i = end
            continue
        if ch == "'":
            end = i + 1
            while end < n:
                if sql[end] == "'" and sql[end + 1:end + 2] == "'":
                    end += 2
                    continue
                if sql[end] == "'":
                    break
                end += 1
            buf.append(sql[i:end + 1]); i = end + 1
            continue
        m = re.match(r"\$[A-Za-z_]*\$", sql[i:])
        if m:
            tag = m.group(0)
            end = sql.find(tag, i + len(tag))
            end = n if end == -1 else end + len(tag)
            buf.append(sql[i:end]); i = end
            continue
        if ch == ";":
            stmt = "".join(buf).strip()
            if stmt:
                out.append((comments[-3:], stmt))
            buf, comments = [], []
            i += 1
            continue
        buf.append(ch); i += 1
    if "".join(buf).strip():
        out.append((comments[-3:], "".join(buf).strip()))
    return out


def highlight(stmt):
    return re.sub(KEYWORDS, lambda m: f"{C['bold']}{m.group(0)}{C['end']}{C['sql']}", stmt, flags=re.I)


def print_table(cur, max_rows):
    cols = [d.name for d in cur.description]
    rows = cur.fetchmany(max_rows)
    total = cur.rowcount
    cells = [[("NULL" if v is None else str(v))[:40] for v in r] for r in rows]
    widths = [max(len(c), *(len(r[i]) for r in cells)) if cells else len(c) for i, c in enumerate(cols)]
    line = "+" + "+".join("-" * (w + 2) for w in widths) + "+"
    print(C["dim"] + line)
    print("| " + " | ".join(c.ljust(w) for c, w in zip(cols, widths)) + " |")
    print(line)
    for r in cells:
        print("| " + " | ".join(v.ljust(w) for v, w in zip(r, widths)) + " |")
    print(line + C["end"])
    if total > len(rows):
        print(f"{C['dim']}  ... {total - len(rows)} more row(s) not shown (use --rows){C['end']}")


def run_file(conn, path, args, counters):
    name = os.path.basename(path)
    statements = split_statements(open(path, encoding="utf-8").read())
    print(f"\n{C['file']}{C['bold']}=== {name}  ({len(statements)} statements) ==={C['end']}")
    for idx, (heading, stmt) in enumerate(statements, 1):
        if args.only and not any(args.only.lower() in h.lower() for h in heading):
            continue
        print()
        for h in heading:
            print(f"{C['head']}-- {h}{C['end']}")
        shown = stmt if len(stmt) <= args.max_chars else stmt[:args.max_chars] + "\n   ... (statement truncated)"
        print(f"{C['dim']}[{name} #{idx}]{C['end']} {C['sql']}{highlight(shown)}{C['end']}")
        cur = conn.cursor()
        start = time.perf_counter()
        try:
            cur.execute(stmt)
            ms = (time.perf_counter() - start) * 1000
            for note in conn.notices:
                print(f"{C['note']}  {note.strip()}{C['end']}")
            del conn.notices[:]
            if cur.description:
                print_table(cur, args.rows)
                print(f"{C['ok']}  OK  {cur.rowcount} row(s) in {ms:.1f} ms{C['end']}")
            else:
                print(f"{C['ok']}  OK  {cur.statusmessage}  ({ms:.1f} ms){C['end']}")
            counters["ok"] += 1
        except psycopg2.Error as e:
            msg = e.diag.message_primary if e.diag and e.diag.message_primary else str(e).strip()
            print(f"{C['err']}  ERROR  {type(e).__name__}: {msg}{C['end']}")
            counters["err"] += 1
        finally:
            cur.close()
        if args.step:
            input(f"{C['dim']}  [Enter] next statement ...{C['end']}")


def main():
    p = argparse.ArgumentParser(description="Run .sql files statement by statement with live output.")
    p.add_argument("files", nargs="*", help="files in database/ (e.g. queries.sql); default: queries.sql")
    p.add_argument("--rebuild", action="store_true", help="drop and reload everything in dependency order")
    p.add_argument("--step", action="store_true", help="pause after each statement")
    p.add_argument("--rows", type=int, default=8, help="result rows to display (default 8)")
    p.add_argument("--only", help="run only statements whose comment heading contains this text")
    p.add_argument("--max-chars", type=int, default=1500, help="longest statement text shown")
    p.add_argument("--yes", action="store_true", help="skip the confirmation for files that reset data")
    args = p.parse_args()

    files = LOAD_ORDER if args.rebuild else (args.files or ["queries.sql"])
    paths = []
    for f in files:
        path = f if os.path.isabs(f) else os.path.join(HERE, f)
        if not os.path.exists(path):
            sys.exit(f"File not found: {path}")
        paths.append(path)

    risky = [os.path.basename(x) for x in paths if os.path.basename(x) in DESTRUCTIVE]
    if risky and not args.yes:
        answer = input(f"{C['note']}{', '.join(risky)} will DROP/RESET data (loans, reservations, new accounts). "
                       f"Continue? [y/N] {C['end']}")
        if answer.strip().lower() != "y":
            sys.exit("Cancelled.")

    conn = psycopg2.connect(host=Config.DB_HOST, port=Config.DB_PORT, dbname=Config.DB_NAME,
                            user=Config.DB_USER, password=Config.DB_PASSWORD)
    conn.autocommit = True   # every statement runs like it would in psql
    counters = {"ok": 0, "err": 0}
    try:
        for path in paths:
            run_file(conn, path, args, counters)
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        conn.close()
    print(f"\n{C['bold']}Done: {C['ok']}{counters['ok']} OK{C['end']}{C['bold']}, "
          f"{C['err']}{counters['err']} error(s){C['end']}")


if __name__ == "__main__":
    main()
