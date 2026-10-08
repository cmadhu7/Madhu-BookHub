/**
 * ============================================================
 * MADHU BOOKHUB — Add Book Controller
 * File: frontend/js/add-book.js
 *
 * WHAT: Validates and transmits new book listings to backend.
 * WHY:  Create (C) in CRUD with enterprise resilience and feedback.
 * HOW:  POST /api/books with JSON payload.
 * ============================================================
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initDynamicYear();
  initAddBookForm();
});

function initDynamicYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function initAddBookForm() {
  const form = document.getElementById('add-book-form');
  if (!form) return;

  // ── Form Submission ─────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.warning('Please resolve highlighted form validation errors.');
      return;
    }

    const submitBtn = document.getElementById('submit-btn');
    setLoading(submitBtn, true, 'Saving to Database...');

    try {
      const data = collectFormData();
      const res  = await api.createBook(data);

      toast.success(res.message || 'Book registered successfully into catalog!');
      form.reset();
      clearAllErrors();

      // Offer quick action to inspect new title
      if (res.data && res.data.book_id) {
        setTimeout(() => {
          window.location.href = `view-book.html?id=${res.data.book_id}`;
        }, 1200);
      } else {
        document.getElementById('title')?.focus();
      }

    } catch (err) {
      if (err.errors && err.errors.length > 0) {
        toast.error(err.errors.join(' '));
      } else {
        toast.error(err.message || 'Failed to create book record in database.');
      }
    } finally {
      setLoading(submitBtn, false, 'Add Book to Store');
    }
  });

  // ── Real-Time Validation on Blur / Input ────────────────────
  form.querySelectorAll('.form-input, .form-select').forEach(input => {
    input.addEventListener('blur', () => validateSingleField(input));
    input.addEventListener('input', () => clearFieldError(input));
  });
}

function collectFormData() {
  return {
    title:    document.getElementById('title').value.trim(),
    author:   document.getElementById('author').value.trim(),
    category: document.getElementById('category').value.trim(),
    price:    parseFloat(document.getElementById('price').value),
    stock:    parseInt(document.getElementById('stock').value, 10),
  };
}

function validateForm() {
  clearAllErrors();
  let isValid = true;

  const rules = [
    { id: 'title',    validate: v => !v.trim(), msg: 'Book title is required (up to 255 chars).' },
    { id: 'author',   validate: v => !v.trim(), msg: 'Author name is required (up to 255 chars).' },
    { id: 'category', validate: v => !v.trim(), msg: 'Category genre is required.' },
    {
      id: 'price',
      validate: v => v === '' || isNaN(parseFloat(v)) || parseFloat(v) < 0,
      msg: 'Price must be a valid non-negative number (e.g., 29.99).',
    },
    {
      id: 'stock',
      validate: v => v === '' || isNaN(parseInt(v, 10)) || parseInt(v, 10) < 0 || !Number.isInteger(Number(v)),
      msg: 'Stock must be a whole integer value 0 or greater.',
    },
  ];

  rules.forEach(rule => {
    const el = document.getElementById(rule.id);
    if (el && rule.validate(el.value)) {
      showFieldError(el, rule.msg);
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
      if (v === '' || isNaN(parseInt(v, 10))) showFieldError(input, 'Enter a valid stock quantity.');
      else if (parseInt(v, 10) < 0) showFieldError(input, 'Stock cannot be negative.');
      break;
  }
}

function showFieldError(input, message) {
  input.classList.add('error');
  const err = input.parentElement?.querySelector('.form-error');
  if (err) {
    err.textContent = message;
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
    : `<span>➕</span> ${escapeHtml(text)}`;
}
