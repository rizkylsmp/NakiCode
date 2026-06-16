# Naki Code

Full-stack starter untuk website **Naki Code**.

## Stack

- Frontend: React, TypeScript TSX, Vite, Tailwind CSS
- Backend: Express, TypeScript, MySQL via `mysql2`

## Project Context

Konteks produk dan workflow disimpan di:

- `AGENTS.md`
- `docs/PROJECT_WORKFLOW.md`

Naki Code diarahkan sebagai toko template coding dan jasa custom website. Referensi fungsi mengikuti pola Web Ekspor, tetapi tanpa fitur domain, cek domain, atau paket hosting/domain.

## Setup

```bash
npm install
cp backend/.env.example backend/.env
npm run dev
```

Frontend berjalan di `http://localhost:5173`.
Backend berjalan di `http://localhost:3001`.

Di Windows, kamu juga bisa menjalankan `dev.cmd` dari root project untuk start frontend dan backend sekaligus.

Route frontend utama:

- `/`
- `/templates/:slug`
- `/admin/templates` untuk kelola template, melihat order/konsultasi, dan filter order berdasarkan status

## Environment Backend

Edit `backend/.env` sesuai konfigurasi MySQL lokal:

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=naki_code
ADMIN_USERNAME=admin
ADMIN_PASSWORD=nakicode123
ADMIN_TOKEN_SECRET=change-this-secret
ADMIN_TOKEN_TTL_SECONDS=28800
```

Endpoint awal:

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/projects`
- `GET /api/templates`
- `GET /api/templates/:slug`
- `POST /api/templates`
- `PUT /api/templates/:id`
- `DELETE /api/templates/:id`
- `GET /api/categories`
- `POST /api/orders`
- `GET /api/orders` (butuh token admin)
- `PATCH /api/orders/:id/status` (butuh token admin)

Schema database awal ada di `backend/database/schema.sql`.
Saat backend start, server akan membuat database dari `MYSQL_DATABASE`, menjalankan schema otomatis, dan memastikan admin default dari `.env` ada di tabel `users` dengan `role = 'admin'`. Jika MySQL tidak tersedia, backend gagal start supaya aplikasi tidak memakai data seed lokal.

Query backend dipisah di `backend/src/models`:

- `admin.model.ts`
- `template.model.ts`
- `order.model.ts`
- `category.model.ts`
- `project.model.ts`

Credential admin default untuk development:

- Username: `admin`
- Password: `nakicode123`

Ganti nilai tersebut di `backend/.env` sebelum dipakai di luar lokal.
