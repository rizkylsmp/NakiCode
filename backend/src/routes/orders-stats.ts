import { Router, type Request, type Response } from 'express';
import * as Sentry from '@sentry/node';
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
  failedPayments: number;
};

router.get('/stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS totalOrders,
        SUM(CASE WHEN payment_status IN ('paid', 'partial_refunded', 'refunded') THEN 1 ELSE 0 END) AS paidOrders,
        COALESCE((SELECT SUM(CASE
          WHEN transaction_type = 'income' THEN net_amount
          WHEN transaction_type = 'refund' THEN -amount
          ELSE 0 END)
          FROM financial_transactions WHERE status = 'posted'), 0) AS totalRevenue,
        CASE
          WHEN SUM(CASE WHEN payment_status IN ('paid', 'partial_refunded', 'refunded') THEN 1 ELSE 0 END) = 0 THEN 0
          ELSE COALESCE(
            (SELECT SUM(CASE WHEN transaction_type = 'income' THEN net_amount WHEN transaction_type = 'refund' THEN -amount ELSE 0 END)
             FROM financial_transactions WHERE status = 'posted')
            / SUM(CASE WHEN payment_status IN ('paid', 'partial_refunded', 'refunded') THEN 1 ELSE 0 END),
            0
          )
        END AS avgOrderValue,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS newOrders,
        SUM(CASE WHEN payment_status = 'waiting_payment' THEN 1 ELSE 0 END) AS pendingPayments,
        SUM(CASE WHEN payment_status = 'failed' THEN 1 ELSE 0 END) AS failedPayments
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
      failedPayments: 0,
    };

    res.json({
      totalOrders: Number(row.totalOrders),
      paidOrders: Number(row.paidOrders),
      totalRevenue: Number(row.totalRevenue),
      avgOrderValue: Number(row.avgOrderValue),
      newOrders: Number(row.newOrders),
      pendingPayments: Number(row.pendingPayments),
      failedPayments: Number(row.failedPayments),
    });
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({
      message: 'Failed to fetch order statistics',
    });
  }
});
