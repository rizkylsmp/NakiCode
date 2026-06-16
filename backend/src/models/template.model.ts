import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';
import {
  findRecentTemplateReviews,
  type TemplateReviewItem,
} from './template-rating.model';

type TemplateRow = RowDataPacket & {
  id: number;
  slug: string;
  title: string;
  category: string;
  description: string;
  price: string;
  stack: string | string[];
  level: string;
  rating: number;
  accent_class?: string;
  accentClass?: string;
  preview: string | TemplatePreviewItem[];
  demo_url?: string;
  demoUrl?: string;
  buyer_count?: number;
  buyerCount?: number;
  features?: string | string[];
  included_files?: string | string[];
  includedFiles?: string[];
  suitable_for?: string | string[];
  suitableFor?: string[];
  license?: string;
  support?: string;
};

export type TemplatePreviewItem = {
  image: string;
  caption: string;
};

export type TemplateItem = {
  id: number;
  slug: string;
  title: string;
  category: string;
  description: string;
  price: string;
  stack: string[];
  level: string;
  rating: number;
  accentClass: string;
  preview: TemplatePreviewItem[];
  demoUrl: string;
  buyerCount: number;
  features: string[];
  includedFiles: string[];
  suitableFor: string[];
  license: string;
  support: string;
  reviews: TemplateReviewItem[];
};
export type TemplatePayload = Omit<
  TemplateItem,
  'id' | 'rating' | 'buyerCount' | 'reviews'
>;

const templateSelect = `SELECT
  templates.id,
  templates.slug,
  templates.title,
  templates.category,
  templates.description,
  templates.price,
  templates.stack,
  templates.level,
  COALESCE(rating_stats.rating, 0) AS rating,
  templates.accent_class,
  templates.preview,
  templates.demo_url,
  COALESCE(order_stats.buyer_count, 0) AS buyer_count,
  templates.features,
  templates.included_files,
  templates.suitable_for,
  templates.license,
  templates.support
FROM templates
LEFT JOIN (
  SELECT template_id, ROUND(AVG(rating), 1) AS rating
  FROM template_ratings
  GROUP BY template_id
) AS rating_stats ON rating_stats.template_id = templates.id
LEFT JOIN (
  SELECT template_id, COUNT(*) AS buyer_count
  FROM orders
  WHERE template_id IS NOT NULL AND payment_status = 'paid' AND deleted_at IS NULL
  GROUP BY template_id
) AS order_stats ON order_stats.template_id = templates.id`;

export async function findTemplates() {
  const [rows] = await pool.query<TemplateRow[]>(
    `${templateSelect}
    WHERE templates.deleted_at IS NULL
    ORDER BY id DESC
    LIMIT 60`,
  );

  return attachTemplateReviews(rows.map(normalizeTemplateRow));
}

export async function findTemplateBySlugOrId(slug: string) {
  const [rows] = await pool.query<TemplateRow[]>(
    `${templateSelect}
    WHERE templates.deleted_at IS NULL AND (slug = ? OR id = ?)
    LIMIT 1`,
    [slug, Number(slug) || 0],
  );

  const templates = await attachTemplateReviews(
    rows[0] ? [normalizeTemplateRow(rows[0])] : [],
  );

  return templates[0] ?? null;
}

export async function createTemplate(payload: TemplatePayload) {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO templates (
      slug,
      title,
      category,
      description,
      price,
      stack,
      level,
      accent_class,
      preview,
      demo_url,
      features,
      included_files,
      suitable_for,
      license,
      support
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    serializeTemplatePayload(payload),
  );

  return findTemplateBySlugOrId(String(result.insertId));
}

export async function updateTemplate(id: number, payload: TemplatePayload) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE templates SET
      slug = ?,
      title = ?,
      category = ?,
      description = ?,
      price = ?,
      stack = ?,
      level = ?,
      accent_class = ?,
      preview = ?,
      demo_url = ?,
      features = ?,
      included_files = ?,
      suitable_for = ?,
      license = ?,
      support = ?
    WHERE id = ? AND deleted_at IS NULL`,
    [...serializeTemplatePayload(payload), id],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findTemplateBySlugOrId(String(id));
}

export async function deleteTemplate(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE templates SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
    [id],
  );

  return result.affectedRows > 0;
}

export function normalizeTemplatePayload(
  body: Partial<TemplateItem>,
): TemplatePayload {
  const title = String(body.title ?? '').trim();

  return {
    slug: sanitizeSlug(body.slug) || slugify(title),
    title,
    category: String(body.category ?? '').trim(),
    description: String(body.description ?? '').trim(),
    price: String(body.price ?? 'Rp0').trim(),
    stack: normalizeArray(body.stack),
    level: String(body.level ?? 'Pemula').trim(),
    accentClass: String(body.accentClass ?? 'bg-naki-secondary').trim(),
    preview: normalizePreviewArray(body.preview),
    demoUrl: String(body.demoUrl ?? '#').trim(),
    features: normalizeArray(body.features),
    includedFiles: normalizeArray(body.includedFiles),
    suitableFor: normalizeArray(body.suitableFor),
    license: String(
      body.license ?? 'Boleh dipakai sesuai lisensi pembelian.',
    ).trim(),
    support: String(
      body.support ?? 'Support setup dasar setelah pembelian.',
    ).trim(),
  };
}

function normalizeTemplateRow(row: TemplateRow): TemplateItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    description: row.description,
    price: row.price,
    stack: parseStringArray(row.stack),
    level: row.level,
    rating: Number(row.rating),
    accentClass: row.accent_class ?? row.accentClass ?? 'bg-naki-secondary',
    preview: parsePreviewArray(row.preview),
    demoUrl: row.demo_url ?? row.demoUrl ?? '#',
    buyerCount: row.buyer_count ?? row.buyerCount ?? 0,
    features: parseStringArray(row.features ?? []),
    includedFiles: parseStringArray(row.included_files ?? row.includedFiles ?? []),
    suitableFor: parseStringArray(row.suitable_for ?? row.suitableFor ?? []),
    license: row.license ?? 'Boleh dipakai sesuai lisensi pembelian.',
    support: row.support ?? 'Support setup dasar setelah pembelian.',
    reviews: [],
  };
}

async function attachTemplateReviews(templates: TemplateItem[]) {
  const reviewsByTemplateId = await findRecentTemplateReviews(
    templates.map((template) => template.id),
  );

  return templates.map((template) => ({
    ...template,
    reviews: reviewsByTemplateId.get(template.id) ?? [],
  }));
}

function serializeTemplatePayload(payload: TemplatePayload) {
  return [
    payload.slug,
    payload.title,
    payload.category,
    payload.description,
    payload.price,
    JSON.stringify(payload.stack),
    payload.level,
    payload.accentClass,
    JSON.stringify(payload.preview),
    payload.demoUrl,
    JSON.stringify(payload.features),
    JSON.stringify(payload.includedFiles),
    JSON.stringify(payload.suitableFor),
    payload.license,
    payload.support,
  ];
}

function parseStringArray(value: string | string[]) {
  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function parsePreviewArray(value: string | TemplatePreviewItem[]) {
  if (Array.isArray(value)) {
    return normalizePreviewArray(value);
  }

  try {
    const parsed = JSON.parse(value);
    return normalizePreviewArray(parsed);
  } catch {
    return normalizePreviewArray(value);
  }
}

function normalizePreviewArray(value: unknown): TemplatePreviewItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return stringToPreviewItem(item);
        }

        if (item && typeof item === 'object') {
          const previewItem = item as Record<string, unknown>;
          return {
            image: String(previewItem.image ?? '').trim(),
            caption: String(previewItem.caption ?? '').trim(),
          };
        }

        return { image: '', caption: '' };
      })
      .filter((item) => item.image || item.caption);
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .flatMap((line) => line.split(','))
      .map((item) => stringToPreviewItem(item.trim()))
      .filter((item) => item.image || item.caption);
  }

  return [];
}

function stringToPreviewItem(value: string): TemplatePreviewItem {
  if (value.startsWith('data:image/')) {
    return {
      image: '',
      caption: 'Preview template perlu diupload ulang',
    };
  }

  return {
    image: '',
    caption: value,
  };
}

function normalizeArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .flatMap((line) => line.split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function sanitizeSlug(value: unknown) {
  return slugify(String(value ?? ''));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
