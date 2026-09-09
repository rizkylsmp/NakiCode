import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserToken } from '../auth';
import { projectsRouter } from '../routes/projects';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  findPage: vi.fn(),
  audit: vi.fn(),
}));

vi.mock('../models/audit-log.model', () => ({
  createAdminAuditLog: mocks.audit,
}));

vi.mock('../models/project.model', async () => {
  const actual = await vi.importActual<typeof import('../models/project.model')>(
    '../models/project.model',
  );

  return {
    ...actual,
    createProject: mocks.create,
    updateProject: mocks.update,
    deleteProject: mocks.remove,
    findProjectById: mocks.findById,
    findProjects: mocks.findAll,
    findProjectsPage: mocks.findPage,
  };
});

const project = {
  id: 7,
  title: 'Naki Showcase',
  category: 'Company Profile',
  description: 'Website portfolio untuk brand digital.',
  result: 'Conversion naik',
  websiteUrl: 'https://example.com',
  imageUrl: '/uploads/cover.webp',
  imageUrls: ['/uploads/cover.webp', 'https://cdn.example.com/detail.webp'],
  coverIndex: 0,
  createdAt: '2026-09-09T00:00:00.000Z',
};

const validPayload = {
  title: `  ${project.title}  `,
  category: project.category,
  description: project.description,
  result: project.result,
  websiteUrl: project.websiteUrl,
  imageUrl: project.imageUrl,
  imageUrls: project.imageUrls,
  coverIndex: project.coverIndex,
};

const adminToken = createUserToken({
  id: 1,
  username: 'admin-test',
  role: 'admin',
});

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api/projects', projectsRouter);

describe('Portfolio CRUD API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue(project);
    mocks.update.mockResolvedValue(project);
    mocks.remove.mockResolvedValue(true);
    mocks.findById.mockResolvedValue(project);
    mocks.findAll.mockResolvedValue([project]);
    mocks.findPage.mockResolvedValue({
      projects: [project],
      page: 1,
      pageSize: 9,
      total: 1,
      totalPages: 1,
    });
    mocks.audit.mockResolvedValue(1);
  });

  it('reads the public list with and without pagination', async () => {
    const listResponse = await request(app).get('/api/projects');
    const pageResponse = await request(app).get('/api/projects?page=1&pageSize=9');

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.projects).toEqual([project]);
    expect(pageResponse.status).toBe(200);
    expect(pageResponse.body.total).toBe(1);
    expect(mocks.findPage).toHaveBeenCalledWith(1, 9);
  });

  it('protects mutations and creates a normalized portfolio for an admin', async () => {
    const unauthenticatedResponse = await request(app)
      .post('/api/projects')
      .send(validPayload);
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload);

    expect(unauthenticatedResponse.status).toBe(401);
    expect(response.status).toBe(201);
    expect(response.body.project).toEqual(project);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: project.title,
        imageUrls: project.imageUrls,
        coverIndex: 0,
      }),
    );
  });

  it('keeps a legacy single image when the gallery array is empty', async () => {
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validPayload, imageUrls: [], imageUrl: '/uploads/legacy.webp' });

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: '/uploads/legacy.webp',
        imageUrls: ['/uploads/legacy.webp'],
        coverIndex: 0,
      }),
    );
  });

  it('rejects unsafe URLs and an out-of-range cover index', async () => {
    const unsafeUrlResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validPayload, websiteUrl: 'javascript:alert(1)' });
    const invalidCoverResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validPayload, coverIndex: validPayload.imageUrls.length });

    expect(unsafeUrlResponse.status).toBe(400);
    expect(invalidCoverResponse.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('updates the selected portfolio and preserves its gallery', async () => {
    const response = await request(app)
      .put(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload);

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      project.id,
      expect.objectContaining({ imageUrls: project.imageUrls }),
    );
  });

  it('soft-deletes the selected portfolio even if audit logging is unavailable', async () => {
    mocks.audit.mockRejectedValueOnce(new Error('audit unavailable'));

    const response = await request(app)
      .delete(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(204);
    expect(mocks.remove).toHaveBeenCalledWith(project.id);
  });

  it('returns 404 when update or delete targets a missing portfolio', async () => {
    mocks.update.mockResolvedValueOnce(null);
    const updateResponse = await request(app)
      .put('/api/projects/404')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload);

    mocks.findById.mockResolvedValueOnce(null);
    mocks.remove.mockResolvedValueOnce(false);
    const deleteResponse = await request(app)
      .delete('/api/projects/404')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });
});
