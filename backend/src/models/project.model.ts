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
  created_at?: string;
};

export type ProjectPayload = {
  title: string;
  category: string;
  description: string;
  result: string;
  websiteUrl: string;
  imageUrl: string | null;
  imageUrls: string[];
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
      image_urls
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.title,
      payload.category,
      payload.description,
      payload.result,
      payload.websiteUrl,
      payload.imageUrl,
      JSON.stringify(payload.imageUrls),
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
      image_urls = ?
    WHERE id = ? AND deleted_at IS NULL`,
    [
      payload.title,
      payload.category,
      payload.description,
      payload.result,
      payload.websiteUrl,
      payload.imageUrl,
      JSON.stringify(payload.imageUrls),
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

  return {
    title: String(body.title ?? "").trim(),
    category: String(body.category ?? "Website").trim(),
    description: String(body.description ?? "").trim(),
    result: String(body.result ?? "Website selesai").trim(),
    websiteUrl:
      String(body.websiteUrl ?? body.website_url ?? "#").trim() || "#",
    imageUrl:
      String(body.imageUrl ?? body.image_url ?? imageUrls[0] ?? "").trim() ||
      null,
    imageUrls,
  };
}

function normalizeProjectRow(row: ProjectRow): ProjectItem {
  const imageUrls = normalizeProjectImages(row);
  const imageUrl = row.image_url || imageUrls[0] || null;

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    result: row.result,
    websiteUrl: row.website_url,
    imageUrl,
    imageUrls: imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [],
    createdAt: row.created_at ?? new Date().toISOString(),
  };
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
