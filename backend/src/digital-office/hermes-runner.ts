import { spawn } from "node:child_process";
import { access, mkdir, open } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const hermesRoles = ["manager", "strategy", "research", "creative", "operations"] as const;
export type HermesRole = typeof hermesRoles[number];
const results = {
  agent: z.object({ steps: z.array(z.string().min(1).max(8000)).min(1).max(20) }).strict(),
  manager: z.object({ report: z.string().min(1).max(60000) }).strict(),
};
export function parseHermesResult(text: string, kind: "agent" | "manager") {
  const clean = text.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/, "$1");
  return results[kind].parse(JSON.parse(clean));
}
export function hermesEnvironment(home: string) {
  const allowed = new Set(["PATH", "PATHEXT", "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "COMSPEC", "USERPROFILE", "HOMEDRIVE", "HOMEPATH", "HOME", "LOCALAPPDATA", "APPDATA", "PROGRAMDATA", "PROGRAMFILES", "PROGRAMFILES(X86)", "COMMONPROGRAMFILES", "TEMP", "TMP", "LANG", "LC_ALL", "SSL_CERT_FILE", "SSL_CERT_DIR"]);
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => allowed.has(key.toUpperCase())));
  return { ...env, HERMES_HOME: home, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" };
}
export async function findHermesPython(explicit?: string) {
  const executable = explicit || path.join(process.env.LOCALAPPDATA || "", "hermes", "hermes-agent", "venv", "Scripts", "python.exe");
  await access(executable);
  return executable;
}
export async function generateHermes(
  python: string, homeRoot: string, helper: string, role: HermesRole,
  prompt: string, kind: "agent" | "manager", signal: AbortSignal,
) {
  if (!hermesRoles.includes(role)) throw new Error("Peran Hermes tidak valid.");
  const home = path.join(homeRoot, "profiles", `naki-${role}`);
  await access(path.join(home, "config.yaml"));
  await mkdir(home, { recursive: true });
  // One writer per profile. A stale lock requires operator inspection, never auto-delete.
  const lockPath = path.join(home, "office.lock");
  const lock = await open(lockPath, "wx").catch(() => { throw new Error("Profil Hermes sedang dipakai. Periksa worker lain atau office.lock."); });
  try {
    await lock.writeFile(String(process.pid));
    if (signal.aborted) throw new Error("Pekerjaan dibatalkan.");
    const text = await new Promise<string>((resolve, reject) => {
      const child = spawn(python, [helper], {
        cwd: home, shell: false, windowsHide: true, env: hermesEnvironment(home),
        stdio: ["pipe", "pipe", "pipe"],
      });
      let output = ""; let failure = "";
      const stop = () => {
        if (process.platform === "win32" && child.pid)
          spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { shell: false, windowsHide: true, stdio: "ignore" });
        else child.kill("SIGKILL");
      };
      child.stderr.resume(); // Never return provider diagnostics or credentials to the API.
      child.stdin.on("error", () => {});
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        if (failure) return;
        output += chunk;
        if (Buffer.byteLength(output) > 256_000) { failure = "Hasil Hermes terlalu besar."; stop(); }
      });
      child.stdin.end(JSON.stringify({ prompt: `${prompt}\nKembalikan hanya JSON valid tanpa code fence. Simpan hanya konteks CEO yang stabil ke memory; jangan menyimpan secret atau menyalin seluruh laporan ke memory.` }));
      const timer = setTimeout(() => { failure = "Hermes melewati batas waktu lima menit."; stop(); }, 300_000);
      signal.addEventListener("abort", stop, { once: true });
      if (signal.aborted) stop();
      const cleanup = () => { clearTimeout(timer); signal.removeEventListener("abort", stop); };
      child.once("error", () => { cleanup(); reject(new Error("Hermes tidak dapat dimulai.")); });
      child.once("close", (code) => {
        cleanup();
        if (signal.aborted) reject(new Error("Pekerjaan dibatalkan atau lease terputus."));
        else if (failure) reject(new Error(failure));
        else if (code !== 0) reject(new Error("Hermes gagal. Periksa provider dan koneksi di komputer."));
        else resolve(output);
      });
    });
    try { return parseHermesResult(text, kind); }
    catch { throw new Error("Format hasil Hermes tidak valid; hasil tidak diterbitkan."); }
  } finally {
    await lock.close();
    const { unlink } = await import("node:fs/promises");
    await unlink(lockPath);
  }
}
