import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMock = vi.hoisted(() => ({
  query: vi.fn(),
  connectionQuery: vi.fn(),
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
  getConnection: vi.fn(),
}));
const query = dbMock.query;
const connectionQuery = dbMock.connectionQuery;
const beginTransaction = dbMock.beginTransaction;
const commit = dbMock.commit;
const rollback = dbMock.rollback;
const release = dbMock.release;
const getConnection = dbMock.getConnection;

vi.mock('../db', () => ({
  pool: {
    query,
    getConnection,
  },
}));

const connection = {
  query: connectionQuery,
  beginTransaction,
  commit,
  rollback,
  release,
};

describe('category model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getConnection.mockResolvedValue(connection);
    query.mockResolvedValue([[{ name: 'Semua' }, { name: 'Portfolio' }]]);
  });

  it('syncs template category text by category id after a rename', async () => {
    const { updateTemplateCategory } = await import('../models/category.model');
    connectionQuery
      .mockResolvedValueOnce([[{ name: 'Landing Page' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 2 }]);

    const result = await updateTemplateCategory(7, { name: 'Company Profile' });

    expect(beginTransaction).toHaveBeenCalledOnce();
    expect(connectionQuery).toHaveBeenCalledWith(
      'SELECT name FROM template_categories WHERE id = ? FOR UPDATE',
      [7],
    );
    expect(connectionQuery).toHaveBeenCalledWith(
      'UPDATE templates SET category = ? WHERE category_id = ?',
      ['Company Profile', 7],
    );
    expect(commit).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
    expect(result.updated).toBe(true);
  });

  it('does not delete a category while active templates still use it', async () => {
    const { deleteTemplateCategory } = await import('../models/category.model');
    query
      .mockResolvedValueOnce([[{ name: 'Portfolio' }]])
      .mockResolvedValueOnce([[{ count: 3 }]])
      .mockResolvedValueOnce([[{ name: 'Portfolio' }]]);

    const result = await deleteTemplateCategory(3);

    expect(result).toMatchObject({ deleted: false, inUse: true });
    expect(query).not.toHaveBeenCalledWith(
      'DELETE FROM template_categories WHERE id = ?',
      [3],
    );
  });

  it('deletes a category after confirming it is unused', async () => {
    const { deleteTemplateCategory } = await import('../models/category.model');
    query
      .mockResolvedValueOnce([[{ name: 'Unused' }]])
      .mockResolvedValueOnce([[{ count: 0 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ name: 'Portfolio' }]]);

    const result = await deleteTemplateCategory(4);

    expect(query).toHaveBeenCalledWith(
      `UPDATE templates
    SET category_id = NULL
    WHERE category_id = ? AND deleted_at IS NOT NULL`,
      [4],
    );
    expect(query).toHaveBeenCalledWith(
      'DELETE FROM template_categories WHERE id = ?',
      [4],
    );
    expect(result).toMatchObject({ deleted: true, inUse: false });
  });
});
