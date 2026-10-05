import { spawn } from "node:child_process";
import {
  access,
  mkdtemp,
  readFile,
  writeFile,
  rm,
  readdir,
  stat,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { z } from "zod";

export const workerConfigSchema = z
  .object({
    apiUrl: z
      .string()
      .url()
      .refine((value) => {
        const url = new URL(value);
        return (
          !url.username &&
          !url.password &&
          !url.search &&
          !url.hash &&
          (url.protocol === "https:" ||
            (url.protocol === "http:" &&
              ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
        );
      }, "Gunakan HTTPS, atau HTTP localhost."),
    token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    codexExecutable: z.string().optional(),
    engine: z.enum(["codex", "hermes"]).default("codex"),
    hermesPython: z.string().optional(),
    hermesHome: z.string().optional(),
  })
  .strict();

export async function findCodexExecutable(explicit?: string): Promise<string> {
  if (explicit) {
    await access(explicit);
    return explicit;
  }
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    const root = path.join(process.env.LOCALAPPDATA, "OpenAI", "Codex", "bin");
    try {
      const entries = await readdir(root, { withFileTypes: true });
      const candidates = await Promise.all(
        entries
          .filter((entry) => entry.isDirectory())
          .map(async (entry) => {
            const executable = path.join(root, entry.name, "codex.exe");
            try {
              return { executable, time: (await stat(executable)).mtimeMs };
            } catch {
              return null;
            }
          }),
      );
      const latest = candidates
        .filter((candidate) => candidate !== null)
        .sort((a, b) => b.time - a.time)[0];
      if (latest) return latest.executable;
    } catch {
      /* Use standalone CLI when desktop is unavailable. */
    }
  }
  const target =
    process.platform === "win32"
      ? `${process.arch}-pc-windows-msvc`
      : process.platform === "darwin"
        ? `${process.arch === "arm64" ? "aarch64" : "x86_64"}-apple-darwin`
        : `${process.arch === "arm64" ? "aarch64" : "x86_64"}-unknown-linux-musl`;
  const triple = target
    .replace(/^x64-/, "x86_64-")
    .replace(/^arm64-/, "aarch64-");
  const binary = process.platform === "win32" ? "codex.exe" : "codex";
  for (const directory of (process.env.PATH || "").split(path.delimiter)) {
    const candidates = [
      path.join(directory, binary),
      path.join(
        directory,
        "node_modules",
        "@openai",
        "codex",
        "vendor",
        triple,
        "codex",
        binary,
      ),
      path.join(
        directory,
        "node_modules",
        "@openai",
        "codex",
        "node_modules",
        `@openai/codex-${process.platform === "win32" ? "win32" : process.platform}-${process.arch}`,
        "vendor",
        triple,
        "codex",
        binary,
      ),
    ];
    for (const candidate of candidates) {
      try {
        await access(candidate);
        return candidate;
      } catch {
        /* Next installation location. */
      }
    }
  }
  throw new Error(
    "Codex CLI tidak ditemukan. Pasang CLI atau isi codexExecutable pada konfigurasi worker.",
  );
}

const results = {
  agent: z
    .object({ steps: z.array(z.string().min(1).max(8000)).min(1).max(20) })
    .strict(),
  manager: z.object({ report: z.string().min(1).max(60000) }).strict(),
};

// Jobs use a fresh temporary directory, read-only tools, no desktop sessions or project credentials.
export async function generateCodex(
  executable: string,
  prompt: string,
  kind: "agent" | "manager",
  signal: AbortSignal,
) {
  const directory = await mkdtemp(path.join(tmpdir(), "naki-office-"));
  const schemaPath = path.join(directory, "schema.json");
  const outputPath = path.join(directory, "output.json");
  const schema =
    kind === "agent"
      ? {
          type: "object",
          properties: {
            steps: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 20,
            },
          },
          required: ["steps"],
          additionalProperties: false,
        }
      : {
          type: "object",
          properties: { report: { type: "string" } },
          required: ["report"],
          additionalProperties: false,
        };
  await writeFile(schemaPath, JSON.stringify(schema));
  const environment = { ...process.env };
  for (const key of Object.keys(environment)) {
    if (
      /^(OFFICE_|MYSQL_|SMTP_|ADMIN_|REDIS_|CLOUDINARY_|MIDTRANS_|WHATSAPP_)/.test(
        key,
      )
    )
      delete environment[key];
  }
  try {
    if (signal.aborted) throw new Error("Pekerjaan dibatalkan.");
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        executable,
        [
          "exec",
          "--ignore-user-config",
          "--ephemeral",
          "--sandbox",
          "read-only",
          "--skip-git-repo-check",
          "--cd",
          directory,
          "--output-schema",
          schemaPath,
          "--output-last-message",
          outputPath,
          "--color",
          "never",
          "--json",
          "-",
        ],
        {
          shell: false,
          windowsHide: true,
          env: environment,
          stdio: ["pipe", "ignore", "pipe"],
        },
      );
      let timeout = false;
      // Diagnostics stay local and are intentionally not published to the website.
      child.stderr.resume();
      child.stdin.on("error", () => {});
      child.stdin.end(prompt);
      const stop = () => {
        if (process.platform === "win32" && child.pid) {
          spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], {
            shell: false,
            windowsHide: true,
            stdio: "ignore",
          });
        } else child.kill("SIGKILL");
      };
      const timer = setTimeout(() => {
        timeout = true;
        stop();
      }, 5 * 60_000);
      signal.addEventListener("abort", stop, { once: true });
      const cleanup = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", stop);
      };
      child.once("error", () => {
        cleanup();
        reject(new Error("Codex CLI tidak dapat dimulai."));
      });
      child.once("close", (code) => {
        cleanup();
        if (signal.aborted)
          reject(new Error("Pekerjaan dibatalkan atau lease worker terputus."));
        else if (timeout)
          reject(new Error("Codex melewati batas waktu lima menit."));
        else if (code !== 0)
          reject(
            new Error(
              "Codex gagal. Periksa login CLI dan koneksi internet komputer.",
            ),
          );
        else resolve();
      });
    });
    return results[kind].parse(JSON.parse(await readFile(outputPath, "utf8")));
  } finally {
    // directory is a literal mkdtemp child, never a user-selected location.
    await rm(directory, { recursive: true, force: true });
  }
}
