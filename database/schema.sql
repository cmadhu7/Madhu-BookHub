-- ============================================================
-- MADHU BOOKHUB — Database Schema
-- File: database/schema.sql
--
-- HOW TO USE:
--   Open MySQL Workbench or the mysql CLI and run:
--   SOURCE /path/to/Madhu-BookHub/database/schema.sql
--
--   Or paste the contents into MySQL Workbench and Execute.
-- ============================================================

-- Create the database if it doesn't already exist
CREATE DATABASE IF NOT EXISTS bookstore
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Switch to the bookstore database
USE bookstore;

-- Drop the table if it exists (for clean re-runs)
DROP TABLE IF EXISTS books;

-- ── books table ──────────────────────────────────────────────
-- This is the primary table for all book data.
--
-- Columns:
--   book_id    → Auto-incrementing primary key (INT)
--   title      → Book title, cannot be empty (VARCHAR 255)
--   author     → Author name, cannot be empty (VARCHAR 255)
--   category   → Genre/category (VARCHAR 100)
--   price      → Retail price, must be >= 0 (DECIMAL 10,2)
--   stock      → Quantity in stock, must be >= 0 (INT)
--   created_at → Timestamp when record was inserted (auto-set)
--   updated_at → Timestamp of last update (auto-updated)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE books (
  book_id    INT            NOT NULL AUTO_INCREMENT,
  title      VARCHAR(255)   NOT NULL,
  author     VARCHAR(255)   NOT NULL,
  category   VARCHAR(100)   NOT NULL,
  price      DECIMAL(10, 2) NOT NULL,
  stock      INT            NOT NULL DEFAULT 0,
  created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (book_id),

  -- Prevent negative prices
  CONSTRAINT chk_price CHECK (price >= 0),

  -- Prevent negative stock
  CONSTRAINT chk_stock CHECK (stock >= 0),

  -- Speed up searches on title and author
  INDEX idx_title    (title),
  INDEX idx_author   (author),
  INDEX idx_category (category)
);

-- Confirm success
SELECT 'bookstore database and books table created successfully.' AS Status;
