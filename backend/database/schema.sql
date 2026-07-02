CREATE DATABASE IF NOT EXISTS naki_code;
USE naki_code;

CREATE TABLE IF NOT EXISTS template_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(160) NOT NULL UNIQUE,
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

CREATE TABLE IF NOT EXISTS templates (
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
  features JSON NOT NULL,
  included_files JSON NOT NULL,
  source_code JSON NOT NULL DEFAULT ('[]'),
  suitable_for JSON NOT NULL,
  license TEXT NOT NULL,
  support TEXT NOT NULL,
  demo_url VARCHAR(255) NOT NULL DEFAULT '#',
  lynk_url VARCHAR(500) NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_templates_category_id (category_id),
  CONSTRAINT fk_templates_category_id FOREIGN KEY (category_id) REFERENCES template_categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  template_id INT NULL,
  template_slug VARCHAR(180) NOT NULL,
  template_title VARCHAR(160) NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_contact VARCHAR(120) NOT NULL,
  project_type VARCHAR(80) NOT NULL,
  budget_range VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'new',
  payment_status VARCHAR(40) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(80) NULL,
  payment_reference VARCHAR(120) NULL,
  payment_url VARCHAR(500) NULL,
  payment_amount INT NULL,
  paid_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS template_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  template_id INT NOT NULL,
  template_slug VARCHAR(180) NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  rating TINYINT NOT NULL,
  message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_template_favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  template_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY user_template_unique (user_id, template_id)
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percent',
  discount_value INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT NOT NULL,
  order_id INT NULL,
  user_id INT NULL,
  discount_amount INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  owner_name VARCHAR(120) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  click_count INT NOT NULL DEFAULT 0,
  conversion_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS template_bundles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  price VARCHAR(32) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS template_bundle_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bundle_id INT NOT NULL,
  template_id INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE KEY bundle_template_unique (bundle_id, template_id)
);

INSERT IGNORE INTO template_categories (name, sort_order) VALUES
  ('Portfolio', 1),
  ('E-commerce', 2),
  ('Top up games', 3),
  ('Web Bucin', 4),
  ('CRUD', 5),
  ('Company', 6);

INSERT IGNORE INTO projects (id, title, description) VALUES
  (
    1,
    'Naki Code Starter',
    'React, Vite, Tailwind, Express, dan MySQL sudah tersambung.'
  );

INSERT IGNORE INTO blog_posts (slug, title, excerpt, content, author, status, published_at) VALUES
  (
    'cara-install-template-react-vite',
    'Cara install template React Vite dari Naki Code',
    'Langkah cepat menjalankan template Naki Code di lokal.',
    '1. Install dependency dengan npm install.\n2. Salin file env sesuai kebutuhan.\n3. Jalankan npm run dev dari root project.\n4. Buka frontend dan backend sesuai port yang tampil di terminal.',
    'Naki Code',
    'published',
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO coupons (code, description, discount_type, discount_value, active) VALUES
  ('NAKIHEMAT', 'Diskon pembelian template Naki Code', 'percent', 10, TRUE);

INSERT IGNORE INTO affiliate_referrals (code, owner_name, active) VALUES
  ('NAKIPARTNER', 'Naki Partner', TRUE);

INSERT IGNORE INTO template_bundles (slug, title, description, price, active) VALUES
  ('starter-store-bundle', 'Starter Store Bundle', 'Paket template pilihan untuk mulai toko online dan katalog jasa.', 'Rp399K', TRUE);
