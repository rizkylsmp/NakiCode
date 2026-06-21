import crypto from 'node:crypto';
import { Router } from 'express';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { config } from '../config';
import {
  findOrderByPaymentReference,
  markOrderPaidByPaymentReference,
  markOrderPaymentFailedByReference,
} from '../models/order.model';
import { createNotification } from '../models/notification.model';
import { parseCurrencyAmount } from '../payments/payment.service';
import { parseBody } from '../validation';

export const paymentsRouter = Router();

const midtransNotificationSchema = z
  .object({
    order_id: z.string().trim().min(1),
    status_code: z.string().trim().min(1),
    gross_amount: z.string().trim().min(1),
    signature_key: z.string().trim().min(1),
    transaction_status: z.string().trim().min(1),
    fraud_status: z.string().trim().optional(),
  })
  .passthrough();

paymentsRouter.post('/midtrans/webhook', async (request, response) => {
  const body = parseBody(midtransNotificationSchema, request, response);

  if (!body) {
    return;
  }

  if (!isValidMidtransSignature(body)) {
    response.status(401).json({ message: 'Invalid Midtrans signature' });
    return;
  }

  const transactionStatus = body.transaction_status;
  const fraudStatus = body.fraud_status ?? 'accept';
  const shouldMarkPaid =
    transactionStatus === 'settlement' ||
    (transactionStatus === 'capture' && fraudStatus === 'accept');
  const shouldMarkFailed = ['deny', 'cancel', 'expire', 'failure'].includes(
    transactionStatus,
  );

  try {
    const order = await findOrderByPaymentReference(body.order_id);

    if (!order) {
      Sentry.captureMessage('Midtrans webhook: order not found', {
        level: 'warning',
        extra: { orderId: body.order_id },
      });
      response.status(404).json({ message: 'Order tidak ditemukan' });
      return;
    }

    // #8: Verify amount matches
    if (shouldMarkPaid) {
      const midtransAmount = parseInt(body.gross_amount, 10);
      const orderAmount = order.paymentAmount;

      if (midtransAmount !== orderAmount) {
        Sentry.captureMessage('Midtrans webhook: amount mismatch', {
          level: 'error',
          extra: {
            orderId: body.order_id,
            midtransAmount,
            orderAmount,
          },
        });
        response.status(400).json({ message: 'Jumlah pembayaran tidak sesuai' });
        return;
      }

      await markOrderPaidByPaymentReference(body.order_id);

      await createNotification({
        userId: order.userId,
        title: 'Pembayaran berhasil',
        message: `Pembayaran untuk ${order.templateTitle ?? 'pesanan kamu'} sudah diterima. Source code dan panduan sudah terbuka.`,
        type: 'payment',
        relatedOrderId: order.id,
      });
    } else if (shouldMarkFailed) {
      await markOrderPaymentFailedByReference(body.order_id);

      await createNotification({
        userId: order.userId,
        title: 'Pembayaran gagal',
        message: `Pembayaran untuk ${order.templateTitle ?? 'pesanan kamu'} gagal atau kedaluwarsa. Kamu bisa membuat sesi pembayaran baru.`,
        type: 'payment',
        relatedOrderId: order.id,
      });
    }

    response.json({ message: 'OK' });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal memproses webhook Midtrans' });
  }
});

function isValidMidtransSignature(body: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}) {
  if (!config.payment.midtransServerKey) {
    return config.payment.provider !== 'midtrans';
  }

  const signaturePayload = `${body.order_id}${body.status_code}${body.gross_amount}${config.payment.midtransServerKey}`;
  const expectedSignature = crypto
    .createHash('sha512')
    .update(signaturePayload)
    .digest('hex');

  return safeEqual(body.signature_key, expectedSignature);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}
