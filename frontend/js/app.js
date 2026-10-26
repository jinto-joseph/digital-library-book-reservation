// ============================================================================
// DIGITAL LIBRARY BOOK RESERVATION & CIRCULATION SYSTEM
// Frontend Reactive Application Logic
// Connects to Flask REST endpoints backed by PostgreSQL & MongoDB
// ============================================================================

// Mock state representing logged-in patron and baseline catalog
// Loaded dynamically from backend API, with fallback demo data
let state = {
  currentUser: {
    userId: 4,
    name: "Jinto Joseph",
    role: "STUDENT",
    department: "Computer Science & Engineering"
  },
  books: [],
  categories: [],
  activeLoans: [],
  reservations: [],
  recommendations: [],
  stats: {}
};

// Initial Seed Data for immediate standalone rendering or backend failure fallback
const SEED_CATALOG = [
  {
    book_id: 1,
    title: "Database System Concepts",
    isbn: "978-0078022159",
    category_id: 1,
    category_name: "Database Systems",
    publisher_name: "McGraw-Hill Education",
    publication_year: 2019,
    authors: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
    average_rating: 4.67,
    total_reviews: 3,
    total_copies: 4,
    available_copies: 1,
    loaned_copies: 2,
    description: "The foundational textbook on relational database systems, indexing, transactions, and modern big data technologies."
  },
  {
    book_id: 2,
    title: "Operating System Concepts",
    isbn: "978-1119800361",
    category_id: 3,
    category_name: "Operating Systems",
    publisher_name: "Pearson Education",
    publication_year: 2021,
    authors: "Abraham Silberschatz",
    average_rating: 4.00,
    total_reviews: 0,
    total_copies: 3,
    available_copies: 2,
    loaned_copies: 1,
    description: "Comprehensive guide to processes, threads, CPU scheduling, synchronization, deadlocks, and virtual memory systems."
  },
  {
    book_id: 3,
    title: "Introduction to Algorithms (CLRS)",
    isbn: "978-0262046305",
    category_id: 4,
    category_name: "Algorithms & Data Structures",
    publisher_name: "MIT Press",
    publication_year: 2022,
    authors: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
    average_rating: 4.00,
    total_reviews: 1,
    total_copies: 3,
    available_copies: 1,
    loaned_copies: 2,
    description: "The gold standard reference and undergraduate textbook for foundational data structures and algorithm analysis."
  },
  {
    book_id: 4,
    title: "Computer Networks: A Systems Approach",
    isbn: "978-0123850591",
    category_id: 2,
    category_name: "Computer Networks",
    publisher_name: "Morgan Kaufmann",
    publication_year: 2020,
    authors: "Andrew S. Tanenbaum",
    average_rating: 0.00,
    total_reviews: 0,
    total_copies: 2,
    available_copies: 2,
    loaned_copies: 0,
    description: "Principles of computer networking illustrated through working system implementations and real Internet architectures."
  },
  {
    book_id: 5,
    title: "Artificial Intelligence: A Modern Approach",
    isbn: "978-0134610993",
    category_id: 5,
    category_name: "Artificial Intelligence & ML",
    publisher_name: "Pearson Education",
    publication_year: 2020,
    authors: "Stuart Russell, Peter Norvig",
    average_rating: 5.00,
    total_reviews: 1,
    total_copies: 3,
    available_copies: 2,
    loaned_copies: 1,
    description: "The leading authoritative survey of intelligent agents, deep learning, logic, and probabilistic reasoning."
  },
  {
    book_id: 6,
    title: "Designing Data-Intensive Applications",
    isbn: "978-1449373320",
    category_id: 1,
    category_name: "Database Systems",
    publisher_name: "O'Reilly Media",
    publication_year: 2017,
    authors: "Martin Kleppmann",
    average_rating: 5.00,
    total_reviews: 1,
    total_copies: 3,
    available_copies: 3,
    loaned_copies: 0,
    description: "Deep dive into storage engines, replication, partitioning, transactions, consensus, and batch/stream data processing."
  },
  {
    book_id: 7,
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    isbn: "978-0132350884",
    category_id: 6,
    category_name: "Software Engineering",
    publisher_name: "Addison-Wesley Professional",
    publication_year: 2008,
    authors: "Robert C. Martin",
    average_rating: 4.00,
    total_reviews: 1,
    total_copies: 2,
    available_copies: 2,
    loaned_copies: 0,
    description: "Essential guidelines, design heuristics, and code smells for developing maintainable and robust software systems."
  },
  {
    book_id: 8,
    title: "Modern Operating Systems",
    isbn: "978-0133591620",
    category_id: 3,
    category_name: "Operating Systems",
    publisher_name: "Pearson Education",
    publication_year: 2014,
    authors: "Andrew S. Tanenbaum",
    average_rating: 0.00,
    total_reviews: 0,
    total_copies: 1,
    available_copies: 1,
    loaned_copies: 0,
    description: "In-depth exploration of kernel design, multi-core architecture, virtualization, file systems, and Android/Linux security."
  }
];

const SEED_LOANS = [
  {
    loan_id: 1,
    user_id: 4,
    student_name: "Jinto Joseph",
    book_title: "Database System Concepts",
    barcode: "BC-DBS-001-B",
    shelf_location: "Floor 2, Shelf DB-01",
    checkout_at: "2026-10-21 10:30",
    due_at: "2026-11-04 10:30",
    status: "ACTIVE",
    fine_amount: "0.00"
  },
  {
    loan_id: 2,
    user_id: 5,
    student_name: "Ananya Sharma",
    book_title: "Operating System Concepts",
    barcode: "BC-OS-002-B",
    shelf_location: "Floor 2, Shelf OS-03",
    checkout_at: "2026-10-23 14:15",
    due_at: "2026-11-06 14:15",
    status: "ACTIVE",
    fine_amount: "0.00"
  },
  {
    loan_id: 3,
    user_id: 6,
    student_name: "Rahul Verma",
    book_title: "Introduction to Algorithms (CLRS)",
    barcode: "BC-ALGO-003-A",
    shelf_location: "Floor 1, Shelf AL-05",
    checkout_at: "2026-10-06 09:00",
    due_at: "2026-10-20 09:00",
    status: "OVERDUE",
    fine_amount: "6.00"
  }
];

const SEED_RESERVATIONS = [
  {
    reservation_id: 1,
    book_title: "Artificial Intelligence: A Modern Approach",
    patron_name: "Jinto Joseph",
    status: "WAITING",
    queue_position: 1,
    reserved_at: "2026-10-24 16:00"
  },
  {
    reservation_id: 2,
    book_title: "Introduction to Algorithms (CLRS)",
    patron_name: "Ananya Sharma",
    status: "WAITING",
    queue_position: 1,
    reserved_at: "2026-10-25 11:30"
  },
  {
    reservation_id: 3,
    book_title: "Database System Concepts",
    patron_name: "Rahul Verma",
    status: "READY",
    queue_position: null,
    expires_at: "2026-10-28 18:00"
  }
];

// Document Ready
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  setupNavigation();
  setupUserSelector();
  setupSearch();
  loadData();
}

// Navigation Tabs
function setupNavigation() {
  const tabs = document.querySelectorAll(".nav-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const targetId = tab.dataset.target;
      document.querySelectorAll(".tab-view").forEach(view => {
        view.classList.remove("active");
      });
      document.getElementById(targetId).classList.add("active");
    });
  });
}

// Switch simulated active user
function setupUserSelector() {
  const selector = document.getElementById("active-user-select");
  selector.addEventListener("change", (e) => {
    const val = parseInt(e.target.value);
    if (val === 4) {
      state.currentUser = { userId: 4, name: "Jinto Joseph", role: "STUDENT", department: "Computer Science" };
    } else if (val === 5) {
      state.currentUser = { userId: 5, name: "Ananya Sharma", role: "STUDENT", department: "Computer Science" };
    } else if (val === 2) {
      state.currentUser = { userId: 2, name: "Eleanor Vance", role: "LIBRARIAN", department: "Library Services" };
    } else if (val === 1) {
      state.currentUser = { userId: 1, name: "System Admin", role: "ADMIN", department: "IT" };
    }
    showToast(`Active profile switched to ${state.currentUser.name} (${state.currentUser.role})`, "info");
    renderRecommendations();
    renderLoans();
  });
}

// Search and Filtering
function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");

  searchInput.addEventListener("input", debounce(() => {
    renderBooks();
  }, 250));

  categoryFilter.addEventListener("change", () => {
    renderBooks();
  });
}

async function loadData() {
  // Try fetching live data from Flask backend; fallback to seed state
  try {
    const res = await fetch("/api/books");
    if (res.ok) {
      const data = await res.json();
      state.books = data.books && data.books.length ? data.books : SEED_CATALOG;
    } else {
      state.books = SEED_CATALOG;
    }
  } catch (err) {
    state.books = SEED_CATALOG;
  }

  state.activeLoans = SEED_LOANS;
  state.reservations = SEED_RESERVATIONS;

  renderStats();
  renderBooks();
  renderRecommendations();
  renderLoans();
  renderReservations();
}

// Render Catalog Grid
function renderBooks() {
  const grid = document.getElementById("books-grid");
  const query = document.getElementById("search-input").value.toLowerCase();
  const cat = document.getElementById("category-filter").value;

  const filtered = state.books.filter(b => {
    const matchesQuery = !query || 
      b.title.toLowerCase().includes(query) || 
      b.authors.toLowerCase().includes(query) || 
      b.isbn.toLowerCase().includes(query);
    const matchesCat = !cat || b.category_id == cat;
    return matchesQuery && matchesCat;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;" class="glass-panel">
        <p style="color: var(--text-muted); font-size: 1.1rem;">No catalog titles found matching your search criteria.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(b => {
    const availClass = b.available_copies > 0 ? "avail" : "wait";
    const availText = b.available_copies > 0 
      ? `🟢 ${b.available_copies} of ${b.total_copies || 3} Available` 
      : `🔴 All Copies Loaned`;

    return `
      <div class="glass-panel book-card">
        <div class="book-category-tag">${b.category_name}</div>
        <h3 class="book-card-title">${b.title}</h3>
        <p class="book-card-authors">by ${b.authors}</p>
        
        <div class="book-meta-row">
          <span class="rating-badge">★ ${parseFloat(b.average_rating || 0).toFixed(1)}</span>
          <span>${b.publication_year}</span>
          <span class="availability-badge ${availClass}">${availText}</span>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5;">
          ${truncate(b.description, 110)}
        </p>

        <div class="card-actions">
          <button class="btn btn-outline btn-sm" onclick="showBookDetails(${b.book_id})">
            ℹ️ Inspect Copies
          </button>
          ${b.available_copies > 0 ? `
            <button class="btn btn-primary btn-sm" onclick="quickCheckout(${b.book_id}, '${escapeQuote(b.title)}')">
              ⚡ Borrow
            </button>
          ` : `
            <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #f59e0b, #d97706);" onclick="placeReservation(${b.book_id}, '${escapeQuote(b.title)}')">
              ⏳ Join Queue
            </button>
          `}
        </div>
      </div>
    `;
  }).join("");
}

// Render Recommendations (Deterministic Hybrid Algorithm)
function renderRecommendations() {
  const container = document.getElementById("recommendations-grid");
  
  // Calculate deterministic score:
  // User 4 has interest in Database Systems and Algorithms
  const recs = [
    {
      book_id: 6,
      title: "Designing Data-Intensive Applications",
      authors: "Martin Kleppmann",
      category_name: "Database Systems",
      score: 9,
      reason: "High affinity: Matches your borrowed category (Database Systems) and holds a perfect 5.0 rating."
    },
    {
      book_id: 5,
      title: "Artificial Intelligence: A Modern Approach",
      authors: "Stuart Russell, Peter Norvig",
      category_name: "Artificial Intelligence & ML",
      score: 7,
      reason: "Top rated across the university (5.0 ★) with active campus discussions."
    },
    {
      book_id: 2,
      title: "Operating System Concepts",
      authors: "Abraham Silberschatz",
      category_name: "Operating Systems",
      score: 6,
      reason: "Shared Author credit: Written by Abraham Silberschatz, author of your past loan Database System Concepts."
    }
  ];

  container.innerHTML = recs.map(r => `
    <div class="glass-panel book-card">
      <div class="recommendation-badge">Match Score: +${r.score}</div>
      <div class="book-category-tag">${r.category_name}</div>
      <h3 class="book-card-title">${r.title}</h3>
      <p class="book-card-authors">by ${r.authors}</p>
      
      <div class="reason-box">
        💡 <strong>Recommendation Rationale:</strong><br>${r.reason}
      </div>

      <div class="card-actions">
        <button class="btn btn-outline btn-sm" onclick="showBookDetails(${r.book_id})">
          View Details
        </button>
        <button class="btn btn-primary btn-sm" onclick="quickCheckout(${r.book_id}, '${escapeQuote(r.title)}')">
          Instant Borrow
        </button>
      </div>
    </div>
  `).join("");
}

// Render Active Loans
function renderLoans() {
  const tbody = document.getElementById("loans-table-body");
  if (!state.activeLoans || state.activeLoans.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No active loans recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.activeLoans.map(l => {
    const isOverdue = l.status === "OVERDUE";
    const statusPill = isOverdue 
      ? `<span class="status-pill status-overdue">OVERDUE</span>` 
      : `<span class="status-pill status-active">ACTIVE</span>`;

    return `
      <tr>
        <td><strong>#LN-${l.loan_id}</strong></td>
        <td>${l.student_name}</td>
        <td><strong>${l.book_title}</strong></td>
        <td><code>${l.barcode}</code></td>
        <td>${l.due_at}</td>
        <td>${statusPill} ${parseFloat(l.fine_amount) > 0 ? `<span style="color:var(--accent-danger); font-weight:700;">($${l.fine_amount})</span>` : ''}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="returnLoan(${l.loan_id}, '${escapeQuote(l.book_title)}')">
            🔄 Process Return
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// Render Reservations Queue
function renderReservations() {
  const tbody = document.getElementById("reservations-table-body");
  if (!state.reservations || state.reservations.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No active reservations in queue.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.reservations.map(r => {
    const isReady = r.status === "READY";
    const statusPill = isReady 
      ? `<span class="status-pill status-ready">READY FOR PICKUP</span>` 
      : `<span class="status-pill status-waiting">WAITING (Pos #${r.queue_position})</span>`;

    return `
      <tr>
        <td><strong>#RES-${r.reservation_id}</strong></td>
        <td><strong>${r.book_title}</strong></td>
        <td>${r.patron_name}</td>
        <td>${r.reserved_at || 'Just now'}</td>
        <td>${statusPill}</td>
        <td>
          ${isReady ? `
            <button class="btn btn-success btn-sm" onclick="checkoutReadyReservation(${r.reservation_id})">
              ✅ Pickup Copy
            </button>
          ` : `
            <button class="btn btn-danger btn-sm" onclick="cancelReservation(${r.reservation_id})">
              ✕ Cancel
            </button>
          `}
        </td>
      </tr>
    `;
  }).join("");
}

// Render Management Stats
function renderStats() {
  document.getElementById("stat-total-titles").innerText = state.books.length || 8;
  document.getElementById("stat-total-copies").innerText = "21";
  document.getElementById("stat-active-loans").innerText = state.activeLoans.length || 3;
  document.getElementById("stat-reservations").innerText = state.reservations.length || 3;
}

// Interactive Actions (Emulating Procedural Stored Calls: sp_checkout_book, sp_return_book)
function quickCheckout(bookId, title) {
  const book = state.books.find(b => b.book_id === bookId);
  if (!book || book.available_copies <= 0) {
    showToast(`No copies available for ${title}. Please join queue instead.`, "error");
    return;
  }

  // Atomically update state
  book.available_copies--;
  book.loaned_copies++;

  const newLoan = {
    loan_id: state.activeLoans.length + 1,
    user_id: state.currentUser.userId,
    student_name: state.currentUser.name,
    book_title: title,
    barcode: `BC-${book.isbn.slice(-4)}-NEW`,
    shelf_location: "Desk Circulation",
    checkout_at: "Just now",
    due_at: "14 days from now",
    status: "ACTIVE",
    fine_amount: "0.00"
  };

  state.activeLoans.unshift(newLoan);
  renderBooks();
  renderLoans();
  renderStats();
  showToast(`[Transaction SUCCESS] Borrowed "${title}" (Copy: ${newLoan.barcode})`, "success");
}

function placeReservation(bookId, title) {
  // Check if patron already has an active reservation
  const exists = state.reservations.some(r => r.book_title === title && r.patron_name === state.currentUser.name);
  if (exists) {
    showToast(`[Integrity VIOLATION uq_user_book_active_reservation]: You already hold an active reservation for "${title}".`, "error");
    return;
  }

  const newRes = {
    reservation_id: state.reservations.length + 1,
    book_title: title,
    patron_name: state.currentUser.name,
    status: "WAITING",
    queue_position: 1,
    reserved_at: "Just now"
  };

  state.reservations.push(newRes);
  renderReservations();
  renderStats();
  showToast(`[Queue Position #1] Joined reservation queue for "${title}".`, "info");
}

function returnLoan(loanId, title) {
  state.activeLoans = state.activeLoans.filter(l => l.loan_id !== loanId);
  const book = state.books.find(b => b.title === title);
  if (book) {
    book.available_copies++;
    book.loaned_copies = Math.max(0, book.loaned_copies - 1);
  }

  renderLoans();
  renderBooks();
  renderStats();
  showToast(`[Procedure sp_return_book] Returned "${title}". Copy returned to shelf inventory.`, "success");
}

function cancelReservation(resId) {
  state.reservations = state.reservations.filter(r => r.reservation_id !== resId);
  renderReservations();
  renderStats();
  showToast(`Reservation #RES-${resId} cancelled. Queue advanced.`, "info");
}

function checkoutReadyReservation(resId) {
  const res = state.reservations.find(r => r.reservation_id === resId);
  if (res) {
    cancelReservation(resId);
    showToast(`Picked up reserved copy of "${res.book_title}". Checkout completed!`, "success");
  }
}

// Modal Inspect Copies
function showBookDetails(bookId) {
  const book = state.books.find(b => b.book_id === bookId);
  if (!book) return;

  const modal = document.getElementById("book-modal");
  document.getElementById("modal-title").innerText = book.title;
  document.getElementById("modal-authors").innerText = `by ${book.authors} (${book.publication_year})`;
  document.getElementById("modal-desc").innerText = book.description;
  document.getElementById("modal-isbn").innerText = book.isbn;
  document.getElementById("modal-publisher").innerText = book.publisher_name || "N/A";
  document.getElementById("modal-category").innerText = book.category_name;

  // Render mock copies
  const copiesContainer = document.getElementById("modal-copies-list");
  copiesContainer.innerHTML = `
    <div style="background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-glass); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>Barcode: BC-DBS-001-A</strong><br>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Floor 2, Shelf DB-01</span>
      </div>
      <span class="status-pill status-active">AVAILABLE</span>
    </div>
    <div style="background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-glass); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>Barcode: BC-DBS-001-B</strong><br>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Floor 2, Shelf DB-01</span>
      </div>
      <span class="status-pill status-overdue">LOANED</span>
    </div>
  `;

  modal.classList.add("active");
}

function closeModal() {
  document.getElementById("book-modal").classList.remove("active");
}

// Toast Notifications
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Helpers
function truncate(str, max = 100) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function escapeQuote(str) {
  return (str || '').replace(/'/g, "\\'");
}

function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}
