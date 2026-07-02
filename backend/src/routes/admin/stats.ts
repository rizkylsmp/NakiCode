import { Router, type Request, type Response } from 'express';
import * as Sentry from '@sentry/node';
import { pool } from '../../db';
import { requireAdmin } from '../../auth';

const router = Router();

type AdminStatsResponse = {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: {
    status: string;
    count: number;
  }[];
  topTemplates: {
    templateTitle: string;
    orderCount: number;
    revenue: number;
  }[];
  recentOrders: {
    id: number;
    customerName: string;
    templateTitle: string;
    budgetRange: string;
    status: string;
    createdAt: string;
  }[];
  weeklyRevenue: {
    week: string;
    revenue: number;
    orders: number;
  }[];
};

// GET /api/admin/stats - Get dashboard statistics
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Total orders count
    const [totalOrdersResult] = await pool.query(
      'SELECT COUNT(*) as total FROM orders WHERE deleted_at IS NULL',
    );
    const totalOrders = (totalOrdersResult as any)[0]?.total || 0;

    // Calculate total revenue from actual payment_amount (not regex-parsed budgetRange)
    const [revenueResult] = await pool.query(`
      SELECT payment_amount
      FROM orders
      WHERE deleted_at IS NULL AND payment_status = 'paid' AND payment_amount IS NOT NULL
    `);

    let totalRevenue = 0;
    for (const order of revenueResult as any[]) {
      totalRevenue += Number(order.payment_amount) || 0;
    }

    // Orders by status
    const [ordersByStatusResult] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE deleted_at IS NULL
      GROUP BY status
      ORDER BY count DESC
    `);

    // Top templates by order count — use payment_amount for revenue
    const [topTemplatesResult] = await pool.query(`
      SELECT
        templateTitle,
        COUNT(*) as orderCount,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND payment_amount IS NOT NULL THEN payment_amount ELSE 0 END), 0) as revenue
      FROM orders
      WHERE deleted_at IS NULL AND templateTitle IS NOT NULL
      GROUP BY templateTitle
      ORDER BY orderCount DESC
      LIMIT 10
    `);

    // Recent orders (last 10)
    const [recentOrdersResult] = await pool.query(`
      SELECT id, customerName, templateTitle, budgetRange, status, createdAt
      FROM orders
      WHERE deleted_at IS NULL
      ORDER BY createdAt DESC
      LIMIT 10
    `);

    // Weekly revenue for last 8 weeks — use actual payment_amount
    const [weeklyRevenueResult] = await pool.query(`
      SELECT
        YEARWEEK(createdAt, 1) as yearWeek,
        DATE_FORMAT(createdAt, '%Y-%W') as week,
        SUM(CASE WHEN payment_status = 'paid' AND payment_amount IS NOT NULL THEN payment_amount ELSE 0 END) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE deleted_at IS NULL
        AND createdAt >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
      GROUP BY yearWeek, week
      ORDER BY yearWeek DESC
    `);

    const weeklyRevenue = (weeklyRevenueResult as any[]).map((row) => ({
      week: row.week,
      revenue: Number(row.revenue) || 0,
      orders: Number(row.orders) || 0,
    }));

    const stats: AdminStatsResponse = {
      totalOrders,
      totalRevenue,
      ordersByStatus: ordersByStatusResult as any,
      topTemplates: topTemplatesResult as any,
      recentOrders: recentOrdersResult as any,
      weeklyRevenue,
    };

    res.json(stats);
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({
      message: 'Failed to fetch statistics',
    });
  }
});

export default router;
