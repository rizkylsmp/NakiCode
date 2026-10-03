import { beforeEach, describe, expect, it, vi } from "vitest";
const query = vi.hoisted(() => vi.fn());
vi.mock("../db", () => ({ pool: { query } }));
import { unbindUserConnections, findUserById, ensureDefaultAdminUser } from "../models/user.model";
import { config } from "../config";
const user = { id: 7, username: "client", email: "client@example.com", googleSub: "g-id", passwordHash: "hash" } as Awaited<ReturnType<typeof findUserById>> & {};
beforeEach(() => query.mockReset());
describe("unbind persistence", () => {
  it("removes email and Google and invalidates every email OTP atomically", async () => {
    query.mockResolvedValue([{ affectedRows: 1 }]);
    expect(await unbindUserConnections(user, "email")).toBe(true);
    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain("email = NULL"); expect(sql).toContain("google_sub = NULL");
    expect(sql).toContain("google_login_disabled = TRUE"); expect(sql).toContain("password_reset_otp_hash = NULL");
    expect(sql).toContain("password_hash = ? AND email <=> ? AND google_sub <=> ?");
    expect(values).toEqual([7, "hash", "client@example.com", "g-id"]);
  });
  it("keeps email and recovery for Google-only unbind", async () => {
    query.mockResolvedValue([{ affectedRows: 1 }]); await unbindUserConnections(user, "google");
    expect(query.mock.calls[0][0]).not.toContain("email = NULL");
    expect(query.mock.calls[0][0]).not.toContain("password_reset_otp_hash = NULL");
  });
  it("normalizes nullable email without exposing null to legacy consumers", async () => {
    query.mockResolvedValue([[{ id: 7, username: "client", email: null, google_sub: null, google_login_disabled: 1, password_hash: "hash" }]]);
    expect(await findUserById(7)).toMatchObject({ email: "", googleSub: null, googleLoginDisabled: true });
    expect(query.mock.calls[0][0]).toContain("google_login_disabled");
  });
  it("does not promote the new owner of an old administrator email", async () => {
    query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ id: 7 }]]).mockResolvedValueOnce([[{ id: 7, username: "renamed-admin", email: null, role: "admin", password_hash: "hash" }]]);
    expect(await ensureDefaultAdminUser()).toMatchObject({ id: 7, email: "" });
    expect(query.mock.calls.some(([sql]) => sql.includes("SET role"))).toBe(false);
    expect(query.mock.calls.some(([sql]) => sql.includes("WHERE email = ?"))).toBe(false);
  });
  it("never promotes an ordinary user occupying the bootstrap username", async () => {
    query.mockResolvedValueOnce([[{ id: 8, username: config.auth.adminUsername, email: "client@example.com", role: "user", password_hash: "hash" }]]).mockResolvedValueOnce([[]]);
    await expect(ensureDefaultAdminUser()).rejects.toThrow("Bootstrap admin username");
    expect(query).toHaveBeenCalledTimes(2);
  });
});
