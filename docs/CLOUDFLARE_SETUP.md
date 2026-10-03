# Pemasangan Cloudflare untuk NAKI CODE

Status 2026-10-03: belum diaktifkan. Pemeriksaan DNS publik menunjukkan nameserver `nsid1.rumahweb.com`, `nsid2.rumahweb.net`, `nsid3.rumahweb.biz`, dan `nsid4.rumahweb.org`. `www.nakicode.xyz` mengarah ke `1cdc078d973428d7.vercel-dns-017.com`. Ini hasil observasi, bukan pengganti nilai terbaru pada dashboard Vercel.

Hosting frontend/backend tetap Vercel. Tidak ada perubahan DNS, akun provider, environment deployment, atau webhook yang dilakukan melalui task ini. Tidak perlu memindahkan database.

## Tahap 1: pindahkan DNS dengan aman

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/), tambahkan domain `nakicode.xyz` (tanpa `https://` atau `www`) dan pilih paket Free untuk tahap awal. Aktifkan MFA akun.
2. Ekspor/cadangkan seluruh DNS dari provider lama sebelum mengganti nameserver. Pastikan hasil impor Cloudflare memuat semua A/AAAA/CNAME, MX, SPF, DKIM, DMARC, TXT verifikasi, dan CAA yang dibutuhkan. Pemindaian otomatis tidak menjamin semua record ditemukan. Jangan menghapus record email.
3. Cocokkan record apex `@` dan `www` dengan **Settings > Domains** project frontend Vercel. Jangan menebak alamat IP Vercel atau menggunakan nilai contoh dari internet. Awalnya pilih **DNS only** (awan abu-abu) untuk record website. Record email tetap DNS only.
4. Jika DNSSEC lama aktif, nonaktifkan dahulu dan pastikan DS lama sudah dihapus dari registrar. Simpan cadangan konfigurasi sebelum perubahan.
5. Cloudflare memberikan dua nameserver khusus domain. Salin keduanya persis ke pengaturan **nameserver** di registrar tempat domain dibeli, menggantikan seluruh nameserver lama. Jangan menambahkannya sebagai record NS biasa pada zona DNS.
6. Tunggu sampai zona Cloudflare berstatus Active, lalu periksa website, sertifikat Vercel, dan email. Setelah stabil, aktifkan DNSSEC di Cloudflare dan pasang DS baru pada registrar jika didukung.

**DNS only belum mengaktifkan WAF/CDN Cloudflare untuk trafik website.** Trafik HTTP masih langsung ke Vercel, sehingga tahap ini hanya migrasi DNS. Jangan menganggap pemasangan keamanan selesai pada tahap ini.

Referensi: [Cloudflare full setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/).

## Tahap 2: keputusan proxy dan cakupan API

Vercel [tidak merekomendasikan reverse proxy tambahan](https://vercel.com/kb/guide/cloudflare-with-vercel) karena dampak visibilitas trafik, performa, dan cache. Jika tetap memakai Cloudflare WAF, aktifkan proxy secara bertahap setelah memahami trade-off dan menyiapkan pengujian serta rollback. Cloudflare termasuk provider Verified Proxy Lite yang didukung Vercel; ini bukan jaminan semua fitur origin dapat melihat IP pengguna asli atau bahwa origin otomatis tertutup.

- Periksa domain pada Vercel valid dan sertifikat origin aktif sebelum mengubah awan menjadi **Proxied** (oranye).
- Gunakan **SSL/TLS > Full (strict)**. Jangan gunakan Flexible. Full (strict) memerlukan sertifikat origin valid untuk hostname yang dipakai.
- Ikuti pengecualian sertifikat Vercel: `/.well-known/acme-challenge/*` harus dapat diakses melalui HTTP port 80 tanpa redirect/challenge yang menghalangi validasi. Jangan mengaktifkan redirect HTTPS global yang merusak jalur ini; beri pengecualian dengan aturan yang sesuai.
- `/.well-known/vercel/*` tidak boleh di-cache. Jangan mengubah/menghapus header proxy bawaan atau langsung mempercayai `CF-Connecting-IP` di aplikasi tanpa validasi sumber proxy.
- API yang dipanggil langsung melalui `naki-api.vercel.app` **tidak terlindungi WAF zona nakicode.xyz**. Untuk mencakup API, tambahkan `api.nakicode.xyz` ke project backend Vercel, gunakan target DNS yang diberikan project itu, validasi TLS, lalu aktifkan proxy pada subdomain tersebut.
- Setelah API custom domain teruji, ubah `VITE_API_URL` deployment frontend sesuai format konfigurasi existing. Pertahankan CORS allowlist `https://nakicode.xyz` dan `https://www.nakicode.xyz`; jangan membuka CORS ke semua origin.
- Perubahan URL webhook Midtrans harus dikoordinasikan di dashboard merchant dan diuji sebelum URL lama ditutup. Jangan memutus endpoint lama sebelum provider menggunakan endpoint baru. Webhook tetap wajib memvalidasi signature pada backend.
- Endpoint `.vercel.app`/deployment origin yang masih publik dapat melewati Cloudflare. Pembatasan direct access harus direncanakan di Vercel Firewall/fitur origin yang tersedia; jangan memblokirnya secara membabi buta hingga menyebabkan webhook atau deploy preview gagal.

Referensi: [Verified Proxy Vercel](https://vercel.com/kb/guide/how-to-setup-verified-proxy), [Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/).

## Baseline keamanan dan cache setelah proxy siap

- Periksa ruleset WAF yang tersedia pada paket akun, aktifkan proteksi yang sesuai, lalu pantau Security Events untuk false positive. Tidak semua ruleset atau kuota rate limit tersedia pada semua paket.
- Terapkan rate limit terarah pada endpoint auth; pertahankan pembatasan aplikasi existing. Hindari challenge interaktif pada respons JSON API, preflight OPTIONS, signed upload, atau webhook pembayaran. Challenge browser pada API dapat tampil sebagai error CORS padahal request diblokir di edge.
- Jangan menyalakan **Under Attack Mode** sebagai mode harian. Jangan menyalakan **Bot Fight Mode** tanpa pengujian webhook: fitur ini tidak dapat dilewati memakai aturan Skip. Pengecualian keamanan harus spesifik, bukan skip seluruh `/api`.
- Jangan geo-block negara luar negeri karena NAKI CODE melayani klien internasional.
- Jangan menggunakan **Cache Everything**. Bypass edge cache untuk API, login, admin, profil, pesanan, checkout, undangan klien, `sw.js`, HTML aplikasi, dan file pemeriksaan versi build. Jangan override `Cache-Control: no-store` atau cache respons berautentikasi. Aset build ber-hash `/assets/*` boleh mengikuti header cache origin.
- Biarkan Rocket Loader nonaktif pada tahap awal untuk menghindari perubahan eksekusi React, Google Identity Services, dan script pembayaran.
- Signed direct upload Cloudinary existing tetap digunakan untuk video/source; upload tersebut berjalan pada domain Cloudinary, bukan melewati WAF nakicode.xyz. Validasi dan otorisasi signature di API tetap diperlukan.

Referensi: [Interoperabilitas fitur WAF](https://developers.cloudflare.com/waf/feature-interoperability/).

## Verifikasi dan rollback

Periksa frontend root/www, semua halaman publik, SEO, update service worker setelah deploy baru, login password/Google, pergantian bahasa/tema, admin CRUD, upload gambar/video/source, tracking order, unduh invoice, serta webhook sandbox Midtrans valid. Uji akun yang berbeda untuk memastikan cache tidak membocorkan data pribadi. Uji respons error API dan preflight CORS.

Saat proxy bermasalah, kembalikan record website/API ke DNS only tanpa menghapus zona atau record email. Jika migrasi DNS bermasalah, bandingkan dengan cadangan dan perbaiki record yang hilang; jangan melakukan rollback nameserver tanpa memperhitungkan DNSSEC/DS dan propagasi. Simpan hasil tes dan waktu aktivasi. Jangan mengirim password, API token, atau data klien melalui screenshot.
