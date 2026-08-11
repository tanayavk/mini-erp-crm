import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Resolve path to server/.env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 2. Create pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mini_erp_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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

    // 4. Seed Customers (Indianized)
    const customers = [
      [
        'Rajesh Kumar',
        '+919876543210',
        'rajesh@shreeram.in',
        'Shree Ram Enterprises Pvt Ltd',
        '29AABCU9603R1ZM',
        'Distributor',
        'Plot No 42, Peenya Industrial Area Phase 2, Bengaluru, Karnataka - 560058',
        'Active',
      ],
      [
        'Ananya Sharma',
        '+919876543211',
        'ananya@apexretails.co.in',
        'Apex Retails India Ltd',
        '27AAACA1234B1Z2',
        'Retail',
        'Shop 14, Linking Road, Bandra West, Mumbai, Maharashtra - 400050',
        'Active',
      ],
      [
        'Vikram Patel',
        '+919876543212',
        'vikram@gujarattraders.com',
        'Gujarat Traders & Co',
        '24AABCG5678C1Z5',
        'Wholesale',
        'GIDC Estate, Makarpura, Vadodara, Gujarat - 390010',
        'Lead',
      ],
      [
        'Suresh Reddy',
        '+919876543213',
        'orders@deccanlogistics.in',
        'Deccan Logistics Hub',
        '36AABCD9012D1Z8',
        'Distributor',
        'H.No 8-3-228, Ameerpet, Hyderabad, Telangana - 500016',
        'Active',
      ],
      [
        'Priya Nair',
        '+919876543214',
        'priya@kochicommercial.com',
        'Kochi Commercial Supplies',
        '32AABCK3456E1Z1',
        'Retail',
        'MG Road, Ernakulam, Kochi, Kerala - 682016',
        'Inactive',
      ],
    ];

    const [customerResult] = await connection.query(
      'INSERT INTO customers (name, mobile, email, business_name, gst_number, type, address, status) VALUES ?',
      [customers]
    );
    console.log('✅ Seeded 5 Indian Customers.');

    // 5. Seed Customer Notes
    const customerNotes = [
      [
        1,
        'Discussed annual supply contract renewal and GST E-Invoicing terms.',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        1,
      ],
      [
        2,
        'Client requested catalog pricing update for upcoming Diwali sale event.',
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        1,
      ],
    ];

    await connection.query(
      'INSERT INTO customer_notes (customer_id, note, follow_up_date, created_by) VALUES ?',
      [customerNotes]
    );
    console.log('✅ Seeded Customer Follow-Up Notes.');

    // 6. Seed Products (Indianized Pricing & Warehouses)
    const products = [
      [
        'Wireless Ergonomic Optical Mouse',
        'MOUSE-ERG-001',
        'Electronics',
        1299.00,
        85,
        15,
        'Bhiwandi Warehouse - Rack A1',
      ],
      [
        'Mechanical RGB Keyboard (US Layout)',
        'KEYB-MECH-002',
        'Electronics',
        3499.00,
        8,
        10,
        'Bhiwandi Warehouse - Rack A2',
      ],
      [
        'CAT6 High Speed Ethernet Cable (30m)',
        'CABL-CAT6-030',
        'Hardware',
        850.00,
        120,
        20,
        'Whitefield Logistics Hub - Bin 04',
      ],
      [
        'Heavy Duty Shipping Tape (Pack of 6)',
        'PKG-TAPE-006',
        'Packaging',
        450.00,
        5,
        12,
        'GIDC Industrial Zone - Rack C',
      ],
      [
        'Ergonomic Mesh Executive Chair',
        'FURN-CHR-009',
        'Office Supplies',
        7999.00,
        14,
        5,
        'Peenya Central Depot - Bay 2',
      ],
    ];

    const [productResult] = await connection.query(
      'INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location) VALUES ?',
      [products]
    );
    console.log('✅ Seeded 5 Indian Inventory Products.');

    // 7. Seed Stock Movement Audit Logs (IN & OUT)
    const firstProductId = productResult.insertId;
    const stockLogs = [
      [
        firstProductId,
        100,
        'IN',
        'Received PO-2026-0811 bulk shipment from vendor',
        1,
      ],
      [
        firstProductId,
        15,
        'OUT',
        'Dispatched for Sales Challan #CHLN-20260811-0001',
        1,
      ],
      [
        firstProductId + 1,
        20,
        'IN',
        'Stock intake top-up from central depot',
        1,
      ],
      [
        firstProductId + 1,
        12,
        'OUT',
        'Stock scrapped due to transit enclosure damage',
        1,
      ],
    ];

    await connection.query(
      'INSERT INTO stock_logs (product_id, quantity_changed, movement_type, reason, created_by) VALUES ?',
      [stockLogs]
    );
    console.log('✅ Seeded Stock Movement Audit Logs (IN & OUT).');

    // 8. Seed Initial Sales Challans & Items
    const firstCustomerId = customerResult.insertId;
    const [challanResult] = await connection.query(
      `INSERT INTO sales_challans (challan_number, customer_id, total_quantity, status, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      ['CHLN-20260811-0001', firstCustomerId, 2, 'Confirmed', 1]
    );

    const challanId = challanResult.insertId;
    const challanItems = [
      [challanId, firstProductId, 'Wireless Ergonomic Optical Mouse', 1299.00, 2],
    ];

    await connection.query(
      'INSERT INTO challan_items (challan_id, product_id, product_name_snapshot, unit_price_snapshot, quantity) VALUES ?',
      [challanItems]
    );
    console.log('✅ Seeded Initial Sales Challans & Line Items.');

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