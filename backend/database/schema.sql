-- Baseline schema for creating a fresh Naki Code database.
-- Existing production/development databases are upgraded by runtime migrations
-- in backend/src/runtime-migrations.ts and targeted ensureColumn checks in db.ts.

CREATE DATABASE IF NOT EXISTS naki_code;
USE naki_code;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(160) NOT NULL UNIQUE,
  google_sub VARCHAR(255) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(40) NOT NULL DEFAULT 'user',
  email_verified_at TIMESTAMP NULL,
  email_verification_token VARCHAR(120) NULL,
  email_verification_sent_at TIMESTAMP NULL,
  email_verification_otp_hash VARCHAR(255) NULL,
  email_verification_otp_expires_at TIMESTAMP NULL,
  email_verification_otp_sent_at TIMESTAMP NULL,
  password_reset_otp_hash VARCHAR(255) NULL,
  password_reset_otp_expires_at TIMESTAMP NULL,
  password_reset_otp_sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS designs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  category VARCHAR(80) NOT NULL,
  category_id INT NULL,
  description TEXT NOT NULL,
  price VARCHAR(32) NOT NULL,
  stack JSON NOT NULL,
  level VARCHAR(40) NOT NULL,
  accent_class VARCHAR(80) NOT NULL DEFAULT 'bg-naki-secondary',
  preview JSON NOT NULL,
  video_url VARCHAR(500) NULL,
  features JSON NOT NULL,
  included_files JSON NOT NULL,
  source_code JSON NOT NULL DEFAULT ('[]'),
  suitable_for JSON NOT NULL,
  license TEXT NOT NULL,
  support TEXT NOT NULL,
  demo_url VARCHAR(255) NOT NULL DEFAULT '#',
  lynk_url VARCHAR(500) NULL,
  publication_status VARCHAR(20) NOT NULL DEFAULT 'published',
  source_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_designs_category_id (category_id),
  KEY idx_designs_visibility (deleted_at, publication_status, id),
  CONSTRAINT fk_designs_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  design_id INT NULL,
  design_slug VARCHAR(180) NOT NULL,
  design_title VARCHAR(160) NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_contact VARCHAR(120) NOT NULL,
  project_type VARCHAR(80) NOT NULL,
  budget_range VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  order_type VARCHAR(30) NOT NULL DEFAULT 'custom_project',
  status VARCHAR(40) NOT NULL DEFAULT 'new',
  payment_status VARCHAR(40) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(80) NULL,
  payment_reference VARCHAR(120) NULL,
  payment_url VARCHAR(500) NULL,
  payment_amount BIGINT NULL,
  subtotal_amount BIGINT NULL,
  discount_amount BIGINT NOT NULL DEFAULT 0,
  gateway_fee_amount BIGINT NOT NULL DEFAULT 0,
  net_amount BIGINT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'IDR',
  quote_amount BIGINT NULL,
  quote_notes TEXT NULL,
  quote_sent_at TIMESTAMP NULL,
  quote_status VARCHAR(20) NULL,
  quote_responded_at TIMESTAMP NULL,
  deposit_percent INT NOT NULL DEFAULT 50,
  amount_paid BIGINT NOT NULL DEFAULT 0,
  payment_stage VARCHAR(20) NOT NULL DEFAULT 'deposit',
  invoice_number VARCHAR(40) NULL UNIQUE,
  invoice_issued_at TIMESTAMP NULL,
  payment_failure_code VARCHAR(80) NULL,
  payment_failure_reason VARCHAR(255) NULL,
  payment_last_webhook_status VARCHAR(80) NULL,
  payment_last_webhook_at TIMESTAMP NULL,
  paid_at TIMESTAMP NULL,
  settlement_at TIMESTAMP NULL,
  refunded_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_orders_admin_filters (deleted_at, status, payment_status, created_at),
  KEY idx_orders_finance (payment_status, paid_at)
);

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
);

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
);

CREATE TABLE IF NOT EXISTS design_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  design_id INT NOT NULL,
  design_slug VARCHAR(180) NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  rating TINYINT NOT NULL,
  message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_design_favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  design_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY user_design_unique (user_id, design_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'order',
  related_order_id INT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_user_id INT NULL,
  admin_username VARCHAR(120) NOT NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id INT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS finance_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category_type VARCHAR(20) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_finance_category (name, category_type)
);

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
);

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
);

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Website',
  description TEXT NOT NULL,
  result VARCHAR(160) NOT NULL DEFAULT 'Project selesai',
  website_url VARCHAR(500) NOT NULL DEFAULT '#',
  image_url VARCHAR(500) NULL,
  image_urls JSON NULL,
  cover_index INT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_projects_visibility (deleted_at, id)
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  excerpt TEXT NOT NULL,
  content LONGTEXT NOT NULL,
  author VARCHAR(120) NOT NULL DEFAULT 'Naki Code',
  cover_image VARCHAR(500) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_blog_posts_visibility (deleted_at, status, published_at)
);

CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percent',
  discount_value INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMP NULL,
  max_redemptions INT NULL,
  image_url VARCHAR(500) NULL,
  show_banner BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_coupons_availability (deleted_at, active, expires_at),
  KEY idx_coupons_banner (deleted_at, active, show_banner, expires_at)
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT NOT NULL,
  order_id INT NULL,
  user_id INT NULL,
  discount_amount INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'reserved',
  reservation_expires_at TIMESTAMP NULL,
  redeemed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_coupon_redemption_order (order_id)
);

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
  deleted_at TIMESTAMP NULL,
  KEY idx_testimonials_visibility (deleted_at, is_featured, sort_order),
  KEY idx_testimonials_rating (rating_id, deleted_at),
  CONSTRAINT fk_testimonials_rating FOREIGN KEY (rating_id) REFERENCES design_ratings(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS design_bundles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  price VARCHAR(32) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS design_bundle_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bundle_id INT NOT NULL,
  design_id INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE KEY bundle_design_unique (bundle_id, design_id)
);
