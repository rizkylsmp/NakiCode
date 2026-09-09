import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserToken } from '../auth';
import { businessRouter } from '../routes/business';

const mocks = vi.hoisted(() => ({
  create: vi.fn(), update: vi.fn(), remove: vi.fn(), findAll: vi.fn(),
  findBanners: vi.fn(), validate: vi.fn(), findBundles: vi.fn(), audit: vi.fn(),
}));

vi.mock('../models/audit-log.model', () => ({ createAdminAuditLog: mocks.audit }));
vi.mock('../models/business.model', () => ({
  createCoupon: mocks.create,
  updateCoupon: mocks.update,
  deleteCoupon: mocks.remove,
  findCoupons: mocks.findAll,
  findActiveCouponBanners: mocks.findBanners,
  validateCoupon: mocks.validate,
  findActiveTemplateBundles: mocks.findBundles,
}));

const coupon = {
  id: 3, code: 'NAKI10', description: 'Diskon sepuluh persen', discountType: 'percent',
  discountValue: 10, active: true, expiresAt: null, maxRedemptions: 10,
  imageUrl: 'https://cdn.example.com/naki10.webp', showBanner: true,
  createdAt: '2026-09-09T00:00:00.000Z', redemptionCount: 0,
};
const payload = {
  code: coupon.code, description: coupon.description, discountType: coupon.discountType,
  discountValue: coupon.discountValue, active: true, expiresAt: null, maxRedemptions: 10,
  imageUrl: coupon.imageUrl, showBanner: true,
};
const adminToken = createUserToken({ id: 1, username: 'admin-test', role: 'admin' });
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api/business', businessRouter);

describe('Coupon CRUD API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue(coupon.id);
    mocks.update.mockResolvedValue(true);
    mocks.remove.mockResolvedValue({ found: true, archived: false });
    mocks.findAll.mockResolvedValue([coupon]);
    mocks.findBanners.mockResolvedValue([coupon]);
    mocks.validate.mockResolvedValue(coupon);
    mocks.findBundles.mockResolvedValue([]);
    mocks.audit.mockResolvedValue(1);
  });

  it('protects the coupon list and creates a coupon for an admin', async () => {
    expect((await request(app).get('/api/business/coupons')).status).toBe(401);
    const response = await request(app).post('/api/business/coupons').set('Authorization', `Bearer ${adminToken}`).send(payload);
    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ maxRedemptions: 10, expiresAt: null, imageUrl: coupon.imageUrl, showBanner: true }));
  });

  it('serves active banners publicly and requires an image when banner is enabled', async () => {
    const bannersResponse = await request(app).get('/api/business/coupons/banners');
    const invalidBanner = await request(app)
      .post('/api/business/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...payload, imageUrl: null, showBanner: true });

    expect(bannersResponse.status).toBe(200);
    expect(bannersResponse.body.banners).toEqual([coupon]);
    expect(invalidBanner.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('requires exactly one expiration limit and caps percentage discounts', async () => {
    const bothLimits = await request(app).post('/api/business/coupons').set('Authorization', `Bearer ${adminToken}`).send({ ...payload, expiresAt: '2026-12-31T00:00:00.000Z' });
    const noLimit = await request(app).post('/api/business/coupons').set('Authorization', `Bearer ${adminToken}`).send({ ...payload, maxRedemptions: null });
    const excessivePercent = await request(app).post('/api/business/coupons').set('Authorization', `Bearer ${adminToken}`).send({ ...payload, discountValue: 101 });
    expect(bothLimits.status).toBe(400);
    expect(noLimit.status).toBe(400);
    expect(excessivePercent.status).toBe(400);
  });

  it('distinguishes duplicate codes from other database failures', async () => {
    mocks.create.mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' }));
    const duplicate = await request(app).post('/api/business/coupons').set('Authorization', `Bearer ${adminToken}`).send(payload);
    mocks.create.mockRejectedValueOnce(new Error('database unavailable'));
    const unavailable = await request(app).post('/api/business/coupons').set('Authorization', `Bearer ${adminToken}`).send(payload);
    expect(duplicate.status).toBe(409);
    expect(unavailable.status).toBe(500);
  });

  it('updates and soft-deletes a coupon even if audit logging fails', async () => {
    const updateResponse = await request(app).put('/api/business/coupons/3').set('Authorization', `Bearer ${adminToken}`).send(payload);
    mocks.audit.mockRejectedValueOnce(new Error('audit unavailable'));
    const deleteResponse = await request(app).delete('/api/business/coupons/3').set('Authorization', `Bearer ${adminToken}`);
    expect(updateResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(mocks.remove).toHaveBeenCalledWith(3);
  });

  it('returns 404 for missing update and delete targets', async () => {
    mocks.update.mockResolvedValueOnce(false);
    const updateResponse = await request(app).put('/api/business/coupons/404').set('Authorization', `Bearer ${adminToken}`).send(payload);
    mocks.remove.mockResolvedValueOnce({ found: false, archived: false });
    const deleteResponse = await request(app).delete('/api/business/coupons/404').set('Authorization', `Bearer ${adminToken}`);
    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });
});
