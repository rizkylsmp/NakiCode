import { Router } from 'express';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { requireUser, type UserTokenPayload } from '../auth';
import {
  addFavoriteTemplate,
  findFavoriteTemplateIds,
  removeFavoriteTemplate,
} from '../models/favorite.model';
import { findTemplateBySlugOrId } from '../models/template.model';
import { parseParams } from '../validation';

export const favoritesRouter = Router();

const favoriteParamsSchema = z.object({
  templateId: z.coerce.number().int().positive(),
});

favoritesRouter.get('/my', requireUser, async (_request, response) => {
  const user = response.locals.user as UserTokenPayload;

  try {
    response.json({
      source: 'mysql',
      templateIds: await findFavoriteTemplateIds(user.userId),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({
      message: 'Database favorites belum tersedia',
      templateIds: [],
    });
  }
});

favoritesRouter.post('/:templateId', requireUser, async (request, response) => {
  const params = parseParams(favoriteParamsSchema, request, response);
  const user = response.locals.user as UserTokenPayload;

  if (!params) {
    return;
  }

  try {
    const template = await findTemplateBySlugOrId(String(params.templateId));

    if (!template) {
      response.status(404).json({ message: 'Template not found' });
      return;
    }

    await addFavoriteTemplate(user.userId, template.id);

    response.status(201).json({
      source: 'mysql',
      templateIds: await findFavoriteTemplateIds(user.userId),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal menyimpan wishlist' });
  }
});

favoritesRouter.delete('/:templateId', requireUser, async (request, response) => {
  const params = parseParams(favoriteParamsSchema, request, response);
  const user = response.locals.user as UserTokenPayload;

  if (!params) {
    return;
  }

  try {
    await removeFavoriteTemplate(user.userId, params.templateId);

    response.json({
      source: 'mysql',
      templateIds: await findFavoriteTemplateIds(user.userId),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal menghapus wishlist' });
  }
});
