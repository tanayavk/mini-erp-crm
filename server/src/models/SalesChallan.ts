import pool from '../config/db.js';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

export type ChallanStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface SalesChallan {
  id?: number;
  challan_number: string;
  customer_id: number;
  total_quantity: number;
  status: ChallanStatus;
  created_by: number;
  created_at?: Date;
}

export class SalesChallanModel {
  static async create(challan: SalesChallan, connection?: PoolConnection): Promise<number> {
    const exec = connection || pool;
    const [result] = await exec.query<ResultSetHeader>(
      `INSERT INTO sales_challans (challan_number, customer_id, total_quantity, status, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        challan.challan_number,
        challan.customer_id,
        challan.total_quantity,
        challan.status,
        challan.created_by,
      ]
    );
    return result.insertId;
  }

  static async findById(id: number): Promise<SalesChallan | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM sales_challans WHERE id = ?',
      [id]
    );
    return (rows[0] as SalesChallan) || null;
  }
}