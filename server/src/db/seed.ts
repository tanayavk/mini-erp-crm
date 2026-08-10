import bcrypt from 'bcryptjs';
import pool from '../config/db.js'; // MUST use .js extension under NodeNext ESM

async function seed() {
  console.log('🌱 Starting Database Seeding Routine...\n');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Clear Existing Data
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE challan_items');
    await connection.query('TRUNCATE TABLE sales_challans');
    await connection.query('TRUNCATE TABLE stock_logs');
    await connection.query('TRUNCATE TABLE customer_notes');
    await connection.query('TRUNCATE TABLE products');
    await connection.query('TRUNCATE TABLE customers');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 2. Hash Password for Test Accounts
    const defaultPassword = 'Password123!';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

    // 3. Seed Users
    const users = [
      ['Alice Admin', 'admin@erp.com', passwordHash, 'Admin'],
      ['Sam Sales', 'sales@erp.com', passwordHash, 'Sales'],
      ['Wendy Warehouse', 'warehouse@erp.com', passwordHash, 'Warehouse'],
      ['Arthur Accounts', 'accounts@erp.com', passwordHash, 'Accounts'],
    ];

    await connection.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ?',
      [users]
    );
    console.log('✅ Seeded 4 Users across distinct roles.');

    // 4. Seed Customers
    const customers = [
      ['Apex Retail Corp', '+19876543210', 'contact@apex.com', 'Apex Retail Ltd', '27AABCU9603R1ZM', 'Retail', '123 Main St, Tech Park', 'Active'],
      ['B2B Enterprises', '+19876543211', 'orders@b2b.com', 'B2B Trade Corp', '27AAACB1102R1ZN', 'Wholesale', '45 Industrial Estate, Sector 5', 'Active'],
      ['Global Distributors', '+19876543212', 'info@globaldist.com', 'Global Dist LLC', '27AAACG9901R1ZO', 'Distributor', '89 Logistics Hub, Zone B', 'Lead'],
      ['John Doe', '+19876543213', 'johndoe@gmail.com', null, null, 'Retail', '71 Residential Ave', 'Inactive'],
    ];

    await connection.query(
      'INSERT INTO customers (name, mobile, email, business_name, gst_number, type, address, status) VALUES ?',
      [customers]
    );
    console.log('✅ Seeded 4 Sample Customers.');

    // 5. Seed Products
    const products = [
      ['Wireless Ergonomic Mouse', 'SKU-PERIPH-001', 'Electronics', 49.99, 150, 20, 'Aisle A-12'],
      ['Mechanical RGB Keyboard', 'SKU-PERIPH-002', 'Electronics', 119.50, 45, 10, 'Aisle A-14'],
      ['27-inch 4K Monitor', 'SKU-DISP-001', 'Displays', 329.00, 12, 5, 'Aisle B-02'],
      ['USB-C Multi-port Hub', 'SKU-ACC-001', 'Accessories', 29.99, 200, 30, 'Aisle C-01'],
    ];

    await connection.query(
      'INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location) VALUES ?',
      [products]
    );
    console.log('✅ Seeded 4 Sample Products.');

    await connection.commit();

    console.log('\n==================================================');
    console.log('🎉 SEEDING COMPLETE - TEST CREDENTIALS');
    console.log('==================================================');
    console.log(`Common Password: ${defaultPassword}\n`);
    console.log('Role        | Email');
    console.log('------------|-------------------------------------');
    console.log('Admin       | admin@erp.com');
    console.log('Sales       | sales@erp.com');
    console.log('Warehouse   | warehouse@erp.com');
    console.log('Accounts    | accounts@erp.com');
    console.log('==================================================\n');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

seed();