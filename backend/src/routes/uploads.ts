import { Router, type RequestHandler } from "express";
import * as Sentry from "@sentry/node";
import multer from "multer";
import sharp from "sharp";
import { requireAdmin, requireUser, type UserTokenPayload } from "../auth";
import { createAdminAuditLog } from "../models/audit-log.model";
import {
  storePreviewImage,
  storePreviewVideo,
  storeRevisionAttachment,
  storeSourcePackage,
} from "../storage/image-storage";

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
    return { status: 400, message: "Gambar tidak valid" };
  }

  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    return {
      status: 400,
      message: "Ukuran gambar terlalu kecil (min 200x200 piksel)",
    };
  }

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return {
      status: 400,
      message: "Ukuran gambar terlalu besar (maks 4000x4000 piksel)",
    };
  }

  const ratio = width > height ? width / height : height / width;
  if (ratio > MAX_ASPECT_RATIO) {
    return {
      status: 400,
      message: "Proporsi gambar tidak valid (rasio maksimal 3:1)",
    };
  }

  return null;
}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter(_request, file, callback) {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      callback(
        new Error("Hanya file JPEG, PNG, WebP, dan GIF yang diperbolehkan"),
      );
      return;
    }

    callback(null, true);
  },
});

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter(_request, file, callback) {
    if (!ALLOWED_VIDEO_TYPES.has(file.mimetype)) {
      callback(new Error("Hanya file MP4, WebM, dan MOV yang diperbolehkan"));
      return;
    }
    callback(null, true);
  },
});

const sourceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  fileFilter(_request, file, callback) {
    if (!/\.(zip|rar)$/i.test(file.originalname)) {
      callback(new Error("Hanya file ZIP dan RAR yang diperbolehkan"));
      return;
    }
    callback(null, true);
  },
});

const ALLOWED_REVISION_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".txt", ".csv", ".json", ".md", ".zip", ".rar", ".7z",
]);

export function isAllowedRevisionAttachmentName(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  const extension = dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
  return ALLOWED_REVISION_EXTENSIONS.has(extension);
}

const revisionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 5 },
  fileFilter(_request, file, callback) {
    if (!isAllowedRevisionAttachmentName(file.originalname)) {
      callback(
        new Error(
          "Format lampiran tidak didukung. Gunakan gambar, PDF, dokumen Office, teks/data, atau arsip.",
        ),
      );
      return;
    }
    callback(null, true);
  },
});
const acceptRevisionFiles: RequestHandler = (request, response, next) => {
  revisionUpload.array("files", 5)(request, response, (error) => {
    if (error) {
      response.status(400).json({
        message:
          error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
            ? "Ukuran setiap lampiran maksimal 20 MB"
            : error instanceof Error
              ? error.message
              : "Lampiran revisi tidak valid",
      });
      return;
    }
    next();
  });
};

uploadsRouter.post(
  "/images",
  requireAdmin,
  upload.array("images", 10),
  async (request, response) => {
    const files = (request.files ?? []) as Express.Multer.File[];

    if (!files.length) {
      response
        .status(400)
        .json({ message: "Minimal satu gambar wajib diupload" });
      return;
    }

    try {
      for (const file of files) {
        const validationError = await validateImageDimensions(file.buffer);
        if (validationError) {
          response
            .status(validationError.status)
            .json({ message: validationError.message });
          return;
        }
      }

      const images = await Promise.all(
        files.map((file) => storePreviewImage(file)),
      );

      await createAdminAuditLog({
        admin: response.locals.admin as UserTokenPayload | null | undefined,
        action: "upload_images",
        entityType: "upload",
        metadata: {
          count: images.length,
          urls: images.map((img) => img.url).filter(Boolean),
          ip: request.ip ?? "unknown",
        },
      });

      response.status(201).json({
        images,
      });
    } catch (error) {
      Sentry.captureException(error);
      response.status(500).json({ message: "Gagal upload gambar preview" });
    }
  },
);

uploadsRouter.post(
  "/revisions",
  requireUser,
  acceptRevisionFiles,
  async (request, response) => {
    const files = (request.files ?? []) as Express.Multer.File[];
    if (!files.length) {
      response.status(400).json({ message: "Minimal satu file wajib diupload" });
      return;
    }
    try {
      const stored = await Promise.all(
        files.map((file) => storeRevisionAttachment(file)),
      );
      response.status(201).json({ files: stored });
    } catch (error) {
      Sentry.captureException(error);
      response.status(500).json({ message: "Gagal upload lampiran revisi" });
    }
  },
);

uploadsRouter.post(
  "/video",
  requireAdmin,
  videoUpload.single("video"),
  async (request, response) => {
    const file = request.file;
    if (!file) {
      response.status(400).json({ message: "File video wajib diupload" });
      return;
    }
    try {
      const video = await storePreviewVideo(file);
      await createAdminAuditLog({
        admin: response.locals.admin as UserTokenPayload | null | undefined,
        action: "upload_video",
        entityType: "upload",
        metadata: {
          url: video.url,
          size: file.size,
          mimetype: file.mimetype,
          ip: request.ip ?? "unknown",
        },
      });
      response.status(201).json({ video });
    } catch (error) {
      Sentry.captureException(error);
      response.status(500).json({ message: "Gagal upload video preview" });
    }
  },
);

uploadsRouter.post(
  "/source",
  requireAdmin,
  sourceUpload.single("source"),
  async (request, response) => {
    const file = request.file;
    if (!file) {
      response
        .status(400)
        .json({ message: "File source ZIP atau RAR wajib diupload" });
      return;
    }
    const isZip = file.buffer.subarray(0, 2).equals(Buffer.from([0x50, 0x4b]));
    const isRar = file.buffer
      .subarray(0, 6)
      .equals(Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]));
    if (!isZip && !isRar) {
      response
        .status(400)
        .json({ message: "Isi file bukan arsip ZIP atau RAR yang valid" });
      return;
    }
    try {
      const source = await storeSourcePackage(file);
      await createAdminAuditLog({
        admin: response.locals.admin as UserTokenPayload | null | undefined,
        action: "upload_source",
        entityType: "upload",
        metadata: {
          url: source.url,
          size: file.size,
          filename: file.originalname,
        },
      });
      response
        .status(201)
        .json({ source: { ...source, name: file.originalname } });
    } catch (error) {
      Sentry.captureException(error);
      response.status(500).json({ message: "Gagal upload source code" });
    }
  },
);
