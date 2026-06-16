@C:\Users\ACER\.codex\RTK.md

# Naki Code Project Memory

Gunakan file ini sebagai konteks tetap untuk sesi Codex berikutnya.

## Identitas Produk

Naki Code adalah toko template coding dan jasa custom website. Produk utamanya adalah template siap pakai untuk:

- Portfolio
- E-commerce
- Top up games
- Web Bucin
- CRUD
- Company profile
- Pesanan custom

Inspirasi fungsi dan menu berasal dari Web Ekspor, tetapi Naki Code tidak menyediakan domain, cek domain, atau paket hosting/domain.

## Stack

- Frontend: React, TypeScript TSX, Vite, Tailwind CSS
- Backend: Express, TypeScript, MySQL via mysql2
- Monorepo npm workspaces: `frontend` dan `backend`
- Backend memakai model/repository manual di `backend/src/models/*`; route tidak langsung menulis query MySQL.
- Backend bootstrap MySQL saat start lewat `initializeDatabase()` di `backend/src/db.ts`, memakai `MYSQL_DATABASE` dari `.env` dan schema `backend/database/schema.sql`.
- Backend tidak memakai fallback seed lokal. Jika MySQL gagal init, server harus gagal start.

## Prinsip UI

- Layout full width, bukan max-width sempit.
- Palette warna harus didefinisikan di `frontend/src/styles.css` lewat `@theme`.
- Jangan hardcode hex color di `className`; gunakan token seperti `bg-naki-primary`, `text-naki-secondary`, `border-naki-steel`, dan seterusnya.
- Background utama memakai texture CSS `naki-frosted-grid` untuk efek Frosted Grid + Glass Noise.
- Naki Code harus terasa seperti katalog/template store yang siap dipakai, bukan landing page kosong.
- Preview image template tidak boleh disimpan sebagai base64 di MySQL. Admin upload harus menghasilkan URL dari `/api/uploads/images`; production bisa memakai Cloudinary lewat `CLOUDINARY_URL`.

## Workflow Produk

Alur utama aplikasi:

1. User cari template.
2. User filter berdasarkan kategori.
3. User lihat detail/preview template.
4. User pilih template.
5. User lanjut beli atau konsultasi custom.
6. Admin mengelola template, kategori, pesanan, blog/tutorial, FAQ, dan portofolio.

Status implementasi penting:

- Route home: `/`
- Route detail template: `/templates/:slug`
- Route checkout: `/checkout/:orderId`
- Route admin template: `/admin/templates`
- Login admin dan user sudah disatukan lewat `/login`; admin adalah user dengan `role = 'admin'`.
- Login/signup memakai redirect `next`: admin sukses login ke `/admin/templates`, user sukses login/OTP ke `next` atau `/`.
- Lupa password tersedia di `/forgot-password`, memakai OTP email dan endpoint reset password.
- Detail template punya form konsultasi yang submit ke `POST /api/orders`.
- Detail template punya related templates dari kategori yang sama.
- Admin `/admin/templates` punya tab Template dan Order.
- Admin bisa update status order dari tab Order.
- Admin bisa filter order berdasarkan status: semua, new, contacted, deal, closed.
- Query backend untuk template, order, kategori, dan project dipisah ke model manual.
- User bisa menghapus akun dari profil lewat validasi password aktif dan konfirmasi email.
- User bisa menyimpan template ke wishlist dan melihatnya di `/wishlist`.
- Header user punya dropdown notifikasi untuk update order/payment.
- Template detail memakai breadcrumb dan menampilkan review buyer tertulis dari rating.
- Admin order dan `Pesanan Saya` memakai pagination server-side dari endpoint orders.
- Template dan order memakai soft delete lewat kolom `deleted_at`; audit admin masuk ke `admin_audit_logs`.
- Email OTP dikirim async lewat BullMQ jika `REDIS_URL` tersedia, fallback async lokal jika belum ada Redis.
- HomePage dan TemplateDetailPage sudah lazy-loaded.
- Gambar template memakai lazy loading, responsive sizes, dan srcset Cloudinary otomatis lewat `ResponsiveImage`.
- Blog adalah data DB nyata lewat `/blog` dan `/blog/:slug`.
- Checkout mendukung coupon validation dan referral tracking.
- API tersedia di `/api` dan `/api/v1`, dengan Swagger di `/api/docs`.
- Redis caching layer opsional lewat `REDIS_URL`.
- PWA baseline sudah ada lewat manifest dan service worker.
- Bundle analyzer tersedia lewat `npm run build:analyze --workspace frontend`.
- Payment production memakai endpoint webhook `POST /api/payments/midtrans/webhook` untuk auto update status paid dari Midtrans.
- Frontend memakai React Query provider untuk cache data katalog dan `react-helmet-async` untuk meta tags.

## Gap Analysis & Improvement Areas

Berdasarkan eksplorasi komprehensif terhadap codebase (Juni 2026), ditemukan beberapa area yang perlu improvement sebelum production launch. Gap analysis lengkap tersedia di `docs/GAP_ANALYSIS.md`.

### Critical Priority
- Image storage optimization (pindah dari base64 MySQL ke Cloudinary/S3)
- Payment webhook implementation untuk auto-confirm Midtrans
- Error monitoring & logging system

### High Priority
- Caching strategy (React Query + HTTP cache headers)
- SEO optimization (dynamic meta tags, structured data, sitemap)
- Accessibility improvements (color contrast fixes)
- Related templates section di detail page
- ESLint + Prettier + pre-commit hooks
- Database migration system (pengganti ad-hoc `ensureColumn`)

### Medium Priority
- Wishlist/favorites feature enhancement
- Notification system untuk order updates
- Email queue dengan BullMQ
- Soft delete audit trail
- Analytics tracking (Umami/Plausible)
- Performance optimization (lazy loading, image optimization)

### Low Priority (Post-Launch)
- Template comparison feature
- Search history & recently viewed
- Social sharing buttons
- Real blog system (DB-based CRUD)
- API versioning enhancement
- Coupon & affiliate system
- Dark mode support

**Roadmap 8-minggu pre-launch tersedia di `docs/ROADMAP.md`.**

## Pre-Launch Context (Juni 2026)

- **Timeline:** 2 bulan ke soft launch
- **Resources:** Solo developer
- **Budget:** Bootstrap (free tier services only)
- **Focus:** Production readiness, core UX, SEO foundation

Detail workflow ada di `docs/PROJECT_WORKFLOW.md`.
