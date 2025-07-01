// hooks/useFamilyData.ts
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Tables } from '../types/supabase'; // Import tipe dari supabase.ts

type SupabaseIndividual = Tables<'individuals'>['Row'];
type SupabaseFamily = Tables<'families'>['Row'];
type SupabaseIndividualInsert = Tables<'individuals'>['Insert'];
type SupabaseIndividualUpdate = Tables<'individuals'>['Update'];
type SupabaseFamilyInsert = Tables<'families'>['Insert'];
type SupabaseFamilyUpdate = Tables<'families'>['Update'];

interface ClientFamilyData {
  individuals: Map<string, SupabaseIndividual>;
  families: Map<string, SupabaseFamily>;
  rootIndividualId: string;
}

export const useFamilyData = () => {
  const [data, setData] = useState<ClientFamilyData>({ individuals: new Map(), families: new Map(), rootIndividualId: '' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFamilyData = useCallback(async () => {
    setIsLoaded(false);
    setError(null);
    console.log("[DEBUG: useFamilyData] Memulai fetching data keluarga dari Supabase...");
    try {
      const { data: individualsData, error: individualsError } = await supabase
        .from('individuals')
        .select('*');

      if (individualsError) {
        console.error("[ERROR: useFamilyData] Error fetching individuals:", individualsError.message);
        throw individualsError;
      }
      console.log("[DEBUG: useFamilyData] Individuals fetched:", individualsData.length);

      const { data: familiesData, error: familiesError } = await supabase
        .from('families')
        .select('*');

      if (familiesError) {
        console.error("[ERROR: useFamilyData] Error fetching families:", familiesError.message);
        throw familiesError;
      }
      console.log("[DEBUG: useFamilyData] Families fetched:", familiesData.length);

      const individualsMap = new Map<string, SupabaseIndividual>();
      individualsData.forEach(ind => individualsMap.set(ind.id, ind));

      const familiesMap = new Map<string, SupabaseFamily>();
      familiesData.forEach(fam => familiesMap.set(fam.id, fam));

      const rootId = individualsData.length > 0 ? individualsData[0].id : '';

      setData({
        individuals: individualsMap,
        families: familiesMap,
        rootIndividualId: rootId,
      });
      console.log("[DEBUG: useFamilyData] Data keluarga berhasil diatur.");
    } catch (err: any) {
      console.error("[ERROR: useFamilyData] Gagal memuat data keluarga dari Supabase:", err.message);
      setError(err.message);
    } finally {
      setIsLoaded(true);
      console.log("[DEBUG: useFamilyData] Loading data keluarga selesai.");
    }
  }, []);

  useEffect(() => {
    fetchFamilyData();

    const individualsChannel = supabase
      .channel('public:individuals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'individuals' },
        (payload) => {
          console.log('[DEBUG: Realtime] Perubahan individu diterima:', payload);
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
          console.log('[DEBUG: Realtime] Perubahan keluarga diterima:', payload);
          fetchFamilyData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(individualsChannel);
      supabase.removeChannel(familiesChannel);
      console.log('[DEBUG: Realtime] Channel Realtime dibersihkan.');
    };
  }, [fetchFamilyData]);

  const updateIndividual = useCallback(async (individual: SupabaseIndividualUpdate) => {
    console.log("[DEBUG: updateIndividual] Data akan dikirim ke Supabase:", individual);
    try {
      const { error: supabaseError } = await supabase
        .from('individuals')
        .update(individual)
        .eq('id', individual.id!);
      if (supabaseError) {
        console.error("[ERROR: updateIndividual] Error dari Supabase:", supabaseError);
        throw supabaseError;
      }
      console.log("[DEBUG: updateIndividual] Data individu berhasil diperbarui di Supabase.");
      await fetchFamilyData();
    } catch (err: any) {
      console.error("[ERROR: updateIndividual] Gagal memperbarui individu:", err.message);
      setError(err.message);
    }
  }, [fetchFamilyData]);

  const addIndividual = useCallback(async (individual: SupabaseIndividualInsert) => {
    console.log("[DEBUG: addIndividual] Data akan dikirim ke Supabase:", individual);
    try {
      const dataToSend = { ...individual };
      if ('id' in dataToSend && (dataToSend.id === "" || dataToSend.id === undefined)) {
        delete (dataToSend as any).id;
      }
      const { data: newRow, error: supabaseError } = await supabase
        .from('individuals')
        .insert(dataToSend)
        .select();

      if (supabaseError) {
        console.error("[DEBUG: addIndividual] Error dari Supabase:", supabaseError);
        throw supabaseError;
      }
      console.log("[DEBUG: addIndividual] Data individu berhasil ditambahkan ke Supabase:", newRow);
      await fetchFamilyData();
    } catch (err: any) {
      console.error("[ERROR: addIndividual] Gagal menambahkan individu:", err.message);
      setError(err.message);
    }
  }, [fetchFamilyData]);

  const deleteIndividual = useCallback(async (id: string) => {
    console.log("[DEBUG: deleteIndividual] ID akan dihapus dari Supabase:", id);
    try {
      const { error: supabaseError } = await supabase
        .from('individuals')
        .delete()
        .eq('id', id);
      if (supabaseError) {
        console.error("[DEBUG: deleteIndividual] Error dari Supabase:", supabaseError);
        throw supabaseError;
      }
      console.log("[DEBUG: deleteIndividual] Individu berhasil dihapus dari Supabase.");
      await fetchFamilyData();
    } catch (err: any) {
      console.error("[ERROR: deleteIndividual] Gagal menghapus individu:", err.message);
      setError(err.message);
    }
  }, [fetchFamilyData]);

  const updateFamily = useCallback(async (family: SupabaseFamilyUpdate) => {
    console.log("[DEBUG: updateFamily] Data akan dikirim ke Supabase:", family);
    try {
      const { error: supabaseError } = await supabase
        .from('families')
        .update(family)
        .eq('id', family.id!);
      if (supabaseError) {
        console.error("[DEBUG: updateFamily] Error dari Supabase:", supabaseError);
        throw supabaseError;
      }
      console.log("[DEBUG: updateFamily] Data keluarga berhasil diperbarui di Supabase.");
      await fetchFamilyData();
    } catch (err: any) {
      console.error("[ERROR: updateFamily] Gagal memperbarui keluarga:", err.message);
      setError(err.message);
    }
  }, [fetchFamilyData]);

  const addFamily = useCallback(async (family: SupabaseFamilyInsert) => {
    console.log("[DEBUG: addFamily] Data akan dikirim ke Supabase:", family);
    try {
      const dataToSend = { ...family };
      if ('id' in dataToSend && (dataToSend.id === "" || dataToSend.id === undefined)) {
        delete (dataToSend as any).id;
      }
      const { data: newRow, error: supabaseError } = await supabase
        .from('families')
        .insert(dataToSend)
        .select();

      if (supabaseError) {
        console.error("[DEBUG: addFamily] Error dari Supabase:", supabaseError);
        throw supabaseError;
      }
      console.log("[DEBUG: addFamily] Data keluarga berhasil ditambahkan ke Supabase:", newRow);
      await fetchFamilyData();
    } catch (err: any) {
      console.error("[ERROR: addFamily] Gagal menambahkan keluarga:", err.message);
      setError(err.message);
    }
  }, [fetchFamilyData]);

  const deleteFamily = useCallback(async (id: string) => {
    console.log("[DEBUG: deleteFamily] ID akan dihapus dari Supabase:", id);
    try {
      const { error: supabaseError } = await supabase
        .from('families')
        .delete()
        .eq('id', id);
      if (supabaseError) {
        console.error("[DEBUG: deleteFamily] Error dari Supabase:", supabaseError);
        throw supabaseError;
      }
      console.log("[DEBUG: deleteFamily] Keluarga berhasil dihapus dari Supabase.");
      await fetchFamilyData();
    } catch (err: any) {
      console.error("[ERROR: deleteFamily] Gagal menghapus keluarga:", err.message);
      setError(err.message);
    }
  }, [fetchFamilyData]);

  const exportData = useCallback(() => { console.warn("Export data lokal tidak diimplementasikan dengan Supabase."); }, []);
  const importData = useCallback((file: File) => { console.warn("Import data lokal tidak diimplementasikan dengan Supabase."); }, []);


  return {
    data,
    isLoaded,
    error,
    updateIndividual,
    addIndividual,
    deleteIndividual,
    addFamily,
    updateFamily,
    deleteFamily,
    exportData,
    importData,
    setData: fetchFamilyData
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