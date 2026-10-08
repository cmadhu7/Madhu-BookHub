/**
 * ============================================================
 * MADHU BOOKHUB — Book Routes
 * File: backend/routes/bookRoutes.js
 *
 * CONCEPT: Express Router
 * An Express Router is like a mini-application that handles
 * a group of related routes. We define what URL + HTTP method
 * maps to which controller function.
 *
 * REST API Conventions used:
 *   GET    /api/books       → read all books
 *   GET    /api/books/:id   → read one book
 *   POST   /api/books       → create a book
 *   PUT    /api/books/:id   → update a book (full replace)
 *   DELETE /api/books/:id   → delete a book
 *   GET    /api/stats       → dashboard statistics
 * ============================================================
 */

'use strict';

const express = require('express');
const router  = express.Router();

// Import the controller — it contains the actual logic
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getStats,
  getCategories,
  getAuthorProfile,
} = require('../controllers/bookController');

// ── Dashboard Statistics & Categories ───────────────────────
// GET /api/stats
router.get('/stats', getStats);

// GET /api/categories
router.get('/categories', getCategories);

// GET /api/authors/:author
router.get('/authors/:author', getAuthorProfile);

// ── Book CRUD Routes ───────────────────────────────────────
// GET    /api/books          → list all books (supports ?search=&category=&author=&stock_status=&sort=)
router.get('/books',        getAllBooks);

// GET    /api/books/:id      → get one book by ID
router.get('/books/:id',     getBookById);

// POST   /api/books          → create a new book
router.post('/books',       createBook);

// PUT    /api/books/:id      → update an existing book
router.put('/books/:id',     updateBook);

// DELETE /api/books/:id      → delete a book
router.delete('/books/:id',  deleteBook);

module.exports = router;
