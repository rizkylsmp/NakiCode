# Naki Code Project Summary

Sumber konteks utama untuk AI/dev saat bekerja di aplikasi Naki Code. File ini dirujuk oleh `AGENTS.md` dan menggantikan dokumentasi project lama yang tersebar di `README.md` maupun `docs/`.

## Instruksi Wajib untuk AI

1. **Baca file ini sebelum mengerjakan task apa pun di repo ini.**
2. **Setelah selesai mengerjakan task**, tambahkan 1 item checklist baru di `docs/CHANGELOG.md`.
3. Format entri changelog wajib:
   - `- [x] YYYY-MM-DD - <ringkasan task selesai> - files: <path penting>`
4. Jika task belum selesai atau ada blocker, tambahkan:
   - `- [ ] YYYY-MM-DD - <task tertunda/blocker> - reason: <alasan>`
5. Jangan hapus entri changelog lama kecuali duplikat/salah.
6. Jika mengubah arsitektur, endpoint, env, workflow, atau fitur besar, update bagian ringkasan terkait di file ini juga.
7. Jangan simpan secret, token, password asli, atau data sensitif di file ini.
8. Gunakan `rtk` untuk operasi shell bila hook mengubah command Bash otomatis.

---

## Identitas Produk

Naki Code adalah penyedia jasa pembuatan website dengan katalog design sebagai referensi awal. Pelanggan memilih arah visual dan fitur yang disukai, lalu tim Naki Code menyesuaikannya dengan identitas brand, konten, dan kebutuhan bisnis pelanggan.

Katalog design berfungsi sebagai inspirasi dan titik awal konsultasi, bukan batas hasil akhir. Pelanggan tetap dapat meminta perubahan tampilan, struktur halaman, fitur, konten, dan integrasi. Source code juga tetap dapat dibeli pada design yang mendukung opsi tersebut.

Catatan istilah teknis: route utama menggunakan `/design` dan API utama menggunakan `/api/designs`. Beberapa tipe/komponen frontend internal dan alias endpoint lama masih berawalan `Template` untuk kompatibilitas API, tetapi schema database sudah memakai istilah **design**. Pada komunikasi dan UI yang dilihat pelanggan, selalu gunakan istilah **design**.

Inspirasi fungsi/menu berasal dari Web Ekspor, tetapi Naki Code **tidak** menyediakan domain, cek domain, atau paket hosting/domain.

Target UX:

- User cepat menemukan design yang sesuai sebagai inspirasi website.
- User bisa filter/search, wishlist, melihat demo/detail, lalu konsultasi atau membeli source code jika tersedia.
- User memahami bahwa design dapat diedit dan dikembangkan sesuai kebutuhan, bukan produk siap pakai yang kaku.
- User memahami perbedaan antara jasa pembuatan website dan opsi pembelian source code.
- Admin mudah mengelola design, kategori, order, blog, portofolio, dan status pembayaran.

---

## Stack & Arsitektur

### Monorepo

- Root npm workspaces: `frontend` dan `backend`.
- Root build: `npm run build`.
- Dev: `npm run dev` atau `dev.cmd` di Windows. Root dev script menghentikan process tree sesi Naki Code lokal sebelumnya agar koneksi MySQL lama dilepas, lalu otomatis memilih port kosong berikutnya jika port default frontend (`5173`) atau backend (`3001`) sedang dipakai dan mengirim `VITE_API_URL`, `PORT`, serta CORS local yang sesuai. Override default local bisa memakai env `FRONTEND_PORT` dan `BACKEND_PORT`.

### Frontend

- React + TypeScript + Vite
- Tailwind CSS v4 (`@theme` di `frontend/src/styles.css`)
- React Router
- TanStack React Query
- `react-helmet-async` untuk meta tags/SEO
- Build frontend menghasilkan HTML prerender untuk route publik statis, kategori, serta detail design/blog ketika `SITEMAP_API_URL` tersedia, lalu memvalidasi metadata dan konten crawlable sebelum selesai.
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
- Cloudinary optional untuk upload gambar dan video preview, fallback local `/uploads`
- Swagger UI di `/api/docs`, OpenAPI JSON di `/api/openapi.json`
- Sentry optional via `SENTRY_DSN`

### Database

- Baseline schema: `backend/database/schema.sql` untuk database kosong.
- Runtime migrations: `backend/src/runtime-migrations.ts` jalan otomatis saat API init/cold start.
- SQL file migrations: `backend/database/migrations/*.sql` dijalankan manual via `npm run migrate:sql --workspace backend`.
- Bootstrap DB: `backend/src/db.ts` -> create database dari `MYSQL_DATABASE`, apply baseline schema, ensure columns, run runtime migrations.
- Data design memakai tabel `designs`, kategori memakai `categories`, dan relasinya melalui `designs.category_id` -> `categories.id`; kolom teks `designs.category` dipertahankan sebagai display fallback.
- Design memiliki `publication_status` (`draft|published`) dan `source_available`; endpoint publik hanya mengembalikan published, sedangkan endpoint admin `/api/designs/admin` juga memuat draft.
- Soft-delete Design mengganti slug internal record terhapus agar slug publiknya dapat digunakan kembali; migrasi runtime juga membebaskan slug dari record lama yang sudah terhapus.
- MySQL wajib tersedia. Backend harus gagal start jika DB init gagal.
- Pool MySQL mode lokal dibatasi hingga 3 koneksi dengan maksimal 1 koneksi idle; shutdown lokal menutup HTTP server dan pool secara graceful untuk mencegah koneksi tertinggal pada database remote.
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
- `GOOGLE_CLIENT_ID` untuk verifikasi ID token login Google; nilainya sama dengan `VITE_GOOGLE_CLIENT_ID` di frontend

Frontend optional:

- `VITE_GOOGLE_CLIENT_ID` untuk menampilkan tombol Google Identity Services di halaman login
- `VITE_SITE_URL` untuk origin canonical metadata SEO (default production `https://nakicode.com`)
- `SITE_URL` untuk origin URL yang dihasilkan oleh script sitemap
- `SITEMAP_API_URL` agar build production dapat menambahkan route detail design dan blog dari API publik ke sitemap
- `VITE_GOOGLE_SITE_VERIFICATION` untuk verifikasi Search Console melalui meta tag bila metode DNS tidak digunakan

Jangan commit `.env`.

---

## Route Frontend Utama

- `/` - home/storefront
- `/design` - katalog design via home element + query kategori/search
- `/design/:slug` - detail design
- `/login` - login/register user + admin
- `/forgot-password` - reset password via OTP email
- `/verify-email` - verifikasi email via OTP
- `/blog` - blog list
- `/blog/:slug` - detail blog
- `/portofolio` - daftar portofolio publik dengan pagination
- `/pesanan-saya` - order user, butuh login
- `/checkout/:orderId` - checkout/payment, butuh login
- `/akun-saya` dan `/profile` - profil user
- `/wishlist` - design favorit user
- `/admin/dashboard`, `/admin/design`, `/admin/orders`, `/admin/coupons`, `/admin/portfolio` - admin panel, butuh role admin

---

## API Backend Utama

Backend mount route di `/api` dan `/api/v1`.

Public/core:

- `GET /api`
- `GET /api/health`
- `GET /api/projects`
- `GET /api/designs`
- `GET /api/designs/:slug`
- `GET /api/categories`
- `GET /api/blog`
- `GET /api/blog/:slug`
- `POST /api/orders`

Auth/user:

- `POST /api/auth/user/register`
- `POST /api/auth/user/login`
- `POST /api/auth/user/google`
- `POST /api/auth/user/verify-email`
- `POST /api/auth/user/resend-otp`
- `POST /api/auth/user/forgot-password`
- `POST /api/auth/user/reset-password`
- `GET /api/auth/user/me`
- `PATCH /api/auth/user/me`
- `DELETE /api/auth/user/me`

Orders/payment:

- `GET /api/orders/my`
- `POST /api/orders/:id/quote/respond`
- `POST /api/orders/:id/payment`
- `POST /api/orders/:id/payment/confirm`
- `PATCH /api/orders/:id/delivery` (admin mengirim demo/source hasil custom)
- `POST /api/orders/:id/delivery/respond` (user approve atau meminta revisi)
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
- `PATCH /api/orders/:id/quote` (admin)
- `POST /api/orders/:id/payment/confirm-lynk` (admin)
- Design/category/project/blog CRUD routes; design memakai `/api/designs` dengan `/api/templates` sebagai alias kompatibilitas sementara
- `GET /api/admin/stats`
- `POST /api/uploads/images` (admin)
- `POST /api/uploads/video` (admin, satu video MP4/WebM/MOV maksimal 50 MB)
- `POST /api/uploads/source` (admin, satu arsip ZIP/RAR valid maksimal 100 MB)
- `POST /api/uploads/revisions` (pengguna login, maksimal lima lampiran masing-masing 20 MB untuk catatan revisi; mendukung gambar, PDF, dokumen Office, teks/data, dan arsip aman)

Business:

- `POST /api/business/coupons/validate`
- `GET /api/business/coupons/banners` - banner coupon aktif, memiliki gambar, belum kedaluwarsa, dan belum habis pemakaian
- Admin coupon CRUD: `GET|POST /api/business/coupons`, `PUT|DELETE /api/business/coupons/:id`
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
- Login Google memakai Google Identity Services di frontend dan verifikasi ID token dengan `GOOGLE_CLIENT_ID` di backend; identitas stabil disimpan pada `users.google_sub`.
- Axios client di `frontend/src/services/api-client.ts` inject `Authorization: Bearer <token>` otomatis.
- Global 401 handler auto logout.
- Backend pakai `helmet`, rate limit global API, auth rate limit lebih ketat, CORS allowlist dari `CLIENT_ORIGINS`.
- Admin action penting masuk `admin_audit_logs`.
- Design/order/project/blog memakai soft delete via `deleted_at`.

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
- `partial_paid`
- `paid`
- `failed`
- `expired`
- `cancelled`

Kolom order terkait:

- `payment_status`
- `payment_method`
- `payment_reference`
- `payment_url`
- `payment_expires_at`
- `order_type`
- `deposit_percent`
- `amount_paid`
- `payment_stage`
- `quote_status`
- `quote_responded_at`
- `paid_at`

Mode:

- `PAYMENT_PROVIDER=dev` membuat reference pembayaran lokal/manual hanya untuk development.
- `PAYMENT_PROVIDER=midtrans` memakai Snap redirect URL jika `MIDTRANS_SERVER_KEY` ada.
- Production gagal start jika provider bukan Midtrans atau `MIDTRANS_SERVER_KEY` kosong; webhook tanpa server key atau signature valid selalu ditolak.
- Deployment Vercel production (`VERCEL_ENV=production`) selalu memakai endpoint Midtrans live; preview dan development tetap sandbox kecuali `MIDTRANS_IS_PRODUCTION=true` diaktifkan eksplisit.
- Checkout menyediakan dua provider: Midtrans dan Lynk.
- Midtrans mendukung QRIS/DANA, kupon khusus pembelian source code, serta pembaruan status otomatis melalui webhook.
- Sesi Midtrans dan pembayaran development memakai batas waktu eksplisit 24 jam yang disimpan pada `orders.payment_expires_at` serta `order_payment_sessions.expires_at`. Checkout dan Pesanan Saya menampilkan tanggal WIB dan countdown; setelah waktunya lewat, URL lama ditutup dan pengguna dapat membuat reference baru.
- Pesanan Saya dan Checkout memeriksa ulang transaksi `waiting_payment` ke Midtrans Get Status API ketika halaman dimuat serta setiap 15 detik selama masih menunggu. Rekonsiliasi ini menghentikan countdown dan memperbarui status paid/expired/cancelled/failed meskipun webhook Sandbox tidak dapat menjangkau localhost; webhook tetap menjadi mekanisme utama di production.
- Untuk DANA Sandbox yang tidak dapat dicari melalui `order_id`, rekonsiliasi lokal memakai token dari URL Snap tepercaya sebagai fallback status, lalu tetap memvalidasi `order_id` dan nominal sebelum mencatat settlement. Fallback token ini dibatasi ke host Sandbox dan tidak menggantikan webhook production.
- Satu order hanya boleh memiliki satu sesi pembayaran aktif; pembuatan sesi diserialisasi dengan database advisory lock agar reference lama tidak tertimpa oleh request paralel.
- Order dipisahkan menjadi `source_purchase` dan `custom_project`; tipe ini menentukan harga, tahap pembayaran, penggunaan kupon, dan hak akses delivery.
- Pembelian source code memakai harga katalog, dibayar penuh dalam satu tahap, dan baru membuka source/panduan setelah lunas.
- Proyek website custom wajib memiliki penawaran admin yang diterima pengguna. Pada pembayaran awal, pengguna memilih DP tetap 50% atau langsung lunas; nominal dihitung backend dari penawaran. Kedua pilihan memindahkan order ke Pengerjaan. Saat mengirim hasil ke Review, admin wajib menyertakan source code final melalui upload ZIP/RAR atau URL dan dapat menambahkan URL demo. Pengguna dapat approve atau meminta revisi dengan catatan dan maksimal lima lampiran (gambar, PDF, dokumen Office, teks/data, atau arsip). Approve menentukan status dari total settlement aktual, bukan label pembayaran: skema DP selalu membuka tahap Pelunasan, sedangkan order yang sudah dibayar penuh langsung Selesai. Source final disimpan selama Review tetapi URL-nya tidak dikirim melalui API pelanggan dan baru terbuka di Selesai; revisi mengembalikan order ke Pengerjaan tanpa mengubah ledger pembayaran.
- Pembelian source code memakai satu pembayaran penuh dan otomatis masuk status Selesai setelah settlement; paket source dan panduan langsung terbuka.
- Setiap percobaan pembayaran tersimpan di `order_payment_sessions` dengan reference unik, tahap `full`/`deposit`/`balance`, nominal, status, dan metadata webhook. Kolom pembayaran di `orders` tetap menjadi snapshot sesi terbaru untuk kompatibilitas.
- Webhook `expire` dan `cancel` dipertahankan sebagai status `expired` dan `cancelled`, bukan digabung menjadi gagal. Ketiganya dapat membuat sesi pembayaran baru; untuk proyek yang DP-nya sudah diterima, retry hanya menagih sisa pelunasan.
- Pesanan Saya menyediakan status bar ringkas berikon untuk menu workflow Pengerjaan, Review, Pelunasan, dan Selesai selain filter pembayaran; deskripsi kontekstual hanya ditampilkan untuk menu aktif, dan navigasi dapat digeser horizontal pada mobile. Pengerjaan memuat proyek custom aktif termasuk revisi, Review memuat hasil yang menunggu approve/revisi pengguna, Pelunasan memuat hasil yang sudah disetujui dan siap dibayar sisanya, sedangkan Selesai hanya memuat order berstatus completed. Menu Dibatalkan tetap memuat order maupun transaksi pembayaran yang dibatalkan. Transaksi gagal, kedaluwarsa, atau dibatalkan pada order yang masih aktif menampilkan aksi pembayaran ulang; order yang dibatalkan admin harus diaktifkan kembali oleh admin sebelum dapat dibayar.
- Penawaran tidak dapat diubah saat pembayaran aktif atau setelah DP tercatat.
- Kupon direservasi saat sesi pembayaran dibuat, dihitung terhadap kuota selama masih aktif, menjadi redeemed setelah paid, dan dilepas saat gagal, kedaluwarsa, ditolak, atau order dibatalkan.
- Lynk hanya tersedia untuk pembelian penuh source code, memakai `templates.lynk_url` per design, hanya menerima URL HTTPS pada domain `lynk.id`, dan mencatat sesi checkout eksternal pada order. DP/pelunasan custom wajib memakai Midtrans agar nominal dinamisnya tervalidasi gateway.
- Tombol `via Lynk` mewajibkan login, membuat order internal terlebih dahulu, lalu mencatat sesi Lynk berstatus `waiting_payment` sebelum redirect; order langsung tampil di Pesanan Saya.
- Transaksi Lynk dikonfirmasi melalui aksi admin khusus sebelum invoice, pembukuan, notifikasi, dan akses delivery dibuka.
- QRIS memakai e-wallet/QRIS gateway.
- DANA memakai channel DANA jika merchant aktif.
- Webhook Midtrans validasi `signature_key`, lalu set paid untuk `settlement` atau `capture` fraud `accept`.
- Manual confirm hanya menerima sesi berlabel dev dan ditolak pada production.
- Perubahan status order mengikuti transition map; lompatan status berbahaya dan pembatalan saat pembayaran aktif/lunas ditolak backend.
- Source code/panduan hanya tersedia untuk order `source_purchase` dengan `payment_status = paid`; pembayaran proyek custom tidak pernah membuka paket source.
- Rating design baru ditampilkan dan diterima API jika user memiliki order design berstatus paid serta workflow-nya sudah Selesai (`completed`/`closed`); tahap Review dan Pelunasan belum dapat mengirim rating.

---

## Email, OTP, Queue

- Email verification memakai OTP 6 digit.
- Password reset memakai OTP 6 digit terpisah.
- TTL default: 10 menit.
- SMTP wajib configured.
- Email dikirim async via BullMQ jika `REDIS_URL` ada.
- Jika Redis tidak ada, fallback async lokal agar request tidak menunggu SMTP.

---

## Upload Media

- Preview image design **tidak boleh** disimpan sebagai base64 di MySQL.
- Form Design memakai satu drop zone media untuk gambar dan video melalui browse, drag & drop, atau paste; tipe file dipilah otomatis ke endpoint upload yang sesuai. Upload tetap berjalan ketika admin berpindah tab, statusnya tampil persisten pada header modal, dan penyimpanan Design menunggu upload selesai.
- Input Design memakai wizard empat langkah (Informasi, Media, Detail, Penjualan), auto-slug, validasi per langkah, progres kelengkapan, autosave draft lokal, peringatan perubahan belum disimpan, status draft/published, opsi source dijual, dan aksi duplikasi sebagai draft. Checkout langsung ditolak oleh backend ketika source design tidak dijual.
- Gambar admin diupload via `POST /api/uploads/images`.
- Design dapat memiliki satu `video_url` opsional. Admin menguploadnya melalui `POST /api/uploads/video`; card katalog memprioritaskan video muted/autoplay/loop dan memakai gambar pertama sebagai poster serta fallback.
- Jika `CLOUDINARY_URL` tersedia, gambar dan video masuk Cloudinary (video sebagai resource video); jika tidak, semua media fallback ke local `/uploads`.
- Source ZIP/RAR diupload nyata maksimal 100 MB ke Cloudinary raw atau `/uploads/source`; ekstensi dan signature arsip divalidasi sebelum disimpan. Pengiriman hasil proyek custom memakai uploader yang sama untuk source final, lalu menahan URL unduhan dari pelanggan sampai order lunas dan berstatus Selesai.
- Frontend pakai `ResponsiveImage` untuk lazy loading, responsive sizes, dan Cloudinary srcset otomatis.

---

## UI / Styling Rules

- Responsive dimulai dari lebar 320px. Layout publik memakai padding mobile ringkas, media tidak boleh melewati container, dan judul/aksi harus dapat wrap tanpa horizontal page scroll.
- Admin memakai sidebar tetap mulai breakpoint `lg`; pada layar lebih kecil navigasi memakai tombol sticky yang membuka drawer ber-overlay lengkap dengan indikator menu aktif, profil admin, dan dukungan Escape. Modal form besar berubah menjadi surface full-screen pada mobile lalu kembali menjadi dialog pada `sm` ke atas.
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
- Dropdown native memakai standar global `select:not([multiple])` di `frontend/src/styles.css` agar chevron, border, hover, focus, disabled, dan dark mode konsisten tanpa styling browser bawaan.
- App harus terasa seperti katalog jasa pembuatan website berbasis design referensi, bukan katalog produk siap pakai atau landing kosong.
- Form status/error utama perlu `aria-live` region.

---

## Fitur Implemented

Core/storefront:

- Katalog design
- Filter kategori
- Search design
- Pencarian design live dari header berdasarkan nama, kategori, deskripsi, dan teknologi
- Detail design
- Related designs
- Breadcrumb
- Rating/review buyer
- Wishlist/favorites
- Galeri preview design dengan carousel thumbnail dan lightbox overlay
- Halaman portofolio publik dengan pagination server-side dan aksi Preview/View, dengan preview capture bergaya masonry/Pinterest
- Alur jasa tiga langkah di beranda: pilih design, konsultasi, lalu website disiapkan
- Social sharing/copy link/Web Share API
- Search history/recently viewed
- Blog DB real (`/blog`, `/blog/:slug`)
- PWA baseline + service worker + offline page

User/auth:

- Login/register user
- Login atau daftar otomatis melalui Google Identity Services
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
- CRUD design
- CRUD categories dengan jumlah design aktif per kategori dan tooltip judul design saat indikator jumlah diarahkan atau difokuskan; kategori yang masih dipakai tidak dapat dihapus sampai seluruh design dipindahkan ke kategori lain
- CRUD projects/portfolio dengan multi-foto, cover selection, dan preview asset
- Blog/tutorial management API
- Order management tab
- Filter, pencarian server-side, update individual, dan bulk workflow order
- Workflow jasa: baru, dihubungi, penawaran, menunggu DP, dikerjakan, revisi, diserahkan, selesai, atau dibatalkan
- Penawaran harga admin untuk order custom beserta persentase DP sebelum pelanggan checkout
- Pembukuan kas admin dengan dropdown periode (bulan ini, bulan lalu, 30 hari, tahun ini, atau tanggal custom), filter jenis transaksi, statistik pemasukan/pengeluaran/refund/laba-rugi, pengeluaran manual, refund parsial/penuh, serta ekspor CSV/PDF. Pembayaran penuh, DP, dan pelunasan masing-masing diakui sebagai pemasukan setelah berhasil; webhook dan konfirmasi lokal mencatat setiap reference secara idempoten, sedangkan pembukaan halaman pembukuan merekonsiliasi pembayaran lama yang belum memiliki transaksi kas.
- Invoice bernomor stabil dengan snapshot pelanggan dan total order; proyek custom berstatus parsial setelah DP dan lunas setelah pelunasan, serta order bertransaksi tidak dapat dihapus
- Soft delete design/order/project/blog
- Audit trail admin
- Admin stats endpoint: total orders, revenue, orders by status, top designs, recent orders, weekly revenue

Backend/platform:

- MySQL bootstrap schema/migrations
- Sentry integration optional
- Zod env validation
- Health check enhanced with DB/Redis/system metrics
- Swagger/OpenAPI
- Redis cache optional for templates/blog
- Email queue async
- Payment dev + Midtrans Snap/webhook
- Coupon management/validation/redemption dan bundle endpoints
- Banner promo coupon bergambar yang tampil sekali per rangkaian banner aktif pada setiap browser dan otomatis menjadi slider saat lebih dari satu banner tersedia
- Invoice PDF utility via PDFKit
- Integration tests for auth/orders/payments/templates/favorites
- Frontend tests with Vitest/Testing Library
- GitHub Actions CI
- robots.txt + sitemap.xml
- HTML prerender publik + validasi SEO output pada build
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
- [x] Task 5 - Tingkatkan SEO dan conversion katalog: schema product/review, CTA detail design, related designs, dan halaman kategori indexable.
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
