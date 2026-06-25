import { Router, type Request, type Response } from 'express';
import { pool } from '../db';
import { requireAdmin } from '../auth';

export const router = Router();

type OrdersStatsResponse = {
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  newOrders: number;
  pendingPayments: number;
};

router.get('/stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS totalOrders,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paidOrders,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND payment_amount IS NOT NULL THEN payment_amount ELSE 0 END), 0) AS totalRevenue,
        CASE
          WHEN SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) = 0 THEN 0
          ELSE COALESCE(
            SUM(CASE WHEN payment_status = 'paid' AND payment_amount IS NOT NULL THEN payment_amount ELSE 0 END)
            / SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END),
            0
          )
        END AS avgOrderValue,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS newOrders,
        SUM(CASE WHEN payment_status = 'waiting_payment' THEN 1 ELSE 0 END) AS pendingPayments
      FROM orders
      WHERE deleted_at IS NULL
    `);

    const row = (rows as any)[0] ?? {
      totalOrders: 0,
      paidOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      newOrders: 0,
      pendingPayments: 0,
    };

    res.json({
      totalOrders: Number(row.totalOrders),
      paidOrders: Number(row.paidOrders),
      totalRevenue: Number(row.totalRevenue),
      avgOrderValue: Number(row.avgOrderValue),
      newOrders: Number(row.newOrders),
      pendingPayments: Number(row.pendingPayments),
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      error: 'Failed to fetch order statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
