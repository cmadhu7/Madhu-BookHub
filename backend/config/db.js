/**
 * ============================================================
 * MADHU BOOKHUB — Database Connection
 * File: backend/config/db.js
 *
 * CONCEPT: Connection Pooling
 * Instead of opening a new database connection for every single
 * HTTP request (slow and resource-heavy), we create a "pool" —
 * a set of pre-established connections that are reused.
 *
 * WHAT: Creates and exports a MySQL connection pool.
 * WHY:  Efficient, scalable database access.
 * HOW:  Uses the mysql2 library with Promise support.
 * ============================================================
 */

'use strict';

// dotenv loads our .env file variables into process.env
// This is how we keep credentials out of source code
require('dotenv').config();

const mysql = require('mysql2/promise');

// ── Create the connection pool ─────────────────────────────
// All values come from .env — NEVER hardcoded here
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306', 10),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'bookstore',

  // Maximum number of connections kept alive in the pool
  connectionLimit:    10,

  // Automatically re-issue queries if connection is lost
  waitForConnections: true,

  // How many queries can wait for a connection before error
  queueLimit:         0,

  // MySQL timezone (use UTC internally)
  timezone:           'Z',
});

// ── Test the connection on startup ─────────────────────────
// This runs once when the server starts.
// If MySQL isn't running or credentials are wrong,
// it will log a clear error message.
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully to database: ' + process.env.DB_NAME);
    connection.release(); // Always release connections back to the pool
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Check your .env file — DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    // Exit process so the developer knows immediately something is wrong
    process.exit(1);
  }
}

testConnection();

module.exports = pool;
