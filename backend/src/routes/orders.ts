import { Router } from 'express';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { requireAdmin, requireUser, type UserTokenPayload } from '../auth';
import { config } from '../config';
import { createAdminAuditLog } from '../models/audit-log.model';
import {
  recordCouponRedemption,
  recordReferralConversion,
  validateCoupon,
} from '../models/business.model';
import { createNotification } from '../models/notification.model';
import {
  confirmOrderPayment,
  createOrder,
  deleteOrder,
  findOrderById,
  findOrderByIdForUser,
  findOrdersPage,
  findOrdersPageByUser,
  normalizeOrderPayload,
  startOrderPayment,
  type AdminOrderStatusFilter,
  type AdminPaymentStatusFilter,
  type UserOrderPaymentFilter,
  updateOrderStatus,
} from '../models/order.model';
import {
  createPaymentSession,
  normalizePaymentMethod,
  parseCurrencyAmount,
} from '../payments/payment.service';
import { parseBody, parseParams } from '../validation';

export const ordersRouter = Router();

function isMidtransPaymentActive() {
  return (
    config.payment.provider.toLowerCase() === 'midtrans' &&
    Boolean(config.payment.midtransServerKey)
  );
}

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const orderBodySchema = z
  .object({
    templateId: z.coerce.number().int().positive().nullable().optional(),
    templateSlug: z.string().trim().min(1).max(180),
    templateTitle: z.string().trim().min(1).max(160),
    customerName: z.string().trim().min(1).max(120),
    customerContact: z.string().trim().min(1).max(120),
    projectType: z.string().trim().min(1).max(80).optional(),
    budgetRange: z.string().trim().min(1).max(80).optional(),
    message: z.string().trim().min(1).max(5000),
  })
  .passthrough();

const paymentBodySchema = z.object({
  method: z.enum(['qris', 'dana', 'manual']).optional(),
  couponCode: z.string().trim().max(60).optional(),
  referralCode: z.string().trim().max(80).optional(),
});

const orderStatusBodySchema = z.object({
  status: z.enum(['new', 'contacted', 'deal', 'closed']),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(10),
});

const adminOrdersQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['new', 'contacted', 'deal', 'closed']).optional(),
  paymentStatus: z.enum(['pending', 'waiting_payment', 'paid', 'failed']).optional(),
});

const userOrdersQuerySchema = paginationQuerySchema.extend({
  paymentStatus: z.enum(['paid', 'waiting_payment', 'unpaid']).optional(),
});

ordersRouter.get('/', requireAdmin, async (request, response) => {
  const query = adminOrdersQuerySchema.safeParse(request.query);

  if (!query.success) {
    response.status(400).json({
      message: 'Parameter tidak valid',
      errors: query.error.flatten(),
    });
    return;
  }

  try {
    response.json({
      source: 'mysql',
      ...(await findOrdersPage(query.data.page, query.data.pageSize, {
        status: query.data.status as AdminOrderStatusFilter | undefined,
        paymentStatus: query.data.paymentStatus as AdminPaymentStatusFilter | undefined,
      })),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({
      message: 'Database orders belum tersedia',
      orders: [],
    });
  }
});

ordersRouter.get('/my', requireUser, async (request, response) => {
  const user = response.locals.user as UserTokenPayload;
  const query = userOrdersQuerySchema.safeParse(request.query);

  if (!query.success) {
    response.status(400).json({
      message: 'Parameter tidak valid',
      errors: query.error.flatten(),
    });
    return;
  }

  try {
    response.json({
      source: 'mysql',
      ...(await findOrdersPageByUser(
        user.userId,
        query.data.page,
        query.data.pageSize,
        query.data.paymentStatus as UserOrderPaymentFilter | undefined,
      )),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({
      message: 'Database orders belum tersedia',
      orders: [],
    });
  }
});

ordersRouter.get('/my/:id', requireUser, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const user = response.locals.user as UserTokenPayload;

  if (!params) {
    return;
  }

  try {
    const order = await findOrderByIdForUser(params.id, user.userId);

    if (!order) {
      response.status(404).json({ message: 'Order not found' });
      return;
    }

    response.json({
      source: 'mysql',
      order,
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({ message: 'Database orders belum tersedia' });
  }
});

ordersRouter.post('/', requireUser, async (request, response) => {
  const user = response.locals.user as UserTokenPayload;
  const body = parseBody(orderBodySchema, request, response);

  if (!body) {
    return;
  }

  const payload = normalizeOrderPayload(body, user.userId);

  try {
    const order = await createOrder(payload);

    await createNotification({
      userId: order.userId,
      title: 'Order dibuat',
      message: `Order ${order.templateTitle} berhasil dibuat. Lanjutkan checkout atau tunggu admin menghubungi kamu.`,
      type: 'order',
      relatedOrderId: order.id,
    });

    response.status(201).json({
      source: 'mysql',
      order,
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal menyimpan order' });
  }
});

ordersRouter.post('/:id/payment', requireUser, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const body = parseBody(paymentBodySchema, request, response);
  const user = response.locals.user as UserTokenPayload;

  if (!params || !body) {
    return;
  }

  try {
    const existingOrder = await findOrderByIdForUser(params.id, user.userId);

    if (!existingOrder) {
      response.status(404).json({ message: 'Order not found' });
      return;
    }

    // SECURITY: the payable amount must come from a server-trusted source
    // (templates.price), never from user-supplied fields like budget_range.
    // Custom orders without a template price are consultation-only and cannot
    // be self-checked-out — an admin sets the price/handles them manually.
    if (!existingOrder.templatePrice) {
      response.status(409).json({
        message:
          'Pesanan custom belum bisa dibayar mandiri. Tim kami akan menghubungi kamu untuk penawaran harga.',
      });
      return;
    }

    const paymentMethod = normalizePaymentMethod(body.method);
    const baseAmount = parseCurrencyAmount(existingOrder.templatePrice);
    const coupon = body.couponCode
      ? await validateCoupon(body.couponCode, baseAmount)
      : null;
    const paymentSession = await createPaymentSession({
      order: existingOrder,
      method: paymentMethod,
      amount: coupon?.finalAmount ?? baseAmount,
    });
    const order = await startOrderPayment(params.id, user.userId, paymentSession);

    if (!order) {
      response.status(404).json({ message: 'Order not found' });
      return;
    }

    if (coupon) {
      await recordCouponRedemption({
        couponCode: coupon.code,
        orderId: order.id,
        userId: order.userId,
        discountAmount: coupon.discountAmount,
      });
    }

    if (body.referralCode) {
      await recordReferralConversion(body.referralCode);
    }

    response.json({
      source: 'mysql',
      order,
      coupon,
      payment: {
        status: order.paymentStatus,
        method: order.paymentMethod,
        reference: order.paymentReference,
        url: order.paymentUrl,
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal membuat pembayaran' });
  }
});

ordersRouter.post('/:id/payment/confirm', requireUser, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const user = response.locals.user as UserTokenPayload;

  if (!params) {
    return;
  }

  if (isMidtransPaymentActive()) {
    response.status(409).json({
      message:
        'Konfirmasi manual dinonaktifkan untuk Midtrans. Status paid menunggu webhook Midtrans.',
    });
    return;
  }

  try {
    const order = await confirmOrderPayment(params.id, user.userId);

    if (!order) {
      response.status(404).json({ message: 'Order not found' });
      return;
    }

    await createNotification({
      userId: order.userId,
      title: 'Pembayaran berhasil',
      message: `Pembayaran untuk ${order.templateTitle} sudah dikonfirmasi. Source code dan panduan sudah terbuka di Pesanan Saya.`,
      type: 'payment',
      relatedOrderId: order.id,
    });

    response.json({
      source: 'mysql',
      order,
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal mengonfirmasi pembayaran' });
  }
});

ordersRouter.patch('/:id/status', requireAdmin, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const body = parseBody(orderStatusBodySchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!params || !body) {
    return;
  }

  try {
    const previousOrder = await findOrderById(params.id);
    const wasUpdated = await updateOrderStatus(params.id, body.status);

    if (!wasUpdated) {
      response.status(404).json({ message: 'Order not found' });
      return;
    }

    const order = await findOrderById(params.id);

    await createAdminAuditLog({
      admin,
      action: 'order.status_update',
      entityType: 'order',
      entityId: params.id,
      metadata: {
        from: previousOrder?.status ?? null,
        to: body.status,
      },
    });

    await createNotification({
      userId: order?.userId ?? previousOrder?.userId ?? null,
      title: 'Status pesanan diperbarui',
      message: `Pesanan ${order?.templateTitle ?? previousOrder?.templateTitle ?? `#${params.id}`} sekarang berstatus ${body.status}.`,
      type: 'order',
      relatedOrderId: params.id,
    });

    response.json({
      source: 'mysql',
      order: {
        id: params.id,
        status: body.status,
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal mengubah status order' });
  }
});

ordersRouter.delete('/:id', requireAdmin, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!params) {
    return;
  }

  try {
    const order = await findOrderById(params.id);
    const wasDeleted = await deleteOrder(params.id);

    if (!wasDeleted) {
      response.status(404).json({ message: 'Order not found' });
      return;
    }

    await createAdminAuditLog({
      admin,
      action: 'order.soft_delete',
      entityType: 'order',
      entityId: params.id,
      metadata: {
        templateTitle: order?.templateTitle ?? null,
        customerName: order?.customerName ?? null,
      },
    });

    response.status(204).send();
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: 'Gagal menghapus order' });
  }
});

// GET /orders/:id/invoice - Generate and download PDF invoice
ordersRouter.get('/:id/invoice', requireUser, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const user = response.locals.user as UserTokenPayload | null | undefined;

  if (!params || !user) {
    return;
  }

  try {
    const order = await findOrderByIdForUser(params.id, user.userId);

    if (!order) {
      response.status(404).json({ message: 'Order tidak ditemukan' });
      return;
    }

    // Only generate invoice for paid orders.
    // Paid state lives in payment_status; `status` is the fulfilment enum
    // (new|contacted|deal|closed) and is never 'paid'.
    if (order.paymentStatus !== 'paid') {
      response.status(400).json({ 
        message: 'Invoice hanya tersedia untuk pesanan yang sudah dibayar' 
      });
      return;
    }

    // Import generateInvoicePDF
    const { generateInvoicePDF } = await import('../utils/generateInvoice.js');

    // Set response headers for PDF download
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${String(order.id).padStart(6, '0')}.pdf"`
    );

    // Generate and stream PDF
    await generateInvoicePDF(response, {
      orderId: order.id,
      customerName: order.customerName,
      customerContact: order.customerContact,
      templateTitle: order.templateTitle,
      budgetRange: order.budgetRange,
      projectType: order.projectType,
      status: order.status,
      createdAt: order.createdAt,
      paymentDate: order.paidAt ?? undefined,
      paymentMethod: order.paymentMethod || 'Transfer Bank',
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    response.status(500).json({ message: 'Gagal membuat invoice' });
  }
});
