// Silsilah_1/src/utils/javaneseTerms.ts

// Peta dasar untuk istilah kekerabatan umum
export const javaneseRelationshipTerms: { [key: string]: string } = {
    'Diri Sendiri': 'Awake Dewe',
    'Ayah': 'Bapak',
    'Ibu': 'Ibu',
    'Pasangan': 'Garwa', // Pasangan
    'Anak': 'Anak',
    'Kakek': 'Eyang Kakung',
    'Nenek': 'Eyang Putri',
    'Cucu': 'Putu',
    'Cicit': 'Buyut',
    'Moyang': 'Canggah',
    'Gantung Siwur': 'Wareng',
    'Gantung Walang': 'Udheg-Udheg',
    'Debog Bosok': 'Gantung Siwur', // Ini nama untuk leluhur ke-8
    'Galih Asem': 'Gantung Walang', // Leluhur ke-9
    'Pakpak': 'Debog Bosok', // Leluhur ke-10
    'Kuthuk': 'Galih Asem', // Leluhur ke-11
    'Sarap': 'Kuthuk', // Leluhur ke-12
    // Tambahkan istilah lain sesuai kebutuhan
};

// Fungsi untuk mendapatkan istilah Jawa berdasarkan hubungan
export const getJavaneseRelationship = (relationship: string): string => { // <--- PASTIKAN EKSPOR INI ADA
    return javaneseRelationshipTerms[relationship] || relationship;
};

// Fungsi untuk mendapatkan istilah Ahnentafel Jawa (konsep)
export const getJavaneseAhnentafelTerm = (ahnentafelNum: number): string => { // <--- PASTIKAN EKSPOR INI ADA
    // Ahnentafel secara tradisional hanya angka, bukan nama Jawa per angka.
    // Ini adalah contoh mapping jika diperlukan, bisa disesuaikan.
    if (ahnentafelNum === 1) return "Diri Sendiri";
    if (ahnentafelNum === 2) return "Bapak (A-2)";
    if (ahnentafelNum === 3) return "Ibu (A-3)";
    // Untuk Ahnentafel yang lebih tinggi, bisa gunakan kombinasi atau hanya angka
    return `A-${ahnentafelNum}`;
};