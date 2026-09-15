import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => vi.fn());

vi.mock("../db", () => ({ pool: { query } }));

describe("template model slug lifecycle", () => {
  beforeEach(() => {
    query.mockReset();
    query.mockResolvedValue([{ affectedRows: 1 }]);
  });

  it("releases a slug held by a soft-deleted design", async () => {
    const { releaseDeletedTemplateSlug } = await import(
      "../models/design.model"
    );

    await releaseDeletedTemplateSlug("naki-nightfall");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE slug = ? AND deleted_at IS NOT NULL"),
      ["naki-nightfall"],
    );
  });

  it("renames the slug while soft-deleting a design", async () => {
    const { deleteTemplate } = await import("../models/design.model");

    await expect(deleteTemplate(3)).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("SET slug = CONCAT('__deleted__'"),
      [3],
    );
  });
});
