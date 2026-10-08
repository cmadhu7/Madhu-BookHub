/**
 * ============================================================
 * MADHU BOOKHUB — Central API Layer
 * File: frontend/js/api.js
 *
 * CONCEPT: Fetch API + DRY Principle
 * Instead of writing fetch() in every JS file, we create
 * ONE central function. Every page imports this file and
 * uses api.getBooks(), api.createBook(), etc.
 *
 * This is the "DRY" principle: Don't Repeat Yourself.
 *
 * Architecture:
 *   Page JS file
 *       ↓ calls api.createBook(data)
 *   api.js → fetch('/api/books', { method: 'POST', ... })
 *       ↓
 *   Express backend → Controller → MySQL
 *       ↑
 *   JSON response returned to page JS
 * ============================================================
 */

'use strict';

// ── Base URL ──────────────────────────────────────────────────
// Since Express serves our frontend, relative paths work.
// /api maps to http://localhost:3000/api on the same server.
const API_BASE = '/api';

// ── Core Request Function ─────────────────────────────────────
/**
 * Makes a fetch request and returns parsed JSON.
 * Throws an Error if the HTTP response status is not 2xx.
 *
 * @param {string} method    - HTTP method: 'GET', 'POST', 'PUT', 'DELETE'
 * @param {string} endpoint  - API path, e.g. '/books' or '/books/5'
 * @param {object|null} body - Request body for POST/PUT (will be JSON-encoded)
 * @returns {Promise<object>} Parsed JSON response
 */
async function request(method, endpoint, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  // Only include a body for POST and PUT requests
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(API_BASE + endpoint, options);
  } catch (networkError) {
    // This happens if the server is completely unreachable
    const err = new Error('Unable to connect to the server. Is it running?');
    err.status = 0;
    throw err;
  }

  const data = await response.json();

  // If HTTP status is not OK (not 2xx), throw an error
  if (!response.ok) {
    const err = new Error(data.message || 'An unexpected server error occurred.');
    err.errors = data.errors || [];
    err.status  = response.status;
    throw err;
  }

  return data;
}

// ── Public API Object ─────────────────────────────────────────
/**
 * All book-related API calls are methods on this object.
 * Usage in any page JS file:
 *   const result = await api.getBooks({ search: 'python' });
 */
const api = {
  /**
   * Get all books. Supports optional filters.
   * @param {object} params - e.g. { search: 'python', category: 'Programming' }
   */
  getBooks(params = {}) {
    // URLSearchParams converts { search: 'js' } → '?search=js'
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/books${qs ? '?' + qs : ''}`);
  },

  /** Get a single book by numeric ID */
  getBook(id) {
    return request('GET', `/books/${id}`);
  },

  /**
   * Create a new book
   * @param {object} data - { title, author, category, price, stock }
   */
  createBook(data) {
    return request('POST', '/books', data);
  },

  /**
   * Update an existing book
   * @param {number|string} id   - Book ID
   * @param {object}        data - Updated fields
   */
  updateBook(id, data) {
    return request('PUT', `/books/${id}`, data);
  },

  /** Delete a book by ID */
  deleteBook(id) {
    return request('DELETE', `/books/${id}`);
  },

  /** Get dashboard statistics */
  getStats() {
    return request('GET', '/stats');
  },

  /** Get category distribution & analytics */
  getCategories() {
    return request('GET', '/categories');
  },

  /** Get author profile & bibliography */
  getAuthor(author) {
    return request('GET', `/authors/${encodeURIComponent(author)}`);
  },

  /** Healthcheck with ping latency measurement */
  async checkHealth() {
    const start = performance.now();
    try {
      const res = await request('GET', '/health');
      const latency = Math.round(performance.now() - start);
      return { ...res, latency, online: true };
    } catch (e) {
      return { online: false, latency: 0, status: 'offline' };
    }
  },
};

// ── Toast Notification System ─────────────────────────────────
/**
 * CONCEPT: Non-blocking user feedback
 * Toasts are small popups that appear briefly at the bottom-right.
 * They tell the user what happened without interrupting their flow.
 */
const toast = {
  icons: { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' },

  /**
   * Show a toast notification.
   * @param {string} message  - Text to display
   * @param {string} type     - 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - Auto-dismiss time in ms (default: 4000)
   */
  show(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${this.icons[type] || this.icons.info}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Dismiss notification">✕</button>
    `;

    // Close button
    el.querySelector('.toast-close').addEventListener('click', () => this._remove(el));

    container.appendChild(el);

    // Auto-remove after duration
    setTimeout(() => this._remove(el), duration);
  },

  _remove(el) {
    if (!el.parentElement) return; // Already removed
    el.classList.add('removing');
    setTimeout(() => el.remove(), 300);
  },

  success(msg, duration)  { this.show(msg, 'success', duration); },
  error(msg, duration)    { this.show(msg, 'error',   duration || 6000); },
  warning(msg, duration)  { this.show(msg, 'warning', duration); },
  info(msg, duration)     { this.show(msg, 'info',    duration); },
};

// ── Shared Utilities ──────────────────────────────────────────

/**
 * Escape HTML special characters to prevent XSS attacks.
 * XSS (Cross-Site Scripting) is when malicious code is injected
 * into a page via user input. Always escape user data before
 * inserting it into the DOM with innerHTML.
 */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

/**
 * Format a date string into a readable format.
 * e.g. "2024-05-15T10:30:00Z" → "May 15, 2024"
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Mobile Sidebar Toggle ─────────────────────────────────────
/**
 * CONCEPT: Mobile-first responsive navigation
 * On small screens the sidebar is hidden off-screen.
 * The hamburger button slides it in. Clicking the overlay
 * (dark background) closes it.
 */
function initSidebar() {
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebar-overlay');

  if (!hamburger || !sidebar) return;

  const open = () => {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
  };

  const close = () => {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  };

  hamburger.addEventListener('click', open);
  if (overlay) overlay.addEventListener('click', close);

  // Close sidebar on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) close();
  });
}

// Run sidebar initialization when the DOM is ready
document.addEventListener('DOMContentLoaded', initSidebar);

// ── Global Author Modal System ────────────────────────────────
/**
 * Displays author information, verified inventory catalog metrics,
 * and list of titles written by this author in the store.
 */
async function openAuthorModal(authorName) {
  if (!authorName) return;
  let modalOverlay = document.getElementById('author-modal-overlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'author-modal-overlay';
    modalOverlay.className = 'overlay';
    modalOverlay.setAttribute('role', 'dialog');
    modalOverlay.setAttribute('aria-modal', 'true');
    modalOverlay.innerHTML = `
      <div class="modal modal-lg author-modal">
        <button class="modal-close-btn" id="close-author-modal-btn" aria-label="Close author modal">✕</button>
        <div id="author-modal-content">
          <div class="loading-wrap">
            <div class="spinner"></div>
            <span>Loading author profile...</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeAuthorModal();
    });
    document.getElementById('close-author-modal-btn')?.addEventListener('click', closeAuthorModal);
  }

  modalOverlay.classList.add('show');
  const content = document.getElementById('author-modal-content');
  content.innerHTML = `
    <div class="loading-wrap" style="padding: 2.5rem 0;">
      <div class="spinner"></div>
      <span>Loading catalog data for ${escapeHtml(authorName)}...</span>
    </div>
  `;

  try {
    const res = await api.getAuthor(authorName);
    const data = res.data;
    const stats = data.stats;
    const books = data.books;

    const avatarHtml = typeof BookCover !== 'undefined'
      ? BookCover.renderAuthorAvatar(data.author, 64)
      : `<div class="author-avatar">${escapeHtml(data.author.slice(0, 2))}</div>`;

    const booksListHtml = books.map(b => {
      const coverHtml = typeof BookCover !== 'undefined'
        ? BookCover.render(b, { size: 'sm' })
        : '';
      const stockBadge = b.stock === 0
        ? '<span class="badge badge-danger">Out of Stock</span>'
        : b.stock < 5
        ? `<span class="badge badge-warning">Low: ${b.stock} left</span>`
        : `<span class="badge badge-success">In Stock (${b.stock})</span>`;

      return `
        <div class="author-book-item">
          ${coverHtml}
          <div class="author-book-info">
            <h4 class="author-book-title">${escapeHtml(b.title)}</h4>
            <div class="author-book-meta">
              <span class="badge badge-primary">${escapeHtml(b.category)}</span>
              <span class="author-book-price">$${parseFloat(b.price).toFixed(2)}</span>
              ${stockBadge}
            </div>
          </div>
          <div class="author-book-actions">
            <a href="view-book.html?id=${b.book_id}" class="btn btn-secondary btn-sm">View Details</a>
          </div>
        </div>
      `;
    }).join('');

    content.innerHTML = `
      <div class="author-profile-header">
        ${avatarHtml}
        <div class="author-profile-title">
          <span class="badge badge-primary" style="margin-bottom:0.25rem;">VERIFIED CATALOG AUTHOR</span>
          <h2 class="author-name-heading">${escapeHtml(data.author)}</h2>
          <p class="author-meta-sub">Official inventory contributor to Madhu BookHub</p>
        </div>
      </div>

      <div class="author-stats-row">
        <div class="author-stat-pill">
          <span class="author-stat-val">${stats.total_books}</span>
          <span class="author-stat-lbl">Titles in Catalog</span>
        </div>
        <div class="author-stat-pill">
          <span class="author-stat-val">${stats.total_stock}</span>
          <span class="author-stat-lbl">Total Stock Units</span>
        </div>
        <div class="author-stat-pill">
          <span class="author-stat-val">$${parseFloat(stats.avg_price).toFixed(2)}</span>
          <span class="author-stat-lbl">Average Price</span>
        </div>
      </div>

      <div class="author-books-section">
        <h3 class="author-books-heading">Books by ${escapeHtml(data.author)} in Store (${books.length})</h3>
        <div class="author-books-list">
          ${booksListHtml}
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Author Profile Unavailable</div>
        <div class="empty-desc">${escapeHtml(err.message || 'Could not load author records.')}</div>
        <button class="btn btn-secondary mt-3" onclick="closeAuthorModal()">Close</button>
      </div>
    `;
  }
}

function closeAuthorModal() {
  const modal = document.getElementById('author-modal-overlay');
  if (modal) modal.classList.remove('show');
}

// Close author modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAuthorModal();
});
