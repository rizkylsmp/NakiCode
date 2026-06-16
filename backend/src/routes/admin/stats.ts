import { Router, type Request, type Response } from 'express';
import { pool } from '../../db';
import { verifyAdminToken } from '../../auth';

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
router.get('/', verifyAdminToken, async (req: Request, res: Response) => {
  try {
    // Total orders count
    const [totalOrdersResult] = await pool.query(
      'SELECT COUNT(*) as total FROM orders WHERE deleted_at IS NULL'
    );
    const totalOrders = (totalOrdersResult as any)[0]?.total || 0;

    // Calculate total revenue (sum of paid orders)
    const [revenueResult] = await pool.query(`
      SELECT budgetRange, status 
      FROM orders 
      WHERE deleted_at IS NULL AND status = 'paid'
    `);
    
    let totalRevenue = 0;
    for (const order of revenueResult as any[]) {
      const budgetStr = order.budgetRange;
      const match = budgetStr.match(/Rp?(\d+)/);
      if (match) {
        const amount = parseInt(match[1]) * 1000;
        totalRevenue += amount;
      }
    }

    // Orders by status
    const [ordersByStatusResult] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE deleted_at IS NULL
      GROUP BY status
      ORDER BY count DESC
    `);

    // Top templates by order count
    const [topTemplatesResult] = await pool.query(`
      SELECT 
        templateTitle,
        COUNT(*) as orderCount,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paidCount
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

    // Weekly revenue for last 8 weeks
    const [weeklyRevenueResult] = await pool.query(`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%W') as week,
        COUNT(*) as orders,
        status
      FROM orders
      WHERE deleted_at IS NULL 
        AND createdAt >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
      GROUP BY week, status
      ORDER BY week DESC
    `);

    // Process weekly data
    const weeklyMap = new Map<string, { revenue: number; orders: number }>();
    for (const row of weeklyRevenueResult as any[]) {
      if (!weeklyMap.has(row.week)) {
        weeklyMap.set(row.week, { revenue: 0, orders: 0 });
      }
      const weekData = weeklyMap.get(row.week)!;
      weekData.orders += row.orders;
      if (row.status === 'paid') {
        weekData.revenue += row.orders * 500000;
      }
    }

    const weeklyRevenue = Array.from(weeklyMap.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => b.week.localeCompare(a.week));

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
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
