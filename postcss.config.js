// Silsilah_1/postcss.config.js
export default {
  plugins: {
    // PERBAIKAN: Ganti 'tailwindcss' dengan '@tailwindcss/postcss'
    // Jika '@tailwindcss/postcss' tidak berfungsi, coba 'tailwindcss/plugin'
    // Namun, error message menyarankan yang pertama.
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}