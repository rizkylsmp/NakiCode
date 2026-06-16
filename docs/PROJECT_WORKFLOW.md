# Naki Code Project Workflow

Dokumen ini menyimpan arah produk, menu, fitur, dan aturan kerja agar konteks proyek tetap konsisten di sesi berikutnya.

## Ringkasan Produk

Naki Code adalah aplikasi toko template coding. Pengunjung bisa mencari template website berdasarkan kategori, melihat demo/detail, lalu membeli template atau meminta custom.

Target pengalaman pengguna:

- Cepat menemukan template yang cocok.
- Mudah membandingkan kategori dan harga.
- Jelas mana template siap pakai dan mana layanan custom.
- Ada jalur konsultasi untuk kebutuhan yang belum cocok dengan katalog.

## Referensi Fungsi

Web rujukan: `https://www.webekspor.com/`

Fungsi yang diadaptasi:

- Navigasi katalog dan layanan.
- Katalog desain/template.
- Halaman layanan per kategori.
- Portofolio.
- Komunitas atau benefit member.
- Tutorial.
- FAQ.
- Blog.
- CTA konsultasi WhatsApp.
- Login panel/admin.

Fungsi yang tidak diambil:

- Cari domain.
- Paket domain `.com`, `.id`, `.co.id`.
- Cek ketersediaan domain.
- Pembelian domain atau hosting.

## Menu Publik

Menu utama yang disarankan:

- Cari Template
- Layanan
- Portofolio
- Komunitas
- Tutorial
- Pertanyaan
- Blog
- Login
- Profil saya, untuk melihat akun terhubung, verifikasi email, ubah nama, dan ganti password.
- Pesanan Saya, muncul di dropdown akun user setelah login.
- Wishlist, untuk menyimpan template dan dibuka lagi nanti.
- Notifikasi akun, muncul sebagai badge di header setelah login.
- Compare template, social sharing, search history, dan recently viewed.

Dropdown `Layanan`:

- Template Website
- Website Portfolio
- Website E-commerce
- Website Top Up Games
- Website Bucin
- CRUD / Admin Input Data
- Company Profile
- Pesanan Custom

## Halaman Publik

### Home

Tujuan: memperkenalkan Naki Code sebagai toko template coding.

Bagian utama:

- Promo bar atau trust message.
- Header navigasi.
- Hero dengan search template.
- Kategori template.
- Koleksi template pilihan.
- Layanan utama.
- Cara beli.
- Testimoni.
- Portofolio singkat.
- Tutorial/blog terbaru.
- FAQ singkat.
- CTA konsultasi.
- Footer.

### Cari Template

Tujuan: katalog utama.

Fitur:

- Search template.
- Filter kategori.
- Sort harga/populer/terbaru.
- Grid template.
- Badge stack teknologi.
- Rating atau jumlah pembeli.
- Tombol `Lihat Demo`.
- Tombol `Beli` atau `Pilih`.
- Tombol wishlist/favorite untuk menyimpan template.
- Cuplikan review buyer jika sudah ada rating tertulis.
- Compare side-by-side untuk 2-3 template.

### Detail Template

Tujuan: membantu user yakin sebelum beli.

Konten:

- Nama template.
- Kategori.
- Harga.
- Stack.
- Screenshot/preview.
- Fitur template.
- Isi file/source code.
- Cocok untuk siapa.
- Lisensi penggunaan.
- FAQ template.
- CTA beli dan konsultasi custom.
- Breadcrumb `Home > Kategori > Template`.
- Review buyer tertulis dari rating pembeli.
- Tombol share ke WhatsApp, X/Twitter, Web Share API, dan copy link.

### Layanan

Tujuan: menjelaskan jenis solusi yang bisa dibeli.

Layanan:

- Template siap pakai.
- Custom landing page.
- Custom toko online.
- Custom top up games.
- Custom CRUD/admin input data.
- Custom company profile.
- Integrasi backend/API.

### Portofolio

Tujuan: bukti kualitas.

Konten:

- Project template demo.
- Project custom.
- Kategori industri.
- Ringkasan fitur.
- Link demo jika ada.
- Data portofolio disimpan di tabel `projects` dan dikelola dari admin.

### Komunitas

Tujuan: benefit setelah membeli.

Konten:

- Grup diskusi.
- Update template.
- Bantuan instalasi.
- Sharing coding.
- Promo member.

### Tutorial

Tujuan: edukasi pembeli.

Topik:

- Cara beli template.
- Cara install project React/Vite.
- Cara setup backend Express.
- Cara import database MySQL.
- Cara deploy frontend.
- Cara custom warna dan konten.

### FAQ

Topik minimal:

- Apa itu Naki Code?
- Apa yang didapat setelah beli template?
- Apakah mendapat source code?
- Apakah bisa request custom?
- Apakah ada revisi?
- Apakah bisa dipakai untuk client?
- Bagaimana cara pembayaran?
- Bagaimana support setelah beli?

### Blog

Tujuan: konten edukasi dan SEO.

Topik:

- Ide website untuk pemula.
- Perbandingan React dan framework lain.
- Tips membuat portfolio developer.
- Cara membuat toko online sederhana.
- Cara membuat website top up games.

## Alur User

Alur pilih template:

1. User masuk home.
2. User mencari atau memilih kategori template.
3. User membuka detail template.
4. User melihat demo dan daftar fitur.
5. User bisa menyimpan template ke wishlist untuk dibuka lagi nanti.
6. Search history dan recently viewed membantu user kembali ke template sebelumnya.
7. User bisa membandingkan 2-3 template dari katalog.
8. User login atau daftar akun pembeli.
9. User memilih salah satu cara order:
   - `Konsultasi via WhatsApp`: user diarahkan ke WhatsApp dengan pesan template terkait.
   - `Beli langsung`: user mengisi kontak checkout, website membuat order, lalu user diarahkan ke `/checkout/:orderId`.
10. Order masuk ke menu `Pesanan Saya`.
11. User memilih metode pembayaran di halaman checkout: QRIS, DANA, atau manual/dev.
12. User bisa memasukkan coupon code dan referral/affiliate code di checkout.
13. Setelah sesi pembayaran dibuat, frontend otomatis membuka URL gateway di tab baru; jika browser memblokir tab baru, user tetap bisa membuka link bayar dari tombol `Buka halaman bayar`.
14. User menyelesaikan pembayaran dari URL gateway atau instruksi dev/manual.
15. User menerima notifikasi saat order dibuat, status berubah, atau pembayaran terkonfirmasi/gagal.
16. Setelah payment status `paid`, user bisa memberi rating template.
17. Setelah payment status `paid`, user menerima akses source code dan panduan dari detail template.

Alur pembayaran saat ini:

- Backend menyimpan `payment_status`, `payment_method`, `payment_reference`, `payment_url`, dan `paid_at` di tabel `orders`.
- Status pembayaran dasar: `pending`, `waiting_payment`, `paid`, `failed`.
- Backend memiliki payment service di `backend/src/payments/payment.service.ts`.
- Mode default `PAYMENT_PROVIDER=dev` membuat reference pembayaran tanpa credential eksternal.
- Mode `PAYMENT_PROVIDER=midtrans` memakai Snap redirect URL jika `MIDTRANS_SERVER_KEY` sudah diisi.
- QRIS memakai flow e-wallet/QRIS gateway, DANA memakai channel DANA jika akun merchant provider sudah aktif.
- Midtrans production memakai webhook `POST /api/payments/midtrans/webhook`.
- Webhook Midtrans memvalidasi `signature_key` dan mengubah order menjadi `paid` untuk status `settlement` atau `capture` dengan fraud `accept`.
- Endpoint user:
  - `GET /api/orders/my` untuk melihat pesanan sendiri.
  - `POST /api/orders/:id/payment` untuk membuat instruksi pembayaran, menerima body `method` berisi `qris`, `dana`, atau `manual`.
  - `POST /api/orders/:id/payment/confirm` untuk konfirmasi pembayaran manual/dev.
- Integrasi gateway nyata seperti Midtrans/Xendit bisa mengganti endpoint konfirmasi manual dengan webhook provider.
- Delivery source code dan panduan di response order dikunci sampai `payment_status = paid`.
- Rating template hanya diterima backend jika user punya order `paid` untuk template tersebut.
- Coupon/discount divalidasi lewat `POST /api/business/coupons/validate`.
- Referral/affiliate click tracking memakai `POST /api/business/referrals/:code/click`.
- Template bundle tersedia lewat `GET /api/business/bundles`.
- Preview image template disimpan sebagai URL hasil upload, bukan base64 JSON di MySQL.
- Upload admin ke `POST /api/uploads/images` memakai auth admin. Jika `CLOUDINARY_URL` tersedia, gambar masuk Cloudinary; jika tidak, fallback ke `/uploads`.
- Verifikasi email memakai OTP 6 digit yang dikirim ke email pendaftar dari SMTP backend.
- Email OTP dikirim secara asynchronous lewat queue. Jika `REDIS_URL` tersedia, backend memakai BullMQ; jika tidak, backend memakai fallback async lokal agar request tidak menunggu SMTP.
- Login user dan admin memakai halaman `/login` yang sama.
- Role akun disimpan di tabel `users`; user biasa memakai `role = 'user'`, admin memakai `role = 'admin'`.
- Login mendukung query `next`, contoh `/login?next=/templates/nama-template`.
- Setelah login, admin diarahkan ke `/admin/templates`; user diarahkan ke `next` atau fallback `/`.
- Setelah daftar akun, user diarahkan ke `/verify-email`; setelah OTP berhasil, user diarahkan ke `next` atau fallback `/`.
- Lupa password tersedia di `/forgot-password`.
- Reset password memakai OTP email terpisah dari OTP verifikasi akun.
- Endpoint lupa password:
  - `POST /api/auth/user/forgot-password` dengan `email`.
  - `POST /api/auth/user/reset-password` dengan `email`, `otp`, `password`, dan `confirmPassword`.
- Endpoint verifikasi user:
  - `POST /api/auth/user/verify-email` dengan `email` dan `otp`.
  - `POST /api/auth/user/resend-otp` untuk kirim ulang OTP.
- Profil user tersedia lewat `GET /api/auth/user/me` dan `PATCH /api/auth/user/me`.
- Profil menampilkan email terdaftar, status verifikasi email, dan bind akun aktif.
- Password hanya bisa diubah dengan `currentPassword` dari akun yang sedang login.
- User bisa menghapus akun lewat menu `Delete account` di profil.
- Delete account memakai `DELETE /api/auth/user/me` dan wajib validasi password aktif serta konfirmasi email akun.
- Saat akun dihapus, relasi `orders.user_id` dan `template_ratings.user_id` dilepas agar data transaksi tetap tersimpan.
- Wishlist user tersedia lewat `GET /api/favorites/my`, `POST /api/favorites/:templateId`, dan `DELETE /api/favorites/:templateId`.
- Notifikasi user tersedia lewat `GET /api/notifications/my`, `PATCH /api/notifications/:id/read`, dan `PATCH /api/notifications/read-all`.
- Template dan order memakai soft delete lewat kolom `deleted_at`; list API menyembunyikan data soft-deleted.
- Aksi admin penting dicatat ke `admin_audit_logs`, termasuk create/update/delete template dan update/delete order.
- API legacy `/api/*` tetap ada, dan route versioned `/api/v1/*` sudah tersedia.
- Swagger/OpenAPI tersedia di `/api/docs` dan JSON di `/api/openapi.json`.
- Redis cache optional memakai `REDIS_URL`; saat aktif, templates dan blog memakai cache JSON.
- Blog real tersimpan di tabel `blog_posts` dengan status `draft`/`published`, CRUD admin API, halaman `/blog`, dan detail `/blog/:slug`.
- Analytics frontend env-based: `VITE_ANALYTICS_PROVIDER=ga4|plausible|umami|none`.
- PWA baseline memakai `frontend/public/manifest.webmanifest` dan `frontend/public/sw.js`.
- Bundle analyzer tersedia lewat `npm run build:analyze --workspace frontend`.

Alur custom:

1. User klik `Request Custom`.
2. User mengisi brief singkat.
3. Admin menghubungi via WhatsApp.
4. Scope, harga, dan timeline disepakati.
5. Project masuk dashboard admin.

## Alur Admin

Dashboard admin ideal:

- Login lewat halaman login utama dengan akun role admin.
- CRUD template.
- CRUD kategori.
- Kelola harga dan promo.
- Kelola pesanan.
- Soft-delete template/order agar data tidak hilang permanen.
- Audit trail aksi admin.
- Kelola portofolio.
- Kelola tutorial/blog.
- Kelola FAQ.
- Lihat status API/database.

## Data Backend Awal

Entitas yang disarankan:

- `templates`
- `template_categories`
- `orders`
- `customers`
- `projects`
- `blog_posts`
- `faqs`
- `users` dengan field `role`
- `user_template_favorites`
- `notifications`
- `admin_audit_logs`
- `blog_posts`
- `coupons`
- `coupon_redemptions`
- `affiliate_referrals`
- `template_bundles`
- `template_bundle_items`

Field penting `templates`:

- `id`
- `title`
- `slug`
- `category_id`
- `description`
- `price`
- `stack`
- `level`
- `rating`
- `demo_url`
- `thumbnail_url`
- `features`
- `is_featured`
- `created_at`
- `updated_at`

## Aturan Styling

Warna utama harus tinggal di `frontend/src/styles.css`:

- `--color-naki-primary`
- `--color-naki-secondary`
- `--color-naki-frost`
- `--color-naki-steel`
- `--color-naki-smoke`

Gunakan class Tailwind theme:

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

Jangan pakai hex langsung di `className`.

Background utama memakai class global `naki-frosted-grid` dari `frontend/src/styles.css`, berisi texture Frosted Grid + Glass Noise yang dibuat full CSS.

## Catatan Implementasi Saat Ini

Status saat dokumen dibuat:

- Frontend sudah berupa katalog template store dengan routing.
- Filter kategori dan search sudah ada di halaman home.
- Halaman detail template tersedia di `/templates/:slug`.
- Halaman detail template punya form konsultasi/order.
- Halaman admin template tersedia di `/admin/templates`.
- Halaman admin memiliki tab Template, Order, dan Portofolio.
- Admin bisa menambah, mengedit, dan soft-delete portofolio website jadi dari tab Portofolio.
- Admin bisa mengubah status order: `new`, `contacted`, `deal`, `closed`.
- Admin bisa memfilter order berdasarkan status: semua, new, contacted, deal, closed.
- Admin bisa melihat status pembayaran order di tab Order.
- User punya route `/pesanan-saya` untuk melihat order, menjalankan pembayaran manual/dev, dan memberi rating setelah order paid.
- User punya route `/wishlist` untuk melihat template favorit.
- Header user punya dropdown notifikasi dengan badge unread.
- Kartu katalog dan halaman detail menampilkan review buyer tertulis jika tersedia.
- Halaman detail punya breadcrumb.
- Admin bisa soft-delete order dari tab Order.
- Backend soft-delete template/order lewat `deleted_at`.
- Backend mencatat audit trail admin ke `admin_audit_logs`.
- Backend email OTP sudah async via BullMQ jika Redis tersedia, dengan fallback async lokal.
- Admin template sudah memakai token user terpadu dengan `role = 'admin'`.
- User login/register tersedia di `/login`; order dan rating membutuhkan token user.
- User punya route `/akun-saya` dan `/profile` untuk mengelola profil akun.
- Palette sudah dipindah ke `frontend/src/styles.css`.
- Backend Express sudah punya endpoint health, auth, projects/portfolio CRUD, templates, template detail, template CRUD, categories, dan orders.
- Backend sudah punya model/repository manual di `backend/src/models` untuk `template`, `order`, `category`, dan `project`.
- Backend menjalankan bootstrap database saat server start: membuat database dari `MYSQL_DATABASE`, membuat tabel dari `backend/database/schema.sql`, dan membuat admin default dari `.env`.
- Backend tidak memakai fallback seed lokal; MySQL wajib tersedia agar server berjalan.
- Build root menggunakan `npm run build`.
- HomePage dan TemplateDetailPage sudah lazy-loaded.
- Gambar template memakai lazy loading, responsive sizes, dan srcset Cloudinary otomatis melalui `ResponsiveImage`.
- Form status/error utama memakai `aria-live` region.
- Blog list/detail membaca data dari backend, bukan placeholder statis.
- API tersedia di `/api` dan `/api/v1`.
- Swagger/OpenAPI docs tersedia di `/api/docs`.
- Redis caching layer optional tersedia lewat `REDIS_URL`.
- Coupon, referral, dan bundle punya schema serta endpoint backend.
- PWA manifest/service worker sudah tersedia.
- Bundle analyzer bisa dijalankan dengan `npm run build:analyze --workspace frontend`.

## Status Pre-Launch (Juni 2026)

Aplikasi dalam fase persiapan soft launch dengan timeline 8 minggu. Prioritas development difokuskan pada:

1. **Production readiness** - Error monitoring, environment validation, security hardening
2. **Core UX** - Loading states, caching, image optimization
3. **SEO foundation** - Meta tags, structured data, sitemap
4. **Testing baseline** - Critical path coverage untuk auth & order flow

**Roadmap detail tersedia di `docs/ROADMAP.md`.**

**Gap analysis lengkap tersedia di `docs/GAP_ANALYSIS.md`.**

### Quick Reference: Current Priorities

**P0 (Week 1-2):**
- Error monitoring (Sentry)
- Environment validation (Zod)
- Password strength validation
- Frontend test setup
- robots.txt + sitemap

**P1 (Week 3-6):**
- Loading skeletons & image optimization
- SEO meta tags & structured data
- React Query caching
- Related templates section
- Analytics setup

**P2 (Week 7-8):**
- CI/CD pipeline (GitHub Actions)
- Integration tests
- Admin analytics dashboard
- Performance audit (Lighthouse)
- Invoice PDF generation

**Post-Launch Backlog:**
- Template comparison, search history, social sharing
- Advanced admin features (bulk ops, dashboard analytics)
- Subscription/coupon system enhancement
- Comprehensive test suite (E2E dengan Playwright)
- DevOps enhancement (Docker, staging environment)
