import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserToken } from '../auth';
import { templatesRouter } from '../routes/templates';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  findBySlugOrId: vi.fn(),
  findAll: vi.fn(),
  audit: vi.fn(),
  deleteCacheKeys: vi.fn(),
}));

vi.mock('../redis-cache', () => ({
  getJsonCache: vi.fn(async () => null),
  setJsonCache: vi.fn(async () => undefined),
  deleteCacheKeys: mocks.deleteCacheKeys,
}));

vi.mock('../models/audit-log.model', () => ({ createAdminAuditLog: mocks.audit }));

vi.mock('../models/template.model', async () => {
  const actual = await vi.importActual<typeof import('../models/template.model')>(
    '../models/template.model',
  );
  return {
    ...actual,
    createTemplate: mocks.create,
    updateTemplate: mocks.update,
    deleteTemplate: mocks.remove,
    findTemplateBySlugOrId: mocks.findBySlugOrId,
    findTemplates: mocks.findAll,
  };
});

vi.mock('../models/order.model', async () => ({
  ...(await vi.importActual<typeof import('../models/order.model')>('../models/order.model')),
  hasSuccessfulTemplateOrder: vi.fn(async () => false),
}));

vi.mock('../models/template-rating.model', async () => ({
  ...(await vi.importActual<typeof import('../models/template-rating.model')>('../models/template-rating.model')),
  createTemplateRating: vi.fn(),
  hasUserRatedTemplate: vi.fn(async () => false),
}));

const design = {
  id: 8,
  slug: 'design-uji',
  title: 'Design Uji',
  category: 'Portfolio',
  description: 'Design untuk pengujian CRUD.',
  price: 'Rp149K',
  stack: ['React'],
  level: 'Pemula',
  rating: 0,
  accentClass: 'bg-naki-secondary',
  preview: [{ image: '/uploads/design.webp', caption: 'Beranda' }],
  demoUrl: 'https://example.com',
  lynkUrl: 'https://lynk.id/naki',
  buyerCount: 0,
  features: ['Responsive'],
  includedFiles: ['README.md'],
  sourceCode: ['source.zip'],
  suitableFor: ['Bisnis'],
  license: 'Lisensi satu project.',
  support: 'Support setup.',
  reviews: [],
};

const validPayload = {
  ...design,
  id: undefined,
  rating: undefined,
  buyerCount: undefined,
  reviews: undefined,
};

const adminToken = createUserToken({ id: 1, username: 'admin-test', role: 'admin' });
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api/designs', templatesRouter);

describe('Design CRUD API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue(design);
    mocks.update.mockResolvedValue(design);
    mocks.remove.mockResolvedValue(true);
    mocks.findBySlugOrId.mockResolvedValue(design);
    mocks.findAll.mockResolvedValue([design]);
    mocks.audit.mockResolvedValue(1);
    mocks.deleteCacheKeys.mockResolvedValue(undefined);
  });

  it('protects mutations and creates a validated design', async () => {
    const unauthenticated = await request(app).post('/api/designs').send(validPayload);
    const response = await request(app)
      .post('/api/designs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload);

    expect(unauthenticated.status).toBe(401);
    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ slug: design.slug }));
  });

  it('rejects unsafe asset, demo, and Lynk URLs', async () => {
    const payloads = [
      { ...validPayload, preview: [{ image: 'data:image/png;base64,abc', caption: '' }] },
      { ...validPayload, demoUrl: 'javascript:alert(1)' },
      { ...validPayload, lynkUrl: 'https://example.com/not-lynk' },
    ];

    for (const payload of payloads) {
      const response = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(response.status).toBe(400);
    }
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('returns 409 for a duplicate slug', async () => {
    mocks.create.mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' }));
    const response = await request(app)
      .post('/api/designs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload);
    expect(response.status).toBe(409);
  });

  it('updates a design and invalidates both old and new slug caches', async () => {
    mocks.findBySlugOrId.mockResolvedValueOnce({ ...design, slug: 'slug-lama' });
    const response = await request(app)
      .put(`/api/designs/${design.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload);

    expect(response.status).toBe(200);
    expect(mocks.deleteCacheKeys).toHaveBeenCalledWith([
      'templates:list',
      `templates:detail:${design.slug}`,
      'templates:detail:slug-lama',
    ]);
  });

  it('soft-deletes a design and succeeds when audit logging is unavailable', async () => {
    mocks.audit.mockRejectedValueOnce(new Error('audit unavailable'));
    const response = await request(app)
      .delete(`/api/designs/${design.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(204);
    expect(mocks.remove).toHaveBeenCalledWith(design.id);
    expect(mocks.deleteCacheKeys).toHaveBeenCalledWith([
      'templates:list',
      `templates:detail:${design.slug}`,
    ]);
  });

  it('returns 404 for missing update and delete targets', async () => {
    mocks.update.mockResolvedValueOnce(null);
    const updateResponse = await request(app)
      .put('/api/designs/404')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload);
    mocks.findBySlugOrId.mockResolvedValueOnce(null);
    mocks.remove.mockResolvedValueOnce(false);
    const deleteResponse = await request(app)
      .delete('/api/designs/404')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });
});
