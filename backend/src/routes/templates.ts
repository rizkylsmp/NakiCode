import { Router } from 'express';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { requireAdmin, requireUser, type UserTokenPayload } from '../auth';
import { createAdminAuditLog } from '../models/audit-log.model';
import {
  createTemplate,
  deleteTemplate,
  findTemplateBySlugOrId,
  findTemplates,
  normalizeTemplatePayload,
  updateTemplate,
} from '../models/template.model';
import { hasSuccessfulTemplateOrder } from '../models/order.model';
import {
  createTemplateRating,
  hasUserRatedTemplate,
  normalizeTemplateRatingPayload,
} from '../models/template-rating.model';
import type { TemplateItem } from '../models/template.model';
import { deleteCacheKeys, getJsonCache, setJsonCache } from '../redis-cache';
import { parseBody, parseParams } from '../validation';

export const templatesRouter = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const templateBodySchema = z
  .object({
    slug: z.string().trim().max(180).optional(),
    title: z.string().trim().min(1).max(160),
    category: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(10000),
    price: z.string().trim().min(1).max(32).optional(),
    stack: z.array(z.string().trim().min(1).max(80)).optional(),
    level: z.string().trim().min(1).max(40).optional(),
    preview: z
      .array(
        z.object({
          image: z
            .string()
            .trim()
            .max(2048)
            .refine((value) => !value.startsWith('data:image/'), {
              message: 'Preview image harus berupa URL, bukan base64',
            }),
          caption: z.string().trim().max(240),
        }),
      )
      .optional(),
    demoUrl: z.string().trim().max(255).optional(),
    features: z.array(z.string().trim().min(1).max(240)).optional(),
    includedFiles: z.array(z.string().trim().min(1).max(240)).optional(),
    suitableFor: z.array(z.string().trim().min(1).max(240)).optional(),
    license: z.string().trim().max(2000).optional(),
    support: z.string().trim().max(2000).optional(),
  })
  .passthrough();

const ratingBodySchema = z.object({
  customerName: z.string().trim().max(120).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().trim().max(2000).optional(),
});

templatesRouter.get('/', async (_request, response) => {
  const cacheKey = 'templates:list';
  const cached = await getJsonCache<unknown>(cacheKey);

  if (cached) {
    response.json(cached);
    return;
  }

  try {
    const payload = {
      source: 'mysql',
      templates: await findTemplates(),
    };

    await setJsonCache(cacheKey, payload);
    response.json(payload);
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({
      message: 'Database templates belum tersedia',
      templates: [],
    });
  }
});

templatesRouter.post('/', requireAdmin, async (request, response) => {
  const body = parseBody(templateBodySchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!body) {
    return;
  }

  const payload = normalizeTemplatePayload(body as Partial<TemplateItem>);

  try {
    const template = await createTemplate(payload);

    await createAdminAuditLog({
      admin,
      action: 'template.create',
      entityType: 'template',
      entityId: template?.id ?? null,
      metadata: {
        title: payload.title,
        slug: payload.slug,
      },
    });
    await deleteCacheKeys(['templates:list']);

    response.status(201).json({
      source: 'mysql',
      template,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('tidak ditemukan')) {
      response.status(400).json({ message });
      return;
    }
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal menyimpan template' });
  }
});

templatesRouter.get('/:slug', async (request, response) => {
  const { slug } = request.params;
  const cacheKey = `templates:detail:${slug}`;
  const cached = await getJsonCache<unknown>(cacheKey);

  if (cached) {
    response.json(cached);
    return;
  }

  try {
    const template = await findTemplateBySlugOrId(slug);

    if (!template) {
      response.status(404).json({ message: 'Template not found' });
      return;
    }

    const payload = {
      source: 'mysql',
      template,
    };

    await setJsonCache(cacheKey, payload);
    response.json(payload);
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({ message: 'Database templates belum tersedia' });
  }
});

templatesRouter.post('/:id/rating', requireUser, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const body = parseBody(ratingBodySchema, request, response);
  const user = response.locals.user as UserTokenPayload;

  if (!params || !body) {
    return;
  }

  try {
    const template = await findTemplateBySlugOrId(String(params.id));

    if (!template) {
      response.status(404).json({ message: 'Template not found' });
      return;
    }

    const hasPaidOrder = await hasSuccessfulTemplateOrder(user.userId, template.id);

    if (!hasPaidOrder) {
      response.status(403).json({
        message: 'Rating hanya bisa dikirim setelah order berhasil dibayar',
      });
      return;
    }

    const hasRated = await hasUserRatedTemplate(user.userId, template.id);

    if (hasRated) {
      response.status(409).json({
        message: 'User sudah memberi rating untuk template ini',
      });
      return;
    }

    const payload = normalizeTemplateRatingPayload(
      {
        ...body,
        customerName: body.customerName || user.sub,
      },
      user.userId,
      template.id,
      template.slug,
    );

    if (!payload.customerName || payload.rating < 1 || payload.rating > 5) {
      response.status(400).json({
        message: 'customerName and rating 1-5 are required',
      });
      return;
    }

    await createTemplateRating(payload);

    response.status(201).json({
      source: 'mysql',
      rating: payload,
      template: await findTemplateBySlugOrId(String(params.id)),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal menyimpan rating' });
  }
});

templatesRouter.put('/:id', requireAdmin, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const body = parseBody(templateBodySchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!params || !body) {
    return;
  }

  const payload = normalizeTemplatePayload(body as Partial<TemplateItem>);

  try {
    const template = await updateTemplate(params.id, payload);

    if (!template) {
      response.status(404).json({ message: 'Template not found' });
      return;
    }

    await createAdminAuditLog({
      admin,
      action: 'template.update',
      entityType: 'template',
      entityId: template.id,
      metadata: {
        title: template.title,
        slug: template.slug,
      },
    });
    await deleteCacheKeys(['templates:list', `templates:detail:${template.slug}`]);

    response.json({
      source: 'mysql',
      template,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('tidak ditemukan')) {
      response.status(400).json({ message });
      return;
    }
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal mengubah template' });
  }
});

templatesRouter.delete('/:id', requireAdmin, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!params) {
    return;
  }

  try {
    const wasDeleted = await deleteTemplate(params.id);

    if (!wasDeleted) {
      response.status(404).json({ message: 'Template not found' });
      return;
    }

    await createAdminAuditLog({
      admin,
      action: 'template.soft_delete',
      entityType: 'template',
      entityId: params.id,
    });
    await deleteCacheKeys(['templates:list']);

    response.status(204).send();
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal menghapus template' });
  }
});
