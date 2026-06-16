import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';

export async function findFavoriteTemplateIds(userId: number) {
  const [rows] = await pool.query<Array<RowDataPacket & { template_id: number }>>(
    `SELECT favorites.template_id
    FROM user_template_favorites AS favorites
    INNER JOIN templates ON templates.id = favorites.template_id
    WHERE favorites.user_id = ?
      AND templates.deleted_at IS NULL
    ORDER BY favorites.id DESC`,
    [userId],
  );

  return rows.map((row) => row.template_id);
}

export async function addFavoriteTemplate(userId: number, templateId: number) {
  await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO user_template_favorites (user_id, template_id)
    VALUES (?, ?)`,
    [userId, templateId],
  );
}

export async function removeFavoriteTemplate(userId: number, templateId: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM user_template_favorites
    WHERE user_id = ? AND template_id = ?`,
    [userId, templateId],
  );

  return result.affectedRows > 0;
}
