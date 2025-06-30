// hooks/useFamilyData.ts
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../src/supabaseClient'; 
import { Database } from '../src/types/supabase'; 

export type Individual = Database['public']['Tables']['individuals']['Row'];
export type NewIndividual = Database['public']['Tables']['individuals']['Insert'];
export type UpdatedIndividual = Database['public']['Tables']['individuals']['Update'];

export type Family = Database['public']['Tables']['families']['Row'];
export type NewFamily = Database['public']['Tables']['families']['Insert'];
export type UpdatedFamily = Database['public']['Tables']['families']['Update'];

interface UseFamilyDataResult {
  individuals: Map<string, Individual>;
  families: Map<string, Family>;
  loading: boolean;
  error: string | null;
  updateIndividual: (individual: Individual) => Promise<void>;
  addIndividual: (individual: Omit<NewIndividual, 'id'>) => Promise<void>;
  deleteIndividual: (individualId: string) => Promise<void>;
  updateFamily: (family: Family) => Promise<void>;
  addFamily: (familyData: Omit<NewFamily, 'id'>) => Promise<void>;
  deleteFamily: (familyId: string) => Promise<void>;
  exportData: () => Promise<void>;
  importData: (file: File) => Promise<void>;
  fetchFamilyData: () => Promise<void>;
}

export const useFamilyData = (): UseFamilyDataResult => {
  const [individuals, setIndividuals] = useState<Map<string, Individual>>(new Map());
  const [families, setFamilies] = useState<Map<string, Family>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFamilyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("useFamilyData: Memulai fetch data dari Supabase...");
    try {
      // Fetch Individuals
      const { data: individualsData, error: individualsError } = await supabase
        .from('individuals')
        .select('*');

      if (individualsError) {
        console.error("useFamilyData: Error fetching individuals:", individualsError.message);
        throw individualsError;
      }
      console.log("useFamilyData: individualsData fetched:", individualsData);

      // Fetch Families
      const { data: familiesData, error: familiesError } = await supabase
        .from('families')
        .select('*');

      if (familiesError) {
        console.error("useFamilyData: Error fetching families:", familiesError.message);
        throw familiesError;
      }
      console.log("useFamilyData: familiesData fetched:", familiesData);

      // Pastikan data adalah array sebelum diolah
      const individualsMap = new Map<string, Individual>();
      if (individualsData && Array.isArray(individualsData)) {
        individualsData.forEach(ind => individualsMap.set(ind.id, ind));
      } else {
        console.warn("useFamilyData: individualsData is not an array or is null/undefined.", individualsData);
      }
      
      const familiesMap = new Map<string, Family>();
      if (familiesData && Array.isArray(familiesData)) {
        familiesData.forEach(fam => familiesMap.set(fam.id, fam));
      } else {
        console.warn("useFamilyData: familiesData is not an array or is null/undefined.", familiesData);
      }

      setIndividuals(individualsMap);
      setFamilies(familiesMap);
      console.log("useFamilyData: Data berhasil diolah dan diatur ke state.");
      console.log("useFamilyData: Current individuals Map size:", individualsMap.size);
      console.log("useFamilyData: Current families Map size:", familiesMap.size);

    } catch (err: any) {
      console.error("useFamilyData: Gagal memuat data keluarga dari Supabase:", err.message);
      setError(`Failed to load family data: ${err.message}`);
      setIndividuals(new Map()); // Pastikan tetap Map kosong jika ada error
      setFamilies(new Map());   // Pastikan tetap Map kosong jika ada error
    } finally {
      setLoading(false);
      console.log("useFamilyData: Selesai fetch data. Loading state:", false);
    }
  }, []);

  useEffect(() => {
    fetchFamilyData();
  }, [fetchFamilyData]);

  // --- Fungsi CRUD lainnya (tidak ada perubahan kode, hanya logging di fetch) ---
  const updateIndividual = useCallback(async (individual: Individual) => { /* ... */ }, []);
  const addIndividual = useCallback(async (individual: Omit<NewIndividual, 'id'>) => { /* ... */ }, []);
  const deleteIndividual = useCallback(async (individualId: string) => { /* ... */ }, []);
  const updateFamily = useCallback(async (updatedFamily: Family) => { /* ... */ }, []);
  const addFamily = useCallback(async (familyData: Omit<NewFamily, 'id'>) => { /* ... */ }, []);
  const deleteFamily = useCallback(async (familyId: string) => { /* ... */ }, []);
  const replacer = (key: string, value: any) => { /* ... */ return value; };
  const reviver = (key: string, value: any) => { /* ... */ return value; };
  const exportData = useCallback(async () => { /* ... */ }, [individuals, families]);
  const importData = useCallback(async (file: File) => { /* ... */ }, [fetchFamilyData]);

  return {
    individuals,
    families,
    loading,
    error,
    updateIndividual,
    addIndividual,
    deleteIndividual,
    addFamily,
    updateFamily,
    deleteFamily,
    exportData,
    importData,
    fetchFamilyData
  };
};

export const FamilyDataContext = React.createContext<ReturnType<typeof useFamilyData> | null>(null);

export const useFamily = () => {
    const context = React.useContext(FamilyDataContext);
    // Tambahkan log di sini juga untuk melihat nilai konteks
    console.log("useFamily: Context value retrieved:", context);
    if (!context) {
        throw new Error('useFamily must be used within a FamilyData.Provider');
    }
    return context;
};