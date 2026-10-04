import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserToken } from '../auth';
import { outreachRouter } from '../routes/outreach';
import { deleteOutreachLead, findOutreachLead, updateOutreachLead } from '../models/outreach.model';
import { createAdminAuditLog } from '../models/audit-log.model';
vi.mock('../config', () => ({ config: { auth: { tokenSecret: 'fixture-secret', tokenTtlSeconds: 3600 } } }));
vi.mock('../models/outreach.model', () => ({ outreachStatuses: ['new', 'reviewed', 'ready', 'sending', 'sent', 'replied', 'qualified', 'won', 'lost', 'failed', 'do_not_contact'], deleteOutreachLead: vi.fn(), findOutreachLead: vi.fn(), updateOutreachLead: vi.fn(), insertOutreachLead: vi.fn(), listOutreachLeads: vi.fn() }));
vi.mock('../models/audit-log.model', () => ({ createAdminAuditLog: vi.fn() }));
const app = express();
app.use(express.json(), outreachRouter);
const token = createUserToken({ id: 1, username: 'fixture', role: 'admin' });
beforeEach(() => { vi.clearAllMocks(); });
describe('outreach API', () => {
  it('allows editing a lost prospect while retaining its status', async () => {
    vi.mocked(findOutreachLead).mockResolvedValue({ status: 'lost', whatsapp_number: '6280000000000', opt_in_at: null, opt_in_source: null } as never);
    vi.mocked(updateOutreachLead).mockResolvedValue(true);
    const response = await request(app).patch('/1').set('Authorization', `Bearer ${token}`).send({ status: 'lost', draftMessage: 'Draf penawaran website terbaru.', notes: 'Catatan diperbarui' });
    expect(response.status).toBe(200);
    expect(updateOutreachLead).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'lost', draftMessage: 'Draf penawaran website terbaru.', notes: 'Catatan diperbarui', whatsappNumber: '6280000000000' }));
  });
  it('requires admin authorization to delete', async () => {
    expect((await request(app).delete('/1')).status).toBe(401);
    const user = createUserToken({ id: 2, username: 'fixture-user', role: 'user' });
    expect((await request(app).delete('/1').set('Authorization', `Bearer ${user}`)).status).toBe(401);
    expect(deleteOutreachLead).not.toHaveBeenCalled();
  });
  it('validates IDs and reports missing records', async () => {
    expect((await request(app).delete('/invalid').set('Authorization', `Bearer ${token}`)).status).toBe(400);
    vi.mocked(deleteOutreachLead).mockResolvedValue(false);
    expect((await request(app).delete('/1').set('Authorization', `Bearer ${token}`)).status).toBe(404);
  });
  it('deletes and records an audit entry', async () => {
    vi.mocked(deleteOutreachLead).mockResolvedValue(true);
    expect((await request(app).delete('/1').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    expect(deleteOutreachLead).toHaveBeenCalledWith(1);
    expect(createAdminAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'outreach.delete', entityId: 1 }));
  });
  it('accepts a number without consent and rejects sending states', async () => {
    vi.mocked(findOutreachLead).mockResolvedValue({ status: 'new', whatsapp_number: null, opt_in_at: null, opt_in_source: null } as never);
    vi.mocked(updateOutreachLead).mockResolvedValue(true);
    expect((await request(app).patch('/1').set('Authorization', `Bearer ${token}`).send({ status: 'reviewed', whatsappNumber: '6280000000000' })).status).toBe(200);
    expect(updateOutreachLead).toHaveBeenCalledWith(1, expect.objectContaining({ whatsappNumber: '6280000000000', optInAt: null }));
    expect((await request(app).patch('/1').set('Authorization', `Bearer ${token}`).send({ status: 'ready' })).status).toBe(400);
  });
  it('disables sending without a network call', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect((await request(app).post('/1/send').set('Authorization', `Bearer ${token}`)).status).toBe(410);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
