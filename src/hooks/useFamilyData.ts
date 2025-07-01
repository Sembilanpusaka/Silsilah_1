// hooks/useFamilyData.ts
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // <--- PERBAIKAN PATH DI SINI
import { FamilyData, Individual, Family, Tables } from '../types/supabase'; // Import tipe dari supabase.ts

// Perhatikan: FamilyData, Individual, Family perlu diadaptasi jika tipe Anda tidak cocok persis dengan skema Supabase
// Misalnya, jika tabel Anda bernama 'individuals' dan 'families', maka tipenya adalah Tables<'individuals'>['Row']

// Definisikan ulang tipe Individual dan Family agar sesuai dengan skema Supabase
// Ini adalah asumsi berdasarkan supabase.ts yang Anda berikan.
// Pastikan nama tabel di Supabase (misalnya 'individuals', 'families') sesuai.
type SupabaseIndividual = Tables<'individuals'>['Row'];
type SupabaseFamily = Tables<'families'>['Row'];
type SupabaseIndividualInsert = Tables<'individuals'>['Insert'];
type SupabaseFamilyInsert = Tables<'families'>['Insert'];

// Asumsi struktur FamilyData Anda di client-side:
// Anda perlu memutuskan bagaimana Anda akan mengelola Map di client-side
// jika Supabase mengembalikan array. Untuk saat ini, kita akan mengonversi ke Map
// setelah fetching dari Supabase.
interface ClientFamilyData {
  individuals: Map<string, SupabaseIndividual>;
  families: Map<string, SupabaseFamily>;
  rootIndividualId: string; // Jika Anda masih punya konsep root individual
}

export const useFamilyData = () => {
  const [data, setData] = useState<ClientFamilyData>({ individuals: new Map(), families: new Map(), rootIndividualId: '' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null); // Tambahkan state error

  // Fungsi untuk fetching data dari Supabase
  const fetchFamilyData = useCallback(async () => {
    setIsLoaded(false); // Set isLoaded ke false saat memulai fetching baru
    setError(null); // Reset error
    try {
      // Fetch Individuals
      const { data: individualsData, error: individualsError } = await supabase
        .from('individuals')
        .select('*'); // Pilih semua kolom yang Anda butuhkan

      if (individualsError) throw individualsError;

      // Fetch Families
      const { data: familiesData, error: familiesError } = await supabase
        .from('families')
        .select('*'); // Pilih semua kolom yang Anda butuhkan

      if (familiesError) throw familiesError;

      // Konversi array hasil Supabase ke Map untuk penggunaan client-side Anda
      const individualsMap = new Map<string, SupabaseIndividual>();
      individualsData.forEach(ind => individualsMap.set(ind.id, ind));

      const familiesMap = new Map<string, SupabaseFamily>();
      familiesData.forEach(fam => familiesMap.set(fam.id, fam));

      // Asumsi untuk rootIndividualId, Anda mungkin perlu logikanya sendiri untuk menentukannya
      // Atau menghapusnya jika tidak lagi relevan
      const rootId = individualsData.length > 0 ? individualsData[0].id : ''; // Contoh: ambil ID individu pertama

      setData({
        individuals: individualsMap,
        families: familiesMap,
        rootIndividualId: rootId,
      });
    } catch (err: any) {
      console.error("Error fetching family data from Supabase:", err.message);
      setError(err.message);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchFamilyData();

    // --- Implementasi Realtime Supabase ---
    // Pastikan Anda telah mengaktifkan Realtime untuk tabel 'individuals' dan 'families' di dasbor Supabase Anda
    const individualsChannel = supabase
      .channel('public:individuals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'individuals' },
        (payload) => {
          console.log('Individual change received!', payload);
          // Panggil ulang fetchFamilyData untuk memperbarui data
          // Atau Anda bisa mengelola state secara lebih granular berdasarkan payload
          fetchFamilyData();
        }
      )
      .subscribe();

    const familiesChannel = supabase
      .channel('public:families')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'families' },
        (payload) => {
          console.log('Family change received!', payload);
          fetchFamilyData();
        }
      )
      .subscribe();

    // Cleanup subscription saat komponen di-unmount
    return () => {
      supabase.removeChannel(individualsChannel);
      supabase.removeChannel(familiesChannel);
    };
  }, [fetchFamilyData]); // Sertakan fetchFamilyData di dependensi karena ini adalah fungsi useCallback

  // --- Fungsi CRUD untuk Supabase ---

  const updateIndividual = useCallback(async (individual: SupabaseIndividual) => {
    try {
      const { error } = await supabase
        .from('individuals')
        .update(individual)
        .eq('id', individual.id);
      if (error) throw error;
      await fetchFamilyData(); // Refresh data setelah update
    } catch (err: any) {
      console.error("Error updating individual:", err.message);
      setError(err.message);
    }
  }, [fetchFamilyData]);

  const addIndividual = useCallback(async (individual: Omit<SupabaseIndividualInsert, 'id' | 'created_at'>) => {
     try {
      const { data, error } = await supabase
        .from('individuals')
        .insert(individual)
        .select(); // Mengembalikan data yang dimasukkan, opsional

      if (error) throw error;
      await fetchFamilyData(); // Refresh data setelah insert
     } catch (err: any) {
      console.error("Error adding individual:", err.message);
      setError(err.message);
     }
  }, [fetchFamilyData]);

  const deleteIndividual = useCallback(async (individualId: string) => {
    try {
      const { error } = await supabase
        .from('individuals')
        .delete()
        .eq('id', individualId);
      if (error) throw error;
      await fetchFamilyData(); // Refresh data setelah delete
    } catch (err: any) {
      console.error("Error deleting individual:", err.message);
      setError(err.message);
    }
  }, [fetchFamilyData]);

  const updateFamily = useCallback(async (family: SupabaseFamily) => {
    try {
      const { error } = await supabase
        .from('families')
        .update(family)
        .eq('id', family.id);
      if (error) throw error;
      await fetchFamilyData(); // Refresh data setelah update
    } catch (err: any) {
      console.error("Error updating family:", err.message);
      setError(err.message);
    }
  }, [fetchFamilyData]);

  const addFamily = useCallback(async (family: Omit<SupabaseFamilyInsert, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('families')
        .insert(family)
        .select();

      if (error) throw error;
      await fetchFamilyData(); // Refresh data setelah insert
    } catch (err: any) {
      console.error("Error adding family:", err.message);
      setError(err.message);
    }
  }, [fetchFamilyData]);

  const deleteFamily = useCallback(async (familyId: string) => {
    try {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', familyId);
      if (error) throw error;
      await fetchFamilyData(); // Refresh data setelah delete
    } catch (err: any) {
      console.error("Error deleting family:", err.message);
      setError(err.message);
    }
  }, [fetchFamilyData]);

  // Hapus exportData dan importData jika Anda tidak lagi memerlukan fungsionalitas lokal ini
  // atau adaptasi agar berfungsi dengan Supabase Storage/Import data.
  // Untuk saat ini saya hapus karena fokus ke Supabase.
  const exportData = useCallback(() => { console.warn("Export data not implemented for Supabase."); }, []);
  const importData = useCallback((file: File) => { console.warn("Import data not implemented for Supabase."); }, []);


  return {
    data,
    isLoaded,
    error, // Kembalikan error juga
    updateIndividual,
    addIndividual,
    deleteIndividual,
    addFamily,
    updateFamily,
    deleteFamily,
    exportData,
    importData,
    setData: fetchFamilyData // Mengubah setData untuk memicu re-fetch dari Supabase
  };
};

export const FamilyDataContext = React.createContext<ReturnType<typeof useFamilyData> | null>(null);

export const useFamily = () => {
    const context = React.useContext(FamilyDataContext);
    if (!context) {
        throw new Error('useFamily must be used within a FamilyData.Provider');
    }
    return context;
};