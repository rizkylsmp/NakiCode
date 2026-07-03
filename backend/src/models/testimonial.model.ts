import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';

export type Testimonial = {
  id: number;
  source_type: 'manual' | 'rating';
  rating_id: number | null;
  customer_name: string;
  customer_role: string | null;
  quote: string;
  rating: number;
  template_id: number | null;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type TestimonialRow = RowDataPacket & Testimonial;

export async function findTestimonials(page = 1, limit = 20): Promise<{ testimonials: Testimonial[]; total: number }> {
  const offset = (page - 1) * limit;

  const [countRows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) as total FROM testimonials WHERE deleted_at IS NULL'
  );
  const total = countRows[0]?.total || 0;

  const [rows] = await pool.query<TestimonialRow[]>(
    'SELECT * FROM testimonials WHERE deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );

  return {
    testimonials: rows.map(normalizeTestimonial),
    total
  };
}

export async function findFeaturedTestimonials(): Promise<Testimonial[]> {
  const [rows] = await pool.query<TestimonialRow[]>(
    'SELECT * FROM testimonials WHERE is_featured = TRUE ORDER BY sort_order ASC, created_at DESC LIMIT 10'
  );
  return rows.map(normalizeTestimonial);
}

export async function createTestimonial(data: {
  customer_name: string;
  customer_role?: string;
  quote: string;
  rating?: number;
  is_featured?: boolean;
  sort_order?: number;
}): Promise<Testimonial> {
  // Validation
  if (!data.customer_name || data.customer_name.trim().length === 0) {
    throw new Error('Customer name is required');
  }
  if (!data.quote || data.quote.trim().length === 0) {
    throw new Error('Quote is required');
  }
  if (data.customer_name.length > 100) {
    throw new Error('Customer name must be 100 characters or less');
  }
  if (data.quote.length > 500) {
    throw new Error('Quote must be 500 characters or less');
  }
  if (data.customer_role && data.customer_role.length > 100) {
    throw new Error('Customer role must be 100 characters or less');
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO testimonials (source_type, customer_name, customer_role, quote, rating, is_featured, sort_order)
     VALUES ('manual', ?, ?, ?, ?, ?, ?)`,
    [
      data.customer_name.trim(),
      data.customer_role?.trim() || null,
      data.quote.trim(),
      data.rating || 5,
      data.is_featured !== undefined ? data.is_featured : true,
      data.sort_order || 0,
    ]
  );

  const [rows] = await pool.query<TestimonialRow[]>(
    'SELECT * FROM testimonials WHERE id = ?',
    [result.insertId]
  );

  return normalizeTestimonial(rows[0]);
}

export async function createFromRating(ratingId: number): Promise<Testimonial> {
  // Get rating data
  const [ratingRows] = await pool.query<RowDataPacket[]>(
    `SELECT tr.*, t.title as template_title
     FROM template_ratings tr
     LEFT JOIN templates t ON tr.template_id = t.id
     WHERE tr.id = ?`,
    [ratingId]
  );

  if (ratingRows.length === 0) {
    throw new Error('Rating not found');
  }

  const rating = ratingRows[0];

  // Check if already exists as testimonial
  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM testimonials WHERE rating_id = ?',
    [ratingId]
  );

  if (existing.length > 0) {
    throw new Error('Rating already used as testimonial');
  }

  // Create testimonial
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO testimonials (source_type, rating_id, customer_name, customer_role, quote, rating, template_id, is_featured)
     VALUES ('rating', ?, ?, ?, ?, ?, ?, TRUE)`,
    [
      ratingId,
      rating.customer_name,
      null, // role will be null for ratings
      rating.message || '',
      rating.rating,
      rating.template_id,
    ]
  );

  const [rows] = await pool.query<TestimonialRow[]>(
    'SELECT * FROM testimonials WHERE id = ?',
    [result.insertId]
  );

  return normalizeTestimonial(rows[0]);
}

export async function updateTestimonial(
  id: number,
  data: {
    customer_name?: string;
    customer_role?: string;
    quote?: string;
    rating?: number;
    is_featured?: boolean;
    sort_order?: number;
  }
): Promise<Testimonial | null> {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.customer_name !== undefined) {
    updates.push('customer_name = ?');
    values.push(data.customer_name);
  }
  if (data.customer_role !== undefined) {
    updates.push('customer_role = ?');
    values.push(data.customer_role);
  }
  if (data.quote !== undefined) {
    updates.push('quote = ?');
    values.push(data.quote);
  }
  if (data.rating !== undefined) {
    updates.push('rating = ?');
    values.push(data.rating);
  }
  if (data.is_featured !== undefined) {
    updates.push('is_featured = ?');
    values.push(data.is_featured);
  }
  if (data.sort_order !== undefined) {
    updates.push('sort_order = ?');
    values.push(data.sort_order);
  }

  if (updates.length === 0) {
    return null;
  }

  values.push(id);

  await pool.query(
    `UPDATE testimonials SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const [rows] = await pool.query<TestimonialRow[]>(
    'SELECT * FROM testimonials WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  return normalizeTestimonial(rows[0]);
}

export async function deleteTestimonial(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE testimonials SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.affectedRows > 0;
}

export async function findAvailableRatings(): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT tr.id, tr.customer_name, tr.rating, tr.message, tr.created_at,
            t.title as template_title
     FROM template_ratings tr
     LEFT JOIN templates t ON tr.template_id = t.id
     WHERE tr.id NOT IN (SELECT rating_id FROM testimonials WHERE rating_id IS NOT NULL)
     ORDER BY tr.created_at DESC`
  );
  return rows;
}

function normalizeTestimonial(row: TestimonialRow): Testimonial {
  return {
    ...row,
    is_featured: Boolean(row.is_featured),
  };
}
