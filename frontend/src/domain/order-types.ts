export type PaymentStatus = "pending" | "waiting_payment" | "paid" | "failed";

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
  paymentFailureCode: string | null;
  paymentFailureReason: string | null;
  paymentLastWebhookStatus: string | null;
  paymentLastWebhookAt: string | null;
  paidAt: string | null;
  templatePrice: string | null;
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
  if (canConfirmPaymentManually(order)) {
    return "Mode dev: konfirmasi manual tersedia untuk simulasi pembayaran.";
  }

  return "Selesaikan pembayaran di halaman bayar. Status paid akan otomatis berubah setelah gateway mengirim webhook.";
}
