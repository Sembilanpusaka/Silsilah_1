// Silsilah_1/postcss.config.js
// PERBAIKAN: Gunakan import alih-alih require()
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss(), // Panggil sebagai fungsi
    autoprefixer(), // Panggil sebagai fungsi
  ],
}