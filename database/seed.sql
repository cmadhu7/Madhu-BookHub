-- ============================================================
-- MADHU BOOKHUB — Seed Data
-- File: database/seed.sql
--
-- HOW TO USE:
--   Run schema.sql FIRST to create the table, then run this.
--   SOURCE /path/to/Madhu-BookHub/database/seed.sql
--
--   Or paste into MySQL Workbench and Execute.
-- ============================================================

USE bookstore;

-- Clear any existing data (optional - comment out if you want to keep existing data)
TRUNCATE TABLE books;

-- Insert 15 realistic sample books across 5 categories
-- Note: "To Kill a Mockingbird" has stock=4 (intentionally low to demo low-stock alert)
INSERT INTO books (title, author, category, price, stock) VALUES
  -- Programming (5 books)
  ('Clean Code',                         'Robert C. Martin',              'Programming',  39.99,  25),
  ('The Pragmatic Programmer',            'David Thomas & Andrew Hunt',    'Programming',  44.99,  18),
  ('Design Patterns',                    'Erich Gamma & Gang of Four',    'Programming',  49.99,  12),
  ('JavaScript: The Good Parts',         'Douglas Crockford',             'Programming',  29.99,  30),
  ('You Don\'t Know JS',                 'Kyle Simpson',                  'Programming',  34.99,  22),

  -- Science (3 books)
  ('A Brief History of Time',            'Stephen Hawking',               'Science',      19.99,  40),
  ('The Selfish Gene',                   'Richard Dawkins',               'Science',      17.99,  35),
  ('Cosmos',                             'Carl Sagan',                    'Science',      21.99,  28),

  -- History (2 books)
  ('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari',          'History',      24.99,  50),
  ('Guns, Germs, and Steel',             'Jared Diamond',                 'History',      22.99,  20),

  -- Economics (3 books)
  ('Thinking, Fast and Slow',            'Daniel Kahneman',               'Economics',    27.99,  15),
  ('The Wealth of Nations',              'Adam Smith',                    'Economics',    18.99,  10),
  ('Freakonomics',                       'Steven Levitt & Stephen Dubner','Economics',    16.99,  45),

  -- Fiction (2 books)
  ('1984',                               'George Orwell',                 'Fiction',      12.99,  60),
  ('To Kill a Mockingbird',              'Harper Lee',                    'Fiction',      13.99,   4);
  -- ↑ stock = 4 → triggers "Low Stock" warning on dashboard

-- Confirm
SELECT COUNT(*) AS books_inserted FROM books;
