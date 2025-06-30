// hooks/UseGuestbookData.ts
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Path diperbaiki: dari 'hooks/UseGuestbookData.ts' ke 'src/supabaseClient.ts' adalah '../supabaseClient'
import { Database } from '../types/supabase'; // Path diperbaiki: dari 'hooks/UseGuestbookData.ts' ke 'src/types/supabase.ts' adalah '../types/supabase'

export type GuestbookEntry = Database['public']['Tables']['guestbook_entries']['Row'];
export type NewGuestbookEntry = Database['public']['Tables']['guestbook_entries']['Insert'];
export type UpdatedGuestbookEntry = Database['public']['Tables']['guestbook_entries']['Update'];

interface UseGuestbookDataResult {
  entries: GuestbookEntry[];
  loading: boolean;
  error: string | null;
  addEntry: (name: string, message: string) => Promise<void>;
  updateEntry: (id: string, updatedEntry: UpdatedGuestbookEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  fetchEntries: () => Promise<void>;
}

export const useGuestbookData = (): UseGuestbookDataResult => {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('guestbook_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data as GuestbookEntry[]);
    } catch (err: any) {
      console.error("Error fetching guestbook entries:", err.message);
      setError(`Failed to fetch guestbook entries: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = useCallback(async (name: string, message: string) => {
    try {
      const { data, error } = await supabase
        .from('guestbook_entries')
        .insert({ name, message })
        .select();

      if (error) throw error;
      setEntries((prev) => [data[0] as GuestbookEntry, ...prev]);
    } catch (err: any) {
      console.error("Error adding guestbook entry:", err.message);
      setError(`Failed to add guestbook entry: ${err.message}`);
    }
  }, []);

  const updateEntry = useCallback(async (id: string, updatedEntry: UpdatedGuestbookEntry) => {
    try {
      const { data, error } = await supabase
        .from('guestbook_entries')
        .update(updatedEntry)
        .eq('id', id)
        .select();

      if (error) throw error;
      setEntries((prev) =>
        prev.map((entry) => (entry.id === id ? (data[0] as GuestbookEntry) : entry))
      );
    } catch (err: any) {
      console.error("Error updating guestbook entry:", err.message);
      setError(`Failed to update guestbook entry: ${err.message}`);
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('guestbook_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err: any) {
      console.error("Error deleting guestbook entry:", err.message);
      setError(`Failed to delete guestbook entry: ${err.message}`);
    }
  }, []);

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    fetchEntries,
  };
};

export const GuestbookContext = React.createContext<ReturnType<typeof useGuestbookData> | null>(null);

export const useGuestbook = () => {
    const context = React.useContext(GuestbookContext);
    if (!context) {
        throw new Error('useGuestbook must be used within a GuestbookContext.Provider');
    }
    return context;
};