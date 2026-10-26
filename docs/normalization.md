# Functional Dependencies, Normalization & Schema Rigor
## Digital Library Book Reservation and Recommendation System

**Course:** Database Management Systems (DBMS)  
**Alignment:** DBMS Module 3 (Functional Dependencies, Normalization: 1NF, 2NF, 3NF, BCNF, Anomalies)

---

## 1. Functional Dependencies (FDs) and Candidate Keys by Relation

Let $R(U)$ be a relation with attribute set $U$. A functional dependency $X \rightarrow Y$ holds if whenever two tuples agree on $X$, they must also agree on $Y$. A set of attributes $K$ is a **superkey** if $K \rightarrow U$. $K$ is a **candidate key** if no proper subset of $K$ is a superkey.

### 1. `users`
- **Attributes:** $\{ \text{user\_id}, \text{full\_name}, \text{email}, \text{password\_hash}, \text{role}, \text{department}, \text{phone}, \text{is\_active}, \text{created\_at} \}$
- **Functional Dependencies:**
  1. $\text{user\_id} \rightarrow \{ \text{full\_name}, \text{email}, \text{password\_hash}, \text{role}, \text{department}, \text{phone}, \text{is\_active}, \text{created\_at} \}$
  2. $\text{email} \rightarrow \{ \text{user\_id}, \text{full\_name}, \text{password\_hash}, \text{role}, \text{department}, \text{phone}, \text{is\_active}, \text{created\_at} \}$
- **Candidate Keys:** $\{\text{user\_id}\}$, $\{\text{email}\}$
- **Primary Key Selected:** $\text{user\_id}$ (compact integer surrogate key)

### 2. `publishers`
- **Attributes:** $\{ \text{publisher\_id}, \text{publisher\_name}, \text{city}, \text{country}, \text{website} \}$
- **Functional Dependencies:**
  1. $\text{publisher\_id} \rightarrow \{ \text{publisher\_name}, \text{city}, \text{country}, \text{website} \}$
  2. $\text{publisher\_name} \rightarrow \{ \text{publisher\_id}, \text{city}, \text{country}, \text{website} \}$
- **Candidate Keys:** $\{\text{publisher\_id}\}$, $\{\text{publisher\_name}\}$
- **Primary Key Selected:** $\text{publisher\_id}$

### 3. `categories`
- **Attributes:** $\{ \text{category\_id}, \text{category\_name}, \text{description} \}$
- **Functional Dependencies:**
  1. $\text{category\_id} \rightarrow \{ \text{category\_name}, \text{description} \}$
  2. $\text{category\_name} \rightarrow \{ \text{category\_id}, \text{description} \}$
- **Candidate Keys:** $\{\text{category\_id}\}$, $\{\text{category\_name}\}$
- **Primary Key Selected:** $\text{category\_id}$

### 4. `authors`
- **Attributes:** $\{ \text{author\_id}, \text{author\_name}, \text{biography}, \text{created\_at} \}$
- **Functional Dependencies:**
  1. $\text{author\_id} \rightarrow \{ \text{author\_name}, \text{biography}, \text{created\_at} \}$
- **Candidate Key:** $\{\text{author\_id}\}$
- **Primary Key Selected:** $\text{author\_id}$

### 5. `books`
- **Attributes:** $\{ \text{book\_id}, \text{title}, \text{isbn}, \text{publication\_year}, \text{publisher\_id}, \text{category\_id}, \text{description}, \text{cover\_image\_url}, \text{created\_at} \}$
- **Functional Dependencies:**
  1. $\text{book\_id} \rightarrow \{ \text{title}, \text{isbn}, \text{publication\_year}, \text{publisher\_id}, \text{category\_id}, \text{description}, \text{cover\_image\_url}, \text{created\_at} \}$
  2. $\text{isbn} \rightarrow \{ \text{book\_id}, \text{title}, \text{publication\_year}, \text{publisher\_id}, \text{category\_id}, \text{description}, \text{cover\_image\_url}, \text{created\_at} \}$
- **Candidate Keys:** $\{\text{book\_id}\}$, $\{\text{isbn}\}$
- **Primary Key Selected:** $\text{book\_id}$

### 6. `book_authors`
- **Attributes:** $\{ \text{book\_id}, \text{author\_id}, \text{author\_order} \}$
- **Functional Dependencies:**
  1. $\{ \text{book\_id}, \text{author\_id} \} \rightarrow \{ \text{author\_order} \}$
- **Candidate Key:** $\{ \text{book\_id}, \text{author\_id} \}$
- **Primary Key Selected:** Composite $(\text{book\_id}, \text{author\_id})$

### 7. `book_copies`
- **Attributes:** $\{ \text{copy\_id}, \text{book\_id}, \text{barcode}, \text{shelf\_location}, \text{status}, \text{condition\_notes}, \text{acquired\_at} \}$
- **Functional Dependencies:**
  1. $\text{copy\_id} \rightarrow \{ \text{book\_id}, \text{barcode}, \text{shelf\_location}, \text{status}, \text{condition\_notes}, \text{acquired\_at} \}$
  2. $\text{barcode} \rightarrow \{ \text{copy\_id}, \text{book\_id}, \text{shelf\_location}, \text{status}, \text{condition\_notes}, \text{acquired\_at} \}$
- **Candidate Keys:** $\{\text{copy\_id}\}$, $\{\text{barcode}\}$
- **Primary Key Selected:** $\text{copy\_id}$

### 8. `reservations`
- **Attributes:** $\{ \text{reservation\_id}, \text{user\_id}, \text{book\_id}, \text{reserved\_at}, \text{status}, \text{queue\_position}, \text{expires\_at}, \text{fulfilled\_at} \}$
- **Functional Dependencies:**
  1. $\text{reservation\_id} \rightarrow \{ \text{user\_id}, \text{book\_id}, \text{reserved\_at}, \text{status}, \text{queue\_position}, \text{expires\_at}, \text{fulfilled\_at} \}$
- **Candidate Key:** $\{\text{reservation\_id}\}$
- **Primary Key Selected:** $\text{reservation\_id}$

### 9. `loans`
- **Attributes:** $\{ \text{loan\_id}, \text{user\_id}, \text{copy\_id}, \text{checkout\_at}, \text{due\_at}, \text{returned\_at}, \text{status}, \text{fine\_amount}, \text{is\_fine\_paid} \}$
- **Functional Dependencies:**
  1. $\text{loan\_id} \rightarrow \{ \text{user\_id}, \text{copy\_id}, \text{checkout\_at}, \text{due\_at}, \text{returned\_at}, \text{status}, \text{fine\_amount}, \text{is\_fine\_paid} \}$
- **Candidate Key:** $\{\text{loan\_id}\}$
- **Primary Key Selected:** $\text{loan\_id}$

### 10. `reviews`
- **Attributes:** $\{ \text{review\_id}, \text{user\_id}, \text{book\_id}, \text{rating}, \text{review\_text}, \text{created\_at}, \text{updated\_at} \}$
- **Functional Dependencies:**
  1. $\text{review\_id} \rightarrow \{ \text{user\_id}, \text{book\_id}, \text{rating}, \text{review\_text}, \text{created\_at}, \text{updated\_at} \}$
  2. $\{ \text{user\_id}, \text{book\_id} \} \rightarrow \{ \text{review\_id}, \text{rating}, \text{review\_text}, \text{created\_at}, \text{updated\_at} \}$
- **Candidate Keys:** $\{\text{review\_id}\}$, $\{ \text{user\_id}, \text{book\_id} \}$
- **Primary Key Selected:** $\text{review\_id}$

---

## 2. Step-by-Step Normalization Analysis

### 2.1 First Normal Form (1NF)
**Requirement:** All column values must be atomic; no repeating groups, arrays, or composite nested structures.
- **Verification:**
  - In an unnormalized design, multiple authors might be stored in a comma-separated string: `books.authors = "Silberschatz, Korth, Sudarshan"`. This violates 1NF.
  - In our schema, the Many-to-Many relationship between books and authors is extracted into the relation `book_authors`, where each row contains exactly one atomic `(book_id, author_id)` pair.
  - Every column contains atomic scalar types (`VARCHAR`, `INT`, `TIMESTAMP`, `NUMERIC`, `BOOLEAN`).
- **Conclusion:** **The schema is strictly in 1NF.**

### 2.2 Second Normal Form (2NF)
**Requirement:** The relation must be in 1NF and every non-prime attribute must be fully functionally dependent on the whole candidate key (no partial dependencies on a proper subset of any composite key).
- **Verification:**
  - Relations with single-attribute candidate keys (`users`, `publishers`, `categories`, `authors`, `books`, `book_copies`, `reservations`, `loans`, `reviews`) automatically satisfy 2NF because no proper subset of a single-attribute key exists.
  - For `book_authors`, the candidate key is composite: $\{ \text{book\_id}, \text{author\_id} \}$. The only non-prime attribute is `author_order`. `author_order` depends on both the specific book AND the specific author (their positional credit for that book). Neither $\text{book\_id} \rightarrow \text{author\_order}$ nor $\text{author\_id} \rightarrow \text{author\_order}$ holds alone.
- **Conclusion:** **The schema is strictly in 2NF.**

### 2.3 Third Normal Form (3NF)
**Requirement:** The relation must be in 2NF, and for every non-trivial functional dependency $X \rightarrow A$, either:
1. $X$ is a superkey, OR
2. $A$ is a prime attribute (a member of some candidate key).
Equivalently: no non-prime attribute may transitively depend on a candidate key ($X \rightarrow Y$ and $Y \rightarrow Z$).

- **Verification:**
  - **Publisher Data:** If `publisher_name`, `publisher_city`, and `publisher_country` were stored directly in `books`, we would have:
    $$\text{book\_id} \rightarrow \text{publisher\_id} \quad \text{and} \quad \text{publisher\_id} \rightarrow \text{publisher\_city}$$
    This would create a transitive dependency on `book_id`. We eliminated this by decomposing `publishers` into its own relation.
  - **Category Data:** If category descriptions were stored inside `books`, a transitive dependency would exist. Extracting `categories` ensures every determinant is a superkey.
  - **Book Copies & Shelf Location:** If physical copy shelf location were stored in `books`, every book row would have to replicate copy locations or violate atomicity. Decomposing physical copies into `book_copies` ensures that `shelf_location` is fully dependent on `copy_id` (the physical item), not transitively on `book_id`.
- **Conclusion:** In all relations, every non-trivial FD has a left-hand side determinant that is a superkey. **The schema is strictly in 3NF.**

### 2.4 Boyce-Codd Normal Form (BCNF)
**Requirement:** For every non-trivial functional dependency $X \rightarrow A$, $X$ must be a **superkey**. (BCNF eliminates the condition where $A$ could be a prime attribute if $X$ is not a superkey).

- **Verification:**
  - In `users`: Determinants are `user_id` and `email`. Both are superkeys.
  - In `publishers`: Determinants are `publisher_id` and `publisher_name`. Both are superkeys.
  - In `categories`: Determinants are `category_id` and `category_name`. Both are superkeys.
  - In `authors`: Determinant is `author_id`. It is a superkey.
  - In `books`: Determinants are `book_id` and `isbn`. Both are superkeys.
  - In `book_authors`: Determinant is $\{ \text{book\_id}, \text{author\_id} \}$. It is a superkey.
  - In `book_copies`: Determinants are `copy_id` and `barcode`. Both are superkeys.
  - In `reservations`: Determinant is `reservation_id`. It is a superkey.
  - In `loans`: Determinant is `loan_id`. It is a superkey.
  - In `reviews`: Determinants are `review_id` and $\{ \text{user\_id}, \text{book\_id} \}$. Both are superkeys.
- **Conclusion:** **The schema satisfies BCNF across all relations without exception.**

---

## 3. Redundancy & Modification Anomalies Prevented

| Anomaly Type | Unnormalized Risk (Denormalized Design) | Prevented in Our Normalized Schema |
|---|---|---|
| **Insertion Anomaly** | Cannot record a publisher or category in the database until at least one book has been acquired from them. | `publishers` and `categories` exist as independent entities; catalog entries can be prepared before books arrive. |
| **Deletion Anomaly** | Deleting the last book published by MIT Press accidentally deletes all recorded knowledge of MIT Press's address and website. | Deleting a book only cascades or sets foreign keys to NULL (`ON DELETE SET NULL`); `publishers` row remains intact. |
| **Update Anomaly** | If O'Reilly Media moves office, the updater must locate and rewrite every single book record published by them. Missing one creates inconsistent data. | Publisher details reside in exactly one row in `publishers`. Updating the city requires a single row write. |
| **Inventory Duplication** | Storing "Number of Copies" as a numeric column inside `books` leads to desynchronization when a physical copy is loaned, damaged, or lost. | Copies are discrete entities (`book_copies`); counts are dynamically computed using `COUNT(*)` aggregates, guaranteeing mathematical truth. |

---

## 4. Higher Normal Forms (4NF and 5NF Context)

- **Fourth Normal Form (4NF) & Multivalued Dependencies (MVD):**
  - If a table had attributes $\{ \text{book\_id}, \text{author\_name}, \text{subject\_tag} \}$, where a book has multiple independent authors and multiple independent tags, a non-trivial MVD $\text{book\_id} \twoheadrightarrow \text{author\_name}$ would exist, generating Cartesian product redundancy.
  - In our design, authors and categories are decoupled into separate associative and classification structures. No non-trivial MVDs exist; thus **the schema is in 4NF**.
- **Fifth Normal Form (5NF / Project-Join Normal Form):**
  - No 3-way cyclic dependencies exist in this domain. Decompositions into projections and re-joining via lossless natural joins reconstructs the original states without spurious tuples.
