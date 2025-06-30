/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",             // Memindai file HTML utama
    "./App.tsx",                // Memindai komponen App di root
    "./index.tsx",              // Memindai entrypoint index.tsx di root
    "./components/**/*.{js,ts,jsx,tsx}", // Memindai semua file di folder components
    "./hooks/**/*.{js,ts,jsx,tsx}",      // Memindai semua file di folder hooks
    "./src/**/*.{js,ts,jsx,tsx}",        // Memindai semua file di folder src (termasuk supabaseClient.ts)
  ],
  darkMode: 'class', // Mengaktifkan dark mode berbasis kelas
  theme: {
    extend: {
      colors: {
        'primary': '#1e40af',
        'secondary': '#1d4ed8',
        'accent': '#3b82f6',
        'neutral': '#1f2937',
        'base-100': '#0f172a',
        'base-200': '#1e293b',
        'base-300': '#334155',
        'info': '#38bdf8',
        'success': '#34d399',
        'warning': '#facc15',
        'error': '#f43f5e',
      },
    },
  },
  plugins: [],
}