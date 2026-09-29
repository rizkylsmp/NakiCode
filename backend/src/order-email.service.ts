import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import * as Sentry from "@sentry/node";
import { pool } from "./db";
import { config } from "./config";
import { enqueueEmail } from "./email-queue";
import { sendOrderEmail } from "./email";
import {
  ensureBalanceInvoice,
  ensurePaymentStageInvoice,
  findStageInvoice,
  invoiceStageLabels,
  type StageInvoice,
} from "./models/invoice.model";
import {
  generateInvoiceBuffer,
  type InvoiceData,
} from "./utils/generateInvoice";

export function invoicePdfData(invoice: StageInvoice): InvoiceData {
  return {
    orderId: invoice.orderId,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.snapshot.customerName,
    customerContact:
      invoice.snapshot.customerEmail || invoice.snapshot.customerContact,
    templateTitle: invoice.snapshot.designTitle,
    subtotalAmount: invoice.subtotalAmount,
    discountAmount: invoice.discountAmount,
    totalAmount: invoice.totalAmount,
    currency: invoice.currency,
    projectType: invoice.snapshot.projectType,
    status: invoice.status,
    createdAt: invoice.issuedAt,
    paymentDate: invoice.paidAt ?? undefined,
    stageLabel: invoiceStageLabels[invoice.stage],
    orderTotal: invoice.snapshot.orderTotal,
    previousPaid: invoice.snapshot.previousPaid,
    paymentMethod: invoice.snapshot.paymentMethod ?? undefined,
    paymentReference: invoice.snapshot.paymentReference ?? undefined,
    expiresAt: invoice.snapshot.expiresAt ?? undefined,
  };
}

export async function notifyOrderCreated(orderId: number) {
  await safelySchedule(orderId, "order-created");
}

export async function syncPaymentInvoice(
  orderId: number,
  reference: string | null,
) {
  if (!reference) return;
  try {
    const invoice = await ensurePaymentStageInvoice(orderId, reference);
    if (invoice)
      await safelySchedule(
        orderId,
        `${invoice.stage}-${invoice.status === "paid" ? "paid" : "issued"}`,
        invoice.id,
      );
  } catch (error) {
    Sentry.captureException(error);
  }
}

export async function notifyBalanceDue(orderId: number) {
  try {
    const invoice = await ensureBalanceInvoice(orderId);
    if (invoice) await safelySchedule(orderId, "balance-issued", invoice.id);
  } catch (error) {
    Sentry.captureException(error);
  }
}

async function safelySchedule(
  orderId: number,
  eventKey: string,
  invoiceId: number | null = null,
) {
  try {
    await pool.query(
      "INSERT IGNORE INTO order_email_deliveries (order_id, invoice_id, event_key) VALUES (?, ?, ?)",
      [orderId, invoiceId, eventKey],
    );
    await enqueueEmail({ type: "order-notification", payload: { orderId } });
  } catch (error) {
    Sentry.captureException(error);
  }
}

export async function deliverOrderEmails(orderId: number) {
  const [events] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM order_email_deliveries WHERE order_id = ? AND status IN ('pending', 'sending')
      AND (locked_at IS NULL OR locked_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE)) ORDER BY id LIMIT 10`,
    [orderId],
  );
  for (const event of events) {
    const lock = randomUUID();
    const [claim] = await pool.query<ResultSetHeader>(
      `UPDATE order_email_deliveries SET status = 'sending', lock_token = ?, locked_at = CURRENT_TIMESTAMP, attempts = attempts + 1
       WHERE id = ? AND status IN ('pending', 'sending') AND (locked_at IS NULL OR locked_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE))`,
      [lock, event.id],
    );
    if (!claim.affectedRows) continue;
    try {
      const [orders] = await pool.query<RowDataPacket[]>(
        `SELECT orders.id, orders.customer_name, orders.design_title, orders.order_type, users.email
         FROM orders JOIN users ON users.id = orders.user_id WHERE orders.id = ? AND orders.deleted_at IS NULL LIMIT 1`,
        [orderId],
      );
      const order = orders[0];
      if (!order?.email)
        throw new Error("Alamat email akun order tidak tersedia");
      let invoice: StageInvoice | null = null;
      if (event.invoice_id) {
        const stage = String(event.event_key).split("-")[0] as
          | "deposit"
          | "balance"
          | "full";
        invoice = await findStageInvoice(orderId, stage);
        if (!invoice || invoice.id !== Number(event.invoice_id))
          throw new Error("Invoice tidak ditemukan");
      }
      if (
        invoice &&
        ((String(event.event_key).endsWith("-issued") &&
          [
            "paid",
            "expired",
            "failed",
            "cancelled",
            "refunded",
            "partial_refunded",
          ].includes(invoice.status)) ||
          (String(event.event_key).endsWith("-paid") &&
            invoice.status !== "paid"))
      ) {
        await pool.query(
          "UPDATE order_email_deliveries SET status = 'superseded', locked_at = NULL, lock_token = NULL WHERE id = ? AND lock_token = ?",
          [event.id, lock],
        );
        continue;
      }
      const paid =
        String(event.event_key).endsWith("-paid") || invoice?.status === "paid";
      const label = invoice
        ? `Invoice ${invoiceStageLabels[invoice.stage]}`
        : "Pesanan diterima";
      const details = invoice
        ? `${invoice.invoiceNumber}\nNominal: ${new Intl.NumberFormat("id-ID", { style: "currency", currency: invoice.currency, maximumFractionDigits: 0 }).format(invoice.totalAmount)}\nStatus: ${paid ? "Pembayaran diterima" : "Belum dibayar"}`
        : `Permintaan ${order.design_title} berhasil dibuat. ${order.order_type === "custom_project" ? "Tim kami akan menyiapkan penawaran. Tidak ada tagihan sebelum penawaran disetujui dan opsi pembayaran dipilih." : "Lanjutkan pembayaran penuh melalui Pesanan Saya."}`;
      const message = invoice
        ? paid
          ? invoice.stage === "deposit"
            ? "DP telah diterima. Proyek masuk tahap pengerjaan; pelunasan ditagihkan setelah hasil disetujui."
            : invoice.stage === "balance"
              ? "Pelunasan telah diterima. Lihat hasil dan source final di Pesanan Saya."
              : order.order_type === "custom_project"
                ? "Pembayaran penuh telah diterima. Proyek masuk tahap pengerjaan."
                : "Pembayaran telah diterima. Source code tersedia di Pesanan Saya."
          : invoice.stage === "balance"
            ? "Hasil telah disetujui. Silakan bayar sisa tagihan melalui Pesanan Saya."
            : "Silakan lanjutkan pembayaran melalui Pesanan Saya. Jika sesi kedaluwarsa, buat ulang pembayaran dari halaman tersebut."
        : "Kami akan menginformasikan perkembangan pesanan melalui akun dan emailmu.";
      const url = new URL(
        invoice && !paid ? `/checkout/${orderId}` : "/pesanan-saya",
        config.clientOrigin,
      ).href;
      await sendOrderEmail({
        email: invoice?.snapshot.customerEmail || order.email,
        subject: `${label}${invoice ? (paid ? " - Lunas" : " - Tagihan") : ""} | Order #${orderId} - Naki Code`,
        customerName: invoice?.snapshot.customerName || order.customer_name,
        title: label,
        details,
        message,
        url,
        attachment: invoice
          ? {
              filename: `invoice-${orderId}-${invoice.stage}.pdf`,
              content: await generateInvoiceBuffer(invoicePdfData(invoice)),
            }
          : undefined,
      });
      await pool.query(
        "UPDATE order_email_deliveries SET status = 'sent', sent_at = CURRENT_TIMESTAMP, locked_at = NULL, lock_token = NULL, last_error = NULL WHERE id = ? AND lock_token = ?",
        [event.id, lock],
      );
    } catch (error) {
      await pool.query(
        "UPDATE order_email_deliveries SET status = 'pending', locked_at = NULL, lock_token = NULL, last_error = ? WHERE id = ? AND lock_token = ?",
        [
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Pengiriman gagal",
          event.id,
          lock,
        ],
      );
      throw error;
    }
  }
}
