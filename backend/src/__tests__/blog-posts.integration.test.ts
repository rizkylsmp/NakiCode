import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserToken } from '../auth';
import { blogPostsRouter } from '../routes/blog-posts';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  findBySlugOrId: vi.fn(),
  findAdmin: vi.fn(),
  findPublished: vi.fn(),
  deleteCacheKeys: vi.fn(),
  audit: vi.fn(),
}));

vi.mock('../redis-cache', () => ({
  getJsonCache: vi.fn(async () => null),
  setJsonCache: vi.fn(async () => undefined),
  deleteCacheKeys: mocks.deleteCacheKeys,
}));

vi.mock('../models/audit-log.model', () => ({
  createAdminAuditLog: mocks.audit,
}));

vi.mock('../models/blog-post.model', async () => {
  const actual = await vi.importActual<typeof import('../models/blog-post.model')>(
    '../models/blog-post.model',
  );

  return {
    ...actual,
    createBlogPost: mocks.create,
    updateBlogPost: mocks.update,
    deleteBlogPost: mocks.remove,
    findBlogPostBySlugOrId: mocks.findBySlugOrId,
    findBlogPostsForAdmin: mocks.findAdmin,
    findPublishedBlogPosts: mocks.findPublished,
  };
});

const post = {
  id: 7,
  slug: 'artikel-uji',
  title: 'Artikel Uji',
  excerpt: 'Ringkasan artikel uji.',
  content: 'Konten artikel uji.',
  author: 'Naki Code',
  coverImage: null,
  status: 'published',
  publishedAt: '2026-09-09T00:00:00.000Z',
  createdAt: '2026-09-09T00:00:00.000Z',
  updatedAt: '2026-09-09T00:00:00.000Z',
};

const validPayload = {
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  author: post.author,
  coverImage: null,
  status: post.status,
};

const adminToken = createUserToken({
  id: 1,
  username: 'admin-test',
  role: 'admin',
});

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api/blog', blogPostsRouter);

describe('Blog CRUD API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue(post);
    mocks.update.mockResolvedValue(post);
    mocks.remove.mockResolvedValue(true);
    mocks.findBySlugOrId.mockResolvedValue(post);
    mocks.findAdmin.mockResolvedValue([post]);
    mocks.findPublished.mockResolvedValue([post]);
    mocks.deleteCacheKeys.mockResolvedValue(undefined);
    mocks.audit.mockResolvedValue(1);
  });

  it('reads published articles and protects the admin list', async () => {
    const publicResponse = await request(app).get('/api/blog');
    const unauthenticatedAdminResponse = await request(app).get('/api/blog/admin');
    const adminResponse = await request(app)
      .get('/api/blog/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(publicResponse.status).toBe(200);
    expect(publicResponse.body.posts).toEqual([post]);
    expect(unauthenticatedAdminResponse.status).toBe(401);
    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.posts).toEqual([post]);
  });

  it('creates an article only for an admin and validates its slug', async () => {
    const unauthenticatedResponse = await request(app)
      .post('/api/blog')
      .send(validPayload);
    const invalidSlugResponse = await request(app)
      .post('/api/blog')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validPayload, slug: '---' });
    const response = await request(app)
      .post('/api/blog')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload);

    expect(unauthenticatedResponse.status).toBe(401);
    expect(invalidSlugResponse.status).toBe(400);
    expect(response.status).toBe(201);
    expect(response.body.post).toEqual(post);
  });

  it('returns a clear conflict when create or update reuses a slug', async () => {
    const duplicateError = Object.assign(new Error('duplicate'), {
      code: 'ER_DUP_ENTRY',
    });
    mocks.create.mockRejectedValueOnce(duplicateError);
    mocks.update.mockRejectedValueOnce(duplicateError);

    const createResponse = await request(app)
      .post('/api/blog')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload);
    const updateResponse = await request(app)
      .put(`/api/blog/${post.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload);

    expect(createResponse.status).toBe(409);
    expect(updateResponse.status).toBe(409);
    expect(createResponse.body.message).toMatch(/slug/i);
  });

  it('updates an article and invalidates both old and new detail cache keys', async () => {
    mocks.findBySlugOrId.mockResolvedValueOnce({ ...post, slug: 'slug-lama' });

    const response = await request(app)
      .put(`/api/blog/${post.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload);

    expect(response.status).toBe(200);
    expect(mocks.deleteCacheKeys).toHaveBeenCalledWith([
      'blog:published',
      `blog:detail:${post.slug}`,
      'blog:detail:slug-lama',
    ]);
  });

  it('soft-deletes the selected article even if audit logging is unavailable', async () => {
    mocks.audit.mockRejectedValueOnce(new Error('audit unavailable'));

    const response = await request(app)
      .delete(`/api/blog/${post.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(204);
    expect(mocks.remove).toHaveBeenCalledWith(post.id);
    expect(mocks.deleteCacheKeys).toHaveBeenCalledWith([
      'blog:published',
      `blog:detail:${post.slug}`,
    ]);
  });

  it('returns 404 when update or delete targets a missing article', async () => {
    mocks.update.mockResolvedValueOnce(null);
    const updateResponse = await request(app)
      .put('/api/blog/404')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload);

    mocks.findBySlugOrId.mockResolvedValueOnce(null);
    const deleteResponse = await request(app)
      .delete('/api/blog/404')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });
});
