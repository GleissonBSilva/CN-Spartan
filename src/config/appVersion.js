// Versão do aplicativo compilada neste APK/Build
export const CURRENT_APP_VERSION = '1.0.0';
export const CURRENT_BUILD_NUMBER = 1;

// Utilitário para comparar versões semânticas (ex: '1.0.0' vs '1.1.0')
export function isVersionOlder(current, target) {
  if (!current || !target) return false;
  
  const cleanCurrent = String(current).replace(/[^0-9.]/g, '').split('.').map(n => parseInt(n, 10) || 0);
  const cleanTarget = String(target).replace(/[^0-9.]/g, '').split('.').map(n => parseInt(n, 10) || 0);

  const maxLength = Math.max(cleanCurrent.length, cleanTarget.length);
  for (let i = 0; i < maxLength; i++) {
    const c = cleanCurrent[i] || 0;
    const t = cleanTarget[i] || 0;
    if (c < t) return true;
    if (c > t) return false;
  }
  return false;
}
