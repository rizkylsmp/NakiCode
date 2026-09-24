import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => vi.fn());

vi.mock("../db", () => ({
  pool: { query },
}));

import { linkGoogleIdentity } from "../models/user.model";

describe("linkGoogleIdentity", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("links Google exactly once", async () => {
    query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await expect(linkGoogleIdentity(12, "google-sub-12")).resolves.toBe(true);
  });

  it("accepts an idempotent retry for the same Google identity", async () => {
    query
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([
        [
          {
            id: 12,
            username: "buyer",
            email: "buyer@example.com",
            google_sub: "google-sub-12",
            password_hash: "scrypt:salt:hash",
            role: "user",
          },
        ],
      ]);

    await expect(linkGoogleIdentity(12, "google-sub-12")).resolves.toBe(true);
  });

  it("rejects a Google identity already owned by another account", async () => {
    query.mockRejectedValueOnce({ code: "ER_DUP_ENTRY" });

    await expect(linkGoogleIdentity(12, "claimed-google-sub")).resolves.toBe(
      false,
    );
  });
});
