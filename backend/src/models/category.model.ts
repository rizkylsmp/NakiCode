import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";

type CategoryRow = RowDataPacket & {
  id: number;
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
    adminCategories: await findTemplateCategoriesWithIds(),
  };
}

export async function updateTemplateCategory(
  id: number,
  data: { name?: string; sort_order?: number },
) {
  const updates: string[] = [];
  const params: (string | number)[] = [];
  const nextName = data.name?.trim();

  if (nextName !== undefined) {
    updates.push("name = ?");
    params.push(nextName);
  }

  if (data.sort_order !== undefined) {
    updates.push("sort_order = ?");
    params.push(data.sort_order);
  }

  if (updates.length === 0) {
    return {
      updated: false,
      categories: await findTemplateCategories(),
      adminCategories: await findTemplateCategoriesWithIds(),
    };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<CategoryRow[]>(
      "SELECT name FROM template_categories WHERE id = ? FOR UPDATE",
      [id],
    );
    const previousName = rows[0]?.name;

    if (!previousName) {
      await connection.rollback();
      return {
        updated: false,
        categories: await findTemplateCategories(),
        adminCategories: await findTemplateCategoriesWithIds(),
      };
    }

    await connection.query<ResultSetHeader>(
      `UPDATE template_categories SET ${updates.join(", ")} WHERE id = ?`,
      [...params, id],
    );

    if (nextName && nextName !== previousName) {
      await connection.query(
        "UPDATE templates SET category = ? WHERE category_id = ?",
        [nextName, id],
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return {
    updated: true,
    categories: await findTemplateCategories(),
    adminCategories: await findTemplateCategoriesWithIds(),
  };
}

export async function deleteTemplateCategory(id: number) {
  const [categoryRows] = await pool.query<CategoryRow[]>(
    "SELECT name FROM template_categories WHERE id = ? LIMIT 1",
    [id],
  );
  const categoryName = categoryRows[0]?.name;

  if (!categoryName) {
    return {
      deleted: false,
      inUse: false,
      categories: await findTemplateCategories(),
      adminCategories: await findTemplateCategoriesWithIds(),
    };
  }

  if (await isCategoryInUseById(id, categoryName)) {
    return {
      deleted: false,
      inUse: true,
      categories: await findTemplateCategories(),
      adminCategories: await findTemplateCategoriesWithIds(),
    };
  }

  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM template_categories WHERE id = ?",
    [id],
  );

  return {
    deleted: result.affectedRows > 0,
    inUse: false,
    categories: await findTemplateCategories(),
    adminCategories: await findTemplateCategoriesWithIds(),
  };
}

export async function isCategoryInUse(categoryName: string): Promise<boolean> {
  const [categoryRows] = await pool.query<CategoryRow[]>(
    "SELECT id, name FROM template_categories WHERE name = ? LIMIT 1",
    [categoryName.trim()],
  );

  return isCategoryInUseById(categoryRows[0]?.id ?? null, categoryName);
}

async function isCategoryInUseById(
  categoryId: number | null,
  categoryName: string,
): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count
    FROM templates
    WHERE deleted_at IS NULL
      AND (
        category_id = ?
        OR (category_id IS NULL AND TRIM(category) = ?)
      )`,
    [categoryId ?? 0, categoryName.trim()],
  );

  return (rows[0]?.count ?? 0) > 0;
}
