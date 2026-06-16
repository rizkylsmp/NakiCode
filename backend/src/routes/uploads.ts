import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../auth';
import { storePreviewImage } from '../storage/image-storage';

export const uploadsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter(_request, file, callback) {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Only image files are allowed'));
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
      const images = await Promise.all(files.map((file) => storePreviewImage(file)));

      response.status(201).json({
        images,
      });
    } catch {
      response.status(500).json({ message: 'Gagal upload gambar preview' });
    }
  },
);
