import { Router } from "express";
import * as Sentry from "@sentry/node";
import { z } from "zod";
import { requireAdmin, requireUser, type UserTokenPayload } from "../auth";
import { config } from "../config";
import { createAdminAuditLog } from "../models/audit-log.model";
import {
  recordCouponRedemption,
  redeemCouponReservation,
  releaseCouponReservation,
  validateCoupon,
} from "../models/business.model";
import { createNotification } from "../models/notification.model";
import { findTemplateBySlugOrId } from "../models/design.model";
import {
  confirmOrderPayment,
  confirmOrderPaymentAsAdmin,
  createOrder,
  deleteOrder,
  findOrderById,
  findOrderByIdForUser,
  findOrdersPage,
  findOrdersPageByUser,
  normalizeOrderPayload,
  OrderPaymentBusyError,
  respondToOrderDelivery,
  respondToOrderQuote,
  setOrderQuote,
  startOrderPayment,
  submitOrderDelivery,
  type AdminOrderStatusFilter,
  type AdminPaymentStatusFilter,
  type OrderItem,
  type UserOrderPaymentFilter,
  updateOrderStatus,
  withOrderPaymentLock,
} from "../models/order.model";
import {
  canStartOrderPayment,
  canTransitionOrderStatus,
  type OrderWorkflowStatus,
} from "../order-workflow";
import {
  ensureOrderInvoice,
  recordPaidOrderTransaction,
} from "../models/finance.model";
import {
  createLynkPaymentSession,
  createPaymentSession,
  LynkCheckoutUnavailableError,
  normalizePaymentMethod,
  parseCurrencyAmount,
} from "../payments/payment.service";
import { reconcileWaitingMidtransOrder } from "../payments/midtrans-reconciliation.service";
import { parseBody, parseParams } from "../validation";

export const ordersRouter = Router();

function isMidtransPaymentActive() {
  return (
    config.payment.provider.toLowerCase() === "midtrans" &&
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
    orderType: z.enum(["source_purchase", "custom_project"]).optional(),
  })
  .passthrough();

const paymentBodySchema = z.object({
  provider: z.enum(["midtrans", "lynk"]).optional().default("midtrans"),
  method: z.enum(["qris", "dana", "manual"]).optional(),
  couponCode: z.string().trim().max(60).optional(),
  paymentOption: z.enum(["deposit", "full"]).optional().default("deposit"),
});

const orderStatusBodySchema = z.object({
  status: z.enum([
    "new",
    "contacted",
    "quotation",
    "awaiting_dp",
    "awaiting_balance",
    "in_progress",
    "revision",
    "delivered",
    "completed",
    "cancelled",
    "deal",
    "closed",
  ]),
});
const quoteBodySchema = z.object({
  amount: z.coerce.number().int().positive(),
  notes: z.string().trim().max(2000).nullable().default(null),
  depositPercent: z.coerce.number().int().optional(),
});
const quoteResponseBodySchema = z.object({
  decision: z.enum(["accepted", "rejected"]),
});
const deliverySourceUrlSchema = z
  .string()
  .trim()
  .min(1, "Source code final wajib diisi")
  .max(500)
  .refine(
    (value) => /^https?:\/\//i.test(value) || value.startsWith("/uploads/"),
    "URL source code final tidak valid",
  );
const deliveryBodySchema = z.object({
  demoUrl: z.string().trim().url().max(500).nullable().optional(),
  sourceUrl: deliverySourceUrlSchema,
  notes: z.string().trim().min(3).max(2000),
});
const deliveryResponseBodySchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approved") }),
  z.object({
    decision: z.literal("revision_requested"),
    notes: z.string().trim().min(3).max(2000),
    files: z.array(z.string().trim().min(1).max(500)).max(5).default([]),
  }),
]);
const bulkStatusBodySchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(100),
  status: orderStatusBodySchema.shape.status,
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(10),
});

const adminOrdersQuerySchema = paginationQuerySchema.extend({
  status: orderStatusBodySchema.shape.status.optional(),
  paymentStatus: z
    .enum([
      "pending",
      "waiting_payment",
      "partial_paid",
      "paid",
      "failed",
      "expired",
      "partial_refunded",
      "refunded",
      "cancelled",
    ])
    .optional(),
  search: z.string().trim().max(100).optional(),
});

const userOrdersQuerySchema = paginationQuerySchema.extend({
  paymentStatus: z
    .enum([
      "paid",
      "waiting_payment",
      "unpaid",
      "cancelled",
      "work",
      "review",
      "balance",
      "completed",
    ])
    .optional(),
});

ordersRouter.get("/", requireAdmin, async (request, response) => {
  const query = adminOrdersQuerySchema.safeParse(request.query);

  if (!query.success) {
    response.status(400).json({
      message: "Parameter tidak valid",
      errors: query.error.flatten(),
    });
    return;
  }

  try {
    response.json({
      source: "mysql",
      ...(await findOrdersPage(query.data.page, query.data.pageSize, {
        status: query.data.status as AdminOrderStatusFilter | undefined,
        paymentStatus: query.data.paymentStatus as
          | AdminPaymentStatusFilter
          | undefined,
        search: query.data.search,
      })),
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({
      message: "Database orders belum tersedia",
      orders: [],
    });
  }
});

ordersRouter.get("/my", requireUser, async (request, response) => {
  const user = response.locals.user as UserTokenPayload;
  const query = userOrdersQuerySchema.safeParse(request.query);

  if (!query.success) {
    response.status(400).json({
      message: "Parameter tidak valid",
      errors: query.error.flatten(),
    });
    return;
  }

  try {
    let pageData = await findOrdersPageByUser(
      user.userId,
      query.data.page,
      query.data.pageSize,
      query.data.paymentStatus as UserOrderPaymentFilter | undefined,
    );
    if (await reconcileWaitingPayments(pageData.orders)) {
      pageData = await findOrdersPageByUser(
        user.userId,
        query.data.page,
        query.data.pageSize,
        query.data.paymentStatus as UserOrderPaymentFilter | undefined,
      );
    }
    response.json({
      source: "mysql",
      ...pageData,
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({
      message: "Database orders belum tersedia",
      orders: [],
    });
  }
});

ordersRouter.get("/my/:id", requireUser, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const user = response.locals.user as UserTokenPayload;

  if (!params) {
    return;
  }

  try {
    let order = await findOrderByIdForUser(params.id, user.userId);

    if (!order) {
      response.status(404).json({ message: "Order not found" });
      return;
    }

    if (await reconcileWaitingMidtransOrder(order)) {
      order = await findOrderByIdForUser(params.id, user.userId);
    }

    response.json({
      source: "mysql",
      order,
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(503).json({ message: "Database orders belum tersedia" });
  }
});

async function reconcileWaitingPayments(orders: OrderItem[]) {
  const results = await Promise.all(
    orders.map((order) => reconcileWaitingMidtransOrder(order)),
  );
  return results.some(Boolean);
}

ordersRouter.post("/", requireUser, async (request, response) => {
  const user = response.locals.user as UserTokenPayload;
  const body = parseBody(orderBodySchema, request, response);

  if (!body) {
    return;
  }

  try {
    const design = await findTemplateBySlugOrId(
      String(body.templateId ?? body.templateSlug),
    );
    if (!design) {
      response.status(404).json({ message: "Design tidak ditemukan" });
      return;
    }
    if (body.orderType === "source_purchase" && !design.sourceAvailable) {
      response.status(409).json({
        message: "Source code design ini tidak tersedia untuk pembelian.",
      });
      return;
    }

    const payload = normalizeOrderPayload(
      {
        ...body,
        templateId: design.id,
        templateSlug: design.slug,
        templateTitle: design.title,
      },
      user.userId,
    );
    const order = await createOrder(payload);

    await createNotification({
      userId: order.userId,
      title: "Order dibuat",
      message:
        order.orderType === "source_purchase"
          ? `Order ${order.templateTitle} berhasil dibuat. Lanjutkan ke pembayaran penuh untuk membuka source code.`
          : `Permintaan ${order.templateTitle} berhasil dibuat. Tunggu penawaran dari admin sebelum membayar DP.`,
      type: "order",
      relatedOrderId: order.id,
    });

    response.status(201).json({
      source: "mysql",
      order,
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: "Gagal menyimpan order" });
  }
});

ordersRouter.post("/:id/payment", requireUser, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const body = parseBody(paymentBodySchema, request, response);
  const user = response.locals.user as UserTokenPayload;

  if (!params || !body) {
    return;
  }

  try {
    await withOrderPaymentLock(params.id, async () => {
      const existingOrder = await findOrderByIdForUser(params.id, user.userId);

      if (!existingOrder) {
        response.status(404).json({ message: "Order not found" });
        return;
      }

      if (
        existingOrder.orderType === "source_purchase" &&
        existingOrder.templateId &&
        existingOrder.sourceAvailable === false
      ) {
        response.status(409).json({
          message: "Source code design ini tidak tersedia untuk pembelian.",
        });
        return;
      }

      if (
        existingOrder.paymentStatus === "waiting_payment" &&
        existingOrder.paymentReference &&
        existingOrder.paymentUrl
      ) {
        response.json({
          source: "mysql",
          order: existingOrder,
          reused: true,
          payment: {
            status: existingOrder.paymentStatus,
            method: existingOrder.paymentMethod,
            reference: existingOrder.paymentReference,
            url: existingOrder.paymentUrl,
          },
        });
        return;
      }

      if (!canStartOrderPayment(existingOrder)) {
        response.status(409).json({
          message:
            existingOrder.quoteAmount &&
            existingOrder.quoteStatus !== "accepted"
              ? "Setujui penawaran harga terlebih dahulu sebelum membayar."
              : "Order pada status ini tidak dapat memulai pembayaran baru.",
        });
        return;
      }

      if (
        existingOrder.orderType === "source_purchase" &&
        existingOrder.paymentStatus === "expired"
      ) {
        await releaseCouponReservation(existingOrder.id);
      }

      // SECURITY: the payable amount must come from a server-trusted source
      // (designs.price), never from user-supplied fields like budget_range.
      // Custom orders without a template price are consultation-only and cannot
      // be self-checked-out — an admin sets the price/handles them manually.
      if (!existingOrder.templatePrice && !existingOrder.quoteAmount) {
        response.status(409).json({
          message:
            "Pesanan custom belum bisa dibayar mandiri. Tim kami akan menghubungi kamu untuk penawaran harga.",
        });
        return;
      }

      const baseAmount =
        existingOrder.orderType === "custom_project"
          ? Number(existingOrder.quoteAmount)
          : parseCurrencyAmount(existingOrder.templatePrice);
      const paymentStage =
        existingOrder.orderType === "source_purchase"
          ? "full"
          : existingOrder.amountPaid > 0
            ? "balance"
            : body.paymentOption === "full"
              ? "full"
              : "deposit";
      const stageAmount =
        paymentStage === "deposit"
          ? Math.min(
              baseAmount,
              Math.max(1_000, Math.round(baseAmount * 0.5)),
            )
          : paymentStage === "balance"
            ? baseAmount - existingOrder.amountPaid
            : baseAmount;

      if (!Number.isSafeInteger(stageAmount) || stageAmount <= 0) {
        response.status(409).json({
          message: "Tidak ada sisa pembayaran yang perlu dibayar.",
        });
        return;
      }

      if (
        existingOrder.orderType === "custom_project" &&
        body.provider === "lynk"
      ) {
        response.status(409).json({
          message:
            "Pembayaran DP dan pelunasan proyek custom harus memakai Midtrans agar nominalnya tervalidasi otomatis.",
        });
        return;
      }

      if (existingOrder.orderType === "custom_project" && body.couponCode) {
        response.status(409).json({
          message: "Kupon hanya berlaku untuk pembelian source code.",
        });
        return;
      }
      const coupon =
        existingOrder.orderType === "source_purchase" &&
        body.provider === "midtrans" &&
        body.couponCode
          ? await validateCoupon(body.couponCode, stageAmount)
          : null;
      if (body.couponCode && !coupon) {
        response.status(409).json({
          message: "Kupon tidak valid, kedaluwarsa, atau kuotanya habis.",
        });
        return;
      }
      if (coupon) {
        const reservation = await recordCouponRedemption({
          couponCode: coupon.code,
          orderId: existingOrder.id,
          userId: existingOrder.userId,
          discountAmount: coupon.discountAmount,
        });
        if (!reservation) {
          response.status(409).json({
            message: "Kuota kupon baru saja habis. Silakan cek kupon kembali.",
          });
          return;
        }
      }

      let paymentSession;
      try {
        paymentSession =
          body.provider === "lynk"
            ? createLynkPaymentSession(existingOrder, stageAmount)
            : await createPaymentSession({
                order: existingOrder,
                method: normalizePaymentMethod(body.method),
                amount: coupon?.finalAmount ?? stageAmount,
              });
      } catch (error) {
        if (coupon) {
          await releaseCouponReservation(existingOrder.id);
        }
        throw error;
      }
      const order = await startOrderPayment(params.id, user.userId, {
        ...paymentSession,
        provider:
          body.provider === "lynk"
            ? "lynk"
            : isMidtransPaymentActive()
              ? "midtrans"
              : "dev",
        stage: paymentStage,
        depositPercent: paymentStage === "deposit" ? 50 : undefined,
        subtotalAmount: stageAmount,
        discountAmount: coupon?.discountAmount ?? 0,
      });

      if (!order) {
        if (coupon) {
          await releaseCouponReservation(existingOrder.id);
        }
        response.status(404).json({ message: "Order not found" });
        return;
      }

      response.json({
        source: "mysql",
        order,
        coupon,
        payment: {
          status: order.paymentStatus,
          method: order.paymentMethod,
          reference: order.paymentReference,
          url: order.paymentUrl,
        },
      });
    });
  } catch (error) {
    if (error instanceof OrderPaymentBusyError) {
      response.status(409).json({ message: error.message });
      return;
    }
    if (error instanceof LynkCheckoutUnavailableError) {
      response.status(409).json({ message: error.message });
      return;
    }
    Sentry.captureException(error);
    response.status(500).json({ message: "Gagal membuat pembayaran" });
  }
});

ordersRouter.post(
  "/:id/payment/confirm",
  requireUser,
  async (request, response) => {
    const params = parseParams(idParamsSchema, request, response);
    const user = response.locals.user as UserTokenPayload;

    if (!params) {
      return;
    }

    if (isMidtransPaymentActive()) {
      response.status(409).json({
        message:
          "Konfirmasi manual dinonaktifkan untuk Midtrans. Status paid menunggu webhook Midtrans.",
      });
      return;
    }

    try {
      if (config.isProductionDeployment) {
        response.status(409).json({
          message: "Konfirmasi manual hanya tersedia pada development.",
        });
        return;
      }

      const existingOrder = await findOrderByIdForUser(params.id, user.userId);
      if (!existingOrder) {
        response.status(404).json({ message: "Order not found" });
        return;
      }
      if (
        existingOrder.paymentStatus !== "waiting_payment" ||
        !existingOrder.paymentMethod?.toLowerCase().includes("(dev)")
      ) {
        response.status(409).json({
          message: "Order ini bukan pembayaran development yang aktif.",
        });
        return;
      }

      const order = await confirmOrderPayment(params.id, user.userId);

      if (!order) {
        response.status(404).json({ message: "Order not found" });
        return;
      }

      await Promise.all([
        ensureOrderInvoice(order.id),
        recordPaidOrderTransaction(order.id, order.paymentReference),
        redeemCouponReservation(order.id),
      ]);

      await createNotification({
        userId: order.userId,
        title:
          order.paymentStatus === "partial_paid"
            ? "DP berhasil"
            : "Pembayaran berhasil",
        message:
          order.paymentStatus === "partial_paid"
            ? `DP untuk ${order.templateTitle} sudah dikonfirmasi. Proyek masuk tahap pengerjaan; pelunasan tersedia setelah hasil disetujui.`
            : order.orderType === "source_purchase"
              ? `Pembayaran untuk ${order.templateTitle} sudah dikonfirmasi. Source code dan panduan sudah terbuka di Pesanan Saya.`
              : `Pelunasan untuk ${order.templateTitle} sudah dikonfirmasi.`,
        type: "payment",
        relatedOrderId: order.id,
      });

      response.json({
        source: "mysql",
        order,
      });
    } catch (error) {
      Sentry.captureException(error);
      response.status(500).json({ message: "Gagal mengonfirmasi pembayaran" });
    }
  },
);

ordersRouter.patch("/:id/delivery", requireAdmin, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const body = parseBody(deliveryBodySchema, request, response);
  if (!params || !body) return;

  try {
    const updated = await submitOrderDelivery(params.id, {
      demoUrl: body.demoUrl ?? null,
      sourceUrl: body.sourceUrl,
      notes: body.notes,
    });
    if (!updated) {
      response.status(409).json({
        message:
          "Hasil dan source final hanya dapat dikirim untuk proyek custom yang sudah dibayar dan sedang dikerjakan/revisi.",
      });
      return;
    }
    const order = await findOrderById(params.id);
    await createNotification({
      userId: order?.userId ?? null,
      title: "Hasil website siap direview",
      message: `Hasil ${order?.templateTitle ?? `order #${params.id}`} sudah dikirim. Silakan approve atau ajukan revisi dari Pesanan Saya.`,
      type: "order",
      relatedOrderId: params.id,
    });
    response.json({ source: "mysql", order });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: "Gagal mengirim hasil pekerjaan" });
  }
});

ordersRouter.post(
  "/:id/delivery/respond",
  requireUser,
  async (request, response) => {
    const params = parseParams(idParamsSchema, request, response);
    const body = parseBody(deliveryResponseBodySchema, request, response);
    const user = response.locals.user as UserTokenPayload;
    if (!params || !body) return;

    try {
      const updated = await respondToOrderDelivery(
        params.id,
        user.userId,
        body,
      );
      if (!updated) {
        response.status(409).json({
          message:
            "Hasil sudah direspons, belum siap direview, atau source code final belum tersedia.",
        });
        return;
      }
      const order = await findOrderByIdForUser(params.id, user.userId);
      await createNotification({
        userId: null,
        title:
          body.decision === "approved"
            ? "Hasil disetujui pelanggan"
            : "Pelanggan meminta revisi",
        message:
          body.decision === "approved"
            ? order?.status === "completed"
              ? `Order #${params.id} disetujui, sudah lunas, dan masuk tahap selesai.`
              : `Order #${params.id} disetujui dan masuk tahap pelunasan.`
            : `Order #${params.id} memiliki catatan revisi baru.`,
        type: "order",
        relatedOrderId: params.id,
      });
      response.json({ source: "mysql", order });
    } catch (error) {
      Sentry.captureException(error);
      response.status(500).json({ message: "Gagal menyimpan respons hasil" });
    }
  },
);

ordersRouter.post(
  "/:id/quote/respond",
  requireUser,
  async (request, response) => {
    const params = parseParams(idParamsSchema, request, response);
    const body = parseBody(quoteResponseBodySchema, request, response);
    const user = response.locals.user as UserTokenPayload;
    if (!params || !body) return;

    try {
      const order = await respondToOrderQuote(
        params.id,
        user.userId,
        body.decision,
      );
      if (!order) {
        response.status(409).json({
          message: "Penawaran sudah direspons atau tidak lagi tersedia.",
        });
        return;
      }

      if (body.decision === "rejected") {
        await releaseCouponReservation(order.id);
      }

      await createNotification({
        userId: order.userId,
        title:
          body.decision === "accepted"
            ? "Penawaran disetujui"
            : "Penawaran ditolak",
        message:
          body.decision === "accepted"
            ? `Penawaran ${order.templateTitle} disetujui. Checkout sekarang tersedia.`
            : `Penawaran ${order.templateTitle} ditolak. Tim NAKI Code akan meninjau kembali.`,
        type: "order",
        relatedOrderId: order.id,
      });
      response.json({ source: "mysql", order });
    } catch (error) {
      Sentry.captureException(error);
      response.status(500).json({ message: "Gagal merespons penawaran" });
    }
  },
);

ordersRouter.post(
  "/:id/payment/confirm-lynk",
  requireAdmin,
  async (request, response) => {
    const params = parseParams(idParamsSchema, request, response);
    const admin = response.locals.admin as UserTokenPayload | null | undefined;
    if (!params) return;

    try {
      const order = await confirmOrderPaymentAsAdmin(params.id);
      if (!order) {
        response.status(409).json({
          message:
            "Hanya transaksi Lynk yang sedang menunggu yang dapat dikonfirmasi.",
        });
        return;
      }

      await Promise.all([
        ensureOrderInvoice(order.id),
        recordPaidOrderTransaction(order.id, order.paymentReference),
        redeemCouponReservation(order.id),
      ]);
      await createAdminAuditLog({
        admin,
        action: "order.lynk_payment_confirm",
        entityType: "order",
        entityId: order.id,
        metadata: { paymentReference: order.paymentReference },
      });
      await createNotification({
        userId: order.userId,
        title:
          order.paymentStatus === "partial_paid"
            ? "DP Lynk dikonfirmasi"
            : "Pembayaran Lynk dikonfirmasi",
        message:
          order.paymentStatus === "partial_paid"
            ? `DP untuk ${order.templateTitle} sudah dikonfirmasi admin. Pelunasan kini tersedia.`
            : `Pembayaran untuk ${order.templateTitle} sudah dikonfirmasi admin.`,
        type: "payment",
        relatedOrderId: order.id,
      });
      response.json({ source: "mysql", order });
    } catch (error) {
      Sentry.captureException(error);
      response
        .status(500)
        .json({ message: "Gagal mengonfirmasi pembayaran Lynk" });
    }
  },
);

ordersRouter.patch("/:id/quote", requireAdmin, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const body = parseBody(quoteBodySchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;
  if (!params || !body) return;
  try {
    await withOrderPaymentLock(params.id, async () => {
      const previousOrder = await findOrderById(params.id);
      if (!previousOrder) {
        response.status(404).json({ message: "Order not found" });
        return;
      }
      if (previousOrder.orderType !== "custom_project") {
        response.status(409).json({
          message:
            "Pembelian source code memakai harga katalog dan pembayaran penuh.",
        });
        return;
      }
      const depositPercent = 50;
      if (
        !(await setOrderQuote(
          params.id,
          body.amount,
          body.notes,
          depositPercent,
        ))
      ) {
        response.status(409).json({
          message:
            "Penawaran hanya dapat diubah saat tidak ada pembayaran aktif atau lunas.",
        });
        return;
      }
      await releaseCouponReservation(params.id);
      const order = await findOrderById(params.id);
      await createAdminAuditLog({
        admin,
        action: "order.quote_update",
        entityType: "order",
        entityId: params.id,
        metadata: {
          amount: body.amount,
          depositPercent,
        },
      });
      await createNotification({
        userId: order?.userId ?? previousOrder.userId,
        title: "Penawaran harga tersedia",
        message: `Penawaran untuk ${previousOrder.templateTitle} sebesar Rp${body.amount.toLocaleString("id-ID")} tersedia. Kamu dapat memilih DP 50% atau langsung lunas.`,
        type: "order",
        relatedOrderId: params.id,
      });
      response.json({ source: "mysql", order });
    });
  } catch (error) {
    if (error instanceof OrderPaymentBusyError) {
      response.status(409).json({ message: error.message });
      return;
    }
    Sentry.captureException(error);
    response.status(500).json({ message: "Gagal menyimpan penawaran" });
  }
});

ordersRouter.patch("/bulk/status", requireAdmin, async (request, response) => {
  const body = parseBody(bulkStatusBodySchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;
  if (!body) return;
  try {
    const ids = [...new Set(body.ids)];
    let updated = 0;
    const skipped: number[] = [];

    for (const id of ids) {
      const order = await findOrderById(id);
      if (
        !order ||
        (order.orderType === "custom_project" &&
          ["delivered", "awaiting_balance", "completed"].includes(
            body.status,
          )) ||
        !canTransitionOrderStatus(
          order.status,
          body.status as OrderWorkflowStatus,
          order.paymentStatus,
        )
      ) {
        skipped.push(id);
        continue;
      }

      if (await updateOrderStatus(id, body.status)) {
        updated += 1;
        if (body.status === "cancelled") {
          await releaseCouponReservation(id);
        }
        if (order.userId) {
          await createNotification({
            userId: order.userId,
            title: "Status pesanan diperbarui",
            message: `Pesanan ${order.templateTitle} sekarang berstatus ${body.status}.`,
            type: "order",
            relatedOrderId: id,
          });
        }
      }
    }
    await createAdminAuditLog({
      admin,
      action: "order.bulk_status_update",
      entityType: "order",
      entityId: null,
      metadata: { ids, status: body.status, updated, skipped },
    });
    response.json({ source: "mysql", updated, skipped });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: "Gagal memperbarui status order" });
  }
});

ordersRouter.patch("/:id/status", requireAdmin, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const body = parseBody(orderStatusBodySchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!params || !body) {
    return;
  }

  try {
    const previousOrder = await findOrderById(params.id);
    if (!previousOrder) {
      response.status(404).json({ message: "Order not found" });
      return;
    }
    if (
      (previousOrder.orderType === "custom_project" &&
        ["delivered", "awaiting_balance", "completed"].includes(
          body.status,
        )) ||
      !canTransitionOrderStatus(
        previousOrder.status,
        body.status as OrderWorkflowStatus,
        previousOrder.paymentStatus,
      )
    ) {
      response.status(409).json({
        message:
          body.status === "delivered"
            ? "Kirim hasil melalui aksi Kirim hasil review."
            : `Transisi status ${previousOrder.status} ke ${body.status} tidak diizinkan.`,
      });
      return;
    }
    const wasUpdated = await updateOrderStatus(params.id, body.status);

    if (!wasUpdated) {
      response.status(404).json({ message: "Order not found" });
      return;
    }

    if (body.status === "cancelled") {
      await releaseCouponReservation(params.id);
    }

    const order = await findOrderById(params.id);

    await createAdminAuditLog({
      admin,
      action: "order.status_update",
      entityType: "order",
      entityId: params.id,
      metadata: {
        from: previousOrder?.status ?? null,
        to: body.status,
      },
    });

    await createNotification({
      userId: order?.userId ?? previousOrder?.userId ?? null,
      title: "Status pesanan diperbarui",
      message: `Pesanan ${order?.templateTitle ?? previousOrder?.templateTitle ?? `#${params.id}`} sekarang berstatus ${body.status}.`,
      type: "order",
      relatedOrderId: params.id,
    });

    response.json({
      source: "mysql",
      order: {
        id: params.id,
        status: body.status,
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: "Gagal mengubah status order" });
  }
});

ordersRouter.delete("/:id", requireAdmin, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const admin = response.locals.admin as UserTokenPayload | null | undefined;

  if (!params) {
    return;
  }

  try {
    const order = await findOrderById(params.id);
    if (
      order &&
      ["paid", "partial_refunded", "refunded"].includes(order.paymentStatus)
    ) {
      response.status(409).json({
        message: "Order yang sudah memiliki transaksi tidak dapat dihapus",
      });
      return;
    }
    const wasDeleted = await deleteOrder(params.id);

    if (!wasDeleted) {
      response.status(404).json({ message: "Order not found" });
      return;
    }

    await createAdminAuditLog({
      admin,
      action: "order.soft_delete",
      entityType: "order",
      entityId: params.id,
      metadata: {
        templateTitle: order?.templateTitle ?? null,
        customerName: order?.customerName ?? null,
      },
    });

    response.status(204).send();
  } catch (error) {
    Sentry.captureException(error);
    response.status(500).json({ message: "Gagal menghapus order" });
  }
});

// GET /orders/:id/invoice - Generate and download PDF invoice
ordersRouter.get("/:id/invoice", requireUser, async (request, response) => {
  const params = parseParams(idParamsSchema, request, response);
  const user = response.locals.user as UserTokenPayload | null | undefined;

  if (!params || !user) {
    return;
  }

  try {
    const order = await findOrderByIdForUser(params.id, user.userId);

    if (!order) {
      response.status(404).json({ message: "Order tidak ditemukan" });
      return;
    }

    // Only generate invoice for paid orders.
    // Paid state lives in payment_status; `status` is the fulfilment enum
    // (new|contacted|deal|closed) and is never 'paid'.
    if (
      !["paid", "partial_refunded", "refunded"].includes(order.paymentStatus)
    ) {
      response.status(400).json({
        message: "Invoice hanya tersedia untuk pesanan yang sudah dibayar",
      });
      return;
    }

    const invoiceNumber =
      (await ensureOrderInvoice(order.id)) ??
      order.invoiceNumber ??
      `INV/${String(order.id).padStart(6, "0")}`;

    // Import generateInvoicePDF
    const { generateInvoicePDF } = await import("../utils/generateInvoice.js");

    // Set response headers for PDF download
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${String(order.id).padStart(6, "0")}.pdf"`,
    );

    // Generate and stream PDF
    await generateInvoicePDF(response, {
      orderId: order.id,
      invoiceNumber,
      customerName: order.customerName,
      customerContact: order.customerContact,
      templateTitle: order.templateTitle,
      subtotalAmount: order.subtotalAmount ?? order.paymentAmount ?? 0,
      discountAmount: order.discountAmount,
      totalAmount: order.paymentAmount ?? order.quoteAmount ?? 0,
      currency: order.currency,
      projectType: order.projectType,
      status: order.status,
      createdAt: order.createdAt,
      paymentDate: order.paidAt ?? undefined,
      paymentMethod: order.paymentMethod || "Transfer Bank",
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    response.status(500).json({ message: "Gagal membuat invoice" });
  }
});
