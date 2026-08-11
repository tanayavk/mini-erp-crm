import type { RowDataPacket } from 'mysql2';
import pool from '../config/db.js';

/**
 * Generates a unique Sales Challan Number in the format CHLN-YYYYMMDD-XXXX
 * Uses a sequential counter per day and checks uniqueness against sales_challans.
 */
export const generateChallanNo = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const prefix = `CHLN-${dateStr}-`;

  // Find the highest sequence number for today
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT challan_number FROM sales_challans 
     WHERE challan_number LIKE ? 
     ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let sequence = 1;
  if (rows.length > 0 && rows[0]?.challan_number) {
    const lastChallanNo: string = rows[0].challan_number;
    const parts = lastChallanNo.split('-');
    const lastSeqStr = parts[parts.length - 1];
    if (lastSeqStr) {
      const lastSeq = parseInt(lastSeqStr, 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
  }

  const sequenceStr = String(sequence).padStart(4, '0');
  return `${prefix}${sequenceStr}`;
};