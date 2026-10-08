/**
 * ============================================================
 * MADHU BOOKHUB — Edit Book Controller
 * File: frontend/js/edit-book.js
 *
 * WHAT: Loads existing record and applies updates to MySQL.
 * WHY:  Update (U) in CRUD with enterprise precision.
 * HOW:  GET /api/books/:id → fill form → PUT /api/books/:id
 * ============================================================
 */

'use strict';

let currentBookId = null;

document.addEventListener('DOMContentLoaded', async () => {
  initDynamicYear();
  const params = new URLSearchParams(window.location.search);
  currentBookId = params.get('id');

  if (!currentBookId || isNaN(parseInt(currentBookId, 10))) {
    showPageError('Invalid book ID. Please return to the catalog and choose a valid book.');
    return;
  }

  const badgeEl = document.getElementById('edit-id-badge');
  if (badgeEl) badgeEl.textContent = `Catalog Record #${currentBookId}`;

  await fetchAndPopulate(currentBookId);
  initEditForm();
});

function initDynamicYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// ── Fetch Book & Pre-fill Form ────────────────────────────────

async function fetchAndPopulate(id) {
  const container = document.getElementById('form-container');
  if (container) container.style.opacity = '0.5';

  try {
    const res = await api.getBook(id);
    const book = res.data;

    setValue('title',    book.title);
    setValue('author',   book.author);
    setValue('category', book.category);
    setValue('price',    parseFloat(book.price).toFixed(2));
    setValue('stock',    book.stock);

    const heading = document.getElementById('book-name-heading');
    if (heading) heading.textContent = `Edit "${book.title}"`;

    if (container) container.style.opacity = '1';
  } catch (err) {
    if (err.status === 404) {
      showPageError(`Book #${id} was not found. It may have been deleted.`);
    } else {
      showPageError('Unable to retrieve book record from server.');
    }
  }
}

// ── Form Submission ───────────────────────────────────────────

function initEditForm() {
  const form = document.getElementById('edit-book-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.warning('Please fix validation errors before saving.');
      return;
    }

    const submitBtn = document.getElementById('submit-btn');
    setLoading(submitBtn, true, 'Applying Updates...');

    try {
      const data = collectFormData();
      const res  = await api.updateBook(currentBookId, data);

      toast.success(res.message || 'Book specifications updated successfully!');

      setTimeout(() => {
        window.location.href = `view-book.html?id=${currentBookId}`;
      }, 1200);

    } catch (err) {
      if (err.errors && err.errors.length > 0) {
        toast.error(err.errors.join(' '));
      } else {
        toast.error(err.message || 'Failed to update book.');
      }
    } finally {
      setLoading(submitBtn, false, 'Save Changes');
    }
  });

  // Real-time validation
  form.querySelectorAll('.form-input, .form-select').forEach(input => {
    input.addEventListener('blur', () => validateSingleField(input));
    input.addEventListener('input', () => clearFieldError(input));
  });
}

function collectFormData() {
  return {
    title:    getValue('title'),
    author:   getValue('author'),
    category: getValue('category'),
    price:    parseFloat(getValue('price')),
    stock:    parseInt(getValue('stock'), 10),
  };
}

function validateForm() {
  clearAllErrors();
  let isValid = true;

  const rules = [
    { id: 'title',    validate: v => !v.trim(), msg: 'Book title is required.' },
    { id: 'author',   validate: v => !v.trim(), msg: 'Author name is required.' },
    { id: 'category', validate: v => !v.trim(), msg: 'Category genre is required.' },
    {
      id: 'price',
      validate: v => v === '' || isNaN(parseFloat(v)) || parseFloat(v) < 0,
      msg: 'Enter a valid price (e.g., 29.99).',
    },
    {
      id: 'stock',
      validate: v => v === '' || isNaN(parseInt(v, 10)) || parseInt(v, 10) < 0,
      msg: 'Enter a valid whole stock quantity (0 or more).',
    },
  ];

  rules.forEach(r => {
    const el = document.getElementById(r.id);
    if (el && r.validate(el.value)) {
      showFieldError(el, r.msg);
      isValid = false;
    }
  });

  return isValid;
}

function validateSingleField(input) {
  const v = input.value;
  switch (input.id) {
    case 'title':
      if (!v.trim()) showFieldError(input, 'Book title is required.');
      break;
    case 'author':
      if (!v.trim()) showFieldError(input, 'Author name is required.');
      break;
    case 'category':
      if (!v.trim()) showFieldError(input, 'Category genre is required.');
      break;
    case 'price':
      if (v === '' || isNaN(parseFloat(v))) showFieldError(input, 'Enter a valid price.');
      else if (parseFloat(v) < 0) showFieldError(input, 'Price cannot be negative.');
      break;
    case 'stock':
      if (v === '' || isNaN(parseInt(v, 10))) showFieldError(input, 'Enter a valid quantity.');
      else if (parseInt(v, 10) < 0) showFieldError(input, 'Stock cannot be negative.');
      break;
  }
}

function showPageError(message) {
  const container = document.getElementById('form-container');
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <div class="empty-title">Cannot Edit Book</div>
      <div class="empty-desc">${escapeHtml(message)}</div>
      <a href="books.html" class="btn btn-secondary mt-3">&larr; Return to Catalog</a>
    </div>`;
}

function showFieldError(input, msg) {
  input.classList.add('error');
  const err = input.parentElement?.querySelector('.form-error');
  if (err) {
    err.textContent = msg;
    err.classList.add('show');
  }
}

function clearFieldError(input) {
  input.classList.remove('error');
  const err = input.parentElement?.querySelector('.form-error');
  if (err) {
    err.textContent = '';
    err.classList.remove('show');
  }
}

function clearAllErrors() {
  document.querySelectorAll('.form-input.error, .form-select.error')
    .forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.form-error')
    .forEach(el => { el.textContent = ''; el.classList.remove('show'); });
}

function setLoading(btn, loading, text) {
  btn.disabled    = loading;
  btn.innerHTML   = loading
    ? `<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> ${escapeHtml(text)}`
    : `<span>💾</span> ${escapeHtml(text)}`;
}

function getValue(id)      { return document.getElementById(id)?.value ?? ''; }
function setValue(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
