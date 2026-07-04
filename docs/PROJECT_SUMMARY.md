# Naki Code Project Summary

Konteks tunggal untuk AI/dev saat bekerja di aplikasi Naki Code. File ini menggantikan `README.md`, `AGENTS.md`, dan dokumen lama di `docs/`.

## Instruksi Wajib untuk AI

1. **Baca file ini sebelum mengerjakan task apa pun di repo ini.**
2. **Setelah selesai mengerjakan task**, tambahkan 1 item checklist baru di bagian **AI Task Checklist / Changelog**.
3. Format checklist wajib:
   - `- [x] YYYY-MM-DD - <ringkasan task selesai> - files: <path penting>`
4. Jika task belum selesai atau ada blocker, tambahkan:
   - `- [ ] YYYY-MM-DD - <task tertunda/blocker> - reason: <alasan>`
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
- Struktur `frontend/src`: `app` untuk application shell/router, `contexts` untuk global state, `domain` untuk model/data bisnis, `services` untuk integrasi eksternal, `utils` untuk helper murni, `hooks` untuk custom hooks, serta `components` dan `pages` untuk UI.
- Root `frontend/src` hanya menyimpan entry/global files: `main.tsx`, `styles.css`, dan `vite-env.d.ts`.

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

- Baseline schema: `backend/database/schema.sql` untuk database kosong.
- Runtime migrations: `backend/src/runtime-migrations.ts` jalan otomatis saat API init/cold start.
- SQL file migrations: `backend/database/migrations/*.sql` dijalankan manual via `npm run migrate:sql --workspace backend`.
- Bootstrap DB: `backend/src/db.ts` -> create database dari `MYSQL_DATABASE`, apply baseline schema, ensure columns, run runtime migrations.
- Kategori template dinormalisasi via `templates.category_id` -> `template_categories.id`; `templates.category` masih dipertahankan sebagai compatibility/display fallback.
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

- `/` - home/storefront
- `/template` - katalog via home element + query kategori/search
- `/templates/:slug` - detail template
- `/login` - login/register user + admin
- `/forgot-password` - reset password via OTP email
- `/verify-email` - verifikasi email via OTP
- `/blog` - blog list
- `/blog/:slug` - detail blog
- `/pesanan-saya` - order user, butuh login
- `/checkout/:orderId` - checkout/payment, butuh login
- `/akun-saya` dan `/profile` - profil user
- `/wishlist` - template favorit user
- `/compare` - compare 2-3 template
- `/admin/dashboard`, `/admin/templates`, `/admin/orders`, `/admin/portfolio` - admin panel, butuh role admin

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
- Frontend menyimpan token di localStorage lewat `frontend/src/utils/user-session.ts`.
- Axios client di `frontend/src/services/api-client.ts` inject `Authorization: Bearer <token>` otomatis.
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

- Main app entry sudah turun ke 35.47 kB minified setelah route/code splitting dan vendor chunking pada 2026-07-03. Lanjutkan audit lazy loading halaman/komponen baru sebelum v1.0.
- Production payment webhook must be configured in Midtrans dashboard and tested on real/sandbox merchant.
- Real production metrics (Lighthouse/RUM/error rate/payment success) still need post-deploy measurement.

Improvement backlog:

- [x] Task 1 - Kurangi bundle frontend dengan route-level/code splitting untuk halaman dan modul berat.
- [x] Task 2 - Rapikan CI/test coverage agar root test menjalankan frontend dan backend; test frontend saat ini perlu provider wrapper untuk Header/Auth/QueryClient.
- [x] Task 3 - Siapkan production payment readiness: webhook sandbox, idempotency, logging failure, dan dashboard alasan gagal bayar.
- [x] Task 4 - Polish admin UX: bulk action, table density, keyboard-friendly search/filter, dan state kosong/error konsisten.
- [x] Task 5 - Tingkatkan SEO dan conversion katalog: schema product/review, CTA detail template, related templates, dan halaman kategori indexable.
- [ ] Task 6 - Perkuat observability production dengan release tagging, request ID, structured logs, dan health dashboard kecil.

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

Backend SQL file migration/backup:

```bash
npm run migrate:sql --workspace backend
npm run migrate:sql:status --workspace backend
npm run backup:db --workspace backend
npm run backup:list --workspace backend
npm run payment:webhook:sandbox --workspace backend -- <payment_reference> <settlement|pending|deny|cancel|expire|failure> <amount> [webhook_url]
```

---

## AI Task Checklist / Changelog

- [x] 2026-07-04 - Hardening admin kategori dan testimoni: sinkronisasi state kategori setelah mutasi, validasi API testimonial dengan Zod, cegah testimonial dari review kosong, stabilkan reorder saat filter aktif, tampilkan loading testimoni, perbaiki pesan error API, dan longgarkan delete kategori yang hanya direferensikan design soft-delete - files: backend/src/models/category.model.ts, backend/src/models/testimonial.model.ts, backend/src/routes/testimonials.ts, frontend/src/pages/AdminTemplatesPage.tsx, frontend/src/pages/admin/AdminCategoriesSection.tsx, frontend/src/pages/admin/AdminTestimonialsSection.tsx, frontend/src/services/api-client.ts, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Task 1 bundle optimization frontend: lazy load auth/not-found routes, defer Sentry, split vendor chunks, dan ganti zxcvbn frontend dengan strength heuristic ringan; main entry turun dari 926.56 kB ke 35.47 kB - files: frontend/src/App.tsx, frontend/src/main.tsx, frontend/src/ErrorBoundary.tsx, frontend/src/components/PasswordStrengthIndicator.tsx, frontend/vite.config.ts, frontend/vite.config.js, frontend/package.json, package-lock.json, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Task 2 CI/test coverage: root npm test menjalankan frontend dan backend, test frontend memakai provider wrapper Auth/QueryClient/Router, webhook payment test backend diisolasi dari bootstrap DB, dan backend typecheck CI dibersihkan; root test lulus 122 test - files: package.json, frontend/package.json, .github/workflows/ci.yml, frontend/src/test/render.tsx, frontend/src/test/setup.ts, frontend/src/pages/__tests__/UserLoginPage.test.tsx, frontend/src/components/__tests__/Header.test.tsx, backend/src/__tests__/payments.integration.test.ts, backend/package.json, backend/src/routes/uploads.ts, backend/src/security.ts, backend/src/server.ts, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Task 3 production payment readiness: tambah tabel payment_webhook_events untuk idempotency webhook Midtrans, simpan failure reason/code/last webhook di orders, tambah script sandbox signed webhook, tampilkan alasan pembayaran gagal di admin dashboard/orders, dan stabilkan test single-worker; root test lulus 123 test - files: backend/database/schema.sql, backend/src/db.ts, backend/src/migrations.ts, backend/src/models/order.model.ts, backend/src/models/payment-webhook-event.model.ts, backend/src/routes/payments.ts, backend/src/routes/orders-stats.ts, backend/src/scripts/midtrans-webhook-sandbox.ts, backend/src/__tests__/payments.integration.test.ts, backend/src/__tests__/templates.integration.test.ts, backend/package.json, frontend/package.json, frontend/src/order-types.ts, frontend/src/pages/admin/OrdersPanel.tsx, frontend/src/pages/admin/AdminDashboardHome.tsx, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Task 4 admin UX polish: tambah selection dan bulk status update di Orders, density switch comfort/compact, search current page dengan Escape-to-clear, status/empty state konsisten, dan template search reset yang keyboard-friendly - files: frontend/src/pages/admin/OrdersPanel.tsx, frontend/src/pages/admin/TemplatesPanel.tsx, frontend/src/pages/admin/AdminTemplateWorkspace.tsx, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Task 5 SEO dan conversion katalog: tambah route kategori indexable `/template/kategori/:categorySlug`, canonical/meta/ItemList/Breadcrumb schema untuk katalog, Product review schema dan breadcrumb kategori di detail template, related templates berbasis kategori/stack, CTA trust list di sidebar checkout, serta sitemap kategori; build frontend lulus - files: frontend/src/App.tsx, frontend/src/template-url.ts, frontend/src/pages/TemplateCatalogPage.tsx, frontend/src/pages/TemplateDetailPage.tsx, frontend/src/components/TemplateFilterBar.tsx, frontend/src/components/TemplateCatalog.tsx, frontend/scripts/generate-sitemap.mjs, frontend/public/sitemap.xml, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Admin testimoni polish: tambah summary, pencarian, filter status/sumber, tombol refresh dan status loading di menu Testimoni; label admin dilokalkan, z-index modal diperbaiki, chart tooltip dashboard dibuat lint-safe, dan backend testimonial soft-delete tidak lagi muncul di endpoint public/available rating - files: frontend/src/pages/admin/AdminTestimonialsSection.tsx, frontend/src/pages/AdminTemplatesPage.tsx, frontend/src/components/admin/AdminSidebar.tsx, frontend/src/pages/admin/AdminDashboardPage.tsx, frontend/src/pages/admin/AdminTemplateWorkspace.tsx, backend/src/models/testimonial.model.ts, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Normalisasi karakter Unicode di dokumentasi ke ASCII agar changelog dan project summary tidak tampil mojibake di terminal Windows/RTK - files: docs/CHANGELOG.md, docs/PROJECT_SUMMARY.md
