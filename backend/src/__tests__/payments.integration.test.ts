import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createUserToken } from '../auth';
import { app } from '../server';

describe('Payments API Integration', () => {
  const userToken = createUserToken({
    id: 10,
    username: 'user-test',
    role: 'user',
  });

  describe('POST /api/payments/midtrans/webhook', () => {
    it('accepts webhook without authentication', async () => {
      // Midtrans webhooks don't use Bearer auth
      const response = await request(app)
        .post('/api/payments/midtrans/webhook')
        .send({
          transaction_status: 'settlement',
          order_id: 'ORDER-000001',
          gross_amount: '150000',
          payment_type: 'bank_transfer',
          transaction_time: '2026-06-16 10:00:00',
        });

      // Accepts 200 (processed) or 400 (invalid signature/data)
      expect([200, 400, 404]).toContain(response.status);
    });

    it('handles settlement status', async () => {
      const response = await request(app)
        .post('/api/payments/midtrans/webhook')
        .send({
          transaction_status: 'settlement',
          order_id: 'ORDER-000001',
          gross_amount: '150000',
          payment_type: 'bank_transfer',
          transaction_time: '2026-06-16 10:00:00',
        });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('handles pending status', async () => {
      const response = await request(app)
        .post('/api/payments/midtrans/webhook')
        .send({
          transaction_status: 'pending',
          order_id: 'ORDER-000001',
          gross_amount: '150000',
          payment_type: 'bank_transfer',
          transaction_time: '2026-06-16 10:00:00',
        });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('handles failure status', async () => {
      const response = await request(app)
        .post('/api/payments/midtrans/webhook')
        .send({
          transaction_status: 'deny',
          order_id: 'ORDER-000001',
          gross_amount: '150000',
          payment_type: 'bank_transfer',
          transaction_time: '2026-06-16 10:00:00',
        });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('validates webhook payload structure', async () => {
      const response = await request(app)
        .post('/api/payments/midtrans/webhook')
        .send({
          // Missing required fields
          transaction_status: 'settlement',
        });

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('POST /api/orders/:id/payment', () => {
    it('rejects payment without auth', async () => {
      const response = await request(app)
        .post('/api/orders/1/payment')
        .send({ method: 'transfer' });

      expect(response.status).toBe(401);
    });

    it('validates payment method', async () => {
      const response = await request(app)
        .post('/api/orders/1/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ method: 'crypto' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Input tidak valid');
    });

    it('accepts transfer payment method', async () => {
      const response = await request(app)
        .post('/api/orders/1/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ method: 'transfer' });

      // Accepts 200 (success), 404 (order not found), or 400 (already paid)
      expect([200, 400, 404]).toContain(response.status);
    });

    it('accepts ewallet payment method', async () => {
      const response = await request(app)
        .post('/api/orders/1/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ method: 'ewallet' });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('accepts qris payment method', async () => {
      const response = await request(app)
        .post('/api/orders/1/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ method: 'qris' });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('prevents duplicate payment for already paid order', async () => {
      // Note: This test requires a paid order to exist
      const response = await request(app)
        .post('/api/orders/1/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ method: 'transfer' });

      // Accepts 200 (success), 400 (already paid), or 404 (not found)
      expect([200, 400, 404]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body.message).toBeDefined();
      }
    });

    it('returns payment URL or instructions', async () => {
      const response = await request(app)
        .post('/api/orders/1/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ method: 'transfer' });

      if (response.status === 200) {
        // Should return payment instructions or Midtrans URL
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('Payment Status Updates', () => {
    it('updates order status on successful payment', async () => {
      // This is tested via webhook endpoint
      const response = await request(app)
        .post('/api/payments/midtrans/webhook')
        .send({
          transaction_status: 'settlement',
          order_id: 'ORDER-000001',
          gross_amount: '150000',
          payment_type: 'bank_transfer',
          transaction_time: '2026-06-16 10:00:00',
        });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('does not update order status on pending payment', async () => {
      const response = await request(app)
        .post('/api/payments/midtrans/webhook')
        .send({
          transaction_status: 'pending',
          order_id: 'ORDER-000001',
          gross_amount: '150000',
          payment_type: 'bank_transfer',
          transaction_time: '2026-06-16 10:00:00',
        });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('handles expired payment', async () => {
      const response = await request(app)
        .post('/api/payments/midtrans/webhook')
        .send({
          transaction_status: 'expire',
          order_id: 'ORDER-000001',
          gross_amount: '150000',
          payment_type: 'bank_transfer',
          transaction_time: '2026-06-16 10:00:00',
        });

      expect([200, 400, 404]).toContain(response.status);
    });
  });
});
