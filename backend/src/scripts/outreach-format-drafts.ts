import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { closeDatabasePool, pool } from '../db';
import { formatOutreachDraft } from '../utils/outreach-draft';

async function main() {
  try {
    const [rows] = await pool.query<Array<RowDataPacket & { id: number; draft_message: string }>>(
      "SELECT id, draft_message FROM outreach_leads WHERE status <> 'deleted'",
    );
    let changed = 0;
    let skipped = 0;
    for (const row of rows) {
      const formatted = formatOutreachDraft(row.draft_message);
      if (formatted === row.draft_message) continue;
      if (formatted.replace(/\s/g, '') !== row.draft_message.replace(/\s/g, '')) throw new Error('Format tidak boleh mengubah isi pesan.');
      const [result] = await pool.execute<ResultSetHeader>(
        "UPDATE outreach_leads SET draft_message = ? WHERE id = ? AND BINARY draft_message = BINARY ? AND status <> 'deleted'",
        [formatted, row.id, row.draft_message],
      );
      if (result.affectedRows) changed += 1;
      else skipped += 1;
    }
    const [verified] = await pool.query<Array<RowDataPacket & { draft_message: string }>>(
      "SELECT draft_message FROM outreach_leads WHERE status <> 'deleted'",
    );
    const remaining = verified.filter(row => formatOutreachDraft(row.draft_message) !== row.draft_message).length;
    console.log(JSON.stringify({ checked: rows.length, changed, skippedConcurrentEdits: skipped, remaining }));
    if (remaining) process.exitCode = 1;
  } finally { await closeDatabasePool(); }
}
void main().catch(error => { console.error(error.message); process.exitCode = 1; });
