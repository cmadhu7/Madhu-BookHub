/**
 * ============================================================
 * MADHU BOOKHUB — Express Server Entry Point
 * File: backend/server.js
 *
 * CONCEPT: Express Application Setup
 * This is the "main" file for our backend. It:
 *   1. Loads environment variables from .env
 *   2. Creates the Express application
 *   3. Registers middleware (cors, json parsing)
 *   4. Serves the frontend as static files
 *   5. Registers API routes
 *   6. Registers the error handler
 *   7. Starts the HTTP server on a port
 *
 * Flow of every request:
 *   Browser → Express → Middleware → Route → Controller → Database
 *                                                       ↓
 *   Browser ← JSON Response ←────────────────────────────
 * ============================================================
 */

'use strict';

// Load .env FIRST before anything else reads process.env
require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const bookRoutes   = require('./routes/bookRoutes');
const errorHandler = require('./middleware/errorHandler');

// ── Create Express app ─────────────────────────────────────
const app  = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ── Middleware ─────────────────────────────────────────────
// CORS: Allows the frontend to make API calls to the backend.
// In production this should be restricted to your domain.
app.use(cors());

// JSON parser: Parses incoming request bodies as JSON.
// Without this, req.body would be undefined.
app.use(express.json());

// URL-encoded parser: Handles HTML form submissions.
app.use(express.urlencoded({ extended: true }));

// ── Serve Frontend Static Files ────────────────────────────
// This tells Express to serve everything in the /frontend folder.
// When you visit http://localhost:3000, Express will serve
// frontend/index.html automatically.
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// ── API Routes ─────────────────────────────────────────────
// Healthcheck endpoint for real-time latency & system status monitoring
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// bookRoutes handles /books/* (CRUD), /stats, /categories, and /authors/:author
app.use('/api', bookRoutes);

// ── 404 Handler for unknown API routes ────────────────────
// If no route matched and the request was to /api/*, return JSON 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Catch-All: Serve Frontend for non-API routes ──────────
// This ensures that navigating directly to a page in the
// browser still works (serves index.html for any unknown path)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Global Error Handler ───────────────────────────────────
// Must be registered AFTER all routes.
// The 4 parameters (err, req, res, next) signal to Express
// that this is an error-handling middleware.
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║       📚  Madhu BookHub Server  📚        ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`  🚀 Server running at: http://localhost:${PORT}`);
  console.log(`  📖 Frontend at:       http://localhost:${PORT}/`);
  console.log(`  🔌 API base URL:      http://localhost:${PORT}/api`);
  console.log('');
  console.log('  Press Ctrl+C to stop the server.');
  console.log('');
});

module.exports = app;
