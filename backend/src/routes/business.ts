import { Router } from 'express';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import {
  createCoupon,
  deleteCoupon,
  findCoupons,
  findActiveTemplateBundles,
  updateCoupon,
  validateCoupon,
} from '../models/business.model';
import { requireAdmin } from '../auth';
import { parseBody, parseParams } from '../validation';

export const businessRouter = Router();

const couponBodySchema = z.object({
  code: z.string().trim().min(1).max(60),
  amount: z.coerce.number().int().positive(),
});

const couponParamsSchema = z.object({ id: z.coerce.number().int().positive() });
const couponMutationSchema = z.object({
  code: z.string().trim().min(2).max(60).regex(/^[A-Za-z0-9_-]+$/),
  description: z.string().trim().min(3).max(255),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.coerce.number().int().positive(),
  active: z.boolean().default(true),
  expiresAt: z.string().datetime().nullable().default(null),
  maxRedemptions: z.coerce.number().int().positive().nullable().default(null),
}).superRefine((value, context) => {
  if (value.discountType === 'percent' && value.discountValue > 100) {
    context.addIssue({ code: 'custom', path: ['discountValue'], message: 'Diskon persen maksimal 100' });
  }

  const hasTimeLimit = value.expiresAt !== null;
  const hasUsageLimit = value.maxRedemptions !== null;

  if (hasTimeLimit === hasUsageLimit) {
    context.addIssue({
      code: 'custom',
      path: ['expiresAt'],
      message: 'Pilih salah satu batas: waktu atau pemakaian',
    });
    context.addIssue({
      code: 'custom',
      path: ['maxRedemptions'],
      message: 'Pilih salah satu batas: waktu atau pemakaian',
    });
  }
});

businessRouter.get('/bundles', async (_request, response) => {
  try {
    response.json({
      source: 'mysql',
      bundles: await findActiveTemplateBundles(),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({
      message: 'Database bundle belum tersedia',
      bundles: [],
    });
  }
});

businessRouter.post('/coupons/validate', async (request, response) => {
  const body = parseBody(couponBodySchema, request, response);

  if (!body) {
    return;
  }

  try {
    const coupon = await validateCoupon(body.code, body.amount);

    if (!coupon) {
      response.status(404).json({ message: 'Kupon tidak valid, kedaluwarsa, atau habis' });
      return;
    }

    response.json({
      source: 'mysql',
      coupon,
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal memvalidasi kupon' });
  }
});

businessRouter.get('/coupons', requireAdmin, async (_request, response) => {
  try {
    response.json({ source: 'mysql', coupons: await findCoupons() });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal memuat kupon' });
  }
});

businessRouter.post('/coupons', requireAdmin, async (request, response) => {
  const body = parseBody(couponMutationSchema, request, response);
  if (!body) return;
  try {
    const id = await createCoupon(body);
    response.status(201).json({ source: 'mysql', id, coupons: await findCoupons() });
  } catch (error) {
    Sentry.captureException(error);
    response.status(409).json({ message: 'Kode kupon sudah digunakan' });
  }
});

businessRouter.put('/coupons/:id', requireAdmin, async (request, response) => {
  const params = parseParams(couponParamsSchema, request, response);
  const body = parseBody(couponMutationSchema, request, response);
  if (!params || !body) return;
  try {
    if (!(await updateCoupon(params.id, body))) {
      response.status(404).json({ message: 'Kupon tidak ditemukan' }); return;
    }
    response.json({ source: 'mysql', coupons: await findCoupons() });
  } catch (error) {
    Sentry.captureException(error);
    response.status(409).json({ message: 'Kode kupon sudah digunakan' });
  }
});

businessRouter.delete('/coupons/:id', requireAdmin, async (request, response) => {
  const params = parseParams(couponParamsSchema, request, response);
  if (!params) return;
  try {
    const result = await deleteCoupon(params.id);
    if (!result.found) { response.status(404).json({ message: 'Kupon tidak ditemukan' }); return; }
    response.json({ source: 'mysql', archived: result.archived, coupons: await findCoupons() });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal menghapus kupon' });
  }
});
