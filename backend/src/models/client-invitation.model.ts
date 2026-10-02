import crypto from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { pool } from "../db";
import { hashPassword, type UserTokenPayload } from "../auth";
import { createOrder, normalizeOrderPayload } from "./order.model";

export class ClientInvitationError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function invitationTokenHash(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new ClientInvitationError(400, "Tautan undangan tidak valid.");
  return crypto.createHash("sha256").update(token).digest("hex");
}
type AccountRow = RowDataPacket & {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
};
type InvitationRow = RowDataPacket & {
  id: number;
  order_id: number;
  email: string;
  customer_name: string;
  expires_at: Date;
  used_at: Date | null;
  user_id: number | null;
  deleted_at: Date | null;
  design_title: string;
};
async function findAccount(
  connection: Pick<PoolConnection, "query">,
  email: string,
) {
  const [rows] = await connection.query<AccountRow[]>(
    "SELECT id, username, email, role FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  return rows[0] ?? null;
}
async function findInvitation(
  connection: Pick<PoolConnection, "query">,
  token: string,
  lock = false,
) {
  const [rows] = await connection.query<InvitationRow[]>(
    `SELECT i.*, o.user_id, o.deleted_at, o.design_title
    FROM order_client_invitations i JOIN orders o ON o.id = i.order_id WHERE i.token_hash = ? LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [invitationTokenHash(token)],
  );
  const invitation = rows[0];
  if (
    !invitation ||
    invitation.deleted_at ||
    invitation.used_at ||
    invitation.user_id !== null
  )
    throw new ClientInvitationError(
      410,
      "Undangan tidak tersedia atau sudah digunakan.",
    );
  if (new Date(invitation.expires_at).getTime() <= Date.now())
    throw new ClientInvitationError(
      410,
      "Undangan kedaluwarsa. Hubungi Naki Code untuk meminta tautan baru.",
    );
  return invitation;
}

export async function createClientOrder(input: {
  email: string;
  customerName: string;
  customerContact: string;
  projectTitle: string;
  message: string;
  budgetRange: string;
  niche?: string;
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const account = await findAccount(connection, input.email);
    if (account?.role === "admin")
      throw new ClientInvitationError(
        400,
        "Gunakan email akun klien, bukan akun admin.",
      );
    const payload = normalizeOrderPayload(
      {
        ...input,
        templateTitle: input.projectTitle,
        templateSlug: "custom-project",
        orderType: "custom_project",
      },
      account?.id ?? 0,
    );
    payload.userId = account?.id ?? null;
    const order = await createOrder(payload, connection);
    let token: string | null = null;
    let expiresAt: string | null = null;
    if (!account) {
      token = crypto.randomBytes(32).toString("base64url");
      const expires = new Date(Date.now() + 72 * 60 * 60 * 1000);
      expiresAt = expires.toISOString();
      await connection.query(
        "INSERT INTO order_client_invitations (order_id, email, customer_name, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)",
        [
          order.id,
          input.email,
          input.customerName,
          invitationTokenHash(token),
          expires,
        ],
      );
    }
    await connection.commit();
    return { order, token, expiresAt, existingAccount: Boolean(account) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function inspectClientInvitation(token: string) {
  const invitation = await findInvitation(pool, token);
  const account = await findAccount(pool, invitation.email);
  if (account?.role === "admin")
    throw new ClientInvitationError(
      409,
      "Email undangan tidak dapat digunakan sebagai akun klien.",
    );
  const [local, domain] = invitation.email.split("@");
  return {
    customerName: invitation.customer_name,
    emailHint: `${local.slice(0, 2)}***@${domain}`,
    projectTitle: invitation.design_title,
    expiresAt: new Date(invitation.expires_at).toISOString(),
    existingAccount: Boolean(account),
  };
}

export async function renewClientInvitation(orderId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<InvitationRow[]>(
      "SELECT i.*, o.user_id, o.deleted_at, o.design_title FROM order_client_invitations i JOIN orders o ON o.id = i.order_id WHERE i.order_id = ? LIMIT 1 FOR UPDATE",
      [orderId],
    );
    const row = rows[0];
    if (!row || row.used_at || row.deleted_at || row.user_id !== null)
      throw new ClientInvitationError(
        409,
        "Pesanan ini tidak memiliki undangan yang bisa diperbarui.",
      );
    const token = crypto.randomBytes(32).toString("base64url");
    const expires = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await connection.query(
      "UPDATE order_client_invitations SET token_hash = ?, expires_at = ? WHERE id = ?",
      [invitationTokenHash(token), expires, row.id],
    );
    await connection.commit();
    return { token, expiresAt: expires.toISOString() };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function claimClientInvitation(
  token: string,
  password: string | undefined,
  session: UserTokenPayload | null,
) {
  // Password hashing must not hold the database transaction open.
  const passwordHash = password ? await hashPassword(password) : null;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const invitation = await findInvitation(connection, token, true);
    let account = await findAccount(connection, invitation.email);
    if (account) {
      if (
        account.role !== "user" ||
        session?.role !== "user" ||
        session.userId !== account.id
      )
        throw new ClientInvitationError(
          409,
          "Email ini sudah memiliki akun. Login ke akun tersebut untuk menerima pesanan.",
        );
    } else {
      if (!passwordHash)
        throw new ClientInvitationError(
          400,
          "Password wajib diisi untuk membuat akun.",
        );
      const name =
        invitation.customer_name
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .replace(/_+/g, "_")
          .slice(0, 50) || "client";
      const username = `${name}_${crypto.randomBytes(8).toString("hex")}`;
      const [result] = await connection.query<ResultSetHeader>(
        "INSERT INTO users (username, email, password_hash, role, email_verified_at) VALUES (?, ?, ?, 'user', CURRENT_TIMESTAMP)",
        [username, invitation.email, passwordHash],
      );
      account = {
        id: result.insertId,
        username,
        email: invitation.email,
        role: "user",
      } as AccountRow;
    }
    const [bound] = await connection.query<ResultSetHeader>(
      "UPDATE orders SET user_id = ? WHERE id = ? AND user_id IS NULL AND deleted_at IS NULL",
      [account.id, invitation.order_id],
    );
    if (bound.affectedRows !== 1)
      throw new ClientInvitationError(
        409,
        "Pesanan sudah ditautkan ke akun lain.",
      );
    await connection.query(
      "UPDATE order_client_invitations SET used_at = CURRENT_TIMESTAMP WHERE id = ?",
      [invitation.id],
    );
    await connection.commit();
    return {
      orderId: invitation.order_id,
      user: { id: account.id, username: account.username, role: account.role },
    };
  } catch (error) {
    await connection.rollback();
    if ((error as { code?: string }).code === "ER_DUP_ENTRY")
      throw new ClientInvitationError(
        409,
        "Email ini sudah memiliki akun. Login terlebih dahulu.",
      );
    throw error;
  } finally {
    connection.release();
  }
}
