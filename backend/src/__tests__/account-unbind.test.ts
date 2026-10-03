import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ find: vi.fn(), password: vi.fn(), unbind: vi.fn(), googleEmail: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: vi.fn() } }));
vi.mock("../models/user.model", async () => ({ ...(await vi.importActual<typeof import("../models/user.model")>("../models/user.model")), findUserById: mocks.find, findUserByUsernameOrEmail: mocks.find, unbindUserConnections: mocks.unbind, findUserByGoogleSub: vi.fn(async () => null), findUserByEmail: mocks.googleEmail }));
vi.mock("../auth", async () => ({ ...(await vi.importActual<typeof import("../auth")>("../auth")), verifyPassword: mocks.password }));
vi.mock("google-auth-library", () => ({ OAuth2Client: class { async verifyIdToken() { return { getPayload: () => ({ sub: "google-id", email: "client@gmail.com", email_verified: true }) }; } } }));
import { authRouter } from "../routes/auth";
import { createUserToken } from "../auth";
import { config } from "../config";
const app = express(); app.use(express.json()); app.use("/api/auth", authRouter);
const user = { id: 7, username: "client", email: "client@gmail.com", role: "user" as const, passwordHash: "hash", googleSub: "google-id", emailVerifiedAt: "2026-10-03", emailVerificationSentAt: null };
const token = createUserToken(user);
beforeEach(() => { vi.clearAllMocks(); mocks.find.mockResolvedValue(user); mocks.password.mockResolvedValue(true); mocks.unbind.mockResolvedValue(true); });
describe("account unbind", () => {
  it("requires authentication and explicit acknowledgement", async () => {
    expect((await request(app).post("/api/auth/user/me/unbind").send({})).status).toBe(401);
    expect((await request(app).post("/api/auth/user/me/unbind").set("Authorization", `Bearer ${token}`).send({ target: "email", currentPassword: "password" })).status).toBe(400);
    expect(mocks.unbind).not.toHaveBeenCalled();
  });
  it("rejects the wrong password without mutating connections", async () => {
    mocks.password.mockResolvedValue(false);
    const result = await request(app).post("/api/auth/user/me/unbind").set("Authorization", `Bearer ${token}`).send({ target: "email", currentPassword: "wrong", acknowledge: true });
    expect(result.status).toBe(400); expect(mocks.unbind).not.toHaveBeenCalled();
  });
  it.each(["google", "email"])("detaches %s from the authenticated account only", async target => {
    const result = await request(app).post("/api/auth/user/me/unbind").set("Authorization", `Bearer ${token}`).send({ target, currentPassword: "password", acknowledge: true, userId: 999 });
    expect(result.status).toBe(200); expect(mocks.unbind).toHaveBeenCalledWith(user, target);
    expect(result.body.user).not.toHaveProperty("googleSub"); expect(result.body.user).not.toHaveProperty("passwordHash");
  });
  it("rejects concurrent identity changes", async () => {
    mocks.unbind.mockResolvedValue(false);
    expect((await request(app).post("/api/auth/user/me/unbind").set("Authorization", `Bearer ${token}`).send({ target: "email", currentPassword: "password", acknowledge: true })).status).toBe(409);
  });
  it("preserves username/password login after email removal", async () => {
    mocks.find.mockResolvedValue({ ...user, email: "", googleSub: null, emailVerifiedAt: null });
    expect((await request(app).post("/api/auth/user/login").send({ identifier: "client", password: "password" })).status).toBe(200);
  });
  it("does not bypass verification for an email that remains bound", async () => {
    mocks.find.mockResolvedValue({ ...user, emailVerifiedAt: null });
    expect((await request(app).post("/api/auth/user/login").send({ identifier: "client", password: "password" })).status).toBe(403);
  });
  it("prevents Google from automatically rebinding a detached account", async () => {
    const previous = config.auth.googleClientId; config.auth.googleClientId = "test-client";
    mocks.googleEmail.mockResolvedValue({ ...user, googleSub: null, googleLoginDisabled: true });
    try {
      expect((await request(app).post("/api/auth/user/google").send({ credential: "x".repeat(100) })).status).toBe(403);
      expect((await request(app).post("/api/auth/user/google/link").send({ credential: "x".repeat(100), password: "password" })).status).toBe(403);
    } finally { config.auth.googleClientId = previous; }
  });
  it("supports the same password-confirmed action for an admin", async () => {
    mocks.find.mockResolvedValue({ ...user, role: "admin" });
    const admin = createUserToken({ ...user, role: "admin" });
    expect((await request(app).post("/api/auth/user/me/unbind").set("Authorization", `Bearer ${admin}`).send({ target: "email", currentPassword: "password", acknowledge: true })).status).toBe(200);
  });
});
