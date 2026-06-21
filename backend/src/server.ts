import express from 'express';
import * as Sentry from '@sentry/node';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';
import { cacheHeaders } from './cache';
import { config } from './config';
import { initializeDatabase } from './db';
import { initializeEmailQueue } from './email-queue';
import { ensureDefaultAdminUser } from './models/user.model';
import { openApiDocument } from './openapi';
import adminStatsRouter from './routes/admin/stats';
import { authRouter } from './routes/auth';
import { blogPostsRouter } from './routes/blog-posts';
import { businessRouter } from './routes/business';
import { categoriesRouter } from './routes/categories';
import { favoritesRouter } from './routes/favorites';
import { healthRouter } from './routes/health';
import { notificationsRouter } from './routes/notifications';
import { ordersRouter } from './routes/orders';
import { paymentsRouter } from './routes/payments';
import { projectsRouter } from './routes/projects';
import { templatesRouter } from './routes/templates';
import { uploadsRouter } from './routes/uploads';
import {
  apiRateLimit,
  authRateLimit,
  corsMiddleware,
  securityHeaders,
} from './security';

// Initialize Sentry (must be first)
if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.sentry.environment,
    tracesSampleRate: config.sentry.tracesSampleRate,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });
  console.log(`Sentry error monitoring enabled (${config.sentry.environment})`);
}

export const app = express();

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(apiRateLimit);
app.use(express.json({ limit: '1mb' }));
app.use(cacheHeaders);

// Track database initialization for serverless
let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

async function ensureDatabase() {
  if (dbInitialized) return;

  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await initializeDatabase();
      await ensureDefaultAdminUser();
      initializeEmailQueue();
      dbInitialized = true;
      console.log(`MySQL database ready: ${config.mysql.database}`);
    })();
  }

  await dbInitPromise;
}

// Middleware to ensure database is initialized before API routes (serverless)
app.use('/api', async (req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database initialization failed';
    console.error(`Database init error: ${message}`);

    if (config.sentry.dsn && error instanceof Error) {
      Sentry.captureException(error);
    }

    res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Database is not ready. Please try again later.'
    });
  }
});

app.get('/api', (_request, response) => {
  response.json({
    name: 'Naki Code API',
    status: 'online',
  });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get('/api/openapi.json', (_request, response) => {
  response.json(openApiDocument);
});

mountApiRoutes('/api');
mountApiRoutes('/api/v1');

// Sentry error handler (must be after routes, before other error handlers)
if (config.sentry.dsn) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'), {
    immutable: true,
    maxAge: '30d',
  }),
);

function mountApiRoutes(prefix: string) {
  app.use(`${prefix}/health`, healthRouter);
  app.use(`${prefix}/auth`, authRateLimit, authRouter);
  app.use(`${prefix}/admin/stats`, adminStatsRouter);
  app.use(`${prefix}/projects`, projectsRouter);
  app.use(`${prefix}/templates`, templatesRouter);
  app.use(`${prefix}/favorites`, favoritesRouter);
  app.use(`${prefix}/notifications`, notificationsRouter);
  app.use(`${prefix}/categories`, categoriesRouter);
  app.use(`${prefix}/orders`, ordersRouter);
  app.use(`${prefix}/payments`, paymentsRouter);
  app.use(`${prefix}/uploads`, uploadsRouter);
  app.use(`${prefix}/blog`, blogPostsRouter);
  app.use(`${prefix}/business`, businessRouter);
}

export async function startServer() {
  try {
    await initializeDatabase();
    await ensureDefaultAdminUser();
    initializeEmailQueue();
    console.log(`MySQL database ready: ${config.mysql.database}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown database init error';
    console.error(`MySQL database init failed: ${message}`);
    
    // Capture error to Sentry before exit
    if (config.sentry.dsn && error instanceof Error) {
      Sentry.captureException(error);
      await Sentry.close(2000); // Wait up to 2s for Sentry to send
    }
    
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`Naki Code API listening on http://localhost:${config.port}`);
  });
}

if (require.main === module) {
  void startServer();
}

// Export for Vercel serverless deployment
export default app;
