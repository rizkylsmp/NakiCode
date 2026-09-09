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
