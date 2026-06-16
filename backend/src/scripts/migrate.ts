#!/usr/bin/env node
/**
 * Database Migration System
 * 
 * Simple, pragmatic migration system for managing database schema changes.
 * 
 * Usage:
 *   npm run migrate        # Run pending migrations
 *   npm run migrate:status # Check migration status
 *   npm run migrate:create <name> # Create new migration file
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../db';
import { config } from '../config';

const MIGRATIONS_DIR = path.join(__dirname, '../../database/migrations');

interface Migration {
  id: number;
  name: string;
  appliedAt: Date;
}

interface MigrationFile {
  filename: string;
  name: string;
  up: string;
  down: string;
}

/**
 * Ensure migrations table exists
 */
async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(): Promise<Migration[]> {
  const [rows] = await pool.query<any[]>(
    'SELECT id, name, applied_at as appliedAt FROM migrations ORDER BY id ASC'
  );
  return rows;
}

/**
 * Get list of migration files
 */
async function getMigrationFiles(): Promise<MigrationFile[]> {
  try {
    const files = await readdir(MIGRATIONS_DIR);
    const migrationFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Alphabetical sort (timestamp-based naming ensures chronological order)

    const migrations: MigrationFile[] = [];

    for (const filename of migrationFiles) {
      const content = await readFile(path.join(MIGRATIONS_DIR, filename), 'utf-8');
      const { up, down } = parseMigrationFile(content);
      migrations.push({
        filename,
        name: filename.replace('.sql', ''),
        up,
        down,
      });
    }

    return migrations;
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Parse migration file into up and down sections
 */
function parseMigrationFile(content: string): { up: string; down: string } {
  const upMatch = content.match(/-- UP\s+([\s\S]*?)(?=-- DOWN|$)/i);
  const downMatch = content.match(/-- DOWN\s+([\s\S]*)/i);

  return {
    up: upMatch ? upMatch[1].trim() : '',
    down: downMatch ? downMatch[1].trim() : '',
  };
}

/**
 * Run pending migrations
 */
async function runMigrations() {
  console.log('🔄 Running database migrations...\n');

  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();

  const appliedNames = new Set(applied.map(m => m.name));
  const pending = files.filter(f => !appliedNames.has(f.name));

  if (pending.length === 0) {
    console.log('✅ No pending migrations. Database is up to date.\n');
    return;
  }

  console.log(`📋 Found ${pending.length} pending migration(s):\n`);

  for (const migration of pending) {
    try {
      console.log(`⏳ Running: ${migration.name}`);

      // Execute migration SQL
      await pool.query(migration.up);

      // Record migration
      await pool.query(
        'INSERT INTO migrations (name) VALUES (?)',
        [migration.name]
      );

      console.log(`✅ Applied: ${migration.name}\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed: ${migration.name}`);
      console.error(`   Error: ${message}\n`);
      throw error;
    }
  }

  console.log('✨ All migrations completed successfully!\n');
}

/**
 * Show migration status
 */
async function showStatus() {
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();

  console.log('📊 Migration Status\n');
  console.log(`Total migrations: ${files.length}`);
  console.log(`Applied: ${applied.length}`);
  console.log(`Pending: ${files.length - applied.length}\n`);

  if (files.length === 0) {
    console.log('No migration files found.\n');
    return;
  }

  const appliedNames = new Set(applied.map(m => m.name));

  console.log('Migrations:');
  for (const file of files) {
    const status = appliedNames.has(file.name) ? '✅' : '⏳';
    const appliedMigration = applied.find(m => m.name === file.name);
    const timestamp = appliedMigration
      ? ` (applied: ${appliedMigration.appliedAt.toISOString()})`
      : '';
    console.log(`  ${status} ${file.name}${timestamp}`);
  }

  console.log('');
}

/**
 * Create new migration file
 */
async function createMigration(name: string) {
  if (!name || name.trim().length === 0) {
    console.error('❌ Migration name is required\n');
    console.log('Usage: npm run migrate:create <name>\n');
    console.log('Example: npm run migrate:create add-users-table\n');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  const sanitizedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = `${timestamp}-${sanitizedName}.sql`;
  const filepath = path.join(MIGRATIONS_DIR, filename);

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

  console.log('✅ Created migration file:\n');
  console.log(`   ${filename}\n`);
  console.log(`   Location: ${filepath}\n`);
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  (async () => {
    try {
      if (command === 'status') {
        await showStatus();
      } else if (command === 'create') {
        await createMigration(args.slice(1).join(' '));
      } else {
        await runMigrations();
      }
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n❌ Migration failed: ${message}\n`);
      process.exit(1);
    }
  })();
}

export { runMigrations, showStatus, createMigration };
