import { spawn } from "node:child_process";
import net from "node:net";

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

let isShuttingDown = false;

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (isShuttingDown) return;

    isShuttingDown = true;
    stopChildren();

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());

function spawnWorkspace(workspace, options) {
  const { command, args } = createNpmDevCommand(workspace);
  const child = spawn(command, args, {
    ...options,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error(`[dev] Failed to start ${workspace}: ${error.message}`);
    shutdown(1);
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

function shutdown(exitCode = 0) {
  if (isShuttingDown) return;

  isShuttingDown = true;
  stopChildren();
  process.exit(exitCode);
}

function stopChildren() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
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
