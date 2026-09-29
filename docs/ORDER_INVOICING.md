# Invoice order dan email

## Waktu penerbitan

- Order baru: email penerimaan ke alamat akun pemilik order. Order konsultasi belum ditagihkan.
- Pilih DP: invoice Down Payment diterbitkan saat sesi pembayaran dibuat, menggunakan nominal session hasil perhitungan backend.
- DP berhasil: invoice DP yang sama menjadi lunas dan dikirim kembali sebagai konfirmasi pembayaran.
- Approve hasil: jika masih ada sisa pembayaran, invoice Pelunasan diterbitkan sebesar total penawaran dikurangi settlement aktual. Source final tidak dicantumkan di email atau PDF.
- Pelunasan berhasil: invoice Pelunasan menjadi lunas dan email konfirmasi dikirim.
- Bayar penuh atau beli source: satu invoice Pembayaran penuh, tanpa invoice pelunasan tambahan.

Nomor `INV/YYYY/MM/ORDER/DP|BAL|FULL` stabil untuk setiap tahap. Retry gateway memperbarui reference/sesi pada tagihan belum dibayar, bukan menambah tagihan baru. Dokumen DP tetap dapat diunduh setelah pelunasan.

## Penyimpanan dan akses

Migrasi runtime `027_stage_invoices_and_order_email_deliveries` menambah `invoices.stage`, mengganti constraint unik menjadi `(order_id, stage)`, dan membuat outbox email. Invoice lama tidak dihapus; tetap menjadi ringkasan stage `order`. Riwayat session lama dapat mengisi invoice tahap saat pengguna membuka panel Invoice.

Endpoint daftar dan unduh memeriksa kepemilikan order dari token login. Daftar hanya mengembalikan metadata, bukan snapshot email atau URL source. PDF menggunakan snapshot invoice, status pembayaran, total proyek, nominal tahap, pembayaran sebelumnya, reference, dan batas sesi bila tersedia.

## Operasional email

Pastikan konfigurasi SMTP benar dan `CLIENT_ORIGIN` mengarah ke frontend publik; tautan email hanya membawa pengguna ke checkout/Pesanan Saya dengan login. Tidak ada token login atau URL unduh source di email.

Dengan Redis, worker email harus tetap aktif dan queue melakukan tiga percobaan. Tanpa Redis, email order dikirim sebelum request berakhir agar tidak hilang pada serverless. Error SMTP tidak membatalkan order atau settlement dan tersimpan pada outbox.

Proses ulang outbox yang gagal:

```bash
rtk npm run email:retry-orders --workspace backend
```

Command memproses maksimal 50 order per putaran. Jalankan setelah memperbaiki SMTP; command ini benar-benar mengirim email pelanggan. Tidak dijalankan otomatis oleh task implementasi. Pada deployment tanpa worker Redis belum ada scheduler retry khusus. Pengiriman memakai lock lima menit dan event unik per tahap/status; SMTP tidak memiliki jaminan exactly-once jika proses crash setelah email diterima provider.

Verifikasi staging setelah deploy: buat order uji, pilih DP, lakukan settlement sandbox, approve review, lalu lakukan pelunasan. Periksa dua nomor invoice yang berbeda, dua nominal yang benar, perubahan status lunas, lampiran PDF, dan penerimaan email. Gunakan akun/email uji, bukan pelanggan produksi.
