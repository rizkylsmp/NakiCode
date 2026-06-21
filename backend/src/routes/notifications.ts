import { Router } from 'express';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { requireUser, type UserTokenPayload } from '../auth';
import {
  findNotificationsByUser,
  markAllNotificationsRead,
  markNotificationRead,
} from '../models/notification.model';
import { parseParams } from '../validation';

export const notificationsRouter = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

notificationsRouter.get('/my', requireUser, async (_request, response) => {
  const user = response.locals.user as UserTokenPayload;

  try {
    response.json({
      source: 'mysql',
      notifications: await findNotificationsByUser(user.userId),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({
      message: 'Database notifications belum tersedia',
      notifications: [],
    });
  }
});

notificationsRouter.patch('/:id/read', requireUser, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const user = response.locals.user as UserTokenPayload;

  if (!params) {
    return;
  }

  try {
    const wasUpdated = await markNotificationRead(params.id, user.userId);

    if (!wasUpdated) {
      response.status(404).json({ message: 'Notification not found' });
      return;
    }

    response.json({
      source: 'mysql',
      notifications: await findNotificationsByUser(user.userId),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal membaca notifikasi' });
  }
});

notificationsRouter.patch('/read-all', requireUser, async (_request, response) => {
  const user = response.locals.user as UserTokenPayload;

  try {
    await markAllNotificationsRead(user.userId);

    response.json({
      source: 'mysql',
      notifications: await findNotificationsByUser(user.userId),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal membaca semua notifikasi' });
  }
});
