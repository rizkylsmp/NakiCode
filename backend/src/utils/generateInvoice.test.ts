import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
vi.mock("../config", () => ({ config: { smtp: { fromEmail: "hello@example.com" }, clientOrigin: "https://www.nakicode.xyz" } }));
import { generateInvoiceBuffer } from "./generateInvoice";

describe("stage invoice PDF", () => {
  it.each(["deposit", "balance"])("generates a readable %s PDF attachment", async (stage) => {
    const buffer = await generateInvoiceBuffer({
      orderId: 42, invoiceNumber: `INV/2026/09/000042/${stage === "deposit" ? "DP" : "BAL"}`,
      customerName: "Contoh pelanggan untuk pemeriksaan invoice", customerContact: "buyer@example.com",
      templateTitle: "Website profil perusahaan dengan katalog layanan dan formulir konsultasi",
      subtotalAmount: 2500000, discountAmount: 0, totalAmount: 2500000, currency: "IDR",
      projectType: "Website custom", status: stage === "deposit" ? "paid" : "waiting_payment",
      createdAt: "2026-09-29T01:00:00Z", paymentDate: stage === "deposit" ? "2026-09-29T02:00:00Z" : undefined,
      paymentMethod: "QRIS", stageLabel: stage === "deposit" ? "Down Payment (DP)" : "Pelunasan",
      orderTotal: 5000000, previousPaid: stage === "balance" ? 2500000 : 0,
      expiresAt: "2026-09-30T02:00:00Z", paymentReference: "NKC-42-TEST-PAYMENT",
    });
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF"); expect(buffer.length).toBeGreaterThan(1000);
    const directory = join(tmpdir(), "naki-invoice-qa"); mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, `${stage}.pdf`), buffer);
  });
});
