import { Router } from "express";
import * as Sentry from "@sentry/node";
import { z } from "zod";
import { requireAdmin, type UserTokenPayload } from "../auth";
import { createAdminAuditLog } from "../models/audit-log.model";
import {
  createTemplateCategory,
  findTemplateCategories,
} from "../models/category.model";
import { parseBody } from "../validation";

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
