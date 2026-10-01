import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  getConnection: vi.fn(),
  hashPassword: vi.fn(),
  createOrder: vi.fn(),
}));
vi.mock("../db", () => ({
  pool: { query: mocks.query, getConnection: mocks.getConnection },
}));
vi.mock("../auth", () => ({ hashPassword: mocks.hashPassword }));
vi.mock("../models/order.model", () => ({
  createOrder: mocks.createOrder,
  normalizeOrderPayload: (input: object, userId: number) => ({
    ...input,
    userId,
  }),
}));
import {
  claimClientInvitation,
  createClientOrder,
  inspectClientInvitation,
  invitationTokenHash,
  renewClientInvitation,
} from "../models/client-invitation.model";
const token = "a".repeat(43);
const invitation = {
  id: 1,
  order_id: 23,
  email: "client@example.com",
  customer_name: "Client",
  design_title: "Company site",
  expires_at: new Date(Date.now() + 1000000),
  used_at: null,
  deleted_at: null,
  user_id: null,
};
const account = {
  id: 7,
  username: "client",
  email: invitation.email,
  role: "user",
};
const connection = {
  query: mocks.query,
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getConnection.mockResolvedValue(connection);
  mocks.hashPassword.mockResolvedValue("hash");
  mocks.createOrder.mockResolvedValue({ id: 23 });
});
function queries(user: object | null = null, row: object = invitation) {
  mocks.query.mockImplementation(async (sql: string) => {
    if (sql.includes("FROM order_client_invitations")) return [[row]];
    if (sql.includes("FROM users")) return [user ? [user] : []];
    if (sql.includes("INSERT INTO users")) return [{ insertId: 8 }];
    return [{ affectedRows: 1 }];
  });
}
describe("client order invitations", () => {
  it("stores only a SHA-256 token hash and rejects malformed tokens", () => {
    expect(invitationTokenHash(token)).toHaveLength(64);
    expect(invitationTokenHash(token)).not.toBe(token);
    expect(() => invitationTokenHash("short")).toThrow();
  });
  it("creates a guest order and private, expiring invitation atomically", async () => {
    queries();
    const result = await createClientOrder({
      email: invitation.email,
      customerName: "Client",
      customerContact: "62812345",
      projectTitle: "Company site",
      budgetRange: "Rp 3Jt - Rp 5Jt",
      message: "Build a company site",
    });
    expect(result.token).toHaveLength(43);
    expect(result.existingAccount).toBe(false);
    expect(mocks.createOrder.mock.calls[0][0].userId).toBeNull();
    const insert = mocks.query.mock.calls.find(([sql]) =>
      sql.includes("INSERT INTO order_client_invitations"),
    );
    expect(insert?.[1]).not.toContain(result.token);
    expect(connection.commit).toHaveBeenCalledOnce();
  });
  it("links an existing account without generating an invitation or password", async () => {
    queries(account);
    const result = await createClientOrder({
      email: invitation.email,
      customerName: "Client",
      customerContact: "62812345",
      projectTitle: "Company site",
      budgetRange: "Rp 3Jt - Rp 5Jt",
      message: "Build a company site",
    });
    expect(result.token).toBeNull();
    expect(mocks.createOrder.mock.calls[0][0].userId).toBe(7);
    expect(mocks.hashPassword).not.toHaveBeenCalled();
  });
  it.each([
    { ...invitation, used_at: new Date() },
    { ...invitation, expires_at: new Date(0) },
    { ...invitation, deleted_at: new Date() },
    { ...invitation, user_id: 7 },
  ])("rejects unavailable invitations without mutation", async (row) => {
    queries(null, row);
    await expect(
      claimClientInvitation(token, "Password-strong", null),
    ).rejects.toThrow();
    expect(connection.commit).not.toHaveBeenCalled();
    expect(
      mocks.query.mock.calls.some(([sql]) => sql.startsWith("UPDATE orders")),
    ).toBe(false);
  });
  it("prevents takeover of an account registered after invitation creation", async () => {
    queries(account);
    await expect(
      claimClientInvitation(token, "NewPassword-strong", {
        userId: 999,
        role: "user",
        sub: "other",
        exp: 9999999999,
      }),
    ).rejects.toThrow("Login");
    expect(
      mocks.query.mock.calls.some(
        ([sql]) =>
          sql.includes("INSERT INTO users") || sql.includes("UPDATE users"),
      ),
    ).toBe(false);
    expect(connection.rollback).toHaveBeenCalledOnce();
  });
  it("lets only the matching existing user claim the order without changing their password", async () => {
    queries(account);
    const result = await claimClientInvitation(token, undefined, {
      userId: 7,
      role: "user",
      sub: "client",
      exp: 9999999999,
    });
    expect(result.user.id).toBe(7);
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(
      mocks.query.mock.calls.some(([sql]) =>
        sql.includes("UPDATE order_client_invitations"),
      ),
    ).toBe(true);
  });
  it("creates, binds and consumes a new client account in one transaction", async () => {
    queries();
    const result = await claimClientInvitation(token, "Password-strong", null);
    expect(result.user.id).toBe(8);
    expect(
      mocks.query.mock.calls.find(([sql]) =>
        sql.includes("UPDATE orders"),
      )?.[1],
    ).toEqual([8, 23]);
    expect(
      mocks.query.mock.calls.find(([sql]) =>
        sql.includes("FROM order_client_invitations"),
      )?.[0],
    ).toContain("FOR UPDATE");
    expect(connection.commit).toHaveBeenCalledOnce();
  });
  it("rolls back races instead of creating a duplicate account", async () => {
    queries();
    mocks.query
      .mockImplementationOnce(async () => [[invitation]])
      .mockImplementationOnce(async () => [[]])
      .mockRejectedValueOnce({ code: "ER_DUP_ENTRY" });
    await expect(
      claimClientInvitation(token, "Password-strong", null),
    ).rejects.toThrow("Login");
    expect(connection.rollback).toHaveBeenCalledOnce();
  });
  it("inspection exposes only masked email and no private token", async () => {
    queries();
    const result = await inspectClientInvitation(token);
    expect(result.emailHint).toBe("cl***@example.com");
    expect(JSON.stringify(result)).not.toContain(token);
  });
  it("renews an unclaimed invitation by replacing the old token hash", async () => {
    queries();
    const result = await renewClientInvitation(23);
    expect(result.token).toHaveLength(43);
    expect(result.token).not.toBe(token);
    const update = mocks.query.mock.calls.find(([sql]) =>
      sql.includes("SET token_hash"),
    );
    expect(update?.[1][0]).toBe(invitationTokenHash(result.token));
    expect(update?.[1]).not.toContain(result.token);
    expect(connection.commit).toHaveBeenCalledOnce();
  });
  it("cannot renew an invitation after the order has been claimed", async () => {
    queries(null, { ...invitation, user_id: 7, used_at: new Date() });
    await expect(renewClientInvitation(23)).rejects.toThrow();
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(
      mocks.query.mock.calls.some(([sql]) => sql.includes("SET token_hash")),
    ).toBe(false);
  });
});
