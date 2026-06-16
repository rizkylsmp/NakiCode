export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Naki Code API',
    version: '1.0.0',
    description:
      'API toko template Naki Code untuk katalog, order, payment, wishlist, notifikasi, blog, coupon, referral, dan bundle.',
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
        summary: 'List template katalog',
        responses: { 200: { description: 'Daftar template' } },
      },
      post: {
        summary: 'Buat template baru',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Template dibuat' } },
      },
    },
    '/templates/{slug}': {
      get: {
        summary: 'Detail template',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { 200: { description: 'Detail template' } },
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
        summary: 'List template favorit user',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Template IDs' } },
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
        summary: 'List paket bundle template',
        responses: { 200: { description: 'Daftar bundle' } },
      },
    },
    '/business/referrals/{code}/click': {
      post: {
        summary: 'Track klik referral affiliate',
        responses: { 200: { description: 'Referral tracked' } },
      },
    },
  },
};
