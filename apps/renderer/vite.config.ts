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
      '@lowcode/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@lowcode/codegen': path.resolve(__dirname, '../../packages/codegen/src'),
      '@lowcode/logic-engine': path.resolve(__dirname, '../../packages/logic-engine/src'),
      '@lowcode/datasource': path.resolve(__dirname, '../../packages/datasource/src'),
      '@lowcode/events': path.resolve(__dirname, '../../packages/events/src'),
    },
  },
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: { sourcemap: true },
});
