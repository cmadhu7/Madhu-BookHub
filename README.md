# 📚 MADHU BOOKHUB — ENTERPRISE DIGITAL BOOK MANAGEMENT PLATFORM

> **A Modern, Company-Grade Full-Stack Online Bookstore & Inventory Intelligence System**  
> Built with Node.js &bull; Express.js &bull; MySQL &bull; Vanilla ES6 JavaScript &bull; CSS Custom Properties Design System

---

## 🌟 Executive Overview

**Madhu BookHub** is an enterprise-grade digital book management and inventory platform designed to simulate a production technology product. Moving far beyond academic CRUD tutorials, Madhu BookHub features executive-level financial valuation metrics, category distribution analytics, a procedural 3D SVG book cover generation engine, verified author profile drawers, low-stock attention alerts, and multi-faceted catalog discovery.

---

## 🚀 Key Platform Capabilities

### 1. Executive Analytics & Inventory Valuation
- **Real Database Business Metrics**: Real-time aggregation calculates:
  - **Total Catalog Titles**
  - **Total Physical Stock Units**
  - **Total Inventory Asset Valuation** (`SUM(price * stock)` calculated live from MySQL)
  - **Active Genre Classifications**
  - **Mean Retail Price**
  - **Inventory Attention Required Alert Count** (`stock < 5` units)
- **Visual Category Distribution Breakdown**: Dynamic proportional analytics tracking title counts, stock shares, and genre percentages.
- **Low-Stock Attention Command Banner**: Direct visual alerts highlighting critically low inventory (e.g., *To Kill a Mockingbird* with 4 copies remaining) with single-click restocking links.

### 2. Procedural 3D Book Cover Visual System (`covers.js`)
- **Zero-Dependency Vector Covers**: Generates publisher-grade SVG book covers dynamically in the browser based on category and title.
- **Genre-Specific Chromatic Themes**:
  - *Programming*: Midnight sapphire, electric cyan circuit motif
  - *Science*: Emerald deep teal, orbital geometry
  - *History*: Warm sepia, classical arch geometry
  - *Economics*: Royal navy, gold geometric motif
  - *Fiction*: Royal purple, constellation motif
- **Physical Book Details**: Spine crease gradients, embossed foil accent lines, realistic book depth and shadows.
- **Open Library CDN Fallback**: Supports remote cover lookups with instantaneous, zero-flicker SVG fallback ensuring **zero broken image icons ever**.

### 3. Dual-Mode Catalog Discovery (`books.html`)
- **Grid View (Showcase)**: Physical 3D book covers with realistic hover elevation tilt, genre badges, price chips, and stock health pills.
- **Table View (Enterprise Data Grid)**: Dense, scannable tabular view for warehouse operations with cover thumbnails, IDs, and action buttons.
- **State Persistence**: Remembers view preference across sessions in `localStorage`.
- **Multi-Faceted Filtering & Sorting**:
  - Debounced real-time search across Title, Author, and Category (250ms).
  - Dynamic category selector populated live from the database.
  - Stock health filter (*Healthy Stock &ge; 5*, *Low Stock &lt; 5*, *Out of Stock = 0*).
  - Multi-criteria sorting (*Newest, Title A-Z, Title Z-A, Price Low-High, Price High-Low, Stock Lowest, Stock Highest*).

### 4. Verified Author Profile System
- Clicking any author across the application launches the **Author Profile Modal**.
- Displays deterministic author initials avatar monogram, verified inventory count, cumulative warehouse stock, average price, and a complete catalog bibliography with direct links.
- Strictly adheres to data integrity: **never fabricates biographical facts**.

### 5. Enterprise Form UX & Full CRUD Lifecycle
- **Add Book (`add-book.html`)**: Floating/focused labels, genre suggestions via HTML5 datalist, strict dual-layer input validation, and non-blocking toast notifications.
- **Edit Book (`edit-book.html`)**: Pre-populated form fields, live input validation, and instant database updates.
- **View Book (`view-book.html`)**: Large physical cover showcase, stock meter, metadata grid, and category-related title recommendations.
- **Delete UX**: Safe two-step confirmation modal displaying target title and ID, focus trapping, and cancel guards.

---

## 🏗️ Architecture & Technical Stack

```
                          MADHU BOOKHUB ARCHITECTURE

┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / PRESENTATION LAYER                     │
│   Vanilla ES6+ • CSS3 Design Tokens • SVG Cover Engine • Responsive    │
│   [Dashboard]       [All Books]       [Add Book]       [Edit / View]   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │  Fetch API (JSON over HTTP)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        NODE.JS / EXPRESS BACKEND                       │
│                                                                        │
│   server.js       ── Entry point, static files & CORS                  │
│   errorHandler.js ── Centralized error handling & security masking     │
│   bookRoutes.js   ── REST API route declarations                       │
│   bookController  ── Request validation & parameterized SQL execution  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │  mysql2/promise Pool
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         MYSQL DATABASE (bookstore)                     │
│                                                                        │
│   Table: books (book_id, title, author, category, price, stock, ...)   │
│   Indexes: idx_title, idx_author, idx_category                         │
│   Constraints: chk_price >= 0, chk_stock >= 0                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Directory Structure

```
Madhu-BookHub/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL connection pool (mysql2/promise)
│   ├── controllers/
│   │   └── bookController.js     # CRUD logic, analytics, author profiles, validation
│   ├── middleware/
│   │   └── errorHandler.js       # Centralized error handler & information shield
│   ├── routes/
│   │   └── bookRoutes.js         # REST endpoints routing
│   └── server.js                 # Express server & healthcheck endpoint
│
├── frontend/
│   ├── css/
│   │   └── style.css             # Enterprise design system & responsive layout
│   ├── js/
│   │   ├── api.js                # Central API client, toasts, author modal, latency check
│   │   ├── covers.js             # Procedural SVG 3D book cover generator
│   │   ├── dashboard.js          # KPI metrics, analytics distribution, low-stock alerts
│   │   ├── books.js              # Dual grid/table discovery, search, filter, delete modal
│   │   ├── view-book.js          # Flagship showcase view & related books loader
│   │   ├── add-book.js           # Form validation & book creation logic
│   │   └── edit-book.js          # Form prefill, validation & update logic
│   ├── index.html                # Executive dashboard
│   ├── books.html                # Catalog discovery & inventory
│   ├── add-book.html             # Add new book form
│   ├── edit-book.html            # Edit existing book form
│   └── view-book.html            # Book details showcase
│
├── database/
│   ├── schema.sql                # DDL schema definition & indexes
│   └── seed.sql                  # Production seed data (15+ realistic titles)
│
├── .env.example                  # Environment credential template (safe to commit)
├── .gitignore                    # Git shield (.env and node_modules protection)
├── package.json                  # Dependencies & scripts
└── README.md                     # Technical documentation & presentation guide
```

---

## 🔌 RESTful API Reference

All responses conform to standardized JSON formats.

| Method | Endpoint | Description | Request Body / Params |
|---|---|---|---|
| `GET` | `/api/health` | Healthcheck & latency ping | None |
| `GET` | `/api/stats` | Executive KPI & category analytics | None |
| `GET` | `/api/categories` | Distinct categories with volume breakdown | None |
| `GET` | `/api/authors/:author` | Author profile, catalog stats & books list | None |
| `GET` | `/api/books` | Search, filter, and sort book catalog | `?search=`, `?category=`, `?author=`, `?stock_status=`, `?sort=` |
| `GET` | `/api/books/:id` | Retrieve single book by numeric ID | None |
| `POST` | `/api/books` | Create new catalog entry | `{ title, author, category, price, stock }` |
| `PUT` | `/api/books/:id` | Update existing catalog entry | `{ title, author, category, price, stock }` |
| `DELETE` | `/api/books/:id` | Permanently delete catalog entry | None |

### Standard Response Schemas

#### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Title is required and cannot be empty."
}
```

---

## 🔒 Security & Quality Standards

1. **SQL Injection Prevention**: 100% of SQL queries utilize parameterized placeholders (`?`) via `mysql2/promise`. No user string concatenation exists anywhere in SQL statements.
2. **Credential Protection**: Database passwords and ports are managed exclusively through environment variables via `dotenv`. Secrets are protected from version control by `.gitignore`.
3. **Cross-Site Scripting (XSS) Shield**: All user-generated content rendered into the DOM is sanitized through `escapeHtml()` prior to insertion.
4. **Information Leakage Shielding**: The backend global error handler catches database exceptions (`ER_DUP_ENTRY`, `ECONNREFUSED`) and maps them to clean user-facing messages, never exposing raw SQL syntax, internal file paths, or stack traces.
5. **Defensive Dual-Layer Validation**: Validation is executed on both frontend (instant user feedback) and backend (security contract enforcement).

---

## 🚀 Running & Demonstration Instructions

### Prerequisites
- **Node.js** (v18+)
- **MySQL** (v8+)

### 1. Database Setup
Ensure MySQL is active, then execute:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Environment Configuration
Create your local `.env` file (copied from `.env.example`):
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bookstore
```

### 3. Start the Server
```bash
npm start
```
Navigate to: **`http://localhost:3000`**

---

## 🎯 Executive Demonstration Journey

1. **Open Executive Dashboard (`/`)**:
   - Observe live system status indicator showing real-time measured latency (e.g. `Operational • 12ms`).
   - Review executive KPI cards: Total Books, Total Stock Units, and **Live Inventory Asset Valuation** (`$10,444.04`).
   - Review **Category Distribution** progress analytics.
   - Inspect the **Inventory Attention Required** alert banner showing titles with stock &lt; 5 copies.
2. **Navigate to All Books (`/books.html`)**:
   - Notice the **Grid View** displaying 3D book covers with spine shadows and foil accents.
   - Switch to **Table View** to inspect enterprise inventory tabular layout.
   - Test real-time search: type `"clean"` to see instant filtering.
   - Filter by category (*Programming*, *History*) and sort by *Price (High &rarr; Low)*.
3. **Author Experience**:
   - Click any author (e.g., *Robert C. Martin* or *Harper Lee*).
   - View the slide-in **Author Profile Modal** displaying avatar monogram, total titles in inventory, total copies on hand, and author bibliography.
4. **Inspect Book Details (`/view-book.html?id=1`)**:
   - Experience the large 3D cover showcase, retail pricing, stock health meter, and related titles in the same category.
5. **Add & Update a Title**:
   - Click **Add Book**, enter title, author, category, price, and stock.
   - Verify inline validation constraints and successful creation toast.
   - Edit the book, change price and stock, and verify immediate database persistence.
6. **Safe Deletion**:
   - Trigger delete on the newly added book.
   - Notice the modal confirmation guard and post-deletion toast feedback.
   - Return to the dashboard and observe that all KPI metrics and asset valuations have recalculated automatically.

---

&copy; Madhu BookHub &bull; Modern Digital Book Management Platform
