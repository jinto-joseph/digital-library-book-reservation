# Digital Library Book Reservation and Recommendation System

**Course:** Database Management Systems (DBMS)  
**Scope:** Modules 1–6  
**Team size:** 2 students  
**GitHub:** https://github.com/jinto-joseph/digital-library-book-reservation.git  
**Branch:** `jinto`

---

## 1. Project Overview

A web application for discovering books, checking physical-copy availability, reserving titles, borrowing and returning books, submitting reviews, and receiving explainable personalized recommendations. Librarians manage catalog and circulation; administrators manage roles and reports.

This is a **DBMS-first project**: the ER model, relational schema, normalization, SQL, indexes, ACID transactions, concurrency control, and NoSQL component are all demonstrated with real artifacts.

---

## 2. Team Ownership

| Member | Responsibility | Status |
|---|---|---|
| **Member A — Jinto Joseph** | Architecture, ER model, relational schema, normalization, PostgreSQL schema + seed data, full SQL feature pack (views, functions, procedures, triggers, indexes, transactions), backend foundation, frontend UI with 69-book multi-genre catalog, documentation | ✅ **COMPLETED** |
| **Member B — Project Partner** | Flask REST API routes, MongoDB activity logging, recommendations integration, end-to-end testing, final demo prep | 🔲 **Next up** |

**Handoff rule:** Member A has pushed a stable baseline. Member B clones, runs the schema/seed, and continues from Checkpoint 2. Agree before changing the shared schema; update docs whenever it changes.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Python 3 + Flask |
| Relational DB | PostgreSQL (via pgAdmin or `psql`) |
| NoSQL | MongoDB (activity events + recommendation signals) |
| Version Control | Git + GitHub |

No React, no ML frameworks, no paid cloud services.

---

## 4. Features

### Student / Member
1. Register and log in securely (hashed passwords).
2. Search, filter, and sort by title, author, ISBN, category.
3. View book details, reviews, and physical-copy availability.
4. Reserve a title, cancel a reservation, view queue position.
5. Borrow/checkout and return physical copies via circulation rules.
6. View borrowing and reservation history.
7. Rate and review books (1–5 stars).
8. Receive five personalized book recommendations with reasons.

### Librarian
- Add/edit books, authors, categories, publishers, physical copies.
- Manage checkout/return and reservation queues.
- View overdue loans, availability, and circulation reports.

### Administrator
- Manage user roles and view system statistics.

---

## 5. Architecture

```
Browser (HTML / CSS / JavaScript)
              |
              v
        Flask Backend (app.py)
         /             \
        v               v
  PostgreSQL           MongoDB
  (authoritative)      (activity events /
  users, books,         recommendation signals)
  loans, reservations
```

PostgreSQL is the source of truth. MongoDB stores flexible activity events (search, view, recommendation click) used as recommendation signals. The library must still function if MongoDB is unavailable.

---

## 6. Relational Schema (10 tables)

| Table | Purpose |
|---|---|
| `users` | Registered students, librarians, admins |
| `publishers` | Book publisher records |
| `categories` | Genre/subject categories (15 genres seeded) |
| `authors` | Author records |
| `books` | Book catalogue linked to category + publisher |
| `book_authors` | M:N bridge — books ↔ authors |
| `book_copies` | Physical copies with barcode, shelf, status |
| `reservations` | Title-level queue with position tracking |
| `loans` | Copy-level checkout/return records |
| `reviews` | User ratings and text reviews |

**Key constraints:** partial unique indexes prevent double checkouts and duplicate active reservations, `CHECK (rating BETWEEN 1 AND 5)`, email and barcode uniqueness enforced.

---

## 7. What Member A Has Built ✅

### 7.1 Documentation (`docs/`)
- `requirements.md` — full feature specification
- `architecture.md` — three-tier system design
- `er-model.md` — ER diagram with cardinality and participation
- `relational-schema.md` — formal relational schema notation
- `normalization.md` — 1NF → 2NF → 3NF → BCNF proofs with FDs for all 10 tables
- `module-mapping.md` — explicit mapping of every feature to DBMS Modules 1–6
- `demo-script.md` — step-by-step viva demonstration script

### 7.2 Database Layer (`database/`)

| File | Contents |
|---|---|
| `schema.sql` | 10 tables with all constraints, PK/FK, partial unique indexes |
| `seed.sql` | Core sample data (users, books, copies, loans, reservations, reviews) |
| `seed_extended.sql` | **69 books across 15 genres** parsed from `Books_data - Sheet1.csv` |
| `queries.sql` | **22 SQL queries** — joins, aggregates, GROUP BY/HAVING, nested & correlated subqueries, UNION/INTERSECT/EXCEPT, window functions, NULL/COALESCE, recommendation scoring |
| `views.sql` | 6 views: available copies, overdue loans, reservation queue, book stats, user history, category popularity |
| `functions.sql` | SQL functions for availability check and overdue detection |
| `procedures.sql` | `sp_checkout_book` (pessimistic row locking) and `sp_return_book` |
| `triggers.sql` | Auto-cancel expired reservations, update copy status on return |
| `indexes.sql` | B-Tree, composite, partial, and hash indexes with EXPLAIN ANALYZE examples |

### 7.3 Transaction & Concurrency Tests (`tests/`)
- `transaction_tests.sql` — ACID demonstrations, explicit rollbacks, two-session concurrent checkout race condition (only one session wins)

### 7.4 Backend Foundation (`backend/`)
- `app.py` — Flask app, static folder routing, health check route
- `db.py` — PostgreSQL connection pool (psycopg2)
- `config.py` — environment-based configuration
- `requirements.txt` — Flask, psycopg2-binary, pymongo, python-dotenv

### 7.5 Frontend UI (`frontend/`)
- `index.html` — responsive glassmorphic library portal with:
  - 15-genre category filter dropdown
  - Book catalog grid with cover cards
  - Real-time shelf-copy availability modal with barcode display
  - Reservation and circulation action buttons
  - User / Librarian / Admin role switcher
  - Borrowing history and reservation queue tabs
- `css/style.css` — dark glassmorphism theme, smooth animations, responsive layout
- `js/app.js` — **69 books embedded** (works without a server), dynamic filtering, modal logic, recommendation panel
- `js/catalog_data.json` — full catalog export for API use

### 7.6 Multi-Genre Catalog (15 categories, 69 books)

Fiction, Thriller, Biography, History, Economics, Philosophy, Science, Self-Help, Arts, Literary Fiction, Social Commentary, Dystopian Fiction, Romance, Children's, Health/Wellness.

---

## 8. What Member B Needs to Build 🔲

### 8.1 Flask REST API Routes (`backend/routes/`)
- `POST /api/auth/register` and `POST /api/auth/login` (JWT or session)
- `GET /api/books` (search, filter, paginate)
- `GET /api/books/<id>` (details + copies + reviews)
- `POST /api/reservations` / `DELETE /api/reservations/<id>`
- `POST /api/loans/checkout` / `POST /api/loans/return`
- `GET /api/users/<id>/history`
- `POST /api/reviews`
- `GET /api/recommendations/<user_id>`
- Librarian routes: add/edit books, copies, manage loans

### 8.2 MongoDB Integration (`nosql/`)
- Connect Flask to MongoDB using pymongo
- Log activity events (book viewed, searched, reserved, borrowed)
- Document schema example:
```json
{
  "user_id": 3,
  "event_type": "view",
  "book_id": 12,
  "category": "Fiction",
  "timestamp": "2025-11-01T10:23:00Z"
}
```
- Sample aggregation queries: most-viewed books, user activity timeline

### 8.3 Recommendation Engine Integration
- Use the hybrid scoring already in `queries.sql` (same category +5, shared author +3, high rating +2, popularity +2)
- Pull activity signals from MongoDB + catalog data from PostgreSQL
- Surface top-5 results in the frontend with reason strings

### 8.4 Frontend API Wiring
- Replace embedded mock data in `app.js` with real `fetch()` calls to Flask endpoints
- Implement login/register forms with JWT token handling
- Wire up reservation, checkout, return, and review submission

### 8.5 Testing
- `tests/indexing_tests.sql` — EXPLAIN ANALYZE before/after index creation
- Integration test: register → search → reserve → checkout → return → review
- Concurrency test: two concurrent checkouts of same copy → only one succeeds

### 8.6 Final Demo Preparation
- Screenshots of every major UI screen (`screenshots/`)
- Update `docs/demo-script.md` with actual tested commands and outputs
- Prepare presentation slides mapping all features to Modules 1–6

---

## 9. Recommendation Algorithm

Deterministic hybrid scoring (no ML required):

| Signal | Points |
|---|---|
| Same preferred category as borrowing history | +5 |
| Shared author with previously borrowed book | +3 |
| Average rating ≥ 4.0 | +2 |
| High borrow count (popular title) | +2 |

- Excludes books already borrowed by the user
- For new users: shows highest-rated / most-borrowed titles
- Returns top 5 with explanation: *"Recommended because you borrowed books in Fiction."*

---

## 10. Repository Structure

```
digital-library-system/
├── README.md
├── .gitignore
├── .env.example
├── docs/
│   ├── requirements.md          ✅
│   ├── architecture.md          ✅
│   ├── er-model.md              ✅
│   ├── relational-schema.md     ✅
│   ├── normalization.md         ✅
│   ├── module-mapping.md        ✅
│   └── demo-script.md           ✅
├── database/
│   ├── schema.sql               ✅ 10 tables, all constraints
│   ├── seed.sql                 ✅ Core sample data
│   ├── seed_extended.sql        ✅ 69 books / 15 genres
│   ├── queries.sql              ✅ 22 SQL queries
│   ├── views.sql                ✅ 6 views
│   ├── functions.sql            ✅ Availability & overdue functions
│   ├── procedures.sql           ✅ Checkout & return procedures
│   ├── triggers.sql             ✅ Automation triggers
│   └── indexes.sql              ✅ B-Tree, composite, partial, hash
├── backend/
│   ├── app.py                   ✅ Flask app + static routing
│   ├── config.py                ✅ Env-based config
│   ├── db.py                    ✅ Connection pool
│   ├── requirements.txt         ✅
│   ├── routes/                  🔲 Member B — API endpoints
│   └── services/                🔲 Member B — Business logic
├── frontend/
│   ├── index.html               ✅ Full UI with 15 genre filters
│   ├── css/style.css            ✅ Glassmorphic dark theme
│   └── js/
│       ├── app.js               ✅ 69 books, dynamic catalog, modals
│       └── catalog_data.json    ✅ Full catalog export
├── nosql/                       🔲 Member B — MongoDB schemas & queries
├── tests/
│   ├── transaction_tests.sql    ✅ ACID + concurrency tests
│   └── indexing_tests.sql       🔲 Member B — EXPLAIN ANALYZE outputs
└── screenshots/                 🔲 Member B — final demo screenshots
```

---

## 11. Setup Instructions

**Prerequisites:** Python 3.9+, PostgreSQL 14+, MongoDB (optional but recommended)

```bash
# 1. Clone
git clone https://github.com/jinto-joseph/digital-library-book-reservation.git
cd digital-library-system

# 2. Python virtual environment
python -m venv .venv
source .venv/bin/activate          # Linux / Mac
# .venv\Scripts\Activate.ps1       # Windows PowerShell

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Database setup
createdb digital_library
psql -d digital_library -f database/schema.sql
psql -d digital_library -f database/seed.sql
psql -d digital_library -f database/seed_extended.sql   # 69 books

# 5. Environment config
cp .env.example .env
# Edit .env — fill in DB credentials, secret key, MongoDB URI. Never commit .env.

# 6. Run backend (after Member B completes routes)
python backend/app.py

# 7. Open frontend standalone (no server required)
open frontend/index.html
```

---

## 12. DBMS Module Mapping

| Module | Evidence in this project |
|---|---|
| **1 — Intro & Architecture** | Three-tier system, relational model, keys, relational algebra via SQL |
| **2 — SQL** | 22 queries covering DDL/DML, aggregates, GROUP BY/HAVING, UNION/INTERSECT/EXCEPT, nested & correlated subqueries, NULL/COALESCE, views, procedures, triggers, transactions |
| **3 — Database Design** | ER diagram with cardinality/participation, M:N resolution via `book_authors`, FDs, 1NF→2NF→3NF→BCNF proofs for all 10 tables |
| **4 — Indexing** | B-Tree on title/author/ISBN, composite index on (category_id, publication_year), partial index on active loans/reservations, hash index for equality lookup; EXPLAIN ANALYZE before/after |
| **5 — Transactions** | ACID demo, explicit rollbacks, row-level locking in `sp_checkout_book`, two-session concurrent checkout race condition test |
| **6 — NoSQL** | MongoDB activity documents, sample aggregations, CAP theorem explanation, relational vs. document model comparison |

---

## 13. Acceptance Checklist

### Member A — Completed ✅
- [x] Repository created and remote configured
- [x] ER diagram and relational schema match `schema.sql`
- [x] FDs, candidate keys, normalization 1NF → BCNF documented
- [x] PK / FK / UNIQUE / CHECK / NOT NULL constraints verified
- [x] `schema.sql` and `seed.sql` created and validated
- [x] `seed_extended.sql` — 69 books across 15 genres
- [x] 22 SQL queries in `queries.sql` (all required types covered)
- [x] Views, functions, procedures, triggers in `database/*.sql`
- [x] Indexes (B-Tree, composite, partial, hash) in `indexes.sql`
- [x] Transaction and concurrency tests in `transaction_tests.sql`
- [x] Backend app, config, and connection pool initialized
- [x] Responsive glassmorphic frontend UI with 15-genre catalog
- [x] All docs: requirements, architecture, ER, schema, normalization, module mapping, demo script
- [x] No credentials or `.env` committed (`.gitignore` + `.env.example` verified)

### Member B — Remaining 🔲
- [ ] Flask REST API routes: auth, books, reservations, loans, reviews, recommendations
- [ ] MongoDB activity logging integration (`nosql/`)
- [ ] Recommendation engine wired to PostgreSQL + MongoDB signals
- [ ] Frontend API wiring (replace embedded mock data with real `fetch()` calls)
- [ ] `tests/indexing_tests.sql` — EXPLAIN ANALYZE before/after evidence
- [ ] End-to-end test: register → search → reserve → checkout → return → review
- [ ] Screenshots of all major screens (`screenshots/`)
- [ ] Final presentation slides and demo run-through

---

## 14. Demo Sequence

1. Student registers and logs in.
2. Browse catalog — filter by genre, search by title/author.
3. View book details: author, category, physical copy availability and barcode.
4. Reserve a title — see queue position.
5. Concurrent checkout attempt — only one session succeeds.
6. Return a copy — verify status updates.
7. Submit a review and view personalized recommendations with explanations.
8. Librarian adds a new book and physical copy.
9. Run joins, aggregates, nested/set/NULL queries; demo a view, procedure, and trigger live.
10. Show EXPLAIN ANALYZE output before and after an index.
11. Show a MongoDB activity document and explain CAP theorem accurately.
12. Final slide mapping every feature to Modules 1–6.

---

**Last updated:** 2026-10-27  
**Member A:** Jinto Joseph — Architecture, SQL Engine Pack, Frontend UI ✅  
**Member B:** Project Partner — Flask API, MongoDB, Integration 🔲  
**Branch:** `jinto`
