import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';

type NotificationRow = RowDataPacket & {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  related_order_id?: number | null;
  read_at?: string | null;
  created_at?: string;
};

export type NotificationItem = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  relatedOrderId: number | null;
  readAt: string | null;
  createdAt: string;
};

export async function createNotification(payload: {
  userId: number | null;
  title: string;
  message: string;
  type?: string;
  relatedOrderId?: number | null;
}) {
  if (!payload.userId) {
    return null;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_order_id
    ) VALUES (?, ?, ?, ?, ?)`,
    [
      payload.userId,
      payload.title,
      payload.message,
      payload.type ?? 'order',
      payload.relatedOrderId ?? null,
    ],
  );

  return result.insertId;
}

export async function findNotificationsByUser(userId: number) {
  const [rows] = await pool.query<NotificationRow[]>(
    `SELECT id, user_id, title, message, type, related_order_id, read_at, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 40`,
    [userId],
  );

  return rows.map(normalizeNotificationRow);
}

export async function markNotificationRead(id: number, userId: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE notifications
    SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
    WHERE id = ? AND user_id = ?`,
    [id, userId],
  );

  return result.affectedRows > 0;
}

export async function markAllNotificationsRead(userId: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE notifications
    SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
    WHERE user_id = ? AND read_at IS NULL`,
    [userId],
  );

  return result.affectedRows;
}

function normalizeNotificationRow(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    relatedOrderId: row.related_order_id ?? null,
    readAt: row.read_at ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}
