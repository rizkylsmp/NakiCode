import { Router } from "express";
import * as Sentry from "@sentry/node";
import { z } from "zod";
import { requireAdmin, type UserTokenPayload } from "../auth";
import { createAdminAuditLog } from "../models/audit-log.model";
import {
  createTemplateCategory,
  findTemplateCategories,
  findTemplateCategoriesWithIds,
  updateTemplateCategory,
  deleteTemplateCategory,
  isCategoryInUse,
} from "../models/category.model";
import { parseBody, parseParams } from "../validation";

export const categoriesRouter = Router();

const categoryBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
});

categoriesRouter.get("/", async (_request, response) => {
  try {
    response.json({
      source: "mysql",
      categories: await findTemplateCategories(),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({
      message: "Database categories belum tersedia",
      categories: ["Semua"],
    });
  }
});

categoriesRouter.get("/admin", requireAdmin, async (_request, response) => {
  try {
    response.json({
      source: "mysql",
      categories: await findTemplateCategoriesWithIds(),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({
      message: "Database categories belum tersedia",
      categories: [],
    });
  }
});

categoriesRouter.post("/", requireAdmin, async (request, response) => {
  const body = parseBody(categoryBodySchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!body) {
    return;
  }

  try {
    const result = await createTemplateCategory(body.name);

    await createAdminAuditLog({
      admin,
      action: result.wasCreated ? "category.create" : "category.create_exists",
      entityType: "template_category",
      entityId: null,
      metadata: {
        name: result.category,
      },
    });

    response.status(result.wasCreated ? 201 : 200).json({
      source: "mysql",
      category: result.category,
      categories: result.categories,
      message: result.wasCreated
        ? "Kategori berhasil ditambahkan."
        : "Kategori sudah tersedia.",
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: "Gagal menambahkan kategori" });
  }
});

const categoryIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const categoryUpdateBodySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  sort_order: z.number().int().min(0).optional(),
});

categoriesRouter.put("/:id", requireAdmin, async (request, response) => {
  const params = parseParams(categoryIdParamsSchema, request, response);
  const body = parseBody(categoryUpdateBodySchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!params || !body) {
    return;
  }

  try {
    const result = await updateTemplateCategory(params.id, body);

    if (!result.updated) {
      response.status(404).json({ message: "Kategori tidak ditemukan" });
      return;
    }

    await createAdminAuditLog({
      admin,
      action: "category.update",
      entityType: "template_category",
      entityId: params.id,
      metadata: body,
    });

    response.json({
      source: "mysql",
      categories: result.categories,
      message: "Kategori berhasil diperbarui.",
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: "Gagal memperbarui kategori" });
  }
});

categoriesRouter.delete("/:id", requireAdmin, async (request, response) => {
  const params = parseParams(categoryIdParamsSchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!params) {
    return;
  }

  try {
    const result = await deleteTemplateCategory(params.id);

    if (result.inUse) {
      response.status(409).json({ message: "Kategori masih digunakan template" });
      return;
    }

    if (!result.deleted) {
      response.status(404).json({ message: "Kategori tidak ditemukan" });
      return;
    }

    await createAdminAuditLog({
      admin,
      action: "category.delete",
      entityType: "template_category",
      entityId: params.id,
      metadata: {},
    });

    response.json({
      source: "mysql",
      categories: result.categories,
      message: "Kategori berhasil dihapus.",
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: "Gagal menghapus kategori" });
  }
});
