import { Router } from 'express';
import { z } from 'zod';
import {
  findActiveTemplateBundles,
  trackReferralClick,
  validateCoupon,
} from '../models/business.model';
import { parseBody, parseParams } from '../validation';

export const businessRouter = Router();

const couponBodySchema = z.object({
  code: z.string().trim().min(1).max(60),
  amount: z.coerce.number().int().positive(),
});

const referralParamsSchema = z.object({
  code: z.string().trim().min(1).max(80),
});

businessRouter.get('/bundles', async (_request, response) => {
  try {
    response.json({
      source: 'mysql',
      bundles: await findActiveTemplateBundles(),
    });
  } catch {
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
      response.status(404).json({ message: 'Kupon tidak valid atau kedaluwarsa' });
      return;
    }

    response.json({
      source: 'mysql',
      coupon,
    });
  } catch {
    response.status(500).json({ message: 'Gagal memvalidasi kupon' });
  }
});

businessRouter.post('/referrals/:code/click', async (request, response) => {
  const params = parseParams(referralParamsSchema, request, response);

  if (!params) {
    return;
  }

  try {
    await trackReferralClick(params.code);
    response.json({ source: 'mysql', tracked: true });
  } catch {
    response.status(500).json({ message: 'Gagal mencatat referral' });
  }
});
