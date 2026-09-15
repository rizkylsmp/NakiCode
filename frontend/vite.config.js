import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import net from 'node:net';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
const preferredDevPort = readPort(process.env.VITE_DEV_PORT, 5173);
const apiTarget = process.env.VITE_API_URL || 'http://localhost:3001';
export default defineConfig(async ({ mode }) => {
    const devPort = await findAvailablePort(preferredDevPort);
    return {
        plugins: [
            react(),
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
        build: {
            rollupOptions: {
                output: {
                    manualChunks: (id) => {
                        if (id.includes('node_modules')) {
                            const normalizedId = id.replace(/\\/g, '/');
                            if (normalizedId.includes('/lucide-react/')) {
                                return 'ui-vendor';
                            }
                            if (normalizedId.includes('/@sentry/')) {
                                return 'sentry-vendor';
                            }
                            if (normalizedId.includes('/recharts/') ||
                                normalizedId.includes('/d3-') ||
                                normalizedId.includes('/es-toolkit/')) {
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
                            if (normalizedId.includes('/react/') ||
                                normalizedId.includes('/react-dom/') ||
                                normalizedId.includes('/react-router') ||
                                normalizedId.includes('/scheduler/')) {
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
async function findAvailablePort(startPort) {
    for (let port = startPort; port < 65535; port += 1) {
        if (!(await isPortInUse(port)) && (await canBindPort(port))) {
            return port;
        }
    }
    throw new Error(`No available port found from ${startPort}`);
}
async function isPortInUse(port) {
    return (await canConnect(port, '127.0.0.1')) || (await canConnect(port, '::1'));
}
function canConnect(port, host) {
    return new Promise((resolve) => {
        const socket = net.createConnection({ port, host });
        let settled = false;
        const finish = (isConnected) => {
            if (settled)
                return;
            settled = true;
            socket.destroy();
            resolve(isConnected);
        };
        socket.setTimeout(200, () => finish(false));
        socket.once('connect', () => finish(true));
        socket.once('error', () => finish(false));
    });
}
function canBindPort(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => server.close(() => resolve(true)));
        server.listen(port, '0.0.0.0');
    });
}
function readPort(value, fallback) {
    const port = Number(value);
    return Number.isInteger(port) && port > 0 && port < 65535 ? port : fallback;
}
