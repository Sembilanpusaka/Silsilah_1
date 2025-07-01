import React from 'react';
import { InfoIcon } from './Icons'; // Asumsi Icons.tsx ada di folder yang sama

export const AboutPage: React.FC = () => {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="bg-base-200 p-8 rounded-lg shadow-xl max-w-2xl mx-auto text-center">
                <InfoIcon className="w-16 h-16 text-accent mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-white mb-4">Tentang Aplikasi Silsilah Keluarga Interaktif</h1>
                <p className="text-gray-300 mb-4">
                    Aplikasi ini dirancang untuk memvisualisasikan dan mengelola silsilah keluarga secara interaktif.
                    Anda dapat melihat profil individu, menelusuri pohon keluarga, menemukan hubungan antar individu,
                    serta menambahkan atau mengedit data silsilah melalui panel admin.
                </p>
                <p className="text-gray-400 text-sm">
                    Dibangun dengan React, Vite, Tailwind CSS, D3.js, dan Supabase sebagai backend.
                </p>
                <p className="text-gray-500 mt-6">
                    &copy; {new Date().getFullYear()} TPPKP Qomaruddin. Hak Cipta Dilindungi.
                </p>
            </div>
        </div>
    );
};