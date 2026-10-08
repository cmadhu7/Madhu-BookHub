/**
 * ============================================================
 * MADHU BOOKHUB — Book Controller
 * File: backend/controllers/bookController.js
 *
 * CONCEPT: MVC — Controller Layer
 * The Controller is the "brain" of each API endpoint.
 * It receives the HTTP request, validates input, runs
 * the correct SQL query, and sends back a JSON response.
 *
 * SECURITY: All SQL uses parameterized queries (? placeholders).
 * This prevents SQL injection — a critical attack where a
 * malicious user types SQL commands into form fields.
 *
 * Example of what we NEVER do (vulnerable):
 *   `SELECT * FROM books WHERE title = '${req.body.title}'`
 *
 * What we DO (safe):
 *   `SELECT * FROM books WHERE title = ?` with [req.body.title]
 * ============================================================
 */

'use strict';

const pool = require('../config/db');

// ── Input Validation ───────────────────────────────────────
/**
 * Validates book data before inserting or updating.
 * Returns an array of error messages.
 * An empty array means the data is valid.
 *
 * @param {object} data - { title, author, category, price, stock }
 * @returns {string[]} Array of validation error messages
 */
function validateBook({ title, author, category, price, stock }) {
  const errors = [];

  // Title validation
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required and cannot be empty.');
  } else if (title.trim().length > 255) {
    errors.push('Title cannot exceed 255 characters.');
  }

  // Author validation
  if (!author || typeof author !== 'string' || author.trim().length === 0) {
    errors.push('Author is required and cannot be empty.');
  } else if (author.trim().length > 255) {
    errors.push('Author cannot exceed 255 characters.');
  }

  // Category validation
  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('Category is required and cannot be empty.');
  } else if (category.trim().length > 100) {
    errors.push('Category cannot exceed 100 characters.');
  }

  // Price validation
  const priceNum = parseFloat(price);
  if (price === undefined || price === null || price === '' || isNaN(priceNum)) {
    errors.push('Price must be a valid number (e.g., 19.99).');
  } else if (priceNum < 0) {
    errors.push('Price cannot be negative.');
  } else if (priceNum > 99999.99) {
    errors.push('Price cannot exceed 99,999.99.');
  }

  // Stock validation
  const stockNum = Number(stock);
  if (stock === undefined || stock === null || stock === '' || isNaN(stockNum)) {
    errors.push('Stock must be a valid whole number.');
  } else if (stockNum < 0) {
    errors.push('Stock cannot be negative.');
  } else if (!Number.isInteger(stockNum)) {
    errors.push('Stock must be a whole number, not a decimal.');
  } else if (stockNum > 999999) {
    errors.push('Stock cannot exceed 999,999.');
  }

  return errors;
}

// ── GET /api/books ─────────────────────────────────────────
/**
 * Returns all books.
 * Supports optional query parameters:
 *   ?search=javascript   → searches title, author, category
 *   ?category=Programming → filters by exact category
 */
const getAllBooks = async (req, res, next) => {
  try {
    const { search, category, author, stock_status, sort } = req.query;

    // Build the SQL query dynamically with parameterized conditions
    let sql = 'SELECT * FROM books';
    const params = [];
    const conditions = [];

    // Search filter — searches across title, author, and category
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push('(title LIKE ? OR author LIKE ? OR category LIKE ?)');
      params.push(term, term, term);
    }

    // Category filter — exact match
    if (category && category.trim()) {
      conditions.push('category = ?');
      params.push(category.trim());
    }

    // Author filter — exact match
    if (author && author.trim()) {
      conditions.push('author = ?');
      params.push(author.trim());
    }

    // Stock status filter
    if (stock_status) {
      if (stock_status === 'out') {
        conditions.push('stock = 0');
      } else if (stock_status === 'low') {
        conditions.push('stock > 0 AND stock < 5');
      } else if (stock_status === 'healthy') {
        conditions.push('stock >= 5');
      }
    }

    // Append WHERE clause if conditions exist
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Safe sorting using whitelist to prevent SQL injection
    let orderBy = 'created_at DESC, book_id DESC';
    switch (sort) {
      case 'title_asc':
        orderBy = 'title ASC';
        break;
      case 'title_desc':
        orderBy = 'title DESC';
        break;
      case 'author_asc':
        orderBy = 'author ASC';
        break;
      case 'price_asc':
        orderBy = 'price ASC';
        break;
      case 'price_desc':
        orderBy = 'price DESC';
        break;
      case 'stock_asc':
        orderBy = 'stock ASC';
        break;
      case 'stock_desc':
        orderBy = 'stock DESC';
        break;
      case 'oldest':
        orderBy = 'created_at ASC, book_id ASC';
        break;
      default:
        orderBy = 'created_at DESC, book_id DESC';
    }

    sql += ` ORDER BY ${orderBy}`;

    const [rows] = await pool.query(sql, params);

    res.json({
      success: true,
      count:   rows.length,
      data:    rows,
    });
  } catch (err) {
    next(err); // Pass to global error handler
  }
};

// ── GET /api/books/:id ─────────────────────────────────────
/**
 * Returns a single book by its ID.
 * Returns 404 if the book doesn't exist.
 */
const getBookById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Validate the ID from the URL
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID. Must be a positive integer.',
      });
    }

    const [rows] = await pool.query(
      'SELECT * FROM books WHERE book_id = ?',
      [id] // Safe parameterized query
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${id} was not found.`,
      });
    }

    res.json({
      success: true,
      data:    rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/books ────────────────────────────────────────
/**
 * Creates a new book.
 * Validates all fields before inserting into the database.
 * Returns 201 Created with the new book object.
 */
const createBook = async (req, res, next) => {
  try {
    const { title, author, category, price, stock } = req.body;

    // Backend validation (ALWAYS validate on the server — never trust the client)
    const errors = validateBook({ title, author, category, price, stock });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please correct the errors below.',
        errors,
      });
    }

    // Insert with parameterized query — safe from SQL injection
    const [result] = await pool.query(
      `INSERT INTO books (title, author, category, price, stock)
       VALUES (?, ?, ?, ?, ?)`,
      [
        title.trim(),
        author.trim(),
        category.trim(),
        parseFloat(price),
        parseInt(stock, 10),
      ]
    );

    // Fetch the newly created book to return the complete record
    const [newBook] = await pool.query(
      'SELECT * FROM books WHERE book_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: `Book "${title.trim()}" was added successfully.`,
      data:    newBook[0],
    });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/books/:id ─────────────────────────────────────
/**
 * Updates all fields of an existing book.
 * Returns 404 if the book doesn't exist.
 * Returns 400 if validation fails.
 */
const updateBook = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID.',
      });
    }

    // Check the book exists before trying to update it
    const [existing] = await pool.query(
      'SELECT * FROM books WHERE book_id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${id} was not found.`,
      });
    }

    const { title, author, category, price, stock } = req.body;

    const errors = validateBook({ title, author, category, price, stock });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    await pool.query(
      `UPDATE books
       SET title = ?, author = ?, category = ?, price = ?, stock = ?
       WHERE book_id = ?`,
      [
        title.trim(),
        author.trim(),
        category.trim(),
        parseFloat(price),
        parseInt(stock, 10),
        id,
      ]
    );

    // Return the updated record
    const [updated] = await pool.query(
      'SELECT * FROM books WHERE book_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `Book "${title.trim()}" was updated successfully.`,
      data:    updated[0],
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/books/:id ──────────────────────────────────
/**
 * Deletes a book by ID.
 * Returns 404 if the book doesn't exist.
 */
const deleteBook = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID.',
      });
    }

    // Get the book first so we can include its title in the success message
    const [existing] = await pool.query(
      'SELECT * FROM books WHERE book_id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Book with ID ${id} was not found.`,
      });
    }

    const bookTitle = existing[0].title;

    await pool.query('DELETE FROM books WHERE book_id = ?', [id]);

    res.json({
      success: true,
      message: `Book "${bookTitle}" was deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/stats ─────────────────────────────────────────
/**
 * Returns aggregated statistics for the dashboard.
 * Uses SQL aggregate functions: COUNT, SUM, AVG, CASE.
 */
const getStats = async (req, res, next) => {
  try {
    // Single query that computes all high-level business metrics at once
    const [[summary]] = await pool.query(`
      SELECT
        COUNT(*)                                            AS total_books,
        COALESCE(SUM(stock), 0)                             AS total_stock,
        COUNT(DISTINCT category)                            AS total_categories,
        COALESCE(ROUND(AVG(price), 2), 0)                   AS avg_price,
        COALESCE(ROUND(SUM(price * stock), 2), 0)           AS total_inventory_value,
        COALESCE(SUM(CASE WHEN stock < 5 THEN 1 ELSE 0 END), 0) AS low_stock_count,
        COALESCE(SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock_count,
        COALESCE(SUM(CASE WHEN stock >= 5 THEN 1 ELSE 0 END), 0) AS healthy_stock_count
      FROM books
    `);

    // Most recently added books
    const [recentBooks] = await pool.query(
      'SELECT * FROM books ORDER BY created_at DESC, book_id DESC LIMIT 6'
    );

    // Categories list
    const [catRows] = await pool.query(
      'SELECT DISTINCT category FROM books ORDER BY category ASC'
    );

    // Real category analytics distribution
    const [catDistribution] = await pool.query(`
      SELECT
        category,
        COUNT(*) AS count,
        COALESCE(SUM(stock), 0) AS total_stock,
        COALESCE(ROUND(AVG(price), 2), 0) AS avg_price
      FROM books
      GROUP BY category
      ORDER BY count DESC, category ASC
    `);

    // Real low stock alerts list (stock < 5)
    const [lowStockBooks] = await pool.query(
      'SELECT * FROM books WHERE stock < 5 ORDER BY stock ASC, title ASC LIMIT 10'
    );

    res.json({
      success: true,
      data: {
        total_books:           summary.total_books,
        total_stock:           summary.total_stock,
        total_categories:      summary.total_categories,
        avg_price:             summary.avg_price,
        total_inventory_value: summary.total_inventory_value,
        low_stock_count:       summary.low_stock_count,
        out_of_stock_count:    summary.out_of_stock_count,
        healthy_stock_count:   summary.healthy_stock_count,
        recent_books:          recentBooks,
        categories:            catRows.map(r => r.category),
        category_distribution: catDistribution,
        low_stock_books:       lowStockBooks,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/categories ────────────────────────────────────
/**
 * Returns distinct categories with real calculated aggregates.
 */
const getCategories = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        category,
        COUNT(*) AS count,
        COALESCE(SUM(stock), 0) AS total_stock,
        COALESCE(ROUND(AVG(price), 2), 0) AS avg_price
      FROM books
      GROUP BY category
      ORDER BY count DESC, category ASC
    `);

    res.json({
      success: true,
      count:   rows.length,
      data:    rows,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/authors/:author ───────────────────────────────
/**
 * Returns author statistics and list of books written by this author.
 */
const getAuthorProfile = async (req, res, next) => {
  try {
    const authorName = req.params.author;

    if (!authorName || !authorName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Author name is required.',
      });
    }

    const trimmedAuthor = authorName.trim();

    const [books] = await pool.query(
      'SELECT * FROM books WHERE author = ? ORDER BY title ASC',
      [trimmedAuthor]
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No books found for author "${trimmedAuthor}".`,
      });
    }

    const [[stats]] = await pool.query(`
      SELECT
        COUNT(*) AS total_books,
        COALESCE(SUM(stock), 0) AS total_stock,
        COUNT(DISTINCT category) AS categories_count,
        COALESCE(ROUND(AVG(price), 2), 0) AS avg_price
      FROM books
      WHERE author = ?
    `, [trimmedAuthor]);

    res.json({
      success: true,
      data: {
        author: trimmedAuthor,
        stats,
        books,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Export all controller functions
module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getStats,
  getCategories,
  getAuthorProfile,
};
