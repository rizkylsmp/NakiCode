import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";

type CategoryRow = RowDataPacket & {
  id: number;
  name: string;
};

type CategoryWithIdRow = RowDataPacket & {
  id: number;
  name: string;
  design_count: number | string;
};

type CategoryDesignTitleRow = RowDataPacket & {
  category_id: number | null;
  category: string;
  title: string;
};

export async function findTemplateCategories() {
  const [rows] = await pool.query<CategoryRow[]>(
    "SELECT name FROM categories ORDER BY sort_order ASC, id ASC",
  );

  return ["Semua", ...rows.map((row) => row.name)];
}

export async function findTemplateCategoriesWithIds() {
  const [rows] = await pool.query<CategoryWithIdRow[]>(
    `SELECT categories.id, categories.name, COUNT(designs.id) AS design_count
    FROM categories
    LEFT JOIN designs
      ON designs.deleted_at IS NULL
      AND (
        designs.category_id = categories.id
        OR (
          designs.category_id IS NULL
          AND TRIM(designs.category) = categories.name
        )
      )
    GROUP BY categories.id, categories.name, categories.sort_order
    ORDER BY categories.sort_order ASC, categories.id ASC`,
  );

  const [designRows] = await pool.query<CategoryDesignTitleRow[]>(
    `SELECT category_id, category, title
    FROM designs
    WHERE deleted_at IS NULL
    ORDER BY title ASC`,
  );
  const titlesByCategoryId = new Map<number, string[]>();
  const legacyTitlesByCategoryName = new Map<string, string[]>();

  for (const design of designRows) {
    const title = String(design.title ?? "").trim();
    if (!title) continue;

    if (design.category_id !== null && design.category_id !== undefined) {
      const titles = titlesByCategoryId.get(design.category_id) ?? [];
      titles.push(title);
      titlesByCategoryId.set(design.category_id, titles);
      continue;
    }

    const categoryName = String(design.category ?? "")
      .trim()
      .toLocaleLowerCase("id-ID");
    if (!categoryName) continue;
    const titles = legacyTitlesByCategoryName.get(categoryName) ?? [];
    titles.push(title);
    legacyTitlesByCategoryName.set(categoryName, titles);
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    designCount: Number(row.design_count ?? 0),
    designTitles: [
      ...(titlesByCategoryId.get(row.id) ?? []),
      ...(
        legacyTitlesByCategoryName.get(
          row.name.trim().toLocaleLowerCase("id-ID"),
        ) ?? []
      ),
    ],
  }));
}

export async function createTemplateCategory(name: string) {
  const normalizedName = name.trim();
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO categories (name, sort_order)
    SELECT ?, COALESCE(MAX(sort_order), 0) + 1
    FROM categories`,
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
      "SELECT name FROM categories WHERE id = ? FOR UPDATE",
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
      `UPDATE categories SET ${updates.join(", ")} WHERE id = ?`,
      [...params, id],
    );

    if (nextName && nextName !== previousName) {
      await connection.query(
        "UPDATE designs SET category = ? WHERE category_id = ?",
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
    "SELECT name FROM categories WHERE id = ? LIMIT 1",
    [id],
  );
  const categoryName = categoryRows[0]?.name;

  if (!categoryName) {
    return {
      deleted: false,
      inUse: false,
      designCount: 0,
      categories: await findTemplateCategories(),
      adminCategories: await findTemplateCategoriesWithIds(),
    };
  }

  const designCount = await countCategoryUsageById(id, categoryName);

  if (designCount > 0) {
    return {
      deleted: false,
      inUse: true,
      designCount,
      categories: await findTemplateCategories(),
      adminCategories: await findTemplateCategoriesWithIds(),
    };
  }

  await pool.query(
    `UPDATE designs
    SET category_id = NULL
    WHERE category_id = ? AND deleted_at IS NOT NULL`,
    [id],
  );

  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM categories WHERE id = ?",
    [id],
  );

  return {
    deleted: result.affectedRows > 0,
    inUse: false,
    designCount: 0,
    categories: await findTemplateCategories(),
    adminCategories: await findTemplateCategoriesWithIds(),
  };
}

export async function isCategoryInUse(categoryName: string): Promise<boolean> {
  const [categoryRows] = await pool.query<CategoryRow[]>(
    "SELECT id, name FROM categories WHERE name = ? LIMIT 1",
    [categoryName.trim()],
  );

  return (
    (await countCategoryUsageById(categoryRows[0]?.id ?? null, categoryName)) >
    0
  );
}

async function countCategoryUsageById(
  categoryId: number | null,
  categoryName: string,
): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count
    FROM designs
    WHERE deleted_at IS NULL
      AND (
        category_id = ?
        OR (category_id IS NULL AND TRIM(category) = ?)
      )`,
    [categoryId ?? 0, categoryName.trim()],
  );

  return Number(rows[0]?.count ?? 0);
}
