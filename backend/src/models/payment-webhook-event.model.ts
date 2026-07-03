import type { ResultSetHeader } from 'mysql2';
import { pool } from '../db';

export type PaymentWebhookProcessingStatus =
  | 'received'
  | 'processed'
  | 'rejected'
  | 'failed';

export type PaymentWebhookProcessedAction =
  | 'paid'
  | 'failed'
  | 'pending'
  | 'ignored'
  | 'rejected';

export type PaymentWebhookEventPayload = {
  provider: 'midtrans';
  eventKey: string;
  paymentReference: string;
  transactionStatus: string;
  fraudStatus: string | null;
  statusCode: string | null;
  grossAmount: string | null;
  payload: Record<string, unknown>;
};

export async function createPaymentWebhookEvent(payload: PaymentWebhookEventPayload) {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO payment_webhook_events (
        provider,
        event_key,
        payment_reference,
        transaction_status,
        fraud_status,
        status_code,
        gross_amount,
        payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.provider,
        payload.eventKey,
        payload.paymentReference,
        payload.transactionStatus,
        payload.fraudStatus,
        payload.statusCode,
        payload.grossAmount,
        JSON.stringify(payload.payload),
      ],
    );

    return { inserted: true, id: result.insertId };
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      return { inserted: false, id: null };
    }

    throw error;
  }
}

export async function finishPaymentWebhookEvent(
  provider: string,
  eventKey: string,
  update: {
    processingStatus: PaymentWebhookProcessingStatus;
    processedAction: PaymentWebhookProcessedAction;
    failureReason?: string | null;
  },
) {
  await pool.query(
    `UPDATE payment_webhook_events
    SET processing_status = ?,
      processed_action = ?,
      failure_reason = ?,
      processed_at = CURRENT_TIMESTAMP
    WHERE provider = ? AND event_key = ?`,
    [
      update.processingStatus,
      update.processedAction,
      update.failureReason ?? null,
      provider,
      eventKey,
    ],
  );
}

function isDuplicateEntryError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ER_DUP_ENTRY'
  );
}
