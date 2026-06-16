import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config';
import {
  findOrderByPaymentReference,
  markOrderPaidByPaymentReference,
  markOrderPaymentFailedByReference,
} from '../models/order.model';
import { createNotification } from '../models/notification.model';
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
    if (shouldMarkPaid) {
      await markOrderPaidByPaymentReference(body.order_id);
      const order = await findOrderByPaymentReference(body.order_id);

      await createNotification({
        userId: order?.userId ?? null,
        title: 'Pembayaran berhasil',
        message: `Pembayaran untuk ${order?.templateTitle ?? 'pesanan kamu'} sudah diterima. Source code dan panduan sudah terbuka.`,
        type: 'payment',
        relatedOrderId: order?.id ?? null,
      });
    } else if (shouldMarkFailed) {
      await markOrderPaymentFailedByReference(body.order_id);
      const order = await findOrderByPaymentReference(body.order_id);

      await createNotification({
        userId: order?.userId ?? null,
        title: 'Pembayaran gagal',
        message: `Pembayaran untuk ${order?.templateTitle ?? 'pesanan kamu'} gagal atau kedaluwarsa. Kamu bisa membuat sesi pembayaran baru.`,
        type: 'payment',
        relatedOrderId: order?.id ?? null,
      });
    }

    response.json({ message: 'OK' });
  } catch {
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
