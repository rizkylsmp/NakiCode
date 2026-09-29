import type { RowDataPacket } from "mysql2";
import { pool } from "../db";

export type InvoiceStage = "deposit" | "balance" | "full";
export const invoiceStageLabels: Record<InvoiceStage, string> = {
  deposit: "Down Payment (DP)",
  balance: "Pelunasan",
  full: "Pembayaran penuh",
};

export type InvoiceSnapshot = {
  customerName: string;
  customerContact: string;
  customerEmail: string;
  designTitle: string;
  projectType: string;
  orderTotal: number;
  previousPaid: number;
  paymentReference: string | null;
  paymentMethod: string | null;
  expiresAt: string | null;
};
export type StageInvoice = {
  id: number;
  orderId: number;
  invoiceNumber: string;
  stage: InvoiceStage;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  issuedAt: string;
  paidAt: string | null;
  snapshot: InvoiceSnapshot;
};

function mapInvoice(row: RowDataPacket): StageInvoice {
  return {
    id: Number(row.id),
    orderId: Number(row.order_id),
    invoiceNumber: row.invoice_number,
    stage: row.stage,
    subtotalAmount: Number(row.subtotal_amount),
    discountAmount: Number(row.discount_amount),
    totalAmount: Number(row.total_amount),
    currency: row.currency,
    status: row.status,
    issuedAt: row.issued_at,
    paidAt: row.paid_at ?? null,
    snapshot:
      typeof row.snapshot === "string"
        ? JSON.parse(row.snapshot)
        : row.snapshot,
  };
}

export async function findStageInvoices(orderId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM invoices WHERE order_id = ? AND stage IN ('deposit', 'balance', 'full') ORDER BY id",
    [orderId],
  );
  return rows.map(mapInvoice);
}

export async function findStageInvoice(orderId: number, stage: InvoiceStage) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM invoices WHERE order_id = ? AND stage = ? LIMIT 1",
    [orderId, stage],
  );
  return rows[0] ? mapInvoice(rows[0]) : null;
}

export async function ensurePaymentStageInvoice(
  orderId: number,
  reference: string,
) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT payments.*, orders.design_title, orders.customer_name, orders.customer_contact,
      orders.project_type, orders.currency, orders.order_type, orders.quote_amount,
      users.email AS customer_email,
      (SELECT COALESCE(SUM(prior.amount), 0) FROM order_payment_sessions prior
        WHERE prior.order_id = orders.id AND prior.status = 'paid' AND prior.id < payments.id) AS previous_paid
     FROM order_payment_sessions payments JOIN orders ON orders.id = payments.order_id
     LEFT JOIN users ON users.id = orders.user_id
     WHERE payments.order_id = ? AND payments.reference = ? LIMIT 1`,
    [orderId, reference],
  );
  const row = rows[0];
  if (
    !row ||
    !["deposit", "balance", "full", "legacy_full"].includes(row.stage)
  )
    return null;
  return upsertInvoice(
    orderId,
    row.stage === "legacy_full" ? "full" : row.stage,
    {
      subtotal: Number(row.subtotal_amount),
      discount: Number(row.discount_amount),
      total: Number(row.amount),
      status: row.status,
      paidAt: row.paid_at ?? null,
      issuedAt: row.created_at,
      currency: row.currency ?? "IDR",
      snapshot: {
        customerName: row.customer_name,
        customerContact: row.customer_contact,
        customerEmail: row.customer_email ?? "",
        designTitle: row.design_title,
        projectType: row.project_type,
        orderTotal: Number(
          row.order_type === "custom_project" ? row.quote_amount : row.amount,
        ),
        previousPaid: Number(row.previous_paid),
        paymentReference: row.reference,
        paymentMethod: row.method,
        expiresAt: row.expires_at ?? null,
      },
    },
  );
}

export async function ensureBalanceInvoice(orderId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT orders.*, users.email AS customer_email,
      (SELECT COUNT(*) FROM order_payment_sessions payments
        WHERE payments.order_id = orders.id AND payments.status = 'paid') AS settled_count,
      (SELECT COALESCE(SUM(payments.amount), 0) FROM order_payment_sessions payments
        WHERE payments.order_id = orders.id AND payments.status = 'paid') AS settled_amount
     FROM orders LEFT JOIN users ON users.id = orders.user_id
     WHERE orders.id = ? AND orders.deleted_at IS NULL AND orders.order_type = 'custom_project'
       AND orders.status = 'awaiting_balance' AND orders.delivery_review_status = 'approved' LIMIT 1`,
    [orderId],
  );
  const row = rows[0];
  if (!row) return null;
  const paid =
    Number(row.settled_count) > 0
      ? Number(row.settled_amount)
      : Number(row.amount_paid ?? 0);
  const amount = Number(row.quote_amount) - paid;
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;
  const existing = await findStageInvoice(orderId, "balance");
  if (existing) return existing;
  return upsertInvoice(orderId, "balance", {
    subtotal: amount,
    discount: 0,
    total: amount,
    status: "issued",
    paidAt: null,
    issuedAt: row.delivery_reviewed_at ?? new Date(),
    currency: row.currency ?? "IDR",
    snapshot: {
      customerName: row.customer_name,
      customerContact: row.customer_contact,
      customerEmail: row.customer_email ?? "",
      designTitle: row.design_title,
      projectType: row.project_type,
      orderTotal: Number(row.quote_amount),
      previousPaid: paid,
      paymentReference: null,
      paymentMethod: null,
      expiresAt: null,
    },
  });
}

async function upsertInvoice(
  orderId: number,
  stage: InvoiceStage,
  input: {
    subtotal: number;
    discount: number;
    total: number;
    status: string;
    paidAt: string | null;
    issuedAt: string | Date;
    currency: string;
    snapshot: InvoiceSnapshot;
  },
) {
  const date = new Date(input.issuedAt);
  const code = { deposit: "DP", balance: "BAL", full: "FULL" }[stage];
  const number = `INV/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(orderId).padStart(6, "0")}/${code}`;
  await pool.query(
    `INSERT INTO invoices (order_id, stage, invoice_number, subtotal_amount, discount_amount,
      gateway_fee_amount, total_amount, currency, status, snapshot, issued_at, paid_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       subtotal_amount = IF(status IN ('paid', 'refunded', 'partial_refunded'), subtotal_amount, VALUES(subtotal_amount)),
       discount_amount = IF(status IN ('paid', 'refunded', 'partial_refunded'), discount_amount, VALUES(discount_amount)),
       total_amount = IF(status IN ('paid', 'refunded', 'partial_refunded'), total_amount, VALUES(total_amount)),
       snapshot = IF(status IN ('paid', 'refunded', 'partial_refunded'), snapshot, VALUES(snapshot)),
       paid_at = COALESCE(paid_at, VALUES(paid_at)),
       status = IF(status IN ('paid', 'refunded', 'partial_refunded'), status, VALUES(status))`,
    [
      orderId,
      stage,
      number,
      input.subtotal,
      input.discount,
      input.total,
      input.currency,
      input.status,
      JSON.stringify(input.snapshot),
      input.issuedAt,
      input.paidAt,
    ],
  );
  return findStageInvoice(orderId, stage);
}

export async function backfillStageInvoices(orderId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT reference FROM order_payment_sessions WHERE order_id = ? ORDER BY id",
    [orderId],
  );
  for (const row of rows)
    await ensurePaymentStageInvoice(orderId, row.reference);
  await ensureBalanceInvoice(orderId);
}
