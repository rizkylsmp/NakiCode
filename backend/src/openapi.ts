export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Naki Code API',
    version: '1.0.0',
    description:
      'API Naki Code untuk katalog design, order jasa website, payment, wishlist, notifikasi, blog, coupon, dan bundle.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Versioned API',
    },
    {
      url: '/api',
      description: 'Legacy API alias',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    },
  },
  paths: {
    '/templates': {
      get: {
        summary: 'List design katalog',
        responses: { 200: { description: 'Daftar design' } },
      },
      post: {
        summary: 'Buat design baru',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Design dibuat' } },
      },
    },
    '/templates/{slug}': {
      get: {
        summary: 'Detail design',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { 200: { description: 'Detail design' } },
      },
    },
    '/orders': {
      get: {
        summary: 'List order admin',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar order' } },
      },
      post: {
        summary: 'Buat order user',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Order dibuat' } },
      },
    },
    '/orders/my': {
      get: {
        summary: 'List pesanan user aktif',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Pesanan user' } },
      },
    },
    '/orders/{id}/payment': {
      post: {
        summary: 'Buat sesi pembayaran',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Payment session' } },
      },
    },
    '/favorites/my': {
      get: {
        summary: 'List design favorit user',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Design IDs' } },
      },
    },
    '/notifications/my': {
      get: {
        summary: 'List notifikasi user',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Notifikasi user' } },
      },
    },
    '/blog': {
      get: {
        summary: 'List artikel published',
        responses: { 200: { description: 'Daftar artikel' } },
      },
      post: {
        summary: 'Buat artikel blog',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Artikel dibuat' } },
      },
    },
    '/business/coupons/validate': {
      post: {
        summary: 'Validasi coupon/discount',
        responses: { 200: { description: 'Discount valid' } },
      },
    },
    '/business/bundles': {
      get: {
        summary: 'List paket bundle design',
        responses: { 200: { description: 'Daftar bundle' } },
      },
    },
  },
};
