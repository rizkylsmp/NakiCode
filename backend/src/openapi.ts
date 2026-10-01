export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Naki Code API",
    version: "1.0.0",
    description:
      "API Naki Code untuk katalog design, order jasa website, payment, wishlist, notifikasi, blog, coupon, dan bundle.",
  },
  servers: [
    {
      url: "/api/v1",
      description: "Versioned API",
    },
    {
      url: "/api",
      description: "Legacy API alias",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    },
  },
  paths: {
    "/orders/admin-create": {
      post: { summary: "Buat order custom untuk klien lama atau undangan klien baru", security: [{ bearerAuth: [] }], responses: { 201: { description: "Order dibuat; respons berisi tautan klien, kedaluwarsa, dan status email" }, 400: { description: "Data klien tidak valid" }, 401: { description: "Admin wajib login" } } },
    },
    "/orders/{id}/client-invitation": {
      post: { summary: "Perbarui undangan yang belum diklaim; tautan lama menjadi tidak berlaku", security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Undangan baru berlaku 72 jam" }, 409: { description: "Order tidak memiliki undangan yang dapat diperbarui" } } },
    },
    "/auth/client-invitations/inspect": {
      post: { summary: "Periksa undangan menggunakan token pada request body; respons no-store", responses: { 200: { description: "Informasi undangan dengan email tersamarkan" }, 400: { description: "Token tidak valid" }, 410: { description: "Undangan kedaluwarsa, sudah dipakai, atau order dihapus" } } },
    },
    "/auth/client-invitations/claim": {
      post: { summary: "Klaim undangan sekali pakai dengan password baru atau sesi akun lama yang sesuai; persetujuan ketentuan wajib", responses: { 200: { description: "Akun klien dan order ditautkan; token login dikembalikan" }, 400: { description: "Password/persetujuan tidak valid" }, 409: { description: "Email sudah terdaftar; wajib login ke akun tersebut" }, 410: { description: "Undangan tidak tersedia" } } },
    },
    "/auth/user/google": {
      post: {
        summary: "Login atau daftar user dengan Google ID token",
        responses: {
          200: { description: "Login Google berhasil" },
          401: { description: "Google ID token tidak valid" },
          503: { description: "Login Google belum dikonfigurasi" },
        },
      },
    },
    "/auth/user/google/link": {
      post: {
        summary:
          "Hubungkan Google ke akun user yang sudah ada dengan konfirmasi password",
        responses: {
          200: { description: "Akun Google berhasil dihubungkan dan login" },
          401: { description: "Credential Google atau password tidak valid" },
          409: { description: "Identitas Google mengalami konflik" },
          503: { description: "Login Google belum dikonfigurasi" },
        },
      },
    },
    "/templates": {
      get: {
        summary: "List design katalog",
        responses: { 200: { description: "Daftar design" } },
      },
      post: {
        summary: "Buat design baru",
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Design dibuat" } },
      },
    },
    "/templates/{slug}": {
      get: {
        summary: "Detail design",
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Detail design" } },
      },
    },
    "/orders": {
      get: {
        summary: "List order admin",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Daftar order" } },
      },
      post: {
        summary: "Buat order user",
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Order dibuat" } },
      },
    },
    "/orders/my": {
      get: {
        summary: "List pesanan user aktif",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Pesanan user" } },
      },
    },
    "/orders/{id}/payment": {
      post: {
        summary: "Buat sesi pembayaran",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Payment session" } },
      },
    },
    "/orders/{id}/quote": {
      patch: {
        summary: "Tetapkan penawaran harga order custom",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Penawaran tersimpan" } },
      },
    },
    "/orders/bulk/status": {
      patch: {
        summary: "Perbarui workflow beberapa order",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Status order diperbarui" } },
      },
    },
    "/finance/transactions": {
      get: {
        summary: "Ringkasan dan transaksi pembukuan",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Data pembukuan" } },
      },
    },
    "/finance/expenses": {
      post: {
        summary: "Catat pengeluaran",
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Pengeluaran tersimpan" } },
      },
    },
    "/finance/orders/{id}/refund": {
      post: {
        summary: "Catat refund parsial atau penuh",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Refund tercatat" } },
      },
    },
    "/favorites/my": {
      get: {
        summary: "List design favorit user",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Design IDs" } },
      },
    },
    "/notifications/my": {
      get: {
        summary: "List notifikasi user",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Notifikasi user" } },
      },
    },
    "/blog": {
      get: {
        summary: "List artikel published",
        responses: { 200: { description: "Daftar artikel" } },
      },
      post: {
        summary: "Buat artikel blog",
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Artikel dibuat" } },
      },
    },
    "/business/coupons/validate": {
      post: {
        summary: "Validasi coupon/discount",
        responses: { 200: { description: "Discount valid" } },
      },
    },
    "/business/coupons/banners": {
      get: {
        summary: "List banner coupon aktif untuk storefront",
        responses: { 200: { description: "Daftar banner coupon aktif dan belum habis" } },
      },
    },
    "/business/bundles": {
      get: {
        summary: "List paket bundle design",
        responses: { 200: { description: "Daftar bundle" } },
      },
    },
  },
};
