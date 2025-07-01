// hooks/useGuestbookData.ts
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Tables } from '../types/supabase';

type SupabaseGuestbookEntry = Tables<'guestbook_entries'>['Row'];
type SupabaseGuestbookEntryInsert = Tables<'guestbook_entries'>['Insert']; // <--- PERBAIKAN DI SINI: Tambahkan ']'

export const useGuestbookData = () => {
    const [entries, setEntries] = useState<SupabaseGuestbookEntry[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGuestbookEntries = useCallback(async () => {
        setIsLoaded(false);
        setError(null);
        console.log("[DEBUG: useGuestbookData] Memulai fetching guestbook entries dari Supabase...");
        try {
            const { data, error: supabaseError } = await supabase
                .from('guestbook_entries')
                .select('*')
                .order('created_at', { ascending: false });

            if (supabaseError) {
                console.error("[ERROR: useGuestbookData] Error fetching guestbook entries:", supabaseError.message);
                throw supabaseError;
            }
            setEntries(data);
            console.log("[DEBUG: useGuestbookData] Guestbook entries fetched:", data.length);
        } catch (err: any) {
            console.error("[ERROR: useGuestbookData] Gagal memuat guestbook entries dari Supabase:", err.message);
            setError(err.message);
        } finally {
            setIsLoaded(true);
            console.log("[DEBUG: useGuestbookData] Loading guestbook entries selesai.");
        }
    }, []);

    useEffect(() => {
        fetchGuestbookEntries();

        const channel = supabase
            .channel('public:guestbook_entries')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'guestbook_entries' },
                (payload) => {
                    console.log('[DEBUG: Realtime] Perubahan guestbook diterima:', payload);
                    fetchGuestbookEntries();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            console.log('[DEBUG: Realtime] Channel Guestbook dibersihkan.');
        };
    }, [fetchGuestbookEntries]);

    const addEntry = useCallback(async (name: string, message: string) => {
        console.log("[DEBUG: addEntry] Data akan dikirim ke Supabase:", { name, message });
        try {
            const newEntry: SupabaseGuestbookEntryInsert = {
                name,
                message,
            };
            const { data, error: supabaseError } = await supabase
                .from('guestbook_entries')
                .insert(newEntry)
                .select();

            if (supabaseError) {
                console.error("[DEBUG: addEntry] Error dari Supabase:", supabaseError);
                throw supabaseError;
            }
            console.log("[DEBUG: addEntry] Entry berhasil ditambahkan ke Supabase:", data);
        } catch (err: any) {
            console.error("[ERROR: addEntry] Gagal menambahkan entry guestbook:", err.message);
            setError(err.message);
        }
    }, []);

    return { entries, isLoaded, error, addEntry };
};

// Definisi dan ekspor GuestbookContext
export const GuestbookContext = React.createContext<ReturnType<typeof useGuestbookData> | null>(null);

// Definisi dan ekspor useGuestbook hook
export const useGuestbook = () => {
    const context = React.useContext(GuestbookContext);
    if (!context) {
        throw new Error('useGuestbook must be used within a GuestbookContext.Provider');
    }
    return context;
};