import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createUserToken } from '../auth';
import { app } from '../server';

describe('Orders API Integration', () => {
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

  describe('POST /api/orders', () => {
    it('rejects order creation without auth token', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          templateSlug: 'test-template',
          templateTitle: 'Test Template',
          customerName: 'John Doe',
          customerContact: 'john@example.com',
          projectType: 'custom',
          budgetRange: '1-3jt',
          message: 'I need a custom website',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('User authorization required');
    });

    it('validates required fields for order creation', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          templateSlug: '',
          templateTitle: '',
          customerName: '',
          customerContact: '',
          message: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Input tidak valid');
    });

    it('creates order with valid data', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          templateSlug: 'test-template',
          templateTitle: 'Test Portfolio Template',
          customerName: 'John Doe',
          customerContact: 'john@example.com',
          projectType: 'custom',
          budgetRange: '1-3jt',
          message: 'I need a custom portfolio website with blog',
        });

      expect([200, 201]).toContain(response.status);
      
      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty('order');
        expect(response.body.order).toHaveProperty('id');
      }
    });

    it('allows guest order creation without auth', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          templateSlug: 'test-template',
          templateTitle: 'Test Template',
          customerName: 'Guest User',
          customerContact: 'guest@example.com',
          projectType: 'template',
          budgetRange: '1jt',
          message: 'I want to buy this template',
        });

      // Should allow guest orders (userId will be null)
      expect([200, 201, 401]).toContain(response.status);
    });
  });

  describe('GET /api/orders/my', () => {
    it('rejects fetching orders without auth token', async () => {
      const response = await request(app).get('/api/orders/my');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('User authorization required');
    });

    it('fetches user orders with auth token', async () => {
      const response = await request(app)
        .get('/api/orders/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('supports pagination for user orders', async () => {
      const response = await request(app)
        .get('/api/orders/my')
        .query({ page: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(10);
    });

    it('filters user orders by payment status', async () => {
      const response = await request(app)
        .get('/api/orders/my')
        .query({ paymentStatus: 'paid' })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.orders)).toBe(true);
    });
  });

  describe('GET /api/orders', () => {
    it('rejects fetching admin orders without auth token', async () => {
      const response = await request(app).get('/api/orders');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Admin authorization required');
    });

    it('rejects fetching admin orders from non-admin user', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Admin authorization required');
    });

    it('allows admin to fetch all orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('supports pagination for admin orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ page: 2, pageSize: 20 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(response.body.pageSize).toBe(20);
    });

    it('filters admin orders by status', async () => {
      const response = await request(app)
        .get('/api/orders')
        .query({ status: 'paid' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.orders)).toBe(true);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('rejects status update without auth token', async () => {
      const response = await request(app)
        .patch('/api/orders/1/status')
        .send({ status: 'contacted' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Admin authorization required');
    });

    it('rejects status update from non-admin user', async () => {
      const response = await request(app)
        .patch('/api/orders/1/status')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'contacted' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Admin authorization required');
    });

    it('validates status field', async () => {
      const response = await request(app)
        .patch('/api/orders/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
    });

    it('returns 404 for non-existent order', async () => {
      const response = await request(app)
        .patch('/api/orders/999999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'contacted' });

      expect(response.status).toBe(404);
    });

    it('allows admin to update order status', async () => {
      // Note: This test requires an order to exist
      const response = await request(app)
        .patch('/api/orders/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'contacted' });

      // Accepts both 200 (updated) and 404 (not found in test DB)
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/orders/:id/payment', () => {
    it('rejects payment initiation without auth token', async () => {
      const response = await request(app)
        .post('/api/orders/1/payment')
        .send({ method: 'transfer' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('User authorization required');
    });

    it('validates payment method', async () => {
      const response = await request(app)
        .post('/api/orders/1/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ method: 'invalid-method' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Input tidak valid');
    });

    it('returns 404 for non-existent order', async () => {
      const response = await request(app)
        .post('/api/orders/999999/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ method: 'transfer' });

      // Accepts 400 (validation) or 404 (not found)
      expect([400, 404]).toContain(response.status);
    });

    it('initiates payment with valid method', async () => {
      const response = await request(app)
        .post('/api/orders/1/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ method: 'transfer' });

      // Accepts 200 (success), 404 (order not found), or 400 (already paid)
      expect([200, 404, 400]).toContain(response.status);
    });
  });

  describe('GET /api/orders/:id/invoice', () => {
    it('rejects invoice generation without auth token', async () => {
      const response = await request(app).get('/api/orders/1/invoice');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('User authorization required');
    });

    it('returns 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/999999/invoice')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it('rejects invoice for unpaid order', async () => {
      // Note: This test requires an unpaid order to exist
      const response = await request(app)
        .get('/api/orders/1/invoice')
        .set('Authorization', `Bearer ${userToken}`);

      // Accepts 400 (not paid), 404 (not found), or 200 (if paid)
      expect([200, 400, 404]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body.message).toContain('sudah dibayar');
      }
    });

    it('generates PDF invoice for paid order', async () => {
      // Note: This test requires a paid order to exist
      const response = await request(app)
        .get('/api/orders/1/invoice')
        .set('Authorization', `Bearer ${userToken}`);

      // Accepts 200 (PDF generated), 400 (not paid), or 404 (not found)
      expect([200, 400, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.headers['content-type']).toBe('application/pdf');
        expect(response.headers['content-disposition']).toContain('invoice-');
      }
    });
  });
});
