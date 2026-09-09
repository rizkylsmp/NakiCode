import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';

export async function findFavoriteTemplateIds(userId: number) {
  const [rows] = await pool.query<Array<RowDataPacket & { design_id: number }>>(
    `SELECT favorites.design_id
    FROM user_design_favorites AS favorites
    INNER JOIN designs ON designs.id = favorites.design_id
    WHERE favorites.user_id = ?
      AND designs.deleted_at IS NULL
    ORDER BY favorites.id DESC`,
    [userId],
  );

  return rows.map((row) => row.design_id);
}

export async function addFavoriteTemplate(userId: number, templateId: number) {
  await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO user_design_favorites (user_id, design_id)
    VALUES (?, ?)`,
    [userId, templateId],
  );
}

export async function removeFavoriteTemplate(userId: number, templateId: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM user_design_favorites
    WHERE user_id = ? AND design_id = ?`,
    [userId, templateId],
  );

  return result.affectedRows > 0;
}
