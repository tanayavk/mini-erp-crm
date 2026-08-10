-- Disable foreign key checks for clean execution
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS challan_items;
DROP TABLE IF EXISTS sales_challans;
DROP TABLE IF EXISTS stock_logs;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customer_notes;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Sales', 'Warehouse', 'Accounts') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CUSTOMERS
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  business_name VARCHAR(150),
  gst_number VARCHAR(15) DEFAULT NULL,
  type ENUM('Retail', 'Wholesale', 'Distributor', 'Lead') NOT NULL DEFAULT 'Retail',
  address TEXT,
  status ENUM('Lead', 'Active', 'Inactive') NOT NULL DEFAULT 'Lead',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customers_name (name),
  INDEX idx_customers_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CUSTOMER NOTES
CREATE TABLE customer_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  note TEXT NOT NULL,
  follow_up_date DATETIME DEFAULT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notes_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_notes_user FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PRODUCTS
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock_alert INT NOT NULL DEFAULT 5,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_stock_non_negative CHECK (current_stock >= 0),
  INDEX idx_products_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. STOCK LOGS
CREATE TABLE stock_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity_changed INT NOT NULL,
  movement_type ENUM('IN', 'OUT') NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_product FOREIGN KEY (product_id) 
    REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_stock_user FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SALES CHALLANS
CREATE TABLE sales_challans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  challan_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  total_quantity INT NOT NULL DEFAULT 0,
  status ENUM('Draft', 'Confirmed', 'Cancelled') NOT NULL DEFAULT 'Draft',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_challan_customer FOREIGN KEY (customer_id) 
    REFERENCES customers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_challan_user FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_challan_number (challan_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. CHALLAN ITEMS
CREATE TABLE challan_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  challan_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name_snapshot VARCHAR(200) NOT NULL,
  unit_price_snapshot DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  CONSTRAINT fk_item_challan FOREIGN KEY (challan_id) 
    REFERENCES sales_challans(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_product FOREIGN KEY (product_id) 
    REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;