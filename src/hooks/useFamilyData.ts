// Silsilah_1/src/hooks/useFamilyData.ts
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Tables } from '../types/supabase';

type Individual = Tables<'individuals'>['Row'];
type Family = Tables<'families'>['Row'];

export const useFamilyData = () => { // <--- Ini adalah hook utama
  const [individuals, setIndividuals] = useState<Map<string, Individual>>(new Map());
  const [families, setFamilies] = useState<Map<string, Family>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFamilyData = useCallback(async () => {
    console.log("[DEBUG: useFamilyData] Memulai fetching data keluarga dari Supabase...");
    setLoading(true);
    setError(null);
    try {
      const { data: individualsData, error: individualsError } = await supabase
        .from('individuals')
        .select('*');

      if (individualsError) throw individualsError;

      const { data: familiesData, error: familiesError } = await supabase
        .from('families')
        .select('*');

      if (familiesError) throw familiesError;

      const newIndividualsMap = new Map<string, Individual>();
      individualsData.forEach(ind => newIndividualsMap.set(ind.id, ind));
      setIndividuals(newIndividualsMap);
      console.log("[DEBUG: useFamilyData] Individuals fetched:", individualsData.length);

      const newFamiliesMap = new Map<string, Family>();
      familiesData.forEach(fam => newFamiliesMap.set(fam.id, fam));
      setFamilies(newFamiliesMap);
      console.log("[DEBUG: useFamilyData] Families fetched:", familiesData.length);

      console.log("[DEBUG: useFamilyData] Data keluarga berhasil diatur.");

    } catch (err: any) {
      console.error("[ERROR: useFamilyData] Gagal fetching data keluarga:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log("[DEBUG: useFamilyData] Loading data keluarga selesai.");
    }
  }, []);

  useEffect(() => {
    fetchFamilyData();

    const individualsChannel = supabase
      .channel('individuals_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'individuals' }, (payload) => {
        console.log("[DEBUG: Realtime] Perubahan individu terdeteksi:", payload);
        fetchFamilyData();
      })
      .subscribe();

    const familiesChannel = supabase
      .channel('families_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'families' }, (payload) => {
        console.log("[DEBUG: Realtime] Perubahan keluarga terdeteksi:", payload);
        fetchFamilyData();
      })
      .subscribe();

    return () => {
      console.log("[DEBUG: Realtime] Channel Realtime dibersihkan.");
      supabase.removeChannel(individualsChannel);
      supabase.removeChannel(familiesChannel);
    };
  }, [fetchFamilyData]);

  // --- Fungsi CRUD untuk Individu ---
  const addIndividual = useCallback(async (individual: Tables<'individuals'>['Insert']) => {
    console.log("[DEBUG: addIndividual] Data akan dikirim ke Supabase:", individual);
    try {
      const { data: newIndividual, error } = await supabase
        .from('individuals')
        .insert(individual)
        .select();
      if (error) throw error;
      console.log("[DEBUG: addIndividual] Data individu berhasil ditambahkan ke Supabase:", newIndividual);
      return newIndividual[0];
    } catch (err: any) {
      console.error("[ERROR: addIndividual] Gagal menambahkan individu:", err.message);
      setError(err.message);
      throw err;
    }
  }, []);

  const updateIndividual = useCallback(async (individual: Tables<'individuals'>['Update']) => {
    console.log("[DEBUG: updateIndividual] Data akan dikirim ke Supabase:", individual);
    try {
      const { data: updatedIndividual, error } = await supabase
        .from('individuals')
        .update(individual)
        .eq('id', individual.id!)
        .select();
      if (error) throw error;
      console.log("[DEBUG: updateIndividual] Data individu berhasil diperbarui di Supabase.");
      return updatedIndividual[0];
    } catch (err: any) {
      console.error("[ERROR: updateIndividual] Gagal memperbarui individu:", err.message);
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteIndividual = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('individuals')
        .delete()
        .eq('id', id);
      if (error) throw error;
      console.log("[DEBUG: deleteIndividual] Individu berhasil dihapus.");
    } catch (err: any) {
      console.error("[ERROR: deleteIndividual] Gagal menghapus individu:", err.message);
      setError(err.message);
      throw err;
    }
  }, []);

  // --- Fungsi CRUD untuk Keluarga ---
  const addFamily = useCallback(async (family: Tables<'families'>['Insert']) => {
    console.log("[DEBUG: addFamily] Data akan dikirim ke Supabase:", family);
    try {
      const { data: newFamily, error } = await supabase
        .from('families')
        .insert(family)
        .select();
      if (error) throw error;

      console.log("[DEBUG: addFamily] Data keluarga berhasil ditambahkan ke Supabase:", newFamily);

      if (newFamily && newFamily[0] && newFamily[0].children_ids && newFamily[0].children_ids.length > 0) {
        const familyId = newFamily[0].id;
        const childUpdates = newFamily[0].children_ids.map(childId => ({
          id: childId,
          child_in_family_id: familyId,
        }));
        const { error: childUpdateError } = await supabase
          .from('individuals')
          .upsert(childUpdates, { onConflict: 'id' });

        if (childUpdateError) {
          console.error("[ERROR: addFamily] Gagal memperbarui child_in_family_id untuk anak-anak:", childUpdateError.message);
        } else {
          console.log("[DEBUG: addFamily] child_in_family_id anak-anak berhasil diperbarui.");
        }
      }
      return newFamily[0];
    } catch (err: any) {
      console.error("[ERROR: addFamily] Gagal menambahkan keluarga:", err.message);
      setError(err.message);
      throw err;
    }
  }, []);

  const updateFamily = useCallback(async (family: Tables<'families'>['Update']) => {
    console.log("[DEBUG: updateFamily] Data akan dikirim ke Supabase:", family);
    try {
      const { data: oldFamilyData, error: fetchError } = await supabase
        .from('families')
        .select('children_ids')
        .eq('id', family.id!)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn("[WARN: updateFamily] Gagal mengambil data keluarga lama:", fetchError.message);
      }

      const oldChildrenIds = oldFamilyData?.children_ids || [];
      const newChildrenIds = family.children_ids || [];

      const { data: updatedFamily, error } = await supabase
        .from('families')
        .update(family)
        .eq('id', family.id!)
        .select();
      if (error) throw error;

      console.log("[DEBUG: updateFamily] Data keluarga berhasil diperbarui di Supabase.");

      const familyId = updatedFamily[0].id;

      const childrenRemoved = oldChildrenIds.filter(id => !newChildrenIds.includes(id));
      if (childrenRemoved.length > 0) {
        const { error: removeError } = await supabase
          .from('individuals')
          .update({ child_in_family_id: null })
          .in('id', childrenRemoved);
        if (removeError) {
          console.error("[ERROR: updateFamily] Gagal menghapus child_in_family_id anak-anak:", removeError.message);
        } else {
          console.log("[DEBUG: updateFamily] child_in_family_id anak-anak yang dihapus berhasil di-null-kan.");
        }
      }

      const childrenAdded = newChildrenIds.filter(id => !oldChildrenIds.includes(id));
      if (childrenAdded.length > 0) {
        const childUpdates = childrenAdded.map(childId => ({
          id: childId,
          child_in_family_id: familyId,
        }));
        const { error: addError } = await supabase
          .from('individuals')
          .upsert(childUpdates, { onConflict: 'id' });
        if (addError) {
          console.error("[ERROR: updateFamily] Gagal menambahkan child_in_family_id anak-anak baru:", addError.message);
        } else {
          console.log("[DEBUG: updateFamily] child_in_family_id anak-anak baru berhasil diperbarui.");
        }
      }

      return updatedFamily[0];
    } catch (err: any) {
      console.error("[ERROR: updateFamily] Gagal memperbarui keluarga:", err.message);
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteFamily = useCallback(async (id: string) => {
    try {
      const { data: familyToDelete, error: fetchError } = await supabase
        .from('families')
        .select('children_ids')
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (familyToDelete && familyToDelete.children_ids && familyToDelete.children_ids.length > 0) {
        const { error: childUpdateError } = await supabase
          .from('individuals')
          .update({ child_in_family_id: null })
          .in('id', familyToDelete.children_ids);

        if (childUpdateError) {
          console.error("[ERROR: deleteFamily] Gagal menghapus child_in_family_id anak-anak terkait:", childUpdateError.message);
        }
      }

      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', id);
      if (error) throw error;
      console.log("[DEBUG: deleteFamily] Keluarga berhasil dihapus.");
    } catch (err: any) {
      console.error("[ERROR: deleteFamily] Gagal menghapus keluarga:", err.message);
      setError(err.message);
      throw err;
    }
  }, []);


  // Mengembalikan objek data dengan individuals dan families
  return {
    data: { individuals, families },
    loading,
    error,
    fetchFamilyData,
    addIndividual,
    updateIndividual,
    deleteIndividual,
    addFamily,
    updateFamily,
    deleteFamily,
  };
};

// --- DEFINISI KONTEKS & HOOK useFamily ---
// Pastikan ini juga diekspor di level teratas file.
export const FamilyDataContext = React.createContext<ReturnType<typeof useFamilyData> | null>(null);

export const useFamily = () => {
    const context = React.useContext(FamilyDataContext);
    if (!context) {
        throw new Error('useFamily must be used within a FamilyData.Provider');
    }
    return context;
};