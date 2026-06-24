import { readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { config } from "./config";
import { runMigrations } from "./migrations";

export const pool = mysql.createPool({
  ...config.mysql,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60_000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export async function pingDatabase() {
  const [rows] = await pool.query("SELECT 1 AS ok");
  return rows;
}

export async function initializeDatabase() {
  const { database, ...connectionConfig } = config.mysql;
  const connection = await mysql.createConnection(connectionConfig);

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${connection.escapeId(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.query(`USE ${connection.escapeId(database)}`);

    const schemaPath = path.resolve(__dirname, "../database/schema.sql");
    const schema = await readFile(schemaPath, "utf8");
    const statements = splitSqlStatements(schema).filter(
      (statement) =>
        !/^CREATE\s+DATABASE\b/i.test(statement) && !/^USE\b/i.test(statement),
    );

    for (const statement of statements) {
      await connection.query(statement);
    }

    await ensureColumn(connection, "orders", "user_id", "INT NULL AFTER id");
    await ensureColumn(
      connection,
      "orders",
      "payment_status",
      "VARCHAR(40) NOT NULL DEFAULT 'pending' AFTER status",
    );
    await ensureColumn(
      connection,
      "orders",
      "payment_method",
      "VARCHAR(80) NULL AFTER payment_status",
    );
    await ensureColumn(
      connection,
      "orders",
      "payment_reference",
      "VARCHAR(120) NULL AFTER payment_method",
    );
    await ensureColumn(
      connection,
      "orders",
      "payment_url",
      "VARCHAR(500) NULL AFTER payment_reference",
    );
    await ensureColumn(
      connection,
      "orders",
      "payment_amount",
      "INT NULL AFTER payment_url",
    );
    await ensureColumn(
      connection,
      "orders",
      "paid_at",
      "TIMESTAMP NULL AFTER payment_amount",
    );
    await ensureColumn(
      connection,
      "orders",
      "deleted_at",
      "TIMESTAMP NULL AFTER paid_at",
    );
    await ensureColumn(
      connection,
      "templates",
      "category_id",
      "INT NULL AFTER category",
    );
    await ensureColumn(
      connection,
      "templates",
      "is_featured",
      "BOOLEAN NOT NULL DEFAULT FALSE AFTER demo_url",
    );
    await ensureColumn(
      connection,
      "templates",
      "deleted_at",
      "TIMESTAMP NULL AFTER is_featured",
    );
    await ensureColumn(
      connection,
      "template_ratings",
      "user_id",
      "INT NULL AFTER id",
    );
    await ensureColumn(
      connection,
      "users",
      "role",
      "VARCHAR(40) NOT NULL DEFAULT 'user' AFTER password_hash",
    );
    await ensureColumn(
      connection,
      "users",
      "email_verified_at",
      "TIMESTAMP NULL AFTER role",
    );
    await ensureColumn(
      connection,
      "users",
      "email_verification_token",
      "VARCHAR(120) NULL AFTER email_verified_at",
    );
    await ensureColumn(
      connection,
      "users",
      "email_verification_sent_at",
      "TIMESTAMP NULL AFTER email_verification_token",
    );
    await ensureColumn(
      connection,
      "users",
      "email_verification_otp_hash",
      "VARCHAR(255) NULL AFTER email_verification_sent_at",
    );
    await ensureColumn(
      connection,
      "users",
      "email_verification_otp_expires_at",
      "TIMESTAMP NULL AFTER email_verification_otp_hash",
    );
    await ensureColumn(
      connection,
      "users",
      "email_verification_otp_sent_at",
      "TIMESTAMP NULL AFTER email_verification_otp_expires_at",
    );
    await ensureColumn(
      connection,
      "users",
      "password_reset_otp_hash",
      "VARCHAR(255) NULL AFTER email_verification_otp_sent_at",
    );
    await ensureColumn(
      connection,
      "users",
      "password_reset_otp_expires_at",
      "TIMESTAMP NULL AFTER password_reset_otp_hash",
    );
    await ensureColumn(
      connection,
      "users",
      "password_reset_otp_sent_at",
      "TIMESTAMP NULL AFTER password_reset_otp_expires_at",
    );
    await ensureColumn(
      connection,
      "projects",
      "category",
      "VARCHAR(80) NOT NULL DEFAULT 'Website' AFTER title",
    );
    await ensureColumn(
      connection,
      "projects",
      "result",
      "VARCHAR(160) NOT NULL DEFAULT 'Project selesai' AFTER description",
    );
    await ensureColumn(
      connection,
      "projects",
      "website_url",
      "VARCHAR(500) NOT NULL DEFAULT '#' AFTER result",
    );
    await ensureColumn(
      connection,
      "projects",
      "image_url",
      "VARCHAR(500) NULL AFTER website_url",
    );
    await ensureColumn(
      connection,
      "projects",
      "image_urls",
      "JSON NULL AFTER image_url",
    );
    await ensureColumn(
      connection,
      "projects",
      "cover_index",
      "INT NOT NULL DEFAULT 0 AFTER image_urls",
    );
    await ensureColumn(
      connection,
      "projects",
      "deleted_at",
      "TIMESTAMP NULL AFTER cover_index",
    );

    await runMigrations(connection);
  } finally {
    await connection.end();
  }
}

async function ensureColumn(
  connection: Connection,
  tableName: string,
  columnName: string,
  definition: string,
) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    LIMIT 1`,
    [tableName, columnName],
  );

  if (rows.length === 0) {
    await connection.query(
      `ALTER TABLE ${connection.escapeId(tableName)}
      ADD COLUMN ${connection.escapeId(columnName)} ${definition}`,
    );
  }
}

function splitSqlStatements(schema: string) {
  return schema
    .replace(/^\s*--.*$/gm, "")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}
