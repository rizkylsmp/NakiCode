import { Router } from 'express';
import * as Sentry from '@sentry/node';
import multer from 'multer';
import sharp from 'sharp';
import { requireAdmin } from '../auth';
import { createAdminAuditLog } from '../models/audit-log.model';
import { storePreviewImage } from '../storage/image-storage';

export const uploadsRouter = Router();

const MIN_DIMENSION = 200;
const MAX_DIMENSION = 4000;
const MAX_ASPECT_RATIO = 3;

interface DimensionValidationError {
  status: number;
  message: string;
}

async function validateImageDimensions(
  buffer: Buffer,
): Promise<DimensionValidationError | null> {
  const { width, height } = await sharp(buffer).metadata();

  if (!width || !height) {
    return { status: 400, message: 'Gambar tidak valid' };
  }

  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    return {
      status: 400,
      message: 'Ukuran gambar terlalu kecil (min 200x200 piksel)',
    };
  }

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return {
      status: 400,
      message: 'Ukuran gambar terlalu besar (maks 4000x4000 piksel)',
    };
  }

  const ratio = width > height ? width / height : height / width;
  if (ratio > MAX_ASPECT_RATIO) {
    return {
      status: 400,
      message: 'Proporsi gambar tidak valid (rasio maksimal 3:1)',
    };
  }

  return null;
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter(_request, file, callback) {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      callback(new Error('Hanya file JPEG, PNG, WebP, dan GIF yang diperbolehkan'));
      return;
    }

    callback(null, true);
  },
});

uploadsRouter.post(
  '/images',
  requireAdmin,
  upload.array('images', 10),
  async (request, response) => {
    const files = (request.files ?? []) as Express.Multer.File[];

    if (!files.length) {
      response.status(400).json({ message: 'Minimal satu gambar wajib diupload' });
      return;
    }

    try {
      for (const file of files) {
        const validationError = await validateImageDimensions(file.buffer);
        if (validationError) {
          response.status(validationError.status).json({ message: validationError.message });
          return;
        }
      }

      const images = await Promise.all(files.map((file) => storePreviewImage(file)));

      await createAdminAuditLog({
        admin: (response.locals as { admin?: { userId: number; sub: string } }).admin,
        action: 'upload_images',
        entityType: 'upload',
        metadata: {
          count: images.length,
          urls: images.map((img) => img.url).filter(Boolean),
          ip: request.ip ?? 'unknown',
        },
      });

      response.status(201).json({
        images,
      });
    } catch (error) {
      Sentry.captureException(error);
      response.status(500).json({ message: 'Gagal upload gambar preview' });
    }
  },
);
