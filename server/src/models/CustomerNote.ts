import pool from '../config/db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface CustomerNote {
  id?: number;
  customer_id: number;
  note: string;
  follow_up_date: string | Date;
  created_by: number;
  created_at?: Date;
}

export class CustomerNoteModel {
  static async create(noteData: CustomerNote): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO customer_notes (customer_id, note, follow_up_date, created_by)
       VALUES (?, ?, ?, ?)`,
      [
        noteData.customer_id,
        noteData.note,
        noteData.follow_up_date,
        noteData.created_by,
      ]
    );
    return result.insertId;
  }

  static async findByCustomerId(customerId: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT cn.*, u.name as created_by_name, u.email as created_by_email 
       FROM customer_notes cn
       JOIN users u ON cn.created_by = u.id
       WHERE cn.customer_id = ?
       ORDER BY cn.created_at DESC`,
      [customerId]
    );
    return rows;
  }
}