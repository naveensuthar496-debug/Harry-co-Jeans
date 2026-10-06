# HARRY & CO JEANS — FULLY DYNAMIC E-COMMERCE PLATFORM

An enterprise-grade, database-driven e-commerce platform and CMS for **HARRY & CO JEANS**, built with a decoupled architecture where the database and backend APIs are the sole source of truth.

---

## 🏛 Architecture Overview

```
DATABASE (SQLite / Relational ACID)
   ↓
BACKEND REST APIs (Express.js / Node.js)
   ↓
FRONTEND PRESENTATION LAYER (Vanilla JS / CSS - Zero Hardcoded Data)
```

The frontend presentation layer has **NO hardcoded products, NO fake reviews, NO fake banners, and NO hardcoded business logic**. If the database has 0 products, the storefront displays an authentic empty state: *"No products available right now."*

---

## 🚀 Quick Start

### 1. Install & Run
```bash
# Start server
node server/index.js
# Or
npm start
```

### 2. Access Portals
- **Customer Storefront:** [http://localhost:3000](http://localhost:3000)
- **Atelier Admin Portal:** [http://localhost:3000/admin](http://localhost:3000/admin)
  - **Admin Username:** `admin`
  - **Admin Password:** `admin123`

---

## 🔑 Key Features & System Requirements

### 1. Dynamic Product & Inventory System
- Products, sizes (28–38), fits, washes, fabrics, and variant stock live in the database.
- Inventory decrements automatically upon order placement.
- When stock reaches 0, the variant displays **OUT OF STOCK** and checkout is blocked.

### 2. Cash on Delivery (COD) & Payment Control
- **Real COD Payment Method:** Places orders with `paymentMethod = 'COD'`, `paymentStatus = 'PENDING'`, and `orderStatus = 'CONFIRMED'`.
- **Instant Admin On/Off Switch:** Located at `Admin → Payment Settings`.
- **Strict Server-Side Enforcement:** Disabling COD removes it from checkout **and** causes the backend to immediately reject any direct COD request with:
  ```json
  {
    "success": false,
    "message": "Cash on Delivery is currently unavailable."
  }
  ```
- **COD Controls:** Configurable minimum order (e.g. ₹500), maximum order (e.g. ₹10,000), handling fee (e.g. ₹49), and free COD threshold (e.g. ₹3,000).

### 3. Dynamic Homepage Builder (CMS)
- Admin can reorder sections (▲/▼), toggle them ON/OFF, and edit titles, subtitles, banner images, and CTAs:
  - Hero Banner
  - Announcement Bar
  - Featured Categories
  - New Arrivals Carousel
  - Promotional Banner
  - Best Sellers Carousel
  - Brand Story & Atelier Manifesto
  - Verified Patron Reviews
  - Archive Newsletter

### 4. Zero Fake Analytics
- All metrics (Revenue, Orders, Unique Customers, Average Order Value, Sales by Day, Low Stock Alerts) are calculated directly via SQL queries on real database records.
- In a fresh/cleared store, analytics accurately reflects **₹0 Revenue, 0 Orders, and 0 Customers**.

### 5. Genuine Patron Reviews
- Patrons submit real reviews with ratings and comments.
- Reviews check for past order emails to attach a **✓ Verified Patron** badge.
- Admin can moderate, approve, or remove reviews.

### 6. Store Settings & Maintenance Mode
- Admin can update brand identity, contact email, phone, physical atelier address, social links, tax rules, and shipping thresholds.
- **Maintenance Mode Switch:** When enabled, customers see a luxury maintenance notice while administrators retain full access to `/admin`.

### 7. Responsive Design (All Form Factors)
- **Mobile & Touch:** Bottom quick navigation bar, sliding cart drawer, touch-friendly size selectors, collapsible menu drawer.
- **Tablet:** Flexible multi-column layouts, touch-adapted dashboard tables.
- **Desktop & Ultra-wide:** 4-column product grids, spacious typography, constrained max width (`1440px`) to prevent infinite stretching.

---

## 🧪 Automated End-to-End Verification

A comprehensive automated test suite verifies the end-to-end customer and administrative workflows:

```bash
node test_e2e_workflows.js
```

### Verified Test Cases:
1. Admin authentication & JWT issuing
2. Sample catalog seeding
3. Dynamic product catalog & size variants
4. Dynamic CMS sections & navigation loading
5. Customer checkout with Cash on Delivery
6. Real-time inventory decrement
7. Customer order tracking
8. Admin disabling COD & strict backend rejection
9. Genuine SQL-aggregated analytics
10. Empty state verification (0 products, ₹0 revenue)

---

## ☁️ Azure Deployment Ready
- Built with standard Node.js & Express.
- Compatible with Azure App Service (Linux or Windows Node runner).
- Persistent storage for `store.db` or easily configured for Azure Database for PostgreSQL / MySQL.
# Harry-co-Jeans
