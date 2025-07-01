// hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // <--- PERBAIKAN PATH DI SINI
import { User, Session } from '@supabase/supabase-js';

interface UseAuthResult {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdminUser: boolean;
  logout: () => Promise<void>;
}

export const useAuth = (): UseAuthResult => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error.message);
        setUser(null);
        setSession(null);
      } else {
        setSession(session);
        setUser(session?.user || null);
        // Anda mungkin ingin membuat email admin ini sebagai variabel lingkungan atau dari konfigurasi Supabase
        setIsAdminUser(session?.user?.email === 'admin@example.com');
      }
      setLoading(false);
    };

    getSession();

    // Langsung assign subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        // Anda mungkin ingin membuat email admin ini sebagai variabel lingkungan atau dari konfigurasi Supabase
        setIsAdminUser(session?.user?.email === 'admin@example.com');
        setLoading(false);
      }
    );

    // Pastikan subscription di-unsubscribe saat komponen di-unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // Array dependensi kosong agar hanya berjalan sekali saat mount

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      setIsAdminUser(false);
      console.log("Logged out successfully.");
    } catch (err: any) {
      console.error("Logout error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, session, loading, isAdminUser, logout };
};