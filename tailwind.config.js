// Silsilah_1/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // Penting: Pastikan ini menunjuk ke index.html Anda
    "./src/**/*.{js,ts,jsx,tsx}", // Penting: Ini mencakup semua file JS/TS/JSX/TSX di dalam src/
  ],
  darkMode: 'class', // Tetap pertahankan jika Anda menggunakan dark mode
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