import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createUserToken } from '../auth';
import { app } from '../server';

describe('auth and order integration guards', () => {
  it('rejects admin auth check without a token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Token tidak valid');
  });

  it('rejects order creation without a user token', async () => {
    const response = await request(app).post('/api/orders').send({});

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('User authorization required');
  });

  it('validates order payload before writing to database', async () => {
    const token = createUserToken({
      id: 10,
      username: 'buyer-test',
      role: 'user',
    });

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
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

  it('validates payment method before loading an order', async () => {
    const token = createUserToken({
      id: 10,
      username: 'buyer-test',
      role: 'user',
    });

    const response = await request(app)
      .post('/api/orders/1/payment')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'crypto' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Input tidak valid');
  });
});
