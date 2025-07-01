// components/AboutPage.tsx
import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 max-w-2xl bg-base-200 shadow-xl rounded-lg mt-8 mb-8">
      <h1 className="text-3xl font-bold text-primary mb-6 text-center">Tentang Aplikasi Silsilah</h1>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-3">Visi Kami</h2>
        <p className="text-gray-300 leading-relaxed">
          Membangun jembatan digital yang menghubungkan generasi masa kini dengan akar sejarah keluarga mereka,
          memudahkan setiap individu untuk menemukan, melestarikan, dan berbagi warisan silsilah mereka dengan cara yang intuitif dan bermakna.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-3">Misi Kami</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2 leading-relaxed">
          <li>Menyediakan platform yang aman dan mudah digunakan untuk merekam dan mengatur informasi silsilah keluarga.</li>
          <li>Mengembangkan alat visualisasi interaktif yang membantu pengguna memahami hubungan keluarga secara jelas.</li>
          <li>Mendukung kolaborasi antar anggota keluarga dalam melengkapi dan memverifikasi data silsilah.</li>
          <li>Memastikan privasi dan keamanan data pengguna adalah prioritas utama kami.</li>
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-3">Fitur Utama</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2 leading-relaxed">
          <li>Manajemen detail individu dan hubungan keluarga.</li>
          <li>Visualisasi pohon keluarga interaktif.</li>
          <li>Pencarian dan filter data yang canggih.</li>
          <li>Impor/ekspor data (GEDCOM).</li>
          <li>Kontrol privasi berlapis untuk berbagi informasi.</li>
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-3">Tim Pengembang</h2>
        <p className="text-gray-300 leading-relaxed">
          Aplikasi ini dikembangkan dengan dedikasi oleh tim pengembang yang bersemangat dalam sejarah keluarga dan teknologi.
          Kami berkomitmen untuk terus meningkatkan fungsionalitas dan pengalaman pengguna.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-semibold text-white mb-3">Hubungi Kami</h2>
        <p className="text-gray-300 leading-relaxed">
          Jika Anda memiliki pertanyaan, saran, atau masukan, jangan ragu untuk menghubungi kami melalui fitur guestbook di aplikasi atau melalui email kami: support@silsilahqom.com.
        </p>
      </section>
    </div>
  );
};