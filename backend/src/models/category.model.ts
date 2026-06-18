import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";

type CategoryRow = RowDataPacket & {
  name: string;
};

export async function findTemplateCategories() {
  const [rows] = await pool.query<CategoryRow[]>(
    "SELECT name FROM template_categories ORDER BY sort_order ASC, id ASC",
  );

  return ["Semua", ...rows.map((row) => row.name)];
}

export async function createTemplateCategory(name: string) {
  const normalizedName = name.trim();
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO template_categories (name, sort_order)
    SELECT ?, COALESCE(MAX(sort_order), 0) + 1
    FROM template_categories`,
    [normalizedName],
  );

  return {
    wasCreated: result.affectedRows > 0,
    category: normalizedName,
    categories: await findTemplateCategories(),
  };
}
