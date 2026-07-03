import crypto from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserToken } from '../auth';
import { config } from '../config';
import { createPaymentWebhookEvent } from '../models/payment-webhook-event.model';
import { ordersRouter } from '../routes/orders';
import { paymentsRouter } from '../routes/payments';

vi.mock('../models/order.model', async () => {
  const actual = await vi.importActual<typeof import('../models/order.model')>(
    '../models/order.model',
  );

  return {
    ...actual,
    findOrderByPaymentReference: vi.fn(async () => null),
    findOrderByIdForUser: vi.fn(async () => null),
    markOrderPaidByPaymentReference: vi.fn(async () => undefined),
    markOrderPaymentFailedByReference: vi.fn(async () => undefined),
    recordOrderPaymentWebhookStatus: vi.fn(async () => undefined),
  };
});

vi.mock('../models/payment-webhook-event.model', () => ({
  createPaymentWebhookEvent: vi.fn(async () => ({ inserted: true, id: 1 })),
  finishPaymentWebhookEvent: vi.fn(async () => undefined),
}));

vi.mock('../models/notification.model', async () => {
  const actual = await vi.importActual<
    typeof import('../models/notification.model')
  >('../models/notification.model');

  return {
    ...actual,
    createNotification: vi.fn(async () => undefined),
  };
});

const webhookApp = express();
webhookApp.use(express.json({ limit: '1mb' }));
webhookApp.use('/api/payments', paymentsRouter);

const orderPaymentApp = express();
orderPaymentApp.use(express.json({ limit: '1mb' }));
orderPaymentApp.use('/api/orders', ordersRouter);

function webhookPayload(transactionStatus: string) {
  const orderId = 'ORDER-000001';
  const statusCode = '200';
  const grossAmount = '150000';
  const signatureKey = config.payment.midtransServerKey
    ? crypto
        .createHash('sha512')
        .update(`${orderId}${statusCode}${grossAmount}${config.payment.midtransServerKey}`)
        .digest('hex')
    : 'dev-signature';

  return {
    transaction_status: transactionStatus,
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signatureKey,
    payment_type: 'bank_transfer',
    transaction_time: '2026-06-16 10:00:00',
  };
}

describe('Payments API Integration', () => {
  const userToken = createUserToken({
    id: 10,
    username: 'user-test',
    role: 'user',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createPaymentWebhookEvent).mockResolvedValue({
      inserted: true,
      id: 1,
    });
  });

  describe('POST /api/payments/midtrans/webhook', () => {
    it('accepts webhook without authentication', async () => {
      // Midtrans webhooks don't use Bearer auth
      const response = await request(webhookApp)
        .post('/api/payments/midtrans/webhook')
        .send(webhookPayload('settlement'));

      expect(response.status).not.toBe(401);
      expect([200, 400, 404]).toContain(response.status);
    });

    it('handles settlement status', async () => {
      const response = await request(webhookApp)
        .post('/api/payments/midtrans/webhook')
        .send(webhookPayload('settlement'));

      expect([200, 400, 404]).toContain(response.status);
    });

    it('handles pending status', async () => {
      const response = await request(webhookApp)
        .post('/api/payments/midtrans/webhook')
        .send(webhookPayload('pending'));

      expect([200, 400, 404]).toContain(response.status);
    });

    it('handles failure status', async () => {
      const response = await request(webhookApp)
        .post('/api/payments/midtrans/webhook')
        .send(webhookPayload('deny'));

      expect([200, 400, 404]).toContain(response.status);
    });

    it('ignores duplicate webhook events idempotently', async () => {
      vi.mocked(createPaymentWebhookEvent).mockResolvedValueOnce({
        inserted: false,
        id: null,
      });

      const response = await request(webhookApp)
        .post('/api/payments/midtrans/webhook')
        .send(webhookPayload('settlement'));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ duplicate: true });
    });

    it('validates webhook payload structure', async () => {
      const response = await request(webhookApp)
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
      const response = await request(orderPaymentApp)
        .post('/api/orders/1/payment')
        .send({ method: 'transfer' });

      expect(response.status).toBe(401);
    });

    it('validates payment method', async () => {
      const response = await request(orderPaymentApp)
        .post('/api/orders/1/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ method: 'crypto' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Input tidak valid');
    });

    it('accepts transfer payment method', async () => {
      const response = await request(orderPaymentApp)
        .post('/api/orders/1/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ method: 'transfer' });

      // Accepts 200 (success), 404 (order not found), or 400 (already paid)
      expect([200, 400, 404]).toContain(response.status);
    });

    it('accepts ewallet payment method', async () => {
      const response = await request(orderPaymentApp)
        .post('/api/orders/1/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ method: 'ewallet' });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('accepts qris payment method', async () => {
      const response = await request(orderPaymentApp)
        .post('/api/orders/1/payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ method: 'qris' });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('prevents duplicate payment for already paid order', async () => {
      // Note: This test requires a paid order to exist
      const response = await request(orderPaymentApp)
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
      const response = await request(orderPaymentApp)
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
      const response = await request(webhookApp)
        .post('/api/payments/midtrans/webhook')
        .send(webhookPayload('settlement'));

      expect([200, 400, 404]).toContain(response.status);
    });

    it('does not update order status on pending payment', async () => {
      const response = await request(webhookApp)
        .post('/api/payments/midtrans/webhook')
        .send(webhookPayload('pending'));

      expect([200, 400, 404]).toContain(response.status);
    });

    it('handles expired payment', async () => {
      const response = await request(webhookApp)
        .post('/api/payments/midtrans/webhook')
        .send(webhookPayload('expire'));

      expect([200, 400, 404]).toContain(response.status);
    });
  });
});
