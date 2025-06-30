// Silsilah_1/src/types/index.ts
// Ini adalah file untuk definisi tipe kustom dan alias dari tipe Supabase

import { Database } from './supabase'; // Pastikan path ini benar dari src/types/ ke src/types/supabase

// Alias tipe yang dihasilkan Supabase untuk kemudahan penggunaan
export type Individual = Database['public']['Tables']['individuals']['Row'];
export type NewIndividual = Database['public']['Tables']['individuals']['Insert'];
export type UpdatedIndividual = Database['public']['Tables']['individuals']['Update'];

export type Family = Database['public']['Tables']['families']['Row'];
export type NewFamily = Database['public']['Tables']['families']['Insert'];
export type UpdatedFamily = Database['public']['Tables']['families']['Update'];

// --- Tipe Kustom Anda (jika tidak ada di database Supabase) ---
export enum Gender {
    Male = 'male',
    Female = 'female',
    Unknown = 'unknown',
}

export interface LifeEvent {
    date?: string;
    place?: string;
}

export interface DetailEntry {
    id: string; // Penting untuk keying in lists
    title: string;
    description: string;
    period?: string; // e.g., for education/work duration
}

// Ini adalah tipe FamilyData yang digunakan oleh initialData.ts
export interface FamilyData {
    individuals: Map<string, Individual>;
    families: Map<string, Family>;
    rootIndividualId: string;
}

// Anda bisa menambahkan tipe lain di sini sesuai kebutuhan