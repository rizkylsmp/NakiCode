import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";

type OrderRow = RowDataPacket & {
  id: number;
  user_id?: number | null;
  design_id?: number | null;
  design_slug: string;
  design_title: string;
  customer_name: string;
  customer_contact: string;
  project_type: string;
  budget_range: string;
  message: string;
  order_type?: string;
  status: string;
  payment_status?: string;
  payment_method?: string | null;
  payment_reference?: string | null;
  payment_url?: string | null;
  payment_expires_at?: string | Date | null;
  payment_amount?: number | null;
  subtotal_amount?: number | null;
  discount_amount?: number;
  gateway_fee_amount?: number;
  net_amount?: number | null;
  currency?: string;
  quote_amount?: number | null;
  quote_notes?: string | null;
  quote_sent_at?: string | null;
  quote_status?: string | null;
  quote_responded_at?: string | null;
  deposit_percent?: number;
  amount_paid?: number;
  payment_stage?: string;
  delivery_demo_url?: string | null;
  delivery_source_url?: string | null;
  delivery_notes?: string | null;
  delivery_review_status?: string | null;
  delivery_submitted_at?: string | null;
  delivery_reviewed_at?: string | null;
  revision_notes?: string | null;
  revision_files?: string | string[] | null;
  invoice_number?: string | null;
  invoice_issued_at?: string | null;
  payment_failure_code?: string | null;
  payment_failure_reason?: string | null;
  payment_last_webhook_status?: string | null;
  payment_last_webhook_at?: string | null;
  paid_at?: string | null;
  settlement_at?: string | null;
  refunded_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  template_price?: string | null;
  template_lynk_url?: string | null;
  source_available?: number | boolean | null;
  included_files?: string | string[] | null;
  license?: string | null;
  support?: string | null;
  demo_url?: string | null;
};

export type OrderItem = {
  id: number;
  userId: number | null;
  templateId: number | null;
  templateSlug: string;
  templateTitle: string;
  customerName: string;
  customerContact: string;
  projectType: string;
  budgetRange: string;
  message: string;
  orderType: "source_purchase" | "custom_project";
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentUrl: string | null;
  paymentExpiresAt: string | null;
  paymentAmount: number | null;
  subtotalAmount: number | null;
  discountAmount: number;
  gatewayFeeAmount: number;
  netAmount: number | null;
  currency: string;
  quoteAmount: number | null;
  quoteNotes: string | null;
  quoteSentAt: string | null;
  quoteStatus: "pending" | "accepted" | "rejected" | null;
  quoteRespondedAt: string | null;
  depositPercent: number;
  amountPaid: number;
  paymentStage: "full" | "deposit" | "balance" | "complete" | "legacy_full";
  deliveryDemoUrl: string | null;
  deliverySourceUrl: string | null;
  finalSourceReady: boolean;
  deliveryNotes: string | null;
  deliveryReviewStatus: "pending" | "approved" | "revision_requested" | null;
  deliverySubmittedAt: string | null;
  deliveryReviewedAt: string | null;
  revisionNotes: string | null;
  revisionFiles: string[];
  remainingAmount: number;
  invoiceNumber: string | null;
  invoiceIssuedAt: string | null;
  paymentFailureCode: string | null;
  paymentFailureReason: string | null;
  paymentLastWebhookStatus: string | null;
  paymentLastWebhookAt: string | null;
  paidAt: string | null;
  settlementAt: string | null;
  refundedAt: string | null;
  cancelledAt: string | null;
  templatePrice: string | null;
  templateLynkUrl: string | null;
  sourceAvailable: boolean;
  deliveryStatus: "locked" | "available";
  sourceCodeItems: string[];
  setupGuide: string | null;
  demoUrl: string | null;
  createdAt: string;
};

export class OrderPaymentBusyError extends Error {
  constructor() {
    super("Order sedang menyiapkan pembayaran lain. Coba beberapa saat lagi.");
    this.name = "OrderPaymentBusyError";
  }
}

export async function withOrderPaymentLock<T>(
  orderId: number,
  operation: () => Promise<T>,
) {
  const connection = await pool.getConnection();
  const lockName = `naki-order-payment-${orderId}`;
  try {
    const [rows] = await connection.query<
      Array<RowDataPacket & { acquired: number | null }>
    >("SELECT GET_LOCK(?, 5) AS acquired", [lockName]);
    if (Number(rows[0]?.acquired) !== 1) {
      throw new OrderPaymentBusyError();
    }
    return await operation();
  } finally {
    try {
      await connection.query("SELECT RELEASE_LOCK(?)", [lockName]);
    } finally {
      connection.release();
    }
  }
}

export type OrderPayload = Omit<OrderItem, "id" | "createdAt">;

export type OrdersPageResult = {
  orders: OrderItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminOrderStatusFilter =
  | "new"
  | "contacted"
  | "quotation"
  | "awaiting_dp"
  | "awaiting_balance"
  | "in_progress"
  | "revision"
  | "delivered"
  | "completed"
  | "cancelled"
  | "deal"
  | "closed";
export type AdminPaymentStatusFilter =
  | "pending"
  | "waiting_payment"
  | "partial_paid"
  | "paid"
  | "failed"
  | "expired"
  | "partial_refunded"
  | "refunded"
  | "cancelled";
export type UserOrderPaymentFilter =
  | "paid"
  | "waiting_payment"
  | "unpaid"
  | "cancelled"
  | "work"
  | "review"
  | "balance"
  | "completed";

export const allowedOrderStatuses = new Set([
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
]);
export const successfulPaymentStatuses = new Set(["paid", "partial_refunded"]);

const orderSelect = `SELECT
  orders.id,
  orders.user_id,
  orders.design_id,
  orders.design_slug,
  orders.design_title,
  orders.customer_name,
  orders.customer_contact,
  orders.project_type,
  orders.budget_range,
  orders.message,
  orders.order_type,
  orders.status,
  orders.payment_status,
  orders.payment_method,
  orders.payment_reference,
  orders.payment_url,
  orders.payment_expires_at,
  orders.payment_amount,
  orders.subtotal_amount,
  orders.discount_amount,
  orders.gateway_fee_amount,
  orders.net_amount,
  orders.currency,
  orders.quote_amount,
  orders.quote_notes,
  orders.quote_sent_at,
  orders.quote_status,
  orders.quote_responded_at,
  orders.deposit_percent,
  orders.amount_paid,
  orders.payment_stage,
  orders.delivery_demo_url,
  orders.delivery_source_url,
  orders.delivery_notes,
  orders.delivery_review_status,
  orders.delivery_submitted_at,
  orders.delivery_reviewed_at,
  orders.revision_notes,
  orders.revision_files,
  orders.invoice_number,
  orders.invoice_issued_at,
  orders.payment_failure_code,
  orders.payment_failure_reason,
  orders.payment_last_webhook_status,
  orders.payment_last_webhook_at,
  orders.paid_at,
  orders.settlement_at,
  orders.refunded_at,
  orders.cancelled_at,
  orders.created_at,
  designs.price AS template_price,
  designs.lynk_url AS template_lynk_url,
  designs.source_available,
  designs.included_files,
  designs.license,
  designs.support,
  designs.demo_url
FROM orders
LEFT JOIN designs ON designs.id = orders.design_id`;

export async function findOrdersPage(
  page = 1,
  pageSize = 10,
  filters: {
    status?: AdminOrderStatusFilter;
    paymentStatus?: AdminPaymentStatusFilter;
    search?: string;
  } = {},
) {
  await reconcileExpiredPaymentDeadlines();
  const conditions = ["orders.deleted_at IS NULL"];
  const params: Array<number | string> = [];

  if (filters.status) {
    conditions.push("orders.status = ?");
    params.push(filters.status);
  }

  if (filters.paymentStatus) {
    conditions.push("orders.payment_status = ?");
    params.push(filters.paymentStatus);
  }

  if (filters.search) {
    conditions.push(`(CAST(orders.id AS CHAR) LIKE ? OR orders.customer_name LIKE ? OR
      orders.customer_contact LIKE ? OR orders.design_title LIKE ? OR orders.project_type LIKE ?)`);
    const term = `%${filters.search}%`;
    params.push(term, term, term, term, term);
  }

  return findOrdersPageInternal({
    page,
    pageSize,
    whereClause: `WHERE ${conditions.join(" AND ")}`,
    params,
  });
}

export async function findOrdersPageByUser(
  userId: number,
  page = 1,
  pageSize = 10,
  paymentFilter?: UserOrderPaymentFilter,
) {
  await reconcileExpiredPaymentDeadlines(userId);
  const filters = ["orders.user_id = ?", "orders.deleted_at IS NULL"];
  const params: Array<number | string> = [userId];

  if (paymentFilter === "paid") {
    filters.push("orders.payment_status = ?");
    params.push("paid");
  }

  if (paymentFilter === "waiting_payment") {
    filters.push("orders.payment_status = ?");
    params.push("waiting_payment");
  }

  if (paymentFilter === "unpaid") {
    filters.push(
      "orders.status <> 'cancelled' AND (orders.payment_status IS NULL OR orders.payment_status IN ('pending', 'failed', 'expired', 'partial_paid'))",
    );
  }

  if (paymentFilter === "cancelled") {
    filters.push(
      "(orders.payment_status = 'cancelled' OR orders.status = 'cancelled')",
    );
  }

  if (paymentFilter === "work") {
    filters.push(
      "orders.order_type = 'custom_project' AND orders.status IN ('in_progress', 'revision')",
    );
  }

  if (paymentFilter === "review") {
    filters.push(
      "orders.order_type = 'custom_project' AND orders.status = 'delivered' AND orders.delivery_review_status = 'pending'",
    );
  }

  if (paymentFilter === "balance") {
    filters.push(
      "orders.order_type = 'custom_project' AND orders.status = 'awaiting_balance'",
    );
  }

  if (paymentFilter === "completed") {
    filters.push("orders.status = 'completed'");
  }

  const result = await findOrdersPageInternal({
    page,
    pageSize,
    whereClause: `WHERE ${filters.join(" AND ")}`,
    params,
  });

  return {
    ...result,
    orders: result.orders.map(redactLockedFinalSource),
  };
}

async function reconcileExpiredPaymentDeadlines(userId?: number) {
  const userFilter = userId ? "AND order_rows.user_id = ?" : "";
  await pool.query(
    `UPDATE orders AS order_rows
     INNER JOIN order_payment_sessions AS sessions
       ON sessions.reference = order_rows.payment_reference
     SET order_rows.payment_status = 'expired',
       order_rows.payment_url = NULL,
       order_rows.payment_failure_reason = COALESCE(order_rows.payment_failure_reason, 'Waktu pembayaran kedaluwarsa'),
       sessions.status = 'expired',
       sessions.failure_reason = COALESCE(sessions.failure_reason, 'Waktu pembayaran kedaluwarsa')
     WHERE order_rows.payment_status = 'waiting_payment'
       AND order_rows.payment_expires_at IS NOT NULL
       AND order_rows.payment_expires_at <= CURRENT_TIMESTAMP
       AND sessions.status = 'waiting_payment'
       ${userFilter}`,
    userId ? [userId] : [],
  );
}

export async function createOrder(payload: OrderPayload) {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO orders (
      user_id,
      design_id,
      design_slug,
      design_title,
      customer_name,
      customer_contact,
      project_type,
      budget_range,
      message,
      order_type,
      status,
      payment_status,
      payment_method,
      payment_reference,
      payment_url,
      payment_amount,
      payment_failure_code,
      payment_failure_reason,
      payment_last_webhook_status,
      payment_last_webhook_at,
      paid_at,
      deposit_percent,
      amount_paid,
      payment_stage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.userId,
      payload.templateId,
      payload.templateSlug,
      payload.templateTitle,
      payload.customerName,
      payload.customerContact,
      payload.projectType,
      payload.budgetRange,
      payload.message,
      payload.orderType,
      payload.status,
      payload.paymentStatus,
      payload.paymentMethod,
      payload.paymentReference,
      payload.paymentUrl,
      payload.paymentAmount,
      payload.paymentFailureCode,
      payload.paymentFailureReason,
      payload.paymentLastWebhookStatus,
      payload.paymentLastWebhookAt,
      payload.paidAt,
      payload.depositPercent,
      payload.amountPaid,
      payload.paymentStage,
    ],
  );

  return {
    id: result.insertId,
    ...payload,
    templatePrice: null,
    templateLynkUrl: null,
    sourceAvailable: true,
    deliveryStatus: "locked" as const,
    sourceCodeItems: [],
    setupGuide: null,
    demoUrl: null,
    createdAt: new Date().toISOString(),
  };
}

export async function updateOrderStatus(id: number, status: string) {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE orders SET status = ? WHERE id = ? AND deleted_at IS NULL",
    [status, id],
  );

  return result.affectedRows > 0;
}

export async function submitOrderDelivery(
  id: number,
  payload: { demoUrl: string | null; sourceUrl: string; notes: string },
) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE orders SET delivery_demo_url = ?, delivery_source_url = ?,
      delivery_notes = ?, delivery_review_status = 'pending',
      delivery_submitted_at = CURRENT_TIMESTAMP, delivery_reviewed_at = NULL,
      revision_notes = NULL, revision_files = JSON_ARRAY(), status = 'delivered'
     WHERE id = ? AND deleted_at IS NULL AND order_type = 'custom_project'
       AND payment_status IN ('partial_paid', 'paid')
       AND (
         status IN ('in_progress', 'revision')
         OR (status = 'delivered' AND delivery_review_status = 'pending'
           AND delivery_source_url IS NULL)
       )`,
    [payload.demoUrl, payload.sourceUrl, payload.notes, id],
  );
  return result.affectedRows > 0;
}

export async function respondToOrderDelivery(
  id: number,
  userId: number,
  payload:
    | { decision: "approved" }
    | { decision: "revision_requested"; notes: string; files: string[] },
) {
  const approved = payload.decision === "approved";
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE orders SET status = CASE
        WHEN ? = 'revision_requested' THEN 'in_progress'
        WHEN COALESCE(
          (SELECT SUM(payment.amount) FROM order_payment_sessions payment
            WHERE payment.order_id = orders.id AND payment.status = 'paid'),
          amount_paid,
          0
        ) >= COALESCE(quote_amount, payment_amount, 0)
          THEN 'completed'
        ELSE 'awaiting_balance'
      END,
      payment_status = CASE
        WHEN ? = 'approved' AND COALESCE(
          (SELECT SUM(payment.amount) FROM order_payment_sessions payment
            WHERE payment.order_id = orders.id AND payment.status = 'paid'),
          amount_paid,
          0
        ) < COALESCE(quote_amount, payment_amount, 0)
          THEN 'partial_paid'
        ELSE payment_status
      END,
      payment_stage = CASE
        WHEN ? = 'approved' AND COALESCE(
          (SELECT SUM(payment.amount) FROM order_payment_sessions payment
            WHERE payment.order_id = orders.id AND payment.status = 'paid'),
          amount_paid,
          0
        ) < COALESCE(quote_amount, payment_amount, 0)
          THEN 'balance'
        ELSE payment_stage
      END,
      delivery_review_status = ?,
      delivery_reviewed_at = CURRENT_TIMESTAMP, revision_notes = ?,
      revision_files = ?
     WHERE id = ? AND user_id = ? AND deleted_at IS NULL
       AND order_type = 'custom_project'
       AND payment_status IN ('partial_paid', 'paid')
       AND status = 'delivered' AND delivery_review_status = 'pending'
       AND (? = 'revision_requested' OR delivery_source_url IS NOT NULL)`,
    [
      payload.decision,
      payload.decision,
      payload.decision,
      payload.decision,
      approved ? null : payload.notes,
      JSON.stringify(approved ? [] : payload.files),
      id,
      userId,
      payload.decision,
    ],
  );
  return result.affectedRows > 0;
}

export async function setOrderQuote(
  id: number,
  amount: number,
  notes: string | null,
  depositPercent: number,
) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE orders SET quote_amount = ?, quote_notes = ?, quote_sent_at = CURRENT_TIMESTAMP,
      quote_status = 'pending', quote_responded_at = NULL,
      deposit_percent = ?, amount_paid = 0, payment_stage = 'deposit',
      subtotal_amount = ?, discount_amount = 0, payment_amount = ?, net_amount = ?,
      payment_status = 'pending', payment_method = NULL, payment_reference = NULL,
      payment_url = NULL,
      payment_expires_at = NULL,
      status = CASE WHEN status IN ('new', 'contacted') THEN 'quotation' ELSE status END
     WHERE id = ?
       AND payment_status IN ('pending', 'failed', 'expired', 'cancelled')
       AND order_type = 'custom_project'
       AND status NOT IN ('completed', 'closed', 'cancelled')
       AND deleted_at IS NULL`,
    [amount, notes, depositPercent, amount, amount, amount, id],
  );
  return result.affectedRows > 0;
}

export async function respondToOrderQuote(
  id: number,
  userId: number,
  decision: "accepted" | "rejected",
) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE orders
     SET quote_status = ?, quote_responded_at = CURRENT_TIMESTAMP,
       status = CASE WHEN ? = 'accepted' THEN 'awaiting_dp' ELSE 'contacted' END
     WHERE id = ? AND user_id = ?
       AND quote_amount IS NOT NULL
       AND order_type = 'custom_project'
       AND (quote_status = 'pending' OR quote_status IS NULL)
       AND payment_status IN ('pending', 'failed', 'expired', 'cancelled')
       AND deleted_at IS NULL`,
    [decision, decision, id, userId],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findOrderByIdForUser(id, userId);
}

export async function findOrderById(id: number) {
  const [rows] = await pool.query<OrderRow[]>(
    `${orderSelect}
    WHERE orders.id = ? AND orders.deleted_at IS NULL
    LIMIT 1`,
    [id],
  );

  return rows[0] ? normalizeOrderRow(rows[0]) : null;
}

export async function findOrderByPaymentReference(paymentReference: string) {
  const [payments] = await pool.query<
    Array<RowDataPacket & { order_id: number; amount: number }>
  >(
    `SELECT order_id, amount FROM order_payment_sessions
     WHERE reference = ? LIMIT 1`,
    [paymentReference],
  );
  const payment = payments[0];
  if (!payment) return null;
  const order = await findOrderById(payment.order_id);
  return order ? { ...order, paymentAmount: Number(payment.amount) } : null;
}

export async function deleteOrder(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE orders
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );

  return result.affectedRows > 0;
}

export async function startOrderPayment(
  id: number,
  userId: number,
  payment: {
    provider: "midtrans" | "lynk" | "dev";
    stage: "full" | "deposit" | "balance";
    method: string;
    reference: string;
    url: string;
    expiresAt: string | null;
    amount: number;
    subtotalAmount: number;
    discountAmount: number;
    gatewayFeeAmount?: number;
    depositPercent?: number;
  },
) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE order_payment_sessions
       SET status = 'expired', failure_reason = COALESCE(failure_reason, 'Waktu pembayaran kedaluwarsa'),
         last_webhook_status = COALESCE(last_webhook_status, 'expire'),
         last_webhook_at = COALESCE(last_webhook_at, CURRENT_TIMESTAMP)
       WHERE order_id = ? AND status = 'waiting_payment'
         AND expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP`,
      [id],
    );
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE orders
    SET payment_status = ?,
      payment_method = ?,
      payment_reference = ?,
      payment_url = ?,
      payment_expires_at = FROM_UNIXTIME(?),
      payment_amount = ?,
      subtotal_amount = ?,
      discount_amount = ?,
      gateway_fee_amount = ?,
      net_amount = ?,
      payment_failure_code = NULL,
      payment_failure_reason = NULL,
      payment_last_webhook_status = NULL,
      payment_last_webhook_at = NULL,
      payment_stage = ?,
      deposit_percent = COALESCE(?, deposit_percent)
    WHERE id = ? AND user_id = ?
      AND (
        payment_status IN ('pending', 'failed', 'expired', 'cancelled')
        OR (order_type = 'custom_project' AND payment_status = 'partial_paid')
        OR (payment_status = 'waiting_payment' AND payment_expires_at IS NOT NULL
          AND payment_expires_at <= CURRENT_TIMESTAMP)
      )
      AND status NOT IN ('completed', 'closed', 'cancelled')
      AND (
        order_type = 'source_purchase'
        OR (quote_amount IS NOT NULL AND quote_status = 'accepted')
      )
      AND deleted_at IS NULL`,
      [
        "waiting_payment",
        payment.method,
        payment.reference,
        payment.url,
        payment.expiresAt
          ? Math.floor(Date.parse(payment.expiresAt) / 1000)
          : null,
        payment.amount,
        payment.subtotalAmount,
        payment.discountAmount,
        payment.gatewayFeeAmount ?? 0,
        payment.amount - (payment.gatewayFeeAmount ?? 0),
        payment.stage,
        payment.depositPercent ?? null,
        id,
        userId,
      ],
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return findOrderByIdForUser(id, userId);
    }

    await connection.query(
      `INSERT INTO order_payment_sessions (
        order_id, stage, provider, status, method, reference, payment_url, expires_at,
        subtotal_amount, discount_amount, gateway_fee_amount, amount, net_amount
      ) VALUES (?, ?, ?, 'waiting_payment', ?, ?, ?, FROM_UNIXTIME(?), ?, ?, ?, ?, ?)`,
      [
        id,
        payment.stage,
        payment.provider,
        payment.method,
        payment.reference,
        payment.url,
        payment.expiresAt
          ? Math.floor(Date.parse(payment.expiresAt) / 1000)
          : null,
        payment.subtotalAmount,
        payment.discountAmount,
        payment.gatewayFeeAmount ?? 0,
        payment.amount,
        payment.amount - (payment.gatewayFeeAmount ?? 0),
      ],
    );
    await connection.commit();
    return findOrderByIdForUser(id, userId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function confirmOrderPaymentAsAdmin(id: number) {
  const order = await findOrderById(id);
  if (
    !order ||
    order.paymentStatus !== "waiting_payment" ||
    order.paymentMethod?.toLowerCase() !== "lynk" ||
    !order.paymentReference
  ) {
    return null;
  }
  await markOrderPaidByPaymentReference(order.paymentReference);
  return findOrderById(id);
}

export async function confirmOrderPayment(id: number, userId: number) {
  const order = await findOrderByIdForUser(id, userId);
  if (!order?.paymentReference) return order;
  await markOrderPaidByPaymentReference(order.paymentReference);
  return findOrderByIdForUser(id, userId);
}

export async function markOrderPaidByPaymentReference(
  paymentReference: string,
) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<
      Array<
        RowDataPacket & {
          id: number;
          order_id: number;
          stage: string;
          status: string;
          amount: number;
          method: string;
          order_type: string;
          quote_amount: number | null;
        }
      >
    >(
      `SELECT payments.id, payments.order_id, payments.stage, payments.status,
        payments.amount, payments.method, orders.order_type, orders.quote_amount
       FROM order_payment_sessions AS payments
       INNER JOIN orders ON orders.id = payments.order_id
       WHERE payments.reference = ? AND orders.deleted_at IS NULL
       LIMIT 1 FOR UPDATE`,
      [paymentReference],
    );
    const payment = rows[0];
    if (!payment || payment.status === "paid") {
      await connection.rollback();
      return false;
    }

    await connection.query(
      `UPDATE order_payment_sessions SET status = 'paid', paid_at = CURRENT_TIMESTAMP,
        failure_code = NULL, failure_reason = NULL, last_webhook_status = 'paid',
        last_webhook_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [payment.id],
    );
    const [totals] = await connection.query<
      Array<RowDataPacket & { paid_total: number }>
    >(
      `SELECT COALESCE(SUM(amount), 0) AS paid_total
       FROM order_payment_sessions WHERE order_id = ? AND status = 'paid'`,
      [payment.order_id],
    );
    const paidTotal = Number(totals[0]?.paid_total ?? payment.amount);
    const totalAmount = Number(payment.quote_amount ?? payment.amount);
    const isComplete =
      payment.order_type === "source_purchase" || paidTotal >= totalAmount;
    const nextOrderStatus =
      payment.order_type === "source_purchase" || payment.stage === "balance"
        ? "completed"
        : "in_progress";

    await connection.query(
      `UPDATE orders SET
        payment_status = ?, amount_paid = ?, payment_stage = ?,
        payment_method = ?, payment_reference = ?, payment_amount = ?,
        payment_url = NULL, payment_failure_code = NULL,
        payment_failure_reason = NULL, payment_last_webhook_status = 'paid',
        payment_last_webhook_at = CURRENT_TIMESTAMP,
        paid_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE paid_at END,
        settlement_at = CURRENT_TIMESTAMP,
        status = ?
       WHERE id = ?`,
      [
        isComplete ? "paid" : "partial_paid",
        paidTotal,
        isComplete ? "complete" : "balance",
        payment.method,
        paymentReference,
        payment.amount,
        isComplete,
        nextOrderStatus,
        payment.order_id,
      ],
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function markOrderPaymentFailedByReference(
  paymentReference: string,
  failure: {
    code?: string | null;
    reason?: string | null;
    transactionStatus?: string | null;
  } = {},
) {
  const paymentStatus =
    failure.transactionStatus === "expire"
      ? "expired"
      : failure.transactionStatus === "cancel"
        ? "cancelled"
        : "failed";
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE order_payment_sessions
     SET status = ?, failure_code = ?, failure_reason = ?,
       last_webhook_status = ?, last_webhook_at = CURRENT_TIMESTAMP
     WHERE reference = ? AND status = 'waiting_payment'`,
    [
      paymentStatus,
      failure.code ?? null,
      failure.reason ?? null,
      failure.transactionStatus ?? "failed",
      paymentReference,
    ],
  );

  if (result.affectedRows > 0) {
    await pool.query(
      `UPDATE orders SET payment_status = ?,
        payment_failure_code = ?, payment_failure_reason = ?,
        payment_last_webhook_status = ?, payment_last_webhook_at = CURRENT_TIMESTAMP,
        payment_url = NULL
       WHERE payment_reference = ? AND payment_status = 'waiting_payment'
         AND deleted_at IS NULL`,
      [
        paymentStatus,
        failure.code ?? null,
        failure.reason ?? null,
        failure.transactionStatus ?? "failed",
        paymentReference,
      ],
    );
  }

  return result.affectedRows > 0;
}

export async function recordOrderPaymentWebhookStatus(
  paymentReference: string,
  transactionStatus: string,
) {
  await pool.query(
    `UPDATE order_payment_sessions SET last_webhook_status = ?,
      last_webhook_at = CURRENT_TIMESTAMP WHERE reference = ?`,
    [transactionStatus, paymentReference],
  );
  await pool.query(
    `UPDATE orders SET payment_last_webhook_status = ?,
      payment_last_webhook_at = CURRENT_TIMESTAMP
     WHERE payment_reference = ? AND deleted_at IS NULL`,
    [transactionStatus, paymentReference],
  );
}

export async function hasSuccessfulTemplateOrder(
  userId: number,
  templateId: number,
) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id
    FROM orders
    WHERE user_id = ?
      AND design_id = ?
      AND payment_status IN ('paid', 'partial_refunded')
      AND status IN ('completed', 'closed')
      AND deleted_at IS NULL
    LIMIT 1`,
    [userId, templateId],
  );

  return rows.length > 0;
}

export async function findOrderByIdForUser(id: number, userId: number) {
  const [rows] = await pool.query<OrderRow[]>(
    `${orderSelect}
    WHERE orders.id = ? AND orders.user_id = ? AND orders.deleted_at IS NULL
    LIMIT 1`,
    [id, userId],
  );

  return rows[0] ? redactLockedFinalSource(normalizeOrderRow(rows[0])) : null;
}

async function findOrdersPageInternal({
  page,
  pageSize,
  whereClause,
  params,
}: {
  page: number;
  pageSize: number;
  whereClause: string;
  params: Array<number | string>;
}): Promise<OrdersPageResult> {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(50, Math.floor(pageSize)));
  const offset = (safePage - 1) * safePageSize;

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
    FROM orders
    ${whereClause}`,
    params,
  );

  const total = Number(countRows[0]?.total ?? 0);
  const [rows] = await pool.query<OrderRow[]>(
    `${orderSelect}
    ${whereClause}
    ORDER BY orders.id DESC
    LIMIT ? OFFSET ?`,
    [...params, safePageSize, offset],
  );

  return {
    orders: rows.map(normalizeOrderRow),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
  };
}

export function normalizeOrderPayload(
  body: Record<string, unknown>,
  userId: number,
): OrderPayload {
  return {
    userId,
    templateId: Number(body.templateId) || null,
    templateSlug: String(body.templateSlug ?? "").trim(),
    templateTitle: String(body.templateTitle ?? "").trim(),
    customerName: String(body.customerName ?? "").trim(),
    customerContact: String(body.customerContact ?? "").trim(),
    projectType: String(body.projectType ?? "Konsultasi custom").trim(),
    budgetRange: String(body.budgetRange ?? "Belum ditentukan").trim(),
    message: String(body.message ?? "").trim(),
    orderType:
      body.orderType === "source_purchase"
        ? "source_purchase"
        : "custom_project",
    status: "new",
    paymentStatus: "pending",
    paymentMethod: null,
    paymentReference: null,
    paymentUrl: null,
    paymentExpiresAt: null,
    paymentAmount: null,
    subtotalAmount: null,
    discountAmount: 0,
    gatewayFeeAmount: 0,
    netAmount: null,
    currency: "IDR",
    quoteAmount: null,
    quoteNotes: null,
    quoteSentAt: null,
    quoteStatus: null,
    quoteRespondedAt: null,
    depositPercent: 50,
    amountPaid: 0,
    paymentStage: body.orderType === "source_purchase" ? "full" : "deposit",
    deliveryDemoUrl: null,
    deliverySourceUrl: null,
    finalSourceReady: false,
    deliveryNotes: null,
    deliveryReviewStatus: null,
    deliverySubmittedAt: null,
    deliveryReviewedAt: null,
    revisionNotes: null,
    revisionFiles: [],
    remainingAmount: 0,
    invoiceNumber: null,
    invoiceIssuedAt: null,
    paymentFailureCode: null,
    paymentFailureReason: null,
    paymentLastWebhookStatus: null,
    paymentLastWebhookAt: null,
    paidAt: null,
    settlementAt: null,
    refundedAt: null,
    cancelledAt: null,
    templatePrice: null,
    templateLynkUrl: null,
    sourceAvailable: true,
    deliveryStatus: "locked",
    sourceCodeItems: [],
    setupGuide: null,
    demoUrl: null,
  };
}

function normalizeOrderRow(row: OrderRow): OrderItem {
  const orderType =
    row.order_type === "source_purchase" ? "source_purchase" : "custom_project";
  const isPaid =
    row.payment_status === "paid" || row.payment_status === "partial_refunded";
  const paymentExpiresAt = normalizeTimestamp(row.payment_expires_at);
  const isPastDue =
    row.payment_status === "waiting_payment" &&
    paymentExpiresAt !== null &&
    Date.parse(paymentExpiresAt) <= Date.now();
  const sourceCodeItems =
    isPaid && orderType === "source_purchase"
      ? parseStringArray(row.included_files ?? [])
      : [];
  const guideParts = [row.license, row.support].filter(Boolean);

  return {
    id: row.id,
    userId: row.user_id ?? null,
    templateId: row.design_id ?? null,
    templateSlug: row.design_slug,
    templateTitle: row.design_title,
    customerName: row.customer_name,
    customerContact: row.customer_contact,
    projectType: row.project_type,
    budgetRange: row.budget_range,
    message: row.message,
    orderType,
    status: row.status,
    paymentStatus: isPastDue ? "expired" : (row.payment_status ?? "pending"),
    paymentMethod: row.payment_method ?? null,
    paymentReference: row.payment_reference ?? null,
    paymentUrl: isPastDue ? null : (row.payment_url ?? null),
    paymentExpiresAt,
    paymentAmount: row.payment_amount ?? null,
    subtotalAmount: row.subtotal_amount ?? null,
    discountAmount: Number(row.discount_amount ?? 0),
    gatewayFeeAmount: Number(row.gateway_fee_amount ?? 0),
    netAmount: row.net_amount ?? null,
    currency: row.currency ?? "IDR",
    quoteAmount: row.quote_amount ?? null,
    quoteNotes: row.quote_notes ?? null,
    quoteSentAt: row.quote_sent_at ?? null,
    quoteStatus:
      row.quote_status === "pending" ||
      row.quote_status === "accepted" ||
      row.quote_status === "rejected"
        ? row.quote_status
        : null,
    quoteRespondedAt: row.quote_responded_at ?? null,
    depositPercent: Number(row.deposit_percent ?? 50),
    amountPaid: Number(row.amount_paid ?? 0),
    paymentStage: normalizePaymentStage(row.payment_stage, orderType, isPaid),
    deliveryDemoUrl: row.delivery_demo_url ?? null,
    deliverySourceUrl: row.delivery_source_url ?? null,
    finalSourceReady: Boolean(row.delivery_source_url),
    deliveryNotes: row.delivery_notes ?? null,
    deliveryReviewStatus:
      row.delivery_review_status === "pending" ||
      row.delivery_review_status === "approved" ||
      row.delivery_review_status === "revision_requested"
        ? row.delivery_review_status
        : null,
    deliverySubmittedAt: row.delivery_submitted_at ?? null,
    deliveryReviewedAt: row.delivery_reviewed_at ?? null,
    revisionNotes: row.revision_notes ?? null,
    revisionFiles: parseStringArray(row.revision_files ?? []),
    remainingAmount: Math.max(
      0,
      Number(row.quote_amount ?? row.payment_amount ?? 0) -
        Number(row.amount_paid ?? 0),
    ),
    invoiceNumber: row.invoice_number ?? null,
    invoiceIssuedAt: row.invoice_issued_at ?? null,
    paymentFailureCode: row.payment_failure_code ?? null,
    paymentFailureReason: isPastDue
      ? "Waktu pembayaran kedaluwarsa"
      : (row.payment_failure_reason ?? null),
    paymentLastWebhookStatus: row.payment_last_webhook_status ?? null,
    paymentLastWebhookAt: row.payment_last_webhook_at ?? null,
    paidAt: row.paid_at ?? null,
    settlementAt: row.settlement_at ?? null,
    refundedAt: row.refunded_at ?? null,
    cancelledAt: row.cancelled_at ?? null,
    templatePrice: row.template_price ?? null,
    templateLynkUrl: row.template_lynk_url ?? null,
    sourceAvailable: Boolean(row.source_available ?? true),
    deliveryStatus:
      isPaid && orderType === "source_purchase" ? "available" : "locked",
    sourceCodeItems,
    setupGuide:
      isPaid && orderType === "source_purchase" && guideParts.length > 0
        ? guideParts.join("\n\n")
        : null,
    demoUrl:
      isPaid && orderType === "source_purchase" ? (row.demo_url ?? null) : null,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function redactLockedFinalSource(order: OrderItem): OrderItem {
  if (
    order.orderType !== "custom_project" ||
    ["completed", "closed"].includes(order.status)
  ) {
    return order;
  }

  return { ...order, deliverySourceUrl: null };
}

function parseStringArray(value: string | string[]) {
  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function normalizePaymentStage(
  value: string | null | undefined,
  orderType: OrderItem["orderType"],
  isPaid: boolean,
): OrderItem["paymentStage"] {
  if (
    value === "full" ||
    value === "deposit" ||
    value === "balance" ||
    value === "complete" ||
    value === "legacy_full"
  ) {
    return value;
  }
  if (isPaid) return "complete";
  return orderType === "source_purchase" ? "full" : "deposit";
}

function normalizeTimestamp(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
