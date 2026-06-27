import { Router } from "express";
import * as Sentry from "@sentry/node";
import { z } from "zod";
import { requireAdmin, type UserTokenPayload } from "../auth";
import { createAdminAuditLog } from "../models/audit-log.model";
import {
  createProject,
  deleteProject,
  findProjectById,
  findProjects,
  normalizeProjectPayload,
  updateProject,
} from "../models/project.model";
import { parseBody, parseParams } from "../validation";

export const projectsRouter = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const projectBodySchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(5000),
  result: z.string().trim().min(1).max(160),
  websiteUrl: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().max(500).optional(),
  imageUrls: z.array(z.string().trim().max(500)).max(12).optional(),
  coverIndex: z.number().int().min(0).optional(),
})
.superRefine((data, ctx) => {
  if (
    typeof data.coverIndex === 'number' &&
    Array.isArray(data.imageUrls) &&
    data.imageUrls.length > 0 &&
    data.coverIndex >= data.imageUrls.length
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'coverIndex harus lebih kecil dari jumlah gambar',
      path: ['coverIndex'],
    });
  }
});


projectsRouter.get("/", async (_request, response) => {
  try {
    response.json({ source: "mysql", projects: await findProjects() });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({
      message: "Database projects belum tersedia",
      projects: [],
    });
  }
});

projectsRouter.post("/", requireAdmin, async (request, response) => {
  const body = parseBody(projectBodySchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!body) {
    return;
  }

  try {
    const project = await createProject(normalizeProjectPayload(body));

    await createAdminAuditLog({
      admin,
      action: "project.create",
      entityType: "project",
      entityId: project?.id ?? null,
      metadata: {
        title: project?.title ?? body.title,
      },
    });

    response.status(201).json({ source: "mysql", project });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: "Gagal menyimpan portofolio" });
  }
});

projectsRouter.put("/:id", requireAdmin, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const body = parseBody(projectBodySchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!params || !body) {
    return;
  }

  try {
    const previousProject = await findProjectById(params.id);
    const project = await updateProject(
      params.id,
      normalizeProjectPayload(body),
    );

    if (!project) {
      response.status(404).json({ message: "Portfolio not found" });
      return;
    }

    await createAdminAuditLog({
      admin,
      action: "project.update",
      entityType: "project",
      entityId: params.id,
      metadata: {
        from: previousProject?.title ?? null,
        to: project.title,
      },
    });

    response.json({ source: "mysql", project });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: "Gagal mengubah portofolio" });
  }
});

projectsRouter.delete("/:id", requireAdmin, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!params) {
    return;
  }

  try {
    const project = await findProjectById(params.id);
    const wasDeleted = await deleteProject(params.id);

    if (!wasDeleted) {
      response.status(404).json({ message: "Portfolio not found" });
      return;
    }

    await createAdminAuditLog({
      admin,
      action: "project.soft_delete",
      entityType: "project",
      entityId: params.id,
      metadata: {
        title: project?.title ?? null,
      },
    });

    response.status(204).send();
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: "Gagal menghapus portofolio" });
  }
});
