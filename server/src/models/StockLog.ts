import pool from '../config/db.js';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

export type MovementType = 'IN' | 'OUT';

export interface StockLog {
  id?: number;
  product_id: number;
  quantity_changed: number;
  movement_type: MovementType;
  reason: string;
  created_by: number;
  created_at?: Date;
}

export class StockLogModel {
  static async create(log: StockLog, connection?: PoolConnection): Promise<number> {
    const exec = connection || pool;
    const [result] = await exec.query<ResultSetHeader>(
      `INSERT INTO stock_logs (product_id, quantity_changed, movement_type, reason, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        log.product_id,
        log.quantity_changed,
        log.movement_type,
        log.reason,
        log.created_by,
      ]
    );
    return result.insertId;
  }
}