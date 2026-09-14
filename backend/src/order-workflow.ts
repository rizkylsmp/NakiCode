export type OrderWorkflowStatus =
  | "new"
  | "contacted"
  | "quotation"
  | "awaiting_dp"
  | "in_progress"
  | "revision"
  | "delivered"
  | "completed"
  | "cancelled"
  | "deal"
  | "closed";

const transitions: Record<OrderWorkflowStatus, OrderWorkflowStatus[]> = {
  new: ["contacted", "quotation", "cancelled"],
  contacted: ["quotation", "awaiting_dp", "cancelled"],
  quotation: ["contacted", "awaiting_dp", "cancelled"],
  awaiting_dp: ["quotation", "in_progress", "cancelled"],
  in_progress: ["revision", "delivered", "cancelled"],
  revision: ["in_progress", "delivered", "cancelled"],
  delivered: ["revision", "completed", "closed"],
  completed: ["closed"],
  cancelled: ["contacted"],
  deal: ["in_progress", "closed", "cancelled"],
  closed: [],
};

export function canTransitionOrderStatus(
  currentStatus: string,
  nextStatus: OrderWorkflowStatus,
  paymentStatus: string,
) {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (
    nextStatus === "cancelled" &&
    !["pending", "failed", "expired", "cancelled"].includes(paymentStatus)
  ) {
    return false;
  }

  const allowed = transitions[currentStatus as OrderWorkflowStatus];
  return Boolean(allowed?.includes(nextStatus));
}

export function canStartOrderPayment(order: {
  orderType: string;
  status: string;
  paymentStatus: string;
  quoteAmount: number | null;
  quoteStatus: string | null;
}) {
  if (["completed", "closed", "cancelled"].includes(order.status)) {
    return false;
  }

  const restartable = ["pending", "failed", "expired", "cancelled"].includes(
    order.paymentStatus,
  );
  const awaitingBalance =
    order.orderType === "custom_project" &&
    order.paymentStatus === "partial_paid";
  if (!restartable && !awaitingBalance) {
    return false;
  }

  if (order.orderType === "source_purchase") return true;

  return Boolean(
    order.quoteAmount &&
    order.quoteAmount > 0 &&
    order.quoteStatus === "accepted",
  );
}
