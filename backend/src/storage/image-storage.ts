import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../config";

export type StoredImage = {
  url: string;
  storage: "cloudinary" | "local";
};

const uploadDir = path.resolve(__dirname, "../../uploads");

export async function storePreviewImage(file: Express.Multer.File) {
  if (config.storage.cloudinaryUrl) {
    configureCloudinary(config.storage.cloudinaryUrl);
    return uploadToCloudinary(file);
  }

  return uploadToLocalDisk(file);
}

export async function storePreviewVideo(file: Express.Multer.File) {
  if (config.storage.cloudinaryUrl) {
    configureCloudinary(config.storage.cloudinaryUrl);
    return uploadVideoToCloudinary(file);
  }

  return uploadVideoToLocalDisk(file);
}

export async function storeSourcePackage(file: Express.Multer.File) {
  if (config.storage.cloudinaryUrl) {
    configureCloudinary(config.storage.cloudinaryUrl);
    return uploadSourceToCloudinary(file);
  }

  return uploadSourceToLocalDisk(file);
}

export async function storeRevisionAttachment(file: Express.Multer.File) {
  if (config.storage.cloudinaryUrl) {
    configureCloudinary(config.storage.cloudinaryUrl);
    return uploadRevisionToCloudinary(file);
  }

  return uploadRevisionToLocalDisk(file);
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
        resource_type: "image",
        transformation: [
          { width: 1280, height: 1280, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
          storage: "cloudinary",
        });
      },
    );

    stream.end(file.buffer);
  });
}

function uploadVideoToCloudinary(
  file: Express.Multer.File,
): Promise<StoredImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: config.storage.cloudinaryFolder,
        resource_type: "video",
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary video upload failed"));
          return;
        }
        resolve({ url: result.secure_url, storage: "cloudinary" });
      },
    );
    stream.end(file.buffer);
  });
}

function uploadSourceToCloudinary(
  file: Express.Multer.File,
): Promise<StoredImage> {
  return new Promise((resolve, reject) => {
    const extension = getSourceExtension(file.originalname);
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${config.storage.cloudinaryFolder}/source`,
        resource_type: "raw",
        public_id: `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${extension}`,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary source upload failed"));
          return;
        }
        resolve({ url: result.secure_url, storage: "cloudinary" });
      },
    );
    stream.end(file.buffer);
  });
}

function uploadRevisionToCloudinary(
  file: Express.Multer.File,
): Promise<StoredImage & { name: string; mimetype: string; size: number }> {
  return new Promise((resolve, reject) => {
    const safeName = sanitizeAttachmentName(file.originalname);
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${config.storage.cloudinaryFolder}/revisions`,
        resource_type: "raw",
        public_id: `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${safeName}`,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary revision upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          storage: "cloudinary",
          name: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });
      },
    );
    stream.end(file.buffer);
  });
}

async function uploadToLocalDisk(
  file: Express.Multer.File,
): Promise<StoredImage> {
  await mkdir(uploadDir, { recursive: true });

  const extension = getImageExtension(file.mimetype);
  const filename = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}.${extension}`;
  const absolutePath = path.join(uploadDir, filename);

  await writeFile(absolutePath, file.buffer);

  return {
    url: `/uploads/${filename}`,
    storage: "local",
  };
}

async function uploadVideoToLocalDisk(
  file: Express.Multer.File,
): Promise<StoredImage> {
  await mkdir(uploadDir, { recursive: true });
  const extension = getVideoExtension(file.mimetype);
  const filename = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}.${extension}`;
  await writeFile(path.join(uploadDir, filename), file.buffer);
  return { url: `/uploads/${filename}`, storage: "local" };
}

async function uploadSourceToLocalDisk(
  file: Express.Multer.File,
): Promise<StoredImage> {
  const sourceDir = path.join(uploadDir, "source");
  await mkdir(sourceDir, { recursive: true });
  const extension = getSourceExtension(file.originalname);
  const filename = `${Date.now()}-${crypto.randomBytes(12).toString("hex")}.${extension}`;
  await writeFile(path.join(sourceDir, filename), file.buffer);
  return { url: `/uploads/source/${filename}`, storage: "local" };
}

async function uploadRevisionToLocalDisk(
  file: Express.Multer.File,
): Promise<StoredImage & { name: string; mimetype: string; size: number }> {
  const revisionDir = path.join(uploadDir, "revisions");
  await mkdir(revisionDir, { recursive: true });
  const safeName = sanitizeAttachmentName(file.originalname);
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${safeName}`;
  await writeFile(path.join(revisionDir, filename), file.buffer);
  return {
    url: `/uploads/revisions/${filename}`,
    storage: "local",
    name: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  };
}

function sanitizeAttachmentName(filename: string) {
  const parsed = path.parse(filename);
  const safeBase =
    parsed.name
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "lampiran";
  const safeExtension = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, "");
  return `${safeBase}${safeExtension}`;
}

function getImageExtension(mimetype: string) {
  switch (mimetype) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

function getVideoExtension(mimetype: string) {
  if (mimetype === "video/webm") return "webm";
  if (mimetype === "video/quicktime") return "mov";
  return "mp4";
}

function getSourceExtension(filename: string) {
  return filename.toLowerCase().endsWith(".rar") ? "rar" : "zip";
}
