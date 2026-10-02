import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn(), renew: vi.fn(), inspect: vi.fn(), claim: vi.fn(), email: vi.fn() }));
vi.mock("../models/niche.model", async () => ({ ...(await vi.importActual<typeof import("../models/niche.model")>("../models/niche.model")), resolveNiche: vi.fn(async (name: string) => {
  if (!name) return null;
  if (name === "Laundry") return { id: 1, name };
  const { NicheError } = await vi.importActual<typeof import("../models/niche.model")>("../models/niche.model");
  throw new NicheError(400, "Niche tidak tersedia.");
}) }));
vi.mock("../db", () => ({ pool: { query: vi.fn(), getConnection: vi.fn() } }));
vi.mock("../models/client-invitation.model", async () => {
  const actual = await vi.importActual<typeof import("../models/client-invitation.model")>("../models/client-invitation.model");
  return { ...actual, createClientOrder: mocks.create, renewClientInvitation: mocks.renew, inspectClientInvitation: mocks.inspect, claimClientInvitation: mocks.claim };
});
vi.mock("../email", () => ({ sendClientOrderInvitation: mocks.email }));
vi.mock("../models/audit-log.model", () => ({ createAdminAuditLog: vi.fn(async () => 1) }));
import { createUserToken } from "../auth";
import { authRouter } from "../routes/auth";
import { ordersRouter } from "../routes/orders";
const app = express(); app.use(express.json()); app.use("/api/auth", authRouter); app.use("/api/orders", ordersRouter);
const token = "a".repeat(43);
const admin = createUserToken({ id: 1, username: "admin", role: "admin" });
const client = createUserToken({ id: 7, username: "client", role: "user" });
beforeEach(() => { vi.clearAllMocks(); mocks.create.mockResolvedValue({ order: { id: 23 }, token, expiresAt: new Date().toISOString(), existingAccount: false }); mocks.email.mockResolvedValue(undefined); mocks.inspect.mockResolvedValue({ emailHint: "cl***@example.com", existingAccount: false }); mocks.claim.mockResolvedValue({ orderId: 23, user: { id: 7, username: "client", role: "user" } }); });
const payload = { customerName: "Client", email: "CLIENT@example.com", customerContact: "6281234", projectTitle: "Company site", budgetRange: "Rp 3Jt - Rp 5Jt", message: "Company site brief" };
describe("client invitation API", () => {
  it("accepts a registered niche and rejects arbitrary niche before order creation", async () => {
    const valid = await request(app).post("/api/orders/admin-create").set("Authorization", `Bearer ${admin}`).send({ ...payload, niche: "Laundry", sendEmail: false });
    expect(valid.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ niche: "Laundry" }));
    mocks.create.mockClear();
    const invalid = await request(app).post("/api/orders/admin-create").set("Authorization", `Bearer ${admin}`).send({ ...payload, niche: "Unknown niche" });
    expect(invalid.status).toBe(400); expect(mocks.create).not.toHaveBeenCalled();
  });
  it("requires an administrator to create external orders", async () => {
    expect((await request(app).post("/api/orders/admin-create").send(payload)).status).toBe(401);
    expect((await request(app).post("/api/orders/admin-create").set("Authorization", `Bearer ${client}`).send(payload)).status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("validates client fields before touching the database", async () => {
    expect((await request(app).post("/api/orders/admin-create").set("Authorization", `Bearer ${admin}`).send({ ...payload, email: "bad" })).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("returns a private invitation and delivers an email in the chosen language", async () => {
    const response = await request(app).post("/api/orders/admin-create").set("Origin", "http://localhost:5188").set("Authorization", `Bearer ${admin}`).send({ ...payload, language: "en" });
    expect(response.status).toBe(201);
    expect(response.body.emailSent).toBe(true);
    expect(response.body.invitationUrl).toContain(`#token=${token}&lang=en`);
    expect(mocks.create.mock.calls[0][0].email).toBe("client@example.com");
    expect(mocks.email.mock.calls[0][0].language).toBe("en");
  });
  it("keeps the created order when SMTP fails and reports that failure", async () => {
    mocks.email.mockRejectedValue(new Error("SMTP unavailable"));
    const response = await request(app).post("/api/orders/admin-create").set("Authorization", `Bearer ${admin}`).send(payload);
    expect(response.status).toBe(201); expect(response.body.emailSent).toBe(false); expect(response.body.order.id).toBe(23);
  });
  it("inspection reads the submitted token and never caches the response", async () => {
    const response = await request(app).post("/api/auth/client-invitations/inspect").send({ token });
    expect(response.status).toBe(200); expect(mocks.inspect).toHaveBeenCalledWith(token); expect(response.headers["cache-control"]).toBe("no-store");
  });
  it("requires consent and a strong new password", async () => {
    expect((await request(app).post("/api/auth/client-invitations/claim").send({ token, password: "Strong-pass-12" })).status).toBe(400);
    expect((await request(app).post("/api/auth/client-invitations/claim").send({ token, password: "12345678", acceptTerms: true })).status).toBe(400);
    expect(mocks.claim).not.toHaveBeenCalled();
  });
  it("claims a new client's order and returns a login session", async () => {
    const response = await request(app).post("/api/auth/client-invitations/claim").send({ token, password: "My$Private!Site29-Access", acceptTerms: true });
    expect(response.status).toBe(200); expect(response.body.orderId).toBe(23); expect(response.body.token).toBeTruthy(); expect(mocks.claim.mock.calls[0][2]).toBeNull();
  });
  it("passes the authenticated identity for existing account claims", async () => {
    const response = await request(app).post("/api/auth/client-invitations/claim").set("Authorization", `Bearer ${client}`).send({ token, acceptTerms: true });
    expect(response.status).toBe(200); expect(mocks.claim.mock.calls[0][2].userId).toBe(7);
  });
});
