import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUserToken } from "../auth";
import { digitalOfficeRouter } from "../routes/digital-office";
import * as model from "../models/digital-office.model";
vi.mock("../config", () => ({
  config: { auth: { tokenSecret: "fixture-secret", tokenTtlSeconds: 3600 } },
}));
vi.mock("../models/digital-office.model", () => ({
  officeRoles: ["strategy", "research", "creative", "operations"],
  identifyOfficeWorker: vi.fn(),
  claimOfficeMission: vi.fn(),
  heartbeatOfficeMission: vi.fn(),
  updateOfficeProgress: vi.fn(),
  listOfficeMissions: vi.fn(),
  listOfficeWorkers: vi.fn(),
  createOfficeMission: vi.fn(),
  submitTelegramMission: vi.fn(),
  expireOfficeLeases: vi.fn(),
  changeOfficeMission: vi.fn(),
  findOfficeMission: vi.fn(),
  createOfficeWorker: vi.fn(),
  revokeOfficeWorker: vi.fn(),
}));
const app = express();
app.use(express.json(), digitalOfficeRouter);
const admin = createUserToken({ id: 7, username: "CEO", role: "admin" });
const user = createUserToken({ id: 8, username: "customer", role: "user" });
const id = "b3b71eaf-0d62-4e48-84e2-6267a85018aa";
const token = "a".repeat(43);
beforeEach(() => vi.resetAllMocks());
describe("Digital Office authorization and lease API", () => {
  it("scopes Telegram submission and status to the paired worker owner", async () => {
    vi.mocked(model.identifyOfficeWorker).mockResolvedValue({
      id,
      owner_id: 7,
    } as never);
    vi.mocked(model.submitTelegramMission).mockResolvedValue({
      id,
      instruction: "Analisis kebutuhan pelanggan NAKI",
    } as never);
    const response = await request(app)
      .post("/worker/telegram/missions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id,
        instruction: "Analisis kebutuhan pelanggan NAKI",
        agent: "research",
      });
    expect(response.status).toBe(200);
    expect(model.submitTelegramMission).toHaveBeenCalledWith(
      7,
      id,
      "Analisis kebutuhan pelanggan NAKI",
      "research",
    );
    vi.mocked(model.findOfficeMission).mockResolvedValue(null);
    expect(
      (
        await request(app)
          .get(`/worker/telegram/missions/${id}`)
          .set("Authorization", `Bearer ${token}`)
      ).status,
    ).toBe(404);
    expect(model.findOfficeMission).toHaveBeenCalledWith(id, 7);
  });
  it("rejects injected Telegram owner/command fields and unauthenticated submission", async () => {
    expect(
      (
        await request(app).post("/worker/telegram/missions").send({
          id,
          instruction: "Analisis kebutuhan pelanggan NAKI",
          agent: "research",
        })
      ).status,
    ).toBe(401);
    vi.mocked(model.identifyOfficeWorker).mockResolvedValue({
      id,
      owner_id: 7,
    } as never);
    expect(
      (
        await request(app)
          .post("/worker/telegram/missions")
          .set("Authorization", `Bearer ${token}`)
          .send({
            id,
            instruction: "Analisis kebutuhan pelanggan NAKI",
            agent: "research",
            ownerId: 99,
            command: "cmd",
          })
      ).status,
    ).toBe(400);
    expect(model.submitTelegramMission).not.toHaveBeenCalled();
  });
  it("rejects guests, customers and worker tokens from admin endpoints", async () => {
    for (const credential of [undefined, user, token]) {
      const req = request(app).get("/");
      if (credential) req.set("Authorization", `Bearer ${credential}`);
      expect((await req).status).toBe(401);
    }
    expect(model.listOfficeMissions).not.toHaveBeenCalled();
  });
  it("scopes history and pairing to the authenticated CEO", async () => {
    vi.mocked(model.listOfficeMissions).mockResolvedValue([]);
    vi.mocked(model.listOfficeWorkers).mockResolvedValue([]);
    expect(
      (await request(app).get("/").set("Authorization", `Bearer ${admin}`))
        .status,
    ).toBe(200);
    expect(model.listOfficeMissions).toHaveBeenCalledWith(7);
    await request(app)
      .post("/workers")
      .set("Authorization", `Bearer ${admin}`)
      .send({ name: "CEO PC" });
    expect(model.createOfficeWorker).toHaveBeenCalledWith(7, "CEO PC");
  });
  it("validates briefs and refuses remote executable/config injection", async () => {
    expect(
      (
        await request(app)
          .post("/missions")
          .set("Authorization", `Bearer ${admin}`)
          .send({ instruction: "short", priority: "Normal" })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post("/workers")
          .set("Authorization", `Bearer ${admin}`)
          .send({ name: "PC", command: "shell" })
      ).status,
    ).toBe(400);
    expect(model.createOfficeMission).not.toHaveBeenCalled();
  });
  it("rejects desktop/admin tokens as worker credentials and revoked tokens", async () => {
    expect(
      (
        await request(app)
          .post("/worker/claim")
          .set("Authorization", `Bearer ${admin}`)
          .send({})
      ).status,
    ).toBe(401);
    vi.mocked(model.identifyOfficeWorker).mockResolvedValue(null);
    expect(
      (
        await request(app)
          .post("/worker/claim")
          .set("Authorization", `Bearer ${token}`)
          .send({})
      ).status,
    ).toBe(401);
    expect(model.claimOfficeMission).not.toHaveBeenCalled();
  });
  it("takes ownership from hashed worker identity, not a supplied owner", async () => {
    vi.mocked(model.identifyOfficeWorker).mockResolvedValue({
      id,
      owner_id: 7,
    } as never);
    vi.mocked(model.claimOfficeMission).mockResolvedValue(null);
    expect(
      (
        await request(app)
          .post("/worker/claim")
          .set("Authorization", `Bearer ${token}`)
          .send({ ownerId: 8 })
      ).status,
    ).toBe(200);
    expect(model.claimOfficeMission).toHaveBeenCalledWith(id, 7);
  });
  it("returns conflict for cancelled, expired and outdated worker updates", async () => {
    vi.mocked(model.identifyOfficeWorker).mockResolvedValue({
      id,
      owner_id: 7,
    } as never);
    vi.mocked(model.heartbeatOfficeMission).mockResolvedValue(false);
    vi.mocked(model.updateOfficeProgress).mockResolvedValue(false);
    expect(
      (
        await request(app)
          .post(`/worker/${id}/heartbeat`)
          .set("Authorization", `Bearer ${token}`)
          .send({ leaseToken: id })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .patch(`/worker/${id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ leaseToken: id, status: "complete", report: "draft" })
      ).status,
    ).toBe(409);
    expect(model.updateOfficeProgress).toHaveBeenCalledWith(
      id,
      id,
      7,
      expect.objectContaining({ leaseToken: id }),
    );
  });
  it("validates results and preserves mission ownership on cancellation", async () => {
    vi.mocked(model.identifyOfficeWorker).mockResolvedValue({
      id,
      owner_id: 7,
    } as never);
    expect(
      (
        await request(app)
          .patch(`/worker/${id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ leaseToken: id, report: "a".repeat(60001) })
      ).status,
    ).toBe(400);
    vi.mocked(model.changeOfficeMission).mockResolvedValue(false);
    expect(
      (
        await request(app)
          .post(`/missions/${id}/cancel`)
          .set("Authorization", `Bearer ${admin}`)
      ).status,
    ).toBe(409);
    expect(model.changeOfficeMission).toHaveBeenCalledWith(id, 7, "cancel");
  });
});
