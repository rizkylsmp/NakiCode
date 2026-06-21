import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import crypto from 'node:crypto';
import { hashPassword, type UserRole } from '../auth';
import { config } from '../config';
import { pool } from '../db';

type UserRow = RowDataPacket & {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role?: UserRole | null;
  created_at?: string | null;
  updated_at?: string | null;
  email_verified_at?: string | null;
  email_verification_token?: string | null;
  email_verification_sent_at?: string | null;
  email_verification_otp_hash?: string | null;
  email_verification_otp_expires_at?: string | null;
  email_verification_otp_sent_at?: string | null;
  password_reset_otp_hash?: string | null;
  password_reset_otp_expires_at?: string | null;
  password_reset_otp_sent_at?: string | null;
};

export type UserAccount = {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string | null;
  updatedAt: string | null;
  emailVerifiedAt: string | null;
  emailVerificationToken: string | null;
  emailVerificationSentAt: string | null;
  emailVerificationOtpHash: string | null;
  emailVerificationOtpExpiresAt: string | null;
  emailVerificationOtpSentAt: string | null;
  passwordResetOtpHash: string | null;
  passwordResetOtpExpiresAt: string | null;
  passwordResetOtpSentAt: string | null;
};

export async function findUserById(id: number) {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT id, username, email, password_hash, role, created_at, updated_at, email_verified_at, email_verification_token, email_verification_sent_at, email_verification_otp_hash, email_verification_otp_expires_at, email_verification_otp_sent_at, password_reset_otp_hash, password_reset_otp_expires_at, password_reset_otp_sent_at
    FROM users
    WHERE id = ?
    LIMIT 1`,
    [id],
  );

  return rows[0] ? normalizeUserRow(rows[0]) : null;
}

export async function findUserByUsername(username: string) {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT id, username, email, password_hash, role, created_at, updated_at, email_verified_at, email_verification_token, email_verification_sent_at, email_verification_otp_hash, email_verification_otp_expires_at, email_verification_otp_sent_at, password_reset_otp_hash, password_reset_otp_expires_at, password_reset_otp_sent_at
    FROM users
    WHERE username = ?
    LIMIT 1`,
    [username],
  );

  return rows[0] ? normalizeUserRow(rows[0]) : null;
}

export async function findUserByEmail(email: string) {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT id, username, email, password_hash, role, created_at, updated_at, email_verified_at, email_verification_token, email_verification_sent_at, email_verification_otp_hash, email_verification_otp_expires_at, email_verification_otp_sent_at, password_reset_otp_hash, password_reset_otp_expires_at, password_reset_otp_sent_at
    FROM users
    WHERE email = ?
    LIMIT 1`,
    [email],
  );

  return rows[0] ? normalizeUserRow(rows[0]) : null;
}

export async function findUserByUsernameOrEmail(identifier: string) {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT id, username, email, password_hash, role, created_at, updated_at, email_verified_at, email_verification_token, email_verification_sent_at, email_verification_otp_hash, email_verification_otp_expires_at, email_verification_otp_sent_at, password_reset_otp_hash, password_reset_otp_expires_at, password_reset_otp_sent_at
    FROM users
    WHERE username = ? OR email = ?
    LIMIT 1`,
    [identifier, identifier],
  );

  return rows[0] ? normalizeUserRow(rows[0]) : null;
}

export async function findUserByVerificationToken(token: string) {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT id, username, email, password_hash, role, created_at, updated_at, email_verified_at, email_verification_token, email_verification_sent_at, email_verification_otp_hash, email_verification_otp_expires_at, email_verification_otp_sent_at, password_reset_otp_hash, password_reset_otp_expires_at, password_reset_otp_sent_at
    FROM users
    WHERE email_verification_token = ?
    LIMIT 1`,
    [token],
  );

  return rows[0] ? normalizeUserRow(rows[0]) : null;
}

export async function markUserEmailVerified(userId: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE users
    SET email_verified_at = CURRENT_TIMESTAMP,
      email_verification_token = NULL
    WHERE id = ?`,
    [userId],
  );

  return result.affectedRows > 0;
}

export async function setUserEmailVerificationOtp(
  userId: number,
  otp: string,
  expiresAt: Date,
) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE users
    SET email_verification_otp_hash = ?,
      email_verification_otp_expires_at = ?,
      email_verification_otp_sent_at = CURRENT_TIMESTAMP,
      email_verification_token = NULL,
      email_verification_sent_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [hashOtp(otp), expiresAt, userId],
  );

  return result.affectedRows > 0;
}

export function verifyUserEmailOtp(user: UserAccount, otp: string) {
  if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
    return false;
  }

  const expiresAt = new Date(user.emailVerificationOtpExpiresAt);

  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    return false;
  }

  return hashOtp(otp) === user.emailVerificationOtpHash;
}

export async function clearUserEmailVerificationOtp(userId: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE users
    SET email_verification_otp_hash = NULL,
      email_verification_otp_expires_at = NULL,
      email_verification_otp_sent_at = NULL
    WHERE id = ?`,
    [userId],
  );

  return result.affectedRows > 0;
}

export async function setUserPasswordResetOtp(
  userId: number,
  otp: string,
  expiresAt: Date,
) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE users
    SET password_reset_otp_hash = ?,
      password_reset_otp_expires_at = ?,
      password_reset_otp_sent_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [hashOtp(otp), expiresAt, userId],
  );

  return result.affectedRows > 0;
}

export function verifyUserPasswordResetOtp(user: UserAccount, otp: string) {
  if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
    return false;
  }

  const expiresAt = new Date(user.passwordResetOtpExpiresAt);

  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    return false;
  }

  return hashOtp(otp) === user.passwordResetOtpHash;
}

export async function clearUserPasswordResetOtp(userId: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE users
    SET password_reset_otp_hash = NULL,
      password_reset_otp_expires_at = NULL,
      password_reset_otp_sent_at = NULL
    WHERE id = ?`,
    [userId],
  );

  return result.affectedRows > 0;
}

export async function updateUserProfileName(
  userId: number,
  username: string,
) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE users
    SET username = ?
    WHERE id = ?`,
    [username, userId],
  );

  return result.affectedRows > 0;
}

export async function updateUserPassword(
  userId: number,
  password: string,
) {
  const hashed = await hashPassword(password);
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE users
    SET password_hash = ?
    WHERE id = ?`,
    [hashed, userId],
  );

  return result.affectedRows > 0;
}

export async function deleteUserAccount(userId: number) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query<ResultSetHeader>(
      `UPDATE orders
      SET user_id = NULL
      WHERE user_id = ?`,
      [userId],
    );
    await connection.query<ResultSetHeader>(
      `UPDATE template_ratings
      SET user_id = NULL
      WHERE user_id = ?`,
      [userId],
    );

    const [result] = await connection.query<ResultSetHeader>(
      `DELETE FROM users
      WHERE id = ?`,
      [userId],
    );

    await connection.commit();

    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createUserAccount(payload: {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}) {
  const emailVerificationToken = generateVerificationToken();
  const hashedPassword = await hashPassword(payload.password);
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (
      username,
      email,
      password_hash,
      role,
      email_verified_at,
      email_verification_token,
      email_verification_sent_at,
      email_verification_otp_hash,
      email_verification_otp_expires_at,
      email_verification_otp_sent_at
    )
    VALUES (?, ?, ?, ?, NULL, ?, CURRENT_TIMESTAMP, NULL, NULL, NULL)`,
    [
      payload.username,
      payload.email,
      hashedPassword,
      payload.role ?? 'user',
      emailVerificationToken,
    ],
  );

  return {
    id: result.insertId,
    username: payload.username,
    email: payload.email,
    role: payload.role ?? 'user',
    emailVerificationToken,
  };
}

export async function ensureDefaultAdminUser() {
  const username = config.auth.adminUsername.trim();
  const password = config.auth.adminPassword;
  const email =
    config.auth.adminEmail.trim().toLowerCase() ||
    `${username || 'admin'}@naki-code.local`;

  if (!username || !password) {
    return null;
  }

  const existingByUsername = await findUserByUsername(username);

  if (existingByUsername) {
    if (existingByUsername.role !== 'admin') {
      await pool.query<ResultSetHeader>(
        `UPDATE users
        SET role = 'admin',
          email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)
        WHERE id = ?`,
        [existingByUsername.id],
      );
    }

    return existingByUsername;
  }

  const existingByEmail = await findUserByEmail(email);

  if (existingByEmail) {
    if (existingByEmail.role !== 'admin') {
      await pool.query<ResultSetHeader>(
        `UPDATE users
        SET role = 'admin',
          email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)
        WHERE id = ?`,
        [existingByEmail.id],
      );
    }

    return existingByEmail;
  }

  const hashedPassword = await hashPassword(password);
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (
      username,
      email,
      password_hash,
      role,
      email_verified_at,
      email_verification_token,
      email_verification_sent_at,
      email_verification_otp_hash,
      email_verification_otp_expires_at,
      email_verification_otp_sent_at
    )
    VALUES (?, ?, ?, 'admin', CURRENT_TIMESTAMP, NULL, NULL, NULL, NULL, NULL)`,
    [username, email, hashedPassword],
  );

  return {
    id: result.insertId,
    username,
    email,
    role: 'admin' as const,
  };
}

function normalizeUserRow(row: UserRow): UserAccount {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role === 'admin' ? 'admin' : 'user',
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    emailVerifiedAt: row.email_verified_at ?? null,
    emailVerificationToken: row.email_verification_token ?? null,
    emailVerificationSentAt: row.email_verification_sent_at ?? null,
    emailVerificationOtpHash: row.email_verification_otp_hash ?? null,
    emailVerificationOtpExpiresAt: row.email_verification_otp_expires_at ?? null,
    emailVerificationOtpSentAt: row.email_verification_otp_sent_at ?? null,
    passwordResetOtpHash: row.password_reset_otp_hash ?? null,
    passwordResetOtpExpiresAt: row.password_reset_otp_expires_at ?? null,
    passwordResetOtpSentAt: row.password_reset_otp_sent_at ?? null,
  };
}

function generateVerificationToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function hashOtp(value: string) {
  return crypto.createHash('sha256').update(value.trim()).digest('hex');
}
