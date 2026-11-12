import { useState, useEffect, useCallback } from 'react';
import { CURRENT_APP_VERSION, isVersionOlder } from '../config/appVersion';
import { App as CapApp } from '@capacitor/app';

const CONFIG_URLS = [
  '/api/app-config',
  'https://cn-spartan.vercel.app/api/app-config',
  '/app-config.json',
  'https://cn-spartan.vercel.app/app-config.json'
];

export function useAppUpdateGuard() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState(null); // 'UPDATE_REQUIRED' | 'MAINTENANCE' | 'IP_BLOCKED' | 'DEVICE_BLOCKED'
  const [appConfig, setAppConfig] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  const fetchRemoteConfig = async () => {
    // 1. Tenta carregar do cache local/admin se existir
    try {
      const localSaved = localStorage.getItem('spartan_app_config');
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (parsed && parsed.minVersion) {
          return parsed;
        }
      }
    } catch {}

    // 2. Busca nas rotas de API e arquivos remotos
    for (const url of CONFIG_URLS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        // Cache-busting para garantir leitura em tempo real
        const fetchUrl = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
        const res = await fetch(fetchUrl, {
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (e) {
        // Tenta a próxima URL de fallback
      }
    }
    return null;
  };

  const checkStatus = useCallback(async () => {
    // Nunca bloqueia o painel administrativo para permitir ajustes e desbloqueio
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      setIsBlocked(false);
      setBlockReason(null);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    try {
      const config = await fetchRemoteConfig();
      if (!config) {
        setIsChecking(false);
        return;
      }

      setAppConfig(config);

      // 1. Verificação de Modo Manutenção Geral
      if (config.maintenanceMode) {
        setIsBlocked(true);
        setBlockReason('MAINTENANCE');
        setIsChecking(false);
        return;
      }

      // 2. Verificação de IP Bloqueado
      if (config.clientIp && Array.isArray(config.blockedIps) && config.blockedIps.length > 0) {
        const isIpBlocked = config.blockedIps.some(blocked => 
          blocked.trim() === config.clientIp.trim()
        );
        if (isIpBlocked) {
          setIsBlocked(true);
          setBlockReason('IP_BLOCKED');
          setIsChecking(false);
          return;
        }
      }

      // 3. Verificação de Versão Obrigatória (Force Update)
      const minVer = config.minVersion || '1.0.0';
      const needsUpdate = isVersionOlder(CURRENT_APP_VERSION, minVer) || 
                          (config.forceUpdate && config.latestVersion && CURRENT_APP_VERSION !== config.latestVersion);

      if (needsUpdate) {
        setIsBlocked(true);
        setBlockReason('UPDATE_REQUIRED');
        setIsChecking(false);
        return;
      }

      // Se passou por todas as checagens: liberado!
      setIsBlocked(false);
      setBlockReason(null);
    } catch (err) {
      console.warn('[AppUpdateGuard] Erro ao checar status remoto:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();

    // Recheca quando o app volta do segundo plano na TV Box ou celular
    let appStateListener;
    try {
      appStateListener = CapApp.addListener('appStateChange', (state) => {
        if (state.isActive) {
          checkStatus();
        }
      });
    } catch {}

    const handleFocus = () => checkStatus();
    window.addEventListener('focus', handleFocus);

    return () => {
      if (appStateListener && typeof appStateListener.then === 'function') {
        appStateListener.then(l => l.remove());
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkStatus]);

  return {
    isBlocked,
    blockReason,
    appConfig,
    isChecking,
    recheck: checkStatus
  };
}
