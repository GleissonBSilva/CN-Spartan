import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthProfile } from './useAuthProfile';
import { supabase } from '../lib/supabase';

export interface ActiveDevice {
  deviceId: string;
  deviceName: string;
  lastPing: number;
}

// Gera ou recupera um identificador único e persistente para este aparelho
export const getLocalDeviceId = (): string => {
  let id = localStorage.getItem('cinespartan_device_id');
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('cinespartan_device_id', id);
  }
  return id;
};

// Detecta o nome do dispositivo amigável para exibição
export const getLocalDeviceName = (): string => {
  let name = localStorage.getItem('cinespartan_device_name');
  if (name) return name;

  const ua = navigator.userAgent;
  let detected = 'Navegador Web';

  if (/Android.*TV|SmartTV|BRAVIA|NetCast|AFTT|AFTM|Roku|WebOS/i.test(ua)) {
    detected = 'TV Box / Smart TV';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    detected = 'Apple iOS (iPhone/iPad)';
  } else if (/Android/i.test(ua)) {
    detected = 'Smartphone Android';
  } else if (/Windows/i.test(ua)) {
    detected = 'Computador Windows (PC)';
  } else if (/Macintosh/i.test(ua)) {
    detected = 'Computador Mac';
  } else if (/Linux/i.test(ua)) {
    detected = 'Dispositivo Linux';
  }

  localStorage.setItem('cinespartan_device_name', detected);
  return detected;
};

const INACTIVE_TIMEOUT_MS = 60 * 1000; // 60 segundos sem ping = dispositivo fechado/inativo
const HEARTBEAT_INTERVAL_MS = 20 * 1000; // Ping a cada 20 segundos

export function useScreenLimiter(isPlaying: boolean = true) {
  const { user, profile, isAdmin } = useAuthProfile();
  const [isScreenBlocked, setIsScreenBlocked] = useState<boolean>(false);
  const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);

  const deviceId = getLocalDeviceId();
  const deviceName = getLocalDeviceName();
  const heartbeatTimerRef = useRef<any>(null);

  const maxScreens = profile?.max_screens || 1;

  // Carregar e sincronizar sessões ativas
  const syncSessions = useCallback(async (registerThisDevice: boolean = true) => {
    // Admin tem telas ilimitadas
    if (isAdmin || !user) {
      setIsScreenBlocked(false);
      return;
    }

    try {
      const now = Date.now();
      const storageKey = `cinespartan_active_devices_${user.id}`;

      // 1. Obter sessões salvas no metadata do usuário Supabase ou localStorage
      let sessions: ActiveDevice[] = [];
      const metaSessions = user.user_metadata?.active_devices;
      if (Array.isArray(metaSessions)) {
        sessions = metaSessions;
      } else {
        try {
          const localSaved = localStorage.getItem(storageKey);
          if (localSaved) sessions = JSON.parse(localSaved);
        } catch {}
      }

      // 2. Limpar sessões que expiraram (mais de 60s sem ping)
      const validSessions = sessions.filter(
        (s) => s.deviceId !== deviceId && now - s.lastPing < INACTIVE_TIMEOUT_MS
      );

      // 3. Checar se este dispositivo cabe no limite de telas
      if (registerThisDevice) {
        if (validSessions.length >= maxScreens) {
          // Limite estourado! Este dispositivo está bloqueado
          setIsScreenBlocked(true);
          setActiveDevices(validSessions);
          return;
        }

        // Cabe na cota: registra/atualiza este dispositivo
        const updatedSessions = [
          ...validSessions,
          { deviceId, deviceName, lastPing: now }
        ];

        setIsScreenBlocked(false);
        setActiveDevices(updatedSessions);

        // Salvar no storage local
        try {
          localStorage.setItem(storageKey, JSON.stringify(updatedSessions));
        } catch {}
      } else {
        // Remover este dispositivo ao fechar/pausar
        try {
          localStorage.setItem(storageKey, JSON.stringify(validSessions));
        } catch {}
      }
    } catch (err) {
      console.warn('[ScreenLimiter] Falha ao sincronizar sessões:', err);
    }
  }, [isAdmin, deviceId, deviceName, maxScreens]);

  // Forçar desconexão de todos os outros aparelhos e assumir esta tela
  const disconnectOtherDevices = useCallback(async () => {
    if (!user) return;
    const now = Date.now();
    const mySession: ActiveDevice[] = [{ deviceId, deviceName, lastPing: now }];
    const storageKey = `cinespartan_active_devices_${user.id}`;

    try {
      localStorage.setItem(storageKey, JSON.stringify(mySession));
    } catch {}

    setIsScreenBlocked(false);
    setActiveDevices(mySession);
  }, [user, deviceId, deviceName]);

  // Iniciar e manter batimentos cardíacos (Heartbeat) de forma leve sem travar a thread
  useEffect(() => {
    if (!user || isAdmin || !isPlaying) {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      return;
    }

    // Registro inicial
    syncSessions(true);

    // Intervalo de batimento cardíaco (30s)
    heartbeatTimerRef.current = setInterval(() => {
      syncSessions(true);
    }, 30000);

    // Desregistrar ao sair da página / fechar navegador
    const handleUnload = () => {
      syncSessions(false);
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      window.removeEventListener('beforeunload', handleUnload);
      syncSessions(false);
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
