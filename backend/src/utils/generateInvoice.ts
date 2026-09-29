import PDFDocument from "pdfkit";
import type { Response } from "express";
import { config } from "../config";

export type InvoiceData = {
  orderId: number;
  invoiceNumber: string;
  customerName: string;
  customerContact: string;
  templateTitle: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  projectType: string;
  status: string;
  createdAt: string;
  paymentDate?: string;
  paymentMethod?: string;
  stageLabel?: string;
  orderTotal?: number;
  previousPaid?: number;
  expiresAt?: string;
  paymentReference?: string;
};

export function generateInvoiceBuffer(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: { Title: `Invoice ${data.invoiceNumber}`, Author: "Naki Code" },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
      const money = (amount: number) =>
        new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: data.currency,
          maximumFractionDigits: 0,
        }).format(amount);
      const date = (value: string) =>
        new Intl.DateTimeFormat("id-ID", {
          dateStyle: "long",
          timeZone: "Asia/Jakarta",
        }).format(new Date(value));
      const text = (
        value: string,
        x: number,
        y: number,
        width: number,
        size = 10,
        bold = false,
      ) => {
        doc
          .font(bold ? "Helvetica-Bold" : "Helvetica")
          .fontSize(size)
          .fillColor("#172447")
          .text(value, x, y, { width });
      };
      text("NAKI CODE", 50, 50, 250, 24, true);
      text("Jasa pembuatan website & source code design", 50, 83, 280, 10);
      text(config.smtp.fromEmail, 50, 100, 280, 10);
      text(config.clientOrigin, 50, 117, 280, 10);
      text("INVOICE", 365, 50, 180, 25, true);
      text(data.invoiceNumber, 345, 87, 200, 10, true);
      text(data.stageLabel ?? "Pembayaran", 345, 105, 200, 11);
      text(`Diterbitkan: ${date(data.createdAt)}`, 345, 125, 200, 9);
      doc.strokeColor("#dbe2ec").moveTo(50, 159).lineTo(545, 159).stroke();

      text("DITAGIHKAN KEPADA", 50, 179, 270, 10, true);
      text(data.customerName, 50, 201, 285, 12, true);
      const nameHeight = doc.heightOfString(data.customerName, { width: 285 });
      text(data.customerContact, 50, 205 + nameHeight, 285, 10);
      text(`Order #${data.orderId}`, 365, 179, 180, 10, true);
      const statusLabels: Record<string, string> = {
        paid: "LUNAS",
        issued: "BELUM DIBAYAR",
        waiting_payment: "MENUNGGU PEMBAYARAN",
        partial_paid: "DIBAYAR SEBAGIAN",
        expired: "SESI BAYAR KEDALUWARSA",
        failed: "PEMBAYARAN GAGAL",
        cancelled: "DIBATALKAN",
        refunded: "DIREFUND",
        partial_refunded: "REFUND SEBAGIAN",
      };
      text(
        statusLabels[data.status] ?? data.status.toUpperCase(),
        365,
        202,
        180,
        9,
        true,
      );

      const tableTop = Math.max(270, 235 + nameHeight);
      doc.rect(50, tableTop, 495, 28).fill("#172447");
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#ffffff")
        .text("Deskripsi", 62, tableTop + 9, { width: 315 })
        .text("Nominal", 402, tableTop + 9, { width: 130, align: "right" });
      const description = `${data.templateTitle}\n${data.stageLabel ?? data.projectType}`;
      text(description, 62, tableTop + 42, 315, 11);
      const descriptionHeight = doc.heightOfString(description, { width: 315 });
      doc
        .fontSize(10)
        .text(money(data.subtotalAmount), 390, tableTop + 42, {
          width: 143,
          align: "right",
        });
      const tableBottom = tableTop + Math.max(90, descriptionHeight + 58);
      doc
        .strokeColor("#dbe2ec")
        .rect(50, tableTop + 28, 495, tableBottom - tableTop - 28)
        .stroke();
      let y = tableBottom + 25;
      const row = (label: string, amount: number, bold = false) => {
        text(label, 250, y, 155, 10, bold);
        doc.text(money(amount), 405, y, { width: 140, align: "right" });
        y += 24;
      };
      if (data.orderTotal !== undefined) row("Total proyek", data.orderTotal);
      if (data.previousPaid) row("Sudah dibayar sebelumnya", data.previousPaid);
      if (data.discountAmount > 0) row("Diskon", -data.discountAmount);
      row("TOTAL INVOICE", data.totalAmount, true);
      y += 15;
      text("INFORMASI PEMBAYARAN", 50, y, 495, 10, true);
      y += 22;
      if (data.paymentDate) {
        text(`Pembayaran diterima: ${date(data.paymentDate)}`, 50, y, 495);
        y += 20;
      }
      if (data.paymentMethod) {
        text(`Metode: ${data.paymentMethod}`, 50, y, 495);
        y += 20;
      }
      if (data.paymentReference) {
        text(`Reference: ${data.paymentReference}`, 50, y, 495);
        y += 20;
      }
      if (data.expiresAt && data.status !== "paid") {
        const deadline = new Intl.DateTimeFormat("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Jakarta",
        }).format(new Date(data.expiresAt));
        text(`Batas sesi pembayaran: ${deadline} WIB`, 50, y, 495);
        y += 20;
      }
      if (data.status !== "paid")
        text(
          "Invoice ini adalah tagihan, bukan bukti pembayaran. Bayar atau buat ulang sesi melalui Pesanan Saya.",
          50,
          y + 5,
          495,
          9,
        );
      doc.strokeColor("#dbe2ec").moveTo(50, 745).lineTo(545, 745).stroke();
      text(
        "Terima kasih telah mempercayakan proyekmu kepada Naki Code.",
        50,
        759,
        495,
        9,
      );
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateInvoicePDF(
  response: Response,
  data: InvoiceData,
) {
  response.end(await generateInvoiceBuffer(data));
}
