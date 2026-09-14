import type { Connection, RowDataPacket } from "mysql2/promise";

// Runtime migrations run automatically during API/database initialization.
// Keep these idempotent because serverless cold starts can invoke them again.
type Migration = {
  id: string;
  up: (connection: Connection) => Promise<void>;
};

const runtimeMigrations: Migration[] = [
  {
    id: "001_order_payment_url_500",
    async up(connection) {
      await connection.query(
        `ALTER TABLE ${connection.escapeId("orders")}
        MODIFY COLUMN ${connection.escapeId("payment_url")} VARCHAR(500) NULL`,
      );
    },
  },
  {
    id: "002_scrub_base64_template_previews",
    async up(connection) {
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT id, preview FROM designs",
      );

      for (const row of rows) {
        const preview = parsePreview(row.preview);
        const scrubbedPreview = preview.map((item) => ({
          ...item,
          image:
            typeof item.image === "string" &&
            item.image.startsWith("data:image/")
              ? ""
              : item.image,
        }));

        if (JSON.stringify(preview) !== JSON.stringify(scrubbedPreview)) {
          await connection.query(
            "UPDATE designs SET preview = ? WHERE id = ?",
            [JSON.stringify(scrubbedPreview), row.id],
          );
        }
      }
    },
  },
  {
    id: "003_template_category_id_fk",
    async up(connection) {
      await connection.query(`
        UPDATE categories AS category
        SET name = TRIM(category.name)
        WHERE category.name <> TRIM(category.name)
          AND NOT EXISTS (
            SELECT 1
            FROM (SELECT id, name FROM categories) AS existing
            WHERE existing.id <> category.id
              AND existing.name = TRIM(category.name)
          )
      `);

      if (!(await hasColumn(connection, "designs", "category_id"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("designs")}
          ADD COLUMN ${connection.escapeId("category_id")} INT NULL AFTER ${connection.escapeId("category")}`,
        );
      }

      await connection.query(`
        INSERT IGNORE INTO categories (name, sort_order)
        SELECT legacy.category_name, sort_orders.next_sort_order
        FROM (
          SELECT DISTINCT TRIM(category) AS category_name
          FROM designs
          WHERE TRIM(category) <> ''
        ) AS legacy
        CROSS JOIN (
          SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order
          FROM categories
        ) AS sort_orders
        LEFT JOIN categories AS existing
          ON TRIM(existing.name) = legacy.category_name
        WHERE existing.id IS NULL
      `);

      await connection.query(`
        UPDATE designs AS template
        INNER JOIN categories AS category
          ON TRIM(template.category) = TRIM(category.name)
        SET template.category_id = category.id,
          template.category = category.name
        WHERE template.category_id IS NULL
          OR template.category_id <> category.id
          OR template.category <> category.name
      `);

      if (!(await hasIndex(connection, "designs", "idx_designs_category_id"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("designs")}
          ADD INDEX ${connection.escapeId("idx_designs_category_id")} (${connection.escapeId("category_id")})`,
        );
      }

      if (
        !(await hasForeignKey(connection, "designs", "fk_designs_category_id"))
      ) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("designs")}
          ADD CONSTRAINT ${connection.escapeId("fk_designs_category_id")}
          FOREIGN KEY (${connection.escapeId("category_id")})
          REFERENCES ${connection.escapeId("categories")} (${connection.escapeId("id")})
          ON DELETE RESTRICT ON UPDATE RESTRICT`,
        );
      }
    },
  },
  {
    id: "004_blog_cover_image",
    async up(connection) {
      if (!(await hasColumn(connection, "blog_posts", "cover_image"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("blog_posts")}
          ADD COLUMN ${connection.escapeId("cover_image")} VARCHAR(500) NULL AFTER ${connection.escapeId("author")}`,
        );
      }
    },
  },
  {
    id: "005_template_lynk_url",
    async up(connection) {
      if (!(await hasColumn(connection, "designs", "lynk_url"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("designs")}
          ADD COLUMN ${connection.escapeId("lynk_url")} VARCHAR(500) NULL AFTER ${connection.escapeId("demo_url")}`,
        );
      }
    },
  },
  {
    id: "006_template_source_code",
    async up(connection) {
      if (!(await hasColumn(connection, "designs", "source_code"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("designs")}
          ADD COLUMN ${connection.escapeId("source_code")} JSON NOT NULL DEFAULT ('[]') AFTER ${connection.escapeId("included_files")}`,
        );
      }
    },
  },
  {
    id: "007_testimonials",
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
          design_id INT NULL,
          is_featured BOOLEAN NOT NULL DEFAULT TRUE,
          sort_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_testimonials_rating FOREIGN KEY (rating_id) REFERENCES design_ratings(id) ON DELETE SET NULL
        )
      `);
    },
  },
  {
    id: "008_testimonials_deleted_at",
    async up(connection) {
      if (!(await hasColumn(connection, "testimonials", "deleted_at"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("testimonials")}
          ADD COLUMN ${connection.escapeId("deleted_at")} TIMESTAMP NULL AFTER ${connection.escapeId("updated_at")}`,
        );
      }
    },
  },
  {
    id: "010_blog_soft_delete_hardening",
    async up(connection) {
      if (!(await hasColumn(connection, "blog_posts", "deleted_at"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("blog_posts")}
          ADD COLUMN ${connection.escapeId("deleted_at")} TIMESTAMP NULL AFTER ${connection.escapeId("updated_at")}`,
        );
      }

      if (
        !(await hasIndex(connection, "blog_posts", "idx_blog_posts_visibility"))
      ) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("blog_posts")}
          ADD INDEX ${connection.escapeId("idx_blog_posts_visibility")} (${connection.escapeId("deleted_at")}, ${connection.escapeId("status")}, ${connection.escapeId("published_at")})`,
        );
      }
    },
  },
  {
    id: "011_projects_soft_delete_hardening",
    async up(connection) {
      if (!(await hasColumn(connection, "projects", "deleted_at"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("projects")}
          ADD COLUMN ${connection.escapeId("deleted_at")} TIMESTAMP NULL AFTER ${connection.escapeId("cover_index")}`,
        );
      }

      if (
        !(await hasIndex(connection, "projects", "idx_projects_visibility"))
      ) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("projects")}
          ADD INDEX ${connection.escapeId("idx_projects_visibility")} (${connection.escapeId("deleted_at")}, ${connection.escapeId("id")})`,
        );
      }
    },
  },
  {
    id: "012_admin_crud_hardening",
    async up(connection) {
      if (!(await hasColumn(connection, "coupons", "deleted_at"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("coupons")}
          ADD COLUMN ${connection.escapeId("deleted_at")} TIMESTAMP NULL AFTER ${connection.escapeId("max_redemptions")}`,
        );
      }

      const indexes = [
        ["designs", "idx_designs_visibility", ["deleted_at", "id"]],
        [
          "coupons",
          "idx_coupons_availability",
          ["deleted_at", "active", "expires_at"],
        ],
        [
          "testimonials",
          "idx_testimonials_visibility",
          ["deleted_at", "is_featured", "sort_order"],
        ],
        [
          "testimonials",
          "idx_testimonials_rating",
          ["rating_id", "deleted_at"],
        ],
      ] as const;

      for (const [tableName, indexName, columns] of indexes) {
        if (!(await hasIndex(connection, tableName, indexName))) {
          await connection.query(
            `ALTER TABLE ${connection.escapeId(tableName)}
            ADD INDEX ${connection.escapeId(indexName)} (${columns.map((column) => connection.escapeId(column)).join(", ")})`,
          );
        }
      }
    },
  },
  {
    id: "013_coupon_banners",
    async up(connection) {
      if (!(await hasColumn(connection, "coupons", "image_url"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("coupons")}
          ADD COLUMN ${connection.escapeId("image_url")} VARCHAR(500) NULL AFTER ${connection.escapeId("max_redemptions")}`,
        );
      }

      if (!(await hasColumn(connection, "coupons", "show_banner"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("coupons")}
          ADD COLUMN ${connection.escapeId("show_banner")} BOOLEAN NOT NULL DEFAULT FALSE AFTER ${connection.escapeId("image_url")}`,
        );
      }

      if (!(await hasIndex(connection, "coupons", "idx_coupons_banner"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("coupons")}
          ADD INDEX ${connection.escapeId("idx_coupons_banner")} (${connection.escapeId("deleted_at")}, ${connection.escapeId("active")}, ${connection.escapeId("show_banner")}, ${connection.escapeId("expires_at")})`,
        );
      }
    },
  },
  {
    id: "009_payment_webhook_events",
    async up(connection) {
      if (!(await hasColumn(connection, "orders", "payment_failure_code"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("orders")}
          ADD COLUMN ${connection.escapeId("payment_failure_code")} VARCHAR(80) NULL AFTER ${connection.escapeId("payment_amount")}`,
        );
      }

      if (!(await hasColumn(connection, "orders", "payment_failure_reason"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("orders")}
          ADD COLUMN ${connection.escapeId("payment_failure_reason")} VARCHAR(255) NULL AFTER ${connection.escapeId("payment_failure_code")}`,
        );
      }

      if (
        !(await hasColumn(connection, "orders", "payment_last_webhook_status"))
      ) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("orders")}
          ADD COLUMN ${connection.escapeId("payment_last_webhook_status")} VARCHAR(80) NULL AFTER ${connection.escapeId("payment_failure_reason")}`,
        );
      }

      if (!(await hasColumn(connection, "orders", "payment_last_webhook_at"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("orders")}
          ADD COLUMN ${connection.escapeId("payment_last_webhook_at")} TIMESTAMP NULL AFTER ${connection.escapeId("payment_last_webhook_status")}`,
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
  {
    id: "004_coupon_max_redemptions",
    async up(connection) {
      if (!(await hasColumn(connection, "coupons", "max_redemptions"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("coupons")}
          ADD COLUMN ${connection.escapeId("max_redemptions")} INT NULL AFTER ${connection.escapeId("expires_at")}`,
        );
      }
    },
  },
  {
    id: "014_order_finance_foundation",
    async up(connection) {
      await connection.query(
        `ALTER TABLE ${connection.escapeId("orders")} MODIFY COLUMN ${connection.escapeId("payment_amount")} BIGINT NULL`,
      );
      const orderColumns = [
        ["subtotal_amount", "BIGINT NULL AFTER payment_amount"],
        ["discount_amount", "BIGINT NOT NULL DEFAULT 0 AFTER subtotal_amount"],
        [
          "gateway_fee_amount",
          "BIGINT NOT NULL DEFAULT 0 AFTER discount_amount",
        ],
        ["net_amount", "BIGINT NULL AFTER gateway_fee_amount"],
        ["currency", "CHAR(3) NOT NULL DEFAULT 'IDR' AFTER net_amount"],
        ["quote_amount", "BIGINT NULL AFTER currency"],
        ["quote_notes", "TEXT NULL AFTER quote_amount"],
        ["quote_sent_at", "TIMESTAMP NULL AFTER quote_notes"],
        ["invoice_number", "VARCHAR(40) NULL AFTER quote_sent_at"],
        ["invoice_issued_at", "TIMESTAMP NULL AFTER invoice_number"],
        ["settlement_at", "TIMESTAMP NULL AFTER paid_at"],
        ["refunded_at", "TIMESTAMP NULL AFTER settlement_at"],
        ["cancelled_at", "TIMESTAMP NULL AFTER refunded_at"],
      ] as const;

      for (const [column, definition] of orderColumns) {
        if (!(await hasColumn(connection, "orders", column))) {
          await connection.query(
            `ALTER TABLE ${connection.escapeId("orders")} ADD COLUMN ${connection.escapeId(column)} ${definition}`,
          );
        }
      }

      const indexes = [
        [
          "idx_orders_admin_filters",
          ["deleted_at", "status", "payment_status", "created_at"],
        ],
        ["idx_orders_finance", ["payment_status", "paid_at"]],
      ] as const;
      for (const [name, columns] of indexes) {
        if (!(await hasIndex(connection, "orders", name))) {
          await connection.query(
            `ALTER TABLE ${connection.escapeId("orders")} ADD INDEX ${connection.escapeId(name)} (${columns.map((column) => connection.escapeId(column)).join(", ")})`,
          );
        }
      }

      await connection.query(`
        CREATE TABLE IF NOT EXISTS finance_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          category_type VARCHAR(20) NOT NULL,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_finance_category (name, category_type)
        )
      `);
      await connection.query(`
        CREATE TABLE IF NOT EXISTS financial_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NULL,
          category_id INT NULL,
          transaction_type VARCHAR(20) NOT NULL,
          amount BIGINT NOT NULL,
          gateway_fee BIGINT NOT NULL DEFAULT 0,
          net_amount BIGINT NOT NULL,
          payment_method VARCHAR(80) NULL,
          reference VARCHAR(120) NULL,
          occurred_at TIMESTAMP NOT NULL,
          notes TEXT NULL,
          attachment_url VARCHAR(500) NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'posted',
          created_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_financial_reference (reference),
          KEY idx_financial_period (status, occurred_at, transaction_type),
          KEY idx_financial_order (order_id)
        )
      `);
      await connection.query(`
        CREATE TABLE IF NOT EXISTS invoices (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          invoice_number VARCHAR(40) NOT NULL,
          subtotal_amount BIGINT NOT NULL,
          discount_amount BIGINT NOT NULL DEFAULT 0,
          gateway_fee_amount BIGINT NOT NULL DEFAULT 0,
          total_amount BIGINT NOT NULL,
          currency CHAR(3) NOT NULL DEFAULT 'IDR',
          status VARCHAR(20) NOT NULL DEFAULT 'issued',
          snapshot JSON NOT NULL,
          issued_at TIMESTAMP NOT NULL,
          paid_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_invoice_order (order_id),
          UNIQUE KEY uniq_invoice_number (invoice_number)
        )
      `);
      await connection.query(`
        INSERT IGNORE INTO finance_categories (name, category_type) VALUES
          ('Penjualan design', 'income'),
          ('Jasa pembuatan website', 'income'),
          ('Operasional', 'expense'),
          ('Software dan langganan', 'expense'),
          ('Marketing', 'expense'),
          ('Lainnya', 'expense')
      `);
    },
  },
  {
    id: "015_order_payment_amount_bigint",
    async up(connection) {
      await connection.query(
        `ALTER TABLE ${connection.escapeId("orders")} MODIFY COLUMN ${connection.escapeId("payment_amount")} BIGINT NULL`,
      );
    },
  },
  {
    id: "016_design_preview_video",
    async up(connection) {
      if (!(await hasColumn(connection, "designs", "video_url"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("designs")} ADD COLUMN ${connection.escapeId("video_url")} VARCHAR(500) NULL AFTER ${connection.escapeId("preview")}`,
        );
      }
    },
  },
  {
    id: "017_design_draft_and_source_availability",
    async up(connection) {
      if (!(await hasColumn(connection, "designs", "publication_status"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("designs")} ADD COLUMN ${connection.escapeId("publication_status")} VARCHAR(20) NOT NULL DEFAULT 'published' AFTER ${connection.escapeId("lynk_url")}`,
        );
      }
      if (!(await hasColumn(connection, "designs", "source_available"))) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("designs")} ADD COLUMN ${connection.escapeId("source_available")} BOOLEAN NOT NULL DEFAULT TRUE AFTER ${connection.escapeId("publication_status")}`,
        );
      }
    },
  },
  {
    id: "018_release_soft_deleted_design_slugs",
    async up(connection) {
      await connection.query(
        `UPDATE ${connection.escapeId("designs")}
        SET ${connection.escapeId("slug")} = CONCAT('__deleted__', ${connection.escapeId("id")}, '__', LEFT(${connection.escapeId("slug")}, 140))
        WHERE ${connection.escapeId("deleted_at")} IS NOT NULL
          AND ${connection.escapeId("slug")} NOT REGEXP '^__deleted__[0-9]+__'`,
      );
    },
  },
  {
    id: "019_order_quote_acceptance_and_coupon_reservations",
    async up(connection) {
      const orderColumns = [
        ["quote_status", "VARCHAR(20) NULL AFTER quote_sent_at"],
        ["quote_responded_at", "TIMESTAMP NULL AFTER quote_status"],
      ] as const;

      for (const [column, definition] of orderColumns) {
        if (!(await hasColumn(connection, "orders", column))) {
          await connection.query(
            `ALTER TABLE ${connection.escapeId("orders")} ADD COLUMN ${connection.escapeId(column)} ${definition}`,
          );
        }
      }

      await connection.query(`
        UPDATE orders
        SET quote_status = CASE
          WHEN payment_status IN ('paid', 'partial_refunded', 'refunded') THEN 'accepted'
          ELSE 'pending'
        END
        WHERE quote_amount IS NOT NULL AND quote_status IS NULL
      `);

      const redemptionColumns = [
        [
          "status",
          "VARCHAR(20) NOT NULL DEFAULT 'redeemed' AFTER discount_amount",
        ],
        ["reservation_expires_at", "TIMESTAMP NULL AFTER status"],
        ["redeemed_at", "TIMESTAMP NULL AFTER reservation_expires_at"],
      ] as const;

      for (const [column, definition] of redemptionColumns) {
        if (!(await hasColumn(connection, "coupon_redemptions", column))) {
          await connection.query(
            `ALTER TABLE ${connection.escapeId("coupon_redemptions")} ADD COLUMN ${connection.escapeId(column)} ${definition}`,
          );
        }
      }

      await connection.query(`
        UPDATE coupon_redemptions
        SET status = 'redeemed', redeemed_at = COALESCE(redeemed_at, created_at)
        WHERE status = 'redeemed'
      `);
      await connection.query(`
        DELETE older
        FROM coupon_redemptions AS older
        INNER JOIN coupon_redemptions AS newer
          ON newer.order_id = older.order_id
          AND newer.id > older.id
        WHERE older.order_id IS NOT NULL
      `);

      if (
        !(await hasIndex(
          connection,
          "coupon_redemptions",
          "uniq_coupon_redemption_order",
        ))
      ) {
        await connection.query(
          `ALTER TABLE ${connection.escapeId("coupon_redemptions")} ADD UNIQUE INDEX ${connection.escapeId("uniq_coupon_redemption_order")} (${connection.escapeId("order_id")})`,
        );
      }
    },
  },
  {
    id: "020_backfill_legacy_order_quote_status",
    async up(connection) {
      await connection.query(`
        UPDATE orders
        SET quote_status = CASE
          WHEN payment_status IN ('paid', 'partial_refunded', 'refunded') THEN 'accepted'
          ELSE 'pending'
        END
        WHERE quote_amount IS NOT NULL AND quote_status IS NULL
      `);
    },
  },
  {
    id: "021_split_source_and_custom_payments",
    async up(connection) {
      const orderColumns = [
        [
          "order_type",
          "VARCHAR(30) NOT NULL DEFAULT 'custom_project' AFTER message",
        ],
        ["deposit_percent", "INT NOT NULL DEFAULT 50 AFTER quote_responded_at"],
        ["amount_paid", "BIGINT NOT NULL DEFAULT 0 AFTER deposit_percent"],
        [
          "payment_stage",
          "VARCHAR(20) NOT NULL DEFAULT 'deposit' AFTER amount_paid",
        ],
      ] as const;
      for (const [column, definition] of orderColumns) {
        if (!(await hasColumn(connection, "orders", column))) {
          await connection.query(
            `ALTER TABLE ${connection.escapeId("orders")} ADD COLUMN ${connection.escapeId(column)} ${definition}`,
          );
        }
      }

      await connection.query(`
        UPDATE orders SET
          order_type = CASE
            WHEN LOWER(project_type) LIKE '%source code%' THEN 'source_purchase'
            ELSE 'custom_project'
          END,
          amount_paid = CASE
            WHEN payment_status IN ('paid', 'partial_refunded', 'refunded')
              THEN COALESCE(payment_amount, quote_amount, 0)
            ELSE 0
          END,
          payment_stage = CASE
            WHEN payment_status IN ('paid', 'partial_refunded', 'refunded') THEN 'complete'
            WHEN LOWER(project_type) LIKE '%source code%' THEN 'full'
            ELSE 'deposit'
          END
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS order_payment_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          stage VARCHAR(20) NOT NULL,
          provider VARCHAR(20) NOT NULL,
          status VARCHAR(40) NOT NULL DEFAULT 'waiting_payment',
          method VARCHAR(80) NOT NULL,
          reference VARCHAR(120) NOT NULL,
          payment_url VARCHAR(500) NULL,
          subtotal_amount BIGINT NOT NULL,
          discount_amount BIGINT NOT NULL DEFAULT 0,
          gateway_fee_amount BIGINT NOT NULL DEFAULT 0,
          amount BIGINT NOT NULL,
          net_amount BIGINT NOT NULL,
          failure_code VARCHAR(80) NULL,
          failure_reason VARCHAR(255) NULL,
          last_webhook_status VARCHAR(80) NULL,
          last_webhook_at TIMESTAMP NULL,
          paid_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_order_payment_reference (reference),
          KEY idx_order_payment_order_stage (order_id, stage, status),
          CONSTRAINT fk_order_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT
        )
      `);

      await connection.query(`
        INSERT IGNORE INTO order_payment_sessions (
          order_id, stage, provider, status, method, reference, payment_url,
          subtotal_amount, discount_amount, gateway_fee_amount, amount,
          net_amount, failure_code, failure_reason, last_webhook_status,
          last_webhook_at, paid_at, created_at
        )
        SELECT id,
          CASE WHEN order_type = 'source_purchase' THEN 'full' ELSE 'legacy_full' END,
          CASE WHEN LOWER(COALESCE(payment_method, '')) = 'lynk' THEN 'lynk' ELSE 'midtrans' END,
          CASE
            WHEN payment_status IN ('paid', 'partial_refunded', 'refunded') THEN 'paid'
            ELSE payment_status
          END,
          COALESCE(payment_method, 'Legacy'), payment_reference,
          payment_url, COALESCE(subtotal_amount, payment_amount, quote_amount, 0),
          discount_amount, gateway_fee_amount, COALESCE(payment_amount, quote_amount, 0),
          COALESCE(net_amount, payment_amount, quote_amount, 0),
          payment_failure_code, payment_failure_reason,
          payment_last_webhook_status, payment_last_webhook_at, paid_at, created_at
        FROM orders
        WHERE payment_reference IS NOT NULL
      `);
    },
  },
  {
    id: "022_align_payment_reference_collation",
    async up(connection) {
      const [columns] = await connection.query<RowDataPacket[]>(
        `SELECT CHARACTER_SET_NAME AS character_set_name,
          COLLATION_NAME AS collation_name
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'orders'
           AND COLUMN_NAME = 'payment_reference'
         LIMIT 1`,
      );
      const characterSet = String(columns[0]?.character_set_name ?? "");
      const collation = String(columns[0]?.collation_name ?? "");
      const safeIdentifier = /^[a-zA-Z0-9_]+$/;
      if (
        safeIdentifier.test(characterSet) &&
        safeIdentifier.test(collation)
      ) {
        await connection.query(
          `ALTER TABLE order_payment_sessions
           MODIFY reference VARCHAR(120)
           CHARACTER SET ${connection.escapeId(characterSet)}
           COLLATE ${connection.escapeId(collation)} NOT NULL`,
        );
      }
    },
  },
];

export async function runRuntimeMigrations(connection: Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(160) PRIMARY KEY,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await connection.query<RowDataPacket[]>(
    "SELECT id FROM schema_migrations",
  );
  const executedMigrationIds = new Set(rows.map((row) => String(row.id)));

  for (const migration of runtimeMigrations) {
    if (executedMigrationIds.has(migration.id)) {
      continue;
    }

    await migration.up(connection);
    await connection.query("INSERT INTO schema_migrations (id) VALUES (?)", [
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

function parsePreview(
  value: unknown,
): Array<{ image: string; caption: string }> {
  if (Array.isArray(value)) {
    return value.map(normalizePreviewItem);
  }

  if (typeof value === "string") {
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
  if (!value || typeof value !== "object") {
    return { image: "", caption: "" };
  }

  const item = value as Record<string, unknown>;

  return {
    image: String(item.image ?? ""),
    caption: String(item.caption ?? ""),
  };
}
