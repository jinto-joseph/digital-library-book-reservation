# System Architecture and Technology Design
## Digital Library Book Reservation and Recommendation System

---

## 1. High-Level Architectural Pattern
The application is structured as a **three-tier client-server architecture** implemented as a clean, cohesive modular monolith. This architecture aligns with **DBMS Module 1 (Introduction and Database Architecture)**.

```mermaid
graph TD
    subgraph Presentation Tier (Client Layer)
        UI[Web Browser / Responsive Client]
        DOM[HTML5 Semantic Markup]
        CSS[Vanilla Modern CSS Glassmorphic Design]
        JS[Vanilla JavaScript ES6 Fetch API]
        UI --- DOM
        UI --- CSS
        UI --- JS
    end

    subgraph Application Tier (Flask Backend)
        API[Flask RESTful Routes & Static Endpoints]
        AUTH[Auth & Password Hashing Service]
        CIRC[Circulation & Transaction Engine]
        REC[Explainable Recommendation Engine]
        DB_CONNECTOR[PostgreSQL Connection Pool - psycopg2]
        MONGO_CLIENT[MongoDB PyMongo Client - Non-blocking]

        API --> AUTH
        API --> CIRC
        API --> REC
        CIRC --> DB_CONNECTOR
        REC --> DB_CONNECTOR
        REC -.-> MONGO_CLIENT
    end

    subgraph Data Tier (Polyglot Persistence Layer)
        subgraph Relational Source of Truth
            PG[(PostgreSQL 14+ Relational Engine)]
            PG_CAT[Books, Authors, Publishers, Categories]
            PG_CIRC[Copies, Loans, Reservations, Queue]
            PG_USERS[Users, Roles, Reviews]
            PG --- PG_CAT
            PG --- PG_CIRC
            PG --- PG_USERS
        end

        subgraph Event / Activity Document Store
            MDB[(MongoDB 6.0+ Document Store)]
            DOCS[Activity Events Collection: User Search, View, Click, Session]
            MDB --- DOCS
        end
    end

    JS <==>|HTTP / REST JSON Payloads| API
    DB_CONNECTOR <==>|Parameterized SQL / ACID Transactions| PG
    MONGO_CLIENT <==>|JSON BSON Event Tracking| MDB
```

---

## 2. Tier Breakdown and Responsibilities

### 2.1 Presentation Tier (Frontend)
- **Technology:** Semantic HTML5, modern vanilla CSS (flexbox, grid, glassmorphism, responsive breakpoints), and vanilla JavaScript (ES6+ async/await, DOM manipulation).
- **Design Philosophy:** Clean, distraction-free modern interface with no heavy UI framework dependencies (e.g., no Node/React build steps).
- **Communication:** Client consumes REST API endpoints using JSON payloads via the standard `fetch()` API.
- **Client Responsibilities:**
  - Client-side form input validation.
  - Dynamic catalog filtering, keyword search debouncing, and shelf-availability badges.
  - Interactive reservation queue display and checkout action triggers.
  - Star rating input and recommendation cards with transparent reason tags.

### 2.2 Application Tier (Python / Flask Backend)
- **Technology:** Python 3.10+, Flask microframework, `psycopg2-binary` (or `psycopg` v3) database driver, `bcrypt` for password hashing, and `pymongo` for event logging.
- **Design Structure:**
  ```text
  backend/
  ├── app.py                # Main entrypoint and blueprint registration
  ├── config.py             # Environment configurations (loaded from .env)
  ├── db.py                 # PostgreSQL connection pool and query execution helpers
  ├── routes/
  │   ├── auth_routes.py    # Login, registration, session management
  │   ├── book_routes.py    # Catalog search, details, reviews
  │   ├── loan_routes.py    # Checkout, return, reservation placement & cancel
  │   ├── admin_routes.py   # Librarian catalog management & admin reporting
  │   └── rec_routes.py     # Deterministic recommendation endpoints
  └── services/
      ├── circulation.py    # Multi-statement transactional business logic
      └── recommender.py    # Explainable scoring calculation logic
  ```
- **Security & Principles:**
  - **Parameterized SQL Only:** Strictly eliminates SQL injection vulnerabilities across all dynamic queries.
  - **Transaction Demarcation:** Atomic `BEGIN`, `COMMIT`, and `ROLLBACK` blocks around checkout and reservation queue updates.
  - **Graceful Degradation:** If MongoDB connection fails, activity event logging is caught and bypassed while PostgreSQL transactions continue unaffected.

### 2.3 Data Tier (Persistence Layer)

#### Primary Database: PostgreSQL (Relational Source of Truth)
- **Authoritative Scope:** Catalog metadata, user accounts, physical inventory, reservation queues, active and historical loans, fines, reviews, and transactional state.
- **ACID Guarantees:** Strict atomicity and consistency enforced through primary keys, foreign keys, table-level checks, and partial unique indexes (`uq_single_active_loan_per_copy`, `uq_user_book_active_reservation`).
- **Isolation Level:** `READ COMMITTED` by default with `SELECT FOR UPDATE` pessimistic row-locking on copy allocation during checkouts.

#### Secondary Database: MongoDB (NoSQL Document Store)
- **Scope:** Append-only patron telemetry and clickstream activity events:
  ```json
  {
    "_id": ObjectId("..."),
    "user_id": 4,
    "event_type": "SEARCH",
    "payload": {
      "query": "operating systems",
      "category_filter": 3,
      "results_count": 2
    },
    "ip_address": "127.0.0.1",
    "timestamp": ISODate("2026-10-26T17:30:00Z")
  }
  ```
- **Role in Recommendations:** Captures real-time browsing interest and query patterns to complement historical loan records in PostgreSQL.

---

## 3. Polyglot Persistence Rationale & CAP Theorem Grounding (Module 6)

| Dimension | PostgreSQL (Relational) | MongoDB (Document NoSQL) |
|---|---|---|
| **Primary Role** | Transactional core, consistency, asset locking | Telemetry, interaction history, audit trail |
| **Schema Paradigm** | Rigid, normalized (3NF), relational schema | Flexible, schema-less BSON documents |
| **Integrity Checks** | Foreign keys, `CHECK`, `UNIQUE`, NOT NULL | Application-level validation |
| **CAP Classification** | **CP** (Consistency & Partition Tolerance within transaction scope) | **CP** (Single-primary replica set) or **AP** depending on write concern (`w=1` vs `w=majority`) |

### Correct CAP Explanation:
The CAP theorem applies strictly to **distributed systems experiencing network partitions ($P$)**. A standalone, single-node database running locally cannot demonstrate CAP tradeoffs in practice. 
- In this architecture, PostgreSQL is chosen where **Consistency ($C$)** is non-negotiable: a physical book copy cannot exist simultaneously in two hands. If a network partition isolates a replica node, the system must reject conflicting checkout writes rather than permit double booking.
- MongoDB is designated for patron telemetry where eventual consistency and write throughput are preferred; dropping or delaying an activity event log during network friction never compromises physical inventory accuracy.

---

## 4. Security Architecture

1. **Defense in Depth:** Validation occurs at the presentation layer (HTML forms), application layer (Flask request parsing), and database engine layer (CHECK constraints, domain constraints, foreign keys).
2. **Credential Management:** Secrets (`SECRET_KEY`, database passwords) reside in `.env` files loaded dynamically via `python-dotenv`. A version-controlled `.env.example` provides structure without exposing sensitive keys.
3. **Password Security:** Passwords are never stored in plaintext or reversible encryption; salted `bcrypt` hashes are used exclusively.
