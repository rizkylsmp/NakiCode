import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { closeDatabasePool, pingDatabase, pool } from '../db';
import { insertOutreachLead, listOutreachIdentities, listOutreachLeads } from '../models/outreach.model';
import { sendOutreachTemplate } from '../outreach.service';

function parseCsv(source: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted && char === '"' && source[index + 1] === '"') { field += '"'; index += 1; }
    else if (char === '"') { quoted = !quoted; }
    else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field); field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else { field += char; }
  }
  if (quoted) throw new Error('CSV memiliki kutipan yang tidak tertutup.');
  if (field || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  if (!header) return [];
  return rows.map((values) => {
    if (values.length !== header.length) throw new Error('Jumlah kolom CSV tidak konsisten.');
    return Object.fromEntries(header.map((key, index) => [key.replace(/^\uFEFF/, ''), values[index]]));
  });
}

async function sync() {
  const filePath = path.resolve(process.cwd(), '../../MARKETING/CLIENT_OUTREACH/LEADS.csv');
  const rows = parseCsv(await readFile(filePath, 'utf8'));
  let created = 0;
  for (const row of rows) {
    if (!row.id || !row.business_name || !row.source_url || !row.evidence_url || !row.contact_url || !row.observation || !row.opportunity || !row.draft_message) continue;
    const result = await insertOutreachLead({
      externalKey: row.id,
      businessName: row.business_name,
      category: row.category || '',
      city: row.city || '',
      sourceUrl: row.source_url,
      evidenceUrl: row.evidence_url,
      contactUrl: row.contact_url,
      observation: row.observation,
      opportunity: row.opportunity,
      score: Math.max(0, Math.min(5, Number(row.score) || 0)),
      draftMessage: row.draft_message,
      checkedAt: row.checked_at || null,
      notes: row.notes || null,
    });
    if (result.created) created += 1;
  }
  console.log(`Sinkronisasi selesai: ${created} prospek baru dari ${rows.length} baris.`);
}

async function dispatch() {
  const ready = (await listOutreachLeads()).filter((lead) => lead.status === 'ready').slice(0, 5);
  let sent = 0;
  for (const lead of ready) {
    try { await sendOutreachTemplate(lead.id); sent += 1; }
    catch (error) { console.error(`Prospek ${lead.id}: ${error instanceof Error ? error.message : 'gagal'}`); }
  }
  console.log(`Pengiriman selesai: ${sent}/${ready.length} kontak opt-in.`);
}

async function migrate() {
  const schemaPath = path.resolve(process.cwd(), 'database/schema.sql');
  const schema = await readFile(schemaPath, 'utf8');
  const statement = schema.match(/CREATE TABLE IF NOT EXISTS outreach_leads\s*\([\s\S]*?\);/i)?.[0];
  if (!statement) throw new Error('Definisi tabel outreach_leads tidak ditemukan.');
  await pool.query(statement);
  console.log('Tabel outreach_leads siap.');
}

async function main() {
  const action = process.argv[2];
  if (action === 'dry-run') {
    const filePath = path.resolve(process.cwd(), '../../MARKETING/CLIENT_OUTREACH/LEADS.csv');
    const rows = parseCsv(await readFile(filePath, 'utf8'));
    console.log(`CSV valid: ${rows.length} baris.`);
    await closeDatabasePool();
    return;
  }
  if (action !== 'migrate' && action !== 'sync' && action !== 'dispatch' && action !== 'status') throw new Error('Pilih migrate, sync, dispatch, status, atau dry-run.');
  await pingDatabase();
  try {
    if (action === 'migrate') await migrate();
    else if (action === 'sync') await sync();
    else if (action === 'dispatch') await dispatch();
    else console.log(JSON.stringify(await listOutreachIdentities()));
  }
  finally { await closeDatabasePool(); }
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
