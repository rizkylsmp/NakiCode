import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
export default defineConfig(({ mode }) => ({
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
        port: 5173,
        proxy: {
            '/api': 'http://localhost:3001',
            '/uploads': 'http://localhost:3001',
        },
    },
}));
