import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Zod schema for environment variable validation
const envSchema = z.object({
  // Server configuration
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  CLIENT_ORIGINS: z.string().default('http://localhost:5173'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(900000),
  RATE_LIMIT_API_LIMIT: z.coerce.number().positive().default(300),
  RATE_LIMIT_AUTH_LIMIT: z.coerce.number().positive().default(30),

  // MySQL database - CRITICAL (required)
  MYSQL_HOST: z.string().min(1, 'MYSQL_HOST is required'),
  MYSQL_PORT: z.coerce.number().int().positive().default(3306),
  MYSQL_USER: z.string().min(1, 'MYSQL_USER is required'),
  MYSQL_PASSWORD: z.string(), // Allow empty for local dev (common for root@localhost)
  MYSQL_DATABASE: z.string().min(1, 'MYSQL_DATABASE is required'),

  // Admin authentication - CRITICAL
  ADMIN_USERNAME: z.string().min(1).default('admin'),
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email address'),
  ADMIN_PASSWORD: z
    .string()
    .min(8, 'ADMIN_PASSWORD must be at least 8 characters'),
  ADMIN_TOKEN_SECRET: z
    .string()
    .min(32, 'ADMIN_TOKEN_SECRET must be at least 32 characters for security'),
  ADMIN_TOKEN_TTL_SECONDS: z.coerce.number().positive().default(28800),

  // SMTP email - CRITICAL (required for OTP, notifications)
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required for email functionality'),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required for email functionality'),
  SMTP_PASSWORD: z
    .string()
    .min(1, 'SMTP_PASSWORD is required for email functionality'),
  SMTP_FROM_NAME: z.string().default('Naki Code'),
  SMTP_FROM_EMAIL: z.string().email().optional().or(z.literal('')),

  // Email verification settings
  EMAIL_OTP_TTL_MINUTES: z.coerce.number().positive().default(10),
  PASSWORD_RESET_OTP_TTL_MINUTES: z.coerce.number().positive().default(10),

  // Redis - optional (for queue/cache)
  REDIS_URL: z.string().optional().or(z.literal('')),
  EMAIL_QUEUE_NAME: z.string().default('naki-code-email'),
  REDIS_CACHE_TTL_SECONDS: z.coerce.number().positive().default(120),

  // Payment provider - optional (defaults to dev mode)
  PAYMENT_PROVIDER: z
    .enum(['dev', 'midtrans', 'xendit'])
    .default('dev'),
  MIDTRANS_SERVER_KEY: z.string().optional().or(z.literal('')),
  MIDTRANS_IS_PRODUCTION: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),

  // Storefront configuration - optional
  STOREFRONT_WHATSAPP_NUMBER: z.string().optional().or(z.literal('')),

  // Cloud storage - optional (falls back to local)
  CLOUDINARY_URL: z.string().optional().or(z.literal('')),
  CLOUDINARY_FOLDER: z.string().default('naki-code/templates'),

  // Sentry error monitoring - optional
  SENTRY_DSN: z.string().optional().or(z.literal('')),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
});

// Validate environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('\n❌ Environment variable validation failed:\n');
  
  if (error instanceof z.ZodError) {
    error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      console.error(`  • ${path}: ${issue.message}`);
    });
  } else {
    console.error('  Unexpected validation error:', error);
  }
  
  console.error('\n💡 Check your .env file and ensure all required variables are set.\n');
  process.exit(1);
}

// Export validated and typed configuration
export const config = {
  port: env.PORT,
  clientOrigin: env.CLIENT_ORIGIN,
  clientOrigins: env.CLIENT_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    apiLimit: env.RATE_LIMIT_API_LIMIT,
    authLimit: env.RATE_LIMIT_AUTH_LIMIT,
  },
  auth: {
    adminUsername: env.ADMIN_USERNAME,
    adminEmail: env.ADMIN_EMAIL,
    adminPassword: env.ADMIN_PASSWORD,
    tokenSecret: env.ADMIN_TOKEN_SECRET,
    tokenTtlSeconds: env.ADMIN_TOKEN_TTL_SECONDS,
  },
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    fromEmail: env.SMTP_FROM_EMAIL || env.SMTP_USER,
    fromName: env.SMTP_FROM_NAME,
  },
  verification: {
    otpTtlMinutes: env.EMAIL_OTP_TTL_MINUTES,
    passwordResetOtpTtlMinutes: env.PASSWORD_RESET_OTP_TTL_MINUTES,
  },
  queue: {
    redisUrl: env.REDIS_URL || '',
    emailQueueName: env.EMAIL_QUEUE_NAME,
  },
  cache: {
    redisUrl: env.REDIS_URL || '',
    ttlSeconds: env.REDIS_CACHE_TTL_SECONDS,
  },
  payment: {
    provider: env.PAYMENT_PROVIDER,
    midtransServerKey: env.MIDTRANS_SERVER_KEY || '',
    midtransIsProduction: env.MIDTRANS_IS_PRODUCTION,
  },
  storefront: {
    whatsappNumber: env.STOREFRONT_WHATSAPP_NUMBER || '',
  },
  storage: {
    cloudinaryUrl: env.CLOUDINARY_URL || '',
    cloudinaryFolder: env.CLOUDINARY_FOLDER,
  },
  mysql: {
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
  },
  sentry: {
    dsn: env.SENTRY_DSN || '',
    environment: env.NODE_ENV,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
  },
};
