#!/usr/bin/env node
/**
 * Database Backup Script
 * 
 * Creates compressed MySQL backups with timestamp naming.
 * Automatically cleans up old backups based on retention policy.
 * 
 * Usage:
 *   npm run backup:db
 *   npm run backup:db -- --retention 7  (keep 7 days)
 */

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { gzipSync } from 'zlib';
import mysql, { type RowDataPacket } from 'mysql2/promise';
import { config } from '../config';

// Configuration
const BACKUP_DIR = path.join(__dirname, '../../backups');
const DEFAULT_RETENTION_DAYS = 7;
const COMPRESSION_ENABLED = true;

interface BackupOptions {
  retentionDays?: number;
  compress?: boolean;
  verbose?: boolean;
}

/**
 * Main backup function
 */
async function backupDatabase(options: BackupOptions = {}) {
  const {
    retentionDays = DEFAULT_RETENTION_DAYS,
    compress = COMPRESSION_ENABLED,
    verbose = true,
  } = options;

  try {
    log('🔄 Starting database backup...', verbose);

    // Ensure backup directory exists
    ensureBackupDirectory();

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `naki-code-backup-${timestamp}.sql`;
    const filename = compress ? `${baseFilename}.gz` : baseFilename;
    const backupPath = path.join(BACKUP_DIR, filename);

    // Create backup
    await createBackup(backupPath, compress, verbose);

    // Verify backup was created
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file was not created');
    }

    const sizeInMB = (fs.statSync(backupPath).size / 1024 / 1024).toFixed(2);
    log(`✅ Backup created successfully: ${filename} (${sizeInMB} MB)`, verbose);

    // Cleanup old backups
    await cleanupOldBackups(retentionDays, verbose);

    log('✨ Backup process completed successfully!', verbose);
    
    return backupPath;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Backup failed:', message);
    throw error;
  }
}

/**
 * Create MySQL backup using mysqldump
 */
async function createBackup(backupPath: string, compress: boolean, verbose: boolean) {
  log('📦 Creating database dump...', verbose);

  // Get database connection details from config
  const host = config.mysql.host;
  const port = config.mysql.port || 3306;
  const user = config.mysql.user;
  const password = config.mysql.password;
  const database = config.mysql.database;

  if (!user || !password || !database) {
    throw new Error('Invalid database configuration');
  }

  const mysqldumpBinary = findMysqldumpBinary();
  const mysqldumpArgs = [
    `--host=${host}`,
    `--port=${port}`,
    `--user=${user}`,
    '--single-transaction',
    '--routines',
    '--triggers',
    '--events',
    database,
  ].join(' ');

  try {
    const result = spawnSync(mysqldumpBinary, mysqldumpArgs.split(' '), {
      encoding: null,
      env: { ...process.env, MYSQL_PWD: password },
      maxBuffer: 256 * 1024 * 1024,
    });

    const dump = result.error || result.status !== 0
      ? await createPortableSqlDump()
      : result.stdout;

    fs.writeFileSync(backupPath, compress ? gzipSync(dump) : dump);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`mysqldump failed: ${message}`);
  }
}

async function createPortableSqlDump() {
  const connection = await mysql.createConnection(config.mysql);

  try {
    const [tableRows] = await connection.query<RowDataPacket[]>('SHOW FULL TABLES WHERE Table_type = \'BASE TABLE\'');
    const tableNames = tableRows.map((row) => String(Object.values(row)[0]));
    const statements = ['SET FOREIGN_KEY_CHECKS=0;'];

    for (const tableName of tableNames) {
      const [createRows] = await connection.query<RowDataPacket[]>(`SHOW CREATE TABLE ${connection.escapeId(tableName)}`);
      const createStatement = String(createRows[0]?.['Create Table'] ?? '');
      statements.push(`DROP TABLE IF EXISTS ${connection.escapeId(tableName)};`, `${createStatement};`);

      const [rows] = await connection.query<RowDataPacket[]>(`SELECT * FROM ${connection.escapeId(tableName)}`);
      for (const row of rows) {
        const columns = Object.keys(row).map((column) => connection.escapeId(column)).join(', ');
        const values = Object.values(row).map((value) => connection.escape(value)).join(', ');
        statements.push(`INSERT INTO ${connection.escapeId(tableName)} (${columns}) VALUES (${values});`);
      }
    }

    statements.push('SET FOREIGN_KEY_CHECKS=1;');
    return Buffer.from(`${statements.join('\n\n')}\n`, 'utf8');
  } finally {
    await connection.end();
  }
}

function findMysqldumpBinary() {
  const candidates = process.platform === 'win32'
    ? [
        'mysqldump.exe',
        'D:\\PROGRAMS\\xampp\\mysql\\bin\\mysqldump.exe',
        'D:\\PROGRAMS\\xampplite\\mysql\\bin\\mysqldump.exe',
      ]
    : ['mysqldump'];

  return candidates.find((candidate) => path.isAbsolute(candidate) && fs.existsSync(candidate))
    ?? candidates[0];
}

/**
 * Ensure backup directory exists
 */
function ensureBackupDirectory() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Clean up old backup files
 */
async function cleanupOldBackups(retentionDays: number, verbose: boolean) {
  log(`🧹 Cleaning up backups older than ${retentionDays} days...`, verbose);

  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  
  let deletedCount = 0;

  for (const file of files) {
    if (!file.startsWith('naki-code-backup-')) {
      continue;
    }

    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;

    if (age > retentionMs) {
      fs.unlinkSync(filePath);
      deletedCount++;
      log(`  🗑️  Deleted old backup: ${file}`, verbose);
    }
  }

  if (deletedCount > 0) {
    log(`✅ Cleaned up ${deletedCount} old backup(s)`, verbose);
  } else {
    log('✅ No old backups to clean up', verbose);
  }
}

/**
 * List all backups
 */
function listBackups() {
  ensureBackupDirectory();
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('naki-code-backup-'))
    .map(f => {
      const filePath = path.join(BACKUP_DIR, f);
      const stats = fs.statSync(filePath);
      const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
      return {
        name: f,
        size: `${sizeInMB} MB`,
        created: stats.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.created.localeCompare(a.created));

  return files;
}

/**
 * Utility logging function
 */
function log(message: string, verbose: boolean) {
  if (verbose) {
    console.log(message);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const retentionArg = args.find(arg => arg.startsWith('--retention'));
  const listArg = args.includes('--list');

  if (listArg) {
    console.log('📋 Available backups:\n');
    const backups = listBackups();
    if (backups.length === 0) {
      console.log('No backups found.');
    } else {
      backups.forEach(backup => {
        console.log(`  ${backup.name}`);
        console.log(`    Size: ${backup.size}`);
        console.log(`    Created: ${backup.created}\n`);
      });
    }
  } else {
    const retentionDays = retentionArg
      ? parseInt(retentionArg.split('=')[1], 10)
      : DEFAULT_RETENTION_DAYS;

    backupDatabase({ retentionDays, verbose: true })
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

export { backupDatabase, listBackups };
