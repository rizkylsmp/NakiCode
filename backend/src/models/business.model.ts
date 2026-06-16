import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';

type CouponRow = RowDataPacket & {
  id: number;
  code: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  active: number;
  expires_at?: string | null;
};

type ReferralRow = RowDataPacket & {
  id: number;
  code: string;
  owner_name: string;
  active: number;
  click_count: number;
  conversion_count: number;
};

type BundleRow = RowDataPacket & {
  id: number;
  slug: string;
  title: string;
  description: string;
  price: string;
  template_count: number;
};

export type CouponValidation = {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
};

export type TemplateBundleItem = {
  id: number;
  slug: string;
  title: string;
  description: string;
  price: string;
  templateCount: number;
};

export async function validateCoupon(code: string, amount: number) {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  const [rows] = await pool.query<CouponRow[]>(
    `SELECT id, code, description, discount_type, discount_value, active, expires_at
    FROM coupons
    WHERE code = ?
      AND active = TRUE
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    LIMIT 1`,
    [normalizedCode],
  );
  const coupon = rows[0];

  if (!coupon) {
    return null;
  }

  const discountAmount =
    coupon.discount_type === 'percent'
      ? Math.round(amount * (Number(coupon.discount_value) / 100))
      : Number(coupon.discount_value);
  const boundedDiscount = Math.max(0, Math.min(amount, discountAmount));

  return {
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discount_type,
    discountValue: Number(coupon.discount_value),
    discountAmount: boundedDiscount,
    finalAmount: Math.max(1000, amount - boundedDiscount),
  } satisfies CouponValidation;
}

export async function recordCouponRedemption(payload: {
  couponCode: string;
  orderId: number;
  userId: number | null;
  discountAmount: number;
}) {
  const [rows] = await pool.query<Array<RowDataPacket & { id: number }>>(
    `SELECT id FROM coupons WHERE code = ? LIMIT 1`,
    [payload.couponCode.toUpperCase()],
  );
  const couponId = rows[0]?.id;

  if (!couponId) {
    return null;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO coupon_redemptions (
      coupon_id,
      order_id,
      user_id,
      discount_amount
    ) VALUES (?, ?, ?, ?)`,
    [couponId, payload.orderId, payload.userId, payload.discountAmount],
  );

  return result.insertId;
}

export async function trackReferralClick(code: string) {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE affiliate_referrals
    SET click_count = click_count + 1
    WHERE code = ? AND active = TRUE`,
    [normalizedCode],
  );

  return result.affectedRows > 0;
}

export async function recordReferralConversion(code: string) {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE affiliate_referrals
    SET conversion_count = conversion_count + 1
    WHERE code = ? AND active = TRUE`,
    [normalizedCode],
  );

  return result.affectedRows > 0;
}

export async function findActiveTemplateBundles() {
  const [rows] = await pool.query<BundleRow[]>(
    `SELECT bundles.id,
      bundles.slug,
      bundles.title,
      bundles.description,
      bundles.price,
      COUNT(items.template_id) AS template_count
    FROM template_bundles AS bundles
    LEFT JOIN template_bundle_items AS items ON items.bundle_id = bundles.id
    WHERE bundles.active = TRUE
    GROUP BY bundles.id
    ORDER BY bundles.id DESC
    LIMIT 30`,
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    price: row.price,
    templateCount: Number(row.template_count),
  }));
}
