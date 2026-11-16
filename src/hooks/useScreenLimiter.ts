import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthProfile } from './useAuthProfile';
import { supabase } from '../lib/supabase';
import { CURRENT_APP_VERSION } from '../config/appVersion';
import { isTvBoxOrApk } from './useAppUpdateGuard';
import { fetchApi } from '../lib/apiConfig';

export interface ActiveDevice {
  deviceId: string;
  deviceName: string;
  lastPing: number;
  platform?: 'apk' | 'tvbox' | 'mobile-web' | 'web';
  appVersion?: string;
  currentPath?: string;
}

const isValidUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

// Gera ou recupera um identificador único e persistente para este aparelho
export const getLocalDeviceId = (): string => {
  let id = localStorage.getItem('cinespartan_device_id');
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('cinespartan_device_id', id);
  }
  return id;
};

// Detecta a categoria da plataforma ('tvbox' | 'apk' | 'mobile-web' | 'web')
export const getLocalPlatformType = (): 'apk' | 'tvbox' | 'mobile-web' | 'web' => {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isTv = /Android.*TV|SmartTV|BRAVIA|NetCast|AFTT|AFTM|Roku|WebOS|GoogleTV|MiBox/i.test(ua);
  if (isTv) return 'tvbox';
  if (isTvBoxOrApk()) return 'apk';
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return 'mobile-web';
  return 'web';
};

// Detecta o nome do dispositivo amigável para exibição
export const getLocalDeviceName = (): string => {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platformType = getLocalPlatformType();

  if (platformType === 'tvbox') {
    return 'TV Box / Smart TV (APK)';
  }
  if (platformType === 'apk') {
    return 'App Android (APK)';
  }
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return 'Apple iOS (Web)';
  }
  if (/Android/i.test(ua)) {
    return 'Celular Android (Web)';
  }
  if (/Windows/i.test(ua)) {
    return 'Computador Windows (Web)';
  }
  if (/Macintosh/i.test(ua)) {
    return 'Computador Mac (Web)';
  }
  if (/Linux/i.test(ua)) {
    return 'Dispositivo Linux (Web)';
  }

  return 'Navegador Web';
};

// Normaliza entradas salvas no formato antigo ou novo
const normalizeDeviceEntry = (raw: any): ActiveDevice | null => {
  if (!raw || typeof raw !== 'object') return null;
  const deviceId = String(raw.deviceId || raw.id || '').trim();
  if (!deviceId) return null;
  const deviceName = String(raw.deviceName || raw.platform || 'Aparelho Conectado').trim();
  let lastPing = Number(raw.lastPing ?? raw.last_seen ?? 0);
  if (isNaN(lastPing) || lastPing <= 0) {
    if (typeof raw.last_seen === 'string' || typeof raw.lastPing === 'string') {
      const parsedDate = new Date(raw.last_seen || raw.lastPing).getTime();
      if (!isNaN(parsedDate) && parsedDate > 0) lastPing = parsedDate;
    }
  }
  if (!Number.isFinite(lastPing) || lastPing <= 0) return null;
  return {
    deviceId,
    deviceName,
    lastPing,
    platform: raw.platform,
    appVersion: raw.appVersion || CURRENT_APP_VERSION,
    currentPath: raw.currentPath,
  };
};

const INACTIVE_TIMEOUT_MS = 65 * 1000; // 65 segundos sem ping = dispositivo fechado/inativo

export function useScreenLimiter(isPlaying: boolean = true) {
  const { user, profile, isAdmin } = useAuthProfile();
  const [isScreenBlocked, setIsScreenBlocked] = useState<boolean>(false);
  const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);

  const deviceId = getLocalDeviceId();
  const deviceName = getLocalDeviceName();
  const platformType = getLocalPlatformType();
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxScreens = (() => {
    const rawScreens = Number(profile?.max_screens || 1);
    const plan = String(profile?.plan_name || '').toUpperCase();
    if (plan.includes('START') && rawScreens > 1) return 1;
    if (plan.includes('PRO') && rawScreens > 2) return 2;
    if (plan.includes('BUSINESS') && rawScreens < 5) return 5;
    return rawScreens;
  })();

  // Persiste a lista de dispositivos ativos no localStorage, /api/clients e Supabase (cross-device)
  const persistActiveDevices = useCallback(
    async (userId: string, userEmail: string | undefined, sessions: ActiveDevice[]) => {
      const storageKey = `cinespartan_active_devices_${userId}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(sessions));
      } catch {}

      // Sincroniza na nuvem (/api/clients) para o Admin ver telas e plataforma (Web vs APK) em tempo real
      try {
        const syncPayload = {
          id: userId,
          email: userEmail,
          active_devices: sessions,
          last_platform: platformType,
          last_seen_at: new Date().toISOString(),
        };
        fetchApi('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncPayload),
        }).catch(() => {});
      } catch {}

      if (isValidUuid(userId)) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ active_devices: sessions })
            .eq('id', userId);

          if (error) {
            await supabase.auth.updateUser({
              data: { active_devices: sessions },
            });
          }
        } catch {
          // Ignora falha silenciosa de rede ou coluna ausente
        }
      }
    },
    [platformType]
  );

  // Carregar e sincronizar sessões ativas entre diferentes dispositivos
  const syncSessions = useCallback(
    async (registerThisDevice: boolean = true) => {
      // Admin tem telas ilimitadas
      const userEmail = (user?.email || '').toLowerCase().trim();
      const isMasterAdmin = isAdmin || userEmail === 'gleisson1984@gmail.com' || profile?.role === 'admin';

      if (isMasterAdmin || !user) {
        setIsScreenBlocked(false);
        return;
      }

      try {
        const now = Date.now();
        const storageKey = `cinespartan_active_devices_${user.id}`;
        let rawList: any[] = [];

        // 1. Tenta buscar sessões em tempo real na tabela profiles do Supabase (sincronização cross-device real)
        if (isValidUuid(user.id)) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('active_devices')
              .eq('id', user.id)
              .maybeSingle();

            if (!error && data && Array.isArray((data as any).active_devices)) {
              rawList = (data as any).active_devices;
            }
          } catch {}
        }

        // 2. Fallback para profile.active_devices, user_metadata ou localStorage
        if (rawList.length === 0) {
          if (Array.isArray(profile?.active_devices) && profile.active_devices.length > 0) {
            rawList = profile.active_devices;
          } else if (Array.isArray(user.user_metadata?.active_devices)) {
            rawList = user.user_metadata.active_devices;
          } else {
            try {
              const localSaved = localStorage.getItem(storageKey);
              if (localSaved) {
                const parsed = JSON.parse(localSaved);
                if (Array.isArray(parsed)) rawList = parsed;
              }
            } catch {}
          }
        }

        const sessions: ActiveDevice[] = rawList
          .map(normalizeDeviceEntry)
          .filter((item): item is ActiveDevice => item !== null);

        // 3. Limpar sessões de outros aparelhos que expiraram (mais de 45s sem ping) ou inválidas
        const otherValidSessions = sessions.filter(
          (s) => s.deviceId !== deviceId && now - s.lastPing >= 0 && now - s.lastPing < 45000
        );

        // 4. Checar se este dispositivo cabe no limite de telas do plano
        if (registerThisDevice) {
          // REGRA DE OURO DO STREAMING (Netflix/Spartan):
          // Se este aparelho JÁ ESTÁ reproduzindo o vídeo ativamente, um batimento periódico (heartbeat)
          // NUNCA deve interromper o filme no meio! Apenas novas tentativas de reprodução são barradas.
          if (otherValidSessions.length >= maxScreens && !isPlaying) {
            // Limite estourado na tentativa de início de reprodução
            setIsScreenBlocked(true);
            setActiveDevices(otherValidSessions);
            return;
          }

          // Atualiza o heartbeat deste dispositivo mantendo a reprodução fluida
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
          const updatedSessions: ActiveDevice[] = [
            ...otherValidSessions,
            {
              deviceId,
              deviceName,
              lastPing: now,
              platform: platformType,
              appVersion: CURRENT_APP_VERSION,
              currentPath,
            },
          ];

          setIsScreenBlocked(false);
          setActiveDevices(updatedSessions);
          await persistActiveDevices(user.id, user.email, updatedSessions);
        } else {
          // Remover este dispositivo ao fechar/pausar
          setActiveDevices(otherValidSessions);
          await persistActiveDevices(user.id, user.email, otherValidSessions);
        }
      } catch (err) {
        console.warn('[ScreenLimiter] Falha ao sincronizar sessões:', err);
      }
    },
    [
      isAdmin,
      user,
      profile?.role,
      profile?.active_devices,
      deviceId,
      deviceName,
      platformType,
      maxScreens,
      isPlaying,
      persistActiveDevices,
    ]
  );

  // Forçar desconexão de todos os outros aparelhos e assumir esta tela imediatamente
  const disconnectOtherDevices = useCallback(async () => {
    if (!user) return;
    const now = Date.now();
    const mySession: ActiveDevice[] = [
      {
        deviceId,
        deviceName,
        lastPing: now,
        platform: platformType,
        appVersion: CURRENT_APP_VERSION,
        currentPath: typeof window !== 'undefined' ? window.location.pathname : '/',
      },
    ];

    await persistActiveDevices(user.id, user.email, mySession);
    try {
      await supabase.auth.updateUser({
        data: { active_devices: mySession },
      });
    } catch {}

    setIsScreenBlocked(false);
    setActiveDevices(mySession);
  }, [user, deviceId, deviceName, platformType, persistActiveDevices]);

  const syncSessionsRef = useRef(syncSessions);
  useEffect(() => {
    syncSessionsRef.current = syncSessions;
  }, [syncSessions]);

  // Iniciar e manter batimentos cardíacos (Heartbeat) de forma leve sem travar a thread
  useEffect(() => {
    if (!user || isAdmin || !isPlaying) {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      return;
    }

    // Registro inicial
    syncSessionsRef.current(true);

    // Intervalo de batimento cardíaco (25s)
    heartbeatTimerRef.current = setInterval(() => {
      syncSessionsRef.current(true);
    }, 25000);

    // Desregistrar ao sair da página / fechar navegador
    const handleUnload = () => {
      syncSessionsRef.current(false);
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      window.removeEventListener('beforeunload', handleUnload);
      syncSessionsRef.current(false);
    };
  }, [user?.id, isAdmin, isPlaying]);

  return {
    isScreenBlocked,
    activeDevices,
    maxScreens,
    deviceName,
    disconnectOtherDevices,
    refreshScreens: () => syncSessions(true),
  };
}
