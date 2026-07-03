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
  {
    id: '003_template_category_id_fk',
    async up(connection) {
      await connection.query(`
        UPDATE template_categories AS category
        SET name = TRIM(category.name)
        WHERE category.name <> TRIM(category.name)
          AND NOT EXISTS (
            SELECT 1
            FROM (SELECT id, name FROM template_categories) AS existing
            WHERE existing.id <> category.id
              AND existing.name = TRIM(category.name)
          )
      `);

      if (!(await hasColumn(connection, 'templates', 'category_id'))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId('templates')}
          ADD COLUMN ${connection.escapeId('category_id')} INT NULL AFTER ${connection.escapeId('category')}`,
        );
      }

      await connection.query(`
        INSERT IGNORE INTO template_categories (name, sort_order)
        SELECT legacy.category_name, sort_orders.next_sort_order
        FROM (
          SELECT DISTINCT TRIM(category) AS category_name
          FROM templates
          WHERE TRIM(category) <> ''
        ) AS legacy
        CROSS JOIN (
          SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order
          FROM template_categories
        ) AS sort_orders
        LEFT JOIN template_categories AS existing
          ON TRIM(existing.name) = legacy.category_name
        WHERE existing.id IS NULL
      `);

      await connection.query(`
        UPDATE templates AS template
        INNER JOIN template_categories AS category
          ON TRIM(template.category) = TRIM(category.name)
        SET template.category_id = category.id,
          template.category = category.name
        WHERE template.category_id IS NULL
          OR template.category_id <> category.id
          OR template.category <> category.name
      `);

      if (!(await hasIndex(connection, 'templates', 'idx_templates_category_id'))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId('templates')}
          ADD INDEX ${connection.escapeId('idx_templates_category_id')} (${connection.escapeId('category_id')})`,
        );
      }

      if (!(await hasForeignKey(connection, 'templates', 'fk_templates_category_id'))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId('templates')}
          ADD CONSTRAINT ${connection.escapeId('fk_templates_category_id')}
          FOREIGN KEY (${connection.escapeId('category_id')})
          REFERENCES ${connection.escapeId('template_categories')} (${connection.escapeId('id')})
          ON DELETE RESTRICT ON UPDATE RESTRICT`,
        );
      }
    },
  },
  {
    id: '004_blog_cover_image',
    async up(connection) {
      if (!(await hasColumn(connection, 'blog_posts', 'cover_image'))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId('blog_posts')}
          ADD COLUMN ${connection.escapeId('cover_image')} VARCHAR(500) NULL AFTER ${connection.escapeId('author')}`,
        );
      }
    },
  },
  {
    id: '005_template_lynk_url',
    async up(connection) {
      if (!(await hasColumn(connection, 'templates', 'lynk_url'))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId('templates')}
          ADD COLUMN ${connection.escapeId('lynk_url')} VARCHAR(500) NULL AFTER ${connection.escapeId('demo_url')}`,
        );
      }
    },
  },
  {
    id: '006_template_source_code',
    async up(connection) {
      if (!(await hasColumn(connection, 'templates', 'source_code'))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId('templates')}
          ADD COLUMN ${connection.escapeId('source_code')} JSON NOT NULL DEFAULT ('[]') AFTER ${connection.escapeId('included_files')}`,
        );
      }
    },
  },
  {
    id: '007_testimonials',
    async up(connection) {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS testimonials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          source_type VARCHAR(20) NOT NULL DEFAULT 'manual',
          rating_id INT NULL,
          customer_name VARCHAR(120) NOT NULL,
          customer_role VARCHAR(80) NULL,
          quote TEXT NOT NULL,
          rating TINYINT NOT NULL DEFAULT 5,
          template_id INT NULL,
          is_featured BOOLEAN NOT NULL DEFAULT TRUE,
          sort_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_testimonials_rating FOREIGN KEY (rating_id) REFERENCES template_ratings(id) ON DELETE SET NULL
        )
      `);
    },
  },
  {
    id: '008_testimonials_deleted_at',
    async up(connection) {
      if (!(await hasColumn(connection, 'testimonials', 'deleted_at'))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId('testimonials')}
          ADD COLUMN ${connection.escapeId('deleted_at')} TIMESTAMP NULL AFTER ${connection.escapeId('updated_at')}`,
        );
      }
    },
  },
  {
    id: '009_payment_webhook_events',
    async up(connection) {
      if (!(await hasColumn(connection, 'orders', 'payment_failure_code'))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId('orders')}
          ADD COLUMN ${connection.escapeId('payment_failure_code')} VARCHAR(80) NULL AFTER ${connection.escapeId('payment_amount')}`,
        );
      }

      if (!(await hasColumn(connection, 'orders', 'payment_failure_reason'))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId('orders')}
          ADD COLUMN ${connection.escapeId('payment_failure_reason')} VARCHAR(255) NULL AFTER ${connection.escapeId('payment_failure_code')}`,
        );
      }

      if (!(await hasColumn(connection, 'orders', 'payment_last_webhook_status'))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId('orders')}
          ADD COLUMN ${connection.escapeId('payment_last_webhook_status')} VARCHAR(80) NULL AFTER ${connection.escapeId('payment_failure_reason')}`,
        );
      }

      if (!(await hasColumn(connection, 'orders', 'payment_last_webhook_at'))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId('orders')}
          ADD COLUMN ${connection.escapeId('payment_last_webhook_at')} TIMESTAMP NULL AFTER ${connection.escapeId('payment_last_webhook_status')}`,
        );
      }

      await connection.query(`
        CREATE TABLE IF NOT EXISTS payment_webhook_events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          provider VARCHAR(40) NOT NULL,
          event_key VARCHAR(255) NOT NULL,
          payment_reference VARCHAR(120) NOT NULL,
          transaction_status VARCHAR(80) NOT NULL,
          fraud_status VARCHAR(80) NULL,
          status_code VARCHAR(40) NULL,
          gross_amount VARCHAR(40) NULL,
          processing_status VARCHAR(40) NOT NULL DEFAULT 'received',
          processed_action VARCHAR(40) NULL,
          failure_reason VARCHAR(255) NULL,
          payload JSON NOT NULL,
          received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          processed_at TIMESTAMP NULL,
          UNIQUE KEY uniq_payment_webhook_event_key (provider, event_key),
          KEY idx_payment_webhook_reference (payment_reference),
          KEY idx_payment_webhook_status (processing_status)
        )
      `);
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

async function hasColumn(
  connection: Connection,
  tableName: string,
  columnName: string,
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

  return rows.length > 0;
}

async function hasIndex(
  connection: Connection,
  tableName: string,
  indexName: string,
) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND INDEX_NAME = ?
    LIMIT 1`,
    [tableName, indexName],
  );

  return rows.length > 0;
}

async function hasForeignKey(
  connection: Connection,
  tableName: string,
  constraintName: string,
) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND CONSTRAINT_NAME = ?
      AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1`,
    [tableName, constraintName],
  );

  return rows.length > 0;
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
