# Antigravity Prompt — Digital Library Book Reservation and Recommendation System

Read `README.md` completely before editing. This is a two-person academic DBMS project covering all six modules. Inspect the current repository first and preserve existing work.

## Immediate goal for Member A today
Build and validate the project foundation so it can be pushed to GitHub and handed to the second student:
1. Create the repository structure described in README.
2. Create `docs/requirements.md`, `docs/architecture.md`, `docs/er-model.md`, `docs/relational-schema.md`, `docs/normalization.md`, `docs/module-mapping.md`, and `docs/demo-script.md`.
3. Implement `database/schema.sql` and `database/seed.sql` for users, publishers, categories, authors, books, book_authors, book_copies, reservations, loans, and reviews.
4. Use consistent snake_case, primary/foreign keys, appropriate UNIQUE/NOT NULL/CHECK constraints, and clear statuses.
5. A reservation is for a book title; a loan is for a physical copy. Prevent more than one active loan for the same copy using an appropriate PostgreSQL constraint/index and safe transaction logic.
6. Provide realistic, internally consistent sample data. Never include real credentials.
7. Update README with exact setup commands, ownership/handoff plan, checkpoints, acceptance checklist, and status. Do not claim untested commands work.
8. Check for SQL syntax issues and run the scripts if PostgreSQL is available. Report what was actually tested.

## Architecture and stack
Use Python + Flask, HTML/CSS/vanilla JS, PostgreSQL as the source of truth, and MongoDB for flexible activity-event documents only. Keep a simple modular monolith. Use parameterized SQL and password hashing. Never commit `.env`; add `.env.example` and `.gitignore`. MongoDB should be optional during the initial baseline so the relational library can run without it.

## Features
Student: register/login, search/filter books, view details and availability, reserve/cancel, borrow/return, history, 1–5 star reviews, top-five recommendations with reasons.
Librarian: manage books/authors/categories/publishers/copies, circulation, queues, overdue reports.
Admin: manage roles and view statistics.

## Required module mapping
- Module 1: three-tier architecture, relational model, keys, relational algebra concepts demonstrated through SQL.
- Module 2: DDL/DML, predicates, set operations, NULL, aggregates, GROUP BY/HAVING, nested queries, joins, views, constraints, transactions, authorization, functions/procedures/triggers, parameterized SQL. Be honest about embedded/dynamic SQL.
- Module 3: ER model, constraints, ER-to-relational mapping, FDs, candidate keys, 1NF/2NF/3NF/BCNF reasoning, redundancy/anomalies, dependency preservation where relevant.
- Module 4: indexes, B-tree/B+ tree concepts, composite/multiple-key index, hash-index comparison, actual EXPLAIN ANALYZE evidence; do not build a custom storage engine.
- Module 5: ACID, transaction boundaries, row locking/atomic updates, isolation/concurrency and rollback tests; distinguish PostgreSQL implementation from theoretical concepts.
- Module 6: MongoDB activity documents, document queries, relational-vs-NoSQL comparison, CAP explanation, explainable recommendation scoring.

## Recommendation v1
Use a deterministic score: same category +5, shared author +3, high average rating +2, popularity +2. Exclude books already borrowed where appropriate. Return five recommendations and reasons; use popular/high-rated fallback for new users. Do not call this machine learning.

## Friend's continuation
After foundation is committed, the second student should:
1. Clone repo and recreate DB from README.
2. Implement query pack (20–30 queries), views, functions, procedures, triggers and authorization examples.
3. Implement Flask APIs and frontend.
4. Add targeted indexes and save actual query-plan comparisons.
5. Implement safe reservation/checkout/return transactions and two-session concurrency tests.
6. Add MongoDB activity storage and recommendations.
7. Run end-to-end tests, update screenshots/docs and prepare the presentation.

## Deliverables
Maintain README and create:
`database/schema.sql`, `seed.sql`, `queries.sql`, `views.sql`, `functions.sql`, `procedures.sql`, `triggers.sql`, `indexes.sql`; `backend/app.py`, `db.py`, `config.py`, `requirements.txt`; `frontend/`; `nosql/`; `tests/`; and the docs listed above.

At the end of each work session, state:
- files created/changed,
- commands/tests actually run and their outcomes,
- known issues,
- exact next checkpoint and handoff instructions.

Do not stop at a plan: create the actual files for the current checkpoint, test what the environment permits, and keep README status accurate.
