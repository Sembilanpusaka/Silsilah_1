// Silsilah_1/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'; // <--- Tambahkan ini untuk menggunakan 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { // <--- Tambahkan blok 'resolve' ini
    alias: {
      // Ini memberitahu Rollup untuk memetakan '@supabase/supabase-js'
      // ke jalur sebenarnya di node_modules
      '@supabase/supabase-js': path.resolve(__dirname, 'node_modules/@supabase/supabase-js'),
    },
  },
  // Pastikan tidak ada properti 'build' lainnya yang tidak standar
})