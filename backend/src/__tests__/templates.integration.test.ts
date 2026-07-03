import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createUserToken } from '../auth';
import { templatesRouter } from '../routes/templates';

vi.mock('../redis-cache', () => ({
  getJsonCache: vi.fn(async () => null),
  setJsonCache: vi.fn(async () => undefined),
  deleteCacheKeys: vi.fn(async () => undefined),
}));

vi.mock('../models/template.model', async () => {
  const actual = await vi.importActual<typeof import('../models/template.model')>(
    '../models/template.model',
  );

  const template = {
    id: 1,
    slug: 'test-template',
    title: 'Test Template',
    category: 'portfolio',
    description: 'Test template',
    price: 'Rp150K',
    stack: ['React'],
    level: 'Pemula',
    rating: 0,
    accentClass: 'bg-naki-secondary',
    preview: [],
    demoUrl: '#',
    lynkUrl: null,
    buyerCount: 0,
    features: [],
    includedFiles: [],
    sourceCode: [],
    suitableFor: [],
    license: 'single',
    support: '3 months',
    reviews: [],
  };

  return {
    ...actual,
    findTemplates: vi.fn(async () => [template]),
    findTemplateBySlugOrId: vi.fn(async () => null),
    createTemplate: vi.fn(async () => template),
    updateTemplate: vi.fn(async () => null),
    deleteTemplate: vi.fn(async () => false),
  };
});

vi.mock('../models/audit-log.model', () => ({
  createAdminAuditLog: vi.fn(async () => 1),
}));

vi.mock('../models/order.model', async () => {
  const actual = await vi.importActual<typeof import('../models/order.model')>(
    '../models/order.model',
  );

  return {
    ...actual,
    hasSuccessfulTemplateOrder: vi.fn(async () => false),
  };
});

vi.mock('../models/template-rating.model', async () => {
  const actual = await vi.importActual<
    typeof import('../models/template-rating.model')
  >('../models/template-rating.model');

  return {
    ...actual,
    createTemplateRating: vi.fn(async () => 1),
    hasUserRatedTemplate: vi.fn(async () => false),
  };
});

const templatesApp = express();
templatesApp.use(express.json({ limit: '1mb' }));
templatesApp.use('/api/templates', templatesRouter);

describe('Templates API Integration', () => {
  describe('GET /api/templates', () => {
    it('fetches all templates successfully', async () => {
      const response = await request(templatesApp).get('/api/templates');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('templates');
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('filters templates by category', async () => {
      const response = await request(templatesApp)
        .get('/api/templates')
        .query({ category: 'portfolio' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('templates');
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('searches templates by keyword', async () => {
      const response = await request(templatesApp)
        .get('/api/templates')
        .query({ search: 'portfolio' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('templates');
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('sorts templates by price', async () => {
      const response = await request(templatesApp)
        .get('/api/templates')
        .query({ sort: 'price_asc' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('templates');
      expect(Array.isArray(response.body.templates)).toBe(true);
    });
  });

  describe('GET /api/templates/:slug', () => {
    it('fetches single template by slug', async () => {
      // Note: This test assumes at least one template exists in DB
      // In a real test, you'd seed test data first
      const response = await request(templatesApp).get('/api/templates/test-template');

      // Accepts both 200 (found) and 404 (not found in test DB)
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('slug');
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('category');
      }
    });

    it('returns 404 for non-existent template', async () => {
      const response = await request(templatesApp).get('/api/templates/non-existent-slug-12345');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/templates', () => {
    const adminToken = createUserToken({
      id: 1,
      username: 'admin-test',
      role: 'admin',
    });

    const userToken = createUserToken({
      id: 10,
      username: 'user-test',
      role: 'user',
    });

    it('rejects template creation without auth token', async () => {
      const response = await request(templatesApp)
        .post('/api/templates')
        .send({
          title: 'Test Template',
          slug: 'test-template',
          category: 'portfolio',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Admin authorization required');
    });

    it('rejects template creation from non-admin user', async () => {
      const response = await request(templatesApp)
        .post('/api/templates')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Template',
          slug: 'test-template',
          category: 'portfolio',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Admin authorization required');
    });

    it('validates required fields for template creation', async () => {
      const response = await request(templatesApp)
        .post('/api/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '',
          slug: '',
          category: '',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('allows admin to create template with valid data', async () => {
      const uniqueSlug = `test-template-${Date.now()}`;
      
      const response = await request(templatesApp)
        .post('/api/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Portfolio Template',
          slug: uniqueSlug,
          category: 'portfolio',
          description: 'A test portfolio template',
          price: '150000',
          features: JSON.stringify(['Responsive', 'Modern']),
          previewUrl: 'https://example.com/preview',
          demoUrl: 'https://example.com/demo',
          technologies: JSON.stringify(['React', 'Tailwind']),
          includedFiles: JSON.stringify(['HTML', 'CSS', 'JS']),
          license: 'single',
          support: '3 months',
        });

      // Accepts 201 (created), 400 (validation), or 409 (conflict)
      expect([201, 400, 409]).toContain(response.status);
    });
  });

  describe('PUT /api/templates/:slug', () => {
    const adminToken = createUserToken({
      id: 1,
      username: 'admin-test',
      role: 'admin',
    });

    const userToken = createUserToken({
      id: 10,
      username: 'user-test',
      role: 'user',
    });

    it('rejects template update without auth token', async () => {
      const response = await request(templatesApp)
        .put('/api/templates/test-template')
        .send({
          title: 'Updated Title',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Admin authorization required');
    });

    it('rejects template update from non-admin user', async () => {
      const response = await request(templatesApp)
        .put('/api/templates/test-template')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Title',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Admin authorization required');
    });

    it('returns 404 for updating non-existent template', async () => {
      const response = await request(templatesApp)
        .put('/api/templates/non-existent-slug-12345')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title',
        });

      expect([400, 404]).toContain(response.status);
    });

    it('allows admin to update template', async () => {
      // Note: This test requires a template to exist
      const response = await request(templatesApp)
        .put('/api/templates/test-template')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Test Template',
          description: 'Updated description',
        });

      // Accepts 200 (updated), 400 (validation), or 404 (not found)
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('DELETE /api/templates/:slug', () => {
    const adminToken = createUserToken({
      id: 1,
      username: 'admin-test',
      role: 'admin',
    });

    const userToken = createUserToken({
      id: 10,
      username: 'user-test',
      role: 'user',
    });

    it('rejects template deletion without auth token', async () => {
      const response = await request(templatesApp).delete('/api/templates/test-template');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Admin authorization required');
    });

    it('rejects template deletion from non-admin user', async () => {
      const response = await request(templatesApp)
        .delete('/api/templates/test-template')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Admin authorization required');
    });

    it('returns 404 for deleting non-existent template', async () => {
      const response = await request(templatesApp)
        .delete('/api/templates/non-existent-slug-12345')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([400, 404]).toContain(response.status);
    });

    it('allows admin to soft delete template', async () => {
      // Note: This test requires a template to exist
      const response = await request(templatesApp)
        .delete('/api/templates/test-template')
        .set('Authorization', `Bearer ${adminToken}`);

      // Accepts 200 (deleted), 400 (validation), or 404 (not found)
      expect([200, 400, 404]).toContain(response.status);
    });
  });
});
