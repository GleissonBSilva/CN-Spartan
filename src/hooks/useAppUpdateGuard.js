import { useState, useEffect, useCallback } from 'react';
import { CURRENT_APP_VERSION, isVersionOlder } from '../config/appVersion';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const CONFIG_URLS = [
  '/api/app-config',
  'https://cn-spartan.vercel.app/api/app-config',
  '/app-config.json',
  'https://cn-spartan.vercel.app/app-config.json'
];

/**
 * Detecta se o aplicativo está sendo executado no CineSpartan TV Box ou APK Android (Capacitor/Nativo).
 * Retorna false quando acessado diretamente pelo navegador web no PC / Desktop.
 */
export const isTvBoxOrApk = () => {
  if (typeof window === 'undefined') return false;

  // 1. Verificação oficial do Capacitor Nativo
  try {
    if (Capacitor.isNativePlatform()) return true;
    const platform = Capacitor.getPlatform();
    if (platform === 'android' || platform === 'ios') return true;
  } catch {}

  // 2. Verificação de objetos injetados e protocolos nativos (Capacitor/Cordova/AndroidNative)
  if (
    window?.AndroidNative?.isNative?.() === true ||
    window?.Capacitor?.isNativePlatform?.() === true ||
    window?.Capacitor?.getPlatform?.() === 'android' ||
    window?.Capacitor?.getPlatform?.() === 'ios' ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:' ||
    (window.location.hostname === 'localhost' && /Android/i.test(navigator.userAgent))
  ) {
    return true;
  }

  // 3. User-Agent específico para APK Android WebView ou TV Box
  const ua = (navigator.userAgent || '').toLowerCase();
  const isAndroid = ua.includes('android');
  const isTv = ua.includes('tv') || ua.includes('smarttv') || ua.includes('googletv') || ua.includes('box');
  const isWebView = ua.includes('wv') || (isAndroid && !ua.includes('chrome/'));

  if (isAndroid && (isWebView || isTv || window.location.protocol === 'capacitor:')) {
    return true;
  }

  return false;
};

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

      // 1. Verificação de Modo Manutenção Geral (suspende o serviço temporariamente)
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

      // 3. Verificação de Versão Obrigatória / Forçar Download de Atualização do APK
      // REGRA: O bloqueio de versão do APK é EXCLUSIVO para CineSpartan TV Box / Android APK!
      // Usuários acessando pelo computador / navegador web no PC NÃO são bloqueados.
      if (isTvBoxOrApk()) {
        const minVer = config.minVersion || '1.0.0';
        const needsUpdate = isVersionOlder(CURRENT_APP_VERSION, minVer) || 
                            (config.forceUpdate && config.latestVersion && CURRENT_APP_VERSION !== config.latestVersion);

        if (needsUpdate) {
          setIsBlocked(true);
          setBlockReason('UPDATE_REQUIRED');
          setIsChecking(false);
          return;
        }
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
