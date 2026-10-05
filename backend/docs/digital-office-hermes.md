# Hermes untuk NAKI CEO Office

Alur: website/Telegram -> antrean Kantor Digital -> worker Hermes -> profil specialist -> profil manager -> laporan di website/Telegram. Website tetap memiliki otorisasi admin, tugas, lease, status dan laporan; Hermes memiliki inferensi, identitas dan memori per peran. Tidak ada migrasi database baru untuk pergantian engine.

## Profil dan setup

Hermes Windows native yang sudah terpasang digunakan melalui Python pada environment instalasinya. Adapter memakai fungsi CLI single-query quiet dari versi terpasang (bukan parsing banner interaktif). Karena API internal ini dapat berubah, uji smoke setelah memperbarui Hermes. Versi docs terbaru mendukung query-file, tetapi instalasi sekarang belum menyediakan flag itu; helper mengirim prompt melalui stdin JSON tanpa shell.

Dari `WEBSITE`:

```powershell
rtk npm run office:hermes:setup --workspace backend
```

Setup membutuhkan pairing `.local/digital-office/worker.json` dan model yang sudah dikonfigurasi pada `~/.hermes/config.yaml`. Lima home terpisah dibuat di `.local/digital-office/hermes/profiles/naki-{manager,strategy,research,creative,operations}`. Folder ini menyimpan config, identity, memory dan sessions milik kantor. Hanya pengaturan inference dan credential provider yang diperlukan disalin, bukan personal memory, session, hooks, plugin, channel Telegram atau cron. Konfigurasi/token tetap lokal dan di-ignore. Setup menolak menimpa konfigurasi atau profil existing; ubah konfigurasi profil secara sengaja bila mengganti provider. Credential yang dirotasi pada Hermes pribadi perlu diperbarui pada profil kantor secara lokal; jangan mengirimkannya melalui chat.

Adapter awal menjalankan toolset **memory** saja. Agent boleh menyimpan fakta/preferensi stabil yang relevan, dengan memori terpisah per peran. Setiap job membuat sesi baru; ini tidak melanjutkan seluruh percakapan terakhir. Penyimpanan memori dilakukan oleh Hermes, bukan jaminan semua brief otomatis diingat. Hasil adalah draft; terminal, browser, publikasi, pengiriman pesan melalui tools, dan delegate_task Hermes belum diaktifkan. Pembagian tugas masih menggunakan aturan antrean NAKI existing, bukan perencanaan autonomous Hermes. Specialist berjalan berurutan, kemudian manager menyusun laporan.

## Jalankan

Hentikan worker Codex untuk pairing kantor ini sebelum menjalankan worker Hermes. Jangan menjalankan keduanya sebagai dua consumer antrean yang sama bila ingin semua tugas memakai Hermes.

```powershell
rtk npm run office:hermes --workspace backend -- --config ../.local/digital-office/hermes-worker.json
```

Backend harus aktif dan menggunakan endpoint office existing. Startup backend dapat memigrasi database terkonfigurasi: pada sesi ini restart sebelumnya ditolak automatic approval review karena database remote; persetujuan pemilik tetap diperlukan. Setup/tes Hermes tidak memulai backend.

Telegram tetap memakai bridge NAKI agar tugas/hasil tersimpan pada website. Ikuti `digital-office-telegram.md` untuk BotFather, hidden token input dan pairing CEO. Jalankan bridge yang sama bersama worker Hermes. Jangan menjalankan gateway Telegram bawaan Hermes pada token bot yang sama: dua poller akan berebut update. Bridge menerima teks dan belum memproses voice note. Satu bot memilih peran lewat `/manager`, `/strategy`, `/research`, `/creative`, `/operations`; lima bot terpisah belum dibuat.

## Validasi dan pengoperasian

Timeout tiap panggilan lima menit, output maksimum 256 KB dan JSON tervalidasi. Hasil gagal tidak ditandai complete. Heartbeat/lease/cancel existing menghentikan proses beserta child-nya. Lock `office.lock` menjaga satu writer per profil; setelah crash periksa proses pemilik PID sudah berhenti sebelum menghapus lock. Memory tidak dihapus saat retry/cancel dan dapat memuat catatan dari tugas yang kemudian dibatalkan. Jangan memakai satu home untuk beberapa akun CEO atau menjalankan CLI manual pada profil yang sedang dikerjakan worker.

Smoke sintetis tanpa database/Telegram:

```powershell
rtk proxy node_modules\.bin\tsx.cmd qa/hermes-office-smoke.ts
```

Rujukan: [Hermes profiles](https://hermes-agent.nousresearch.com/docs/user-guide/profiles), [CLI](https://hermes-agent.nousresearch.com/docs/user-guide/cli). Tidak mengubah instalasi/global config Hermes atau login Codex.
