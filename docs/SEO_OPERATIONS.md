# Operasional SEO Naki Code

Panduan ini melengkapi implementasi SEO di frontend. Jangan menyimpan token, kredensial, atau data rahasia di repository.

## Environment deployment frontend

Atur variabel berikut di Vercel Production:

- `VITE_SITE_URL=https://nakicode.com`
- `SITE_URL=https://nakicode.com`
- `SITEMAP_API_URL=<origin backend produksi tanpa /api>`
- `VITE_GOOGLE_SITE_VERIFICATION=<token verifikasi Search Console>` bila memakai metode meta tag

`SITEMAP_API_URL` diperlukan agar build dapat memasukkan halaman detail design dan artikel yang sudah dipublikasikan ke sitemap, sekaligus menghasilkan HTML awal untuk route tersebut. Jika API tidak tersedia saat build, halaman publik statis dan kategori tetap dihasilkan, tetapi route detail dinamis dilewati.

## Setelah deployment

1. Buka Google Search Console dan tambahkan properti domain `nakicode.com`.
2. Lakukan verifikasi DNS (direkomendasikan) atau isi `VITE_GOOGLE_SITE_VERIFICATION` untuk metode meta tag.
3. Submit `https://nakicode.com/sitemap.xml`.
4. Gunakan URL Inspection pada beranda, satu kategori, satu detail design, satu artikel, dan satu halaman pagination portofolio.
5. Jalankan Rich Results Test untuk halaman yang memiliki breadcrumb, FAQ, service, atau article schema.
6. Pantau Page Indexing, Core Web Vitals, HTTPS, query, CTR, dan soft 404 setelah Google melakukan crawl ulang.

## Checklist publikasi konten

- Judul, slug, deskripsi, dan cover harus unik serta sesuai isi.
- Design dan artikel harus memiliki internal link dari halaman publik lain.
- Gambar perlu alt text deskriptif dan sebaiknya berasal dari Cloudinary agar format serta ukuran responsif dapat dihasilkan otomatis.
- Jangan memasukkan halaman login, akun, checkout, admin, hasil pencarian, atau URL filter ke sitemap.
- Setelah menghapus atau mengganti slug, buat redirect permanen dari URL lama ke URL pengganti bila tersedia.
- Hindari artikel massal yang hanya mengulang kata kunci; prioritaskan panduan, studi kasus, perbandingan, dan jawaban atas pertanyaan pelanggan.

## Ritme pemantauan

- Mingguan: cek error indexing, soft 404, dan halaman baru yang belum ditemukan.
- Bulanan: bandingkan impression, click, CTR, posisi, conversion konsultasi, serta Core Web Vitals.
- Setiap rilis besar: jalankan build frontend, validasi sitemap, periksa HTML prerender, dan tes beberapa URL melalui Search Console.
