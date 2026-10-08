/**
 * ============================================================
 * MADHU BOOKHUB — Catalog Discovery & Inventory Controller
 * File: frontend/js/books.js
 *
 * WHAT: Dual Grid/Table views, dynamic 3D book covers, multi-facet
 *       filtering, debounced search, sorting, and deletion workflows.
 * WHY:  Production-grade book management experience.
 * HOW:  Calls /api/books with dynamic query parameters.
 * ============================================================
 */

'use strict';

// ── State Management ──────────────────────────────────────────
let currentViewMode   = localStorage.getItem('madhu_bookhub_view_mode') || 'grid';
let deleteTargetId    = null;
let deleteTargetTitle = '';
let searchDebounce    = null;
let cachedBooks       = [];

// ── Initialization ────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initDynamicYear();
  initViewSwitcher();
  initUrlParameters();
  populateCategoryDropdown();
  initFilterListeners();
  initDeleteModal();
  loadCatalog();
});

function initDynamicYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/** Check URL query parameters (e.g. ?category=Science or ?stock_status=low) */
function initUrlParameters() {
  const params = new URLSearchParams(window.location.search);

  const searchParam = params.get('search');
  if (searchParam) {
    const el = document.getElementById('search-input');
    if (el) el.value = searchParam;
  }

  const categoryParam = params.get('category');
  if (categoryParam) {
    const el = document.getElementById('category-filter');
    if (el) el.value = categoryParam;
  }

  const stockParam = params.get('stock_status');
  if (stockParam) {
    const el = document.getElementById('stock-filter');
    if (el) el.value = stockParam;
  }

  const sortParam = params.get('sort');
  if (sortParam) {
    const el = document.getElementById('sort-select');
    if (el) el.value = sortParam;
  }

  const viewParam = params.get('view');
  if (viewParam === 'grid' || viewParam === 'table') {
    setViewMode(viewParam);
  } else {
    setViewMode(currentViewMode);
  }
}

// ── View Mode Switcher (Grid vs Table) ─────────────────────────

function initViewSwitcher() {
  const gridBtn  = document.getElementById('view-grid-btn');
  const tableBtn = document.getElementById('view-table-btn');

  gridBtn?.addEventListener('click', () => setViewMode('grid'));
  tableBtn?.addEventListener('click', () => setViewMode('table'));
}

function setViewMode(mode) {
  currentViewMode = mode;
  localStorage.setItem('madhu_bookhub_view_mode', mode);

  const gridContainer  = document.getElementById('books-grid-container');
  const tableContainer = document.getElementById('books-table-container');
  const gridBtn        = document.getElementById('view-grid-btn');
  const tableBtn       = document.getElementById('view-table-btn');

  if (mode === 'grid') {
    if (gridContainer)  gridContainer.style.display = 'grid';
    if (tableContainer) tableContainer.style.display = 'none';
    gridBtn?.classList.add('active');
    gridBtn?.setAttribute('aria-pressed', 'true');
    tableBtn?.classList.remove('active');
    tableBtn?.setAttribute('aria-pressed', 'false');
  } else {
    if (gridContainer)  gridContainer.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';
    tableBtn?.classList.add('active');
    tableBtn?.setAttribute('aria-pressed', 'true');
    gridBtn?.classList.remove('active');
    gridBtn?.setAttribute('aria-pressed', 'false');
  }

  // Re-render if books are already loaded
  if (cachedBooks && cachedBooks.length > 0) {
    renderBooks(cachedBooks);
  }
}

// ── Load Catalog from API ─────────────────────────────────────

async function loadCatalog() {
  showLoading();
  const filters = getFilterParams();

  try {
    const res = await api.getBooks(filters);
    cachedBooks = res.data || [];
    renderBooks(cachedBooks);
    updateResultCount(res.count);
    updateSidebarNavCount(res.count);
    toggleClearFiltersButton();
  } catch (err) {
    showError(err.message || 'Unable to connect to the book catalog service.');
  }
}

function getFilterParams() {
  const params = {};
  const search = document.getElementById('search-input')?.value.trim();
  const cat    = document.getElementById('category-filter')?.value;
  const stock  = document.getElementById('stock-filter')?.value;
  const sort   = document.getElementById('sort-select')?.value;

  if (search) params.search = search;
  if (cat)    params.category = cat;
  if (stock)  params.stock_status = stock;
  if (sort)   params.sort = sort;

  return params;
}

// ── Render Books Dispatcher ───────────────────────────────────

function renderBooks(books) {
  if (currentViewMode === 'grid') {
    renderGridView(books);
  } else {
    renderTableView(books);
  }
}

// ── Render Grid View (Flagship 3D Covers) ──────────────────────

function renderGridView(books) {
  const container = document.getElementById('books-grid-container');
  if (!container) return;

  if (!books || books.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No books match your criteria</div>
        <div class="empty-desc">
          Try loosening your search keywords or resetting filters.<br>
          Or <a href="add-book.html">add a new book title</a> to the store.
        </div>
        <button class="btn btn-secondary mt-3" onclick="resetFilters()">Reset All Filters</button>
      </div>`;
    return;
  }

  container.innerHTML = books.map(book => {
    const coverHtml = typeof BookCover !== 'undefined'
      ? BookCover.render(book, { size: 'md' })
      : `<div class="td-id">#${book.book_id}</div>`;

    const stockNum = parseInt(book.stock, 10);
    const stockBadge = stockNum === 0
      ? '<span class="badge badge-danger">Out of Stock</span>'
      : stockNum < 5
      ? `<span class="badge badge-warning">Low: ${stockNum} left</span>`
      : `<span class="badge badge-success">${stockNum} in stock</span>`;

    return `
      <article class="book-card" data-book-id="${book.book_id}">
        <!-- Cover Stage -->
        <div class="card-cover-stage">
          ${coverHtml}
        </div>

        <!-- Card Content -->
        <div class="card-content">
          <div class="card-category-row">
            <span class="badge badge-primary">${escapeHtml(book.category)}</span>
            ${stockBadge}
          </div>

          <h3 class="card-title" title="${escapeHtml(book.title)}">
            <a href="view-book.html?id=${book.book_id}" style="color:inherit; text-decoration:none;">
              ${escapeHtml(book.title)}
            </a>
          </h3>

          <button
            type="button"
            class="card-author-link"
            style="background:none; border:none; padding:0; font:inherit; text-align:left;"
            onclick="openAuthorModal('${escapeHtml(book.author)}')">
            by ${escapeHtml(book.author)}
          </button>

          <div class="card-bottom-row">
            <span class="card-price">$${parseFloat(book.price).toFixed(2)}</span>
            <div class="card-actions">
              <a href="view-book.html?id=${book.book_id}" class="btn btn-secondary btn-sm" title="View details">
                View
              </a>
              <a href="edit-book.html?id=${book.book_id}" class="btn btn-secondary btn-sm" title="Edit book">
                Edit
              </a>
              <button
                type="button"
                class="btn btn-danger btn-sm"
                title="Delete book"
                onclick="openDeleteModal(${book.book_id}, ${JSON.stringify(escapeHtml(book.title))})">
                🗑
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// ── Render Table View (Enterprise Data Grid) ──────────────────

function renderTableView(books) {
  const tbody = document.getElementById('books-table-body');
  if (!tbody) return;

  if (!books || books.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <div class="empty-title">No books match your criteria</div>
            <div class="empty-desc">
              Try adjusting your search query or filters.
            </div>
            <button class="btn btn-secondary mt-3" onclick="resetFilters()">Reset All Filters</button>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = books.map(book => {
    const coverHtml = typeof BookCover !== 'undefined'
      ? BookCover.render(book, { size: 'sm' })
      : `<span class="td-id">#${book.book_id}</span>`;

    const stockNum = parseInt(book.stock, 10);
    const stockPill = stockNum === 0
      ? '<span class="badge badge-danger">Out of Stock</span>'
      : stockNum < 5
      ? `<span class="badge badge-warning">Low: ${stockNum}</span>`
      : `<span class="badge badge-success">${stockNum} Units</span>`;

    return `
      <tr>
        <td style="width: 50px;">
          ${coverHtml}
        </td>
        <td><span class="td-id">#${book.book_id}</span></td>
        <td>
          <div class="td-title">
            <a href="view-book.html?id=${book.book_id}" style="color:inherit; text-decoration:none;">
              ${escapeHtml(book.title)}
            </a>
          </div>
        </td>
        <td>
          <button
            type="button"
            class="td-author"
            style="background:none; border:none; padding:0; font:inherit;"
            onclick="openAuthorModal('${escapeHtml(book.author)}')">
            ${escapeHtml(book.author)}
          </button>
        </td>
        <td>
          <span class="badge badge-primary">${escapeHtml(book.category)}</span>
        </td>
        <td>
          <span class="price-text">$${parseFloat(book.price).toFixed(2)}</span>
        </td>
        <td>
          ${stockPill}
        </td>
        <td style="text-align: right;">
          <div style="display:inline-flex; gap:0.375rem;">
            <a href="view-book.html?id=${book.book_id}" class="btn btn-secondary btn-sm" title="View details">
              View
            </a>
            <a href="edit-book.html?id=${book.book_id}" class="btn btn-secondary btn-sm" title="Edit book">
              Edit
            </a>
            <button
              type="button"
              class="btn btn-danger btn-sm"
              title="Delete book"
              onclick="openDeleteModal(${book.book_id}, ${JSON.stringify(escapeHtml(book.title))})">
              🗑
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── Search & Filter Listeners ─────────────────────────────────

function initFilterListeners() {
  const searchInput    = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const stockFilter    = document.getElementById('stock-filter');
  const sortSelect     = document.getElementById('sort-select');
  const clearBtn       = document.getElementById('clear-filters-btn');

  // Debounced search (250ms)
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(loadCatalog, 250);
  });

  categoryFilter?.addEventListener('change', loadCatalog);
  stockFilter?.addEventListener('change', loadCatalog);
  sortSelect?.addEventListener('change', loadCatalog);
  clearBtn?.addEventListener('click', resetFilters);
}

function resetFilters() {
  const sInput = document.getElementById('search-input');
  const cSelect = document.getElementById('category-filter');
  const stSelect = document.getElementById('stock-filter');
  const soSelect = document.getElementById('sort-select');

  if (sInput)  sInput.value = '';
  if (cSelect) cSelect.value = '';
  if (stSelect) stSelect.value = '';
  if (soSelect) soSelect.value = 'newest';

  loadCatalog();
}

function toggleClearFiltersButton() {
  const clearBtn = document.getElementById('clear-filters-btn');
  const s = document.getElementById('search-input')?.value.trim();
  const c = document.getElementById('category-filter')?.value;
  const st = document.getElementById('stock-filter')?.value;

  if (clearBtn) {
    clearBtn.style.display = (s || c || st) ? 'inline-flex' : 'none';
  }
}

// ── Populate Dynamic Categories from DB ───────────────────────

async function populateCategoryDropdown() {
  try {
    const res = await api.getCategories();
    const categories = res.data || [];
    const select = document.getElementById('category-filter');
    if (!select || categories.length === 0) return;

    const currentVal = select.value;
    const optionsHtml = categories.map(c => `
      <option value="${escapeHtml(c.category)}">
        ${escapeHtml(c.category)} (${c.count})
      </option>
    `).join('');

    select.innerHTML = `<option value="">All Categories</option>${optionsHtml}`;
    if (currentVal) select.value = currentVal;
  } catch (e) {
    // Non-blocking fallback
  }
}

// ── Loading & Error States ────────────────────────────────────

function showLoading() {
  const gridContainer = document.getElementById('books-grid-container');
  const tableBody     = document.getElementById('books-table-body');

  if (gridContainer) {
    gridContainer.innerHTML = `
      <div class="loading-wrap" style="grid-column: 1 / -1;">
        <div class="spinner"></div>
        <span>Searching inventory...</span>
      </div>`;
  }
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="loading-wrap">
            <div class="spinner"></div>
            <span>Searching inventory...</span>
          </div>
        </td>
      </tr>`;
  }
}

function showError(msg) {
  const gridContainer = document.getElementById('books-grid-container');
  const tableBody     = document.getElementById('books-table-body');

  const errorHtml = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <div class="empty-title">Catalog Unavailable</div>
      <div class="empty-desc">${escapeHtml(msg)}</div>
      <button class="btn btn-secondary mt-3" onclick="loadCatalog()">Retry</button>
    </div>`;

  if (gridContainer) gridContainer.innerHTML = `<div style="grid-column:1 / -1;">${errorHtml}</div>`;
  if (tableBody) tableBody.innerHTML = `<tr><td colspan="8">${errorHtml}</td></tr>`;
}

function updateResultCount(count) {
  const el = document.getElementById('result-count');
  if (el) {
    el.textContent = `${count} ${count === 1 ? 'book' : 'books'} found`;
  }
}

function updateSidebarNavCount(count) {
  const el = document.getElementById('nav-book-count');
  if (el) el.textContent = count;
}

// ── Delete Modal Execution ────────────────────────────────────

function openDeleteModal(id, title) {
  deleteTargetId = id;
  deleteTargetTitle = title;

  const nameEl = document.getElementById('delete-book-name');
  if (nameEl) nameEl.textContent = `"${title}" (#${id})`;

  const overlay = document.getElementById('delete-overlay');
  if (overlay) overlay.classList.add('show');
}

function closeDeleteModal() {
  const overlay = document.getElementById('delete-overlay');
  if (overlay) overlay.classList.remove('show');
  deleteTargetId = null;
}

function initDeleteModal() {
  const confirmBtn = document.getElementById('confirm-delete-btn');
  const cancelBtn  = document.getElementById('cancel-delete-btn');
  const overlay    = document.getElementById('delete-overlay');

  confirmBtn?.addEventListener('click', async () => {
    if (!deleteTargetId) return;

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';

    try {
      const res = await api.deleteBook(deleteTargetId);
      closeDeleteModal();
      toast.success(res.message || 'Book deleted from store successfully.');
      await loadCatalog();
    } catch (err) {
      closeDeleteModal();
      toast.error(err.message || 'Failed to delete book.');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete Book';
    }
  });

  cancelBtn?.addEventListener('click', closeDeleteModal);

  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeDeleteModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDeleteModal();
  });
}
