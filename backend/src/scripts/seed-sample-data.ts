import { hashPassword } from '../auth';
import { initializeDatabase, pool } from '../db';
import type { RowDataPacket } from 'mysql2';

type Row = RowDataPacket & Record<string, unknown>;

const samplePassword = 'Sample123!';
const sampleImage =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80';

async function main() {
  await initializeDatabase();

  const passwordHash = await hashPassword(samplePassword);

  await seedUsers(passwordHash);
  await seedLegacyAdmins(passwordHash);
  await seedCategories();
  await seedTemplates();
  await seedOrders();
  await seedRatings();
  await seedFavorites();
  await seedNotifications();
  await seedAuditLogs();
  await seedProjects();
  await seedBlogPosts();
  await seedCoupons();
  await seedAffiliateReferrals();
  await seedBundles();
  await seedTestimonials();
  await seedWebhookEvents();
  await seedCouponRedemptions();

  const counts = await getTableCounts([
    'users',
    'admins',
    'template_categories',
    'templates',
    'orders',
    'payment_webhook_events',
    'template_ratings',
    'user_template_favorites',
    'notifications',
    'admin_audit_logs',
    'projects',
    'blog_posts',
    'coupons',
    'coupon_redemptions',
    'affiliate_referrals',
    'testimonials',
    'template_bundles',
    'template_bundle_items',
  ]);

  console.log('Sample database seed completed.');
  console.log(`Sample login: admin_sample / ${samplePassword}`);
  console.log(JSON.stringify(counts, null, 2));
}

async function seedUsers(passwordHash: string) {
  await pool.query(
    `INSERT INTO users (
      username,
      email,
      password_hash,
      role,
      email_verified_at
    ) VALUES
      (?, ?, ?, 'admin', CURRENT_TIMESTAMP),
      (?, ?, ?, 'user', CURRENT_TIMESTAMP),
      (?, ?, ?, 'user', CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE
      password_hash = VALUES(password_hash),
      role = VALUES(role),
      email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)`,
    [
      'admin_sample',
      'admin.sample@naki.local',
      passwordHash,
      'buyer_sample',
      'buyer.sample@naki.local',
      passwordHash,
      'client_sample',
      'client.sample@naki.local',
      passwordHash,
    ],
  );
}

async function seedLegacyAdmins(passwordHash: string) {
  if (!(await tableExists('admins'))) return;

  await pool.query(
    `INSERT INTO admins (username, password_hash, role)
    VALUES (?, ?, 'admin')
    ON DUPLICATE KEY UPDATE
      password_hash = VALUES(password_hash),
      role = VALUES(role)`,
    ['legacy_admin_sample', passwordHash],
  );
}

async function seedCategories() {
  await pool.query(
    `INSERT INTO template_categories (name, sort_order) VALUES
      ('Portfolio', 1),
      ('E-commerce', 2),
      ('Top up games', 3),
      ('CRUD', 4),
      ('Company Profile', 5),
      ('Web Bucin', 6)
    ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order)`,
  );
}

async function seedTemplates() {
  const categories = await getCategoryIds();

  const templates = [
    {
      slug: 'portfolio-developer-pro',
      title: 'Portfolio Developer Pro',
      category: 'Portfolio',
      price: 'Rp149K',
      stack: ['React', 'Vite', 'Tailwind CSS'],
      level: 'Pemula',
      demo: 'https://example.com/demo/portfolio',
      lynk: 'https://lynk.id/nakicode/portfolio-developer-pro',
    },
    {
      slug: 'starter-store-checkout',
      title: 'Starter Store Checkout',
      category: 'E-commerce',
      price: 'Rp249K',
      stack: ['React', 'Express', 'MySQL'],
      level: 'Menengah',
      demo: 'https://example.com/demo/store',
      lynk: 'https://lynk.id/nakicode/starter-store-checkout',
    },
    {
      slug: 'topup-games-dashboard',
      title: 'Topup Games Dashboard',
      category: 'Top up games',
      price: 'Rp299K',
      stack: ['React', 'Node.js', 'MySQL'],
      level: 'Menengah',
      demo: 'https://example.com/demo/topup',
      lynk: null,
    },
  ];

  for (const template of templates) {
    await pool.query(
      `INSERT INTO templates (
        title,
        slug,
        category,
        category_id,
        description,
        price,
        stack,
        level,
        rating,
        accent_class,
        preview,
        features,
        included_files,
        source_code,
        suitable_for,
        license,
        support,
        demo_url,
        lynk_url,
        buyer_count,
        is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        category = VALUES(category),
        category_id = VALUES(category_id),
        description = VALUES(description),
        price = VALUES(price),
        stack = VALUES(stack),
        level = VALUES(level),
        preview = VALUES(preview),
        features = VALUES(features),
        included_files = VALUES(included_files),
        source_code = VALUES(source_code),
        suitable_for = VALUES(suitable_for),
        license = VALUES(license),
        support = VALUES(support),
        demo_url = VALUES(demo_url),
        lynk_url = VALUES(lynk_url),
        is_featured = TRUE,
        deleted_at = NULL`,
      [
        template.title,
        template.slug,
        template.category,
        categories.get(template.category) ?? null,
        `Sample ${template.title} sebagai referensi design website Naki Code yang siap disesuaikan.`,
        template.price,
        JSON.stringify(template.stack),
        template.level,
        4.8,
        'bg-naki-secondary',
        JSON.stringify([
          { image: sampleImage, caption: `${template.title} preview utama` },
        ]),
        JSON.stringify([
          'Responsive layout',
          'Komponen siap pakai',
          'Dokumentasi setup',
        ]),
        JSON.stringify(['README.md', 'src/', 'package.json']),
        JSON.stringify([`${template.slug}.zip`, 'setup-guide.pdf']),
        JSON.stringify(['Portfolio bisnis', 'Landing page', 'Client project']),
        'Sample license untuk satu project demo.',
        'Sample support setup dasar selama 7 hari.',
        template.demo,
        template.lynk,
        3,
      ],
    );
  }
}

async function seedOrders() {
  const buyer = await getUser('buyer_sample');
  const client = await getUser('client_sample');
  const templates = await getTemplates();
  const portfolio = templates.get('portfolio-developer-pro');
  const store = templates.get('starter-store-checkout');

  if (!buyer || !client || !portfolio || !store) return;

  await pool.query(
    `INSERT INTO orders (
      user_id,
      template_id,
      template_slug,
      template_title,
      customer_name,
      customer_contact,
      project_type,
      budget_range,
      message,
      status,
      payment_status,
      payment_method,
      payment_reference,
      payment_url,
      payment_amount,
      paid_at
    ) VALUES
      (?, ?, ?, ?, 'Budi Sample', '081200000001', 'Beli source code design', ?, 'Saya ingin membeli source code design ini untuk portfolio.', 'deal', 'paid', 'midtrans', 'SAMPLE-PAID-001', 'https://example.com/pay/SAMPLE-PAID-001', 149000, CURRENT_TIMESTAMP),
      (?, ?, ?, ?, 'Citra Sample', '081200000002', 'Konsultasi custom', ?, 'Tolong bantu custom warna dan halaman checkout.', 'contacted', 'waiting_payment', 'midtrans', 'SAMPLE-WAIT-001', 'https://example.com/pay/SAMPLE-WAIT-001', 249000, NULL)
    ON DUPLICATE KEY UPDATE
      customer_name = VALUES(customer_name),
      status = VALUES(status),
      payment_status = VALUES(payment_status),
      payment_url = VALUES(payment_url),
      deleted_at = NULL`,
    [
      buyer.id,
      portfolio.id,
      portfolio.slug,
      portfolio.title,
      portfolio.price,
      client.id,
      store.id,
      store.slug,
      store.title,
      store.price,
    ],
  );
}

async function seedRatings() {
  const buyer = await getUser('buyer_sample');
  const client = await getUser('client_sample');
  const templates = await getTemplates();

  const rows = [
    {
      userId: buyer?.id ?? null,
      template: templates.get('portfolio-developer-pro'),
      name: 'Budi Sample',
      rating: 5,
      message: 'Design-nya sesuai kebutuhan dan proses penyesuaiannya jelas.',
    },
    {
      userId: client?.id ?? null,
      template: templates.get('starter-store-checkout'),
      name: 'Citra Sample',
      rating: 4,
      message: 'Flow checkout sudah rapi untuk demo toko online.',
    },
  ];

  for (const row of rows) {
    if (!row.template) continue;
    await pool.query(
      `INSERT INTO template_ratings (
        user_id,
        template_id,
        template_slug,
        customer_name,
        rating,
        message
      )
      SELECT ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM template_ratings
        WHERE template_slug = ? AND customer_name = ?
      )`,
      [
        row.userId,
        row.template.id,
        row.template.slug,
        row.name,
        row.rating,
        row.message,
        row.template.slug,
        row.name,
      ],
    );
  }
}

async function seedFavorites() {
  const buyer = await getUser('buyer_sample');
  const templates = await getTemplates();
  const portfolio = templates.get('portfolio-developer-pro');
  const store = templates.get('starter-store-checkout');
  if (!buyer || !portfolio || !store) return;

  await pool.query(
    `INSERT IGNORE INTO user_template_favorites (user_id, template_id)
    VALUES (?, ?), (?, ?)`,
    [buyer.id, portfolio.id, buyer.id, store.id],
  );
}

async function seedNotifications() {
  const buyer = await getUser('buyer_sample');
  const order = await getOrder('SAMPLE-PAID-001');
  if (!buyer) return;

  await pool.query(
    `INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_order_id,
      read_at
    )
    SELECT ?, 'Pembayaran sample berhasil', 'Source code sample sudah tersedia di Pesanan Saya.', 'payment', ?, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = ? AND title = 'Pembayaran sample berhasil'
    )`,
    [buyer.id, order?.id ?? null, buyer.id],
  );
}

async function seedAuditLogs() {
  const admin = await getUser('admin_sample');
  await pool.query(
    `INSERT INTO admin_audit_logs (
      admin_user_id,
      admin_username,
      action,
      entity_type,
      entity_id,
      metadata
    )
    SELECT ?, 'admin_sample', 'seed_sample_data', 'database', NULL, ?
    WHERE NOT EXISTS (
      SELECT 1 FROM admin_audit_logs
      WHERE action = 'seed_sample_data' AND admin_username = 'admin_sample'
    )`,
    [
      admin?.id ?? null,
      JSON.stringify({ source: 'seed-sample-data', mode: 'idempotent' }),
    ],
  );
}

async function seedProjects() {
  await pool.query(
    `INSERT INTO projects (
      title,
      category,
      description,
      result,
      website_url,
      image_url,
      image_urls,
      cover_index
    ) VALUES
      (?, ?, ?, ?, ?, ?, ?, 0),
      (?, ?, ?, ?, ?, ?, ?, 0)
    ON DUPLICATE KEY UPDATE
      description = VALUES(description),
      result = VALUES(result),
      website_url = VALUES(website_url),
      image_url = VALUES(image_url),
      image_urls = VALUES(image_urls),
      deleted_at = NULL`,
    [
      'Sample Company Profile',
      'Company Profile',
      'Website company profile sample untuk showcase admin.',
      'Landing page siap publish',
      'https://example.com/projects/company-profile',
      sampleImage,
      JSON.stringify([sampleImage]),
      'Sample Storefront',
      'E-commerce',
      'Katalog toko online sample dengan checkout.',
      'Katalog dan checkout berjalan',
      'https://example.com/projects/storefront',
      sampleImage,
      JSON.stringify([sampleImage]),
    ],
  );
}

async function seedBlogPosts() {
  await pool.query(
    `INSERT INTO blog_posts (
      slug,
      title,
      excerpt,
      content,
      author,
      cover_image,
      status,
      published_at
    ) VALUES
      (?, ?, ?, ?, 'Naki Code', ?, 'published', CURRENT_TIMESTAMP),
      (?, ?, ?, ?, 'Naki Code', ?, 'draft', NULL)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      excerpt = VALUES(excerpt),
      content = VALUES(content),
      cover_image = VALUES(cover_image),
      status = VALUES(status),
      published_at = VALUES(published_at),
      deleted_at = NULL`,
    [
      'sample-cara-pilih-design',
      'Sample Cara Pilih Design Website',
      'Panduan singkat memilih design referensi sesuai kebutuhan project.',
      'Gunakan design yang sesuai alur bisnis, karakter brand, dan kebutuhan konten.',
      sampleImage,
      'sample-checklist-launching-website',
      'Sample Checklist Launching Website',
      'Checklist sample sebelum website dipublikasikan.',
      'Pastikan domain, hosting, SEO, analytics, dan pembayaran sudah dicek.',
      sampleImage,
    ],
  );
}

async function seedCoupons() {
  await pool.query(
    `INSERT INTO coupons (
      code,
      description,
      discount_type,
      discount_value,
      active,
      expires_at
    ) VALUES
      ('SAMPLE10', 'Diskon sample 10 persen', 'percent', 10, TRUE, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY)),
      ('SAMPLE50K', 'Diskon sample Rp50K', 'fixed', 50000, TRUE, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY))
    ON DUPLICATE KEY UPDATE
      description = VALUES(description),
      discount_type = VALUES(discount_type),
      discount_value = VALUES(discount_value),
      active = VALUES(active),
      expires_at = VALUES(expires_at)`,
  );
}

async function seedAffiliateReferrals() {
  await pool.query(
    `INSERT INTO affiliate_referrals (
      code,
      owner_name,
      active,
      click_count,
      conversion_count
    ) VALUES
      ('SAMPLEPARTNER', 'Sample Partner', TRUE, 24, 3),
      ('SAMPLECREATOR', 'Sample Creator', TRUE, 12, 1)
    ON DUPLICATE KEY UPDATE
      owner_name = VALUES(owner_name),
      active = VALUES(active),
      click_count = VALUES(click_count),
      conversion_count = VALUES(conversion_count)`,
  );
}

async function seedBundles() {
  const templates = await getTemplates();
  const portfolio = templates.get('portfolio-developer-pro');
  const store = templates.get('starter-store-checkout');
  if (!portfolio || !store) return;

  await pool.query(
    `INSERT INTO template_bundles (
      slug,
      title,
      description,
      price,
      active
    ) VALUES
      ('sample-starter-bundle', 'Sample Starter Bundle', 'Paket sample portfolio dan toko online.', 'Rp349K', TRUE)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      description = VALUES(description),
      price = VALUES(price),
      active = VALUES(active)`,
  );

  const bundle = await getBundle('sample-starter-bundle');
  if (!bundle) return;

  await pool.query(
    `INSERT IGNORE INTO template_bundle_items (bundle_id, template_id, sort_order)
    VALUES (?, ?, 1), (?, ?, 2)`,
    [bundle.id, portfolio.id, bundle.id, store.id],
  );
}

async function seedTestimonials() {
  const [ratings] = await pool.query<Row[]>(
    `SELECT id, customer_name, rating, message, template_id
    FROM template_ratings
    ORDER BY id ASC
    LIMIT 2`,
  );

  for (const [index, rating] of ratings.entries()) {
    await pool.query(
      `INSERT INTO testimonials (
        source_type,
        rating_id,
        customer_name,
        customer_role,
        quote,
        rating,
        template_id,
        is_featured,
        sort_order
      )
      SELECT 'rating', ?, ?, ?, ?, ?, ?, TRUE, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM testimonials
        WHERE rating_id = ? AND deleted_at IS NULL
      )`,
      [
        rating.id,
        rating.customer_name,
        index === 0 ? 'Founder sample brand' : 'Owner sample store',
        rating.message ?? 'Sample testimonial dari review design.',
        rating.rating,
        rating.template_id,
        index + 1,
        rating.id,
      ],
    );
  }

  await pool.query(
    `INSERT INTO testimonials (
      source_type,
      customer_name,
      customer_role,
      quote,
      rating,
      is_featured,
      sort_order
    )
    SELECT 'manual', 'Dewi Sample', 'Freelancer', 'Sample testimoni manual untuk homepage Naki Code.', 5, TRUE, 10
    WHERE NOT EXISTS (
      SELECT 1 FROM testimonials
      WHERE source_type = 'manual' AND customer_name = 'Dewi Sample' AND deleted_at IS NULL
    )`,
  );
}

async function seedWebhookEvents() {
  const paidOrder = await getOrder('SAMPLE-PAID-001');
  const waitOrder = await getOrder('SAMPLE-WAIT-001');

  const rows = [
    {
      eventKey: 'sample-paid-001-settlement',
      reference: paidOrder?.payment_reference ?? 'SAMPLE-PAID-001',
      status: 'settlement',
      processing: 'processed',
      action: 'marked_paid',
    },
    {
      eventKey: 'sample-wait-001-pending',
      reference: waitOrder?.payment_reference ?? 'SAMPLE-WAIT-001',
      status: 'pending',
      processing: 'received',
      action: null,
    },
  ];

  for (const row of rows) {
    await pool.query(
      `INSERT INTO payment_webhook_events (
        provider,
        event_key,
        payment_reference,
        transaction_status,
        fraud_status,
        status_code,
        gross_amount,
        processing_status,
        processed_action,
        payload,
        processed_at
      ) VALUES (
        'midtrans',
        ?,
        ?,
        ?,
        'accept',
        '200',
        '149000.00',
        ?,
        ?,
        ?,
        CURRENT_TIMESTAMP
      )
      ON DUPLICATE KEY UPDATE
        transaction_status = VALUES(transaction_status),
        processing_status = VALUES(processing_status),
        processed_action = VALUES(processed_action),
        payload = VALUES(payload)`,
      [
        row.eventKey,
        row.reference,
        row.status,
        row.processing,
        row.action,
        JSON.stringify({
          sample: true,
          order_id: row.reference,
          transaction_status: row.status,
        }),
      ],
    );
  }
}

async function seedCouponRedemptions() {
  const buyer = await getUser('buyer_sample');
  const order = await getOrder('SAMPLE-PAID-001');
  const coupon = await getCoupon('SAMPLE10');
  if (!buyer || !order || !coupon) return;

  await pool.query(
    `INSERT INTO coupon_redemptions (
      coupon_id,
      order_id,
      user_id,
      discount_amount
    )
    SELECT ?, ?, ?, 14900
    WHERE NOT EXISTS (
      SELECT 1 FROM coupon_redemptions
      WHERE coupon_id = ? AND order_id = ?
    )`,
    [coupon.id, order.id, buyer.id, coupon.id, order.id],
  );
}

async function tableExists(tableName: string) {
  const [rows] = await pool.query<Row[]>(
    `SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
    LIMIT 1`,
    [tableName],
  );

  return rows.length > 0;
}

async function getCategoryIds() {
  const [rows] = await pool.query<Row[]>(
    'SELECT id, name FROM template_categories',
  );

  return new Map(rows.map((row) => [String(row.name), Number(row.id)]));
}

async function getUser(username: string) {
  const [rows] = await pool.query<Row[]>(
    'SELECT id, username FROM users WHERE username = ? LIMIT 1',
    [username],
  );

  return rows[0] ? { id: Number(rows[0].id), username } : null;
}

async function getTemplates() {
  const [rows] = await pool.query<Row[]>(
    'SELECT id, slug, title, price FROM templates WHERE deleted_at IS NULL',
  );

  return new Map(
    rows.map((row) => [
      String(row.slug),
      {
        id: Number(row.id),
        slug: String(row.slug),
        title: String(row.title),
        price: String(row.price),
      },
    ]),
  );
}

async function getOrder(paymentReference: string) {
  const [rows] = await pool.query<Row[]>(
    'SELECT id, payment_reference FROM orders WHERE payment_reference = ? LIMIT 1',
    [paymentReference],
  );

  return rows[0]
    ? {
        id: Number(rows[0].id),
        payment_reference: String(rows[0].payment_reference),
      }
    : null;
}

async function getCoupon(code: string) {
  const [rows] = await pool.query<Row[]>(
    'SELECT id, code FROM coupons WHERE code = ? LIMIT 1',
    [code],
  );

  return rows[0] ? { id: Number(rows[0].id), code } : null;
}

async function getBundle(slug: string) {
  const [rows] = await pool.query<Row[]>(
    'SELECT id, slug FROM template_bundles WHERE slug = ? LIMIT 1',
    [slug],
  );

  return rows[0] ? { id: Number(rows[0].id), slug } : null;
}

async function getTableCounts(tableNames: string[]) {
  const counts: Record<string, number> = {};

  for (const tableName of tableNames) {
    if (!(await tableExists(tableName))) continue;
    const [rows] = await pool.query<Row[]>(
      `SELECT COUNT(*) AS total FROM ${pool.escapeId(tableName)}`,
    );
    counts[tableName] = Number(rows[0]?.total ?? 0);
  }

  return counts;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
