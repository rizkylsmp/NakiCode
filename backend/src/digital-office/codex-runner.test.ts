import { describe, expect, it } from "vitest";
import { workerConfigSchema } from "./codex-runner";
describe("outbound worker configuration", () => {
  const token = "a".repeat(43);
  it("requires TLS for remote servers and permits local development", () => {
    expect(
      workerConfigSchema.safeParse({ apiUrl: "https://example.com", token })
        .success,
    ).toBe(true);
    expect(
      workerConfigSchema.safeParse({ apiUrl: "http://127.0.0.1:3001", token })
        .success,
    ).toBe(true);
    for (const apiUrl of [
      "http://example.com",
      "file:///tmp/data",
      "https://user:password@example.com",
      "https://example.com?token=value",
    ])
      expect(workerConfigSchema.safeParse({ apiUrl, token }).success).toBe(
        false,
      );
  });
  it("rejects shell fields and malformed pairing tokens", () => {
    expect(
      workerConfigSchema.safeParse({
        apiUrl: "https://example.com",
        token,
        shell: "cmd",
      }).success,
    ).toBe(false);
    expect(
      workerConfigSchema.safeParse({
        apiUrl: "https://example.com",
        token: "short",
      }).success,
    ).toBe(false);
  });
});
