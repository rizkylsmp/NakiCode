import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";

type CategoryRow = RowDataPacket & {
  name: string;
};

type CategoryWithIdRow = RowDataPacket & {
  id: number;
  name: string;
};

export async function findTemplateCategories() {
  const [rows] = await pool.query<CategoryRow[]>(
    "SELECT name FROM template_categories ORDER BY sort_order ASC, id ASC",
  );

  return ["Semua", ...rows.map((row) => row.name)];
}

export async function findTemplateCategoriesWithIds() {
  const [rows] = await pool.query<CategoryWithIdRow[]>(
    "SELECT id, name FROM template_categories ORDER BY sort_order ASC, id ASC",
  );

  return rows.map((row) => ({ id: row.id, name: row.name }));
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

export async function updateTemplateCategory(
  id: number,
  data: { name?: string; sort_order?: number },
) {
  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    params.push(data.name.trim());
  }

  if (data.sort_order !== undefined) {
    updates.push("sort_order = ?");
    params.push(data.sort_order);
  }

  if (updates.length === 0) {
    return { updated: false, categories: await findTemplateCategories() };
  }

  params.push(id);
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE template_categories SET ${updates.join(", ")} WHERE id = ?`,
    params,
  );

  return {
    updated: result.affectedRows > 0,
    categories: await findTemplateCategories(),
  };
}

export async function deleteTemplateCategory(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM template_categories WHERE id = ?",
    [id],
  );

  return {
    deleted: result.affectedRows > 0,
    categories: await findTemplateCategories(),
  };
}

export async function isCategoryInUse(categoryName: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM templates WHERE category = ? AND deleted_at IS NULL",
    [categoryName],
  );

  return (rows[0]?.count ?? 0) > 0;
}
