import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { config } from "../config";
import type { OrderItem } from "../models/order.model";
import {
  createPaymentSession,
  createLynkPaymentSession,
  getMidtransTransactionStatus,
  LynkCheckoutUnavailableError,
  paymentExpiryHours,
} from "./payment.service";

function createOrder(templateLynkUrl: string | null) {
  return {
    id: 42,
    templateId: 7,
    templateTitle: "Design Sandbox",
    customerName: "Sandbox User",
    customerContact: "sandbox@example.com",
    templateLynkUrl,
  } as OrderItem;
}

const originalPaymentConfig = { ...config.payment };

beforeAll(() => {
  config.payment.provider = "midtrans";
  config.payment.midtransServerKey = "SB-Mid-server-test";
  config.payment.midtransIsProduction = false;
});

afterAll(() => {
  Object.assign(config.payment, originalPaymentConfig);
});

describe("createPaymentSession", () => {
  it("uses the Midtrans Sandbox Snap endpoint in local mode", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          redirect_url:
            "https://app.sandbox.midtrans.com/snap/v4/redirection/test",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    const session = await createPaymentSession({
      order: createOrder(null),
      method: "qris",
      amount: 149_000,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://app.sandbox.midtrans.com/snap/v1/transactions",
      expect.objectContaining({ method: "POST" }),
    );
    const requestBody = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body),
    ) as {
      expiry: { start_time: string; duration: number; unit: string };
    };
    expect(requestBody.expiry).toMatchObject({
      duration: paymentExpiryHours,
      unit: "hour",
    });
    expect(requestBody.expiry.start_time).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \+0700$/,
    );
    expect(session.url).toContain("app.sandbox.midtrans.com");
    expect(Date.parse(session.expiresAt ?? "")).toBeGreaterThan(Date.now());
    fetchMock.mockRestore();
  });
});

describe("getMidtransTransactionStatus", () => {
  it("reads the current transaction status from the Sandbox Status API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          order_id: "NKC-42-TEST",
          status_code: "407",
          transaction_status: "expire",
          gross_amount: "149000.00",
          status_message: "Success, transaction is found",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(
      getMidtransTransactionStatus("NKC-42-TEST"),
    ).resolves.toMatchObject({
      orderId: "NKC-42-TEST",
      statusCode: "407",
      transactionStatus: "expire",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.sandbox.midtrans.com/v2/NKC-42-TEST/status",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    );
    fetchMock.mockRestore();
  });

  it("falls back to the Sandbox Snap token when DANA cannot be found by order id", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status_code: "404",
            status_message: "Transaction doesn't exist.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            order_id: "NKC-66-DANA",
            status_code: "200",
            transaction_status: "settlement",
            fraud_status: "accept",
            gross_amount: "250000.00",
            payment_type: "dana",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    await expect(
      getMidtransTransactionStatus(
        "NKC-66-DANA",
        "https://app.sandbox.midtrans.com/snap/v4/redirection/sandbox-token",
      ),
    ).resolves.toMatchObject({
      orderId: "NKC-66-DANA",
      transactionStatus: "settlement",
      grossAmount: "250000.00",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://app.sandbox.midtrans.com/snap/v1/transactions/sandbox-token/status",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    fetchMock.mockRestore();
  });
});

describe("createLynkPaymentSession", () => {
  it("creates a trusted Lynk redirect session", () => {
    const session = createLynkPaymentSession(
      createOrder("https://lynk.id/nakicode/design-company"),
      149_000,
    );

    expect(session.method).toBe("Lynk");
    expect(session.url).toBe("https://lynk.id/nakicode/design-company");
    expect(session.reference).toMatch(/^LYNK-42-/);
    expect(session.amount).toBe(149_000);
    expect(session.expiresAt).toBeNull();
  });

  it.each([
    null,
    "https://example.com/fake-lynk",
    "http://lynk.id/nakicode/insecure",
  ])("rejects an unavailable or untrusted URL: %s", (url) => {
    expect(() => createLynkPaymentSession(createOrder(url), 149_000)).toThrow(
      LynkCheckoutUnavailableError,
    );
  });
});
