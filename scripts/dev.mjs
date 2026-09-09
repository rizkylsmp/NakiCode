import { execFile, spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const devStatePath = path.resolve(
  "node_modules/.cache/naki-code/dev-processes.json",
);

await stopPreviousDevSession();

const defaultFrontendPort = readPort(process.env.FRONTEND_PORT, 5173);
const defaultBackendPort = readPort(
  process.env.BACKEND_PORT || process.env.PORT,
  3001,
);

const frontendPort = await findAvailablePort(defaultFrontendPort);
const backendPort = await findAvailablePort(defaultBackendPort, [frontendPort]);
const frontendOrigin = `http://localhost:${frontendPort}`;
const backendOrigin = `http://localhost:${backendPort}`;

console.log(`[dev] Frontend: ${frontendOrigin}`);
console.log(`[dev] Backend:  ${backendOrigin}`);

const children = [
  spawnWorkspace("backend", {
    env: createChildEnv({
      PORT: String(backendPort),
      CLIENT_ORIGIN: frontendOrigin,
      CLIENT_ORIGINS: mergeOrigins(process.env.CLIENT_ORIGINS, [
        frontendOrigin,
        `http://127.0.0.1:${frontendPort}`,
      ]),
    }),
  }),
  spawnWorkspace("frontend", {
    env: createChildEnv({
      VITE_DEV_PORT: String(frontendPort),
      VITE_API_URL: backendOrigin,
    }),
  }),
];

await saveDevState();

let isShuttingDown = false;

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (isShuttingDown) return;

    void shutdown(signal ? 1 : (code ?? 0));
  });
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

function spawnWorkspace(workspace, options) {
  const { command, args } = createNpmDevCommand(workspace);
  const child = spawn(command, args, {
    ...options,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error(`[dev] Failed to start ${workspace}: ${error.message}`);
    void shutdown(1);
  });

  return child;
}

function createNpmDevCommand(workspace) {
  if (process.platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", `npm run dev --workspace ${workspace}`],
    };
  }

  return {
    command: "npm",
    args: ["run", "dev", "--workspace", workspace],
  };
}

async function shutdown(exitCode = 0) {
  if (isShuttingDown) return;

  isShuttingDown = true;
  await stopChildren();
  await stopWorkspacePortProcesses([frontendPort, backendPort]);
  await removeOwnedDevState();
  process.exit(exitCode);
}

async function stopChildren() {
  await Promise.all(
    children
      .filter((child) => child.pid && !child.killed)
      .map((child) => terminateProcessTree(child.pid)),
  );
}

async function stopPreviousDevSession() {
  let state;

  try {
    state = JSON.parse(await readFile(devStatePath, "utf8"));
  } catch {
    return;
  }

  const previousPid = Number(state?.rootPid);
  if (!Number.isInteger(previousPid) || previousPid <= 0 || previousPid === process.pid) {
    await rm(devStatePath, { force: true });
    return;
  }

  if (await isNakiDevProcess(previousPid)) {
    console.log(`[dev] Menghentikan sesi lokal lama (PID ${previousPid}) untuk mereset koneksi database...`);
    await terminateProcessTree(previousPid);
  }

  await stopWorkspacePortProcesses([
    Number(state?.frontendPort),
    Number(state?.backendPort),
  ]);

  await rm(devStatePath, { force: true });
}

async function saveDevState() {
  await mkdir(path.dirname(devStatePath), { recursive: true });
  await writeFile(
    devStatePath,
    JSON.stringify({
      rootPid: process.pid,
      childPids: children.map((child) => child.pid).filter(Boolean),
      frontendPort,
      backendPort,
      startedAt: new Date().toISOString(),
    }),
    "utf8",
  );
}

async function removeOwnedDevState() {
  try {
    const state = JSON.parse(await readFile(devStatePath, "utf8"));
    if (Number(state?.rootPid) === process.pid) {
      await rm(devStatePath, { force: true });
    }
  } catch {
    // State is already gone or unreadable.
  }
}

async function isNakiDevProcess(pid) {
  try {
    if (process.platform === "win32") {
      const { stdout } = await execFileAsync("powershell.exe", [
        "-NoProfile",
        "-Command",
        `(Get-CimInstance Win32_Process -Filter \"ProcessId = ${pid}\").CommandLine`,
      ]);
      return /scripts[\\/]dev\.mjs/i.test(stdout);
    }

    const commandLine = await readFile(`/proc/${pid}/cmdline`, "utf8");
    return /scripts[\\/]dev\.mjs/i.test(commandLine.replaceAll("\0", " "));
  } catch {
    return false;
  }
}

async function stopWorkspacePortProcesses(ports) {
  if (process.platform !== "win32") return;

  const safePorts = ports.filter(
    (port) => Number.isInteger(port) && port > 0 && port < 65535,
  );
  if (safePorts.length === 0) return;

  try {
    const { stdout } = await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-Command",
      `(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(${safePorts.join(",")}) }).OwningProcess | Sort-Object -Unique`,
    ]);
    const pids = stdout
      .split(/\s+/)
      .map(Number)
      .filter((pid) => Number.isInteger(pid) && pid > 0);

    for (const pid of pids) {
      if (await isWorkspaceProcess(pid)) {
        await terminateProcessTree(pid);
      }
    }
  } catch {
    // A port may already be released by the process tree shutdown.
  }
}

async function isWorkspaceProcess(pid) {
  try {
    const { stdout } = await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-Command",
      `(Get-CimInstance Win32_Process -Filter \"ProcessId = ${pid}\").CommandLine`,
    ]);
    return stdout.toLowerCase().includes(process.cwd().toLowerCase());
  } catch {
    return false;
  }
}

async function terminateProcessTree(pid) {
  if (!pid || pid === process.pid) return;

  try {
    if (process.platform === "win32") {
      await execFileAsync("taskkill.exe", ["/PID", String(pid), "/T", "/F"]);
      return;
    }

    process.kill(pid, "SIGTERM");
  } catch {
    // The process may already have stopped.
  }
}

async function findAvailablePort(startPort, reservedPorts = []) {
  let port = startPort;

  while (port < 65535) {
    if (!reservedPorts.includes(port) && (await canUsePort(port))) {
      return port;
    }

    port += 1;
  }

  throw new Error(`No available port found from ${startPort}`);
}

function readPort(value, fallback) {
  const port = Number(value);

  return Number.isInteger(port) && port > 0 && port < 65535 ? port : fallback;
}

function createChildEnv(overrides) {
  return {
    ...sanitizeEnv(process.env),
    ...overrides,
  };
}

function sanitizeEnv(env) {
  return Object.fromEntries(
    Object.entries(env)
      .filter(([key, value]) => key && !key.startsWith("=") && value != null)
      .map(([key, value]) => [key, String(value)]),
  );
}

function canUsePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, "0.0.0.0");
  });
}

function mergeOrigins(existingOrigins, extraOrigins) {
  return [
    ...(existingOrigins || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    ...extraOrigins,
  ]
    .filter((origin, index, origins) => origins.indexOf(origin) === index)
    .join(",");
}
