/**
 * Interceptador Leve de Links Duvidosos Automáticos
 * Neutraliza apenas popups e links duvidosos automáticos (Stake, AliExpress, etc.)
 * sem bloquear o funcionamento normal da aplicação web nem os players de streaming.
 */
export function initAntiAdShield() {
  if (typeof window === 'undefined') return;

  try {
    const SUSPICIOUS_PATTERNS = [
      'stake.com',
      'aliexpress.com',
      'tesla-landing',
      'aff_short_key',
      'clickid',
      'adcash',
      'popads',
      'bet365',
      '1xbet',
      'betano'
    ];

    const originalOpen = window.open;
    window.open = function (url?: string | URL, target?: string, features?: string): Window | null {
      const urlStr = String(url || '').toLowerCase();

      // Verifica se é um link automático duvidoso
      const isSuspicious = SUSPICIOUS_PATTERNS.some(pattern => urlStr.includes(pattern));

      if (isSuspicious) {
        console.warn('[Cine Spartan]: Bloqueada abertura automática de link duvidoso:', urlStr);
        // Retorna objeto falso com métodos seguros para não quebrar a execução do player
        return {
          focus: () => {},
          blur: () => {},
          close: () => {},
          closed: true,
          document: {},
          location: { href: '' },
          postMessage: () => {}
        } as unknown as Window;
      }

      // Qualquer outro link é aberto normalmente
      return originalOpen ? originalOpen.call(window, url, target, features) : null;
    };
  } catch (err) {
    console.warn('[AntiAdShield]:', err);
  }
}
