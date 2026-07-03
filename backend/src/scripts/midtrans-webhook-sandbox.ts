import crypto from 'node:crypto';
import { config } from '../config';

type SandboxStatus = 'settlement' | 'pending' | 'deny' | 'cancel' | 'expire' | 'failure';

const [, , orderIdArg, statusArg, amountArg, targetArg] = process.argv;

async function main() {
  const orderId = orderIdArg || 'NKC-SANDBOX-ORDER';
  const transactionStatus = normalizeStatus(statusArg);
  const grossAmount = amountArg || '150000';
  const targetUrl =
    targetArg || `http://localhost:${config.port}/api/payments/midtrans/webhook`;
  const statusCode = transactionStatus === 'pending' ? '201' : '200';
  const signatureKey = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${config.payment.midtransServerKey}`)
    .digest('hex');

  if (!config.payment.midtransServerKey) {
    throw new Error('MIDTRANS_SERVER_KEY wajib diset untuk membuat signature sandbox.');
  }

  const payload = {
    transaction_status: transactionStatus,
    transaction_id: `sandbox-${Date.now()}`,
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signatureKey,
    payment_type: 'bank_transfer',
    transaction_time: new Date().toISOString(),
    status_message:
      transactionStatus === 'settlement'
        ? 'Sandbox payment accepted'
        : `Sandbox ${transactionStatus}`,
  };

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  console.log(JSON.stringify({ targetUrl, status: response.status, body: text }, null, 2));
}

function normalizeStatus(value: string | undefined): SandboxStatus {
  const status = String(value ?? 'settlement').toLowerCase();

  if (
    status === 'pending' ||
    status === 'deny' ||
    status === 'cancel' ||
    status === 'expire' ||
    status === 'failure'
  ) {
    return status;
  }

  return 'settlement';
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
