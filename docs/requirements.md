# System Requirements Specification (SRS)
## Digital Library Book Reservation and Recommendation System

**Course:** Database Management Systems (DBMS)  
**Academic Year:** 2026–2027  
**Module Alignment:** Modules 1–6 (Architecture, SQL, Design/Normalization, Indexing, Transactions, NoSQL)

---

## 1. Project Overview and Business Goals
The **Digital Library Book Reservation and Recommendation System** is designed to modernize campus and community library operations. It bridges physical circulation with digital catalog services, offering patrons an intuitive web interface for searching books, inspecting real-time physical copy availability, placing reservations in a queue, managing loans, writing reviews, and receiving explainable recommendations.

### Core Objectives
1. **Accurate Asset Tracking:** Differentiate between abstract book titles (bibliographical records) and physical copies (barcoded assets on shelves).
2. **Fair Reservation Management:** Maintain an equitable FIFO reservation queue for popular titles, preventing duplicate active reservations by the same patron.
3. **Rigorous Circulation Integrity:** Guarantee through database-level constraints and atomic transactions that a physical copy cannot be checked out simultaneously by multiple patrons.
4. **Transparent Recommendations:** Deliver a deterministic, explainable recommendation engine combining category affinity, author matching, rating statistics, and circulation popularity.
5. **Multi-Model Data Separation:** Use PostgreSQL as the authoritative ACID relational database for circulation and cataloging, with MongoDB for append-only patron interaction telemetry and recommendation signals.

---

## 2. User Roles and Permissions

| Role | Description | Core Capabilities |
|---|---|---|
| **Student / Member** | General library patron (undergraduate, postgraduate, researcher). | - Search & filter books by title, author, ISBN, category.<br>- View copy availability and shelf location.<br>- Place reservations and track queue position.<br>- Cancel active reservations.<br>- View active and past borrowing history.<br>- Submit ratings (1–5) and reviews for read titles.<br>- View explainable personalized book recommendations. |
| **Faculty** | Academic staff with extended loan allowances. | - Identical patron capabilities as Student with priority access rules or extended checkout periods where configured. |
| **Librarian** | Operational staff managing physical assets and circulation desks. | - Create, edit, and catalog books, authors, publishers, and categories.<br>- Register new physical copies, print/assign barcodes, and update copy status (`AVAILABLE`, `MAINTENANCE`, `WITHDRAWN`).<br>- Issue physical loans and process returns.<br>- Manage reservation fulfillment and ready-for-pickup notices.<br>- Generate overdue loan reports and calculate fines. |
| **Administrator** | System manager and DBMS auditor. | - Manage user accounts, role escalations, and active statuses.<br>- Inspect aggregate system statistics (circulation volume, category distributions, active loans).<br>- Audit transaction logs and database health. |

---

## 3. Functional Requirements (FR)

### 3.1 Authentication & Patron Management
- **FR-AUTH-01:** The system shall support secure patron and staff registration with full name, university email, department, and phone number.
- **FR-AUTH-02:** Passwords must be hashed using a cryptographically secure key derivation function (e.g., `bcrypt`) before persistence; plaintext passwords shall never be logged or stored.
- **FR-AUTH-03:** The system must enforce role-based access control (RBAC) across endpoints.

### 3.2 Catalog & Search Engine
- **FR-CAT-01:** Patrons and staff can search books using partial string matching (`LIKE %term%`) on title, author names, category name, or exact ISBN matching.
- **FR-CAT-02:** Detailed book view must display bibliographical metadata, all contributing authors with ordinal credit, publisher, publication year, average star rating, and user reviews.
- **FR-CAT-03:** Detailed view must display an itemized breakdown of physical copies: total copies, currently available copies, copies on loan, and specific shelf location.

### 3.3 Book Reservation Subsystem
- **FR-RES-01:** A reservation is linked to a **book title (`book_id`)**, not a specific copy.
- **FR-RES-02:** A patron can only place a reservation if they do not already have an active (`WAITING` or `READY`) reservation for that title.
- **FR-RES-03:** When all copies are checked out, patrons join a FIFO queue with an assigned `queue_position`.
- **FR-RES-04:** Patrons can cancel active reservations at any time, which automatically updates subsequent queue positions.
- **FR-RES-05:** When a reserved title is returned, the highest-priority reservation transitions to `READY` status with an expiration timestamp (e.g., 48 hours for pickup).

### 3.4 Circulation & Loan Management
- **FR-LOAN-01:** A loan targets a specific **physical copy (`copy_id`)** identified by barcode.
- **FR-LOAN-02:** A loan can only be issued if the targeted copy status is `AVAILABLE`.
- **FR-LOAN-03:** Database constraints must strictly forbid more than one concurrent `ACTIVE` or `OVERDUE` loan for the same copy.
- **FR-LOAN-04:** Loan records track `checkout_at`, `due_at`, `returned_at`, and `fine_amount`.
- **FR-LOAN-05:** Upon check-in (return), the copy status reverts to `AVAILABLE` (or `RESERVED` if a reservation is pending), and any overdue fines are assessed based on `CURRENT_DATE - due_at`.

### 3.5 Rating & Review Subsystem
- **FR-REV-01:** Patrons can rate books on a discrete integer scale of 1 to 5 stars, accompanied by optional textual commentary.
- **FR-REV-02:** A unique constraint (`user_id`, `book_id`) guarantees that a user can submit only one review per book title, allowing updates to existing reviews.

### 3.6 Explainable Recommendation Engine (v1 Baseline)
- **FR-REC-01:** The system shall produce a top-5 list of recommended books for logged-in patrons.
- **FR-REC-02:** The recommendation score must be calculated deterministically:
  - **+5 points** if the candidate book shares a category with books the user has borrowed or highly rated (>= 4 stars).
  - **+3 points** if the candidate book shares an author with books the user has borrowed or highly rated.
  - **+2 points** if the candidate book has an overall average rating >= 4.0.
  - **+2 points** if the candidate book is among the top 20% most borrowed titles in the library.
- **FR-REC-03:** Books already borrowed or actively reserved by the patron must be excluded from recommendations.
- **FR-REC-04:** For cold-start patrons with no borrowing history, the engine falls back to overall highest-rated and most frequently borrowed books.
- **FR-REC-05:** Every recommendation must present a human-readable justification (e.g., *"Recommended because you borrowed books in Database Systems by Abraham Silberschatz"*).

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Data Integrity & Constraints (DBMS Foundation)
- **NFR-INT-01:** Every table must have a surrogate or natural primary key.
- **NFR-INT-02:** Relational integrity must be enforced via foreign keys with explicit cascade actions (`ON DELETE CASCADE`, `RESTRICT`, or `SET NULL`).
- **NFR-INT-03:** Integrity checks (`CHECK` constraints) must restrict ratings (1–5), positive queue positions, positive fine amounts, valid status enumerations, and chronologically valid loan dates (`due_at >= checkout_at`).
- **NFR-INT-04:** Partial unique indexing in PostgreSQL must guarantee zero race-condition over-allocation for physical book copies.

### 4.2 Security & Data Privacy
- **NFR-SEC-01:** All database interactions from backend services must employ parameterized queries (prepared statements) to neutralize SQL injection vulnerabilities.
- **NFR-SEC-02:** Application secrets, database credentials, and session keys must be loaded from environment variables (`.env`), never committed to source repositories.

### 4.3 Performance & Scalability
- **NFR-PERF-01:** Search queries across catalog titles, ISBN, and categories must execute in under 100ms through targeted B-tree indexing.
- **NFR-PERF-02:** Circulation transactions must maintain `READ COMMITTED` or `REPEATABLE READ` isolation to ensure immediate serial consistency without blocking concurrent reads.

### 4.4 Fault Tolerance & Extensibility
- **NFR-FLT-01:** The relational core must operate autonomously. If the MongoDB NoSQL event store is offline or unconfigured, the application shall continue core relational operations gracefully without system disruption.
