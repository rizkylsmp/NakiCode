import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { generateHermes, hermesEnvironment, parseHermesResult } from "./hermes-runner";
describe("Hermes office adapter", () => {
  it("validates JSON and optional fenced JSON without accepting diagnostics or arbitrary fields", () => {
    expect(parseHermesResult('{"steps":["Draft konkret"]}', "agent")).toEqual({ steps: ["Draft konkret"] });
    expect(parseHermesResult('```json\n{"report":"Laporan CEO"}\n```', "manager")).toEqual({ report: "Laporan CEO" });
    for (const text of ['{"steps":[]}', '{"report":""}', '{"report":"OK","command":"delete"}', 'Error provider\n{"report":"OK"}'])
      expect(() => parseHermesResult(text, "manager")).toThrow();
  });
  it("does not forward application secrets or inherited Hermes modes", () => {
    const prior = { ...process.env };
    try {
      Object.assign(process.env, { MYSQL_PASSWORD: "private", OFFICE_TOKEN: "private", HERMES_YOLO_MODE: "1", HERMES_HOME: "other", OPENAI_API_KEY: "other", TELEGRAM_BOT_TOKEN: "other", CUSTOM_PRIVATE_KEY: "other" });
      const env = hermesEnvironment("isolated-profile");
      expect(env.HERMES_HOME).toBe("isolated-profile");
      for (const key of ["MYSQL_PASSWORD", "OFFICE_TOKEN", "HERMES_YOLO_MODE", "OPENAI_API_KEY", "TELEGRAM_BOT_TOKEN", "CUSTOM_PRIVATE_KEY"]) expect(env).not.toHaveProperty(key);
    } finally { process.env = prior; }
  });
  it("passes literal briefs through stdin, isolates roles and refuses a second writer", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "hermes-office-test-"));
    try {
      const home = path.join(root, "profiles", "naki-manager");
      await mkdir(home, { recursive: true });
      await writeFile(path.join(home, "config.yaml"), "model: test\n");
      const helper = path.join(root, "fake.cjs");
      await writeFile(helper, `let s=''; process.stdin.on('data', c=>s+=c); process.stdin.on('end',()=>{const p=JSON.parse(s).prompt; console.log(JSON.stringify({report:process.env.HERMES_HOME+'|'+p}));});`);
      const brief = 'literal $(echo secret) `command` "quotes"';
      const output = await generateHermes(process.execPath, root, helper, "manager", brief, "manager", new AbortController().signal);
      expect("report" in output && output.report).toContain(home + "|" + brief);
      await expect(access(path.join(home, "office.lock"))).rejects.toThrow();
      await writeFile(path.join(home, "office.lock"), "other-writer");
      await expect(generateHermes(process.execPath, root, helper, "manager", brief, "manager", new AbortController().signal)).rejects.toThrow(/sedang dipakai/);
      expect(await readFile(path.join(home, "office.lock"), "utf8")).toBe("other-writer");
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  it("cleans its profile lock after cancellation before starting any model", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "hermes-office-test-"));
    try {
      const home = path.join(root, "profiles", "naki-research");
      await mkdir(home, { recursive: true });
      await writeFile(path.join(home, "config.yaml"), "model: test\n");
      const controller = new AbortController(); controller.abort();
      await expect(generateHermes(process.execPath, root, "unused", "research", "test", "agent", controller.signal)).rejects.toThrow(/dibatalkan/);
      await expect(access(path.join(home, "office.lock"))).rejects.toThrow();
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
