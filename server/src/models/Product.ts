import pool from '../config/db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Product {
  id?: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location: string;
  created_at?: Date;
}

export class ProductModel {
  static async create(product: Product): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        product.name,
        product.sku,
        product.category,
        product.unit_price,
        product.current_stock,
        product.min_stock_alert || 5,
        product.location,
      ]
    );
    return result.insertId;
  }

  static async findBySku(sku: string): Promise<Product | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE sku = ?',
      [sku]
    );
    return (rows[0] as Product) || null;
  }

  static async findById(id: number): Promise<Product | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    return (rows[0] as Product) || null;
  }
}