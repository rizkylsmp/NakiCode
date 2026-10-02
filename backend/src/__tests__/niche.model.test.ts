import { beforeEach, describe, expect, it, vi } from "vitest";
const query = vi.hoisted(() => vi.fn());
vi.mock("../db", () => ({ pool: { query } }));
import { deleteNiche, resolveNiche, saveNiche } from "../models/niche.model";
beforeEach(() => vi.clearAllMocks());
describe("niche registry", () => {
  it("resolves an existing niche and rejects unregistered values", async () => {
    query.mockResolvedValueOnce([[{ id: 3, name: "Laundry" }]]).mockResolvedValueOnce([[]]);
    expect(await resolveNiche(" Laundry ")).toEqual({ id: 3, name: "Laundry" });
    await expect(resolveNiche("Unknown")).rejects.toMatchObject({ status: 400 });
    expect(await resolveNiche("")).toBeNull();
  });
  it("reports duplicates and protects linked designs using the database constraint", async () => {
    query.mockRejectedValueOnce({ code: "ER_DUP_ENTRY" });
    await expect(saveNiche("Laundry")).rejects.toMatchObject({ status: 409 });
    query.mockRejectedValueOnce({ code: "ER_ROW_IS_REFERENCED_2" });
    await expect(deleteNiche(3)).rejects.toMatchObject({ status: 409 });
  });
});
