export type PaymentStatus = "pending" | "waiting_payment" | "partial_paid" | "paid" | "failed" | "expired" | "partial_refunded" | "refunded" | "cancelled";

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
    case "partial_paid": return "Bayar sebagian";
    case "expired": return "Kedaluwarsa";
    case "partial_refunded": return "Refund sebagian";
    case "refunded": return "Direfund";
    case "cancelled": return "Dibatalkan";
    default:
      return "Belum bayar";
  }
}

export function canRateOrder(order: OrderItem) {
  return order.paymentStatus === "paid" && order.templateId !== null;
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
