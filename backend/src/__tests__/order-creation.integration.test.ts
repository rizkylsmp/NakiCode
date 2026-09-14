import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUserToken } from "../auth";
import { createOrder } from "../models/order.model";
import { findTemplateBySlugOrId } from "../models/template.model";
import { ordersRouter } from "../routes/orders";

vi.mock("../models/order.model", async () => {
  const actual = await vi.importActual<typeof import("../models/order.model")>(
    "../models/order.model",
  );
  return { ...actual, createOrder: vi.fn() };
});

vi.mock("../models/template.model", async () => {
  const actual = await vi.importActual<
    typeof import("../models/template.model")
  >("../models/template.model");
  return { ...actual, findTemplateBySlugOrId: vi.fn() };
});

vi.mock("../models/notification.model", async () => {
  const actual = await vi.importActual<
    typeof import("../models/notification.model")
  >("../models/notification.model");
  return { ...actual, createNotification: vi.fn(async () => undefined) };
});

const app = express();
app.use(express.json());
app.use("/api/orders", ordersRouter);

const token = createUserToken({ id: 10, username: "buyer", role: "user" });
const design = {
  id: 8,
  slug: "canonical-design",
  title: "Canonical Design",
  sourceAvailable: true,
};

describe("order creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findTemplateBySlugOrId).mockResolvedValue(design as never);
    vi.mocked(createOrder).mockImplementation(async (payload) => ({
      id: 91,
      ...payload,
      createdAt: new Date().toISOString(),
    }));
  });

  it("uses canonical design identity instead of customer-supplied metadata", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateId: 8,
        templateSlug: "spoofed-slug",
        templateTitle: "Spoofed title",
        customerName: "Naki Buyer",
        customerContact: "buyer@example.com",
        message: "Saya ingin membeli source design ini.",
        orderType: "source_purchase",
      });

    expect(response.status).toBe(201);
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 8,
        templateSlug: "canonical-design",
        templateTitle: "Canonical Design",
        orderType: "source_purchase",
      }),
    );
  });

  it("rejects source purchase when the canonical design does not sell source", async () => {
    vi.mocked(findTemplateBySlugOrId).mockResolvedValueOnce({
      ...design,
      sourceAvailable: false,
    } as never);

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateId: 8,
        templateSlug: design.slug,
        templateTitle: design.title,
        customerName: "Naki Buyer",
        customerContact: "buyer@example.com",
        message: "Saya ingin membeli source design ini.",
        orderType: "source_purchase",
      });

    expect(response.status).toBe(409);
    expect(createOrder).not.toHaveBeenCalled();
  });
});
