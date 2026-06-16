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

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
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

  // Build mysqldump command
  const mysqldumpCmd = [
    'mysqldump',
    `--host=${host}`,
    `--port=${port}`,
    `--user=${user}`,
    `--password=${password}`,
    '--single-transaction',
    '--routines',
    '--triggers',
    '--events',
    database,
  ].join(' ');

  try {
    if (compress) {
      // Pipe mysqldump output through gzip
      const cmd = `${mysqldumpCmd} | gzip > "${backupPath}"`;
      execSync(cmd, { stdio: 'pipe', shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh' });
    } else {
      // Direct output to file
      const cmd = `${mysqldumpCmd} > "${backupPath}"`;
      execSync(cmd, { stdio: 'pipe', shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh' });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`mysqldump failed: ${message}`);
  }
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
