import type { RowDataPacket } from "mysql2";
import { initializeDatabase, pool, closeDatabasePool } from "../db";
import { deliverOrderEmails } from "../order-email.service";

async function main() {
  try {
    await initializeDatabase();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT order_id FROM order_email_deliveries
     WHERE status IN ('pending', 'sending')
       AND (locked_at IS NULL OR locked_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE))
     ORDER BY order_id LIMIT 50`,
    );
    let delivered = 0;
    for (const row of rows) {
      try {
        await deliverOrderEmails(Number(row.order_id));
        delivered++;
      } catch {
        console.error(
          `Pengiriman email order #${row.order_id} gagal; tetap tersimpan untuk retry.`,
        );
      }
    }
    console.log(`${delivered}/${rows.length} order diproses.`);
    if (delivered < rows.length) process.exitCode = 1;
  } finally {
    await closeDatabasePool();
  }
}
void main().catch(() => {
  console.error("Gagal menjalankan retry email order.");
  process.exitCode = 1;
});
