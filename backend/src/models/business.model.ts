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
  created_at: string;
  redemption_count?: number;
};

export type CouponInput = {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  active: boolean;
  expiresAt: string | null;
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

function mapCoupon(row: CouponRow) {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    active: Boolean(row.active),
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at,
    redemptionCount: Number(row.redemption_count ?? 0),
  };
}

export async function findCoupons() {
  const [rows] = await pool.query<CouponRow[]>(
    `SELECT coupons.id, coupons.code, coupons.description,
      coupons.discount_type, coupons.discount_value, coupons.active,
      coupons.expires_at, coupons.created_at,
      COUNT(coupon_redemptions.id) AS redemption_count
    FROM coupons
    LEFT JOIN coupon_redemptions ON coupon_redemptions.coupon_id = coupons.id
    GROUP BY coupons.id
    ORDER BY coupons.created_at DESC`,
  );
  return rows.map(mapCoupon);
}

export async function createCoupon(input: CouponInput) {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO coupons (code, description, discount_type, discount_value, active, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.code.toUpperCase(), input.description, input.discountType, input.discountValue, input.active, input.expiresAt],
  );
  return result.insertId;
}

export async function updateCoupon(id: number, input: CouponInput) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE coupons SET code = ?, description = ?, discount_type = ?,
      discount_value = ?, active = ?, expires_at = ? WHERE id = ?`,
    [input.code.toUpperCase(), input.description, input.discountType, input.discountValue, input.active, input.expiresAt, id],
  );
  return result.affectedRows > 0;
}

export async function deleteCoupon(id: number) {
  const [usage] = await pool.query<Array<RowDataPacket & { total: number }>>(
    'SELECT COUNT(*) AS total FROM coupon_redemptions WHERE coupon_id = ?', [id],
  );
  if (Number(usage[0]?.total ?? 0) > 0) {
    const [result] = await pool.query<ResultSetHeader>('UPDATE coupons SET active = FALSE WHERE id = ?', [id]);
    return { found: result.affectedRows > 0, archived: true };
  }
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM coupons WHERE id = ?', [id]);
  return { found: result.affectedRows > 0, archived: false };
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
