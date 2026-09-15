import * as Sentry from "@sentry/node";
import {
  redeemCouponReservation,
  releaseCouponReservation,
} from "../models/business.model";
import {
  ensureOrderInvoice,
  recordPaidOrderTransaction,
} from "../models/finance.model";
import { createNotification } from "../models/notification.model";
import {
  markOrderPaidByPaymentReference,
  markOrderPaymentFailedByReference,
  recordOrderPaymentWebhookStatus,
  type OrderItem,
} from "../models/order.model";
import { getMidtransTransactionStatus } from "./payment.service";

const terminalStatuses = new Set(["deny", "cancel", "expire", "failure"]);

export async function reconcileWaitingMidtransOrder(order: OrderItem) {
  if (
    order.paymentStatus !== "waiting_payment" ||
    !order.paymentReference ||
    order.paymentMethod?.toLowerCase() === "lynk" ||
    order.paymentMethod?.toLowerCase().includes("(dev)")
  ) {
    return false;
  }

  try {
    const status = await getMidtransTransactionStatus(
      order.paymentReference,
      order.paymentUrl,
    );
    if (!status) return false;
    if (status.orderId !== order.paymentReference) {
      throw new Error("Reference respons Midtrans tidak sesuai dengan order");
    }

    const isPaid =
      status.transactionStatus === "settlement" ||
      (status.transactionStatus === "capture" &&
        status.fraudStatus === "accept");

    if (isPaid) {
      const gatewayAmount = Number(status.grossAmount);
      if (
        !Number.isFinite(gatewayAmount) ||
        gatewayAmount !== Number(order.paymentAmount)
      ) {
        return failPayment(order, {
          code: status.statusCode,
          reason: `Jumlah status Midtrans (${gatewayAmount}) tidak sesuai dengan order (${order.paymentAmount ?? "unknown"})`,
          transactionStatus: "failure",
        });
      }

      const wasUpdated = await markOrderPaidByPaymentReference(
        order.paymentReference,
      );
      await Promise.all([
        ensureOrderInvoice(order.id),
        recordPaidOrderTransaction(order.id, order.paymentReference),
        order.orderType === "source_purchase"
          ? redeemCouponReservation(order.id)
          : Promise.resolve(false),
      ]);

      if (wasUpdated) {
        await createNotification({
          userId: order.userId,
          title:
            order.orderType === "custom_project" && order.amountPaid === 0
              ? "DP berhasil"
              : "Pembayaran berhasil",
          message: `Status pembayaran ${order.templateTitle || "pesanan kamu"} berhasil disinkronkan dari Midtrans.`,
          type: "payment",
          relatedOrderId: order.id,
        });
      }
      return wasUpdated;
    }

    if (terminalStatuses.has(status.transactionStatus)) {
      return failPayment(order, {
        code: status.statusCode,
        reason: getFailureReason(
          status.transactionStatus,
          status.statusMessage,
        ),
        transactionStatus: status.transactionStatus,
      });
    }

    await recordOrderPaymentWebhookStatus(
      order.paymentReference,
      status.transactionStatus,
    );
    return false;
  } catch (error) {
    Sentry.captureException(error, {
      extra: { orderId: order.id, paymentReference: order.paymentReference },
    });
    return false;
  }
}

async function failPayment(
  order: OrderItem,
  failure: {
    code: string | null;
    reason: string;
    transactionStatus: string;
  },
) {
  const wasUpdated = await markOrderPaymentFailedByReference(
    order.paymentReference!,
    failure,
  );
  if (order.orderType === "source_purchase") {
    await releaseCouponReservation(order.id);
  }

  if (wasUpdated) {
    const expired = failure.transactionStatus === "expire";
    const cancelled = failure.transactionStatus === "cancel";
    await createNotification({
      userId: order.userId,
      title: expired
        ? "Pembayaran kedaluwarsa"
        : cancelled
          ? "Pembayaran dibatalkan"
          : "Pembayaran gagal",
      message: `Status pembayaran ${order.templateTitle || "pesanan kamu"} telah disinkronkan dari Midtrans. Kamu dapat membuat pembayaran baru dari Pesanan Saya.`,
      type: "payment",
      relatedOrderId: order.id,
    });
  }
  return wasUpdated;
}

function getFailureReason(transactionStatus: string, statusMessage: string | null) {
  const labels: Record<string, string> = {
    deny: "Pembayaran ditolak oleh Midtrans",
    cancel: "Pembayaran dibatalkan di Midtrans",
    expire: "Waktu pembayaran Midtrans telah kedaluwarsa",
    failure: "Midtrans melaporkan pembayaran gagal",
  };
  return labels[transactionStatus] ?? statusMessage ?? "Pembayaran gagal";
}
