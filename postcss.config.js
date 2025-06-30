// Silsilah_1/postcss.config.js
// PERBAIKAN: Gunakan impor dinamik atau struktur objek yang berbeda untuk plugin PostCSS Tailwind CSS v4
// Ini mencoba mengikuti spirit error message bahwa pluginnya 'terpisah'
export default {
  plugins: [
    // Opsi 1: Coba dengan memanggil plugin tailwindcss dari 'tailwindcss' utama.
    // Jika errornya persisten, ini berarti Tailwind v4 memang tidak ingin digunakan seperti ini lagi.
    // tailwindcss(),

    // Opsi 2: Mengikuti pesan error untuk menginstal `@tailwindcss/postcss` dan menggunakannya.
    // Jika `import tailwindcss from '@tailwindcss/postcss'` dan `tailwindcss()` tidak berhasil,
    // mungkin plugin yang dimaksud perlu direferensikan sebagai objek.
    // Saya akan mencoba cara yang paling sesuai dengan ESM dan pesan error.

    // Coba lagi dengan asumsi '@tailwindcss/postcss' adalah fungsi plugin yang diekspor
    // atau gunakan plugin PostCSS yang disertakan langsung dalam paket `tailwindcss`
    // Ini adalah cara paling umum untuk Tailwind CSS. Errornya membingungkan untuk v4.

    // Mari kita coba format yang sering digunakan untuk Tailwind v3/v4 dengan ESM
    // Ini adalah import fungsi utama Tailwind CSS yang bertindak sebagai plugin PostCSS
    import('tailwindcss').then(m => m.default()), // Import dinamis dan panggil default export
    import('autoprefixer').then(m => m.default()), // Import dinamis dan panggil default export
  ],
}