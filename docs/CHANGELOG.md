# Changelog Naki Code

Dokumentasi perubahan dan task yang telah diselesaikan di proyek Naki Code.

## Format Entri

- `[x]` = task selesai
- `[ ]` = task tertunda/blocker
- Format: `- [x] YYYY-MM-DD - <ringkasan task> - files: <path penting>`

---

## 2026-07-14

- [x] 2026-07-14 - Optimalkan loading skeleton agar homepage memuat section kategori, design, dan portofolio secara terpisah, serta hindari skeleton wishlist muncul lagi saat favorit sedang re-fetch di background - files: frontend/src/app/App.tsx, frontend/src/pages/HomePage.tsx, frontend/src/hooks/useFavorites.ts, docs/CHANGELOG.md

---

## 2026-07-11

- [x] 2026-07-11 - Hapus fitur compare beserta context, tray, tombol kartu dan route; tingkatkan preview detail design menjadi carousel gambar utuh dengan thumbnail, navigasi panah, penghitung, keyboard, dan lightbox overlay yang dapat digeser - files: frontend/src/main.tsx, frontend/src/app/App.tsx, frontend/src/components/catalog/TemplateCatalog.tsx, frontend/src/components/catalog/TemplateCard.tsx, frontend/src/pages/TemplateDetailPage.tsx, docs/PROJECT_SUMMARY.md, docs/CHANGELOG.md

- [x] 2026-07-11 - Padatkan toolbar filter Orders admin menjadi search dan dua select satu baris, serta tambahkan warna semantik pada border kartu, badge status order, badge pembayaran, dan kontrol perubahan status untuk mempercepat scanning - files: frontend/src/pages/admin/OrdersPanel.tsx, docs/CHANGELOG.md

- [x] 2026-07-11 - Migrasikan route dan URL publik dari template ke design dengan redirect kompatibilitas, tambah alias API `/api/designs`, implementasikan CRUD Coupon admin dan pemakaian diskon checkout, hapus referral dari UI/API/schema aktif, serta improve Orders admin dengan quick action, statistik responsif, toolbar dan copy berbahasa Indonesia - files: frontend/src/app/App.tsx, frontend/src/pages/AdminTemplatesPage.tsx, frontend/src/pages/admin/AdminCouponsSection.tsx, frontend/src/pages/admin/OrdersPanel.tsx, frontend/src/components/admin/AdminSidebar.tsx, frontend/src/pages/CheckoutPage.tsx, backend/src/models/business.model.ts, backend/src/routes/business.ts, backend/src/routes/orders.ts, backend/src/server.ts, backend/database/schema.sql, backend/database/migrations/20260711-000001-remove-affiliate-referrals.sql, docs/PROJECT_SUMMARY.md, docs/CHANGELOG.md

## 2026-07-07

- [x] 2026-07-11 - Integrasikan tombol via Lynk dengan order internal: wajib login, buat order dan sesi Lynk sebelum redirect agar transaksi tercatat di Pesanan Saya sebagai waiting_payment - files: frontend/src/pages/TemplateDetailPage.tsx, frontend/src/domain/order-types.ts, backend/src/routes/orders.ts, backend/src/payments/payment.service.ts, docs/PROJECT_SUMMARY.md
- [x] 2026-07-11 - Pastikan deployment Vercel production otomatis memakai endpoint Midtrans live, sementara preview dan development tetap sandbox - files: backend/src/config.ts, docs/PROJECT_SUMMARY.md
- [x] 2026-07-11 - Audit dan hardening dark mode global: sinkronkan surface translucent, badge/status semantic, border, foreground tombol, hover, input/autofill, hero glow, serta CTA inverse agar background dan teks selalu kontras - files: frontend/src/styles.css, frontend/src/components/home/Hero.tsx, frontend/src/components/home/CTASection.tsx
- [x] 2026-07-11 - Atur ulang tombol pembelian: Checkout berwarna biru di kiri dan via Lynk berwarna hijau di kanan, termasuk pemilih provider di checkout - files: frontend/src/pages/TemplateDetailPage.tsx, frontend/src/pages/CheckoutPage.tsx
- [x] 2026-07-11 - Sederhanakan aksi pembelian source code menjadi dua tombol Checkout dan Checkout Lynk yang selalu terlihat di detail design, serta ubah pemilih provider checkout menjadi dua tombol ringkas - files: frontend/src/pages/TemplateDetailPage.tsx, frontend/src/pages/CheckoutPage.tsx
- [x] 2026-07-11 - Tambah dua metode checkout Midtrans dan Lynk dengan pemilihan provider/channel yang lebih jelas, validasi URL Lynk tepercaya dari database template, pencatatan sesi eksternal pada order, status UX spesifik provider, serta test keamanan payment session - files: frontend/src/pages/CheckoutPage.tsx, frontend/src/domain/order-types.ts, backend/src/routes/orders.ts, backend/src/models/order.model.ts, backend/src/payments/payment.service.ts, backend/src/payments/payment.service.test.ts, docs/PROJECT_SUMMARY.md
- [x] 2026-07-11 - Improve UI/UX storefront secara menyeluruh: rapikan hierarchy beranda, tambah alur jasa tiga langkah, bedakan CTA konsultasi, benahi social proof, buat kartu design lebih jelas dan mudah disentuh, sambungkan compare ke sticky tray global, tambah pencarian live header, serta polish focus/reduced-motion accessibility - files: frontend/src/pages/HomePage.tsx, frontend/src/components/home/Hero.tsx, frontend/src/components/home/HowItWorksSection.tsx, frontend/src/components/catalog/TemplateCard.tsx, frontend/src/components/catalog/TemplateCatalog.tsx, frontend/src/components/catalog/CompareTray.tsx, frontend/src/components/layout/Header.tsx, frontend/src/components/layout/header/SearchDialog.tsx, frontend/src/styles.css, docs/PROJECT_SUMMARY.md
- [x] 2026-07-10 - Perbesar logo Naki Code di header secara responsif tanpa mengganggu batas lebar navigasi - files: frontend/src/components/layout/header/SiteLogo.tsx
- [x] 2026-07-07 - Improve responsive mobile storefront: rapikan breakpoint header/menu, hero mobile, CTA mobile, grid katalog, filter kategori horizontal, dan tap target card - files: frontend/src/components/layout/Header.tsx, frontend/src/components/layout/header/MobileMenu.tsx, frontend/src/components/layout/header/SiteLogo.tsx, frontend/src/components/home/Hero.tsx, frontend/src/components/home/CTASection.tsx, frontend/src/components/catalog/TemplateCatalog.tsx, frontend/src/components/catalog/TemplateFilterBar.tsx, frontend/src/components/catalog/TemplateCard.tsx
- [x] 2026-07-07 - Fix dev script Windows/Node v25 spawn EINVAL dengan menjalankan npm workspace lewat cmd.exe dan membersihkan env child process - files: scripts/dev.mjs
- [x] 2026-07-07 - Tambah root dev script yang otomatis memilih port kosong untuk frontend/backend saat port default dipakai, sekaligus menyinkronkan VITE_API_URL dan CORS local - files: scripts/dev.mjs, package.json, frontend/vite.config.ts, frontend/vite.config.js, docs/PROJECT_SUMMARY.md
- [x] 2026-07-07 - Ganti logo header/footer ke logo.png tanpa background dengan filter kontras dark mode, serta hapus source code opsional dari hero section - files: frontend/src/components/layout/header/SiteLogo.tsx, frontend/src/components/layout/Footer.tsx, frontend/src/components/layout/LogoMark.tsx, frontend/src/components/home/Hero.tsx, frontend/src/styles.css

## 2026-07-06

- [x] 2026-07-06 - Ganti code preview hero beranda dengan visual karakter Naki Code full body tanpa background panel, floating info cards, dan tinggi section yang lebih compact - files: frontend/src/components/home/Hero.tsx, frontend/public/images/hero-naki-character.png
- [x] 2026-07-06 - Tambah karakter close-up Naki Code di CTA Section sebagai maskot ajakan konsultasi tanpa mengubah hero utama - files: frontend/src/components/home/CTASection.tsx, frontend/public/images/cta-naki-character-closeup.png

## 2026-07-02

- [x] 2026-07-02 - Bugfix: kategori yang dihapus muncul lagi setelah refresh karena resolveTemplateCategory() auto-create kategori baru. Sekarang throw error jika kategori tidak ditemukan - files: backend/src/models/template.model.ts, backend/src/routes/templates.ts
- [x] 2026-07-02 - Fitur testimonials: implementasi sistem testimonials lengkap dengan database schema, backend API (CRUD + from-rating), admin panel dengan source selection (manual/rating), toast notifications, preview modal, drag & drop reorder, soft delete, pagination, input validation, dan cache public endpoint - files: backend/database/schema.sql, backend/src/migrations.ts, backend/src/models/testimonial.model.ts, backend/src/routes/testimonials.ts, backend/src/server.ts, backend/src/cache.ts, frontend/src/components/Toast.tsx, frontend/src/components/TestimonialSection.tsx, frontend/src/pages/admin/AdminTestimonialsSection.tsx, frontend/src/pages/admin/AdminTemplateWorkspace.tsx, frontend/src/pages/admin/AdminTemplateWorkspace.shared.tsx, frontend/src/pages/AdminTemplatesPage.tsx, frontend/src/App.tsx
- [x] 2026-07-02 - Rombak total admin panel jadi layout sidebar Metricon-style: sidebar navigasi dengan menu groups (Main, App), dashboard stat cards, quick actions, recent orders; semua panel (templates, orders, portfolio, blog, testimonials, categories) redesign pakai tema warna Naki Code (naki-primary, naki-secondary, naki-frost, naki-steel, naki-smoke, naki-page-bg) - files: frontend/src/components/admin/AdminSidebar.tsx, frontend/src/components/admin/AdminLayout.tsx, frontend/src/pages/admin/AdminDashboardPage.tsx, frontend/src/pages/admin/AdminCategoriesSection.tsx, frontend/src/pages/admin/TemplatesPanel.tsx, frontend/src/pages/admin/OrdersPanel.tsx, frontend/src/pages/admin/PortfolioAdminPanel.tsx, frontend/src/pages/admin/BlogAdminPanel.tsx, frontend/src/pages/admin/AdminTestimonialsSection.tsx, frontend/src/pages/AdminTemplatesPage.tsx
- [x] 2026-07-02 - Rombak form modal template: tab-based layout 7 tab (Informasi Dasar, Harga & Link, Teknologi, Media Preview, Fitur, Source Code, Pengaturan), stack 3 kategori (Frontend/Backend/Database) dengan icon, preview drop zone redesign, source code tampilkan nama file, hapus sample preview, pisahkan tab Harga & Lynk URL - files: frontend/src/pages/admin/TemplateFormModal.tsx, frontend/src/pages/admin/AdminTemplateWorkspace.shared.tsx
- [x] 2026-07-02 - Tambah drag-and-drop reorder untuk kategori dengan update sort_order ke backend, tambah toast notifications untuk feedback - files: frontend/src/pages/admin/AdminCategoriesSection.tsx

## 2026-07-03

- [x] 2026-07-03 - Task 1 bundle optimization frontend: lazy load auth/not-found routes, defer Sentry, split vendor chunks, dan ganti zxcvbn frontend dengan strength heuristic ringan; main entry turun dari 926.56 kB ke 35.47 kB - files: frontend/src/App.tsx, frontend/src/main.tsx, frontend/src/ErrorBoundary.tsx, frontend/src/components/PasswordStrengthIndicator.tsx, frontend/vite.config.ts, frontend/vite.config.js, frontend/package.json, package-lock.json, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Task 2 CI/test coverage: root npm test menjalankan frontend dan backend, test frontend memakai provider wrapper Auth/QueryClient/Router, webhook payment test backend diisolasi dari bootstrap DB, dan backend typecheck CI dibersihkan; root test lulus 122 test - files: package.json, frontend/package.json, .github/workflows/ci.yml, frontend/src/test/render.tsx, frontend/src/test/setup.ts, frontend/src/pages/__tests__/UserLoginPage.test.tsx, frontend/src/components/__tests__/Header.test.tsx, backend/src/__tests__/payments.integration.test.ts, backend/package.json, backend/src/routes/uploads.ts, backend/src/security.ts, backend/src/server.ts, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Task 3 production payment readiness: tambah tabel payment_webhook_events untuk idempotency webhook Midtrans, simpan failure reason/code/last webhook di orders, tambah script sandbox signed webhook, tampilkan alasan pembayaran gagal di admin dashboard/orders, dan stabilkan test single-worker; root test lulus 123 test - files: backend/database/schema.sql, backend/src/db.ts, backend/src/migrations.ts, backend/src/models/order.model.ts, backend/src/models/payment-webhook-event.model.ts, backend/src/routes/payments.ts, backend/src/routes/orders-stats.ts, backend/src/scripts/midtrans-webhook-sandbox.ts, backend/src/__tests__/payments.integration.test.ts, backend/src/__tests__/templates.integration.test.ts, backend/package.json, frontend/package.json, frontend/src/order-types.ts, frontend/src/pages/admin/OrdersPanel.tsx, frontend/src/pages/admin/AdminDashboardHome.tsx, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Task 4 admin UX polish: tambah selection dan bulk status update di Orders, density switch comfort/compact, search current page dengan Escape-to-clear, status/empty state konsisten, dan template search reset yang keyboard-friendly - files: frontend/src/pages/admin/OrdersPanel.tsx, frontend/src/pages/admin/TemplatesPanel.tsx, frontend/src/pages/admin/AdminTemplateWorkspace.tsx, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Task 5 SEO dan conversion katalog: tambah route kategori indexable `/template/kategori/:categorySlug`, canonical/meta/ItemList/Breadcrumb schema untuk katalog, Product review schema dan breadcrumb kategori di detail template, related templates berbasis kategori/stack, CTA trust list di sidebar checkout, serta sitemap kategori; build frontend lulus - files: frontend/src/App.tsx, frontend/src/template-url.ts, frontend/src/pages/TemplateCatalogPage.tsx, frontend/src/pages/TemplateDetailPage.tsx, frontend/src/components/TemplateFilterBar.tsx, frontend/src/components/TemplateCatalog.tsx, frontend/scripts/generate-sitemap.mjs, frontend/public/sitemap.xml, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Admin testimoni polish: tambah summary, pencarian, filter status/sumber, tombol refresh dan status loading di menu Testimoni; label admin dilokalkan, z-index modal diperbaiki, chart tooltip dashboard dibuat lint-safe, dan backend testimonial soft-delete tidak lagi muncul di endpoint public/available rating - files: frontend/src/pages/admin/AdminTestimonialsSection.tsx, frontend/src/pages/AdminTemplatesPage.tsx, frontend/src/components/admin/AdminSidebar.tsx, frontend/src/pages/admin/AdminDashboardPage.tsx, frontend/src/pages/admin/AdminTemplateWorkspace.tsx, backend/src/models/testimonial.model.ts, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Normalisasi karakter Unicode di dokumentasi ke ASCII agar changelog dan project summary tidak tampil mojibake di terminal Windows/RTK - files: docs/CHANGELOG.md, docs/PROJECT_SUMMARY.md
- [x] 2026-07-03 - Tambah grafik interaktif di dashboard menggunakan Recharts: AreaChart (orders trend), PieChart (order status), BarChart (payment status & templates by category) dengan tema warna Naki Code - files: frontend/src/pages/admin/AdminDashboardPage.tsx
- [x] 2026-07-03 - Hapus tombol Categories dari header Templates panel (kategori sudah ada di sidebar menu) - files: frontend/src/pages/admin/TemplatesPanel.tsx
- [x] 2026-07-03 - Fix layout admin: hapus min-h-screen dari main, kurangi padding, adjust sidebar positioning di bawah header - files: frontend/src/components/admin/AdminLayout.tsx, frontend/src/components/admin/AdminSidebar.tsx
- [x] 2026-07-03 - Tambah Header di admin layout agar navigasi utama tetap tersedia - files: frontend/src/components/admin/AdminLayout.tsx
- [x] 2026-07-03 - Hapus logo dari sidebar (duplikat dengan logo di Header) - files: frontend/src/components/admin/AdminSidebar.tsx

## 2026-07-04

- [x] 2026-07-04 - Hardening admin kategori dan testimoni: sinkronisasi state kategori setelah mutasi, validasi API testimonial dengan Zod, cegah testimonial dari review kosong, stabilkan reorder saat filter aktif, tampilkan loading testimoni, perbaiki pesan error API, dan longgarkan delete kategori yang hanya direferensikan design soft-delete - files: backend/src/models/category.model.ts, backend/src/models/testimonial.model.ts, backend/src/routes/testimonials.ts, frontend/src/pages/AdminTemplatesPage.tsx, frontend/src/pages/admin/AdminCategoriesSection.tsx, frontend/src/pages/admin/AdminTestimonialsSection.tsx, frontend/src/services/api-client.ts, docs/PROJECT_SUMMARY.md, docs/CHANGELOG.md

## 2026-07-05

- [x] 2026-07-05 - Pusatkan seluruh AI task checklist di docs/CHANGELOG.md dan perbarui instruksi agent agar project summary tidak lagi menyimpan riwayat task - files: AGENTS.md, docs/PROJECT_SUMMARY.md, docs/CHANGELOG.md
- [x] 2026-07-05 - Tambah AGENTS.md sebagai pintu masuk instruksi AI yang mewajibkan pembacaan project summary sebelum mengerjakan task - files: AGENTS.md, docs/PROJECT_SUMMARY.md
- [x] 2026-07-05 - Hapus daftar layanan statis dari identitas produk agar project summary tetap sesuai saat kategori design berubah - files: docs/PROJECT_SUMMARY.md
- [x] 2026-07-05 - Perbarui positioning Naki Code sebagai jasa pembuatan website berbasis katalog design referensi, dengan opsi penyesuaian dan pembelian source code; istilah template hanya dipertahankan untuk nama teknis internal - files: docs/PROJECT_SUMMARY.md

## 2026-06-24

- [x] 2026-06-24 - Admin improvement backlog #3: normalisasi kategori template dengan templates.category_id foreign key sambil mempertahankan API category string untuk kompatibilitas frontend - files: backend/database/schema.sql, backend/src/db.ts, backend/src/migrations.ts, backend/src/models/template.model.ts, backend/src/models/category.model.ts, backend/src/**tests**/category.model.test.ts, docs/PROJECT_SUMMARY.md

## 2026-06-21

- [x] 2026-06-21 - Admin dashboard page: tambah tab Dashboard di /admin/dashboard dengan shortcut Kelola Template, Order Masuk, Kategori, Portofolio plus statistik ringkas tanpa loading API tambahan - files: frontend/src/pages/AdminTemplatesPage.tsx
- [x] 2026-06-21 - Admin dashboard route cleanup: hapus halaman wrapper dashboard duplikat dan jadikan AdminTemplatesPage sebagai halaman tunggal di /admin/dashboard - files: frontend/src/App.tsx, frontend/src/pages/AdminTemplatesPage.tsx, frontend/src/pages/AdminDashboardPage.tsx, frontend/src/components/Header.tsx
- [x] 2026-06-21 - Fix dropdown header admin: link Dashboard admin diarahkan ke /admin/dashboard dan tambah link Kelola template ke /admin/dashboard#templates di desktop/mobile - files: frontend/src/components/Header.tsx, frontend/src/components/**tests**/Header.test.tsx
- [x] 2026-06-21 - Fix Vercel serverless: disable express-rate-limit forwarded header validation yang bikin crash 503 di Vercel proxy - files: backend/src/security.ts
- [x] 2026-06-21 - Bugfix: auth token verify crash saat token bukan string (TypeError: token.split). Tambah type guard di verifyToken() - files: backend/src/auth.ts
- [x] 2026-06-21 - Payment amount tracking: tambah kolom payment_amount ke orders table untuk webhook verification, migration berhasil dijalankan - files: backend/database/migrations/20260621-084842-add-payment-amount-column.sql, backend/src/models/order.model.ts
- [x] 2026-06-21 - Error monitoring (lanjutan): tambah Sentry.captureException() ke semua catch blocks di templates.ts, blog-posts.ts, business.ts, categories.ts, favorites.ts, notifications.ts, projects.ts, uploads.ts - files: backend/src/routes/\*.ts
- [x] 2026-06-21 - Admin dashboard: buat halaman dashboard admin dengan statistik real-time (total orders, revenue, top templates, recent orders), auto-refresh setiap 30 detik, responsive design dengan Tailwind CSS - files: frontend/src/components/AdminDashboard.tsx, frontend/src/pages/AdminTemplatesPage.tsx
- [x] 2026-06-21 - Performance improvements: scryptSync -> scrypt async (tidak blokir event loop saat hashing password), requireAdmin verifikasi token 1x (sebelumnya 3x), express.json limit 15MB -> 1MB (cegah DoS) - files: backend/src/auth.ts, backend/src/routes/auth.ts, backend/src/models/user.model.ts, backend/src/server.ts
- [x] 2026-06-21 - Error monitoring: tambah Sentry.captureException() ke semua catch blocks di orders.ts, auth.ts, dan webhook Midtrans di payments.ts untuk pelacakan error di production - files: backend/src/routes/orders.ts, backend/src/routes/auth.ts, backend/src/routes/payments.ts

## 2026-06-20

- [x] 2026-06-20 - Security fix: tolak self-checkout untuk pesanan custom tanpa harga template (cegah manipulasi nominal via budget_range yang diisi user); amount kini hanya dari templates.price. Bugfix: endpoint invoice cek payment_status (sebelumnya cek status yang tidak pernah 'paid') - files: backend/src/routes/orders.ts

## 2026-06-19

- [x] 2026-06-19 - Consolidated project documentation into single summary file and marked old roadmap/checklist docs as obsolete - files: docs/PROJECT_SUMMARY.md
## 2026-07-11

- [x] 2026-07-11 - Aktifkan alur compare design dengan state persisten yang tervalidasi, batas minimal dua pilihan, loading state saat data katalog dimuat, dan halaman perbandingan side-by-side; hapus tombol via Lynk dari purchase card halaman preview agar checkout utama menjadi satu aksi yang jelas - files: frontend/src/contexts/compare-context.tsx, frontend/src/components/catalog/CompareTray.tsx, frontend/src/pages/ComparePage.tsx, frontend/src/pages/TemplateDetailPage.tsx, frontend/src/app/App.tsx, docs/CHANGELOG.md
- [x] 2026-07-14 - Memperbaiki redirect login agar next target wishlist kembali ke halaman yang dituju setelah autentikasi - files: frontend/src/pages/UserLoginPage.tsx
- [x] 2026-07-14 - Menghapus outline fokus global di seluruh website - files: frontend/src/styles.css
- [x] 2026-07-14 - Memperbaiki alur tambah dan edit kategori agar state edit tidak terbawa dan submit memberi feedback saat sesi admin hilang - files: frontend/src/pages/AdminTemplatesPage.tsx, frontend/src/pages/admin/AdminCategoriesSection.tsx
- [x] 2026-07-14 - Menambahkan pilihan batas coupon berdasarkan waktu atau jumlah pemakaian, termasuk validasi backend dan tampilan admin - files: backend/database/schema.sql, backend/database/migrations/007_add_coupon_max_redemptions.sql, backend/src/runtime-migrations.ts, backend/src/models/business.model.ts, backend/src/routes/business.ts, backend/src/scripts/seed-sample-data.ts, frontend/src/pages/admin/AdminCouponsSection.tsx, frontend/src/pages/CheckoutPage.tsx
- [x] 2026-07-12 - Menambahkan drag and drop serta paste file clipboard pada upload source code design - files: frontend/src/pages/admin/AdminTemplateWorkspace.shared.tsx, frontend/src/pages/admin/TemplateFormModal.tsx
- [x] 2026-07-14 - Menambahkan menu dan halaman Portofolio publik dengan pagination server-side, state loading/kosong/error, serta metadata SEO - files: frontend/src/pages/PortfolioPage.tsx, frontend/src/components/home/PortfolioSection.tsx, frontend/src/components/layout/header/header-data.ts, backend/src/routes/projects.ts, backend/src/models/project.model.ts
- [x] 2026-07-18 - Menambahkan tombol Preview pada portofolio publik yang membuka galeri capture bergaya masonry/Pinterest, sambil mempertahankan tombol Demo untuk link website - files: frontend/src/components/home/PortfolioSection.tsx, frontend/src/components/home/__tests__/PortfolioSection.test.tsx
- [x] 2026-07-18 - Membuat dev server Vite otomatis pindah ke port lain jika `5173` sedang dipakai - files: frontend/vite.config.ts, frontend/vite.config.js
- [x] 2026-07-18 - Mengalihkan request API dev frontend ke same-origin proxy Vite supaya fallback port tidak kena CORS saat port berubah - files: frontend/src/services/api-client.ts
- [x] 2026-07-18 - Membuka allowlist CORS backend untuk environment non-production agar frontend dev tetap jalan walau port berubah - files: backend/src/security.ts
- [x] 2026-07-18 - Mengubah aksi kartu portofolio menjadi tombol Preview di kiri dan View di kanan, dengan View disabled saat URL tidak tersedia - files: frontend/src/components/home/PortfolioSection.tsx, frontend/src/components/home/__tests__/PortfolioSection.test.tsx
- [x] 2026-07-18 - Menyesuaikan jarak tombol aksi portofolio agar berada tepat setelah teks tanpa terdorong ke bawah card - files: frontend/src/components/home/PortfolioSection.tsx
- [x] 2026-07-18 - Memadatkan card portofolio agar tinggi lebih fit lewat rasio gambar, padding, dan tipografi yang lebih ringkas - files: frontend/src/components/home/PortfolioSection.tsx
- [x] 2026-07-18 - Menghilangkan stretch pada grid portofolio supaya tinggi card mengikuti konten secara alami - files: frontend/src/components/home/PortfolioSection.tsx
- [x] 2026-07-18 - Mengubah overlay preview portofolio menjadi gallery mosaic full-width dengan susunan kartu yang rapi - files: frontend/src/components/home/PortfolioSection.tsx, frontend/src/components/home/__tests__/PortfolioSection.test.tsx
- [x] 2026-07-18 - Menyederhanakan overlay preview portofolio agar fokus ke mosaic gallery tanpa panel detail bawah yang memakan ruang - files: frontend/src/components/home/PortfolioSection.tsx
- [x] 2026-07-18 - Mengganti preview gallery portofolio ke React Photo Album masonry agar semua capture tampil rapi tanpa bergantung ke cover tunggal - files: frontend/src/components/home/PortfolioSection.tsx, frontend/package.json, package-lock.json
