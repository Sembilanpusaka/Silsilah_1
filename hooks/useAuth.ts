// hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../src/supabaseClient'; 
import { User, Session } from '@supabase/supabase-js';

interface UseAuthResult {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdminUser: boolean; // Menunjukkan apakah pengguna adalah admin (berdasarkan email contoh)
  logout: () => Promise<void>;
}

export const useAuth = (): UseAuthResult => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false); // Default bukan admin

  useEffect(() => {
    // Fungsi untuk mendapatkan sesi awal
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error.message);
        setUser(null);
        setSession(null);
      } else {
        setSession(session);
        setUser(session?.user || null);
        // Tentukan admin berdasarkan email atau metadata lainnya
        // Contoh: Jika email 'admin@example.com' dianggap admin
        setIsAdminUser(session?.user?.email === 'admin@example.com'); // Sesuaikan ini
      }
      setLoading(false);
    };

    getSession();

    // Langganan perubahan status auth
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setIsAdminUser(session?.user?.email === 'admin@example.com'); // Sesuaikan ini
        setLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

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