import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { cleanText } from '../lib/validators';

const AuthContext = createContext(null);

// Maps Supabase auth errors to translation keys (never shows raw server text).
export function authErrorKey(error) {
  const msg = String(error?.message || '').toLowerCase();
  if (msg.includes('invalid login')) return 'err.invalidLogin';
  if (msg.includes('email not confirmed')) return 'err.emailNotConfirmed';
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'err.alreadyRegistered';
  if (msg.includes('rate limit') || error?.status === 429) return 'err.rateLimit';
  if (msg.includes('fetch') || msg.includes('network')) return 'err.network';
  return 'err.generic';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => active && setSession(data.session))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  const loadProfile = useCallback(async () => {
    if (!supabase || !userId) {
      setProfile(null);
      return null;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data ?? null);
    return data ?? null;
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanText(email).toLowerCase(),
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async ({ email, password, fullName, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email: cleanText(email).toLowerCase(),
      password,
      options: { data: { full_name: cleanText(fullName), role } },
    });
    if (error) throw error;
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('User already registered');
    }
    return { needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      refreshProfile: loadProfile,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
    }),
    [session, profile, loadProfile, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
