import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";

type CouponRow = RowDataPacket & {
  id: number;
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  active: number;
  expires_at?: string | null;
  max_redemptions?: number | null;
  image_url?: string | null;
  show_banner?: number;
  created_at: string;
  redemption_count?: number;
};

export type CouponInput = {
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  active: boolean;
  expiresAt: string | null;
  maxRedemptions: number | null;
  imageUrl: string | null;
  showBanner: boolean;
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
  discountType: "percent" | "fixed";
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
};

export type CouponBanner = {
  id: number;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  imageUrl: string;
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
    `SELECT coupons.id, coupons.code, coupons.description, coupons.discount_type,
      coupons.discount_value, coupons.active, coupons.expires_at, coupons.max_redemptions,
      COUNT(coupon_redemptions.id) AS redemption_count
    FROM coupons
    LEFT JOIN coupon_redemptions
      ON coupon_redemptions.coupon_id = coupons.id
      AND (
        coupon_redemptions.status = 'redeemed'
        OR (
          coupon_redemptions.status = 'reserved'
          AND coupon_redemptions.reservation_expires_at > CURRENT_TIMESTAMP
        )
      )
    WHERE coupons.code = ?
      AND coupons.deleted_at IS NULL
      AND active = TRUE
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    GROUP BY coupons.id
    HAVING coupons.max_redemptions IS NULL
      OR COUNT(coupon_redemptions.id) < coupons.max_redemptions
    LIMIT 1`,
    [normalizedCode],
  );
  const coupon = rows[0];

  if (!coupon) {
    return null;
  }

  const discountAmount =
    coupon.discount_type === "percent"
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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [coupons] = await connection.query<
      Array<RowDataPacket & { id: number; max_redemptions: number | null }>
    >(
      `SELECT id, max_redemptions FROM coupons
       WHERE code = ? AND deleted_at IS NULL AND active = TRUE
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       LIMIT 1 FOR UPDATE`,
      [payload.couponCode.toUpperCase()],
    );
    const coupon = coupons[0];
    if (!coupon) {
      await connection.rollback();
      return null;
    }

    const [existingRows] = await connection.query<
      Array<
        RowDataPacket & {
          id: number;
          coupon_id: number;
          status: string;
          active_reservation: number;
        }
      >
    >(
      `SELECT id, coupon_id, status,
        (reservation_expires_at > CURRENT_TIMESTAMP) AS active_reservation
       FROM coupon_redemptions
       WHERE order_id = ? LIMIT 1`,
      [payload.orderId],
    );
    const existing = existingRows[0];
    if (existing?.status === 'redeemed') {
      await connection.commit();
      return existing.id;
    }
    const alreadyConsumesQuota =
      existing?.coupon_id === coupon.id &&
      existing.status === 'reserved' &&
      Boolean(existing.active_reservation);

    if (!alreadyConsumesQuota && coupon.max_redemptions !== null) {
      const [counts] = await connection.query<
        Array<RowDataPacket & { total: number }>
      >(
        `SELECT COUNT(*) AS total FROM coupon_redemptions
         WHERE coupon_id = ? AND (
           status = 'redeemed'
           OR (status = 'reserved' AND reservation_expires_at > CURRENT_TIMESTAMP)
         )`,
        [coupon.id],
      );
      if (Number(counts[0]?.total ?? 0) >= coupon.max_redemptions) {
        await connection.rollback();
        return null;
      }
    }

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO coupon_redemptions (
        coupon_id, order_id, user_id, discount_amount, status,
        reservation_expires_at, redeemed_at
      ) VALUES (?, ?, ?, ?, 'reserved', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR), NULL)
      ON DUPLICATE KEY UPDATE
        coupon_id = VALUES(coupon_id),
        user_id = VALUES(user_id),
        discount_amount = VALUES(discount_amount),
        status = 'reserved',
        reservation_expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR),
        redeemed_at = NULL`,
      [coupon.id, payload.orderId, payload.userId, payload.discountAmount],
    );
    await connection.commit();
    return result.insertId || payload.orderId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function redeemCouponReservation(orderId: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE coupon_redemptions
     SET status = 'redeemed', redeemed_at = CURRENT_TIMESTAMP,
       reservation_expires_at = NULL
     WHERE order_id = ? AND status = 'reserved'`,
    [orderId],
  );
  return result.affectedRows > 0;
}

export async function releaseCouponReservation(orderId: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE coupon_redemptions
     SET status = 'released', reservation_expires_at = NULL
     WHERE order_id = ? AND status = 'reserved'`,
    [orderId],
  );
  return result.affectedRows > 0;
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
    maxRedemptions: row.max_redemptions ?? null,
    imageUrl: row.image_url ?? null,
    showBanner: Boolean(row.show_banner),
    createdAt: row.created_at,
    redemptionCount: Number(row.redemption_count ?? 0),
  };
}

export async function findCoupons() {
  const [rows] = await pool.query<CouponRow[]>(
    `SELECT coupons.id, coupons.code, coupons.description,
      coupons.discount_type, coupons.discount_value, coupons.active,
      coupons.expires_at, coupons.max_redemptions, coupons.image_url,
      coupons.show_banner, coupons.created_at,
      COUNT(coupon_redemptions.id) AS redemption_count
    FROM coupons
    LEFT JOIN coupon_redemptions
      ON coupon_redemptions.coupon_id = coupons.id
      AND coupon_redemptions.status = 'redeemed'
    WHERE coupons.deleted_at IS NULL
    GROUP BY coupons.id
    ORDER BY coupons.created_at DESC`,
  );
  return rows.map(mapCoupon);
}

export async function findActiveCouponBanners(): Promise<CouponBanner[]> {
  const [rows] = await pool.query<CouponRow[]>(
    `SELECT coupons.id, coupons.code, coupons.description,
      coupons.discount_type, coupons.discount_value, coupons.image_url,
      coupons.show_banner, coupons.active, coupons.expires_at,
      coupons.max_redemptions, coupons.created_at,
      COUNT(coupon_redemptions.id) AS redemption_count
    FROM coupons
    LEFT JOIN coupon_redemptions
      ON coupon_redemptions.coupon_id = coupons.id
      AND (
        coupon_redemptions.status = 'redeemed'
        OR (
          coupon_redemptions.status = 'reserved'
          AND coupon_redemptions.reservation_expires_at > CURRENT_TIMESTAMP
        )
      )
    WHERE coupons.deleted_at IS NULL
      AND coupons.active = TRUE
      AND coupons.show_banner = TRUE
      AND coupons.image_url IS NOT NULL
      AND coupons.image_url <> ''
      AND (coupons.expires_at IS NULL OR coupons.expires_at > CURRENT_TIMESTAMP)
    GROUP BY coupons.id
    HAVING coupons.max_redemptions IS NULL
      OR COUNT(coupon_redemptions.id) < coupons.max_redemptions
    ORDER BY coupons.created_at DESC
    LIMIT 10`,
  );

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    imageUrl: row.image_url ?? "",
  }));
}

export async function createCoupon(input: CouponInput) {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO coupons (code, description, discount_type, discount_value, active, expires_at, max_redemptions, image_url, show_banner)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.code.toUpperCase(),
      input.description,
      input.discountType,
      input.discountValue,
      input.active,
      input.expiresAt,
      input.maxRedemptions,
      input.imageUrl,
      input.showBanner,
    ],
  );
  return result.insertId;
}

export async function updateCoupon(id: number, input: CouponInput) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE coupons SET code = ?, description = ?, discount_type = ?,
      discount_value = ?, active = ?, expires_at = ?, max_redemptions = ?,
      image_url = ?, show_banner = ?
      WHERE id = ? AND deleted_at IS NULL`,
    [
      input.code.toUpperCase(),
      input.description,
      input.discountType,
      input.discountValue,
      input.active,
      input.expiresAt,
      input.maxRedemptions,
      input.imageUrl,
      input.showBanner,
      id,
    ],
  );
  return result.affectedRows > 0;
}

export async function deleteCoupon(id: number) {
  const [usage] = await pool.query<Array<RowDataPacket & { total: number }>>(
    "SELECT COUNT(*) AS total FROM coupon_redemptions WHERE coupon_id = ?",
    [id],
  );
  const archived = Number(usage[0]?.total ?? 0) > 0;
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE coupons SET active = FALSE, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
    [id],
  );
  return { found: result.affectedRows > 0, archived };
}

export async function findActiveTemplateBundles() {
  const [rows] = await pool.query<BundleRow[]>(
    `SELECT bundles.id,
      bundles.slug,
      bundles.title,
      bundles.description,
      bundles.price,
      COUNT(items.design_id) AS template_count
    FROM design_bundles AS bundles
    LEFT JOIN design_bundle_items AS items ON items.bundle_id = bundles.id
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
