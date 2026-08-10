import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  console.log('🔄 Running Database Migrations...\n');
  const connection = await pool.getConnection();

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Execute multiple statements
    await connection.query(sql);

    console.log('✅ Database migration completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration Failed:', error);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

migrate();