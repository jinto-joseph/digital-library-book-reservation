# Relational Schema Specification
## Digital Library Book Reservation and Recommendation System

**Course:** Database Management Systems (DBMS)  
**Alignment:** DBMS Module 1 (Relational Model, Keys, Domains) & Module 3 (ER-to-Relational Mapping)

---

## 1. Schema Notation and Definitions
In the relational notation below:
- **Primary Keys (PK)** are marked in **bold** or underlined: `PK`.
- **Foreign Keys (FK)** are marked with their target relation: `FK -> Target(attribute)`.
- **Candidate / Unique Keys (UK)** represent alternate minimal superkeys.

---

## 2. Relational Schema Definitions

### 1. `users`
Represents registered students, faculty, librarians, and system administrators.
```text
users (
    user_id          SERIAL PRIMARY KEY,
    full_name        VARCHAR(120) NOT NULL,
    email            VARCHAR(150) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    role             VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    department       VARCHAR(100),
    phone            VARCHAR(25),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```
- **Integrity Constraints:** `CHECK (role IN ('STUDENT', 'FACULTY', 'LIBRARIAN', 'ADMIN'))`

### 2. `publishers`
Normalized directory of academic and commercial book publishers.
```text
publishers (
    publisher_id     SERIAL PRIMARY KEY,
    publisher_name   VARCHAR(150) NOT NULL UNIQUE,
    city             VARCHAR(100),
    country          VARCHAR(100),
    website          VARCHAR(200)
)
```

### 3. `categories`
Subject classification domains.
```text
categories (
    category_id      SERIAL PRIMARY KEY,
    category_name    VARCHAR(100) NOT NULL UNIQUE,
    description      TEXT
)
```

### 4. `authors`
Individual authors and creators.
```text
authors (
    author_id        SERIAL PRIMARY KEY,
    author_name      VARCHAR(150) NOT NULL,
    biography        TEXT,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

### 5. `books`
Bibliographical works and titles.
```text
books (
    book_id          SERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    isbn             VARCHAR(20) NOT NULL UNIQUE,
    publication_year INT CHECK (publication_year >= 1400 AND publication_year <= 2100),
    publisher_id     INT REFERENCES publishers(publisher_id) ON DELETE SET NULL,
    category_id      INT NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    description      TEXT,
    cover_image_url  VARCHAR(300),
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

### 6. `book_authors`
Associative bridge relation resolving the $M:N$ relationship between Books and Authors.
```text
book_authors (
    book_id          INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    author_id        INT NOT NULL REFERENCES authors(author_id) ON DELETE CASCADE,
    author_order     INT NOT NULL DEFAULT 1 CHECK (author_order >= 1),
    PRIMARY KEY (book_id, author_id)
)
```

### 7. `book_copies`
Individual barcoded physical items held on library shelves.
```text
book_copies (
    copy_id          SERIAL PRIMARY KEY,
    book_id          INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    barcode          VARCHAR(50) NOT NULL UNIQUE,
    shelf_location   VARCHAR(50) NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    condition_notes  TEXT,
    acquired_at      DATE NOT NULL DEFAULT CURRENT_DATE
)
```
- **Integrity Constraints:** `CHECK (status IN ('AVAILABLE', 'LOANED', 'RESERVED', 'MAINTENANCE', 'WITHDRAWN'))`

### 8. `reservations`
Queue entries and title-level reservation requests placed by patrons.
```text
reservations (
    reservation_id   SERIAL PRIMARY KEY,
    user_id          INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id          INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    reserved_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status           VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    queue_position   INT CHECK (queue_position >= 1),
    expires_at       TIMESTAMP WITH TIME ZONE,
    fulfilled_at     TIMESTAMP WITH TIME ZONE
)
```
- **Integrity Constraints:**
  - `CHECK (status IN ('WAITING', 'READY', 'FULFILLED', 'CANCELLED', 'EXPIRED'))`
  - `CREATE UNIQUE INDEX uq_user_book_active_reservation ON reservations(user_id, book_id) WHERE status IN ('WAITING', 'READY');`

### 9. `loans`
Physical checkout transactions and circulation records.
```text
loans (
    loan_id          SERIAL PRIMARY KEY,
    user_id          INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    copy_id          INT NOT NULL REFERENCES book_copies(copy_id) ON DELETE RESTRICT,
    checkout_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_at           TIMESTAMP WITH TIME ZONE NOT NULL,
    returned_at      TIMESTAMP WITH TIME ZONE,
    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    fine_amount      NUMERIC(8, 2) NOT NULL DEFAULT 0.00 CHECK (fine_amount >= 0.00),
    is_fine_paid     BOOLEAN NOT NULL DEFAULT FALSE
)
```
- **Integrity Constraints:**
  - `CHECK (status IN ('ACTIVE', 'RETURNED', 'OVERDUE', 'LOST'))`
  - `CHECK (due_at >= checkout_at)`
  - `CHECK (returned_at IS NULL OR returned_at >= checkout_at)`
  - `CREATE UNIQUE INDEX uq_single_active_loan_per_copy ON loans(copy_id) WHERE status IN ('ACTIVE', 'OVERDUE');`

### 10. `reviews`
Patron ratings and commentary.
```text
reviews (
    review_id        SERIAL PRIMARY KEY,
    user_id          INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id          INT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    rating           INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text      TEXT,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_book_review UNIQUE (user_id, book_id)
)
```

---

## 3. ER-to-Relational Mapping Rules Applied
1. **Regular Entity Mapping:** Strong entities (`users`, `publishers`, `categories`, `authors`, `books`, `book_copies`) each map to a distinct relation with a primary key.
2. **$1:N$ Relationship Mapping:** Captured by placing the primary key of the "1" side as a foreign key on the "$N$" side (e.g., `books.publisher_id`, `books.category_id`, `book_copies.book_id`).
3. **$M:N$ Relationship Mapping:** Captured by creating an associative table (`book_authors`) whose primary key is composed of foreign keys referencing the participating entities.
4. **Weak Entity / Associative Subsystem:** Physical copies (`book_copies`) depend existentially on `books` via `ON DELETE CASCADE`.
5. **Partial Index for Business Invariants:** Expresses state-dependent uniqueness that standard SQL-92 `UNIQUE` constraints cannot express without subqueries.
