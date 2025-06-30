// hooks/UseFamiliData.ts
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Path diperbaiki: dari 'hooks/UseFamiliData.ts' ke 'src/supabaseClient.ts' adalah '../supabaseClient'
import { Database } from '../types/supabase'; // Path diperbaiki: dari 'hooks/UseFamiliData.ts' ke 'src/types/supabase.ts' adalah '../types/supabase'

// Definisikan tipe sesuai skema Supabase Anda
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
    try {
      const { data: individualsData, error: individualsError } = await supabase
        .from('individuals')
        .select('*');

      if (individualsError) throw individualsError;

      const { data: familiesData, error: familiesError } = await supabase
        .from('families')
        .select('*');

      if (familiesError) throw familiesError;

      const individualsMap = new Map<string, Individual>();
      individualsData.forEach(ind => individualsMap.set(ind.id, ind));

      const familiesMap = new Map<string, Family>();
      familiesData.forEach(fam => familiesMap.set(fam.id, fam));

      setIndividuals(individualsMap);
      setFamilies(familiesMap);

    } catch (err: any) {
      console.error("Failed to load family data from Supabase:", err.message);
      setError(`Failed to load family data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFamilyData();
  }, [fetchFamilyData]);

  const updateIndividual = useCallback(async (individual: Individual) => {
    try {
      const { data, error } = await supabase
        .from('individuals')
        .update(individual)
        .eq('id', individual.id)
        .select();

      if (error) throw error;
      setIndividuals(prev => new Map(prev).set(individual.id, data[0] as Individual));
    } catch (err: any) {
      console.error("Error updating individual:", err.message);
      setError(`Failed to update individual: ${err.message}`);
    }
  }, []);

  const addIndividual = useCallback(async (individual: Omit<NewIndividual, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('individuals')
        .insert(individual)
        .select();

      if (error) throw error;
      setIndividuals(prev => new Map(prev).set(data[0].id, data[0] as Individual));
    } catch (err: any) {
      console.error("Error adding individual:", err.message);
      setError(`Failed to add individual: ${err.message}`);
    }
  }, []);

  const deleteIndividual = useCallback(async (individualId: string) => {
    try {
      const { error } = await supabase
        .from('individuals')
        .delete()
        .eq('id', individualId);

      if (error) throw error;
      setIndividuals(prev => {
        const newMap = new Map(prev);
        newMap.delete(individualId);
        return newMap;
      });
      await fetchFamilyData(); // Re-fetch for consistency
    } catch (err: any) {
      console.error("Error deleting individual:", err.message);
      setError(`Failed to delete individual: ${err.message}`);
    }
  }, [fetchFamilyData]);

  const updateFamily = useCallback(async (updatedFamily: Family) => {
    try {
      const { data, error } = await supabase
        .from('families')
        .update(updatedFamily)
        .eq('id', updatedFamily.id)
        .select();

      if (error) throw error;
      setFamilies(prev => new Map(prev).set(updatedFamily.id, data[0] as Family));
    } catch (err: any) {
      console.error("Error updating family:", err.message);
      setError(`Failed to update family: ${err.message}`);
    }
  }, []);

  const addFamily = useCallback(async (familyData: Omit<NewFamily, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('families')
        .insert(familyData)
        .select();

      if (error) throw error;
      setFamilies(prev => new Map(prev).set(data[0].id, data[0] as Family));
    } catch (err: any) {
      console.error("Error adding family:", err.message);
      setError(`Failed to add family: ${err.message}`);
    }
  }, []);

  const deleteFamily = useCallback(async (familyId: string) => {
    try {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', familyId);

      if (error) throw error;
      setFamilies(prev => {
        const newMap = new Map(prev);
        newMap.delete(familyId);
        return newMap;
      });
      await fetchFamilyData(); // Re-fetch for consistency
    } catch (err: any) {
      console.error("Error deleting family:", err.message);
      setError(`Failed to delete family: ${err.message}`);
    }
  }, [fetchFamilyData]);

  const replacer = (key: string, value: any) => {
    if(value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries()),
      };
    }
    return value;
  };

  const reviver = (key: string, value: any) => {
    if(typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  };

  const exportData = useCallback(async () => {
    try {
        const dataToExport = {
          individuals: Array.from(individuals.entries()),
          families: Array.from(families.entries()),
        };
        const dataStr = JSON.stringify(dataToExport, replacer, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'family_tree_data.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    } catch(e) {
        console.error("Error exporting data:", e);
        alert("Could not export data.");
    }
  }, [individuals, families]);

  const importData = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const json = event.target?.result as string;
            if(!json) throw new Error("File is empty");
            const parsedData = JSON.parse(json, reviver);

            if (!parsedData.individuals || !Array.isArray(parsedData.individuals) ||
                !parsedData.families || !Array.isArray(parsedData.families)) {
                throw new Error("Invalid data format in file.");
            }

            // Hapus data lama di Supabase (hati-hati, ini akan menghapus semua!)
            await supabase.from('families').delete().neq('id', 'dummy_id'); // Dummy condition to delete all
            await supabase.from('individuals').delete().neq('id', 'dummy_id'); // Dummy condition to delete all

            // Masukkan data baru
            const { error: indInsertError } = await supabase.from('individuals').insert(parsedData.individuals.map(([id, data]: [string, any]) => ({ id, ...data })));
            if (indInsertError) throw indInsertError;

            const { error: famInsertError } = await supabase.from('families').insert(parsedData.families.map(([id, data]: [string, any]) => ({ id, ...data })));
            if (famInsertError) throw famInsertError;

            alert("Data imported successfully and saved to Supabase!");
            await fetchFamilyData();
        } catch (e: any) {
            console.error("Error importing data:", e.message);
            alert(`Failed to import data: ${e.message}. Please check the file format.`);
        }
    };
    reader.readAsText(file);
  }, [fetchFamilyData]);


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
    if (!context) {
        throw new Error('useFamily must be used within a FamilyData.Provider');
    }
    return context;
};