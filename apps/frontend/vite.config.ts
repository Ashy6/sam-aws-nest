import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = (env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const proxyTarget = (() => {
    try {
      return new URL(apiBaseUrl).origin;
    } catch {
      return 'http://localhost:3000';
    }
  })();

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
