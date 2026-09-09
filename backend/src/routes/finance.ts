import PDFDocument from 'pdfkit';
import { Router, type Response } from 'express';
import * as Sentry from '@sentry/node';
import { z } from 'zod';
import { requireAdmin, type UserTokenPayload } from '../auth';
import { createAdminAuditLog } from '../models/audit-log.model';
import {
  createExpense,
  findFinanceCategories,
  findFinanceSummary,
  findFinanceTransactions,
  recordOrderRefund,
  updateExpense,
  voidExpense,
} from '../models/finance.model';
import { parseBody, parseParams } from '../validation';

export const financeRouter = Router();

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const financeQuerySchema = z.object({
  from: z.string().regex(datePattern),
  to: z.string().regex(datePattern),
  type: z.enum(['income', 'expense', 'refund']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});
const reportQuerySchema = financeQuerySchema.pick({ from: true, to: true, type: true });
const idSchema = z.object({ id: z.coerce.number().int().positive() });
const expenseSchema = z.object({
  categoryId: z.coerce.number().int().positive().nullable().default(null),
  amount: z.coerce.number().int().positive(),
  paymentMethod: z.string().trim().max(80).nullable().default(null),
  occurredAt: z.string().datetime(),
  notes: z.string().trim().max(2000).nullable().default(null),
  attachmentUrl: z.string().trim().max(500).url().nullable().default(null),
});
const refundSchema = z.object({
  amount: z.coerce.number().int().positive(),
  notes: z.string().trim().max(1000).nullable().default(null),
});

financeRouter.use(requireAdmin);

financeRouter.get('/categories', async (_request, response) => {
  try {
    response.json({ categories: await findFinanceCategories() });
  } catch (error) {
    handleError(error, response, 'Gagal memuat kategori keuangan');
  }
});

financeRouter.get('/transactions', async (request, response) => {
  const query = financeQuerySchema.safeParse(request.query);
  if (!query.success) {
    response.status(400).json({ message: 'Filter keuangan tidak valid', errors: query.error.flatten() });
    return;
  }
  try {
    const [summary, page] = await Promise.all([
      findFinanceSummary(query.data.from, query.data.to),
      findFinanceTransactions(query.data),
    ]);
    response.json({ summary, ...page });
  } catch (error) {
    handleError(error, response, 'Gagal memuat transaksi keuangan');
  }
});

financeRouter.post('/expenses', async (request, response) => {
  const body = parseBody(expenseSchema, request, response);
  if (!body) return;
  try {
    const admin = response.locals.admin as UserTokenPayload;
    const id = await createExpense(body, admin.userId ?? null);
    await audit(admin, 'finance.expense_create', id, { amount: body.amount });
    response.status(201).json({ id, message: 'Pengeluaran berhasil dicatat' });
  } catch (error) {
    handleError(error, response, 'Gagal mencatat pengeluaran');
  }
});

financeRouter.put('/expenses/:id', async (request, response) => {
  const params = parseParams(idSchema, request, response);
  const body = parseBody(expenseSchema, request, response);
  if (!params || !body) return;
  try {
    if (!(await updateExpense(params.id, body))) {
      response.status(404).json({ message: 'Pengeluaran tidak ditemukan' }); return;
    }
    await audit(response.locals.admin, 'finance.expense_update', params.id, { amount: body.amount });
    response.json({ message: 'Pengeluaran berhasil diperbarui' });
  } catch (error) {
    handleError(error, response, 'Gagal memperbarui pengeluaran');
  }
});

financeRouter.delete('/expenses/:id', async (request, response) => {
  const params = parseParams(idSchema, request, response);
  if (!params) return;
  try {
    if (!(await voidExpense(params.id))) {
      response.status(404).json({ message: 'Pengeluaran tidak ditemukan' }); return;
    }
    await audit(response.locals.admin, 'finance.expense_void', params.id);
    response.json({ message: 'Pengeluaran dibatalkan tanpa menghapus riwayat' });
  } catch (error) {
    handleError(error, response, 'Gagal membatalkan pengeluaran');
  }
});

financeRouter.post('/orders/:id/refund', async (request, response) => {
  const params = parseParams(idSchema, request, response);
  const body = parseBody(refundSchema, request, response);
  if (!params || !body) return;
  try {
    const admin = response.locals.admin as UserTokenPayload;
    if (!(await recordOrderRefund(params.id, body.amount, body.notes, admin.userId ?? null))) {
      response.status(409).json({ message: 'Order tidak dapat direfund atau nominal melebihi pembayaran' }); return;
    }
    await audit(admin, 'finance.order_refund', params.id, { amount: body.amount });
    response.json({ message: 'Refund berhasil dicatat' });
  } catch (error) {
    handleError(error, response, 'Gagal mencatat refund');
  }
});

financeRouter.get('/reports.csv', async (request, response) => {
  const query = reportQuerySchema.safeParse(request.query);
  if (!query.success) { response.status(400).json({ message: 'Filter laporan tidak valid' }); return; }
  try {
    const data = await findFinanceTransactions({ ...query.data, page: 1, pageSize: 1000 });
    const rows = [['Tanggal', 'Jenis', 'Kategori', 'Referensi', 'Nominal', 'Biaya', 'Bersih', 'Catatan']];
    for (const item of data.transactions) {
      rows.push([item.occurredAt, item.type, item.categoryName ?? '', item.reference ?? '', String(item.amount), String(item.gatewayFee), String(item.netAmount), item.notes ?? '']);
    }
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="laporan-keuangan-${query.data.from}-${query.data.to}.csv"`);
    response.send(`\uFEFF${csv}`);
  } catch (error) {
    handleError(error, response, 'Gagal membuat laporan CSV');
  }
});

financeRouter.get('/reports.pdf', async (request, response) => {
  const query = reportQuerySchema.safeParse(request.query);
  if (!query.success) { response.status(400).json({ message: 'Filter laporan tidak valid' }); return; }
  try {
    const [summary, data] = await Promise.all([findFinanceSummary(query.data.from, query.data.to), findFinanceTransactions({ ...query.data, page: 1, pageSize: 1000 })]);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="laporan-keuangan-${query.data.from}-${query.data.to}.pdf"`);
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    doc.pipe(response);
    doc.fontSize(22).fillColor('#0f172a').text('Laporan Keuangan Naki Code');
    doc.fontSize(10).fillColor('#64748b').text(`Periode ${query.data.from} s.d. ${query.data.to}`);
    doc.moveDown().fontSize(12).fillColor('#0f172a');
    doc.text(`Pemasukan bersih: ${rupiah(summary.income)}`);
    doc.text(`Pengeluaran: ${rupiah(summary.expense)}`);
    doc.text(`Refund: ${rupiah(summary.refunds)}`);
    doc.text(`Laba bersih: ${rupiah(summary.netProfit)}`);
    doc.moveDown();
    for (const item of data.transactions) {
      if (doc.y > 735) doc.addPage();
      doc.fontSize(9).fillColor('#0f172a').text(`${new Date(item.occurredAt).toLocaleDateString('id-ID')} • ${item.type.toUpperCase()} • ${rupiah(item.netAmount)}`);
      doc.fontSize(8).fillColor('#64748b').text([item.categoryName, item.reference, item.notes].filter(Boolean).join(' — ') || '-');
      doc.moveDown(0.5);
    }
    doc.end();
  } catch (error) {
    handleError(error, response, 'Gagal membuat laporan PDF');
  }
});

async function audit(admin: UserTokenPayload, action: string, entityId: number, metadata?: Record<string, unknown>) {
  await createAdminAuditLog({ admin, action, entityType: 'financial_transaction', entityId, metadata })
    .catch((error) => Sentry.captureException(error));
}

function handleError(error: unknown, response: Response, message: string) {
  Sentry.captureException(error);
  response.status(500).json({ message });
}

function csvCell(value: string) {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}
function rupiah(value: number) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value); }
