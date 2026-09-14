import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { config } from '../config';
import type { OrderItem } from '../models/order.model';
import {
  createPaymentSession,
  createLynkPaymentSession,
  LynkCheckoutUnavailableError,
} from './payment.service';

function createOrder(templateLynkUrl: string | null) {
  return {
    id: 42,
    templateId: 7,
    templateTitle: 'Design Sandbox',
    customerName: 'Sandbox User',
    customerContact: 'sandbox@example.com',
    templateLynkUrl,
  } as OrderItem;
}

const originalPaymentConfig = { ...config.payment };

beforeAll(() => {
  config.payment.provider = 'midtrans';
  config.payment.midtransServerKey = 'SB-Mid-server-test';
  config.payment.midtransIsProduction = false;
});

afterAll(() => {
  Object.assign(config.payment, originalPaymentConfig);
});

describe('createPaymentSession', () => {
  it('uses the Midtrans Sandbox Snap endpoint in local mode', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          redirect_url: 'https://app.sandbox.midtrans.com/snap/v4/redirection/test',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const session = await createPaymentSession({
      order: createOrder(null),
      method: 'qris',
      amount: 149_000,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.sandbox.midtrans.com/snap/v1/transactions',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(session.url).toContain('app.sandbox.midtrans.com');
    fetchMock.mockRestore();
  });
});

describe('createLynkPaymentSession', () => {
  it('creates a trusted Lynk redirect session', () => {
    const session = createLynkPaymentSession(
      createOrder('https://lynk.id/nakicode/design-company'),
      149_000,
    );

    expect(session.method).toBe('Lynk');
    expect(session.url).toBe('https://lynk.id/nakicode/design-company');
    expect(session.reference).toMatch(/^LYNK-42-/);
    expect(session.amount).toBe(149_000);
  });

  it.each([
    null,
    'https://example.com/fake-lynk',
    'http://lynk.id/nakicode/insecure',
  ])('rejects an unavailable or untrusted URL: %s', (url) => {
    expect(() => createLynkPaymentSession(createOrder(url), 149_000)).toThrow(
      LynkCheckoutUnavailableError,
    );
  });
});
