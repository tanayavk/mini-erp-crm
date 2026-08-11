import pool from '../config/db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor' | 'Lead';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';

export interface Customer {
  id?: number;
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number?: string | null;
  type: CustomerType;
  address: string;
  status: CustomerStatus;
  created_at?: Date;
}

export class CustomerModel {
  static async create(customer: Customer): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO customers (name, mobile, email, business_name, gst_number, type, address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.name,
        customer.mobile,
        customer.email,
        customer.business_name,
        customer.gst_number || null,
        customer.type,
        customer.address,
        customer.status,
      ]
    );
    return result.insertId;
  }

  static async findById(id: number): Promise<Customer | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );
    return (rows[0] as Customer) || null;
  }
}