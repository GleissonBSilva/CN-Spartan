import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/supabase';

const ADMIN_MASTER_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'gleisson1984@gmail.com').toLowerCase();

export interface AuthProfileContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isActive: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  daysRemaining: number;
  formattedExpiration: string;
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
}

const AuthProfileContext = createContext<AuthProfileContextType | undefined>(undefined);

export const AuthProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Carregar perfil do Supabase
  const fetchProfile = useCallback(async (userId: string, userEmail?: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil:', error.message);
        return null;
      }

      if (data) {
        setProfile(data as Profile);
        return data as Profile;
      }

      // Se por algum motivo o trigger não criou o perfil ainda (ex: usuário existente antigo)
      if (userEmail) {
        const isMaster = userEmail.toLowerCase() === ADMIN_MASTER_EMAIL;
        const savedTrialDays = Number(localStorage.getItem('spartan_trial_days') || 3);
        const trialEnabled = localStorage.getItem('spartan_trial_enabled') !== 'false';
        const clientDays = trialEnabled ? savedTrialDays : 0;
        const initialStatus = isMaster ? 'ativo' : clientDays > 0 ? 'ativo' : 'vencido';
        const expiryDuration = isMaster ? 365 : clientDays;

        const fallbackProfile: Profile = {
          id: userId,
          email: userEmail,
          role: isMaster ? 'admin' : 'client',
          status: initialStatus,
          plan_name: isMaster ? 'Master Admin' : clientDays > 0 ? `Teste Grátis (${clientDays} dias)` : 'Assinatura Necessária',
          is_trial: !isMaster && clientDays > 0,
          trial_used: !isMaster && clientDays > 0,
          expires_at: new Date(Date.now() + expiryDuration * 24 * 60 * 60 * 1000).toISOString(),
          max_screens: isMaster ? 5 : 1,
          created_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .insert(fallbackProfile)
          .select()
          .maybeSingle();

        if (!insertErr && inserted) {
          setProfile(inserted as Profile);
          return inserted as Profile;
        }
      }

      return null;
    } catch (err) {
      console.error('Erro inesperado ao carregar perfil:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    if (!user) return null;
    return await fetchProfile(user.id, user.email);
  }, [user, fetchProfile]);

  // Inicializar sessão e monitorar alterações de auth
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await fetchProfile(initialSession.user.id, initialSession.user.email);
          }
        }
      } catch (err) {
        console.error('Erro ao recuperar sessão:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchProfile(newSession.user.id, newSession.user.email);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Métricas e status da assinatura
  const { isAdmin, isExpired, isSuspended, isActive, daysRemaining, formattedExpiration } = useMemo(() => {
    const isMasterEmail = !!user?.email && user.email.toLowerCase() === ADMIN_MASTER_EMAIL;
    const adminRole = profile?.role === 'admin' || isMasterEmail;

    // Se é admin, sempre tem acesso irrestrito
    if (adminRole) {
      return {
        isAdmin: true,
        isExpired: false,
        isSuspended: false,
        isActive: true,
        daysRemaining: 9999,
        formattedExpiration: 'Acesso Ilimitado (Admin)',
      };
    }

    if (!profile) {
      return {
        isAdmin: false,
        isExpired: true,
        isSuspended: false,
        isActive: false,
        daysRemaining: 0,
        formattedExpiration: 'Sem cadastro',
      };
    }

    const suspended = profile.status === 'suspenso';
    const expiresTime = new Date(profile.expires_at).getTime();
    const now = Date.now();
    const expired = profile.status === 'vencido' || expiresTime <= now;
    const active = profile.status === 'ativo' && !expired && !suspended;

    const diffDays = Math.max(0, Math.ceil((expiresTime - now) / (1000 * 60 * 60 * 24)));

    let formatted = 'Data inválida';
    try {
      formatted = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(profile.expires_at));
    } catch {
      formatted = profile.expires_at;
    }

    return {
      isAdmin: false,
      isExpired: expired,
      isSuspended: suspended,
      isActive: active,
      daysRemaining: diffDays,
      formattedExpiration: formatted,
    };
  }, [profile, user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem('weflix_user');
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user.id, data.user.email);
    }
    return { error };
  }, [fetchProfile]);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user.id, data.user.email);
    }
    return { error, user: data.user };
  }, [fetchProfile]);

  const value = {
    user,
    session,
    profile,
    loading,
    isAdmin,
    isActive,
    isExpired,
    isSuspended,
    daysRemaining,
    formattedExpiration,
    refreshProfile,
    signOut,
    signInWithEmail,
    signUpWithEmail,
  };

  return (
    <AuthProfileContext.Provider value={value}>
      {children}
    </AuthProfileContext.Provider>
  );
};

export function useAuthProfile(): AuthProfileContextType {
  const context = useContext(AuthProfileContext);
  if (!context) {
    throw new Error('useAuthProfile deve ser utilizado dentro de um AuthProfileProvider');
  }
  return context;
}
