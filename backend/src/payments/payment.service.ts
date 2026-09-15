import { config } from "../config";
import type { OrderItem } from "../models/order.model";

export type PaymentMethod = "qris" | "dana" | "manual";

export type PaymentSession = {
  method: string;
  reference: string;
  url: string;
  amount: number;
  expiresAt: string | null;
};

export type MidtransTransactionStatus = {
  orderId: string;
  statusCode: string;
  transactionStatus: string;
  fraudStatus: string | null;
  grossAmount: string;
  statusMessage: string | null;
};

export const paymentExpiryHours = 24;

export class LynkCheckoutUnavailableError extends Error {
  constructor() {
    super("Checkout Lynk tidak tersedia untuk design ini");
    this.name = "LynkCheckoutUnavailableError";
  }
}

export function createLynkPaymentSession(
  order: OrderItem,
  amount: number,
): PaymentSession {
  const url = normalizeLynkCheckoutUrl(order.templateLynkUrl);

  if (!url) {
    throw new LynkCheckoutUnavailableError();
  }

  return {
    method: "Lynk",
    reference: `LYNK-${order.id}-${Date.now().toString(36).toUpperCase()}`,
    url,
    amount,
    expiresAt: null,
  };
}

type PaymentSessionInput = {
  order: OrderItem;
  method: PaymentMethod;
  amount: number;
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  qris: "QRIS",
  dana: "DANA",
  manual: "Transfer manual/dev",
};

export async function createPaymentSession({
  order,
  method,
  amount,
}: PaymentSessionInput): Promise<PaymentSession> {
  const reference = `NKC-${order.id}-${Date.now().toString(36).toUpperCase()}`;
  const createdAt = new Date();
  const expiresAt = new Date(
    createdAt.getTime() + paymentExpiryHours * 60 * 60 * 1000,
  );

  if (
    config.payment.provider.toLowerCase() === "midtrans" &&
    config.payment.midtransServerKey
  ) {
    return createMidtransSnapSession({
      order,
      method,
      amount,
      reference,
      createdAt,
      expiresAt,
    });
  }

  return {
    method: `${paymentMethodLabels[method]} (dev)`,
    reference,
    url: `${config.clientOrigin}/pesanan-saya?payment=${encodeURIComponent(
      reference,
    )}`,
    amount,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getMidtransTransactionStatus(
  paymentReference: string,
  paymentUrl?: string | null,
): Promise<MidtransTransactionStatus | null> {
  if (
    config.payment.provider.toLowerCase() !== "midtrans" ||
    !config.payment.midtransServerKey
  ) {
    return null;
  }

  const apiBaseUrl = config.payment.midtransIsProduction
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
  const headers = {
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(
      `${config.payment.midtransServerKey}:`,
    ).toString("base64")}`,
  };
  let data = await fetchMidtransStatus(
    `${apiBaseUrl}/v2/${encodeURIComponent(paymentReference)}/status`,
    headers,
  );

  // DANA Sandbox can require transaction_id for the public Status API. A
  // localhost cannot receive the webhook that contains it, so use the Snap
  // token already present in the trusted redirect URL as a local fallback.
  if (data?.status_code === "404" && !config.payment.midtransIsProduction) {
    const snapToken = extractSandboxSnapToken(paymentUrl);
    if (snapToken) {
      data = await fetchMidtransStatus(
        `https://app.sandbox.midtrans.com/snap/v1/transactions/${encodeURIComponent(snapToken)}/status`,
        headers,
      );
    }
  }

  if (!data || data.status_code === "404") return null;
  if (
    typeof data.order_id !== "string" ||
    typeof data.status_code !== "string" ||
    typeof data.transaction_status !== "string" ||
    typeof data.gross_amount !== "string"
  ) {
    throw new Error("Midtrans status response tidak valid");
  }

  return {
    orderId: data.order_id,
    statusCode: data.status_code,
    transactionStatus: data.transaction_status,
    fraudStatus:
      typeof data.fraud_status === "string" ? data.fraud_status : null,
    grossAmount: data.gross_amount,
    statusMessage:
      typeof data.status_message === "string" ? data.status_message : null,
  };
}

async function fetchMidtransStatus(
  url: string,
  headers: Record<string, string>,
) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(5_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Midtrans status check failed (${response.status})`);
  }
  return (await response.json()) as Record<string, unknown>;
}

function extractSandboxSnapToken(paymentUrl: string | null | undefined) {
  try {
    const url = new URL(String(paymentUrl ?? ""));
    if (url.hostname !== "app.sandbox.midtrans.com") return null;
    const match = url.pathname.match(/\/snap\/v\d+\/(?:redirection|vtweb)\/([^/]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function normalizePaymentMethod(value: unknown): PaymentMethod {
  const method = String(value ?? "qris").toLowerCase();

  if (method === "dana" || method === "manual") {
    return method;
  }

  return "qris";
}

export function parseCurrencyAmount(value: string | null | undefined) {
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

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 1000;
  }

  if (text.includes("jt") || text.includes("juta")) {
    return Math.round(numericValue * 1_000_000);
  }

  if (text.includes("k")) {
    return Math.round(numericValue * 1000);
  }

  return Math.round(numericValue);
}

function normalizeLynkCheckoutUrl(value: string | null | undefined) {
  try {
    const url = new URL(String(value ?? ""));
    const hostname = url.hostname.toLowerCase();
    const isLynkDomain =
      hostname === "lynk.id" || hostname.endsWith(".lynk.id");

    if (url.protocol !== "https:" || !isLynkDomain) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

async function createMidtransSnapSession({
  order,
  method,
  amount,
  reference,
  createdAt,
  expiresAt,
}: PaymentSessionInput & {
  reference: string;
  createdAt: Date;
  expiresAt: Date;
}): Promise<PaymentSession> {
  const baseUrl = config.payment.midtransIsProduction
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
  const response = await fetch(`${baseUrl}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${config.payment.midtransServerKey}:`,
      ).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: reference,
        gross_amount: amount,
      },
      expiry: {
        start_time: formatMidtransTimestamp(createdAt),
        duration: paymentExpiryHours,
        unit: "hour",
      },
      item_details: [
        {
          id: String(order.templateId ?? order.id),
          price: amount,
          quantity: 1,
          name: order.templateTitle.slice(0, 50),
        },
      ],
      customer_details: {
        first_name: order.customerName,
        email: order.customerContact.includes("@")
          ? order.customerContact
          : undefined,
        phone: order.customerContact.includes("@")
          ? undefined
          : order.customerContact,
      },
      enabled_payments: method === "dana" ? ["dana"] : ["gopay", "shopeepay"],
      callbacks: {
        finish: `${config.clientOrigin}/pesanan-saya?payment=${encodeURIComponent(
          reference,
        )}`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as {
    redirect_url?: string;
  };

  return {
    method: paymentMethodLabels[method],
    reference,
    url:
      data.redirect_url ??
      `${config.clientOrigin}/pesanan-saya?payment=${encodeURIComponent(
        reference,
      )}`,
    amount,
    expiresAt: expiresAt.toISOString(),
  };
}

function formatMidtransTimestamp(value: Date) {
  const jakarta = new Date(value.getTime() + 7 * 60 * 60 * 1000);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${jakarta.getUTCFullYear()}-${pad(jakarta.getUTCMonth() + 1)}-${pad(jakarta.getUTCDate())} ${pad(jakarta.getUTCHours())}:${pad(jakarta.getUTCMinutes())}:${pad(jakarta.getUTCSeconds())} +0700`;
}
