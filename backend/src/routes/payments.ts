import crypto from 'node:crypto';
import { Router } from 'express';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { config } from '../config';
import {
  findOrderByPaymentReference,
  markOrderPaidByPaymentReference,
  markOrderPaymentFailedByReference,
  recordOrderPaymentWebhookStatus,
} from '../models/order.model';
import { createNotification } from '../models/notification.model';
import {
  createPaymentWebhookEvent,
  finishPaymentWebhookEvent,
  type PaymentWebhookProcessedAction,
  type PaymentWebhookProcessingStatus,
} from '../models/payment-webhook-event.model';
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
    transaction_id: z.string().trim().optional(),
    transaction_time: z.string().trim().optional(),
    status_message: z.string().trim().optional(),
    payment_type: z.string().trim().optional(),
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
  const eventKey = buildMidtransEventKey(body);
  const shouldMarkPaid =
    transactionStatus === 'settlement' ||
    (transactionStatus === 'capture' && fraudStatus === 'accept');
  const shouldMarkFailed = ['deny', 'cancel', 'expire', 'failure'].includes(
    transactionStatus,
  );

  try {
    const event = await createPaymentWebhookEvent({
      provider: 'midtrans',
      eventKey,
      paymentReference: body.order_id,
      transactionStatus,
      fraudStatus: body.fraud_status ?? null,
      statusCode: body.status_code,
      grossAmount: body.gross_amount,
      payload: body,
    });

    if (!event.inserted) {
      response.json({ message: 'Duplicate webhook ignored', duplicate: true });
      return;
    }

    const order = await findOrderByPaymentReference(body.order_id);

    if (!order) {
      await finishMidtransWebhookEvent(eventKey, {
        processingStatus: 'rejected',
        processedAction: 'rejected',
        failureReason: 'Order tidak ditemukan',
      });
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
        const failureReason = `Jumlah webhook Midtrans (${midtransAmount}) tidak sesuai dengan order (${orderAmount ?? 'unknown'})`;
        await markOrderPaymentFailedByReference(body.order_id, {
          code: body.status_code,
          reason: failureReason,
          transactionStatus,
        });
        await finishMidtransWebhookEvent(eventKey, {
          processingStatus: 'rejected',
          processedAction: 'rejected',
          failureReason,
        });
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

      const wasUpdated = await markOrderPaidByPaymentReference(body.order_id);

      if (wasUpdated) {
        await createNotification({
          userId: order.userId,
          title: 'Pembayaran berhasil',
          message: `Pembayaran untuk ${order.templateTitle ?? 'pesanan kamu'} sudah diterima. Source code dan panduan sudah terbuka.`,
          type: 'payment',
          relatedOrderId: order.id,
        });
      }

      await finishMidtransWebhookEvent(eventKey, {
        processingStatus: 'processed',
        processedAction: wasUpdated ? 'paid' : 'ignored',
      });
    } else if (shouldMarkFailed) {
      const failureReason = getMidtransFailureReason(body);
      const wasUpdated = await markOrderPaymentFailedByReference(body.order_id, {
        code: body.status_code,
        reason: failureReason,
        transactionStatus,
      });

      if (wasUpdated) {
        await createNotification({
          userId: order.userId,
          title: 'Pembayaran gagal',
          message: `Pembayaran untuk ${order.templateTitle ?? 'pesanan kamu'} gagal atau kedaluwarsa. Kamu bisa membuat sesi pembayaran baru.`,
          type: 'payment',
          relatedOrderId: order.id,
        });
      }

      await finishMidtransWebhookEvent(eventKey, {
        processingStatus: 'processed',
        processedAction: wasUpdated ? 'failed' : 'ignored',
        failureReason,
      });
    } else {
      await recordOrderPaymentWebhookStatus(body.order_id, transactionStatus);
      await finishMidtransWebhookEvent(eventKey, {
        processingStatus: 'processed',
        processedAction: 'pending',
      });
    }

    response.json({ message: 'OK' });
  } catch (error) {
    await finishMidtransWebhookEvent(eventKey, {
      processingStatus: 'failed',
      processedAction: 'ignored',
      failureReason: error instanceof Error ? error.message : 'Webhook processing failed',
    }).catch(() => undefined);
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

async function finishMidtransWebhookEvent(
  eventKey: string,
  update: {
    processingStatus: PaymentWebhookProcessingStatus;
    processedAction: PaymentWebhookProcessedAction;
    failureReason?: string | null;
  },
) {
  await finishPaymentWebhookEvent('midtrans', eventKey, update);
}

function buildMidtransEventKey(body: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
  transaction_time?: string;
}) {
  return [
    body.transaction_id || body.order_id,
    body.transaction_status,
    body.fraud_status || '',
    body.status_code,
    body.gross_amount,
    body.transaction_time || '',
  ].join('|');
}

function getMidtransFailureReason(body: {
  transaction_status: string;
  status_message?: string;
}) {
  if (body.status_message) {
    return body.status_message;
  }

  const statusLabel: Record<string, string> = {
    deny: 'Pembayaran ditolak oleh gateway',
    cancel: 'Pembayaran dibatalkan',
    expire: 'Waktu pembayaran kedaluwarsa',
    failure: 'Gateway melaporkan pembayaran gagal',
  };

  return statusLabel[body.transaction_status] ?? `Status Midtrans: ${body.transaction_status}`;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}
