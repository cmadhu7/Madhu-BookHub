/**
 * ============================================================
 * MADHU BOOKHUB — Executive Dashboard Controller
 * File: frontend/js/dashboard.js
 *
 * WHAT: Orchestrates data loading, real-time KPI metrics,
 *       category analytics distribution, and low-stock alerts.
 * WHY:  Executive presentation layer for inventory management.
 * HOW:  Calls /api/stats and /api/health → populates UI components.
 * ============================================================
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initDynamicYear();
  loadDashboard();
  measureSystemLatency();
});

function initDynamicYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/** Entry point — loads all dashboard data */
async function loadDashboard() {
  showStatsLoading();

  try {
    const res = await api.getStats();
    const stats = res.data;

    renderKpiCards(stats);
    renderRecentBooksTable(stats.recent_books);
    renderCategoryDistribution(stats.category_distribution, stats.total_books);
    renderLowStockAttention(stats.low_stock_books, stats.low_stock_count);
    updateSidebarBadges(stats.total_books, stats.low_stock_count);

  } catch (err) {
    console.error('Dashboard loading failure:', err);
    toast.error(
      err.message || 'Unable to connect to the backend server. Please verify MySQL and Express are active.',
      7000
    );
    showStatsError();
  }
}

// ── KPI Cards Rendering ───────────────────────────────────────

function renderKpiCards(stats) {
  setText('stat-total-books', stats.total_books != null ? stats.total_books.toLocaleString() : '0');
  setText('stat-total-stock', stats.total_stock != null ? Number(stats.total_stock).toLocaleString() : '0');
  setText('stat-categories',  stats.total_categories != null ? stats.total_categories : '0');

  const avgPrice = parseFloat(stats.avg_price || 0).toFixed(2);
  setText('stat-avg-price', `$${avgPrice}`);

  const totalValue = parseFloat(stats.total_inventory_value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  setText('stat-total-value', `$${totalValue}`);

  const lowCount = parseInt(stats.low_stock_count || 0, 10);
  const lowEl = document.getElementById('stat-low-stock');
  if (lowEl) {
    lowEl.textContent = lowCount;
    if (lowCount > 0) {
      lowEl.style.color = '#DC2626';
    }
  }
}

function showStatsLoading() {
  ['stat-total-books', 'stat-total-stock', 'stat-total-value', 'stat-categories', 'stat-avg-price', 'stat-low-stock']
    .forEach(id => setText(id, '—'));
}

function showStatsError() {
  ['stat-total-books', 'stat-total-stock', 'stat-total-value', 'stat-categories', 'stat-avg-price', 'stat-low-stock']
    .forEach(id => setText(id, 'Err'));
}

// ── Sidebar Badges ───────────────────────────────────────────

function updateSidebarBadges(totalBooks, lowStockCount) {
  const countEl = document.getElementById('nav-book-count');
  if (countEl && totalBooks != null) {
    countEl.textContent = totalBooks;
  }

  const alertBadge = document.getElementById('nav-alert-count');
  if (alertBadge) {
    const count = parseInt(lowStockCount || 0, 10);
    if (count > 0) {
      alertBadge.textContent = count;
      alertBadge.style.display = 'inline-block';
    } else {
      alertBadge.style.display = 'none';
    }
  }
}

// ── Low Stock Attention Section ──────────────────────────────

function renderLowStockAttention(lowStockBooks, lowStockCount) {
  const container = document.getElementById('inventory-attention-container');
  const chipsContainer = document.getElementById('attention-books-chips');
  const count = parseInt(lowStockCount || 0, 10);

  if (!container || !chipsContainer) return;

  if (!count || count === 0 || !lowStockBooks || lowStockBooks.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  chipsContainer.innerHTML = lowStockBooks.map(book => `
    <a href="edit-book.html?id=${book.book_id}"
       class="badge badge-warning"
       style="padding:0.4rem 0.75rem; text-decoration:none; font-size:0.8125rem;"
       title="Click to replenish stock">
      <span>${escapeHtml(book.title)}</span>
      <strong style="color:#B45309;">(${book.stock} left)</strong>
      <span style="text-decoration:underline; margin-left:4px;">Restock &rarr;</span>
    </a>
  `).join('');
}

// ── Category Analytics Breakdown ──────────────────────────────

function renderCategoryDistribution(catDistribution, totalBooks) {
  const el = document.getElementById('category-distribution-list');
  const badgeEl = document.getElementById('category-badge-count');
  if (!el) return;

  if (!catDistribution || catDistribution.length === 0) {
    el.innerHTML = '<span class="text-muted" style="font-size:0.875rem;">No categories recorded yet.</span>';
    return;
  }

  if (badgeEl) badgeEl.textContent = `${catDistribution.length} Categories`;

  const total = totalBooks > 0 ? totalBooks : 1;

  el.innerHTML = catDistribution.map(cat => {
    const pct = Math.round((cat.count / total) * 100);
    return `
      <div class="cat-bar-item">
        <div class="cat-bar-header">
          <a href="books.html?category=${encodeURIComponent(cat.category)}" class="cat-bar-name" style="text-decoration:none;">
            ${escapeHtml(cat.category)}
          </a>
          <span class="cat-bar-stat">${cat.count} titles &bull; ${pct}%</span>
        </div>
        <div class="cat-progress-track">
          <div class="cat-progress-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Recently Added Books Table ────────────────────────────────

function renderRecentBooksTable(books) {
  const tbody = document.getElementById('recent-books-body');
  if (!tbody) return;

  if (!books || books.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-icon">📚</div>
            <div class="empty-title">No books in catalog yet</div>
            <div class="empty-desc">Get started by creating your first book listing.</div>
            <a href="add-book.html" class="btn btn-primary btn-sm" style="margin-top:1rem;">Add First Book</a>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = books.map(book => {
    const coverHtml = typeof BookCover !== 'undefined'
      ? BookCover.render(book, { size: 'sm' })
      : `<div class="td-id">#${book.book_id}</div>`;

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
        <td>
          <div class="td-title">
            <a href="view-book.html?id=${book.book_id}" style="color:inherit; text-decoration:none;">
              ${escapeHtml(book.title)}
            </a>
          </div>
          <button
            type="button"
            class="td-author"
            style="background:none; border:none; padding:0; font:inherit; cursor:pointer;"
            onclick="openAuthorModal('${escapeHtml(book.author)}')">
            by ${escapeHtml(book.author)}
          </button>
        </td>
        <td>
          <a href="books.html?category=${encodeURIComponent(book.category)}" class="badge badge-primary" style="text-decoration:none;">
            ${escapeHtml(book.category)}
          </a>
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
            <a href="edit-book.html?id=${book.book_id}" class="btn btn-primary btn-sm" title="Edit book">
              Edit
            </a>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── System Health & Measured Latency ──────────────────────────

async function measureSystemLatency() {
  const dot = document.getElementById('status-dot');
  const label = document.getElementById('status-label');
  const dbDot = document.getElementById('sidebar-db-dot');
  const dbLabel = document.getElementById('sidebar-db-label');

  try {
    const health = await api.checkHealth();
    if (health.online) {
      if (dot) dot.className = 'status-dot-pulse';
      if (label) label.textContent = `Operational \u2022 ${health.latency}ms`;
      if (dbDot) dbDot.style.background = '#059669';
      if (dbLabel) dbLabel.textContent = 'Database Online';
    } else {
      markOffline();
    }
  } catch (e) {
    markOffline();
  }

  function markOffline() {
    if (dot) dot.className = 'status-dot-pulse offline';
    if (label) label.textContent = 'System Offline';
    if (dbDot) dbDot.style.background = '#DC2626';
    if (dbLabel) dbLabel.textContent = 'Disconnected';
  }
}

// ── DOM Helper ────────────────────────────────────────────────

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
