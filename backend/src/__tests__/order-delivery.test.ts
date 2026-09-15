import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => vi.fn());
vi.mock("../db", () => ({ pool: { query } }));

describe("custom order delivery review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query.mockResolvedValue([{ affectedRows: 1 }]);
  });

  it("submits a delivery from a paid work state", async () => {
    const { submitOrderDelivery } = await import("../models/order.model");
    await expect(
      submitOrderDelivery(66, {
        demoUrl: "https://demo.example.com",
        sourceUrl: "/uploads/sources/final.zip",
        notes: "Versi pertama siap direview",
      }),
    ).resolves.toBe(true);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        "payment_status IN ('partial_paid', 'paid')",
      ),
      [
        "https://demo.example.com",
        "/uploads/sources/final.zip",
        "Versi pertama siap direview",
        66,
      ],
    );
  });

  it("moves an approved delivery to the balance-payment stage", async () => {
    const { respondToOrderDelivery } = await import("../models/order.model");
    await expect(
      respondToOrderDelivery(66, 9, { decision: "approved" }),
    ).resolves.toBe(true);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("ELSE 'awaiting_balance'"),
      [
        "approved",
        "approved",
        "approved",
        "approved",
        null,
        "[]",
        66,
        9,
        "approved",
      ],
    );
    expect(query.mock.calls[0]?.[0]).toContain(
      "FROM order_payment_sessions payment",
    );
    expect(query.mock.calls[0]?.[0]).not.toContain(
      "WHEN payment_status = 'paid'",
    );
    expect(query.mock.calls[0]?.[0]).toContain("THEN 'partial_paid'");
    expect(query.mock.calls[0]?.[0]).toContain("THEN 'balance'");
    expect(query.mock.calls[0]?.[0]).toContain(
      "delivery_source_url IS NOT NULL",
    );
  });

  it("stores revision notes and attachment URLs", async () => {
    const { respondToOrderDelivery } = await import("../models/order.model");
    await respondToOrderDelivery(66, 9, {
      decision: "revision_requested",
      notes: "Ubah hero dan tombol CTA",
      files: ["/uploads/revision.png"],
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("THEN 'in_progress'"),
      [
        "revision_requested",
        "revision_requested",
        "revision_requested",
        "revision_requested",
        "Ubah hero dan tombol CTA",
        '["/uploads/revision.png"]',
        66,
        9,
        "revision_requested",
      ],
    );
  });
});
