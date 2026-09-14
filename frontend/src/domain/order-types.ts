export type PaymentStatus =
  | "pending"
  | "waiting_payment"
  | "partial_paid"
  | "paid"
  | "failed"
  | "expired"
  | "partial_refunded"
  | "refunded"
  | "cancelled";

export type OrderItem = {
  id: number;
  userId?: number | null;
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
  paymentStatus: PaymentStatus;
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
  quoteStatus: "pending" | "accepted" | "rejected" | null;
  quoteRespondedAt: string | null;
  depositPercent: number;
  amountPaid: number;
  paymentStage: "full" | "deposit" | "balance" | "complete" | "legacy_full";
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
  deliveryStatus: "locked" | "available";
  sourceCodeItems: string[];
  setupGuide: string | null;
  demoUrl: string | null;
  createdAt: string;
};

export type OrdersResponse = {
  orders: OrderItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function getPaymentStatusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Sudah dibayar";
    case "waiting_payment":
      return "Menunggu pembayaran";
    case "failed":
      return "Pembayaran gagal";
    case "partial_paid":
      return "Bayar sebagian";
    case "expired":
      return "Kedaluwarsa";
    case "partial_refunded":
      return "Refund sebagian";
    case "refunded":
      return "Direfund";
    case "cancelled":
      return "Dibatalkan";
    default:
      return "Belum bayar";
  }
}

export function canRateOrder(order: OrderItem) {
  return order.paymentStatus === "paid" && order.templateId !== null;
}

export function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new: "Baru",
    contacted: "Sudah dihubungi",
    quotation: "Menunggu respons penawaran",
    awaiting_dp: "Menunggu pembayaran",
    in_progress: "Sedang dikerjakan",
    revision: "Dalam revisi",
    delivered: "Sudah diserahkan",
    completed: "Selesai",
    cancelled: "Dibatalkan",
    deal: "Disepakati",
    closed: "Ditutup",
  };

  return labels[status] ?? status;
}

export function canStartOrderCheckout(order: OrderItem) {
  const restartable = ["pending", "failed", "expired", "cancelled"].includes(
    order.paymentStatus,
  );
  const awaitingBalance =
    order.orderType === "custom_project" &&
    order.paymentStatus === "partial_paid";
  return (
    (restartable || awaitingBalance) &&
    !["completed", "closed", "cancelled"].includes(order.status) &&
    (order.orderType === "source_purchase" ||
      (Boolean(order.quoteAmount) && order.quoteStatus === "accepted"))
  );
}

export function getOrderPayableAmount(order: OrderItem) {
  if (order.orderType === "custom_project" && order.quoteAmount) {
    if (order.amountPaid > 0) {
      return Math.max(0, order.quoteAmount - order.amountPaid);
    }
    return Math.round(order.quoteAmount * (order.depositPercent / 100));
  }

  return parseCurrencyAmount(order.templatePrice);
}

export function getOrderPaymentActionLabel(order: OrderItem) {
  if (order.orderType === "source_purchase") return "Bayar penuh";
  if (order.amountPaid > 0 || order.paymentStage === "balance") {
    return "Bayar pelunasan";
  }
  return `Bayar DP ${order.depositPercent}%`;
}

export function getOrderTypeLabel(order: OrderItem) {
  return order.orderType === "source_purchase"
    ? "Pembelian source code"
    : "Pembuatan website custom";
}

export function canConfirmPaymentManually(order: OrderItem) {
  return (
    order.paymentStatus === "waiting_payment" &&
    Boolean(order.paymentMethod?.toLowerCase().includes("(dev)"))
  );
}

export function getWaitingPaymentMessage(order: OrderItem) {
  if (order.paymentMethod?.toLowerCase() === "lynk") {
    return "Selesaikan transaksi melalui Lynk. Order ini sudah tercatat di Pesanan Saya dan menunggu konfirmasi transaksi.";
  }

  if (canConfirmPaymentManually(order)) {
    return "Mode dev: konfirmasi manual tersedia untuk simulasi pembayaran.";
  }

  return "Selesaikan pembayaran di halaman bayar. Status paid akan otomatis berubah setelah gateway mengirim webhook.";
}

function parseCurrencyAmount(value: string | null | undefined) {
  const text = String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "");
  const numericValue = Number(
    text
      .replace(/rp/g, "")
      .replace(/[^\d.,]/g, "")
      .replace(/\./g, "")
      .replace(",", "."),
  );

  if (!Number.isFinite(numericValue) || numericValue <= 0) return 0;
  if (text.includes("jt") || text.includes("juta"))
    return Math.round(numericValue * 1_000_000);
  if (text.includes("k")) return Math.round(numericValue * 1000);
  return Math.round(numericValue);
}
