import type { Connection, RowDataPacket } from 'mysql2/promise';

type Migration = {
  id: string;
  up: (connection: Connection) => Promise<void>;
};

const migrations: Migration[] = [
  {
    id: '001_order_payment_url_500',
    async up(connection) {
      await connection.query(
        `ALTER TABLE ${connection.escapeId('orders')}
        MODIFY COLUMN ${connection.escapeId('payment_url')} VARCHAR(500) NULL`,
      );
    },
  },
  {
    id: '002_scrub_base64_template_previews',
    async up(connection) {
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT id, preview FROM templates',
      );

      for (const row of rows) {
        const preview = parsePreview(row.preview);
        const scrubbedPreview = preview.map((item) => ({
          ...item,
          image:
            typeof item.image === 'string' && item.image.startsWith('data:image/')
              ? ''
              : item.image,
        }));

        if (JSON.stringify(preview) !== JSON.stringify(scrubbedPreview)) {
          await connection.query('UPDATE templates SET preview = ? WHERE id = ?', [
            JSON.stringify(scrubbedPreview),
            row.id,
          ]);
        }
      }
    },
  },
];

export async function runMigrations(connection: Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(160) PRIMARY KEY,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT id FROM schema_migrations',
  );
  const executedMigrationIds = new Set(rows.map((row) => String(row.id)));

  for (const migration of migrations) {
    if (executedMigrationIds.has(migration.id)) {
      continue;
    }

    await migration.up(connection);
    await connection.query('INSERT INTO schema_migrations (id) VALUES (?)', [
      migration.id,
    ]);
  }
}

function parsePreview(value: unknown): Array<{ image: string; caption: string }> {
  if (Array.isArray(value)) {
    return value.map(normalizePreviewItem);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(normalizePreviewItem) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizePreviewItem(value: unknown) {
  if (!value || typeof value !== 'object') {
    return { image: '', caption: '' };
  }

  const item = value as Record<string, unknown>;

  return {
    image: String(item.image ?? ''),
    caption: String(item.caption ?? ''),
  };
}
