# DBMS Syllabus Module Mapping (Modules 1–6)
## Digital Library Book Reservation and Recommendation System

**Course:** Database Management Systems (DBMS)  
**Academic Alignment:** 6-Module Syllabus Reference Matrix

---

This document establishes an explicit, auditable mapping between the core DBMS syllabus topics (Modules 1 through 6) and the concrete artifacts, schemas, queries, and architectural implementations in this project.

---

## Module 1: Introduction and Database Architecture

| Syllabus Concept | Project Implementation Artifact | Practical Demonstration in System |
|---|---|---|
| **Three-Tier Architecture** | [`docs/architecture.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/architecture.md) | Presentation (HTML/CSS/JS) $\leftrightarrow$ Application Server (Flask REST) $\leftrightarrow$ Database (PostgreSQL + MongoDB). |
| **Relational Model & Domains** | [`database/schema.sql`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/database/schema.sql) | Atomic domains (`VARCHAR`, `INT`, `TIMESTAMP`, `NUMERIC`, `BOOLEAN`), relations as tables, tuples as rows. |
| **Keys (Primary, Candidate, Foreign, Composite, Unique)** | [`database/schema.sql`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/database/schema.sql), [`docs/relational-schema.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/relational-schema.md) | - **PK:** `user_id`, `book_id`, `copy_id`, `loan_id`<br>- **Candidate/Unique:** `users.email`, `books.isbn`, `book_copies.barcode`<br>- **FK:** `books.publisher_id -> publishers`, `loans.copy_id -> book_copies`<br>- **Composite PK:** `book_authors(book_id, author_id)`. |
| **Relational Algebra Concepts expressed in SQL** | [`database/queries.sql`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/database/queries.sql) (to be implemented) | - **Selection ($\sigma$):** SQL `WHERE` clauses (e.g., active loans, category filter).<br>- **Projection ($\pi$):** Explicit column lists in `SELECT`.<br>- **Cartesian Product ($\times$) & Joins ($\bowtie$):** `INNER JOIN`, `LEFT JOIN` on foreign keys.<br>- **Set Operations:** `UNION`, `INTERSECT`, `EXCEPT`. |

---

## Module 2: SQL and its Application

| Syllabus Concept | Project Implementation Artifact | Practical Demonstration in System |
|---|---|---|
| **Data Definition Language (DDL)** | [`database/schema.sql`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/database/schema.sql) | `CREATE TABLE`, `DROP TABLE CASCADE`, domain `CHECK` constraints, `REFERENCES`, defaults. |
| **Data Manipulation Language (DML)** | [`database/seed.sql`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/database/seed.sql) | Clean parameterized `INSERT`, `UPDATE` (status changes, fine calculation), `TRUNCATE`. |
| **Predicates & Filtering** | [`database/schema.sql`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/database/schema.sql), `database/queries.sql` | `LIKE %search%`, `BETWEEN 1 AND 5`, `IN ('WAITING', 'READY')`, `IS NULL`, `COALESCE`. |
| **Aggregations & Grouping** | `database/queries.sql` | `COUNT(*)`, `AVG(rating)`, `SUM(fine_amount)`, `GROUP BY b.book_id`, `HAVING COUNT(bc.copy_id) > 2`. |
| **Nested & Correlated Subqueries** | `database/queries.sql` | Books rated above the overall average; students who have never borrowed any book (`WHERE user_id NOT IN (...)`). |
| **Views** | `database/views.sql` | `v_book_catalog` (combining title, authors, publisher, category, average rating, copy counts); `v_overdue_loans`. |
| **Functions, Procedures & Triggers** | `database/functions.sql`, `procedures.sql`, `triggers.sql` | - **Function:** `fn_calculate_overdue_fines(loan_id)`.<br>- **Procedure:** `sp_issue_book_loan(user_id, copy_id)`.<br>- **Trigger:** `trg_update_copy_status_on_loan` automatically marking copy `LOANED` when a loan is inserted. |
| **Parameterized SQL** | Backend code (`backend/db.py`) | All queries pass runtime parameters as tuples/dictionaries via psycopg2 (`%s` placeholders); no string concatenation. |

---

## Module 3: Database Design and Normalization

| Syllabus Concept | Project Implementation Artifact | Practical Demonstration in System |
|---|---|---|
| **Entity-Relationship (ER) Modeling** | [`docs/er-model.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/er-model.md) | Entities, attributes, primary keys, relationships, cardinality ratios ($1:1, 1:N, M:N$), participation constraints. |
| **ER-to-Relational Mapping** | [`docs/relational-schema.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/relational-schema.md) | Transformation of strong entities, weak entities, $1:N$ references, and associative entities (`book_authors`). |
| **Functional Dependencies & Candidate Keys** | [`docs/normalization.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/normalization.md) | Formal documentation of FDs ($X \rightarrow Y$) for all 10 tables, candidate key proofs via attribute closures. |
| **Normal Forms (1NF, 2NF, 3NF, BCNF)** | [`docs/normalization.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/normalization.md) | Step-by-step verification proving every relation satisfies 1NF (atomic attributes), 2NF (no partial FDs), 3NF (no transitive FDs), and BCNF (every determinant is a superkey). |
| **Modification Anomalies** | [`docs/normalization.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/normalization.md) | Concrete comparative examples demonstrating how insertion, deletion, and update anomalies are prevented. |

---

## Module 4: File Structure and Indexing

| Syllabus Concept | Project Implementation Artifact | Practical Demonstration in System |
|---|---|---|
| **Primary & Secondary Indexes** | [`database/schema.sql`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/database/schema.sql), `database/indexes.sql` | B-tree indexes automatically created on PKs; secondary B-tree indexes on foreign keys (`idx_books_category`), search fields (`idx_books_title`). |
| **Composite & Partial Indexes** | [`database/schema.sql`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/database/schema.sql) | - Composite index: `idx_reservations_book_status (book_id, status)`.<br>- Partial unique index: `uq_single_active_loan_per_copy ON loans(copy_id) WHERE status IN ('ACTIVE', 'OVERDUE')`. |
| **Index Profiling & Query Plans** | `tests/indexing_tests.sql` | Comparing `EXPLAIN (ANALYZE, BUFFERS)` execution plans before and after creating indexes on book search queries. |
| **B-Tree vs Hash Index Analysis** | `docs/indexing-analysis.md` | Conceptual comparison of B-tree (supporting range queries, sorting, equality) versus PostgreSQL Hash indexes (equality only). |

---

## Module 5: Transactions and Concurrency Control

| Syllabus Concept | Project Implementation Artifact | Practical Demonstration in System |
|---|---|---|
| **ACID Properties** | [`docs/architecture.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/architecture.md), `tests/transaction_tests.sql` | - **Atomicity:** Loan creation and copy status update succeed or roll back together.<br>- **Consistency:** Schema constraints and partial unique indexes prevent illegal states.<br>- **Isolation:** `READ COMMITTED` / `REPEATABLE READ`.<br>- **Durability:** WAL (Write-Ahead Logging) in PostgreSQL. |
| **Pessimistic Locking / Row-Level Locks** | Backend circulation service | `SELECT copy_id, status FROM book_copies WHERE copy_id = %s FOR UPDATE;` prevents simultaneous checkout of the same copy. |
| **Two-Session Concurrency Test** | `tests/transaction_tests.sql` | Script simulating two concurrent patrons attempting to checkout the same copy `BC-DBS-001-A`; verifying that exactly one succeeds while the second receives a lock error or rejected constraint. |
| **Theoretical Concepts vs PostgreSQL Implementation** | [`docs/demo-script.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/demo-script.md) | Contrasting textbook Strict 2PL with PostgreSQL's actual MVCC (Multi-Version Concurrency Control) and Snapshot Isolation. |

---

## Module 6: NoSQL Databases and Recommendation Systems

| Syllabus Concept | Project Implementation Artifact | Practical Demonstration in System |
|---|---|---|
| **Relational vs Document Model** | [`docs/architecture.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/architecture.md) | Structured 3NF schema in PostgreSQL for core financial/inventory assets vs flexible, schema-less JSON/BSON documents in MongoDB for clickstream events. |
| **Document Queries & Aggregations** | `nosql/activity_events.py` | Filtering patron activity in MongoDB: user search query history, book page view counts, recommendation impressions. |
| **CAP Theorem Grounding** | [`docs/architecture.md`](file:///home/jo/Documents/2026-27%20ODD/DBMS/Project/digital-library-system/docs/architecture.md) | Rigorous explanation that CAP applies to distributed systems across network partitions; relational chosen for strict Consistency ($C$), NoSQL for scalable activity ingestion. |
| **Explainable Recommendation Engine** | Backend recommender service | Deterministic scoring algorithm combining SQL catalog attributes and historical preferences with human-readable rationale. |
