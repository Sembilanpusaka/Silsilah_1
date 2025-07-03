// Silsilah_1/src/components/FamilyTreeView.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFamily } from '../hooks/useFamilyData';
import { MermaidChart } from './MermaidChart'; // <--- Impor komponen MermaidChart
import { Tables } from '../types/supabase';
import { getJavaneseRelationship, getJavaneseAhnentafelTerm } from '../utils/javaneseTerms'; // Utilitas istilah Jawa

type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];

// --- Fungsi untuk menghasilkan string Mermaid.js spesifik sesuai narasi ---
const generateSpecificMermaidGraph = (
    individuals: Map<string, Individual>,
    families: Map<string, Family>,
    rootIndividualId: string | null, // Mungkin tidak digunakan secara langsung untuk graph spesifik
    viewType: 'descendants' | 'ancestors' // Mungkin tidak digunakan secara langsung
): string | null => {

    if (!individuals.size || !families.size) return null;

    // Helper untuk membuat ID node Mermaid yang aman dari UUID
    const toMermaidId = (uuid: string) => uuid.replace(/-/g, '_');

    // --- MAPPING UUIDs ke NAMA DARI DATA ANDA ---
    // Pastikan UUIDs ini sesuai dengan data di database Anda
    // Penambahan UUID baru untuk individu yang belum ada atau perlu dipisahkan
    const uuidMap: { [key: string]: string } = {
        'bd7a9355-6c7d-4e8f-9a0b-1c2d3e4f5a6b': 'Qomaruddin',
        'd2e3f4a5-b6c7-8d9e-0f1a-2b3c4d5e6f7a': 'Hafshoh',
        'e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b': 'Harun',
        'f3e4a5b6-c7d8-9e0f-1a2b-3c4d5e6f7a8b': 'Murtadliyah',
        'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d': 'Abdurrahim_Barmawi', // Alias untuk Mermaid
        'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e': 'Nyai_Abdurrahim',
        'c3d4e5f6-a7b8-c9d0-e1f2-a3b4c5d6e7f0': 'Yakub',
        'e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6': 'Musawwamah',
        'f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7': 'Mahfudz',

        'd4e5f6a7-b8c9-d0e1-f2a3-b4c5d6e7f8a9': 'Rosiyah',
        'e5f6a7b8-c9d0-e1f2-a3b4-c5d6e7f8a9b0': 'Abu_Ishaq',
        'f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0c1': 'Nawawi',
        'a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1d2': 'Baidlo',
        'a3b4c5d6-e7f8-a9b0-c1d2-e3f4a5b6c7d8': 'Abdussalam',
        
        'b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2e3': 'Asiyah',
        'c9d0e1f2-a3b4-c5d6-e7f8-a9b0c1d2e3f4': 'H_Musthofa',
        'd0e1f2a3-b4c5-d6e7-f8a9-b0c1d2e3f4a5': 'Muslihah',

        // New UUIDs for individuals and families to fix the "Umamah" lineage
        'new-umamah-i-uuid': 'Umamah_I', // Child of Nawawi + Muslihah
        'new-abdul-hamid-uuid': 'Abdul_Hamid', // Child of Abdurrahman bin Abdussalam + Umamah_I
        'new-aminah-uuid': 'Aminah', // Spouse of Abdul Hamid
        'new-umamah-ii-uuid': 'Umamah_II', // Child of Abdul Hamid + Aminah, spouse of Mahfudz

        'd6e7f8a9-b0c1-d2e3-f4a5-b6c7d8e9f0a1': 'Lilik_Mughirah',
        'e7f8a9b0-c1d2-e3f4-a5b6-c7d8e9f0a1b2': 'H_Munif_Ridlwan', // Asumsi ini suami Lilik
        'f8a9b0c1-d2e3-f4a5-b6c7-d8e9f0a1b2c3': 'Maghfur_Munif',
        'a9b0c1d2-e3f4-a5b6-c7d8-e9f0a1b2c3d4': 'Ziyanah_Walidah',
        'b0c1d2e3-f4a5-b6c7-d8e9-f0a1b2c3d4e5': 'Ahya_Inarah_Husna'
    };

    // Helper untuk mendapatkan nama node Mermaid dari UUID
    const getNodeName = (uuid: string) => individuals.get(uuid)?.name || uuidMap[uuid] || uuid;
    const getMermaidIdFromUuid = (uuid: string) => toMermaidId(uuid);

    let chartString = `graph TD;\n\n`;

    // --- Styling Global ---
    chartString += `    classDef male fill:#cde4ff,stroke:#333,stroke-width:1.5px;\n`;
    chartString += `    classDef female fill:#ffcdd2,stroke:#333,stroke-width:1.5px;\n`;
    chartString += `    classDef marriage fill:#d4edda,stroke:#3c763d,stroke-width:1.5px,rx:8px,ry:8px;\n`;
    
    // --- Generasi Awal ---
    chartString += `    subgraph Generasi_Awal\n`;
    chartString += `        direction LR\n`; // LR for Left to Right (horizontal)
    chartString += `        style Generasi_Awal fill:#e0e0e0,stroke:#888,stroke-dasharray: 5 5\n`;
    chartString += `        ${getMermaidIdFromUuid('bd7a9355-6c7d-4e8f-9a0b-1c2d3e4f5a6b')}["Qomaruddin"] -- ${getJavaneseRelationship('Pasangan')} --> ${getMermaidIdFromUuid('d2e3f4a5-b6c7-8d9e-0f1a-2b3c4d5e6f7a')}["Hafshoh"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_qomar_hafshoh')}[ ]:::marriage;\n`;
    chartString += `        ${getMermaidIdFromUuid('bd7a9355-6c7d-4e8f-9a0b-1c2d3e4f5a6b')} & ${getMermaidIdFromUuid('d2e3f4a5-b6c7-8d9e-0f1a-2b3c4d5e6f7a')} --> ${getMermaidIdFromUuid('fam_qomar_hafshoh')};\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_qomar_hafshoh')} --> ${getMermaidIdFromUuid('e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b')}["Harun"];\n`;
    chartString += `        ${getMermaidIdFromUuid('e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b')} -- ${getJavaneseRelationship('Pasangan')} --> ${getMermaidIdFromUuid('f3e4a5b6-c7d8-9e0f-1a2b-3c4d5e6f7a8b')}["Murtadliyah"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_harun_murtadliyah')}[ ]:::marriage;\n`;
    chartString += `        ${getMermaidIdFromUuid('e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b')} & ${getMermaidIdFromUuid('f3e4a5b6-c7d8-9e0f-1a2b-3c4d5e6f7a8b')} --> ${getMermaidIdFromUuid('fam_harun_murtadliyah')};\n`;
    chartString += `    end\n\n`;

    chartString += `    ${getMermaidIdFromUuid('fam_harun_murtadliyah')} --> ${getMermaidIdFromUuid('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')}["Abdurrahim Barmawi"];\n`;
    chartString += `    ${getMermaidIdFromUuid('fam_harun_murtadliyah')} --> ${getMermaidIdFromUuid('d4e5f6a7-b8c9-d0e1-f2a3-b4c5d6e7f8a9')}["Rosiyah"];\n`;
    chartString += `    ${getMermaidIdFromUuid('fam_harun_murtadliyah')} --> ${getMermaidIdFromUuid('b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2e3')}["Asiyah"];\n\n`;


    // --- Jalur Keturunan Mahfudz ---
    chartString += `    subgraph Jalur_Keturunan_Mahfudz\n`;
    chartString += `        direction LR\n`;
    chartString += `        style Jalur_Keturunan_Mahfudz fill:#e3f2fd,stroke:#90caf9,stroke-width:1.5px;\n`;
    chartString += `        ${getMermaidIdFromUuid('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')} -- ${getJavaneseRelationship('Pasangan')} --> ${getMermaidIdFromUuid('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e')}["Nyai Abdurrahim"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_abdurrahim_nyai')}[ ]:::marriage;\n`;
    chartString += `        ${getMermaidIdFromUuid('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')} & ${getMermaidIdFromUuid('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e')} --> ${getMermaidIdFromUuid('fam_abdurrahim_nyai')};\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_abdurrahim_nyai')} --> ${getMermaidIdFromUuid('c3d4e5f6-a7b8-c9d0-e1f2-a3b4c5d6e7f0')}["Yakub"];\n`;
    chartString += `        ${getMermaidIdFromUuid('c3d4e5f6-a7b8-c9d0-e1f2-a3b4c5d6e7f0')} -- ${getJavaneseRelationship('Pasangan')} --> ${getMermaidIdFromUuid('e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6')}["Musawwamah"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_yakub_musawwamah')}[ ]:::marriage;\n`;
    chartString += `        ${getMermaidIdFromUuid('c3d4e5f6-a7b8-c9d0-e1f2-a3b4c5d6e7f0')} & ${getMermaidIdFromUuid('e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6')} --> ${getMermaidIdFromUuid('fam_yakub_musawwamah')};\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_yakub_musawwamah')} --> ${getMermaidIdFromUuid('f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7')}["Mahfudz"];\n`;
    chartString += `    end\n\n`;

    // --- Jalur Keturunan Umamah_II ---
    chartString += `    subgraph Jalur_Keturunan_Umamah_II\n`;
    chartString += `        direction LR\n`;
    chartString += `        style Jalur_Keturunan_Umamah_II fill:#fce4ec,stroke:#f8bbd0,stroke-width:1.5px;\n`;
    
    chartString += `        ${getMermaidIdFromUuid('d4e5f6a7-b8c9-d0e1-f2a3-b4c5d6e7f8a9')}["Rosiyah"] -- ${getJavaneseRelationship('Pasangan')} --> ${getMermaidIdFromUuid('e5f6a7b8-c9d0-e1f2-a3b4-c5d6e7f8a9b0')}["Abu Ishaq"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_rosiyah_abuishaq')}[ ]:::marriage;\n`;
    chartString += `        ${getMermaidIdFromUuid('d4e5f6a7-b8c9-d0e1-f2a3-b4c5d6e7f8a9')} & ${getMermaidIdFromUuid('e5f6a7b8-c9d0-e1f2-a3b4-c5d6e7f8a9b0')} --> ${getMermaidIdFromUuid('fam_rosiyah_abuishaq')};\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_rosiyah_abuishaq')} --> ${getMermaidIdFromUuid('f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0c1')}["Nawawi"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_rosiyah_abuishaq')} --> ${getMermaidIdFromUuid('a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1d2')}["Baidlo"];\n`;

    chartString += `        ${getMermaidIdFromUuid('b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2e3')}["Asiyah"] -- ${getJavaneseRelationship('Pasangan')} --> ${getMermaidIdFromUuid('c9d0e1f2-a3b4-c5d6-e7f8-a9b0c1d2e3f4')}["H. Musthofa"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_asiyah_musthofa')}[ ]:::marriage;\n`;
    chartString += `        ${getMermaidIdFromUuid('b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2e3')} & ${getMermaidIdFromUuid('c9d0e1f2-a3b4-c5d6-e7f8-a9b0c1d2e3f4')} --> ${getMermaidIdFromUuid('fam_asiyah_musthofa')};\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_asiyah_musthofa')} --> ${getMermaidIdFromUuid('d0e1f2a3-b4c5-d6e7-f8a9-b0c1d2e3f4a5')}["Muslihah"];\n`;

    // Pernikahan antar sepupu: Nawawi & Muslihah -> Umamah (I)
    chartString += `        ${getMermaidIdFromUuid('f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0c1')}["Nawawi"] -- ${getJavaneseRelationship('Pasangan')} --> ${getMermaidIdFromUuid('d0e1f2a3-b4c5-d6e7-f8a9-b0c1d2e3f4a5')}["Muslihah"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_nawawi_muslihah')}[ ]:::marriage;\n`;
    chartString += `        ${getMermaidIdFromUuid('f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0c1')} & ${getMermaidIdFromUuid('d0e1f2a3-b4c5-d6e7-f8a9-b0c1d2e3f4a5')} --> ${getMermaidIdFromUuid('fam_nawawi_muslihah')};\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_nawawi_muslihah')} --> ${getMermaidIdFromUuid('new-umamah-i-uuid')}["Umamah (I)"];\n`; // Child: Umamah (I)

    // Baidlo & Abdussalam -> Abdurrahman bin Abdussalam
    chartString += `        ${getMermaidIdFromUuid('a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1d2')}["Baidlo"] -- ${getJavaneseRelationship('Pasangan')} --> ${getMermaidIdFromUuid('a3b4c5d6-e7f8-a9b0-c1d2-e3f4a5b6c7d8')}["Abdussalam"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_baidlo_abdussalam')}[ ]:::marriage;\n`;
    chartString += `        ${getMermaidIdFromUuid('a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1d2')} & ${getMermaidIdFromUuid('a3b4c5d6-e7f8-a9b0-c1d2-e3f4a5b6c7d8')} --> ${getMermaidIdFromUuid('fam_baidlo_abdussalam')};\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_baidlo_abdussalam')} --> ${getMermaidIdFromUuid('b4c5d6e7-f8a9-b0c1-d2e3-f4a5b6c7d8e9')}["Abdurrahman bin Abdussalam"];\n`;

    // Abdurrahman bin Abdussalam & Umamah (I) -> Abdul Hamid
    chartString += `        ${getMermaidIdFromUuid('b4c5d6e7-f8a9-b0c1-d2e3-f4a5b6c7d8e9')}["Abdurrahman bin Abdussalam"] -- ${getJavaneseRelationship('Pasangan')} --> ${getMermaidIdFromUuid('new-umamah-i-uuid')}["Umamah (I)"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_abdurrahman_umamah_i')}[ ]:::marriage;\n`;
    chartString += `        ${getMermaidIdFromUuid('b4c5d6e7-f8a9-b0c1-d2e3-f4a5b6c7d8e9')} & ${getMermaidIdFromUuid('new-umamah-i-uuid')} --> ${getMermaidIdFromUuid('fam_abdurrahman_umamah_i')};\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_abdurrahman_umamah_i')} --> ${getMermaidIdFromUuid('new-abdul-hamid-uuid')}["Abdul Hamid"];\n`;

    // Abdul Hamid & Aminah -> Umamah (II)
    chartString += `        ${getMermaidIdFromUuid('new-abdul-hamid-uuid')}["Abdul Hamid"] -- ${getJavaneseRelationship('Pasangan')} --> ${getMermaidIdFromUuid('new-aminah-uuid')}["Aminah"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_abdulhamid_aminah')}[ ]:::marriage;\n`;
    chartString += `        ${getMermaidIdFromUuid('new-abdul-hamid-uuid')} & ${getMermaidIdFromUuid('new-aminah-uuid')} --> ${getMermaidIdFromUuid('fam_abdulhamid_aminah')};\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_abdulhamid_aminah')} --> ${getMermaidIdFromUuid('new-umamah-ii-uuid')}["Umamah (II)"];\n`; // Child: Umamah (II)
    chartString += `    end\n\n`;

    // --- Pertemuan Jalur dan Generasi Akhir ---
    chartString += `    subgraph Pertemuan_Jalur_dan_Generasi_Akhir\n`;
    chartString += `        direction LR\n`;
    chartString += `        style Pertemuan_Jalur_dan_Generasi_Akhir fill:#e8f5e9,stroke:#81c784,stroke-width:1.5px;\n`;
    // Mahfudz & Umamah (II) -> Lilik Mughirah
    chartString += `        ${getMermaidIdFromUuid('f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7')}["Mahfudz"] -- ${getJavaneseRelationship('Pasangan')} --> ${getMermaidIdFromUuid('new-umamah-ii-uuid')}["Umamah (II)"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_mahfudz_umamah2')}[ ]:::marriage;\n`;
    chartString += `        ${getMermaidIdFromUuid('f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7')} & ${getMermaidIdFromUuid('new-umamah-ii-uuid')} --> ${getMermaidIdFromUuid('fam_mahfudz_umamah2')};\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_mahfudz_umamah2')} --> ${getMermaidIdFromUuid('d6e7f8a9-b0c1-d2e3-f4a5-b6c7d8e9f0a1')}["Hj. Lilik Mughiroh"];\n`;
    
    chartString += `        ${getMermaidIdFromUuid('d6e7f8a9-b0c1-d2e3-f4a5-b6c7d8e9f0a1')}["Hj. Lilik Mughiroh"] -- ${getJavaneseRelationship('Pasangan')} --> ${getMermaidIdFromUuid('e7f8a9b0-c1d2-e3f4-a5b6-c7d8e9f0a1b2')}["H. Munif Ridlwan"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_munif_lilik')}[ ]:::marriage;\n`;
    chartString += `        ${getMermaidIdFromUuid('d6e7f8a9-b0c1-d2e3-f4a5-b6c7d8e9f0a1')} & ${getMermaidIdFromUuid('e7f8a9b0-c1d2-e3f4-a5b6-c7d8e9f0a1b2')} --> ${getMermaidIdFromUuid('fam_munif_lilik')};\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_munif_lilik')} --> ${getMermaidIdFromUuid('f8a9b0c1-d2e3-f4a5-b6c7-d8e9f0a1b2c3')}["Maghfur Munif"];\n`;
    chartString += `        ${getMermaidIdFromUuid('f8a9b0c1-d2e3-f4a5-b6c7-d8e9f0a1b2c3')}["Maghfur Munif"] -- ${getJavaneseRelationship('Pasangan')} --> ${getMermaidIdFromUuid('a9b0c1d2-e3f4-a5b6-c7d8-e9f0a1b2c3d4')}["Ziyanah Walidah"];\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_maghfur_ziyanah')}[ ]:::marriage;\n`;
    chartString += `        ${getMermaidIdFromUuid('f8a9b0c1-d2e3-f4a5-b6c7-d8e9f0a1b2c3')} & ${getMermaidIdFromUuid('a9b0c1d2-e3f4-a5b6-c7d8-e9f0a1b2c3d4')} --> ${getMermaidIdFromUuid('fam_maghfur_ziyanah')};\n`;
    chartString += `        ${getMermaidIdFromUuid('fam_maghfur_ziyanah')} --> ${getMermaidIdFromUuid('b0c1d2e3-f4a5-b6c7-d8e9-f0a1b2c3d4e5')}["Ahya Inarah Husna"];\n`;
    chartString += `    end\n\n`;

    // --- Tambahkan class ke individu sesuai gender (ini akan membuat warna latar node) ---
    chartString += `    class ${getMermaidIdFromUuid('bd7a9355-6c7d-4e8f-9a0b-1c2d3e4f5a6b')},${getMermaidIdFromUuid('e8f9a0b1-c2d3-4e5f-6a7b-8c9d0e1f2a3b')},${getMermaidIdFromUuid('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')},${getMermaidIdFromUuid('c3d4e5f6-a7b8-c9d0-e1f2-a3b4c5d6e7f0')},${getMermaidIdFromUuid('f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7')},${getMermaidIdFromUuid('e5f6a7b8-c9d0-e1f2-a3b4-c5d6e7f8a9b0')},${getMermaidIdFromUuid('f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0c1')},${getMermaidIdFromUuid('c9d0e1f2-a3b4-c5d6-e7f8-a9b0c1d2e3f4')},${getMermaidIdFromUuid('a3b4c5d6-e7f8-a9b0-c1d2-e3f4a5b6c7d8')},${getMermaidIdFromUuid('b4c5d6e7-f8a9-b0c1-d2e3-f4a5b6c7d8e9')},${getMermaidIdFromUuid('new-abdul-hamid-uuid')},${getMermaidIdFromUuid('e7f8a9b0-c1d2-e3f4-a5b6-c7d8e9f0a1b2')},${getMermaidIdFromUuid('f8a9b0c1-d2e3-f4a5-b6c7-d8e9f0a1b2c3')} male;\n`;
    chartString += `    class ${getMermaidIdFromUuid('d2e3f4a5-b6c7-8d9e-0f1a-2b3c4d5e6f7a')},${getMermaidIdFromUuid('f3e4a5b6-c7d8-9e0f-1a2b-3c4d5e6f7a8b')},${getMermaidIdFromUuid('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e')},${getMermaidIdFromUuid('e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6')},${getMermaidIdFromUuid('d4e5f6a7-b8c9-d0e1-f2a3-b4c5d6e7f8a9')},${getMermaidIdFromUuid('a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1d2')},${getMermaidIdFromUuid('b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2e3')},${getMermaidIdFromUuid('d0e1f2a3-b4c5-d6e7-f8a9-b0c1d2e3f4a5')},${getMermaidIdFromUuid('new-umamah-i-uuid')},${getMermaidIdFromUuid('new-aminah-uuid')},${getMermaidIdFromUuid('new-umamah-ii-uuid')},${getMermaidIdFromUuid('d6e7f8a9-b0c1-d2e3-f4a5-b6c7d8e9f0a1')},${getMermaidIdFromUuid('a9b0c1d2-e3f4-a5b6-c7d8-e9f0a1b2c3d4')},${getMermaidIdFromUuid('b0c1d2e3-f4a5-b6c7-d8e9-f0a1b2c3d4e5')} female;\n`;

    return chartString;
};


export const FamilyTreeView: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // Ini bisa dipakai untuk memilih root tree nanti
    const { data: familyData, loading, error } = useFamily();

    const rootIndividual = useMemo(() => {
        // Karena ini graf spesifik, rootId dari URL mungkin tidak relevan langsung
        // Kita bisa ambil root dari data sampel yang paling awal
        return familyData.individuals.get('bd7a9355-6c7d-4e8f-9a0b-1c2d3e4f5a6b'); // Kakek Qomaruddin sebagai root
    }, [familyData.individuals]);


    const mermaidChartDefinition = useMemo(() => {
        if (!rootIndividual || !familyData.individuals.size) return null;
        // Panggil generator untuk graph spesifik
        return generateSpecificMermaidGraph(familyData.individuals, familyData.families, rootIndividual.id, 'descendants'); // viewType tidak relevan langsung
    }, [rootIndividual, familyData.individuals, familyData.families]);

    if (loading) return <div className="text-center p-8 text-white">Memuat data silsilah...</div>;
    if (error) return <div className="text-center p-8 text-error">Error: {error}</div>;
    if (!rootIndividual) return <div className="text-center p-8 text-xl text-gray-400">Individu utama tidak ditemukan untuk menampilkan pohon.</div>;


    return (
        <div className="w-full h-[calc(100vh-64px)] flex flex-col">
            <div className="p-4 bg-base-200 shadow-md z-10 flex items-center space-x-4">
                 {/* Hapus select rootId dan viewType jika tidak lagi relevan untuk graph spesifik */}
                 <span className="text-white text-lg font-semibold">Pohon Keluarga Utama</span>
            </div>
            <div className="flex-grow w-full h-full overflow-auto p-4 bg-base-100 rounded-lg"> {/* overflow-auto untuk scroll */}
                {mermaidChartDefinition ? (
                    <MermaidChart chartDefinition={mermaidChartDefinition} chartId="specific-family-tree" />
                ) : (
                    <p className="text-gray-400 text-center">Tidak dapat menampilkan pohon keluarga. Pastikan data lengkap.</p>
                )}
            </div>
        </div>
    );
};