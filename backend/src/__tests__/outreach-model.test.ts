import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pool } from '../db';
import { deleteOutreachLead, findOutreachLead, insertOutreachLead, listOutreachIdentities, listOutreachLeads } from '../models/outreach.model';
vi.mock('../db', () => ({ pool: { query: vi.fn(), execute: vi.fn() } }));
beforeEach(() => { vi.clearAllMocks(); });
describe('deleted prospect persistence', () => {
  it('hides deleted records but retains identities for deduplication', async () => {
    vi.mocked(pool.query).mockResolvedValue([[], []] as never);
    await listOutreachLeads(); await findOutreachLead(1); await listOutreachIdentities();
    expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining("status <> 'deleted'"));
    expect(pool.query).toHaveBeenNthCalledWith(2, expect.stringContaining("status <> 'deleted'"), [1]);
    expect(pool.query).toHaveBeenNthCalledWith(3, 'SELECT external_key, status FROM outreach_leads');
  });
  it('clears contacts and leaves the unique key intact', async () => {
    vi.mocked(pool.execute).mockResolvedValue([{ affectedRows: 1 }, []] as never);
    expect(await deleteOutreachLead(1)).toBe(true);
    expect(pool.execute).toHaveBeenCalledWith(expect.stringContaining("status = 'deleted', whatsapp_number = NULL"), [1]);
    expect(vi.mocked(pool.execute).mock.calls[0][0]).not.toMatch(/external_key\s*=/);
  });
  it('does not restore deleted prospects on CSV import', async () => {
    vi.mocked(pool.execute).mockResolvedValue([{ affectedRows: 0, insertId: 1 }, []] as never);
    await insertOutreachLead({ externalKey: 'fixture', businessName: 'Fixture', category: '', city: '', sourceUrl: 'https://example.com', evidenceUrl: 'https://example.com', contactUrl: 'https://example.com', observation: 'Fixture', opportunity: 'Fixture', score: 3, draftMessage: 'Fixture' });
    const sql = vi.mocked(pool.execute).mock.calls[0][0] as string;
    expect(sql.split('ON DUPLICATE KEY UPDATE')[1].trim()).toBe('id = LAST_INSERT_ID(id)');
  });
});
