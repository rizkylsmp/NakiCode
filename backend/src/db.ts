import { readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { config } from "./config";
import { runRuntimeMigrations } from "./runtime-migrations";

const isLocalRuntime = config.sentry.environment !== "production";

export const pool = mysql.createPool({
  ...config.mysql,
  waitForConnections: true,
  connectionLimit: isLocalRuntime ? 3 : 10,
  maxIdle: isLocalRuntime ? 1 : 10,
  idleTimeout: isLocalRuntime ? 10_000 : 60_000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

let poolClosePromise: Promise<void> | null = null;

export function closeDatabasePool() {
  poolClosePromise ??= pool.end();
  return poolClosePromise;
}

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
    await normalizeLegacyDesignSchema(connection);

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
      "payment_failure_code",
      "VARCHAR(80) NULL AFTER payment_amount",
    );
    await ensureColumn(
      connection,
      "orders",
      "payment_failure_reason",
      "VARCHAR(255) NULL AFTER payment_failure_code",
    );
    await ensureColumn(
      connection,
      "orders",
      "payment_last_webhook_status",
      "VARCHAR(80) NULL AFTER payment_failure_reason",
    );
    await ensureColumn(
      connection,
      "orders",
      "payment_last_webhook_at",
      "TIMESTAMP NULL AFTER payment_last_webhook_status",
    );
    await ensureColumn(
      connection,
      "orders",
      "paid_at",
      "TIMESTAMP NULL AFTER payment_last_webhook_at",
    );
    await ensureColumn(
      connection,
      "orders",
      "deleted_at",
      "TIMESTAMP NULL AFTER paid_at",
    );
    await ensureColumn(
      connection,
      "designs",
      "category_id",
      "INT NULL AFTER category",
    );
    await ensureColumn(
      connection,
      "designs",
      "is_featured",
      "BOOLEAN NOT NULL DEFAULT FALSE AFTER demo_url",
    );
    await ensureColumn(
      connection,
      "designs",
      "deleted_at",
      "TIMESTAMP NULL AFTER is_featured",
    );
    await ensureColumn(
      connection,
      "design_ratings",
      "user_id",
      "INT NULL AFTER id",
    );
    await ensureColumn(
      connection,
      "users",
      "google_sub",
      "VARCHAR(255) NULL UNIQUE AFTER email",
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

    await runRuntimeMigrations(connection);
  } finally {
    await connection.end();
  }
}

async function normalizeLegacyDesignSchema(connection: Connection) {
  const tableRenames = [
    ["template_categories", "categories"],
    ["templates", "designs"],
    ["template_ratings", "design_ratings"],
    ["user_template_favorites", "user_design_favorites"],
    ["template_bundles", "design_bundles"],
    ["template_bundle_items", "design_bundle_items"],
  ] as const;

  await connection.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const [legacyName, currentName] of tableRenames) {
    const legacyExists = await databaseTableExists(connection, legacyName);
    const currentExists = await databaseTableExists(connection, currentName);

    if (legacyExists && currentExists) {
      const legacyRows = await databaseTableRowCount(connection, legacyName);
      const currentRows = await databaseTableRowCount(connection, currentName);

      if (currentRows === 0) {
        await connection.query(
          `DROP TABLE ${connection.escapeId(currentName)}`,
        );
        await connection.query(
          `RENAME TABLE ${connection.escapeId(legacyName)} TO ${connection.escapeId(currentName)}`,
        );
      } else if (legacyRows === 0) {
        await connection.query(`DROP TABLE ${connection.escapeId(legacyName)}`);
      } else {
        throw new Error(
          `Legacy table ${legacyName} and current table ${currentName} both contain data`,
        );
      }
    } else if (legacyExists && !currentExists) {
      await connection.query(
        `RENAME TABLE ${connection.escapeId(legacyName)} TO ${connection.escapeId(currentName)}`,
      );
    }
  }
  await connection.query("SET FOREIGN_KEY_CHECKS = 1");

  const columnRenames = [
    ["orders", "template_id", "design_id"],
    ["orders", "template_slug", "design_slug"],
    ["orders", "template_title", "design_title"],
    ["design_ratings", "template_id", "design_id"],
    ["design_ratings", "template_slug", "design_slug"],
    ["user_design_favorites", "template_id", "design_id"],
    ["testimonials", "template_id", "design_id"],
    ["design_bundle_items", "template_id", "design_id"],
  ] as const;

  for (const [tableName, legacyName, currentName] of columnRenames) {
    if (
      (await databaseColumnExists(connection, tableName, legacyName)) &&
      !(await databaseColumnExists(connection, tableName, currentName))
    ) {
      await connection.query(
        `ALTER TABLE ${connection.escapeId(tableName)} RENAME COLUMN ${connection.escapeId(legacyName)} TO ${connection.escapeId(currentName)}`,
      );
    }
  }

  if (await databaseTableExists(connection, "designs")) {
    if (
      await databaseForeignKeyExists(
        connection,
        "designs",
        "fk_templates_category_id",
      )
    ) {
      await connection.query(
        `ALTER TABLE ${connection.escapeId("designs")} DROP FOREIGN KEY ${connection.escapeId("fk_templates_category_id")}`,
      );
    }
    if (
      !(await databaseForeignKeyExists(
        connection,
        "designs",
        "fk_designs_category_id",
      ))
    ) {
      await connection.query(
        `ALTER TABLE ${connection.escapeId("designs")}
        ADD CONSTRAINT ${connection.escapeId("fk_designs_category_id")}
        FOREIGN KEY (${connection.escapeId("category_id")}) REFERENCES ${connection.escapeId("categories")} (${connection.escapeId("id")})
        ON DELETE RESTRICT ON UPDATE RESTRICT`,
      );
    }
  }

  const indexRenames = [
    ["designs", "idx_templates_category_id", "idx_designs_category_id"],
    ["user_design_favorites", "user_template_unique", "user_design_unique"],
    ["design_bundle_items", "bundle_template_unique", "bundle_design_unique"],
  ] as const;
  for (const [tableName, legacyName, currentName] of indexRenames) {
    if (
      (await databaseIndexExists(connection, tableName, legacyName)) &&
      !(await databaseIndexExists(connection, tableName, currentName))
    ) {
      await connection.query(
        `ALTER TABLE ${connection.escapeId(tableName)} RENAME INDEX ${connection.escapeId(legacyName)} TO ${connection.escapeId(currentName)}`,
      );
    }
  }

  await connection.query("DROP TABLE IF EXISTS affiliate_referrals");
  await connection.query("DROP TABLE IF EXISTS admins");
}

async function databaseTableExists(connection: Connection, tableName: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [tableName],
  );
  return rows.length > 0;
}

async function databaseTableRowCount(
  connection: Connection,
  tableName: string,
) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM ${connection.escapeId(tableName)}`,
  );
  return Number(rows[0]?.total ?? 0);
}

async function databaseColumnExists(
  connection: Connection,
  tableName: string,
  columnName: string,
) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [tableName, columnName],
  );
  return rows.length > 0;
}

async function databaseIndexExists(
  connection: Connection,
  tableName: string,
  indexName: string,
) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [tableName, indexName],
  );
  return rows.length > 0;
}

async function databaseForeignKeyExists(
  connection: Connection,
  tableName: string,
  constraintName: string,
) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY' LIMIT 1`,
    [tableName, constraintName],
  );
  return rows.length > 0;
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
