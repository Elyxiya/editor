import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lowcode/types': path.resolve(__dirname, '../../packages/types/src'),
      '@lowcode/schema': path.resolve(__dirname, '../../packages/schema/src'),
      '@lowcode/components': path.resolve(__dirname, '../../packages/components/src'),
    },
  },
  server: { port: 3001, host: true },
  build: { sourcemap: true },
});
