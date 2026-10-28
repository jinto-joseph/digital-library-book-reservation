// ============================================================================
// DIGITAL LIBRARY BOOK RESERVATION & CIRCULATION SYSTEM
// Frontend Reactive Application Logic
// Connects to Flask REST endpoints backed by PostgreSQL. Every action requires
// a signed-in session; the server enforces role permissions on each request.
// ============================================================================

let state = {
  currentUser: null,
  books: [],
  activeLoans: [],
  reservations: [],
  recommendations: [],
  users: [],
  catalogOptions: { categories: [], publishers: [], authors: [], recent: [] },
  stats: {}
};

const STAFF_ROLES = ["LIBRARIAN", "ADMIN"];
const isStaff = () => state.currentUser && STAFF_ROLES.includes(state.currentUser.role);

// Document Ready
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  setupNavigation();
  setupAuthForms();
  setupSearch();
  setupAdminBookForms();
  try {
    const data = await api("/api/auth/me", { silent401: true });
    onSignedIn(data.user);
  } catch (e) {
    showAuthScreen();
  }
}

// ----------------------------------------------------------------------------
// API helper: JSON in/out, session cookie, uniform 401/403 handling
// ----------------------------------------------------------------------------
async function api(path, { method = "GET", body, silent401 = false } = {}) {
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !silent401 && state.currentUser) {
    showToast("Your session has ended. Please sign in again.", "error");
    showAuthScreen();
  }
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ----------------------------------------------------------------------------
// Authentication
// ----------------------------------------------------------------------------
function setupAuthForms() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const errorBox = document.getElementById("auth-error");

  document.getElementById("show-register").addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none"; registerForm.style.display = "flex";
    document.getElementById("auth-subtitle").innerText = "Create a student account";
    errorBox.innerText = "";
  });
  document.getElementById("show-login").addEventListener("click", (e) => {
    e.preventDefault();
    registerForm.style.display = "none"; loginForm.style.display = "flex";
    document.getElementById("auth-subtitle").innerText = "Sign in with your library account";
    errorBox.innerText = "";
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.innerText = "";
    try {
      const data = await api("/api/auth/login", {
        method: "POST", silent401: true,
        body: { email: document.getElementById("login-email").value, password: document.getElementById("login-password").value }
      });
      loginForm.reset();
      onSignedIn(data.user);
    } catch (err) {
      errorBox.innerText = err.message;
    }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.innerText = "";
    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: {
          full_name: document.getElementById("reg-name").value,
          email: document.getElementById("reg-email").value,
          department: document.getElementById("reg-dept").value,
          password: document.getElementById("reg-password").value
        }
      });
      registerForm.reset();
      onSignedIn(data.user);
    } catch (err) {
      errorBox.innerText = err.message;
    }
  });

  document.getElementById("logout-btn").addEventListener("click", async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } catch (e) {}
    showToast("Signed out.", "info");
    showAuthScreen();
  });
}

function showAuthScreen() {
  state.currentUser = null;
  document.body.classList.add("logged-out");
  document.getElementById("auth-error").innerText = "";
}

function onSignedIn(user) {
  state.currentUser = user;
  document.body.classList.remove("logged-out");
  document.getElementById("user-name").innerText = user.full_name;
  const roleBadge = document.getElementById("user-role");
  roleBadge.innerText = user.role;
  roleBadge.className = `role-badge ${user.role}`;
  applyRoleVisibility();
  activateTab("tab-catalog");
  showToast(`Welcome, ${user.full_name} (${user.role})`, "success");
  loadData();
}

// Shows only the tabs the signed-in role may use and relabels shared tabs.
function applyRoleVisibility() {
  const role = state.currentUser.role;
  document.querySelectorAll(".nav-tab-btn").forEach(btn => {
    const allowed = btn.dataset.roles ? btn.dataset.roles.split(" ").includes(role) : true;
    btn.classList.toggle("role-hidden", !allowed);
  });
  document.querySelectorAll(".tab-label").forEach(label => {
    label.innerText = isStaff() ? label.dataset.staff : label.dataset.student;
  });
}

// Navigation Tabs
function setupNavigation() {
  document.querySelectorAll(".nav-tab-btn").forEach(tab => {
    tab.addEventListener("click", () => activateTab(tab.dataset.target));
  });
}

function activateTab(targetId) {
  document.querySelectorAll(".nav-tab-btn").forEach(t => t.classList.toggle("active", t.dataset.target === targetId));
  document.querySelectorAll(".tab-view").forEach(view => view.classList.toggle("active", view.id === targetId));
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

// ----------------------------------------------------------------------------
// Data loading (each request is checked against the session role server-side)
// ----------------------------------------------------------------------------
async function loadData() {
  const role = state.currentUser.role;
  const jobs = [
    api("/api/books").then(d => { state.books = d.books; }),
    api("/api/loans").then(d => { state.activeLoans = d.loans; }),
    api("/api/reservations").then(d => { state.reservations = d.reservations; }),
    api("/api/stats").then(d => { state.stats = d; })
  ];
  if (!isStaff()) jobs.push(api("/api/recommendations").then(d => { state.recommendations = d.recommendations; }));
  if (role === "ADMIN") {
    jobs.push(api("/api/admin/users").then(d => { state.users = d.users; }));
    jobs.push(api("/api/admin/catalog-options").then(d => { state.catalogOptions = d; }));
  }

  const results = await Promise.allSettled(jobs);
  const failed = results.find(r => r.status === "rejected");
  if (failed && failed.reason.status !== 401) showToast(failed.reason.message, "error");

  renderStats();
  renderBooks();
  renderRecommendations();
  renderLoans();
  renderReservations();
  renderUsers();
  renderAddBook();
}

// Render Catalog Grid
function renderBooks() {
  const grid = document.getElementById("books-grid");
  document.getElementById("all-categories-option").innerText = `All Categories & Genres (${state.books.length} Books)`;
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

  const canReserve = !isStaff();
  grid.innerHTML = filtered.map(b => {
    const availClass = b.available_copies > 0 ? "avail" : "wait";
    const availText = b.available_copies > 0
      ? `🟢 ${b.available_copies} of ${b.total_copies} Available`
      : `🔴 All Copies Loaned`;

    let action = "";
    if (b.available_copies > 0 && canReserve) {
      action = `<button class="btn btn-primary btn-sm" onclick="quickCheckout(${b.book_id}, '${escapeQuote(b.title)}')">⚡ Borrow</button>`;
    } else if (canReserve) {
      action = `<button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #f59e0b, #d97706);" onclick="placeReservation(${b.book_id}, '${escapeQuote(b.title)}')">⏳ Join Queue</button>`;
    }

    return `
      <div class="glass-panel book-card">
        <div class="book-category-tag">${escapeHtml(b.category_name)}</div>
        <h3 class="book-card-title">${escapeHtml(b.title)}</h3>
        <p class="book-card-authors">by ${escapeHtml(b.authors)}</p>

        <div class="book-meta-row">
          <span class="rating-badge">★ ${parseFloat(b.average_rating || 0).toFixed(1)}</span>
          <span>${b.publication_year || ""}</span>
          <span class="availability-badge ${availClass}">${availText}</span>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5;">
          ${escapeHtml(truncate(b.description, 110))}
        </p>

        <div class="card-actions">
          <button class="btn btn-outline btn-sm" onclick="showBookDetails(${b.book_id})">
            ℹ️ Inspect Copies
          </button>
          ${action}
        </div>
      </div>
    `;
  }).join("");
}

// Render Recommendations (scored server-side from the user's own loan history)
function renderRecommendations() {
  const container = document.getElementById("recommendations-grid");
  if (!state.recommendations.length) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem;" class="glass-panel">
      <p style="color: var(--text-muted);">Borrow a few books to receive personalised recommendations.</p></div>`;
    return;
  }

  container.innerHTML = state.recommendations.map(r => `
    <div class="glass-panel book-card">
      <div class="recommendation-badge">Match Score: +${r.score}</div>
      <div class="book-category-tag">${escapeHtml(r.category_name)}</div>
      <h3 class="book-card-title">${escapeHtml(r.title)}</h3>
      <p class="book-card-authors">by ${escapeHtml(r.authors)}</p>

      <div class="reason-box">
        💡 <strong>Recommendation Rationale:</strong><br>${escapeHtml(r.reason)}
      </div>

      <div class="card-actions">
        <button class="btn btn-outline btn-sm" onclick="showBookDetails(${r.book_id})">
          View Details
        </button>
        ${r.available_copies > 0
          ? `<button class="btn btn-primary btn-sm" onclick="quickCheckout(${r.book_id}, '${escapeQuote(r.title)}')">Instant Borrow</button>`
          : `<button class="btn btn-primary btn-sm" onclick="placeReservation(${r.book_id}, '${escapeQuote(r.title)}')">Join Queue</button>`}
      </div>
    </div>
  `).join("");
}

// Render Active Loans (students: own loans only; staff: everyone, with return action)
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
    const action = isStaff()
      ? `<button class="btn btn-outline btn-sm" onclick="returnLoan(${l.loan_id}, '${escapeQuote(l.book_title)}')">🔄 Process Return</button>`
      : `<span style="color: var(--text-sub); font-size: 0.8rem;">Return at desk</span>`;

    return `
      <tr>
        <td><strong>#LN-${l.loan_id}</strong></td>
        <td>${escapeHtml(l.student_name)}</td>
        <td><strong>${escapeHtml(l.book_title)}</strong></td>
        <td><code>${escapeHtml(l.barcode)}</code></td>
        <td>${formatDate(l.due_at)}</td>
        <td>${statusPill} ${parseFloat(l.fine_amount) > 0 ? `<span style="color:var(--accent-danger); font-weight:700;">(₹${l.fine_amount})</span>` : ''}</td>
        <td>${action}</td>
      </tr>
    `;
  }).join("");
}

// Render Reservations Queue (students: own; staff: all queues with pickup)
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
    const pickup = isReady && isStaff()
      ? `<button class="btn btn-success btn-sm" onclick="checkoutReadyReservation(${r.reservation_id})">✅ Issue Copy</button>` : "";

    return `
      <tr>
        <td><strong>#RES-${r.reservation_id}</strong></td>
        <td><strong>${escapeHtml(r.book_title)}</strong></td>
        <td>${escapeHtml(r.patron_name)}</td>
        <td>${formatDate(r.reserved_at)}</td>
        <td>${statusPill}</td>
        <td style="display: flex; gap: 0.4rem;">
          ${pickup}
          <button class="btn btn-danger btn-sm" onclick="cancelReservation(${r.reservation_id})">✕ Cancel</button>
        </td>
      </tr>
    `;
  }).join("");
}

// Render user administration table (ADMIN only)
function renderUsers() {
  const tbody = document.getElementById("users-table-body");
  if (!state.currentUser || state.currentUser.role !== "ADMIN") {
    tbody.innerHTML = "";
    return;
  }
  const roles = ["STUDENT", "FACULTY", "LIBRARIAN", "ADMIN"];
  tbody.innerHTML = state.users.map(u => {
    const self = u.user_id === state.currentUser.user_id;
    return `
      <tr>
        <td>${u.user_id}</td>
        <td><strong>${escapeHtml(u.full_name)}</strong></td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.department || "—")}</td>
        <td>${u.open_loans}</td>
        <td>
          <select class="inline-select" ${self ? "disabled" : ""} onchange="updateUser(${u.user_id}, { role: this.value })">
            ${roles.map(r => `<option value="${r}" ${r === u.role ? "selected" : ""}>${r}</option>`).join("")}
          </select>
        </td>
        <td>
          ${self ? `<span class="status-pill status-active">YOU</span>` : `
          <button class="btn btn-sm ${u.is_active ? "btn-outline" : "btn-success"}" onclick="updateUser(${u.user_id}, { is_active: ${!u.is_active} })">
            ${u.is_active ? "Deactivate" : "Activate"}
          </button>`}
        </td>
      </tr>`;
  }).join("");
}

// Render the Add Book tab (ADMIN only): dropdowns, datalists and recent titles
function renderAddBook() {
  if (!state.currentUser || state.currentUser.role !== "ADMIN") return;
  const opts = state.catalogOptions;
  const category = document.getElementById("nb-category");
  const chosen = category.value;
  category.innerHTML = `<option value="">Select a category</option>` +
    opts.categories.map(c => `<option value="${c.category_id}">${escapeHtml(c.category_name)}</option>`).join("");
  category.value = chosen;
  document.getElementById("publisher-options").innerHTML = opts.publishers.map(p => `<option value="${escapeHtml(p)}">`).join("");
  document.getElementById("author-options").innerHTML = opts.authors.map(a => `<option value="${escapeHtml(a)}">`).join("");

  const bookSelect = document.getElementById("ac-book");
  const picked = bookSelect.value;
  bookSelect.innerHTML = [...state.books].sort((a, b) => a.title.localeCompare(b.title))
    .map(b => `<option value="${b.book_id}">${escapeHtml(b.title)} (${b.total_copies} copies)</option>`).join("");
  if (picked) bookSelect.value = picked;

  document.getElementById("recent-books-body").innerHTML = opts.recent.map(b => `
    <tr>
      <td>${b.book_id}</td>
      <td><strong>${escapeHtml(b.title)}</strong></td>
      <td>${escapeHtml(b.authors)}</td>
      <td>${b.available_copies} / ${b.total_copies}</td>
    </tr>`).join("");
}

function setupAdminBookForms() {
  document.getElementById("add-book-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = id => document.getElementById(id).value;
    try {
      const res = await api("/api/admin/books", {
        method: "POST",
        body: {
          title: value("nb-title"), isbn: value("nb-isbn"), publication_year: value("nb-year"),
          category_id: value("nb-category"), publisher: value("nb-publisher"), authors: value("nb-authors"),
          copies: value("nb-copies"), shelf_location: value("nb-shelf"), description: value("nb-description")
        }
      });
      showToast(`Published "${value("nb-title")}" with ${res.barcodes.length} copies (${res.barcodes[0]} …).`, "success");
      e.target.reset();
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  document.getElementById("add-copies-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const bookId = document.getElementById("ac-book").value;
    try {
      const res = await api(`/api/admin/books/${bookId}/copies`, {
        method: "POST",
        body: { copies: document.getElementById("ac-copies").value, shelf_location: document.getElementById("ac-shelf").value }
      });
      showToast(`Added ${res.barcodes.length} copies: ${res.barcodes.join(", ")}`, "success");
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

// Render Management Stats
function renderStats() {
  document.getElementById("stat-total-titles").innerText = state.stats.total_titles ?? 0;
  document.getElementById("stat-total-copies").innerText = state.stats.total_copies ?? 0;
  document.getElementById("stat-active-loans").innerText = state.stats.active_loans ?? 0;
  document.getElementById("stat-reservations").innerText = state.stats.reservations ?? 0;
}

// ----------------------------------------------------------------------------
// Actions (each maps to a stored procedure or constrained write in PostgreSQL)
// ----------------------------------------------------------------------------
async function quickCheckout(bookId, title) {
  try {
    const res = await api("/api/loans/checkout", { method: "POST", body: { book_id: bookId } });
    showToast(`[sp_checkout_book] Borrowed "${title}" (Copy: ${res.barcode})`, "success");
    loadData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function placeReservation(bookId, title) {
  try {
    const res = await api("/api/reservations", { method: "POST", body: { book_id: bookId } });
    showToast(`[Queue Position #${res.queue_position}] Joined reservation queue for "${title}".`, "info");
    loadData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function returnLoan(loanId, title) {
  try {
    await api(`/api/loans/${loanId}/return`, { method: "POST" });
    showToast(`[sp_return_book] Returned "${title}". Queue advanced if anyone was waiting.`, "success");
    loadData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function cancelReservation(resId) {
  try {
    await api(`/api/reservations/${resId}`, { method: "DELETE" });
    showToast(`Reservation #RES-${resId} cancelled.`, "info");
    loadData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function checkoutReadyReservation(resId) {
  try {
    await api(`/api/reservations/${resId}/pickup`, { method: "POST" });
    showToast(`Reserved copy issued for #RES-${resId}. Checkout completed!`, "success");
    loadData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function updateUser(userId, changes) {
  try {
    await api(`/api/admin/users/${userId}`, { method: "PATCH", body: changes });
    showToast(`User #${userId} updated.`, "success");
    loadData();
  } catch (err) {
    showToast(err.message, "error");
    loadData();
  }
}

// Modal Inspect Copies (live rows from book_copies)
async function showBookDetails(bookId) {
  const book = state.books.find(b => b.book_id === bookId);
  if (!book) return;

  const modal = document.getElementById("book-modal");
  document.getElementById("modal-title").innerText = book.title;
  document.getElementById("modal-authors").innerText = `by ${book.authors} (${book.publication_year})`;
  document.getElementById("modal-desc").innerText = book.description || "";
  document.getElementById("modal-isbn").innerText = book.isbn;
  document.getElementById("modal-publisher").innerText = book.publisher_name || "N/A";
  document.getElementById("modal-category").innerText = book.category_name;

  const copiesContainer = document.getElementById("modal-copies-list");
  copiesContainer.innerHTML = `<p style="color: var(--text-muted);">Loading copies…</p>`;
  modal.classList.add("active");

  try {
    const data = await api(`/api/books/${bookId}/inventory`);
    const pill = { AVAILABLE: "status-active", LOANED: "status-overdue", RESERVED: "status-ready" };
    copiesContainer.innerHTML = data.copies.map(c => `
      <div style="background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-glass); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>Barcode: ${escapeHtml(c.barcode)}</strong><br>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(c.shelf_location)}</span>
        </div>
        <span class="status-pill ${pill[c.status] || 'status-returned'}">${c.status}</span>
      </div>
    `).join("") || `<p style="color: var(--text-muted);">No physical copies registered.</p>`;
  } catch (err) {
    copiesContainer.innerHTML = `<p style="color: var(--accent-danger);">${escapeHtml(err.message)}</p>`;
  }
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
    <span>${escapeHtml(message)}</span>
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

// For values placed inside '...' in an onclick attribute: JS-escape first, then HTML-escape.
function escapeQuote(str) {
  return escapeHtml((str || '').replace(/\\/g, "\\\\").replace(/'/g, "\\'"));
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, ch =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d) ? value : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function debounce(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}
