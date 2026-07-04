import express from 'express';
import { z } from 'zod';
import { requireAdmin } from '../auth';
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

const testimonialBodySchema = z.object({
  customer_name: z.string().trim().min(1).max(100),
  customer_role: z.string().trim().max(100).optional().nullable(),
  quote: z.string().trim().min(1).max(500),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

const testimonialUpdateBodySchema = testimonialBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'Minimal satu field harus diisi' },
);

// Public endpoint - hanya featured testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await findFeaturedTestimonials();
    res.json({ testimonials });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Gagal mengambil testimonials' });
  }
});

// Admin endpoint - semua testimonials dengan pagination
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const result = await findTestimonials(page, limit);
    res.json({
      testimonials: result.testimonials,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    console.error('Error fetching admin testimonials:', error);
    res.status(500).json({ error: 'Gagal mengambil testimonials' });
  }
});

// Get available ratings yang bisa dijadikan testimonial
router.get('/available-ratings', requireAdmin, async (req, res) => {
  try {
    const ratings = await findAvailableRatings();
    res.json({ ratings });
  } catch (error) {
    console.error('Error fetching available ratings:', error);
    res.status(500).json({ error: 'Gagal mengambil ratings' });
  }
});

// Create testimonial manual
router.post('/', requireAdmin, async (req, res) => {
  const body = parseBody(testimonialBodySchema, req, res);

  if (!body) {
    return;
  }

  try {
    const testimonial = await createTestimonial({
      customer_name: body.customer_name,
      customer_role: body.customer_role ?? undefined,
      quote: body.quote,
      rating: body.rating,
      is_featured: body.is_featured,
      sort_order: body.sort_order,
    });

    res.status(201).json({ testimonial });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Gagal membuat testimonial' });
  }
});

// Create testimonial dari rating
router.post('/from-rating/:ratingId', requireAdmin, async (req, res) => {
  const params = parseParams(ratingParamsSchema, req, res);

  if (!params) {
    return;
  }

  try {
    const testimonial = await createFromRating(params.ratingId);
    res.status(201).json({ testimonial });
  } catch (error) {
    console.error('Error creating testimonial from rating:', error);

    if (error instanceof Error) {
      if (error.message === 'Rating not found') {
        return res.status(404).json({ error: 'Rating tidak ditemukan' });
      }
      if (error.message === 'Rating already used as testimonial') {
        return res.status(400).json({ error: 'Rating sudah digunakan sebagai testimonial' });
      }
      if (error.message === 'Rating message is required') {
        return res.status(400).json({ error: 'Review harus memiliki pesan sebelum dijadikan testimoni' });
      }
    }

    res.status(500).json({ error: 'Gagal membuat testimonial dari rating' });
  }
});

// Update testimonial
router.put('/:id', requireAdmin, async (req, res) => {
  const params = parseParams(idParamsSchema, req, res);
  const body = parseBody(testimonialUpdateBodySchema, req, res);

  if (!params || !body) {
    return;
  }

  try {
    const testimonial = await updateTestimonial(params.id, {
      customer_name: body.customer_name,
      customer_role: body.customer_role ?? undefined,
      quote: body.quote,
      rating: body.rating,
      is_featured: body.is_featured,
      sort_order: body.sort_order,
    });

    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial tidak ditemukan' });
    }

    res.json({ testimonial });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    res.status(500).json({ error: 'Gagal mengupdate testimonial' });
  }
});

// Delete testimonial
router.delete('/:id', requireAdmin, async (req, res) => {
  const params = parseParams(idParamsSchema, req, res);

  if (!params) {
    return;
  }

  try {
    const deleted = await deleteTestimonial(params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Testimonial tidak ditemukan' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ error: 'Gagal menghapus testimonial' });
  }
});

export const testimonialsRouter = router;
