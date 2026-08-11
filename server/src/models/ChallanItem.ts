import pool from '../config/db.js';
import type { ResultSetHeader, PoolConnection } from 'mysql2/promise';

export interface ChallanItem {
  id?: number;
  challan_id: number;
  product_id: number;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
}

export class ChallanItemModel {
  static async create(item: ChallanItem, connection?: PoolConnection): Promise<number> {
    const exec = connection || pool;
    const [result] = await exec.query<ResultSetHeader>(
      `INSERT INTO challan_items (challan_id, product_id, product_name_snapshot, unit_price_snapshot, quantity)
       VALUES (?, ?, ?, ?, ?)`,
      [
        item.challan_id,
        item.product_id,
        item.product_name_snapshot,
        item.unit_price_snapshot,
        item.quantity,
      ]
    );
    return result.insertId;
  }
}