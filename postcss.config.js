// Silsilah_1/postcss.config.js
// Ini adalah file konfigurasi PostCSS yang digunakan oleh Vite untuk memproses CSS Anda.
export default {
  plugins: [
    // Gunakan require() untuk memuat plugin Tailwind CSS
    // Ini adalah cara yang lebih umum dan seringkali lebih andal
    require('tailwindcss'),
    // Gunakan require() untuk memuat plugin Autoprefixer
    require('autoprefixer'),
  ],
}