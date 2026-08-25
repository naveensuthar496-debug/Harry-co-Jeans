# HARRY & CO JEANS — Full-Stack React & Next.js Denim Platform

A modern, functional artisanal denim e-commerce platform and comprehensive staff Admin Suite built with **React**, **Next.js (App Router)**, **Tailwind CSS**, and **MongoDB Atlas**.

---

## 🚀 Key Features

- **Full-Stack Next.js App Router**: Server Components, Client Components, and dynamic API Route Handlers.
- **MongoDB Atlas Integration**: Live cloud database for products, user accounts, and checkout orders.
- **Curated 4 Flagship Denim Editions**:
  - `HC-VSS-001`: *The 1968 Vintage Straight Selvedge* (14oz Kaihara Raw Indigo — ₹4,990)
  - `HC-CTK-002`: *The Chelsea Tapered Kuroki Black* (13.5oz Kuroki Sulfur Black — ₹5,490)
  - `HC-SWR-003`: *The Shibuya Wide-Leg Rigid* (15oz Kurabo Deep Indigo — ₹5,990)
  - `HC-ATJ-004`: *The Artisan Trucker Jacket* (13oz Candiani Vintage Wash — ₹4,490)
- **Full Admin Console (`/admin`)**:
  - **Live Dashboard**: KPI cards, gross sales, active product count, order counter, and recent orders.
  - **Product Management (`/admin/products`)**: Filter, search, "+ Add New Product", "Edit", and "Delete" with confirmation modal.
  - **Add & Edit Studio (`/admin/products/new`, `/admin/products/edit/[id]`)**: Title, SKU, slug, pricing, fit silhouettes, images, and full dynamic sizes/stock matrix.
  - **Inventory Matrix (`/admin/inventory`)**: Live stock by waist size (28–38) with inline restock adjustments.
  - **Order Fulfillment (`/admin/orders`)**: Inspect customer items, address details, and update fulfillment states (*Placed*, *Confirmed*, *Processing*, *Shipped*, *Delivered*).
  - **Customer Directory (`/admin/customers`)**: View registered members and atelier loyalty points.
  - **Analytics & Settings (`/admin/analytics`, `/admin/settings`)**: Sales distribution and store preferences.
- **Storefront & Checkout Flows**:
  - Interactive product studio with size selectors (28, 30, 32, 34, 36, 38) and stock validation.
  - Slide-over Bag Drawer and persistent Cart state with localStorage.
  - Seamless Multi-step Checkout: Shipping Address &rarr; Payment Selection (UPI/QR, Cards, Netbanking, COD) &rarr; Instant Order Confirmation receipt.
  - Lookbook (`/selvedge`), Care & Sizing Matrix (`/help`), Customer Profile (`/account`), Sign In (`/login`), and Register (`/register`).

---

## ⚙️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Verify `.env` in `harry-co-jeans/`:
```env
MONGODB_URI=mongodb+srv://1032251316_db_user:Naveen%402005@cluster0.imwycno.mongodb.net/harry_co_jeans?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=harry_co_jeans
JWT_SECRET=hc_super_secret_jwt_key_2026_selvedge_craft
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Build and Run Production
```bash
npm run build
npm start
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@hcjeans.com` | `admin123` | Full access to `/admin` dashboard, products, stock & orders |
| **Customer** | `customer@hcjeans.com` | `customer123` | Member loyalty points, saved profile, and checkout |
