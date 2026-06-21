import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';

type OrderRow = RowDataPacket & {
  id: number;
  user_id?: number | null;
  template_id?: number | null;
  template_slug: string;
  template_title: string;
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
  paid_at?: string | null;
  created_at?: string;
  template_price?: string | null;
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
  paidAt: string | null;
  templatePrice: string | null;
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

export type UserOrderPaymentFilter = 'paid' | 'waiting_payment' | 'unpaid';

export const allowedOrderStatuses = new Set(['new', 'contacted', 'deal', 'closed']);
export const successfulPaymentStatuses = new Set(['paid']);

const orderSelect = `SELECT
  orders.id,
  orders.user_id,
  orders.template_id,
  orders.template_slug,
  orders.template_title,
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
  orders.paid_at,
  orders.created_at,
  templates.price AS template_price,
  templates.included_files,
  templates.license,
  templates.support,
  templates.demo_url
FROM orders
LEFT JOIN templates ON templates.id = orders.template_id`;

export async function findOrdersPage(page = 1, pageSize = 10) {
  return findOrdersPageInternal({
    page,
    pageSize,
    whereClause: 'WHERE orders.deleted_at IS NULL',
    params: [],
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
      template_id,
      template_slug,
      template_title,
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
      paid_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      payload.paidAt,
    ],
  );

  return {
    id: result.insertId,
    ...payload,
    templatePrice: null,
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
  },
) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE orders
    SET payment_status = ?,
      payment_method = ?,
      payment_reference = ?,
      payment_url = ?,
      payment_amount = ?
    WHERE id = ? AND user_id = ? AND payment_status <> ? AND deleted_at IS NULL`,
    [
      'waiting_payment',
      payment.method,
      payment.reference,
      payment.url,
      payment.amount,
      id,
      userId,
      'paid',
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
      status = CASE WHEN status = 'new' THEN 'deal' ELSE status END
    WHERE id = ? AND user_id = ? AND payment_status <> ? AND deleted_at IS NULL`,
    ['paid', id, userId, 'paid'],
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
      paid_at = CURRENT_TIMESTAMP,
      status = CASE WHEN status = 'new' THEN 'deal' ELSE status END
    WHERE payment_reference = ? AND payment_status <> ? AND deleted_at IS NULL`,
    ['paid', paymentReference, 'paid'],
  );

  return result.affectedRows > 0;
}

export async function markOrderPaymentFailedByReference(paymentReference: string) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE orders
    SET payment_status = ?
    WHERE payment_reference = ? AND payment_status <> ? AND deleted_at IS NULL`,
    ['failed', paymentReference, 'paid'],
  );

  return result.affectedRows > 0;
}

export async function hasSuccessfulTemplateOrder(userId: number, templateId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id
    FROM orders
    WHERE user_id = ?
      AND template_id = ?
      AND payment_status = 'paid'
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
    paidAt: null,
    templatePrice: null,
    deliveryStatus: 'locked',
    sourceCodeItems: [],
    setupGuide: null,
    demoUrl: null,
  };
}

function normalizeOrderRow(row: OrderRow): OrderItem {
  const isPaid = row.payment_status === 'paid';
  const sourceCodeItems = isPaid ? parseStringArray(row.included_files ?? []) : [];
  const guideParts = [row.license, row.support].filter(Boolean);

  return {
    id: row.id,
    userId: row.user_id ?? null,
    templateId: row.template_id ?? null,
    templateSlug: row.template_slug,
    templateTitle: row.template_title,
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
    paidAt: row.paid_at ?? null,
    templatePrice: row.template_price ?? null,
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
