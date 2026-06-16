import type { RowDataPacket } from 'mysql2';
import { pool } from '../db';

type CategoryRow = RowDataPacket & {
  name: string;
};

export async function findTemplateCategories() {
  const [rows] = await pool.query<CategoryRow[]>(
    'SELECT name FROM template_categories ORDER BY sort_order ASC, id ASC',
  );

  return ['Semua', ...rows.map((row) => row.name)];
}
