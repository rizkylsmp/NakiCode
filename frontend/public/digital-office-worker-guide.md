# Hubungkan komputer ke Kantor Digital

Kantor Digital mengirim antrean ke backend website. Worker pada komputer Anda mengambil antrean melalui koneksi keluar, menjalankan Codex CLI, lalu menyimpan hasil pada akun admin. Tidak perlu membuka port komputer ke internet.

1. Pasang dependency project dengan `npm ci` dari folder `WEBSITE`.
2. Pastikan Codex CLI terpasang dan sudah login: `codex login`. Worker memakai sesi ChatGPT CLI, terpisah dari chat desktop. Penggunaan mengikuti kuota akun Codex.
3. Pada AI Manager, pilih **Hubungkan komputer**. Simpan file unduhan sebagai `WEBSITE/.local/digital-office/worker.json`. File ini berisi token khusus worker. Jangan bagikan atau commit file tersebut.
4. Dari folder `WEBSITE`, jalankan:

```sh
npm run office:worker --workspace backend -- --config ../.local/digital-office/worker.json
```

5. Tunggu status **Codex terhubung**, bagikan instruksi CEO, lalu pilih **Jalankan agents**. Komputer harus tetap menyala dengan worker aktif dan internet tersedia.

Jika memakai backend lokal, nilai `apiUrl` pada konfigurasi harus alamat backend (misalnya `http://127.0.0.1:3001`), atau alamat Vite yang mem-proxy API. Untuk website online, gunakan URL backend HTTPS. Jangan tambahkan `/api` pada URL tersebut. URL frontend berbeda dari backend perlu diarahkan ke backend.

Worker menjalankan agent berurutan dan manager menyusun laporan akhir. Pemilihan agent awal memakai kata kunci; hasil setiap agent dan laporan akhir dibuat oleh Codex. Prioritas saat ini metadata, antrean diproses sesuai waktu masuk. Hasil adalah draft; worker tidak mempublikasikan, mengirim pesan, atau mengubah source project.

Worker memakai folder sementara, sandbox read-only, session ephemeral, dan konfigurasi CLI terisolasi. Tidak perlu API key baru. Pada Windows, worker memprioritaskan Codex bawaan aplikasi desktop supaya format konfigurasi dan model cocok. Jika CLI tidak ditemukan, tambahkan `codexExecutable` dengan path absolut executable asli Codex pada konfigurasi worker. Gunakan CLI yang kompatibel dengan konfigurasi/login saat ini.

**Batalkan proses** menghentikan lease; worker menghentikan proses Codex setelah pemeriksaan heartbeat, maksimum sekitar 30 detik. Hasil yang sudah selesai tetap tersimpan. Jika worker terputus lebih dari 90 detik, tugas ditandai terhenti dan perlu dilanjutkan oleh CEO. Tidak ada retry otomatis untuk job yang sudah diambil.

**Putuskan** mencabut pairing komputer. Untuk menyambungkan kembali, unduh konfigurasi baru. Ctrl+C menghentikan worker di komputer.

Voice pada kolom CEO menggunakan pengenalan suara browser. Dukungan bergantung pada browser dan izin mikrofon; layanan browser dapat memproses suara secara online. Gunakan HTTPS atau localhost dan tinjau teks sebelum membagikan tugas.
