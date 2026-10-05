# Percobaan Telegram CEO Office

Satu bot pribadi menyediakan AI Manager dan empat peran agent. Penghubung lokal menerima pesan melalui long polling Telegram, mengirim instruksi ke antrean Kantor Digital, dan mengembalikan laporan. Tidak memerlukan webhook atau port publik pada komputer. Komputer, backend, worker Codex, dan bridge Telegram harus aktif.

## Buat dan pasangkan bot

1. Buka [BotFather resmi](https://t.me/BotFather), kirim `/newbot`, lalu pilih nama dan username berakhiran `bot`. Gunakan bot khusus percobaan.
2. Simpan token bot. Jangan mengirimkannya ke chat, source repository, screenshot, atau dokumentasi.
3. Pastikan `WEBSITE/.local/digital-office/worker.json` sudah ada dari pairing Kantor Digital. Token worker mengikat bridge ke akun admin pemilik pairing tersebut. Jangan memakai pairing orang lain.
4. Dari folder `WEBSITE`, jalankan:

```powershell
rtk npm run office:telegram:setup --workspace backend
```

Input token disembunyikan. Setup memeriksa identitas bot dan menghasilkan kode pairing acak. Buka link bot yang tampil di terminal, lalu kirim `/start KODE` dari akun Telegram CEO Anda. Kode berakhir setelah lima menit. Hanya akun pribadi yang mengirim kode itu yang dipasangkan; grup dan bot tidak dapat dipasangkan.

Konfigurasi berisi bot token, token worker, URL backend, dan ID Telegram CEO, disimpan di `.local/digital-office/telegram.json` yang di-ignore. Setup tidak mengubah webhook existing, tidak menjalankan migrasi, dan tidak memulai backend. Jika bot sudah memiliki webhook atau konfigurasi lama, setup berhenti.

## Jalankan

Pastikan backend aktif dengan endpoint Telegram versi terbaru. Startup backend mengikuti inisialisasi database existing; jangan menjalankannya terhadap database remote tanpa persetujuan pemilik. Worker Codex menjalankan tugas memakai sesi ChatGPT CLI existing.

Di terminal worker:

```powershell
rtk npm run office:worker --workspace backend -- --config ../.local/digital-office/worker.json
```

Di terminal bridge:

```powershell
rtk npm run office:telegram --workspace backend -- --config ../.local/digital-office/telegram.json
```

Jalankan satu bridge per bot. Ctrl+C menutup bridge dan melepas lock. Jika proses mati paksa, periksa bahwa bridge sudah berhenti sebelum menghapus `bridge.lock` di folder state lokal. State berisi offset Telegram, pilihan agent, dan ID tugas; jangan hapus saat ada pekerjaan berjalan karena hasil yang sama dapat dikirim ulang.

## Gunakan di Telegram

- `/start` atau `/help`: menu dan petunjuk.
- `/manager`: instruksi dibagi ke agent berdasarkan kebutuhan.
- `/strategy`, `/research`, `/creative`, `/operations`: instruksi berikutnya ditugaskan langsung ke satu agent.
- Kirim teks 15–3.000 karakter untuk memasukkannya ke antrean dan menjalankannya.
- `/status`: status instruksi terakhir dari Telegram.
- `/cancel`: batalkan instruksi terakhir jika masih antre/berjalan.

Contoh setelah `/creative`: “Buat tiga draft caption Instagram untuk jasa website NAKI, dengan ajakan konsultasi.” Hasil tetap muncul di riwayat Kantor Digital. Agent menghasilkan draft, bukan publikasi atau tindakan eksternal. Percakapan belum memiliki memori dialog lintas brief; sertakan konteks penting dalam setiap instruksi.

Versi ini menerima **teks**. Voice note Telegram dan file belum ditranskripsi/diproses; voice di kolom website merupakan fitur terpisah. Pesan akun lain, grup, dan bot diabaikan tanpa respons. Balasan/laporan hanya dikirim ke ID CEO terkonfigurasi, tidak ke chat ID dari teks pengguna.

## Penyimpanan dan batasan

Endpoint scoped worker baru: `POST /api/admin/digital-office/worker/telegram/missions`, `GET /.../missions/:id`, dan `POST /.../missions/:id/cancel`. Owner diambil dari token worker, bukan body. Tidak ada tabel/migrasi baru untuk Telegram. Payload tidak menerima shell/command atau path executable.

ID mission diturunkan dari ID bot/update sehingga retry submit tidak membuat job kedua. Progress offset, daftar laporan tertunda (maksimum 20), dan bagian laporan terkirim disimpan atomik pada disk. Laporan dibagi menjadi teks pendek tanpa parse mode agar Markdown/emoji tidak merusak kiriman. Crash setelah Telegram menerima pesan tetapi sebelum state tersimpan masih dapat menyebabkan satu bagian terkirim ulang; tidak ada jaminan exactly-once lintas Telegram dan disk.

Instruksi dan hasil dikirim melalui Telegram serta disimpan di database kantor. Tidak ada token atau isi brief yang dicetak ke log bridge. `protect_content` diminta untuk laporan, tetapi penerima tetap dapat merekam layar. Cabut worker di website untuk mencabut akses bridge ke backend; ganti token bot di BotFather bila token bocor.

Validasi: build backend, sintaks PowerShell setup, diff check, dan 26 tes backend terkait lulus. Tes memakai mock Telegram/backend, tanpa mengirim pesan nyata. Uji bot nyata memerlukan token dan pairing CEO, backend aktif, serta worker Codex. Referensi: [Telegram Bot API](https://core.telegram.org/bots/api).
