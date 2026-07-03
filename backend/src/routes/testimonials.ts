import express from 'express';
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

const router = express.Router();

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
  try {
    const { customer_name, customer_role, quote, rating, is_featured, sort_order } = req.body;

    if (!customer_name || !quote) {
      return res.status(400).json({ error: 'customer_name dan quote wajib diisi' });
    }

    const testimonial = await createTestimonial({
      customer_name,
      customer_role,
      quote,
      rating,
      is_featured,
      sort_order,
    });

    res.status(201).json({ testimonial });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    res.status(500).json({ error: 'Gagal membuat testimonial' });
  }
});

// Create testimonial dari rating
router.post('/from-rating/:ratingId', requireAdmin, async (req, res) => {
  try {
    const ratingId = parseInt(req.params.ratingId as string);

    if (isNaN(ratingId)) {
      return res.status(400).json({ error: 'Invalid rating ID' });
    }

    const testimonial = await createFromRating(ratingId);
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
    }

    res.status(500).json({ error: 'Gagal membuat testimonial dari rating' });
  }
});

// Update testimonial
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid testimonial ID' });
    }

    const { customer_name, customer_role, quote, rating, is_featured, sort_order } = req.body;

    const testimonial = await updateTestimonial(id, {
      customer_name,
      customer_role,
      quote,
      rating,
      is_featured,
      sort_order,
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
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid testimonial ID' });
    }

    const deleted = await deleteTestimonial(id);

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
