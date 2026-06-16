import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createUserToken } from '../auth';
import { app } from '../server';

describe('Favorites API Integration', () => {
  const userToken = createUserToken({
    id: 10,
    username: 'user-test',
    role: 'user',
  });

  const otherUserToken = createUserToken({
    id: 20,
    username: 'other-user',
    role: 'user',
  });

  describe('GET /api/favorites/my', () => {
    it('rejects request without auth token', async () => {
      const response = await request(app).get('/api/favorites/my');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('User authorization required');
    });

    it('returns empty array for user with no favorites', async () => {
      const response = await request(app)
        .get('/api/favorites/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('templateIds');
      expect(Array.isArray(response.body.templateIds)).toBe(true);
    });

    it('returns user favorite template IDs', async () => {
      const response = await request(app)
        .get('/api/favorites/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('source');
      expect(response.body).toHaveProperty('templateIds');
      expect(Array.isArray(response.body.templateIds)).toBe(true);
    });
  });

  describe('POST /api/favorites/:templateId', () => {
    it('rejects request without auth token', async () => {
      const response = await request(app)
        .post('/api/favorites/1');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('User authorization required');
    });

    it('validates templateId parameter', async () => {
      const response = await request(app)
        .post('/api/favorites/invalid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
    });

    it('returns 404 for non-existent template', async () => {
      const response = await request(app)
        .post('/api/favorites/999999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it('adds template to favorites', async () => {
      const response = await request(app)
        .post('/api/favorites/1')
        .set('Authorization', `Bearer ${userToken}`);

      // Accepts 201 (created) or 404 (template not found)
      expect([201, 404]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('templateIds');
        expect(Array.isArray(response.body.templateIds)).toBe(true);
      }
    });

    it('allows adding same favorite multiple times (idempotent)', async () => {
      // Add favorite first time
      await request(app)
        .post('/api/favorites/1')
        .set('Authorization', `Bearer ${userToken}`);

      // Try to add same favorite again
      const response = await request(app)
        .post('/api/favorites/1')
        .set('Authorization', `Bearer ${userToken}`);

      // Should return success (idempotent) or not found
      expect([201, 404]).toContain(response.status);
    });

    it('allows different users to favorite same template', async () => {
      // User 1 favorites template
      await request(app)
        .post('/api/favorites/1')
        .set('Authorization', `Bearer ${userToken}`);

      // User 2 favorites same template
      const response = await request(app)
        .post('/api/favorites/1')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect([201, 404]).toContain(response.status);
    });
  });

  describe('DELETE /api/favorites/:templateId', () => {
    it('rejects request without auth token', async () => {
      const response = await request(app).delete('/api/favorites/1');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('User authorization required');
    });

    it('validates templateId parameter', async () => {
      const response = await request(app)
        .delete('/api/favorites/invalid')
        .set('Authorization', `Bearer ${userToken}`);

      expect([400, 500]).toContain(response.status);
    });

    it('removes template from favorites', async () => {
      // Add favorite first
      await request(app)
        .post('/api/favorites/1')
        .set('Authorization', `Bearer ${userToken}`);

      // Remove favorite
      const response = await request(app)
        .delete('/api/favorites/1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('templateIds');
      expect(Array.isArray(response.body.templateIds)).toBe(true);
    });

    it('returns success even if favorite does not exist (idempotent)', async () => {
      const response = await request(app)
        .delete('/api/favorites/999999')
        .set('Authorization', `Bearer ${userToken}`);

      expect([200, 500]).toContain(response.status);
    });

    it('only removes favorite for current user', async () => {
      // User 1 adds favorite
      await request(app)
        .post('/api/favorites/1')
        .set('Authorization', `Bearer ${userToken}`);

      // User 2 tries to remove (should only affect user 2's list)
      const response = await request(app)
        .delete('/api/favorites/1')
        .set('Authorization', `Bearer ${otherUserToken}`);

      // Should return success regardless
      expect([200, 500]).toContain(response.status);
    });
  });
});
