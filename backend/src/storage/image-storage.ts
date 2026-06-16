import crypto from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

export type StoredImage = {
  url: string;
  storage: 'cloudinary' | 'local';
};

const uploadDir = path.resolve(__dirname, '../../uploads');

export async function storePreviewImage(file: Express.Multer.File) {
  if (config.storage.cloudinaryUrl) {
    configureCloudinary(config.storage.cloudinaryUrl);
    return uploadToCloudinary(file);
  }

  return uploadToLocalDisk(file);
}

function configureCloudinary(cloudinaryUrl: string) {
  const parsedUrl = new URL(cloudinaryUrl);

  cloudinary.config({
    cloud_name: parsedUrl.hostname,
    api_key: decodeURIComponent(parsedUrl.username),
    api_secret: decodeURIComponent(parsedUrl.password),
  });
}

function uploadToCloudinary(file: Express.Multer.File): Promise<StoredImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: config.storage.cloudinaryFolder,
        resource_type: 'image',
        transformation: [
          { width: 1280, height: 1280, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }

        resolve({
          url: result.secure_url,
          storage: 'cloudinary',
        });
      },
    );

    stream.end(file.buffer);
  });
}

async function uploadToLocalDisk(file: Express.Multer.File): Promise<StoredImage> {
  await mkdir(uploadDir, { recursive: true });

  const extension = getImageExtension(file.mimetype);
  const filename = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}.${extension}`;
  const absolutePath = path.join(uploadDir, filename);

  await writeFile(absolutePath, file.buffer);

  return {
    url: `/uploads/${filename}`,
    storage: 'local',
  };
}

function getImageExtension(mimetype: string) {
  switch (mimetype) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}
