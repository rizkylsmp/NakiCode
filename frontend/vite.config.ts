import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import net from 'node:net';
import path from 'node:path';
import { defineConfig, type ResolvedConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

const preferredDevPort = readPort(process.env.VITE_DEV_PORT, 5173);
const apiTarget = process.env.VITE_API_URL || 'http://localhost:3001';

export default defineConfig(async ({ mode }) => {
  const devPort = await findAvailablePort(preferredDevPort);

  return {
    plugins: [
      react({ jsxImportSource: '@naki/i18n' }),
      {
        name: 'naki-local-i18n-runtime',
        enforce: 'post' as const,
        configResolved(config: ResolvedConfig) {
          // plugin-react explicitly adds both JSX runtimes to include; remove
          // our local runtime so it cannot bundle a second LanguageContext.
          config.optimizeDeps.include = config.optimizeDeps.include?.filter((id) => !id.startsWith('@naki/i18n/'));
        },
      },
      tailwindcss(),
      mode === 'analyze'
        ? visualizer({
            filename: 'dist/bundle-stats.html',
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
          })
        : null,
    ].filter(Boolean),
    resolve: { alias: { '@naki/i18n': path.resolve(__dirname, 'src/i18n') } },
    // Keep the local JSX runtime in the same module graph as LanguageProvider.
    // Prebundling it would create a second, disconnected language context in dev.
    optimizeDeps: { exclude: ['@naki/i18n/jsx-runtime', '@naki/i18n/jsx-dev-runtime'] },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (id.includes('node_modules')) {
              const normalizedId = id.replace(/\\/g, '/');

              if (normalizedId.includes('/lucide-react/')) {
                return 'ui-vendor';
              }
              if (normalizedId.includes('/@sentry/')) {
                return 'sentry-vendor';
              }
              if (
                normalizedId.includes('/recharts/') ||
                normalizedId.includes('/d3-') ||
                normalizedId.includes('/es-toolkit/')
              ) {
                return 'charts-vendor';
              }
              if (normalizedId.includes('/zxcvbn/')) {
                return 'password-vendor';
              }
              if (normalizedId.includes('/@tanstack/')) {
                return 'query-vendor';
              }
              if (normalizedId.includes('/axios/')) {
                return 'http-vendor';
              }
              if (
                normalizedId.includes('/react/') ||
                normalizedId.includes('/react-dom/') ||
                normalizedId.includes('/react-router') ||
                normalizedId.includes('/scheduler/')
              ) {
                return 'react-vendor';
              }
            }
          },
        },
      },
    },
    server: {
      port: devPort,
      strictPort: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
      proxy: {
        '/api': apiTarget,
        '/uploads': apiTarget,
      },
    },
  };
});

async function findAvailablePort(startPort: number) {
  for (let port = startPort; port < 65535; port += 1) {
    if (!(await isPortInUse(port)) && (await canBindPort(port))) {
      return port;
    }
  }

  throw new Error(`No available port found from ${startPort}`);
}

async function isPortInUse(port: number) {
  return (await canConnect(port, '127.0.0.1')) || (await canConnect(port, '::1'));
}

function canConnect(port: number, host: string) {
  return new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ port, host });
    let settled = false;

    const finish = (isConnected: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(isConnected);
    };

    socket.setTimeout(200, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

function canBindPort(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '0.0.0.0');
  });
}

function readPort(value: string | undefined, fallback: number) {
  const port = Number(value);

  return Number.isInteger(port) && port > 0 && port < 65535 ? port : fallback;
}
