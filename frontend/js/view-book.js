/**
 * ============================================================
 * MADHU BOOKHUB — Book Details Showcase Controller
 * File: frontend/js/view-book.js
 *
 * WHAT: Full editorial presentation of a book, cover art,
 *       stock levels, metadata, related category titles, and actions.
 * WHY:  Read (R) showcase in CRUD with editorial fidelity.
 * HOW:  GET /api/books/:id + GET /api/books?category=...
 * ============================================================
 */

'use strict';

let currentBookId = null;
let currentBook   = null;

document.addEventListener('DOMContentLoaded', async () => {
  initDynamicYear();
  const params = new URLSearchParams(window.location.search);
  currentBookId = params.get('id');

  if (!currentBookId || isNaN(parseInt(currentBookId, 10))) {
    showError('Invalid book ID. Please return to the catalog and choose a valid book.');
    return;
  }

  await loadBookDetails(currentBookId);
  initDeleteModal();
});

function initDynamicYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// ── Load Book Details ─────────────────────────────────────────

async function loadBookDetails(id) {
  showLoading();
  try {
    const res = await api.getBook(id);
    currentBook = res.data;
    renderBookShowcase(currentBook);
    loadRelatedBooks(currentBook.category, currentBook.book_id);
  } catch (err) {
    if (err.status === 404) {
      showError(`Book #${id} could not be found. It may have been removed from inventory.`);
    } else {
      showError('Unable to load book profile. Please ensure the server is running.');
    }
  }
}

// ── Render Showcase ───────────────────────────────────────────

function renderBookShowcase(book) {
  const container = document.getElementById('book-showcase-container');
  const titleEl   = document.getElementById('page-book-title');
  if (!container) return;

  if (titleEl) titleEl.textContent = book.title;

  const coverHtml = typeof BookCover !== 'undefined'
    ? BookCover.render(book, { size: 'lg' })
    : `<div class="td-id" style="font-size:2rem; padding:2rem;">#${book.book_id}</div>`;

  const stockNum = parseInt(book.stock, 10);
  const stockLabel = stockNum === 0
    ? 'Out of Stock'
    : stockNum < 5
    ? `Low Stock Attention (${stockNum} units remaining)`
    : `In Stock (${stockNum} units available)`;

  const stockBadgeClass = stockNum === 0
    ? 'badge-danger'
    : stockNum < 5
    ? 'badge-warning'
    : 'badge-success';

  container.innerHTML = `
    <article class="view-book-showcase">
      <!-- Left Column: Physical Cover Showcase -->
      <div class="showcase-cover-column">
        ${coverHtml}
      </div>

      <!-- Right Column: Metadata & Controls -->
      <div class="showcase-details-column">
        <div class="showcase-header-row">
          <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
            <span class="badge badge-primary">${escapeHtml(book.category)}</span>
            <span class="badge ${stockBadgeClass}">${stockLabel}</span>
            <span class="td-id">Catalog ID: #${book.book_id}</span>
          </div>
        </div>

        <h2 class="showcase-title">${escapeHtml(book.title)}</h2>

        <div class="showcase-author-bar">
          by <button
            type="button"
            class="td-author"
            style="background:none; border:none; padding:0; font-size:1.0625rem; font-weight:700; cursor:pointer;"
            onclick="openAuthorModal('${escapeHtml(book.author)}')">
            ${escapeHtml(book.author)}
          </button>
        </div>

        <!-- Metadata Metrics Grid -->
        <div class="meta-stats-grid">
          <div class="meta-stat-item">
            <span class="meta-stat-lbl">Retail Price</span>
            <span class="meta-stat-val" style="color:var(--color-brand-royal);">$${parseFloat(book.price).toFixed(2)}</span>
          </div>

          <div class="meta-stat-item">
            <span class="meta-stat-lbl">Warehouse Stock</span>
            <span class="meta-stat-val">${stockNum} Copies</span>
          </div>

          <div class="meta-stat-item">
            <span class="meta-stat-lbl">Catalog Entry Date</span>
            <span style="font-size:0.875rem; font-weight:600; color:var(--color-text-secondary); margin-top:2px;">
              ${formatDate(book.created_at)}
            </span>
          </div>

          <div class="meta-stat-item">
            <span class="meta-stat-lbl">Last Modified</span>
            <span style="font-size:0.875rem; font-weight:600; color:var(--color-text-secondary); margin-top:2px;">
              ${formatDate(book.updated_at)}
            </span>
          </div>
        </div>

        <!-- Inventory Health Bar -->
        <div style="margin-bottom:1.5rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.8125rem; font-weight:600; margin-bottom:0.25rem;">
            <span>Stock Health Status</span>
            <span style="color:var(--color-text-muted);">${stockNum} units in warehouse</span>
          </div>
          <div class="cat-progress-track">
            <div class="cat-progress-fill" style="width: ${Math.min(100, Math.max(8, (stockNum / 30) * 100))}%; background:${stockNum < 5 ? '#D97706' : stockNum === 0 ? '#DC2626' : '#059669'};"></div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions" style="margin-top:auto; padding-top:1.5rem;">
          <a href="edit-book.html?id=${book.book_id}" class="btn btn-primary btn-lg">
            ✏ Edit Book Details
          </a>
          <button type="button" class="btn btn-danger btn-lg" onclick="openDeleteModal(${book.book_id}, ${JSON.stringify(escapeHtml(book.title))})">
            🗑 Delete Book
          </button>
          <a href="books.html" class="btn btn-secondary btn-lg">
            &larr; Back to Catalog
          </a>
        </div>
      </div>
    </article>
  `;
}

// ── Related Books in Same Category ────────────────────────────

async function loadRelatedBooks(category, currentId) {
  if (!category) return;
  try {
    const res = await api.getBooks({ category });
    const related = (res.data || []).filter(b => b.book_id !== currentId).slice(0, 4);

    const section = document.getElementById('related-books-section');
    const grid    = document.getElementById('related-books-grid');

    if (!section || !grid || related.length === 0) return;

    section.style.display = 'block';
    grid.innerHTML = related.map(book => {
      const coverHtml = typeof BookCover !== 'undefined'
        ? BookCover.render(book, { size: 'sm' })
        : '';
      return `
        <article class="book-card" style="padding:1rem;">
          <div style="display:flex; gap:0.75rem; align-items:center;">
            ${coverHtml}
            <div>
              <h4 style="font-size:0.875rem; font-weight:700; line-height:1.2; margin-bottom:2px;">
                <a href="view-book.html?id=${book.book_id}" style="color:inherit; text-decoration:none;">
                  ${escapeHtml(book.title)}
                </a>
              </h4>
              <p style="font-size:0.75rem; color:var(--color-text-muted);">${escapeHtml(book.author)}</p>
              <div style="font-weight:700; font-size:0.8125rem; margin-top:4px;">$${parseFloat(book.price).toFixed(2)}</div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  } catch (e) {
    // Non-blocking
  }
}

// ── Loading & Error States ────────────────────────────────────

function showLoading() {
  const container = document.getElementById('book-showcase-container');
  if (container) {
    container.innerHTML = `
      <div class="loading-wrap">
        <div class="spinner"></div>
        <span>Retrieving book profile...</span>
      </div>`;
  }
}

function showError(message) {
  const container = document.getElementById('book-showcase-container');
  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Book Unavailable</div>
        <div class="empty-desc">${escapeHtml(message)}</div>
        <a href="books.html" class="btn btn-secondary mt-3">&larr; Return to Catalog</a>
      </div>`;
  }
}

// ── Delete Flow ───────────────────────────────────────────────

function openDeleteModal(id, title) {
  const nameEl = document.getElementById('delete-book-name');
  if (nameEl) nameEl.textContent = `"${title}" (#${id})`;

  const overlay = document.getElementById('delete-overlay');
  if (overlay) overlay.classList.add('show');
}

function closeDeleteModal() {
  const overlay = document.getElementById('delete-overlay');
  if (overlay) overlay.classList.remove('show');
}

function initDeleteModal() {
  const confirmBtn = document.getElementById('confirm-delete-btn');
  const cancelBtn  = document.getElementById('cancel-delete-btn');
  const overlay    = document.getElementById('delete-overlay');

  confirmBtn?.addEventListener('click', async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';

    try {
      const res = await api.deleteBook(currentBookId);
      closeDeleteModal();
      toast.success(res.message || 'Book deleted successfully.');
      setTimeout(() => {
        window.location.href = 'books.html';
      }, 1200);
    } catch (err) {
      closeDeleteModal();
      toast.error(err.message || 'Failed to delete book.');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete Book';
    }
  });

  cancelBtn?.addEventListener('click', closeDeleteModal);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeDeleteModal();
  });
}
