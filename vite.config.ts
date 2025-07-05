import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Tambahkan konfigurasi optimasi ini
  optimizeDeps: {
    include: ['dagre'], // Pastikan dagre di-pre-bundled
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/], // Memastikan commonjs modules di node_modules diproses
    },
  },
});