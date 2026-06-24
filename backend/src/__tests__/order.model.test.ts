import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMock = vi.hoisted(() => ({
  query: vi.fn(),
}));
const query = dbMock.query;

vi.mock('../db', () => ({
  pool: {
    query,
  },
}));

describe('order model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query
      .mockResolvedValueOnce([[{ total: 0 }]])
      .mockResolvedValueOnce([[]]);
  });

  it('applies admin order status and payment status filters to count and page queries', async () => {
    const { findOrdersPage } = await import('../models/order.model');

    await findOrdersPage(2, 8, {
      status: 'deal',
      paymentStatus: 'paid',
    });

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        'WHERE orders.deleted_at IS NULL AND orders.status = ? AND orders.payment_status = ?',
      ),
      ['deal', 'paid'],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        'WHERE orders.deleted_at IS NULL AND orders.status = ? AND orders.payment_status = ?',
      ),
      ['deal', 'paid', 8, 8],
    );
  });

  it('keeps admin order queries unfiltered when filters are omitted', async () => {
    const { findOrdersPage } = await import('../models/order.model');

    await findOrdersPage(1, 10);

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE orders.deleted_at IS NULL'),
      [],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('WHERE orders.deleted_at IS NULL'),
      [10, 0],
    );
    expect(query.mock.calls[0][0]).not.toContain('orders.status = ?');
    expect(query.mock.calls[0][0]).not.toContain('orders.payment_status = ?');
  });
});
