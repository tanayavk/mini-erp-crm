# Unified Business Platform — Mini ERP & CRM Operations Portal

A full-stack Mini ERP & CRM system built for wholesale and distribution operations. Features role-based access control (RBAC), real-time inventory tracking with atomic MySQL row locks, sales challan workflows with snapshot metadata and PDF invoice generation.

---

## 🔑 Test Login Credentials

All test accounts use the password: `Password123!`

| Role | Email | Module Access Overview |
| :--- | :--- | :--- |
| **Admin** | `admin@erp.com` | Full CRUD across all modules. |
| **Sales** | `sales@erp.com` | Full Customer CRM & Sales Challans; Read-Only Products & Stock. |
| **Warehouse** | `warehouse@erp.com` | Full Products & Manual Stock (`IN`/`OUT`); Read-Only CRM & Challans. |
| **Accounts** | `accounts@erp.com` | Read-Only across Customers, Products, Stock, and Sales Challans. |

---

## 🛠️ Tech Stack

### Backend
* **Runtime & Language**: Node.js (v22+) with TypeScript in strict ESM mode (`"type": "module"`).
* **Framework**: Express.js with centralized error handling.
* **Database & Driver**: MySQL 8.x using `mysql2/promise` with asynchronous connection pooling.
* **Validation & Security**: Joi schema validation, `bcryptjs` password hashing and JWT authorization (`jsonwebtoken`).

### Frontend
* **Core Framework**: React (Vite).
* **Styling**: Tailwind CSS v4.
* **State & Routing**: React Context API (`AuthContext`), React Router DOM v6, Axios with interceptors.
* **PDF Engine**: `jspdf` & `jspdf-autotable`.

---

## 📁 Project Directory Structure

```text
MINI-ERP-CRM/
├── docs/                     # Postman API Collection export
│   └── Unified_Business_Platform_API.json
├── client/                   # React Frontend (Vite)
│   ├── src/
│   │   ├── components/       # UI Components (CRM, Inventory, Challans, Common)
│   │   ├── context/          # AuthContext for JWT & RBAC state management
│   │   ├── pages/            # Views (Dashboard, Customers, Products, Challans, Login)
│   │   ├── services/         # Axios API instance with request/response interceptors
│   │   └── utils/            # B2B Invoice PDF Generation utility
│   ├── .env.example
│   └── package.json
└── server/                   # Express TypeScript Backend
    ├── src/
    │   ├── config/           # MySQL pool connection setup
    │   ├── controllers/      # Route logic (Auth, Customers, Products, Challans)
    │   ├── db/               # Raw SQL migration runner & seed scripts
    │   ├── middleware/       # Auth JWT, Role RBAC, and Error handling
    │   ├── models/           # SQL model interfaces and query abstractions
    │   ├── routes/           # Express route definitions
    │   ├── types/            # Custom Express Request & API response interfaces
    │   └── utils/            # Unique Challan sequence generator
    ├── .env.example
    └── package.json


---

## 💻 Local Development Setup Guide

### 1. Prerequisites

* **Node.js**: v22.x or higher


* **MySQL Server**: v8.x running locally or on a cloud instance



### 2. Database Setup

Launch your MySQL terminal and create the database:

```sql
CREATE DATABASE mini_erp_crm;

```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd server

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Run database migrations (creates all 7 tables)
npm run db:migrate

# Seed initial test users, customers, and products
npm run db:seed

# Start backend server in development mode
npm run dev

```

*Backend runs on:* `http://localhost:5000`

### 4. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal tab)
cd client

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Start Vite development server
npm run dev

```

*Frontend runs on:* `http://localhost:5173`

---

## ⚙️ Environment Variables Setup

### Backend (`server/.env`)

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mini_erp_crm
DB_PORT=3306
JWT_SECRET=super_secret_jwt_key_2026
CORS_ORIGIN=http://localhost:5173

```

### Frontend (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api

```

---

## 📐 System Architecture

### 1. Database & Transaction Engine

* **Storage Engine**: InnoDB relational MySQL tables enforcing explicit foreign key constraints (`ON DELETE RESTRICT` / `ON DELETE CASCADE`).


* **Atomic Concurrency Control**: Stock subtractions on confirmed sales challans execute inside explicit MySQL transactions (`START TRANSACTION`) with row-level locks (`FOR UPDATE`) to eliminate race conditions and enforce non-negative stock invariants (`current_stock >= 0`).



### 2. Authentication & Authorization (RBAC)

* **Identity Protection**: User credentials use 60-character `bcryptjs` password hashes.


* **Token Verification**: Stateless 24-hour signed JWTs delivered via HTTP `Authorization: Bearer <token>` headers.


* **Route & UI Guards**: Backend endpoints pass through high-order `authorizeRoles(...roles)` middleware, while frontend views wrap routes in `ProtectedRoute` and display visual "Read-Only" state indicators for non-mutating roles.



### 3. Snapshot & Audit Safety

* **Immutable Item Snapshots**: Sales challan line items store frozen snapshots of product names (`product_name_snapshot`) and prices (`unit_price_snapshot`) at order creation to shield historical billing records from catalog edits.


* **System Stock Logs**: Every inventory mutation (manual adjustments or challan dispatches) writes an immutable record to `stock_logs` capturing the product ID, quantity changed, direction (`IN`/`OUT`), user context, and timestamp.



### 4. API Documentation

* Complete Postman / OpenAPI API collection is exported at `docs/Unified_Business_Platform_API.json`.



```

```
