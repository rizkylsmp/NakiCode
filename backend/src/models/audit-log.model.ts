import type { ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import type { UserTokenPayload } from '../auth';

export async function createAdminAuditLog(payload: {
  admin: UserTokenPayload | null | undefined;
  action: string;
  entityType: string;
  entityId?: number | null;
  metadata?: Record<string, unknown>;
}) {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO admin_audit_logs (
      admin_user_id,
      admin_username,
      action,
      entity_type,
      entity_id,
      metadata
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      payload.admin?.userId ?? null,
      payload.admin?.sub ?? 'unknown-admin',
      payload.action,
      payload.entityType,
      payload.entityId ?? null,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ],
  );

  return result.insertId;
}
