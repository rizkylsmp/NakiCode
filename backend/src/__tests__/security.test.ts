import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("production CORS", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalClientOrigin = process.env.CLIENT_ORIGIN;
  const originalClientOrigins = process.env.CLIENT_ORIGINS;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.CLIENT_ORIGIN = originalClientOrigin;
    process.env.CLIENT_ORIGINS = originalClientOrigins;
    vi.resetModules();
  });

  it("allows the canonical www storefront origin", async () => {
    process.env.NODE_ENV = "production";
    process.env.CLIENT_ORIGIN = "https://www.nakicode.xyz/";
    process.env.CLIENT_ORIGINS = "https://nakicode.xyz";
    vi.resetModules();
    const { corsMiddleware } = await import("../security");
    const app = express();
    app.use(corsMiddleware);
    app.options("/api/uploads/video/signature", (_request, response) => {
      response.sendStatus(204);
    });

    const response = await request(app)
      .options("/api/uploads/video/signature")
      .set("Origin", "https://www.nakicode.xyz")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "authorization,content-type");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://www.nakicode.xyz",
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });
});
