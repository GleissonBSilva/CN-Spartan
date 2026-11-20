// Centralized API configuration & robust URL resolution for Web and Native APK / TV Box
export const PROD_API_ORIGIN = 'https://cn-spartan.vercel.app';

export const isNativePlatform = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any)?.Capacitor?.isNativePlatform?.() === true ||
    (window as any)?.Capacitor?.getPlatform?.() === 'android' ||
    (window as any)?.Capacitor?.getPlatform?.() === 'ios' ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:' ||
    (window.location.hostname === 'localhost' && !window.location.port)
  );
};

export const getApiUrl = (endpoint: string): string => {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (isNativePlatform()) {
    return `${PROD_API_ORIGIN}${clean}`;
  }
  return clean;
};

export const fetchApi = async (endpoint: string, init?: RequestInit): Promise<Response> => {
  const primaryUrl = getApiUrl(endpoint);
  try {
    const res = await fetch(primaryUrl, init);
    // Se estiver em ambiente web com rota relativa e retornar qualquer erro HTTP (ex: 500, 404, 502), faz fallback para a produção
    if (!res.ok && !primaryUrl.startsWith('http')) {
      const fallbackRes = await fetch(`${PROD_API_ORIGIN}${primaryUrl}`, init).catch(() => null);
      if (fallbackRes && fallbackRes.ok) return fallbackRes;
    }
    return res;
  } catch (err) {
    if (!primaryUrl.startsWith('http')) {
      return await fetch(`${PROD_API_ORIGIN}${primaryUrl}`, init);
    }
    throw err;
  }
};
