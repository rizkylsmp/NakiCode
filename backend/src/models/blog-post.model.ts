import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';

type BlogPostRow = RowDataPacket & {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  status: string;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type BlogPostItem = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostPayload = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  status: string;
};

const blogSelect = `SELECT id, slug, title, excerpt, content, author, status, published_at, created_at, updated_at
FROM blog_posts
WHERE deleted_at IS NULL`;

export async function findPublishedBlogPosts() {
  const [rows] = await pool.query<BlogPostRow[]>(
    `${blogSelect}
    AND status = 'published'
    ORDER BY COALESCE(published_at, created_at) DESC
    LIMIT 60`,
  );

  return rows.map(normalizeBlogRow);
}

export async function findBlogPostsForAdmin() {
  const [rows] = await pool.query<BlogPostRow[]>(
    `${blogSelect}
    ORDER BY id DESC
    LIMIT 80`,
  );

  return rows.map(normalizeBlogRow);
}

export async function findBlogPostBySlugOrId(slug: string, includeDraft = false) {
  const [rows] = await pool.query<BlogPostRow[]>(
    `${blogSelect}
    AND (slug = ? OR id = ?)
    ${includeDraft ? '' : "AND status = 'published'"}
    LIMIT 1`,
    [slug, Number(slug) || 0],
  );

  return rows[0] ? normalizeBlogRow(rows[0]) : null;
}

export async function createBlogPost(payload: BlogPostPayload) {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO blog_posts (
      slug,
      title,
      excerpt,
      content,
      author,
      status,
      published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.slug,
      payload.title,
      payload.excerpt,
      payload.content,
      payload.author,
      payload.status,
      payload.status === 'published' ? new Date() : null,
    ],
  );

  return findBlogPostBySlugOrId(String(result.insertId), true);
}

export async function updateBlogPost(id: number, payload: BlogPostPayload) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE blog_posts
    SET slug = ?,
      title = ?,
      excerpt = ?,
      content = ?,
      author = ?,
      status = ?,
      published_at = CASE
        WHEN ? = 'published' AND published_at IS NULL THEN CURRENT_TIMESTAMP
        WHEN ? <> 'published' THEN NULL
        ELSE published_at
      END
    WHERE id = ? AND deleted_at IS NULL`,
    [
      payload.slug,
      payload.title,
      payload.excerpt,
      payload.content,
      payload.author,
      payload.status,
      payload.status,
      payload.status,
      id,
    ],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findBlogPostBySlugOrId(String(id), true);
}

export async function deleteBlogPost(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE blog_posts
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );

  return result.affectedRows > 0;
}

export function normalizeBlogPostPayload(
  body: Record<string, unknown>,
): BlogPostPayload {
  const title = String(body.title ?? '').trim();

  return {
    slug: slugify(String(body.slug ?? title)),
    title,
    excerpt: String(body.excerpt ?? '').trim(),
    content: String(body.content ?? '').trim(),
    author: String(body.author ?? 'Naki Code').trim() || 'Naki Code',
    status: String(body.status ?? 'draft') === 'published' ? 'published' : 'draft',
  };
}

function normalizeBlogRow(row: BlogPostRow): BlogPostItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    status: row.status,
    publishedAt: row.published_at ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
