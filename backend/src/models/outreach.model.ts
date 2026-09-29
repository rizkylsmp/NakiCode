import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';

export const outreachStatuses = [
  'new', 'reviewed', 'ready', 'sending', 'sent', 'replied',
  'qualified', 'won', 'lost', 'failed', 'do_not_contact',
] as const;
export type OutreachStatus = (typeof outreachStatuses)[number];

export type OutreachLeadInput = {
  externalKey: string;
  businessName: string;
  category: string;
  city: string;
  sourceUrl: string;
  evidenceUrl: string;
  contactUrl: string;
  observation: string;
  opportunity: string;
  score: number;
  draftMessage: string;
  checkedAt?: string | null;
  notes?: string | null;
};

export type OutreachLead = RowDataPacket & {
  id: number;
  external_key: string;
  business_name: string;
  category: string;
  city: string;
  source_url: string;
  evidence_url: string;
  contact_url: string;
  observation: string;
  opportunity: string;
  score: number;
  draft_message: string;
  status: OutreachStatus;
  whatsapp_number: string | null;
  opt_in_at: Date | null;
  opt_in_source: string | null;
  sent_at: Date | null;
  last_error: string | null;
  checked_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function listOutreachLeads() {
  const [rows] = await pool.query<OutreachLead[]>(
    `SELECT * FROM outreach_leads ORDER BY
      CASE status WHEN 'ready' THEN 0 WHEN 'new' THEN 1 WHEN 'reviewed' THEN 2 ELSE 3 END,
      score DESC, created_at DESC LIMIT 200`,
  );
  return rows;
}

export async function listOutreachIdentities() {
  const [rows] = await pool.query<Array<RowDataPacket & { external_key: string; status: OutreachStatus }>>(
    'SELECT external_key, status FROM outreach_leads',
  );
  return rows;
}

export async function findOutreachLead(id: number) {
  const [rows] = await pool.query<OutreachLead[]>(
    'SELECT * FROM outreach_leads WHERE id = ? LIMIT 1', [id],
  );
  return rows[0] ?? null;
}

export async function insertOutreachLead(input: OutreachLeadInput) {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO outreach_leads
      (external_key, business_name, category, city, source_url, evidence_url,
       contact_url, observation, opportunity, score, draft_message, checked_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [input.externalKey, input.businessName, input.category, input.city,
      input.sourceUrl, input.evidenceUrl, input.contactUrl, input.observation,
      input.opportunity, input.score, input.draftMessage,
      input.checkedAt || null, input.notes || null],
  );
  return { id: result.insertId, created: result.affectedRows === 1 };
}

export async function updateOutreachLead(
  id: number,
  input: {
    status: OutreachStatus;
    draftMessage?: string;
    notes?: string;
    whatsappNumber?: string | null;
    optInAt?: string | null;
    optInSource?: string | null;
  },
) {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE outreach_leads SET status = ?,
      draft_message = COALESCE(?, draft_message),
      notes = COALESCE(?, notes),
      whatsapp_number = ?, opt_in_at = ?, opt_in_source = ?
     WHERE id = ?`,
    [input.status, input.draftMessage ?? null, input.notes ?? null,
      input.whatsappNumber || null, input.optInAt ? new Date(input.optInAt) : null,
      input.optInSource || null, id],
  );
  return result.affectedRows > 0;
}

export async function claimOutreachLead(id: number) {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE outreach_leads SET status = 'sending', last_error = NULL
     WHERE id = ? AND status = 'ready' AND sent_at IS NULL
       AND whatsapp_number IS NOT NULL AND opt_in_at IS NOT NULL
       AND opt_in_source IS NOT NULL`, [id],
  );
  return result.affectedRows === 1;
}

export async function finishOutreachSend(id: number, error?: string) {
  await pool.execute(
    `UPDATE outreach_leads SET status = ?, sent_at = IF(? IS NULL, NOW(), sent_at),
      last_error = ? WHERE id = ? AND status = 'sending'`,
    [error ? 'failed' : 'sent', error ?? null, error ?? null, id],
  );
}

export async function markOutreachReply(phoneNumber: string) {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE outreach_leads SET status = 'replied'
     WHERE REPLACE(REPLACE(whatsapp_number, '+', ''), ' ', '') = ?
       AND status = 'sent'`, [phoneNumber],
  );
  return result.affectedRows;
}
