import express from 'express';
import { z } from 'zod';
import { requireAdmin, type UserTokenPayload } from '../auth';
import { config } from '../config';
import { createAdminAuditLog } from '../models/audit-log.model';
import {
  findOutreachLead,
  insertOutreachLead, listOutreachLeads, outreachStatuses, updateOutreachLead,
} from '../models/outreach.model';
import { sendOutreachTemplate } from '../outreach.service';

export const outreachRouter = express.Router();
outreachRouter.use(requireAdmin);
async function audit(req: express.Request, action: string, id: number) {
  try {
    await createAdminAuditLog({ admin: req.res?.locals.admin as UserTokenPayload | undefined, action, entityType: 'outreach_lead', entityId: id });
  } catch (error) { console.error('Gagal mencatat audit outreach:', error); }
}

const url = z.string().url().max(700).refine((value) => /^https?:\/\//i.test(value));
const leadSchema = z.object({
  externalKey: z.string().trim().min(2).max(255),
  businessName: z.string().trim().min(2).max(180),
  category: z.string().trim().max(120).default(''),
  city: z.string().trim().max(120).default(''),
  sourceUrl: url,
  evidenceUrl: url,
  contactUrl: url,
  observation: z.string().trim().min(10).max(3000),
  opportunity: z.string().trim().min(10).max(3000),
  score: z.number().int().min(0).max(5),
  draftMessage: z.string().trim().min(10).max(3000),
  checkedAt: z.iso.date().optional().nullable(),
  notes: z.string().max(3000).optional().nullable(),
});
const updateSchema = z.object({
  status: z.enum(outreachStatuses),
  draftMessage: z.string().trim().min(10).max(3000).optional(),
  notes: z.string().max(3000).optional(),
  whatsappNumber: z.string().regex(/^\+?[1-9]\d{7,14}$/).optional().nullable(),
  optInAt: z.iso.datetime({ offset: true }).optional().nullable(),
  optInSource: url.optional().nullable(),
});

outreachRouter.get('/', async (_req, res) => {
  try { res.json({ leads: await listOutreachLeads(), whatsappConfigured: Boolean(config.outreach.accessToken && config.outreach.phoneNumberId && config.outreach.template) }); }
  catch { res.status(500).json({ message: 'Gagal mengambil prospek.' }); }
});

outreachRouter.post('/', async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Data prospek tidak valid.' });
  try {
    const result = await insertOutreachLead(parsed.data);
    if (result.created) await audit(req, 'outreach.create', result.id);
    return res.status(result.created ? 201 : 200).json({ ...result, lead: await findOutreachLead(result.id) });
  } catch { return res.status(500).json({ message: 'Gagal menyimpan prospek.' }); }
});

outreachRouter.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const parsed = updateSchema.safeParse(req.body);
  if (!Number.isSafeInteger(id) || id < 1 || !parsed.success) return res.status(400).json({ message: 'Perubahan tidak valid.' });
  try {
    const current = await findOutreachLead(id);
    if (!current) return res.status(404).json({ message: 'Prospek tidak ditemukan.' });
    if (current.status === 'do_not_contact' && parsed.data.status !== 'do_not_contact') return res.status(409).json({ message: 'Prospek ini menolak kontak.' });
    const optedOut = parsed.data.status === 'do_not_contact';
    const whatsappNumber = optedOut ? null : parsed.data.whatsappNumber !== undefined ? parsed.data.whatsappNumber : current.whatsapp_number;
    const optInAt = optedOut ? null : parsed.data.optInAt !== undefined ? parsed.data.optInAt : current.opt_in_at?.toISOString() ?? null;
    const optInSource = optedOut ? null : parsed.data.optInSource !== undefined ? parsed.data.optInSource : current.opt_in_source;
    if (parsed.data.status === 'ready' && (!whatsappNumber || !optInAt || !optInSource)) return res.status(400).json({ message: 'Nomor dan bukti opt-in WhatsApp wajib diisi sebelum siap kirim.' });
    if (parsed.data.status === 'ready' && current.sent_at) return res.status(409).json({ message: 'Kontak ini sudah pernah dikirim template. Jangan antrekan ulang.' });
    await updateOutreachLead(id, { ...parsed.data, whatsappNumber, optInAt, optInSource });
    await audit(req, 'outreach.update', id);
    return res.json({ lead: await findOutreachLead(id) });
  } catch { return res.status(500).json({ message: 'Gagal memperbarui prospek.' }); }
});

outreachRouter.post('/:id/send', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: 'ID tidak valid.' });
  try {
    const lead = await sendOutreachTemplate(id);
    await audit(req, 'outreach.send_template', id);
    return res.json({ lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pengiriman gagal.';
    return res.status(message.includes('belum dikonfigurasi') ? 503 : message.includes('opt-in') ? 409 : 502).json({ message });
  }
});
