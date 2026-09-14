import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";

export type FinanceTransactionType = "income" | "expense" | "refund";

type FinanceRow = RowDataPacket & {
  id: number;
  order_id: number | null;
  category_id: number | null;
  category_name: string | null;
  transaction_type: FinanceTransactionType;
  amount: number;
  gateway_fee: number;
  net_amount: number;
  payment_method: string | null;
  reference: string | null;
  occurred_at: string;
  notes: string | null;
  attachment_url: string | null;
  status: "posted" | "void";
};

export type FinanceMutationInput = {
  categoryId: number | null;
  amount: number;
  paymentMethod: string | null;
  occurredAt: string;
  notes: string | null;
  attachmentUrl: string | null;
};

const transactionSelect = `SELECT
  transactions.id, transactions.order_id, transactions.category_id,
  categories.name AS category_name, transactions.transaction_type,
  transactions.amount, transactions.gateway_fee, transactions.net_amount,
  transactions.payment_method, transactions.reference,
  transactions.occurred_at, transactions.notes,
  transactions.attachment_url, transactions.status
FROM financial_transactions AS transactions
LEFT JOIN finance_categories AS categories ON categories.id = transactions.category_id`;

export async function findFinanceCategories() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, category_type AS categoryType
     FROM finance_categories WHERE active = TRUE
     ORDER BY category_type, name`,
  );
  return rows;
}

export async function findFinanceSummary(from: string, to: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
      COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN net_amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
      COALESCE(SUM(CASE WHEN transaction_type = 'refund' THEN amount ELSE 0 END), 0) AS refunds,
      COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN gateway_fee ELSE 0 END), 0) AS fees
    FROM financial_transactions
    WHERE status = 'posted' AND occurred_at >= ? AND occurred_at < DATE_ADD(?, INTERVAL 1 DAY)`,
    [from, to],
  );
  const row = rows[0] ?? {};
  const income = Number(row.income ?? 0);
  const expense = Number(row.expense ?? 0);
  const refunds = Number(row.refunds ?? 0);
  return {
    income,
    expense,
    refunds,
    fees: Number(row.fees ?? 0),
    netProfit: income - expense - refunds,
  };
}

export async function findFinanceTransactions(input: {
  from: string;
  to: string;
  type?: FinanceTransactionType;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.max(1, Math.min(1000, input.pageSize ?? 20));
  const filters = [
    "transactions.status = 'posted'",
    "transactions.occurred_at >= ?",
    "transactions.occurred_at < DATE_ADD(?, INTERVAL 1 DAY)",
  ];
  const params: Array<string | number> = [input.from, input.to];
  if (input.type) {
    filters.push("transactions.transaction_type = ?");
    params.push(input.type);
  }
  const where = `WHERE ${filters.join(" AND ")}`;
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM financial_transactions AS transactions ${where}`,
    params,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const [rows] = await pool.query<FinanceRow[]>(
    `${transactionSelect} ${where}
     ORDER BY transactions.occurred_at DESC, transactions.id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize],
  );
  return {
    transactions: rows.map(mapFinanceRow),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createExpense(
  input: FinanceMutationInput,
  adminId: number | null,
) {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO financial_transactions
      (category_id, transaction_type, amount, net_amount, payment_method, occurred_at, notes, attachment_url, created_by)
     VALUES (?, 'expense', ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.categoryId,
      input.amount,
      input.amount,
      input.paymentMethod,
      input.occurredAt,
      input.notes,
      input.attachmentUrl,
      adminId,
    ],
  );
  return result.insertId;
}

export async function updateExpense(id: number, input: FinanceMutationInput) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE financial_transactions
     SET category_id = ?, amount = ?, net_amount = ?, payment_method = ?, occurred_at = ?, notes = ?, attachment_url = ?
     WHERE id = ? AND transaction_type = 'expense' AND status = 'posted'`,
    [
      input.categoryId,
      input.amount,
      input.amount,
      input.paymentMethod,
      input.occurredAt,
      input.notes,
      input.attachmentUrl,
      id,
    ],
  );
  return result.affectedRows > 0;
}

export async function voidExpense(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE financial_transactions SET status = 'void'
     WHERE id = ? AND transaction_type = 'expense' AND status = 'posted'`,
    [id],
  );
  return result.affectedRows > 0;
}

export async function recordPaidOrderTransaction(orderId: number) {
  await pool.query(
    `INSERT INTO financial_transactions
      (order_id, transaction_type, amount, gateway_fee, net_amount, payment_method, reference, occurred_at, notes)
     SELECT id, 'income', payment_amount, gateway_fee_amount,
       COALESCE(net_amount, payment_amount - gateway_fee_amount), payment_method,
       CONCAT('ORDER-', id, '-PAYMENT'), COALESCE(settlement_at, paid_at, CURRENT_TIMESTAMP),
       CONCAT('Pembayaran ', design_title)
     FROM orders
     WHERE id = ?
       AND payment_status IN ('paid', 'partial_refunded', 'refunded')
       AND payment_amount IS NOT NULL
     ON DUPLICATE KEY UPDATE reference = reference`,
    [orderId],
  );
}

/**
 * Reconciles paid orders that may not have reached the bookkeeping write after
 * a successful gateway callback. The stable order reference makes this safe to
 * run repeatedly and prevents duplicate income rows.
 */
export async function syncPaidOrderTransactions() {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO financial_transactions
      (order_id, transaction_type, amount, gateway_fee, net_amount, payment_method, reference, occurred_at, notes)
     SELECT orders.id, 'income', orders.payment_amount, orders.gateway_fee_amount,
       COALESCE(orders.net_amount, orders.payment_amount - orders.gateway_fee_amount),
       orders.payment_method, CONCAT('ORDER-', orders.id, '-PAYMENT'),
       COALESCE(orders.settlement_at, orders.paid_at, orders.updated_at, CURRENT_TIMESTAMP),
       CONCAT('Pembayaran ', orders.design_title)
     FROM orders
     LEFT JOIN financial_transactions AS transactions
       ON transactions.reference = CONCAT('ORDER-', orders.id, '-PAYMENT')
     WHERE orders.payment_status IN ('paid', 'partial_refunded', 'refunded')
       AND orders.payment_amount IS NOT NULL
       AND orders.deleted_at IS NULL
       AND transactions.id IS NULL
     ON DUPLICATE KEY UPDATE reference = reference`,
  );

  return result.affectedRows;
}

export async function ensureOrderInvoice(orderId: number) {
  const [orders] = await pool.query<RowDataPacket[]>(
    `SELECT id, design_title, customer_name, customer_contact, project_type,
      COALESCE(subtotal_amount, quote_amount, payment_amount, 0) AS subtotal_amount,
      discount_amount, gateway_fee_amount, COALESCE(payment_amount, quote_amount, 0) AS total_amount,
      currency, payment_status, paid_at, created_at
     FROM orders WHERE id = ? LIMIT 1`,
    [orderId],
  );
  const order = orders[0];
  if (!order) return null;
  const date = new Date(order.paid_at ?? order.created_at ?? Date.now());
  const invoiceNumber = `INV/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(orderId).padStart(6, "0")}`;
  const snapshot = JSON.stringify({
    designTitle: order.design_title,
    customerName: order.customer_name,
    customerContact: order.customer_contact,
    projectType: order.project_type,
  });
  await pool.query(
    `INSERT INTO invoices
      (order_id, invoice_number, subtotal_amount, discount_amount, gateway_fee_amount, total_amount, currency, status, snapshot, issued_at, paid_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
     ON DUPLICATE KEY UPDATE invoice_number = invoice_number`,
    [
      orderId,
      invoiceNumber,
      Number(order.subtotal_amount),
      Number(order.discount_amount ?? 0),
      Number(order.gateway_fee_amount ?? 0),
      Number(order.total_amount),
      order.currency ?? "IDR",
      order.payment_status === "paid" ? "paid" : "issued",
      snapshot,
      order.paid_at ?? null,
    ],
  );
  await pool.query(
    `UPDATE orders SET invoice_number = ?, invoice_issued_at = COALESCE(invoice_issued_at, CURRENT_TIMESTAMP) WHERE id = ?`,
    [invoiceNumber, orderId],
  );
  return invoiceNumber;
}

export async function recordOrderRefund(
  orderId: number,
  amount: number,
  notes: string | null,
  adminId: number | null,
) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query<RowDataPacket[]>(
      `SELECT id, payment_amount, payment_method FROM orders
       WHERE id = ? AND payment_status IN ('paid', 'partial_refunded') AND deleted_at IS NULL
       LIMIT 1 FOR UPDATE`,
      [orderId],
    );
    const order = orders[0];
    if (!order) {
      await connection.rollback();
      return false;
    }
    const [refundRows] = await connection.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(amount), 0) AS refunded FROM financial_transactions
       WHERE order_id = ? AND transaction_type = 'refund' AND status = 'posted'`,
      [orderId],
    );
    const paidAmount = Number(order.payment_amount ?? 0);
    const previousRefund = Number(refundRows[0]?.refunded ?? 0);
    if (amount > paidAmount - previousRefund) {
      await connection.rollback();
      return false;
    }
    const isFullyRefunded = previousRefund + amount >= paidAmount;
    await connection.query(
      `INSERT INTO financial_transactions
        (order_id, transaction_type, amount, net_amount, payment_method, reference, occurred_at, notes, created_by)
       VALUES (?, 'refund', ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`,
      [
        orderId,
        amount,
        amount,
        order.payment_method ?? null,
        `ORDER-${orderId}-REFUND-${Date.now()}`,
        notes,
        adminId,
      ],
    );
    await connection.query(
      `UPDATE orders SET payment_status = ?, refunded_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [isFullyRefunded ? "refunded" : "partial_refunded", orderId],
    );
    await connection.query(
      `UPDATE invoices SET status = ? WHERE order_id = ?`,
      [isFullyRefunded ? "refunded" : "partial_refunded", orderId],
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

function mapFinanceRow(row: FinanceRow) {
  return {
    id: row.id,
    orderId: row.order_id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    type: row.transaction_type,
    amount: Number(row.amount),
    gatewayFee: Number(row.gateway_fee),
    netAmount: Number(row.net_amount),
    paymentMethod: row.payment_method,
    reference: row.reference,
    occurredAt: row.occurred_at,
    notes: row.notes,
    attachmentUrl: row.attachment_url,
    status: row.status,
  };
}
