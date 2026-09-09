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
  findProjectsPage,
  normalizeProjectPayload,
  updateProject,
} from "../models/project.model";
import { parseBody, parseParams } from "../validation";

export const projectsRouter = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(30).default(9),
});

const optionalWebsiteUrlSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .refine(
    (value) => !value || value === "#" || /^https?:\/\//i.test(value),
    "URL website harus diawali http:// atau https://",
  );

const imageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (value) => /^https?:\/\//i.test(value) || value.startsWith("/uploads/"),
    "URL gambar harus berupa URL HTTP(S) atau path upload lokal",
  );

const projectBodySchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(5000),
  result: z.string().trim().min(1).max(160),
  websiteUrl: optionalWebsiteUrlSchema,
  imageUrl: imageUrlSchema.optional(),
  imageUrls: z.array(imageUrlSchema).max(12).optional(),
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

async function createProjectAuditLog(
  payload: Parameters<typeof createAdminAuditLog>[0],
) {
  try {
    await createAdminAuditLog(payload);
  } catch (error) {
    // Mutasi project sudah berhasil. Audit tetap dilaporkan ke observability,
    // tetapi kegagalannya tidak boleh membuat admin mengulang operasi CRUD.
    Sentry.captureException(error);
  }
}


projectsRouter.get("/", async (request, response) => {
  try {
    const usesPagination =
      typeof request.query.page !== "undefined" ||
      typeof request.query.pageSize !== "undefined";

    if (!usesPagination) {
      response.json({ source: "mysql", projects: await findProjects() });
      return;
    }

    const query = paginationQuerySchema.safeParse(request.query);

    if (!query.success) {
      response.status(400).json({
        message: "Parameter pagination tidak valid",
        errors: query.error.flatten(),
      });
      return;
    }

    response.json({
      source: "mysql",
      ...(await findProjectsPage(query.data.page, query.data.pageSize)),
    });
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

    await createProjectAuditLog({
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

    await createProjectAuditLog({
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

    await createProjectAuditLog({
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
