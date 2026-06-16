import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';

export type TemplateRatingPayload = {
  userId: number;
  templateId: number;
  templateSlug: string;
  customerName: string;
  rating: number;
  message: string;
};

type TemplateRatingRow = RowDataPacket & {
  id: number;
  template_id: number;
  customer_name: string;
  rating: number;
  message: string | null;
  created_at?: string;
};

export type TemplateReviewItem = {
  id: number;
  templateId: number;
  customerName: string;
  rating: number;
  message: string;
  createdAt: string;
};

export async function createTemplateRating(payload: TemplateRatingPayload) {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO template_ratings (
      user_id,
      template_id,
      template_slug,
      customer_name,
      rating,
      message
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      payload.userId,
      payload.templateId,
      payload.templateSlug,
      payload.customerName,
      payload.rating,
      payload.message,
    ],
  );

  return {
    id: result.insertId,
    ...payload,
  };
}

export async function hasUserRatedTemplate(userId: number, templateId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id
    FROM template_ratings
    WHERE user_id = ? AND template_id = ?
    LIMIT 1`,
    [userId, templateId],
  );

  return rows.length > 0;
}

export async function findRecentTemplateReviews(
  templateIds: number[],
  limitPerTemplate = 3,
) {
  if (templateIds.length === 0) {
    return new Map<number, TemplateReviewItem[]>();
  }

  const placeholders = templateIds.map(() => '?').join(', ');
  const [rows] = await pool.query<TemplateRatingRow[]>(
    `SELECT id, template_id, customer_name, rating, message, created_at
    FROM template_ratings
    WHERE template_id IN (${placeholders})
      AND message IS NOT NULL
      AND message <> ''
    ORDER BY id DESC
    LIMIT ?`,
    [...templateIds, templateIds.length * Math.max(1, limitPerTemplate)],
  );

  const grouped = new Map<number, TemplateReviewItem[]>();

  for (const row of rows) {
    const current = grouped.get(row.template_id) ?? [];

    if (current.length >= limitPerTemplate) {
      continue;
    }

    current.push({
      id: row.id,
      templateId: row.template_id,
      customerName: row.customer_name,
      rating: Number(row.rating),
      message: row.message ?? '',
      createdAt: row.created_at ?? new Date().toISOString(),
    });
    grouped.set(row.template_id, current);
  }

  return grouped;
}

export function normalizeTemplateRatingPayload(
  body: Record<string, unknown>,
  userId: number,
  templateId: number,
  templateSlug: string,
): TemplateRatingPayload {
  const rating = Math.max(1, Math.min(5, Number(body.rating) || 0));

  return {
    userId,
    templateId,
    templateSlug,
    customerName: String(body.customerName ?? '').trim(),
    rating,
    message: String(body.message ?? '').trim(),
  };
}
