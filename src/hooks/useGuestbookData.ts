// hooks/useGuestbookData.ts
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // <--- PERBAIKAN PATH DI SINI
import { Tables } from '../types/supabase'; // Import tipe dari supabase.ts

// Sesuaikan dengan tipe GuestbookEntry dari supabase.ts
type SupabaseGuestbookEntry = Tables<'guestbook_entries'>['Row'];
type SupabaseGuestbookEntryInsert = Tables<'guestbook_entries'>['Insert'];

export const useGuestbookData = () => {
    const [entries, setEntries] = useState<SupabaseGuestbookEntry[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null); // Tambahkan state error

    // Fungsi untuk fetching data dari Supabase
    const fetchGuestbookEntries = useCallback(async () => {
        setIsLoaded(false); // Set isLoaded ke false saat memulai fetching baru
        setError(null); // Reset error
        try {
            const { data, error: supabaseError } = await supabase
                .from('guestbook_entries')
                .select('*')
                .order('created_at', { ascending: false }); // Urutkan berdasarkan waktu terbaru

            if (supabaseError) throw supabaseError;
            setEntries(data);
        } catch (err: any) {
            console.error("Error fetching guestbook entries from Supabase:", err.message);
            setError(err.message);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        fetchGuestbookEntries();

        // --- Implementasi Realtime Supabase ---
        // Pastikan Anda telah mengaktifkan Realtime untuk tabel 'guestbook_entries' di dasbor Supabase Anda
        const channel = supabase
            .channel('public:guestbook_entries')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'guestbook_entries' },
                (payload) => {
                    console.log('Guestbook change received!', payload);
                    // Panggil ulang fetchGuestbookEntries untuk memperbarui data
                    fetchGuestbookEntries();
                }
            )
            .subscribe();

        // Cleanup subscription saat komponen di-unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchGuestbookEntries]); // Sertakan fetchGuestbookEntries di dependensi

    const addEntry = useCallback(async (name: string, message: string) => {
        try {
            // Supabase akan secara otomatis mengisi created_at jika Anda telah menentukannya sebagai `now()` di default value
            const newEntry: SupabaseGuestbookEntryInsert = {
                name,
                message,
                // created_at tidak perlu diset jika menggunakan default `now()` di database
            };
            const { data, error: supabaseError } = await supabase
                .from('guestbook_entries')
                .insert(newEntry)
                .select(); // Penting untuk .select() agar mengembalikan data yang baru di-insert

            if (supabaseError) throw supabaseError;
            // Karena kita menggunakan realtime subscription, fetchGuestbookEntries akan dipanggil secara otomatis
            // atau Anda bisa secara manual menambahkan data yang dikembalikan ke state entries
            // setEntries(prevEntries => [data[0], ...prevEntries]);
            console.log("Entry added successfully:", data);
        } catch (err: any) {
            console.error("Error adding guestbook entry:", err.message);
            setError(err.message);
        }
    }, []);

    return { entries, isLoaded, error, addEntry };
};


export const GuestbookContext = React.createContext<ReturnType<typeof useGuestbookData> | null>(null);

export const useGuestbook = () => {
    const context = React.useContext(GuestbookContext);
    if (!context) {
        throw new Error('useGuestbook must be used within a GuestbookContext.Provider');
    }
    return context;
};