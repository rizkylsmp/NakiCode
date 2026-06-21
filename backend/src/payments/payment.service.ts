import { config } from '../config';
import type { OrderItem } from '../models/order.model';

export type PaymentMethod = 'qris' | 'dana' | 'manual';

export type PaymentSession = {
  method: string;
  reference: string;
  url: string;
  amount: number;
};

type PaymentSessionInput = {
  order: OrderItem;
  method: PaymentMethod;
  amount: number;
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  qris: 'QRIS',
  dana: 'DANA',
  manual: 'Transfer manual/dev',
};

export async function createPaymentSession({
  order,
  method,
  amount,
}: PaymentSessionInput): Promise<PaymentSession> {
  const reference = `NKC-${order.id}-${Date.now().toString(36).toUpperCase()}`;

  if (
    config.payment.provider.toLowerCase() === 'midtrans' &&
    config.payment.midtransServerKey
  ) {
    return createMidtransSnapSession({
      order,
      method,
      amount,
      reference,
    });
  }

  return {
    method: `${paymentMethodLabels[method]} (dev)`,
    reference,
    url: `${config.clientOrigin}/pesanan-saya?payment=${encodeURIComponent(
      reference,
    )}`,
    amount,
  };
}

export function normalizePaymentMethod(value: unknown): PaymentMethod {
  const method = String(value ?? 'qris').toLowerCase();

  if (method === 'dana' || method === 'manual') {
    return method;
  }

  return 'qris';
}

export function parseCurrencyAmount(value: string | null | undefined) {
  const text = String(value ?? '').toLowerCase().replace(/\s+/g, '');
  const numericValue = Number(
    text
      .replace(/rp/g, '')
      .replace(/[^\d.,]/g, '')
      .replace(/\./g, '')
      .replace(',', '.'),
  );

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 1000;
  }

  if (text.includes('jt') || text.includes('juta')) {
    return Math.round(numericValue * 1_000_000);
  }

  if (text.includes('k')) {
    return Math.round(numericValue * 1000);
  }

  return Math.round(numericValue);
}

async function createMidtransSnapSession({
  order,
  method,
  amount,
  reference,
}: PaymentSessionInput & { reference: string }): Promise<PaymentSession> {
  const baseUrl = config.payment.midtransIsProduction
    ? 'https://app.midtrans.com'
    : 'https://app.sandbox.midtrans.com';
  const response = await fetch(`${baseUrl}/snap/v1/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${config.payment.midtransServerKey}:`,
      ).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: reference,
        gross_amount: amount,
      },
      item_details: [
        {
          id: String(order.templateId ?? order.id),
          price: amount,
          quantity: 1,
          name: order.templateTitle.slice(0, 50),
        },
      ],
      customer_details: {
        first_name: order.customerName,
        email: order.customerContact.includes('@')
          ? order.customerContact
          : undefined,
        phone: order.customerContact.includes('@')
          ? undefined
          : order.customerContact,
      },
      enabled_payments: method === 'dana' ? ['dana'] : ['gopay', 'shopeepay'],
      callbacks: {
        finish: `${config.clientOrigin}/pesanan-saya?payment=${encodeURIComponent(
          reference,
        )}`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as {
    redirect_url?: string;
  };

  return {
    method: paymentMethodLabels[method],
    reference,
    url:
      data.redirect_url ??
      `${config.clientOrigin}/pesanan-saya?payment=${encodeURIComponent(
        reference,
      )}`,
    amount,
  };
}
