// hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface UseAuthResult {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdminUser: boolean;
  login: (email: string, password: string) => Promise<{ user: User | null; session: Session | null; error: Error | null; }>;
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
        // Pastikan email ini adalah email ADMIN yang terdaftar di Supabase Auth
        setIsAdminUser(session?.user?.email === 'admin@example.com');
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        // Pastikan email ini adalah email ADMIN yang terdaftar di Supabase Auth
        setIsAdminUser(session?.user?.email === 'admin@example.com');
        setLoading(false);
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    // Ini adalah panggilan langsung ke API Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    setLoading(false);
    return { user: data.user, session: data.session, error };
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

  return { user, session, loading, isAdminUser, login, logout };
};