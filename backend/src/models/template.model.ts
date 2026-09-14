import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";
import {
  findRecentTemplateReviews,
  type TemplateReviewItem,
} from "./template-rating.model";

type TemplateRow = RowDataPacket & {
  id: number;
  slug: string;
  title: string;
  category: string;
  category_id?: number | null;
  description: string;
  price: string;
  stack: string | string[];
  level: string;
  rating: number;
  accent_class?: string;
  accentClass?: string;
  preview: string | TemplatePreviewItem[];
  video_url?: string | null;
  videoUrl?: string | null;
  demo_url?: string;
  demoUrl?: string;
  lynk_url?: string | null;
  lynkUrl?: string | null;
  publication_status?: "draft" | "published";
  source_available?: number | boolean;
  buyer_count?: number;
  buyerCount?: number;
  features?: string | string[];
  included_files?: string | string[];
  includedFiles?: string[];
  source_code?: string | string[];
  sourceCode?: string[];
  suitable_for?: string | string[];
  suitableFor?: string[];
  license?: string;
  support?: string;
};

export type TemplatePreviewItem = {
  image: string;
  caption: string;
};

export type TemplateItem = {
  id: number;
  slug: string;
  title: string;
  category: string;
  categoryId?: number | null;
  description: string;
  price: string;
  stack: string[];
  level: string;
  rating: number;
  accentClass: string;
  preview: TemplatePreviewItem[];
  videoUrl: string | null;
  demoUrl: string;
  lynkUrl?: string | null;
  publicationStatus: "draft" | "published";
  sourceAvailable: boolean;
  buyerCount: number;
  features: string[];
  includedFiles: string[];
  sourceCode: string[];
  suitableFor: string[];
  license: string;
  support: string;
  reviews: TemplateReviewItem[];
};
export type TemplatePayload = Omit<
  TemplateItem,
  "id" | "categoryId" | "rating" | "buyerCount" | "reviews"
>;

const templateSelect = `SELECT
  designs.id,
  designs.slug,
  designs.title,
  COALESCE(categories.name, designs.category) AS category,
  designs.category_id,
  designs.description,
  designs.price,
  designs.stack,
  designs.level,
  COALESCE(rating_stats.rating, 0) AS rating,
  designs.accent_class,
  designs.preview,
  designs.video_url,
  designs.demo_url,
  designs.lynk_url,
  designs.publication_status,
  designs.source_available,
  COALESCE(order_stats.buyer_count, 0) AS buyer_count,
  designs.features,
  designs.included_files,
  designs.source_code,
  designs.suitable_for,
  designs.license,
  designs.support
FROM designs
LEFT JOIN categories ON categories.id = designs.category_id
LEFT JOIN (
  SELECT design_id, ROUND(AVG(rating), 1) AS rating
  FROM design_ratings
  GROUP BY design_id
) AS rating_stats ON rating_stats.design_id = designs.id
LEFT JOIN (
  SELECT design_id, COUNT(*) AS buyer_count
  FROM orders
  WHERE design_id IS NOT NULL AND payment_status = 'paid' AND deleted_at IS NULL
  GROUP BY design_id
) AS order_stats ON order_stats.design_id = designs.id`;

export async function findTemplates(includeDrafts = false) {
  const [rows] = await pool.query<TemplateRow[]>(
    `${templateSelect}
    WHERE designs.deleted_at IS NULL
      ${includeDrafts ? "" : "AND designs.publication_status = 'published'"}
    ORDER BY designs.id DESC
    LIMIT 60`,
  );

  return attachTemplateReviews(rows.map(normalizeTemplateRow));
}

export async function findTemplateBySlugOrId(
  slug: string,
  includeDrafts = false,
) {
  const [rows] = await pool.query<TemplateRow[]>(
    `${templateSelect}
    WHERE designs.deleted_at IS NULL
      ${includeDrafts ? "" : "AND designs.publication_status = 'published'"}
      AND (designs.slug = ? OR designs.id = ?)
    LIMIT 1`,
    [slug, Number(slug) || 0],
  );

  const templates = await attachTemplateReviews(
    rows[0] ? [normalizeTemplateRow(rows[0])] : [],
  );

  return templates[0] ?? null;
}

export async function createTemplate(payload: TemplatePayload) {
  const category = await resolveTemplateCategory(payload.category);
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO designs (
      slug,
      title,
      category,
      category_id,
      description,
      price,
      stack,
      level,
      accent_class,
      preview,
      video_url,
      demo_url,
      lynk_url,
      features,
      included_files,
      source_code,
      suitable_for,
      license,
      support,
      publication_status,
      source_available
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    serializeTemplatePayload(payload, category),
  );

  return findTemplateBySlugOrId(String(result.insertId), true);
}

export async function updateTemplate(id: number, payload: TemplatePayload) {
  const category = await resolveTemplateCategory(payload.category);
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE designs SET
      slug = ?,
      title = ?,
      category = ?,
      category_id = ?,
      description = ?,
      price = ?,
      stack = ?,
      level = ?,
      accent_class = ?,
      preview = ?,
      video_url = ?,
      demo_url = ?,
      lynk_url = ?,
      features = ?,
      included_files = ?,
      source_code = ?,
      suitable_for = ?,
      license = ?,
      support = ?,
      publication_status = ?,
      source_available = ?
    WHERE id = ? AND deleted_at IS NULL`,
    [...serializeTemplatePayload(payload, category), id],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findTemplateBySlugOrId(String(id), true);
}

export async function deleteTemplate(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE designs SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  return result.affectedRows > 0;
}

export function normalizeTemplatePayload(
  body: Partial<TemplateItem>,
): TemplatePayload {
  const title = String(body.title ?? "").trim();

  return {
    slug: sanitizeSlug(body.slug) || slugify(title),
    title,
    category: String(body.category ?? "").trim(),
    description: String(body.description ?? "").trim(),
    price: String(body.price ?? "Rp0").trim(),
    stack: normalizeArray(body.stack),
    level: String(body.level ?? "Pemula").trim(),
    accentClass: String(body.accentClass ?? "bg-naki-secondary").trim(),
    preview: normalizePreviewArray(body.preview),
    videoUrl: body.videoUrl ? String(body.videoUrl).trim() : null,
    demoUrl: String(body.demoUrl ?? "#").trim(),
    lynkUrl: body.lynkUrl ? String(body.lynkUrl).trim() : null,
    publicationStatus:
      body.publicationStatus === "draft" ? "draft" : "published",
    sourceAvailable: body.sourceAvailable !== false,
    features: normalizeArray(body.features),
    includedFiles: normalizeArray(body.includedFiles),
    sourceCode: normalizeArray(body.sourceCode),
    suitableFor: normalizeArray(body.suitableFor),
    license: String(
      body.license ?? "Boleh dipakai sesuai lisensi pembelian.",
    ).trim(),
    support: String(
      body.support ?? "Support setup dasar setelah pembelian.",
    ).trim(),
  };
}

function normalizeTemplateRow(row: TemplateRow): TemplateItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    categoryId: row.category_id ?? null,
    description: row.description,
    price: row.price,
    stack: parseStringArray(row.stack),
    level: row.level,
    rating: Number(row.rating),
    accentClass: row.accent_class ?? row.accentClass ?? "bg-naki-secondary",
    preview: parsePreviewArray(row.preview),
    videoUrl: row.video_url ?? row.videoUrl ?? null,
    demoUrl: row.demo_url ?? row.demoUrl ?? "#",
    lynkUrl: row.lynk_url ?? row.lynkUrl ?? null,
    publicationStatus:
      row.publication_status === "draft" ? "draft" : "published",
    sourceAvailable: Boolean(row.source_available ?? true),
    buyerCount: row.buyer_count ?? row.buyerCount ?? 0,
    features: parseStringArray(row.features ?? []),
    includedFiles: parseStringArray(
      row.included_files ?? row.includedFiles ?? [],
    ),
    sourceCode: parseStringArray(row.source_code ?? row.sourceCode ?? []),
    suitableFor: parseStringArray(row.suitable_for ?? row.suitableFor ?? []),
    license: row.license ?? "Boleh dipakai sesuai lisensi pembelian.",
    support: row.support ?? "Support setup dasar setelah pembelian.",
    reviews: [],
  };
}

async function attachTemplateReviews(templates: TemplateItem[]) {
  const reviewsByTemplateId = await findRecentTemplateReviews(
    templates.map((template) => template.id),
  );

  return templates.map((template) => ({
    ...template,
    reviews: reviewsByTemplateId.get(template.id) ?? [],
  }));
}

function serializeTemplatePayload(
  payload: TemplatePayload,
  category: { id: number; name: string },
) {
  return [
    payload.slug,
    payload.title,
    category.name,
    category.id,
    payload.description,
    payload.price,
    JSON.stringify(payload.stack),
    payload.level,
    payload.accentClass,
    JSON.stringify(payload.preview),
    payload.videoUrl,
    payload.demoUrl,
    payload.lynkUrl,
    JSON.stringify(payload.features),
    JSON.stringify(payload.includedFiles),
    JSON.stringify(payload.sourceCode),
    JSON.stringify(payload.suitableFor),
    payload.license,
    payload.support,
    payload.publicationStatus,
    payload.sourceAvailable,
  ];
}

async function resolveTemplateCategory(categoryName: string) {
  const normalizedName = categoryName.trim();
  const [rows] = await pool.query<
    (RowDataPacket & { id: number; name: string })[]
  >("SELECT id, name FROM categories WHERE name = ? LIMIT 1", [normalizedName]);

  if (rows[0]) {
    return { id: rows[0].id, name: rows[0].name };
  }

  // Don't auto-create categories - they must be created explicitly via the categories API
  // This prevents deleted categories from being recreated when templates are saved
  throw new Error(
    `Kategori "${normalizedName}" tidak ditemukan. Buat kategori terlebih dahulu.`,
  );
}

function parseStringArray(value: string | string[]) {
  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function parsePreviewArray(value: string | TemplatePreviewItem[]) {
  if (Array.isArray(value)) {
    return normalizePreviewArray(value);
  }

  try {
    const parsed = JSON.parse(value);
    return normalizePreviewArray(parsed);
  } catch {
    return normalizePreviewArray(value);
  }
}

function normalizePreviewArray(value: unknown): TemplatePreviewItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return stringToPreviewItem(item);
        }

        if (item && typeof item === "object") {
          const previewItem = item as Record<string, unknown>;
          return {
            image: String(previewItem.image ?? "").trim(),
            caption: String(previewItem.caption ?? "").trim(),
          };
        }

        return { image: "", caption: "" };
      })
      .filter((item) => item.image || item.caption);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .flatMap((line) => line.split(","))
      .map((item) => stringToPreviewItem(item.trim()))
      .filter((item) => item.image || item.caption);
  }

  return [];
}

function stringToPreviewItem(value: string): TemplatePreviewItem {
  if (value.startsWith("data:image/")) {
    return {
      image: "",
      caption: "Preview design perlu diupload ulang",
    };
  }

  return {
    image: "",
    caption: value,
  };
}

function normalizeArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .flatMap((line) => line.split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function sanitizeSlug(value: unknown) {
  return slugify(String(value ?? ""));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
