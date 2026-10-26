# Comprehensive Demonstration and Evaluation Script
## Digital Library Book Reservation and Recommendation System

**Course:** Database Management Systems (DBMS)  
**Target Audience:** Academic Evaluator / Viva Examiner  
**Estimated Run Time:** 15–20 minutes

---

## 1. Demo Objectives
This script guides the team through a step-by-step viva presentation demonstrating that the project is not just a cosmetic web page, but a deeply engineered database management project fulfilling every module of the DBMS curriculum.

---

## 2. Step-by-Step Viva Walkthrough

### Part 1: Architecture & Conceptual Design (Modules 1 & 3)
1. **Three-Tier Architecture Presentation:**
   - Display [`docs/architecture.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/architecture.md).
   - Explain tier boundaries: Vanilla HTML/CSS/JS client $\leftrightarrow$ Flask application layer $\leftrightarrow$ PostgreSQL relational engine + MongoDB activity store.
   - Point out that PostgreSQL is the authoritative source of truth.
2. **ER Modeling & Distinction between Title and Physical Copy:**
   - Display [`docs/er-model.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/er-model.md).
   - Highlight the design decision:
     - `books`: Represents the conceptual bibliographical title (`title`, `isbn`, `publication_year`).
     - `book_copies`: Represents physical barcoded items (`barcode`, `shelf_location`, `status`).
     - `reservations`: Targets a book title (patrons reserve a title, joining a FIFO queue).
     - `loans`: Targets a physical copy (patrons check out an individual copy).
3. **Normalization Rigor (1NF to BCNF):**
   - Open [`docs/normalization.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/normalization.md).
   - Walk through the candidate keys, functional dependencies, and show why every table satisfies 3NF and BCNF without update anomalies.

---

### Part 2: Relational Schema & Integrity Constraints (Modules 1 & 2)
1. **Schema DDL Walkthrough:**
   - Open [`database/schema.sql`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/database/schema.sql).
   - Show explicit constraints:
     - Primary Keys and Foreign Keys with explicit `ON DELETE CASCADE` or `RESTRICT`.
     - Unique constraints: `users.email`, `books.isbn`, `book_copies.barcode`, `reviews(user_id, book_id)`.
     - Check constraints: `rating BETWEEN 1 AND 5`, `due_at >= checkout_at`, status enumerations.
2. **PostgreSQL Partial Unique Indexes (Crucial Integrity Demo):**
   - Highlight `uq_single_active_loan_per_copy`:
     ```sql
     CREATE UNIQUE INDEX uq_single_active_loan_per_copy 
         ON loans (copy_id) 
         WHERE status IN ('ACTIVE', 'OVERDUE');
     ```
   - Explain to the examiner that this enforces at the database storage engine level that a physical copy can never be concurrently checked out by two patrons.
   - Highlight `uq_user_book_active_reservation` preventing duplicate active queue entries.

---

### Part 3: SQL Capabilities & Advanced Queries (Module 2)
1. **Aggregations & Joins:**
   - Execute queries calculating average ratings per book, joining `books`, `book_authors`, `authors`, and `reviews`.
   - Run query finding books with multiple copies currently available on shelves.
2. **Subqueries & Set Operations:**
   - Execute nested query: Finding books with average rating higher than the overall library average.
   - Execute `EXCEPT` or `NOT IN`: Identifying registered students who have never borrowed a book.
3. **Views, Functions & Triggers:**
   - Query `v_book_catalog` to show how complex joins are encapsulated.
   - Call stored function/procedure for checkout and demonstrate the trigger that updates copy status automatically.

---

### Part 4: File Structure, Indexing & Query Plans (Module 4)
1. **B-Tree Indexing Demonstration:**
   - Execute `EXPLAIN (ANALYZE, BUFFERS)` on an unindexed title search versus the indexed title search.
   - Show the transition from `Seq Scan` (sequential scan) to `Bitmap Index Scan` / `Index Scan`.
2. **B-Tree vs Hash Index Discussion:**
   - Explain why B-trees are the default in PostgreSQL (supporting inequality, range scans, prefix matching `LIKE 'Data%'`, and sorting).
   - Explain hash index characteristics ( $O(1)$ equality checks only, no range query support).

---

### Part 5: Transactions & Concurrency Control (Module 5)
1. **ACID Demonstration:**
   - Execute a checkout transaction that encounters an intentional error (e.g., nonexistent barcode or past-due block).
   - Demonstrate that the entire transaction rolls back cleanly, leaving copy status unchanged (Atomicity).
2. **Two-Session Concurrent Checkout Test:**
   - Open two parallel terminal sessions (`Session A` and `Session B`).
   - Both attempt to checkout the same copy simultaneously:
     - `Session A` issues `SELECT ... FOR UPDATE` and checks out the copy.
     - `Session B` is blocked or rejected immediately by the partial unique index.
     - Explain how PostgreSQL implements row-level locking and MVCC.

---

### Part 6: Polyglot Persistence & Recommendations (Module 6)
1. **Explainable Recommendations:**
   - Show how candidate books receive score points (+5 category match, +3 author match, +2 rating, +2 popularity).
   - Display the resulting recommendations on the UI with transparent reason tags.
2. **MongoDB Activity Events & CAP Theorem Explanation:**
   - Show sample document in MongoDB recording a patron's search query event.
   - Present the clear CAP analysis: why PostgreSQL was chosen for the authoritative CP relational core, and why eventual consistency in MongoDB is suitable for high-throughput activity telemetry.

---

## 3. Summary of Examiner Question Cheat-Sheet

| Question | Strong Answer |
|---|---|
| *Why separate books and book copies?* | In a physical library, multiple identical copies exist for one title. Storing copies in `books` causes update anomalies or multi-valued dependencies. Storing only titles makes tracking shelf location and individual condition impossible. |
| *How do you prevent double checkout of a book?* | Two layers: Application transaction uses `SELECT FOR UPDATE` on `book_copies`, and the database schema enforces a partial unique index `uq_single_active_loan_per_copy` on `loans(copy_id) WHERE status IN ('ACTIVE', 'OVERDUE')`. |
| *Does this schema satisfy BCNF?* | Yes. For every non-trivial functional dependency $X \rightarrow Y$ in all 10 relations, $X$ is a superkey. |
| *Why use MongoDB alongside PostgreSQL?* | Polyglot persistence. PostgreSQL guarantees ACID for circulation and inventory. MongoDB handles flexible, schema-less event streams (search logs, page views) that would otherwise bloat the relational write-ahead log. |
| *How does your recommendation algorithm work?* | It is a deterministic, explainable scoring engine (+5 category, +3 author, +2 rating, +2 popularity), filtering out already-borrowed books and providing human-readable explanations. |
