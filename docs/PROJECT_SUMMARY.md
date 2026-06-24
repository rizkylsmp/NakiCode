# Naki Code Project Summary

Konteks tunggal untuk AI/dev saat bekerja di aplikasi Naki Code. File ini menggantikan `README.md`, `AGENTS.md`, dan dokumen lama di `docs/`.

## Instruksi Wajib untuk AI

1. **Baca file ini sebelum mengerjakan task apa pun di repo ini.**
2. **Setelah selesai mengerjakan task**, tambahkan 1 item checklist baru di bagian **AI Task Checklist / Changelog**.
3. Format checklist wajib:
   - `- [x] YYYY-MM-DD — <ringkasan task selesai> — files: <path penting>`
4. Jika task belum selesai atau ada blocker, tambahkan:
   - `- [ ] YYYY-MM-DD — <task tertunda/blocker> — reason: <alasan>`
5. Jangan hapus checklist lama kecuali duplikat/salah.
6. Jika mengubah arsitektur, endpoint, env, workflow, atau fitur besar, update bagian ringkasan terkait di file ini juga.
7. Jangan simpan secret, token, password asli, atau data sensitif di file ini.
8. Gunakan `rtk` untuk operasi shell bila hook mengubah command Bash otomatis.

---

## Identitas Produk

Naki Code adalah toko template coding dan jasa custom website. Produk utama:

- Template Portfolio
- Template E-commerce
- Template Top up games
- Template Web Bucin
- Template CRUD/admin input data
- Template Company profile
- Pesanan custom website

Inspirasi fungsi/menu berasal dari Web Ekspor, tetapi Naki Code **tidak** menyediakan domain, cek domain, atau paket hosting/domain.

Target UX:

- User cepat menemukan template cocok.
- User bisa filter/search, compare, wishlist, lihat demo/detail, lalu beli atau konsultasi.
- User paham perbedaan template siap pakai vs jasa custom.
- Admin mudah mengelola template, kategori, order, blog, portofolio, dan status pembayaran.

---

## Stack & Arsitektur

### Monorepo

- Root npm workspaces: `frontend` dan `backend`.
- Root build: `npm run build`.
- Dev: `npm run dev` atau `dev.cmd` di Windows.

### Frontend

- React + TypeScript + Vite
- Tailwind CSS v4 (`@theme` di `frontend/src/styles.css`)
- React Router
- TanStack React Query
- `react-helmet-async` untuk meta tags/SEO
- PWA: `frontend/public/manifest.webmanifest`, `frontend/public/sw.js`, `offline.html`
- Analytics env-based: `VITE_ANALYTICS_PROVIDER=ga4|plausible|umami|none`

### Backend

- Express + TypeScript (`tsx` dev, `tsc` build)
- MySQL via `mysql2/promise`
- Zod env/body validation
- Custom HMAC token auth (bukan JWT library)
- BullMQ + Redis optional untuk email queue/cache
- Nodemailer SMTP
- Cloudinary optional untuk image upload, fallback local `/uploads`
- Swagger UI di `/api/docs`, OpenAPI JSON di `/api/openapi.json`
- Sentry optional via `SENTRY_DSN`

### Database

- Schema utama: `backend/database/schema.sql`
- Bootstrap DB: `backend/src/db.ts` → create database dari `MYSQL_DATABASE`, apply schema, ensure columns, run migrations.
- Kategori template dinormalisasi via `templates.category_id` → `template_categories.id`; `templates.category` masih dipertahankan sebagai compatibility/display fallback.
- MySQL wajib tersedia. Backend harus gagal start jika DB init gagal.
- Query manual dipisah di `backend/src/models/*`; route sebaiknya tidak menulis query besar langsung kecuali endpoint kecil/statistik.

---

## Env Penting Backend

Validated di `backend/src/config.ts` via Zod.

Wajib/critical:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD` (boleh kosong untuk local root, tapi production wajib aman)
- `MYSQL_DATABASE`
- `ADMIN_USERNAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` minimal 8 chars
- `ADMIN_TOKEN_SECRET` minimal 32 chars
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`

Optional:

- `CLIENT_ORIGIN`
- `CLIENT_ORIGINS` (comma-separated allowlist CORS)
- `REDIS_URL`
- `PAYMENT_PROVIDER=dev|midtrans|xendit`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_IS_PRODUCTION`
- `STOREFRONT_WHATSAPP_NUMBER`
- `CLOUDINARY_URL`
- `CLOUDINARY_FOLDER`
- `SENTRY_DSN`

Jangan commit `.env`.

---

## Route Frontend Utama

- `/` — home/storefront
- `/template` — katalog via home element + query kategori/search
- `/templates/:slug` — detail template
- `/login` — login/register user + admin
- `/forgot-password` — reset password via OTP email
- `/verify-email` — verifikasi email via OTP
- `/blog` — blog list
- `/blog/:slug` — detail blog
- `/pesanan-saya` — order user, butuh login
- `/checkout/:orderId` — checkout/payment, butuh login
- `/akun-saya` dan `/profile` — profil user
- `/wishlist` — template favorit user
- `/compare` — compare 2-3 template
- `/admin/dashboard`, `/admin/templates`, `/admin/orders`, `/admin/portfolio` — admin panel, butuh role admin

---

## API Backend Utama

Backend mount route di `/api` dan `/api/v1`.

Public/core:

- `GET /api`
- `GET /api/health`
- `GET /api/projects`
- `GET /api/templates`
- `GET /api/templates/:slug`
- `GET /api/categories`
- `GET /api/blog`
- `GET /api/blog/:slug`
- `POST /api/orders`

Auth/user:

- `POST /api/auth/user/register`
- `POST /api/auth/user/login`
- `POST /api/auth/user/verify-email`
- `POST /api/auth/user/resend-otp`
- `POST /api/auth/user/forgot-password`
- `POST /api/auth/user/reset-password`
- `GET /api/auth/user/me`
- `PATCH /api/auth/user/me`
- `DELETE /api/auth/user/me`

Orders/payment:

- `GET /api/orders/my`
- `POST /api/orders/:id/payment`
- `POST /api/orders/:id/payment/confirm`
- `POST /api/payments/midtrans/webhook`

Wishlist/notifications:

- `GET /api/favorites/my`
- `POST /api/favorites/:templateId`
- `DELETE /api/favorites/:templateId`
- `GET /api/notifications/my`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

Admin:

- `GET /api/orders` (admin)
- `PATCH /api/orders/:id/status` (admin)
- Template/category/project/blog CRUD routes
- `GET /api/admin/stats`
- `POST /api/uploads/images` (admin)

Business:

- `POST /api/business/coupons/validate`
- `POST /api/business/referrals/:code/click`
- `GET /api/business/bundles`

---

## Auth & Security

- Token user/admin dibuat di `backend/src/auth.ts`.
- Format token: `base64url(payload).hmacSignature` memakai `ADMIN_TOKEN_SECRET`.
- Payload punya `userId`, `sub`, `role`, `exp`.
- Role: `user` atau `admin`.
- Password hash: `scrypt` + salt.
- Middleware: `requireUser`, `requireAdmin`.
- Frontend menyimpan token di localStorage lewat `frontend/src/user-session.ts`.
- Axios client di `frontend/src/api-client.ts` inject `Authorization: Bearer <token>` otomatis.
- Global 401 handler auto logout.
- Backend pakai `helmet`, rate limit global API, auth rate limit lebih ketat, CORS allowlist dari `CLIENT_ORIGINS`.
- Admin action penting masuk `admin_audit_logs`.
- Template/order/project/blog memakai soft delete via `deleted_at`.

Production notes:

- Rotate `ADMIN_TOKEN_SECRET`, `SMTP_PASSWORD`, `MIDTRANS_SERVER_KEY` dari provider masing-masing.
- Set `CLIENT_ORIGINS` ke domain frontend production.
- Payment production harus aktifkan webhook provider:
  - `https://domain-kamu.com/api/payments/midtrans/webhook`

---

## Payment Flow

Payment service: `backend/src/payments/payment.service.ts`.

Status pembayaran dasar:

- `pending`
- `waiting_payment`
- `paid`
- `failed`

Kolom order terkait:

- `payment_status`
- `payment_method`
- `payment_reference`
- `payment_url`
- `paid_at`

Mode:

- `PAYMENT_PROVIDER=dev` membuat reference pembayaran lokal/manual.
- `PAYMENT_PROVIDER=midtrans` memakai Snap redirect URL jika `MIDTRANS_SERVER_KEY` ada.
- QRIS memakai e-wallet/QRIS gateway.
- DANA memakai channel DANA jika merchant aktif.
- Webhook Midtrans validasi `signature_key`, lalu set paid untuk `settlement` atau `capture` fraud `accept`.
- Manual/dev confirm tetap ada sebagai fallback.
- Source code/panduan dikunci sampai `payment_status = paid`.
- Rating template hanya diterima jika user punya order paid untuk template itu.

---

## Email, OTP, Queue

- Email verification memakai OTP 6 digit.
- Password reset memakai OTP 6 digit terpisah.
- TTL default: 10 menit.
- SMTP wajib configured.
- Email dikirim async via BullMQ jika `REDIS_URL` ada.
- Jika Redis tidak ada, fallback async lokal agar request tidak menunggu SMTP.

---

## Upload & Image

- Preview image template **tidak boleh** disimpan sebagai base64 di MySQL.
- Admin upload via `POST /api/uploads/images`.
- Jika `CLOUDINARY_URL` tersedia, gambar masuk Cloudinary.
- Jika tidak, fallback local `/uploads`.
- Frontend pakai `ResponsiveImage` untuk lazy loading, responsive sizes, dan Cloudinary srcset otomatis.

---

## UI / Styling Rules

- Layout full width, jangan max-width sempit kecuali konten spesifik butuh.
- Palette warna tinggal di `frontend/src/styles.css` lewat `@theme`.
- Jangan hardcode hex color di `className`.
- Gunakan token:
  - `bg-naki-primary`
  - `bg-naki-secondary`
  - `bg-naki-frost`
  - `bg-naki-steel`
  - `text-naki-primary`
  - `text-naki-secondary`
  - `text-naki-smoke`
  - `border-naki-steel`
  - `shadow-naki-soft`
  - `shadow-naki-card`
- Background utama memakai class global `naki-frosted-grid` dari `frontend/src/styles.css`.
- App harus terasa seperti katalog/template store siap pakai, bukan landing kosong.
- Form status/error utama perlu `aria-live` region.

---

## Fitur Implemented

Core/storefront:

- Katalog template
- Filter kategori
- Search template
- Detail template
- Related templates
- Breadcrumb
- Rating/review buyer
- Wishlist/favorites
- Compare template
- Social sharing/copy link/Web Share API
- Search history/recently viewed
- Blog DB real (`/blog`, `/blog/:slug`)
- PWA baseline + service worker + offline page

User/auth:

- Login/register user
- Admin/user login unified di `/login`
- `next` redirect supported
- Email verification OTP
- Forgot/reset password OTP
- Profile page
- Change username/password
- Delete account with password + email confirmation
- Notification dropdown + unread badge

Admin:

- Admin route `/admin/dashboard`
- CRUD templates
- CRUD categories
- CRUD projects/portfolio
- Blog/tutorial management API
- Order management tab
- Filter/update order status
- Soft delete template/order/project/blog
- Audit trail admin
- Admin stats endpoint: total orders, revenue, orders by status, top templates, recent orders, weekly revenue

Backend/platform:

- MySQL bootstrap schema/migrations
- Sentry integration optional
- Zod env validation
- Health check enhanced with DB/Redis/system metrics
- Swagger/OpenAPI
- Redis cache optional for templates/blog
- Email queue async
- Payment dev + Midtrans Snap/webhook
- Coupons/referrals/bundles schema + endpoints
- Invoice PDF utility via PDFKit
- Integration tests for auth/orders/payments/templates/favorites
- Frontend tests with Vitest/Testing Library
- GitHub Actions CI
- robots.txt + sitemap.xml
- Bundle analyzer: `npm run build:analyze --workspace frontend`

---

## Current Status (2026-06-19)

Pre-launch roadmap/checklist lama sudah terselesaikan secara praktis di code. Dokumen lama punya checkbox `[ ]` yang basi, bukan status nyata.

Done:

- Error monitoring setup (Sentry optional)
- Environment validation (Zod)
- robots.txt + sitemap
- Password strength validation
- Frontend test setup
- Health check enhancement
- Email queue/templates baseline
- Loading skeletons
- Cloudinary/local image URL upload
- Dynamic meta/SEO baseline
- Structured data baseline
- Blog SEO baseline
- Analytics provider abstraction
- PWA/service worker
- Template compare
- CI/CD pipeline
- Error boundary fallback
- Integration tests
- Admin stats/dashboard backend
- Invoice PDF generation utility
- Performance audit completed

Known remaining optimization:

- Main bundle reported around 872 kB in old audit; target <300 kB. Non-blocking for soft launch, but optimize before v1.0.
- Production payment webhook must be configured in Midtrans dashboard and tested on real/sandbox merchant.
- Real production metrics (Lighthouse/RUM/error rate/payment success) still need post-deploy measurement.

---

## Commands

Install/dev:

```bash
npm install
npm run dev
```

Build/test:

```bash
npm run build
npm test
npm test --workspace frontend
npm test --workspace backend
npm run build:analyze --workspace frontend
```

Backend migration/backup:

```bash
npm run migrate --workspace backend
npm run migrate:status --workspace backend
npm run backup:db --workspace backend
npm run backup:list --workspace backend
```

---

## AI Task Checklist / Changelog

- [x] 2026-06-19 — Consolidated project documentation into single summary file and marked old roadmap/checklist docs as obsolete — files: docs/PROJECT_SUMMARY.md
- [x] 2026-06-20 — Security fix: tolak self-checkout untuk pesanan custom tanpa harga template (cegah manipulasi nominal via budget_range yang diisi user); amount kini hanya dari templates.price. Bugfix: endpoint invoice cek payment_status (sebelumnya cek status yang tidak pernah 'paid') — files: backend/src/routes/orders.ts
- [x] 2026-06-21 — Error monitoring: tambah Sentry.captureException() ke semua catch blocks di orders.ts, auth.ts, dan webhook Midtrans di payments.ts untuk pelacakan error di production — files: backend/src/routes/orders.ts, backend/src/routes/auth.ts, backend/src/routes/payments.ts
- [x] 2026-06-21 — Performance improvements: scryptSync → scrypt async (tidak blokir event loop saat hashing password), requireAdmin verifikasi token 1× (sebelumnya 3×), express.json limit 15MB → 1MB (cegah DoS) — files: backend/src/auth.ts, backend/src/routes/auth.ts, backend/src/models/user.model.ts, backend/src/server.ts
- [x] 2026-06-21 — Admin dashboard: buat halaman dashboard admin dengan statistik real-time (total orders, revenue, top templates, recent orders), auto-refresh setiap 30 detik, responsive design dengan Tailwind CSS — files: frontend/src/components/AdminDashboard.tsx, frontend/src/pages/AdminTemplatesPage.tsx
- [x] 2026-06-21 — Error monitoring (lanjutan): tambah Sentry.captureException() ke semua catch blocks di templates.ts, blog-posts.ts, business.ts, categories.ts, favorites.ts, notifications.ts, projects.ts, uploads.ts — files: backend/src/routes/*.ts
- [x] 2026-06-21 — Payment amount tracking: tambah kolom payment_amount ke orders table untuk webhook verification, migration berhasil dijalankan — files: backend/database/migrations/20260621-084842-add-payment-amount-column.sql, backend/src/models/order.model.ts
- [x] 2026-06-21 — Bugfix: auth token verify crash saat token bukan string (TypeError: token.split). Tambah type guard di verifyToken() — files: backend/src/auth.ts
- [x] 2026-06-21 — Fix Vercel serverless: disable express-rate-limit forwarded header validation yang bikin crash 503 di Vercel proxy — files: backend/src/security.ts
- [x] 2026-06-21 — Fix dropdown header admin: link Dashboard admin diarahkan ke /admin/dashboard dan tambah link Kelola template ke /admin/dashboard#templates di desktop/mobile — files: frontend/src/components/Header.tsx, frontend/src/components/__tests__/Header.test.tsx
- [x] 2026-06-21 — Admin dashboard route cleanup: hapus halaman wrapper dashboard duplikat dan jadikan AdminTemplatesPage sebagai halaman tunggal di /admin/dashboard — files: frontend/src/App.tsx, frontend/src/pages/AdminTemplatesPage.tsx, frontend/src/pages/AdminDashboardPage.tsx, frontend/src/components/Header.tsx
- [x] 2026-06-21 — Admin dashboard page: tambah tab Dashboard di /admin/dashboard dengan shortcut Kelola Template, Order Masuk, Kategori, Portofolio plus statistik ringkas tanpa loading API tambahan — files: frontend/src/pages/AdminTemplatesPage.tsx
- [x] 2026-06-24 — Admin improvement backlog #3: normalisasi kategori template dengan templates.category_id foreign key sambil mempertahankan API category string untuk kompatibilitas frontend — files: backend/database/schema.sql, backend/src/db.ts, backend/src/migrations.ts, backend/src/models/template.model.ts, backend/src/models/category.model.ts, backend/src/__tests__/category.model.test.ts, docs/PROJECT_SUMMARY.md
