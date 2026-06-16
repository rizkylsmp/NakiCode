# Security Checklist

## Secret Rotation

- `ADMIN_TOKEN_SECRET` adalah secret internal aplikasi dan bisa dirotasi langsung di `backend/.env`.
- `SMTP_PASSWORD` harus dirotasi dari provider email atau app-password dashboard, lalu value barunya ditempel ke `backend/.env`.
- `MIDTRANS_SERVER_KEY` harus dirotasi dari Midtrans Dashboard, lalu value barunya ditempel ke `backend/.env`.
- Setelah secret berubah, restart backend supaya konfigurasi baru terbaca.

## HTTP Security

- Backend memakai `helmet` untuk security headers.
- Backend memakai `express-rate-limit` untuk global API limit dan limit lebih ketat di `/api/auth`.
- CORS memakai allowlist dari `CLIENT_ORIGINS`.

## Production Notes

- Set `CLIENT_ORIGINS` ke domain frontend production, pisahkan banyak origin dengan koma.
- Jangan commit file `.env`.
- Untuk payment production, aktifkan webhook provider supaya status `paid` tidak bergantung tombol konfirmasi dev.
- Midtrans notification URL:
  `https://domain-kamu.com/api/payments/midtrans/webhook`
- Preview image production sebaiknya memakai Cloudinary/S3. Set `CLOUDINARY_URL` agar DB hanya menyimpan URL CDN.
