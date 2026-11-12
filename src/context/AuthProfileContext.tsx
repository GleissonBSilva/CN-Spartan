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
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // Recupera usuário local caso o Supabase esteja aguardando confirmação de e-mail no cadastro
  const getFallbackCachedUser = useCallback((): User | null => {
    try {
      const raw = localStorage.getItem('weflix_user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || (!parsed.uid && !parsed.id) || !parsed.email) return null;
      return {
        id: parsed.uid || parsed.id,
        email: parsed.email,
        user_metadata: {
          full_name: parsed.full_name || parsed.displayName,
          display_name: parsed.displayName || parsed.full_name,
          whatsapp: parsed.whatsapp,
          plan_name: parsed.plan_name,
          max_screens: parsed.max_screens,
          is_trial: parsed.is_trial,
          status: parsed.status,
          expires_at: parsed.expires_at,
        },
      } as unknown as User;
    } catch {
      return null;
    }
  }, []);

  // Sincroniza um perfil no registro local compartilhado com o Painel Admin
  const syncLocalProfileRegistry = useCallback((prof: Profile) => {
    try {
      const existing = JSON.parse(localStorage.getItem('spartan_registered_profiles') || '[]');
      const list: Profile[] = Array.isArray(existing) ? existing : [];
      const filtered = list.filter(
        (item) => item.id !== prof.id && item.email?.toLowerCase() !== prof.email?.toLowerCase()
      );
      localStorage.setItem('spartan_registered_profiles', JSON.stringify([prof, ...filtered]));
    } catch {
      // ignore
    }
  }, []);

  // Carregar perfil do Supabase + sincronizar dados de cadastro e expiração automática
  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userMeta?: Record<string, any>): Promise<Profile | null> => {
    try {
      const cleanEmail = (userEmail || '').toLowerCase();

      // 0. Sincronização prioritária em tempo real com o servidor /api/clients
      let cloudProfile: Profile | null = null;
      let isCloudDeleted = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('/api/clients', { signal: controller.signal })
          .catch(() => fetch('https://cn-spartan.vercel.app/api/clients', { signal: controller.signal }));
        clearTimeout(timeoutId);
        if (res && res.ok) {
          const cloudData = await res.json();
          const profilesList: Profile[] = Array.isArray(cloudData) ? cloudData : (cloudData.profiles || []);
          const deletedList: string[] = Array.isArray(cloudData?.deleted) ? cloudData.deleted : [];

          // Se a conta foi excluída pelo Administrador, revoga acesso imediatamente
          if (
            deletedList.includes(userId) ||
            (cleanEmail && deletedList.includes(cleanEmail))
          ) {
            isCloudDeleted = true;
          } else {
            cloudProfile = profilesList.find(
              (p: Profile) => p.id === userId || (cleanEmail && p.email?.toLowerCase() === cleanEmail)
            ) || null;
          }
        }
      } catch {
        // Fallback offline
      }

      if (isCloudDeleted) {
        console.warn('[Spartan Security] Conta excluída pela administração. Revogando sessão...');
        localStorage.removeItem('weflix_user');
        localStorage.removeItem('spartan_registered_profiles');
        await supabase.auth.signOut().catch(() => {});
        setUser(null);
        setSession(null);
        setProfile(null);
        return null;
      }

      let localStoredProfile: Profile | null = null;
      try {
        const existing = JSON.parse(localStorage.getItem('spartan_registered_profiles') || '[]');
        if (Array.isArray(existing)) {
          localStoredProfile = existing.find(
            (p: Profile) => p.id === userId || (cleanEmail && p.email?.toLowerCase() === cleanEmail)
          ) || null;
        }
      } catch {
        localStoredProfile = null;
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      let data: Profile | null = null;
      let error: { message: string } | null = null;

      if (isUuid) {
        const res = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        data = (res.data as Profile) || null;
        error = res.error;
      }

      if (error && !localStoredProfile && !cloudProfile) {
        console.error('Erro ao buscar perfil:', error.message);
        return null;
      }

      if (data || localStoredProfile || cloudProfile) {
        const raw = (cloudProfile || data || localStoredProfile) as Profile;
        const hasAdminEdit = Boolean(localStoredProfile?.admin_updated_at || cloudProfile);
        const metaPlan = userMeta?.plan_name || cloudProfile?.plan_name || localStoredProfile?.plan_name;
        const metaScreens = Number(userMeta?.max_screens || cloudProfile?.max_screens || localStoredProfile?.max_screens || 0);
        const metaName = userMeta?.full_name || userMeta?.display_name || cloudProfile?.full_name || localStoredProfile?.full_name;
        const metaPhone = userMeta?.whatsapp || cloudProfile?.whatsapp || localStoredProfile?.whatsapp;

        // Se a nuvem ou o Admin editou os dados deste cliente, prevalece a alteração do Admin
        let resolvedPlan =
          cloudProfile?.plan_name ||
          (hasAdminEdit && localStoredProfile?.plan_name
            ? localStoredProfile.plan_name
            : raw.plan_name && !raw.plan_name.toLowerCase().startsWith('teste grátis') && raw.plan_name !== 'Mensal'
            ? raw.plan_name
            : metaPlan || raw.plan_name || 'SPARTAN PRO');

        let resolvedScreens =
          cloudProfile?.max_screens ||
          (hasAdminEdit && localStoredProfile?.max_screens
            ? Number(localStoredProfile.max_screens)
            : raw.max_screens && raw.max_screens > 1
            ? raw.max_screens
            : metaScreens > 0
            ? metaScreens
            : raw.max_screens || 1);

        let resolvedExpiresAt =
          cloudProfile?.expires_at ||
          (hasAdminEdit && localStoredProfile?.expires_at ? localStoredProfile.expires_at : raw.expires_at);

        let resolvedStatus =
          cloudProfile?.status ||
          (hasAdminEdit && localStoredProfile?.status ? localStoredProfile.status : raw.status);

        let resolvedIsTrial =
          cloudProfile?.is_trial !== undefined
            ? cloudProfile.is_trial
            : hasAdminEdit && localStoredProfile?.is_trial !== undefined
            ? localStoredProfile.is_trial
            : raw.is_trial ?? (userMeta?.is_trial ?? false);

        if (!cloudProfile && localStoredProfile && !hasAdminEdit) {
          const dbExp = new Date(raw.expires_at).getTime();
          const localExp = new Date(localStoredProfile.expires_at).getTime();
          if (localExp > dbExp && localStoredProfile.status === 'ativo') {
            resolvedExpiresAt = localStoredProfile.expires_at;
            resolvedStatus = 'ativo';
            resolvedIsTrial = localStoredProfile.is_trial;
          }
        }

        // Bloqueio automático ao finalizar o período de teste ou assinatura
        const isMaster = cleanEmail === ADMIN_MASTER_EMAIL || raw.role === 'admin';
        if (!isMaster && new Date(resolvedExpiresAt).getTime() <= Date.now() && resolvedStatus === 'ativo') {
          resolvedStatus = 'vencido';
          try {
            await supabase
              .from('profiles')
              .update({ status: 'vencido' })
              .eq('id', raw.id);
          } catch {
            // ignore
          }
        }

        const mergedProfile: Profile = {
          ...raw,
          email: hasAdminEdit && localStoredProfile?.email ? localStoredProfile.email : raw.email,
          full_name:
            hasAdminEdit && localStoredProfile?.full_name
              ? localStoredProfile.full_name
              : raw.full_name || metaName || undefined,
          whatsapp:
            hasAdminEdit && localStoredProfile
              ? localStoredProfile.whatsapp
              : raw.whatsapp || metaPhone || undefined,
          plan_name: resolvedPlan,
          max_screens: resolvedScreens,
          status: resolvedStatus,
          is_trial: resolvedIsTrial,
          expires_at: resolvedExpiresAt,
          admin_updated_at: localStoredProfile?.admin_updated_at,
        };

        // Se o banco estava sem o plano/telas escolhidos no cadastro, tenta sincronizar no Supabase
        if (
          data &&
          (data.plan_name !== mergedProfile.plan_name ||
            data.max_screens !== mergedProfile.max_screens ||
            data.status !== mergedProfile.status)
        ) {
          try {
            await supabase
              .from('profiles')
              .update({
                plan_name: mergedProfile.plan_name,
                max_screens: mergedProfile.max_screens,
                status: mergedProfile.status,
              })
              .eq('id', mergedProfile.id);
          } catch {
            // ignore
          }
        }

        syncLocalProfileRegistry(mergedProfile);
        setProfile(mergedProfile);
        return mergedProfile;
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
          full_name: userMeta?.full_name || userMeta?.display_name || undefined,
          whatsapp: userMeta?.whatsapp || undefined,
          role: isMaster ? 'admin' : 'client',
          status: initialStatus,
          plan_name: isMaster
            ? 'Master Admin'
            : userMeta?.plan_name || 'SPARTAN PRO',
          is_trial: !isMaster && clientDays > 0,
          trial_used: !isMaster && clientDays > 0,
          expires_at: new Date(Date.now() + expiryDuration * 24 * 60 * 60 * 1000).toISOString(),
          max_screens: isMaster ? 5 : Number(userMeta?.max_screens || 1),
          created_at: new Date().toISOString(),
        };

        syncLocalProfileRegistry(fallbackProfile);

        // Sincroniza imediatamente na nuvem (/api/clients) para aparecer na mesma hora no Painel Admin!
        try {
          fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fallbackProfile),
          }).catch(() => fetch('https://cn-spartan.vercel.app/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fallbackProfile),
          }));
        } catch {}

        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .insert(fallbackProfile)
          .select()
          .maybeSingle();

        if (!insertErr && inserted) {
          setProfile(inserted as Profile);
          return inserted as Profile;
        }

        setProfile(fallbackProfile);
        return fallbackProfile;
      }

      return null;
    } catch (err) {
      console.error('Erro inesperado ao carregar perfil:', err);
      return null;
    }
  }, [syncLocalProfileRegistry]);

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const fallbackUser = getFallbackCachedUser();
    const activeUser = currentSession?.user || fallbackUser || user;
    if (!activeUser) return null;
    if (!currentSession?.user && fallbackUser) {
      setUser(fallbackUser);
    }
    return await fetchProfile(activeUser.id, activeUser.email, activeUser.user_metadata);
  }, [user, fetchProfile, getFallbackCachedUser]);

  // Inicializar sessão e monitorar alterações de auth (incluindo cadastro imediato em período de teste)
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchProfile(initialSession.user.id, initialSession.user.email, initialSession.user.user_metadata);
          } else {
            const fallbackUser = getFallbackCachedUser();
            if (fallbackUser) {
              setUser(fallbackUser);
              await fetchProfile(fallbackUser.id, fallbackUser.email, fallbackUser.user_metadata);
            } else {
              setSession(null);
              setUser(null);
            }
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
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        await fetchProfile(newSession.user.id, newSession.user.email, newSession.user.user_metadata);
      } else {
        const fallbackUser = getFallbackCachedUser();
        if (fallbackUser) {
          setUser(fallbackUser);
          await fetchProfile(fallbackUser.id, fallbackUser.email, fallbackUser.user_metadata);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    const handleCustomAuthUpdate = () => {
      if (!mounted) return;
      initAuth();
    };
    window.addEventListener('spartan_auth_updated', handleCustomAuthUpdate);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('spartan_auth_updated', handleCustomAuthUpdate);
    };
  }, [fetchProfile, getFallbackCachedUser]);

  // Verificador automático em tempo real: sincroniza com o Admin Dashboard a cada 10s
  // Se o cliente for suspenso, bloqueia imediatamente o player.
  // Se for deletado pelo admin, revoga a sessão na hora.
  useEffect(() => {
    let active = true;

    const checkCloudStatus = async () => {
      if (!user) return;
      const cleanEmail = (user.email || '').toLowerCase();
      const isMaster = cleanEmail === ADMIN_MASTER_EMAIL;
      if (isMaster) return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('/api/clients', { signal: controller.signal })
          .catch(() => fetch('https://cn-spartan.vercel.app/api/clients', { signal: controller.signal }));
        clearTimeout(timeoutId);

        if (res && res.ok && active) {
          const cloudData = await res.json();
          const profilesList: Profile[] = Array.isArray(cloudData) ? cloudData : (cloudData.profiles || []);
          const deletedList: string[] = Array.isArray(cloudData?.deleted) ? cloudData.deleted : [];

          // 1. Cliente excluído pelo Admin: revoga credenciais e encerra a reprodução na hora
          if (deletedList.includes(user.id) || (cleanEmail && deletedList.includes(cleanEmail))) {
            console.warn('[Spartan Security] Conta excluída pela administração. Encerrando sessão...');
            localStorage.removeItem('weflix_user');
            localStorage.removeItem('spartan_registered_profiles');
            await supabase.auth.signOut().catch(() => {});
            if (active) {
              setUser(null);
              setSession(null);
              setProfile(null);
            }
            return;
          }

          // 2. Cliente com status alterado (suspenso, vencido, ou reativado para ativo)
          const cp = profilesList.find(
            (p: Profile) => p.id === user.id || (cleanEmail && p.email?.toLowerCase() === cleanEmail)
          );

          if (cp && active) {
            setProfile((current) => {
              const base: Profile = current || {
                id: cp.id || user.id,
                email: cp.email || user.email || '',
                full_name: cp.full_name || '',
                role: 'client',
                plan_name: cp.plan_name || 'SPARTAN PRO',
                max_screens: cp.max_screens || 1,
                is_trial: false,
                trial_used: true,
                expires_at: cp.expires_at || new Date().toISOString(),
                created_at: new Date().toISOString(),
                status: cp.status,
              };

              if (
                !current ||
                current.status !== cp.status ||
                current.expires_at !== cp.expires_at ||
                current.plan_name !== cp.plan_name ||
                current.max_screens !== cp.max_screens
              ) {
                const updated: Profile = {
                  ...base,
                  status: cp.status,
                  expires_at: cp.expires_at,
                  plan_name: cp.plan_name || base.plan_name,
                  max_screens: cp.max_screens || base.max_screens,
                };
                syncLocalProfileRegistry(updated);
                return updated;
              }
              return current;
            });
          }
        }
      } catch {
        // Fallback offline
      }
    };

    const interval = setInterval(() => {
      setNowTick(Date.now());
      if (profile && profile.role !== 'admin') {
        const expTime = new Date(profile.expires_at).getTime();
        if (expTime <= Date.now() && profile.status === 'ativo') {
          const blockedProfile: Profile = { ...profile, status: 'vencido' };
          setProfile(blockedProfile);
          syncLocalProfileRegistry(blockedProfile);
          supabase.from('profiles').update({ status: 'vencido' }).eq('id', profile.id).then(() => {});
        }
      }
      checkCloudStatus();
    }, 10000);

    // Verificação inicial rápida
    checkCloudStatus();

    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === 'spartan_registered_profiles' && user) {
        fetchProfile(user.id, user.email, user.user_metadata);
      }
    };
    window.addEventListener('storage', handleStorageSync);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [profile, user, fetchProfile, syncLocalProfileRegistry]);

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
    const now = nowTick || Date.now();
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
  }, [profile, user, nowTick]);

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
      await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
    }
    return { error };
  }, [fetchProfile]);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
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
