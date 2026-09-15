import express from 'express';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { requireAdmin, type UserTokenPayload } from '../auth';
import { createAdminAuditLog } from '../models/audit-log.model';
import {
  findTestimonials,
  findFeaturedTestimonials,
  createTestimonial,
  createFromRating,
  updateTestimonial,
  deleteTestimonial,
  findAvailableRatings,
} from '../models/testimonial.model';
import { parseBody, parseParams } from '../validation';

const router = express.Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const ratingParamsSchema = z.object({
  ratingId: z.coerce.number().int().positive(),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const testimonialBodySchema = z.object({
  customer_name: z.string().trim().min(1).max(100),
  customer_role: z.string().trim().max(80).optional().nullable(),
  quote: z.string().trim().min(1).max(500),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

const testimonialUpdateBodySchema = testimonialBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'Minimal satu field harus diisi' },
);

async function createTestimonialAuditLog(
  payload: Parameters<typeof createAdminAuditLog>[0],
) {
  try {
    await createAdminAuditLog(payload);
  } catch (error) {
    Sentry.captureException(error);
  }
}

function normalizeCustomerRole(value: string | null | undefined) {
  if (typeof value === 'undefined') return undefined;
  return value?.trim() || null;
}

// Public endpoint - hanya featured testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await findFeaturedTestimonials();
    res.json({ testimonials });
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ error: 'Gagal mengambil testimonials' });
  }
});

// Admin endpoint - semua testimonials dengan pagination
router.get('/admin', requireAdmin, async (req, res) => {
  const query = paginationQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ message: 'Parameter pagination tidak valid', errors: query.error.flatten() });
    return;
  }

  try {
    const { page, limit } = query.data;

    const result = await findTestimonials(page, limit);
    res.json({
      testimonials: result.testimonials,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ error: 'Gagal mengambil testimonials' });
  }
});

// Get available ratings yang bisa dijadikan testimonial
router.get('/available-ratings', requireAdmin, async (req, res) => {
  try {
    const ratings = await findAvailableRatings();
    res.json({ ratings });
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ error: 'Gagal mengambil ratings' });
  }
});

// Create testimonial manual
router.post('/', requireAdmin, async (req, res) => {
  const body = parseBody(testimonialBodySchema, req, res);
  const admin = res.locals.admin as UserTokenPayload | null | undefined;

  if (!body) {
    return;
  }

  try {
    const testimonial = await createTestimonial({
      customer_name: body.customer_name,
      customer_role: normalizeCustomerRole(body.customer_role),
      quote: body.quote,
      rating: body.rating,
      is_featured: body.is_featured,
      sort_order: body.sort_order,
    });

    await createTestimonialAuditLog({
      admin,
      action: 'testimonial.create',
      entityType: 'testimonial',
      entityId: testimonial.id,
      metadata: { customerName: testimonial.customer_name },
    });

    res.status(201).json({ testimonial });
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ message: 'Gagal membuat testimonial' });
  }
});

// Create testimonial dari rating
router.post('/from-rating/:ratingId', requireAdmin, async (req, res) => {
  const params = parseParams(ratingParamsSchema, req, res);
  const admin = res.locals.admin as UserTokenPayload | null | undefined;

  if (!params) {
    return;
  }

  try {
    const testimonial = await createFromRating(params.ratingId);
    await createTestimonialAuditLog({
      admin,
      action: 'testimonial.create_from_rating',
      entityType: 'testimonial',
      entityId: testimonial.id,
      metadata: { ratingId: params.ratingId },
    });
    res.status(201).json({ testimonial });
  } catch (error) {
    Sentry.captureException(error);

    if (error instanceof Error) {
      if (error.message === 'Rating not found') {
        return res.status(404).json({ error: 'Rating tidak ditemukan' });
      }
      if (error.message === 'Rating already used as testimonial') {
        return res.status(409).json({ message: 'Rating sudah digunakan sebagai testimonial' });
      }
    }

    res.status(500).json({ message: 'Gagal membuat testimonial dari rating' });
  }
});

// Update testimonial
router.put('/:id', requireAdmin, async (req, res) => {
  const params = parseParams(idParamsSchema, req, res);
  const body = parseBody(testimonialUpdateBodySchema, req, res);
  const admin = res.locals.admin as UserTokenPayload | null | undefined;

  if (!params || !body) {
    return;
  }

  try {
    const testimonial = await updateTestimonial(params.id, {
      customer_name: body.customer_name,
      customer_role: normalizeCustomerRole(body.customer_role),
      quote: body.quote,
      rating: body.rating,
      is_featured: body.is_featured,
      sort_order: body.sort_order,
    });

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial tidak ditemukan' });
    }

    await createTestimonialAuditLog({
      admin,
      action: 'testimonial.update',
      entityType: 'testimonial',
      entityId: testimonial.id,
      metadata: { fields: Object.keys(body) },
    });

    res.json({ testimonial });
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ message: 'Gagal mengupdate testimonial' });
  }
});

// Delete testimonial
router.delete('/:id', requireAdmin, async (req, res) => {
  const params = parseParams(idParamsSchema, req, res);
  const admin = res.locals.admin as UserTokenPayload | null | undefined;

  if (!params) {
    return;
  }

  try {
    const deleted = await deleteTestimonial(params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Testimonial tidak ditemukan' });
    }

    await createTestimonialAuditLog({
      admin,
      action: 'testimonial.soft_delete',
      entityType: 'testimonial',
      entityId: params.id,
    });

    res.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ message: 'Gagal menghapus testimonial' });
  }
});

export const testimonialsRouter = router;
