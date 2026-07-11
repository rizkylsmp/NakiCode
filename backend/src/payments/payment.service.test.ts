import { describe, expect, it } from 'vitest';
import type { OrderItem } from '../models/order.model';
import {
  createLynkPaymentSession,
  LynkCheckoutUnavailableError,
} from './payment.service';

function createOrder(templateLynkUrl: string | null) {
  return {
    id: 42,
    templateLynkUrl,
  } as OrderItem;
}

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
