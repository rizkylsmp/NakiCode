import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';

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
  status: string;
  payment_status?: string;
  payment_method?: string | null;
  payment_reference?: string | null;
  payment_url?: string | null;
  payment_amount?: number | null;
  subtotal_amount?: number | null;
  discount_amount?: number;
  gateway_fee_amount?: number;
  net_amount?: number | null;
  currency?: string;
  quote_amount?: number | null;
  quote_notes?: string | null;
  quote_sent_at?: string | null;
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
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentUrl: string | null;
  paymentAmount: number | null;
  subtotalAmount: number | null;
  discountAmount: number;
  gatewayFeeAmount: number;
  netAmount: number | null;
  currency: string;
  quoteAmount: number | null;
  quoteNotes: string | null;
  quoteSentAt: string | null;
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
  deliveryStatus: 'locked' | 'available';
  sourceCodeItems: string[];
  setupGuide: string | null;
  demoUrl: string | null;
  createdAt: string;
};

export type OrderPayload = Omit<OrderItem, 'id' | 'createdAt'>;

export type OrdersPageResult = {
  orders: OrderItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminOrderStatusFilter = 'new' | 'contacted' | 'quotation' | 'awaiting_dp' | 'in_progress' | 'revision' | 'delivered' | 'completed' | 'cancelled' | 'deal' | 'closed';
export type AdminPaymentStatusFilter = 'pending' | 'waiting_payment' | 'partial_paid' | 'paid' | 'failed' | 'expired' | 'partial_refunded' | 'refunded' | 'cancelled';
export type UserOrderPaymentFilter = 'paid' | 'waiting_payment' | 'unpaid';

export const allowedOrderStatuses = new Set(['new', 'contacted', 'quotation', 'awaiting_dp', 'in_progress', 'revision', 'delivered', 'completed', 'cancelled', 'deal', 'closed']);
export const successfulPaymentStatuses = new Set(['paid', 'partial_refunded']);

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
  orders.status,
  orders.payment_status,
  orders.payment_method,
  orders.payment_reference,
  orders.payment_url,
  orders.payment_amount,
  orders.subtotal_amount,
  orders.discount_amount,
  orders.gateway_fee_amount,
  orders.net_amount,
  orders.currency,
  orders.quote_amount,
  orders.quote_notes,
  orders.quote_sent_at,
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
  const conditions = ['orders.deleted_at IS NULL'];
  const params: Array<number | string> = [];

  if (filters.status) {
    conditions.push('orders.status = ?');
    params.push(filters.status);
  }

  if (filters.paymentStatus) {
    conditions.push('orders.payment_status = ?');
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
    whereClause: `WHERE ${conditions.join(' AND ')}`,
    params,
  });
}

export async function findOrdersPageByUser(
  userId: number,
  page = 1,
  pageSize = 10,
  paymentFilter?: UserOrderPaymentFilter,
) {
  const filters = ['orders.user_id = ?', 'orders.deleted_at IS NULL'];
  const params: Array<number | string> = [userId];

  if (paymentFilter === 'paid') {
    filters.push('orders.payment_status = ?');
    params.push('paid');
  }

  if (paymentFilter === 'waiting_payment') {
    filters.push('orders.payment_status = ?');
    params.push('waiting_payment');
  }

  if (paymentFilter === 'unpaid') {
    filters.push(
      "(orders.payment_status IS NULL OR orders.payment_status IN ('pending', 'failed'))",
    );
  }

  return findOrdersPageInternal({
    page,
    pageSize,
    whereClause: `WHERE ${filters.join(' AND ')}`,
    params,
  });
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
      paid_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ],
  );

  return {
    id: result.insertId,
    ...payload,
    templatePrice: null,
    templateLynkUrl: null,
    deliveryStatus: 'locked' as const,
    sourceCodeItems: [],
    setupGuide: null,
    demoUrl: null,
    createdAt: new Date().toISOString(),
  };
}

export async function updateOrderStatus(id: number, status: string) {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE orders SET status = ? WHERE id = ? AND deleted_at IS NULL',
    [status, id],
  );

  return result.affectedRows > 0;
}

export async function updateOrdersStatus(ids: number[], status: string) {
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => '?').join(', ');
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE orders SET status = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
    [status, ...ids],
  );
  return result.affectedRows;
}

export async function setOrderQuote(id: number, amount: number, notes: string | null) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE orders SET quote_amount = ?, quote_notes = ?, quote_sent_at = CURRENT_TIMESTAMP,
      subtotal_amount = ?, discount_amount = 0, payment_amount = ?, net_amount = ?,
      status = CASE WHEN status IN ('new', 'contacted') THEN 'quotation' ELSE status END
     WHERE id = ? AND payment_status NOT IN ('paid', 'partial_refunded', 'refunded') AND deleted_at IS NULL`,
    [amount, notes, amount, amount, amount, id],
  );
  return result.affectedRows > 0;
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
  const [rows] = await pool.query<OrderRow[]>(
    `${orderSelect}
    WHERE orders.payment_reference = ? AND orders.deleted_at IS NULL
    LIMIT 1`,
    [paymentReference],
  );

  return rows[0] ? normalizeOrderRow(rows[0]) : null;
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
    method: string;
    reference: string;
    url: string;
    amount: number;
    subtotalAmount: number;
    discountAmount: number;
    gatewayFeeAmount?: number;
  },
) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE orders
    SET payment_status = ?,
      payment_method = ?,
      payment_reference = ?,
      payment_url = ?,
      payment_amount = ?,
      subtotal_amount = ?,
      discount_amount = ?,
      gateway_fee_amount = ?,
      net_amount = ?,
      payment_failure_code = NULL,
      payment_failure_reason = NULL,
      payment_last_webhook_status = NULL,
      payment_last_webhook_at = NULL
    WHERE id = ? AND user_id = ? AND payment_status NOT IN (?, ?, ?) AND deleted_at IS NULL`,
    [
      'waiting_payment',
      payment.method,
      payment.reference,
      payment.url,
      payment.amount,
      payment.subtotalAmount,
      payment.discountAmount,
      payment.gatewayFeeAmount ?? 0,
      payment.amount - (payment.gatewayFeeAmount ?? 0),
      id,
      userId,
      'paid',
      'partial_refunded',
      'refunded',
    ],
  );

  if (result.affectedRows === 0) {
    return findOrderByIdForUser(id, userId);
  }

  return findOrderByIdForUser(id, userId);
}

export async function confirmOrderPayment(id: number, userId: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE orders
    SET payment_status = ?,
      paid_at = CURRENT_TIMESTAMP,
      settlement_at = CURRENT_TIMESTAMP,
      status = CASE WHEN status IN ('new', 'contacted', 'quotation', 'awaiting_dp') THEN 'in_progress' ELSE status END
    WHERE id = ? AND user_id = ? AND payment_status NOT IN (?, ?, ?) AND deleted_at IS NULL`,
    ['paid', id, userId, 'paid', 'partial_refunded', 'refunded'],
  );

  if (result.affectedRows === 0) {
    return findOrderByIdForUser(id, userId);
  }

  return findOrderByIdForUser(id, userId);
}

export async function markOrderPaidByPaymentReference(paymentReference: string) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE orders
    SET payment_status = ?,
      payment_failure_code = NULL,
      payment_failure_reason = NULL,
      payment_last_webhook_status = ?,
      payment_last_webhook_at = CURRENT_TIMESTAMP,
      paid_at = CURRENT_TIMESTAMP,
      settlement_at = CURRENT_TIMESTAMP,
      status = CASE WHEN status IN ('new', 'contacted', 'quotation', 'awaiting_dp') THEN 'in_progress' ELSE status END
    WHERE payment_reference = ? AND payment_status NOT IN (?, ?, ?) AND deleted_at IS NULL`,
    ['paid', 'paid', paymentReference, 'paid', 'partial_refunded', 'refunded'],
  );

  return result.affectedRows > 0;
}

export async function markOrderPaymentFailedByReference(
  paymentReference: string,
  failure: {
    code?: string | null;
    reason?: string | null;
    transactionStatus?: string | null;
  } = {},
) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE orders
    SET payment_status = ?,
      payment_failure_code = ?,
      payment_failure_reason = ?,
      payment_last_webhook_status = ?,
      payment_last_webhook_at = CURRENT_TIMESTAMP
    WHERE payment_reference = ? AND payment_status NOT IN (?, ?, ?) AND deleted_at IS NULL`,
    [
      'failed',
      failure.code ?? null,
      failure.reason ?? null,
      failure.transactionStatus ?? 'failed',
      paymentReference,
      'paid',
      'partial_refunded',
      'refunded',
    ],
  );

  return result.affectedRows > 0;
}

export async function recordOrderPaymentWebhookStatus(
  paymentReference: string,
  transactionStatus: string,
) {
  await pool.query(
    `UPDATE orders
    SET payment_last_webhook_status = ?,
      payment_last_webhook_at = CURRENT_TIMESTAMP
    WHERE payment_reference = ? AND deleted_at IS NULL`,
    [transactionStatus, paymentReference],
  );
}

export async function hasSuccessfulTemplateOrder(userId: number, templateId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id
    FROM orders
    WHERE user_id = ?
      AND design_id = ?
      AND payment_status IN ('paid', 'partial_refunded')
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

  return rows[0] ? normalizeOrderRow(rows[0]) : null;
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
    templateSlug: String(body.templateSlug ?? '').trim(),
    templateTitle: String(body.templateTitle ?? '').trim(),
    customerName: String(body.customerName ?? '').trim(),
    customerContact: String(body.customerContact ?? '').trim(),
    projectType: String(body.projectType ?? 'Konsultasi custom').trim(),
    budgetRange: String(body.budgetRange ?? 'Belum ditentukan').trim(),
    message: String(body.message ?? '').trim(),
    status: 'new',
    paymentStatus: 'pending',
    paymentMethod: null,
    paymentReference: null,
    paymentUrl: null,
    paymentAmount: null,
    subtotalAmount: null,
    discountAmount: 0,
    gatewayFeeAmount: 0,
    netAmount: null,
    currency: 'IDR',
    quoteAmount: null,
    quoteNotes: null,
    quoteSentAt: null,
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
    deliveryStatus: 'locked',
    sourceCodeItems: [],
    setupGuide: null,
    demoUrl: null,
  };
}

function normalizeOrderRow(row: OrderRow): OrderItem {
  const isPaid = row.payment_status === 'paid' || row.payment_status === 'partial_refunded';
  const sourceCodeItems = isPaid ? parseStringArray(row.included_files ?? []) : [];
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
    status: row.status,
    paymentStatus: row.payment_status ?? 'pending',
    paymentMethod: row.payment_method ?? null,
    paymentReference: row.payment_reference ?? null,
    paymentUrl: row.payment_url ?? null,
    paymentAmount: row.payment_amount ?? null,
    subtotalAmount: row.subtotal_amount ?? null,
    discountAmount: Number(row.discount_amount ?? 0),
    gatewayFeeAmount: Number(row.gateway_fee_amount ?? 0),
    netAmount: row.net_amount ?? null,
    currency: row.currency ?? 'IDR',
    quoteAmount: row.quote_amount ?? null,
    quoteNotes: row.quote_notes ?? null,
    quoteSentAt: row.quote_sent_at ?? null,
    invoiceNumber: row.invoice_number ?? null,
    invoiceIssuedAt: row.invoice_issued_at ?? null,
    paymentFailureCode: row.payment_failure_code ?? null,
    paymentFailureReason: row.payment_failure_reason ?? null,
    paymentLastWebhookStatus: row.payment_last_webhook_status ?? null,
    paymentLastWebhookAt: row.payment_last_webhook_at ?? null,
    paidAt: row.paid_at ?? null,
    settlementAt: row.settlement_at ?? null,
    refundedAt: row.refunded_at ?? null,
    cancelledAt: row.cancelled_at ?? null,
    templatePrice: row.template_price ?? null,
    templateLynkUrl: row.template_lynk_url ?? null,
    deliveryStatus: isPaid ? 'available' : 'locked',
    sourceCodeItems,
    setupGuide: isPaid && guideParts.length > 0 ? guideParts.join('\n\n') : null,
    demoUrl: isPaid ? row.demo_url ?? null : null,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
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
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
