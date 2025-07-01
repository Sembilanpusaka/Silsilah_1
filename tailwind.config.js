/** @type {import('tailwindcss').Config} */
export default {
  // === BAGIAN INI SANGAT KRUSIAL UNTUK MEMINDAI KELAS TAILWIND ===
  content: [
    "./index.html",             // Penting untuk memindai index.html
    // Memindai semua file JS, TS, JSX, TSX di dalam folder src/
    // Ini harus mencakup semua komponen, halaman, dan file yang menggunakan kelas Tailwind.
    "./src/**/*.{js,ts,jsx,tsx}",
    // Jika Anda punya file kustom di luar src/ (misal: di root proyek) yang menggunakan Tailwind:
    // "./*.html", // Jika ada file HTML lain di root
    // "./*.{js,ts,jsx,tsx}", // Jika ada file JS/TS/JSX/TSX lain di root
  ],
  // =============================================================

  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': '#1e40af', 'secondary': '#1d4ed8', 'accent': '#3b82f6',
        'neutral': '#1f2937', 'base-100': '#0f172a', 'base-200': '#1e293b', 'base-300': '#334155',
        'info': '#38bdf8', 'success': '#34d399', 'warning': '#facc15', 'error': '#f43f5e',
      },
    },
  },
  plugins: [],
}