import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserToken } from '../auth';
import { testimonialsRouter } from '../routes/testimonials';

const mocks = vi.hoisted(() => ({
  findAll: vi.fn(), findFeatured: vi.fn(), create: vi.fn(), createFromRating: vi.fn(),
  update: vi.fn(), remove: vi.fn(), findRatings: vi.fn(), audit: vi.fn(),
}));

vi.mock('../models/audit-log.model', () => ({ createAdminAuditLog: mocks.audit }));
vi.mock('../models/testimonial.model', () => ({
  findTestimonials: mocks.findAll,
  findFeaturedTestimonials: mocks.findFeatured,
  createTestimonial: mocks.create,
  createFromRating: mocks.createFromRating,
  updateTestimonial: mocks.update,
  deleteTestimonial: mocks.remove,
  findAvailableRatings: mocks.findRatings,
}));

const testimonial = {
  id: 5, source_type: 'manual', rating_id: null, customer_name: 'Naki User',
  customer_role: null, quote: 'Hasil website sangat rapi.', rating: 5,
  design_id: null, is_featured: true, sort_order: 0,
  created_at: '2026-09-09T00:00:00.000Z', updated_at: '2026-09-09T00:00:00.000Z',
};
const payload = { customer_name: testimonial.customer_name, customer_role: '', quote: testimonial.quote, rating: 5, is_featured: true };
const adminToken = createUserToken({ id: 1, username: 'admin-test', role: 'admin' });
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api/testimonials', testimonialsRouter);

describe('Testimonial CRUD API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findAll.mockResolvedValue({ testimonials: [testimonial], total: 1 });
    mocks.findFeatured.mockResolvedValue([testimonial]);
    mocks.create.mockResolvedValue(testimonial);
    mocks.createFromRating.mockResolvedValue({ ...testimonial, source_type: 'rating', rating_id: 9 });
    mocks.update.mockResolvedValue(testimonial);
    mocks.remove.mockResolvedValue(true);
    mocks.findRatings.mockResolvedValue([]);
    mocks.audit.mockResolvedValue(1);
  });

  it('serves public testimonials and protects the admin list', async () => {
    expect((await request(app).get('/api/testimonials')).status).toBe(200);
    expect((await request(app).get('/api/testimonials/admin')).status).toBe(401);
    const response = await request(app).get('/api/testimonials/admin?page=1&limit=20').set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(mocks.findAll).toHaveBeenCalledWith(1, 20);
  });

  it('creates a testimonial and normalizes an empty role to null', async () => {
    const response = await request(app).post('/api/testimonials').set('Authorization', `Bearer ${adminToken}`).send(payload);
    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ customer_role: null }));
  });

  it('updates, clears the role, and rejects an empty update', async () => {
    const response = await request(app).put('/api/testimonials/5').set('Authorization', `Bearer ${adminToken}`).send({ customer_role: null });
    const emptyResponse = await request(app).put('/api/testimonials/5').set('Authorization', `Bearer ${adminToken}`).send({});
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(5, expect.objectContaining({ customer_role: null }));
    expect(emptyResponse.status).toBe(400);
  });

  it('returns 409 when a rating is already used', async () => {
    mocks.createFromRating.mockRejectedValueOnce(new Error('Rating already used as testimonial'));
    const response = await request(app).post('/api/testimonials/from-rating/9').set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(409);
  });

  it('soft-deletes successfully even when audit logging fails', async () => {
    mocks.audit.mockRejectedValueOnce(new Error('audit unavailable'));
    const response = await request(app).delete('/api/testimonials/5').set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(mocks.remove).toHaveBeenCalledWith(5);
  });

  it('returns 404 for missing update and delete targets', async () => {
    mocks.update.mockResolvedValueOnce(null);
    const updateResponse = await request(app).put('/api/testimonials/404').set('Authorization', `Bearer ${adminToken}`).send({ quote: 'Tetap valid' });
    mocks.remove.mockResolvedValueOnce(false);
    const deleteResponse = await request(app).delete('/api/testimonials/404').set('Authorization', `Bearer ${adminToken}`);
    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });
});
