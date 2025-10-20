import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@zama-fhe/relayer-sdk': path.resolve(__dirname, '../node_modules/@zama-fhe/relayer-sdk/lib/web.js'),
    },
  },
  optimizeDeps: {
    include: ['@zama-fhe/relayer-sdk'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
});
