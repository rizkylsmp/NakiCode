#!/usr/bin/env node
/**
 * SQL File Migration CLI
 *
 * Manual migration runner for SQL files in backend/database/migrations.
 * Runtime startup migrations live in src/runtime-migrations.ts.
 *
 * Usage:
 *   npm run migrate:sql        # Run pending SQL file migrations
 *   npm run migrate:sql:status # Check SQL file migration status
 *   npm run migrate:sql:create <name> # Create a new SQL migration file
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../db';

const SQL_MIGRATIONS_DIR = path.join(__dirname, '../../database/migrations');

type SqlMigrationRecord = RowDataPacket & {
  id: number;
  name: string;
  appliedAt: Date;
};

type SqlMigrationFile = {
  filename: string;
  name: string;
  up: string;
  down: string;
};

type NodeError = Error & {
  code?: string;
};

async function ensureSqlMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function getAppliedSqlMigrations(): Promise<SqlMigrationRecord[]> {
  const [rows] = await pool.query<SqlMigrationRecord[]>(
    'SELECT id, name, applied_at as appliedAt FROM migrations ORDER BY id ASC',
  );
  return rows;
}

async function getSqlMigrationFiles(): Promise<SqlMigrationFile[]> {
  try {
    const files = await readdir(SQL_MIGRATIONS_DIR);
    const migrationFiles = files
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const migrations: SqlMigrationFile[] = [];

    for (const filename of migrationFiles) {
      const content = await readFile(
        path.join(SQL_MIGRATIONS_DIR, filename),
        'utf-8',
      );
      const { up, down } = parseSqlMigrationFile(content);
      migrations.push({
        filename,
        name: filename.replace('.sql', ''),
        up,
        down,
      });
    }

    return migrations;
  } catch (error) {
    if ((error as NodeError).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function parseSqlMigrationFile(content: string): { up: string; down: string } {
  const upMatch = content.match(/-- UP\s+([\s\S]*?)(?=-- DOWN|$)/i);
  const downMatch = content.match(/-- DOWN\s+([\s\S]*)/i);

  return {
    up: upMatch ? upMatch[1].trim() : '',
    down: downMatch ? downMatch[1].trim() : '',
  };
}

async function runSqlFileMigrations() {
  console.log('Running SQL file migrations...\n');

  await ensureSqlMigrationsTable();

  const applied = await getAppliedSqlMigrations();
  const files = await getSqlMigrationFiles();

  const appliedNames = new Set(applied.map((migration) => migration.name));
  const pending = files.filter((file) => !appliedNames.has(file.name));

  if (pending.length === 0) {
    console.log('No pending SQL file migrations. Database is up to date.\n');
    return;
  }

  console.log(`Found ${pending.length} pending SQL file migration(s):\n`);

  for (const migration of pending) {
    try {
      console.log(`Running: ${migration.name}`);

      await pool.query(migration.up);
      await pool.query('INSERT INTO migrations (name) VALUES (?)', [
        migration.name,
      ]);

      console.log(`Applied: ${migration.name}\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed: ${migration.name}`);
      console.error(`   Error: ${message}\n`);
      throw error;
    }
  }

  console.log('All SQL file migrations completed successfully.\n');
}

async function showSqlMigrationStatus() {
  await ensureSqlMigrationsTable();

  const applied = await getAppliedSqlMigrations();
  const files = await getSqlMigrationFiles();

  console.log('SQL File Migration Status\n');
  console.log(`Total SQL file migrations: ${files.length}`);
  console.log(`Applied: ${applied.length}`);
  console.log(`Pending: ${files.length - applied.length}\n`);

  if (files.length === 0) {
    console.log('No SQL migration files found.\n');
    return;
  }

  const appliedNames = new Set(applied.map((migration) => migration.name));

  console.log('Migrations:');
  for (const file of files) {
    const status = appliedNames.has(file.name) ? 'applied' : 'pending';
    const appliedMigration = applied.find(
      (migration) => migration.name === file.name,
    );
    const timestamp = appliedMigration
      ? ` (applied: ${appliedMigration.appliedAt.toISOString()})`
      : '';
    console.log(`  ${status} ${file.name}${timestamp}`);
  }

  console.log('');
}

async function createSqlMigration(name: string) {
  if (!name || name.trim().length === 0) {
    console.error('Migration name is required\n');
    console.log('Usage: npm run migrate:sql:create <name>\n');
    console.log('Example: npm run migrate:sql:create add-users-table\n');
    return;
  }

  await mkdir(SQL_MIGRATIONS_DIR, { recursive: true });

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
    .replace('T', '-');
  const sanitizedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = `${timestamp}-${sanitizedName}.sql`;
  const filepath = path.join(SQL_MIGRATIONS_DIR, filename);

  const template = `-- Migration: ${sanitizedName}
-- Created: ${new Date().toISOString()}

-- UP
-- Write your migration SQL here
-- Example:
-- CREATE TABLE example (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   name VARCHAR(255) NOT NULL
-- );


-- DOWN
-- Write rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS example;

`;

  await writeFile(filepath, template, 'utf-8');

  console.log('Created SQL migration file:\n');
  console.log(`   ${filename}\n`);
  console.log(`   Location: ${filepath}\n`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  (async () => {
    try {
      if (command === 'status') {
        await showSqlMigrationStatus();
      } else if (command === 'create') {
        await createSqlMigration(args.slice(1).join(' '));
      } else {
        await runSqlFileMigrations();
      }
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\nSQL file migration failed: ${message}\n`);
      process.exit(1);
    }
  })();
}

export {
  createSqlMigration,
  runSqlFileMigrations,
  showSqlMigrationStatus,
};
