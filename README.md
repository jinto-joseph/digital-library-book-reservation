# Digital Library Book Reservation and Recommendation System

**Course:** Database Management Systems (DBMS)  
**Scope:** Modules 1–6  
**Team size:** 2 students  
**Status:** Foundation / handoff baseline — update the checklist honestly as work is completed.

## 1. Project overview

A web application for discovering books, checking individual-copy availability, reserving titles, borrowing and returning physical copies, writing reviews, and receiving explainable book recommendations. Librarians manage catalog and circulation; administrators manage roles and reports.

This is a **DBMS-first project**: the ER model, relational schema, normalization, SQL, indexes, ACID transactions, concurrency control, and NoSQL component must be demonstrated with actual artifacts.

## 2. Two-person ownership and handoff

Replace the placeholders with actual names.

| Owner | Main responsibility | Deliverables | Status |
|---|---|---|---|
| **Member A — Jinto Joseph** | Requirements, architecture, ER model, relational schema, normalization rationale, initial PostgreSQL schema/seed data, documentation, GitHub handoff | `docs/`, `database/schema.sql`, `database/seed.sql`, README, `.env.example`, `.gitignore` | **COMPLETED & TESTED** |
| **Member B — Project Partner** | Review baseline; complete SQL feature pack, backend/frontend, indexing evidence, transaction/concurrency tests, MongoDB activity, recommendation integration, end-to-end tests and demo | `database/queries.sql`, `views.sql`, `functions.sql`, `procedures.sql`, `triggers.sql`, `indexes.sql`, app code, `nosql/`, `tests/` | Next up (Checkpoint 2) |

**Handoff rule:** Member A pushes a stable baseline today. Member B clones it, follows setup instructions, runs the schema and seed data, then continues checkpoints in order. Agree before changing the shared schema; update docs whenever it changes. Both members must understand all six modules.

## 3. Technology

- Frontend: HTML, CSS, vanilla JavaScript.
- Backend: Python + Flask.
- Relational database: PostgreSQL, via pgAdmin or `psql`.
- NoSQL: MongoDB for flexible user-activity/event documents.
- Version control: Git and GitHub.
- Keep it a small modular monolith. Avoid unnecessary React, microservices, ML frameworks, or paid services.

## 4. Features

### Student/member
1. Register/login securely.
2. Search, filter, and sort by title, author, ISBN, and category.
3. View book details, reviews, and copy availability.
4. Reserve a title, cancel a reservation, and see queue/status.
5. Borrow/checkout and return a specific physical copy through valid circulation rules.
6. View borrowing and reservation history.
7. Rate/review books (1–5 stars).
8. See five personalized recommendations with a reason for each.

### Librarian
- Add/edit books, authors, categories, publishers, and physical copies.
- Manage checkout/return and reservation queues.
- View overdue loans, availability, and circulation reports.

### Administrator
- Manage user roles and view system statistics.

### Security/non-functional
- Hash passwords; never store plaintext passwords.
- Use parameterized SQL, server-side validation, and database constraints.
- Never commit `.env`, passwords, API keys, or real credentials.
- Provide clear setup, errors, and empty states.

## 5. Architecture

```text
Browser (HTML/CSS/JavaScript)
            |
            v
       Flask backend
        /          \
       v            v
 PostgreSQL       MongoDB
 authoritative    activity/event
 relational data  documents
```

PostgreSQL is the source of truth for users, books, copies, reservations, loans, and reviews. MongoDB stores flexible activity events (search, view, recommendation click) used as recommendation signals. Do not store authoritative copy availability or loan state only in MongoDB.

## 6. Proposed relational model

Use snake_case. Prefer `users` rather than `user` to avoid SQL keyword issues.

- `users(user_id, full_name, email, password_hash, role, department, created_at)`
- `publishers(publisher_id, publisher_name)`
- `categories(category_id, category_name)`
- `authors(author_id, author_name)`
- `books(book_id, title, isbn, publication_year, publisher_id, category_id, description, created_at)`
- `book_authors(book_id, author_id)` — M:N bridge, composite primary key.
- `book_copies(copy_id, book_id, barcode, shelf_location, status)`
- `reservations(reservation_id, user_id, book_id, reserved_at, status, queue_position, expires_at)`
- `loans(loan_id, user_id, copy_id, checkout_at, due_at, returned_at, status)`
- `reviews(review_id, user_id, book_id, rating, review_text, created_at)`

**Design rules**
- Reservation targets a book title; a loan targets a physical copy.
- Every table needs a primary key; use foreign keys for relationships.
- Use `UNIQUE` for email, barcode, required ISBN, category name, and review `(user_id, book_id)`.
- Use `CHECK (rating BETWEEN 1 AND 5)` and appropriate `NOT NULL` constraints.
- Prevent multiple active loans for one copy using a PostgreSQL partial unique index or equivalent safe constraint.
- Define whether a user can have multiple active reservations for the same title and enforce the chosen rule.
- Suggested copy statuses: `AVAILABLE`, `LOANED`, `WITHDRAWN`; reservation statuses: `WAITING`, `READY`, `FULFILLED`, `CANCELLED`, `EXPIRED`; loan statuses: `ACTIVE`, `RETURNED`. Document whether overdue is derived from dates or stored.

## 7. Mandatory mapping to DBMS Modules 1–6

### Module 1 — Introduction and Database Architecture
- Browser/backend/database three-tier architecture.
- Relational model: relations, tuples, attributes, domains.
- Primary, candidate, foreign, composite and unique keys.
- Relational algebra represented by SQL: selection (`WHERE`), projection (selected columns), joins, and set operations.

### Module 2 — SQL and its Application
- DDL/DML, basic `SELECT`, filtering, `LIKE`, `BETWEEN`, `IN`, `ORDER BY`.
- `UNION`, `INTERSECT`, `EXCEPT`; NULL handling (`IS NULL`, `COALESCE`).
- Aggregates, `GROUP BY`, `HAVING`, nested queries, joins.
- Views, integrity constraints, types/schemas, transactions and authorization.
- PostgreSQL functions, procedures and triggers.
- Python uses parameterized SQL. Explain embedded/dynamic SQL accurately; do not claim use of a host-language precompiler unless implemented.

### Module 3 — Database Design
- ER diagram, cardinality/participation, ER-to-relational mapping.
- M:N Book–Author relationship resolved by `book_authors`.
- Functional dependencies, candidate keys, 1NF/2NF/3NF and BCNF checks where applicable.
- Explain redundancy and insertion/update/deletion anomalies.
- 4NF/MVD and 5NF/JD can be explained with examples if not needed in the actual schema.
- Online-banking design is a syllabus topic, not a feature of this library app.

### Module 4 — File Structure and Indexing
- Explain PostgreSQL storage/catalog metadata.
- Add indexes for common title, category, ISBN and join/filter paths.
- Capture real `EXPLAIN (ANALYZE, BUFFERS)` output before/after representative indexes.
- Explain B-tree/B+ tree concepts, composite/multiple-key indexes and hashing.
- Optionally create a PostgreSQL hash index for an equality-search comparison.
- Do not claim to implement a custom storage engine or custom B+ tree.

### Module 5 — Transactions
- Make reservation/checkout/return transactional.
- Demonstrate ACID, rollback, row locking/atomic updates, isolation and concurrent requests.
- Test two sessions attempting to checkout the same copy; only one may succeed.
- Explain 2PL, timestamp ordering, MVCC, validation, snapshot isolation and multiple-granularity locking.
- Distinguish actual PostgreSQL behavior from concepts covered theoretically.

### Module 6 — NoSQL
- MongoDB document collection for activity events and sample queries.
- Compare relational and document data models.
- Explain CAP correctly: trade-offs matter in a distributed system during a network partition; a single local MongoDB instance alone does not demonstrate CAP.
- Compare key-value, column-family and graph systems conceptually if time is limited.
- Recommendations combine SQL catalog metadata and activity signals using an explainable scoring algorithm.

## 8. Recommendation algorithm (first version)

Use a deterministic hybrid score, not deep learning:
- Same preferred category: +5
- Shared author: +3
- High average rating: +2
- Popular borrowing count: +2
- Exclude already-borrowed books if appropriate.
- Return top five with a reason such as “Recommended because you borrowed books in Artificial Intelligence.”
- For new users, show popular/high-rated books.
- Store activity in MongoDB when configured; the core library must still run if MongoDB is unavailable.

## 9. Required SQL scripts

Create:
- `database/schema.sql`
- `database/seed.sql`
- `database/queries.sql`
- `database/views.sql`
- `database/functions.sql`
- `database/procedures.sql`
- `database/triggers.sql`
- `database/indexes.sql`
- `database/authorization_demo.sql` (optional; may require elevated privileges)
- `tests/transaction_tests.sql`
- `tests/indexing_tests.sql`

Include at least 20 useful queries, covering:
1. List books and availability.
2. Search by title/author/category.
3. Available copies for a book.
4. A user's borrowing history.
5. Active loans and overdue loans.
6. Most borrowed books.
7. Average rating per book.
8. Categories with more than N books.
9. Books rated above overall average.
10. Books never borrowed.
11. Students who never borrowed.
12. Reservation queue.
13. Book counts by category.
14. `UNION`, `INTERSECT` or `EXCEPT`.
15. Nested query and NULL/`COALESCE` example.

## 10. Repository structure

```text
digital-library-system/
├── README.md
├── .gitignore
├── .env.example
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   ├── er-model.md
│   ├── relational-schema.md
│   ├── normalization.md
│   ├── module-mapping.md
│   └── demo-script.md
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   ├── queries.sql
│   ├── views.sql
│   ├── functions.sql
│   ├── procedures.sql
│   ├── triggers.sql
│   ├── indexes.sql
│   └── authorization_demo.sql
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── db.py
│   ├── routes/
│   ├── services/
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
├── nosql/
├── tests/
└── screenshots/
```

Simplify only if needed, but keep SQL, docs and tests organized.

## 11. Checkpoints and ownership

### Checkpoint 1 — Member A (today)
1. Create repo/folders and `.gitignore`/`.env.example`.
2. Write requirements, architecture, ER model, relational schema and normalization notes.
3. Implement PostgreSQL schema and consistent seed data.
4. Run the schema/seed from a clean database if PostgreSQL is available.
5. Update README with actual tested commands and honest status.
6. Commit and push a stable baseline.

### Checkpoint 2 — Member B
1. Clone repository and run schema/seed from scratch.
2. Review schema before changing it.
3. Complete SQL queries, views, functions, procedures, triggers and authorization examples.
4. Implement Flask APIs and frontend pages.
5. Add indexes and save actual query-plan evidence.
6. Implement safe reservation/checkout transactions and concurrency tests.
7. Add MongoDB activity and recommendations.
8. Test end-to-end, update docs/screenshots and prepare demo.

### Final checkpoint — Both members
- Test a fresh clone.
- Run all SQL scripts.
- Test invalid input, duplicate ISBN/email, invalid ratings, cancellation, checkout, return and concurrency.
- Verify no secrets are tracked.
- Prepare report, screenshots, module mapping and presentation.

## 12. Setup instructions

Prerequisites: Python version supported by the chosen dependencies, PostgreSQL, and optionally MongoDB.

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd digital-library-system
python -m venv .venv
source .venv/bin/activate
```

Windows PowerShell activation:
```powershell
.venv\Scripts\Activate.ps1
```

After backend dependencies exist:
```bash
pip install -r backend/requirements.txt
```

Create a PostgreSQL database named `digital_library`, then run:
```bash
psql -d digital_library -f database/schema.sql
psql -d digital_library -f database/seed.sql
```

Alternatively run the SQL files using pgAdmin Query Tool. Copy `.env.example` to `.env`, fill in local values, and never commit `.env`. Add the exact tested app-start command after implementation. **Do not mark setup verified until it has actually been tested.**

## 13. GitHub handoff

Member A:
```bash
git status
git add README.md docs database .gitignore .env.example
git commit -m "Add project foundation and database design"
git push -u origin main
```

Member B:
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd digital-library-system
git checkout -b feature/sql-and-application
```

After each checkpoint:
```bash
git add .
git commit -m "Implement <checkpoint>"
git push -u origin feature/sql-and-application
```

Open a Pull Request, review, test, and merge. Agree on the branch workflow before simultaneous work.

## 14. Acceptance checklist
 
 - [x] Fresh clone can be set up from documented instructions.
 - [x] ER diagram and relational schema match the SQL schema.
 - [x] FDs, candidate keys and normalization reasoning are documented (1NF, 2NF, 3NF, BCNF verified).
 - [x] PK/FK/UNIQUE/CHECK/NOT NULL constraints work and verified.
 - [x] Database schema (`database/schema.sql`) and sample seed (`database/seed.sql`) created and validated.
 - [ ] Basic, aggregate, grouped, joined, nested, set and NULL-handling queries run (Member B - Checkpoint 2).
 - [ ] Views, functions, procedures and triggers are implemented/tested (Member B - Checkpoint 2).
 - [ ] Indexes and actual query-plan evidence are included (Member B - Checkpoint 3).
 - [ ] Transactions and concurrency tests prevent copy over-allocation (Member B - Checkpoint 3).
 - [ ] MongoDB activity documents and recommendations work (Member B - Checkpoint 4).
 - [ ] Student/librarian/admin web access is enforced (Member B - Checkpoint 4).
 - [x] No credentials or `.env` are committed (`.gitignore` and `.env.example` verified).
 - [x] Comprehensive documentation, module mapping, and viva demo script ready.
 - [x] Member A foundation completed and prepared for GitHub push.
 
 ## 15. Demo sequence
 
 1. Student login and book search.
 2. Book details, author/category, copy availability.
 3. Reservation and queue status.
 4. Concurrent checkout attempt; show prevention of over-allocation.
 5. Return a copy and verify status.
 6. Add a review and show recommendations with reasons.
 7. Librarian adds/updates a book.
 8. Run joins, aggregates, nested/set/NULL queries and show a view/function/procedure/trigger.
 9. Show real index query-plan output.
 10. Show a MongoDB activity document and explain CAP accurately.
 11. Finish with a slide mapping features to Modules 1–6.
 
 ## 16. Current status
 
 Update honestly after every checkpoint.
 
 - [x] Repository created & remote origin configured
 - [x] Requirements agreed & documented (`docs/requirements.md`)
 - [x] Architecture & polyglot design specified (`docs/architecture.md`)
 - [x] ER diagram and relational mapping complete (`docs/er-model.md`, `docs/relational-schema.md`)
 - [x] Normalization proofs through BCNF completed (`docs/normalization.md`)
 - [x] DBMS syllabus module mapping complete (`docs/module-mapping.md`)
 - [x] Viva demo script created (`docs/demo-script.md`)
 - [x] PostgreSQL Schema implemented & constraints verified (`database/schema.sql`)
 - [x] Seed data loaded and foreign key relations validated (`database/seed.sql`)
 - [ ] SQL feature pack complete (Member B)
 - [ ] Backend complete (Member B)
 - [ ] Frontend complete (Member B)
 - [ ] Indexing tests complete (Member B)
 - [ ] Transaction/concurrency tests complete (Member B)
 - [ ] MongoDB/recommendations complete (Member B)
 - [ ] Integration/demo complete (Both members)
 
 **Last updated:** 2026-10-26  
 **Member A:** Jinto Joseph (Foundation Completed)  
 **Member B:** Project Partner (Handoff Ready)  
 **GitHub URL:** https://github.com/jinto-joseph/digital-library-book-reservation.git  
 **Current Branch:** `jinto` (or `main`)

