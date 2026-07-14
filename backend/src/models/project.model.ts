import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";

type ProjectRow = RowDataPacket & {
  id: number;
  title: string;
  category: string;
  description: string;
  result: string;
  website_url: string;
  image_url: string | null;
  image_urls: string | string[] | null;
  cover_index: number;
  created_at?: string;
};

type ProjectCountRow = RowDataPacket & {
  total: number;
};

export type ProjectPayload = {
  title: string;
  category: string;
  description: string;
  result: string;
  websiteUrl: string;
  imageUrl: string | null;
  imageUrls: string[];
  coverIndex: number;
};

export type ProjectItem = ProjectPayload & {
  id: number;
  createdAt: string;
};

const projectSelect = `SELECT
  id,
  title,
  category,
  description,
  result,
  website_url,
  image_url,
  image_urls,
  cover_index,
  created_at
FROM projects
WHERE deleted_at IS NULL`;

export async function findProjects() {
  const [rows] = await pool.query<ProjectRow[]>(
    `${projectSelect}
    ORDER BY id DESC
    LIMIT 30`,
  );

  return rows.map(normalizeProjectRow);
}

export async function findProjectsPage(page = 1, pageSize = 9) {
  const safePageSize = Math.max(1, Math.min(30, Math.floor(pageSize)));
  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * safePageSize;
  const [[countRow], [rows]] = await Promise.all([
    pool.query<ProjectCountRow[]>(
      "SELECT COUNT(*) AS total FROM projects WHERE deleted_at IS NULL",
    ),
    pool.query<ProjectRow[]>(
      `${projectSelect}
      ORDER BY id DESC
      LIMIT ? OFFSET ?`,
      [safePageSize, offset],
    ),
  ]);
  const total = Number(countRow[0]?.total ?? 0);

  return {
    projects: rows.map(normalizeProjectRow),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
  };
}

export async function findProjectById(id: number) {
  const [rows] = await pool.query<ProjectRow[]>(
    `${projectSelect}
    AND id = ?
    LIMIT 1`,
    [id],
  );

  return rows[0] ? normalizeProjectRow(rows[0]) : null;
}

export async function createProject(payload: ProjectPayload) {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO projects (
      title,
      category,
      description,
      result,
      website_url,
      image_url,
      image_urls,
      cover_index
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.title,
      payload.category,
      payload.description,
      payload.result,
      payload.websiteUrl,
      payload.imageUrl,
      JSON.stringify(payload.imageUrls),
      payload.coverIndex,
    ],
  );

  return findProjectById(result.insertId);
}

export async function updateProject(id: number, payload: ProjectPayload) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE projects
    SET title = ?,
      category = ?,
      description = ?,
      result = ?,
      website_url = ?,
      image_url = ?,
      image_urls = ?,
      cover_index = ?
    WHERE id = ? AND deleted_at IS NULL`,
    [
      payload.title,
      payload.category,
      payload.description,
      payload.result,
      payload.websiteUrl,
      payload.imageUrl,
      JSON.stringify(payload.imageUrls),
      payload.coverIndex,
      id,
    ],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findProjectById(id);
}

export async function deleteProject(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE projects
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );

  return result.affectedRows > 0;
}

export function normalizeProjectPayload(
  body: Record<string, unknown>,
): ProjectPayload {
  const imageUrls = normalizeProjectImages(body);
  const coverIndex = normalizeProjectCoverIndex(
    body.coverIndex ?? body.cover_index,
    imageUrls,
  );

  return {
    title: String(body.title ?? "").trim(),
    category: String(body.category ?? "Website").trim(),
    description: String(body.description ?? "").trim(),
    result: String(body.result ?? "Website selesai").trim(),
    websiteUrl:
      String(body.websiteUrl ?? body.website_url ?? "#").trim() || "#",
    imageUrl:
      String(imageUrls[coverIndex] ?? body.imageUrl ?? body.image_url ?? "").trim() ||
      null,
    imageUrls,
    coverIndex,
  };
}

function normalizeProjectRow(row: ProjectRow): ProjectItem {
  const imageUrls = normalizeProjectImages(row);
  const coverIndex = normalizeProjectCoverIndex(row.cover_index, imageUrls);
  const imageUrl = row.image_url || imageUrls[coverIndex] || null;

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    result: row.result,
    websiteUrl: row.website_url,
    imageUrl,
    imageUrls: imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [],
    coverIndex,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function normalizeProjectCoverIndex(value: unknown, imageUrls: string[]) {
  const index = Number(value ?? 0);

  return Number.isInteger(index) && index >= 0 && index < imageUrls.length
    ? index
    : 0;
}

function normalizeProjectImages(source: Record<string, unknown>): string[] {
  const rawImages =
    source.imageUrls ??
    source.image_urls ??
    source.imageUrl ??
    source.image_url;

  if (Array.isArray(rawImages)) {
    return rawImages
      .map((imageUrl) => String(imageUrl).trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  if (typeof rawImages === "string") {
    const trimmed = rawImages.trim();

    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;

        if (Array.isArray(parsed)) {
          return parsed
            .map((imageUrl) => String(imageUrl).trim())
            .filter(Boolean)
            .slice(0, 12);
        }
      } catch {
        return [];
      }
    }

    return [trimmed];
  }

  return [];
}
