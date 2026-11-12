// Vercel Serverless Function - Retorna a configuração remota e o IP do cliente
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Detecta o IP do cliente através dos cabeçalhos de proxy da Vercel / Cloudflare
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || '127.0.0.1');

  // Configuração padrão
  let config = {
    minVersion: '1.0.0',
    latestVersion: '1.0.0',
    forceUpdate: false,
    apkDownloadUrl: 'https://cn-spartan.vercel.app/cinespartan.apk',
    maintenanceMode: false,
    maintenanceMessage: 'Estamos realizando melhorias programadas nos servidores do Cine Spartan. O aplicativo retornará em instantes!',
    updateMessage: 'Uma nova versão com melhorias e correções obrigatórias está disponível. Atualize seu aplicativo para continuar assistindo.',
    blockedIps: [],
    blockedDevices: []
  };

  // Se houver integração com Supabase, tenta buscar configuração remota de lá
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const response = await fetch(`${supabaseUrl}/rest/v1/app_settings?select=*&limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          config = { ...config, ...data[0] };
        }
      }
    }
  } catch (err) {
    // Falha silenciosa, usa config padrão
  }

  return res.status(200).json({
    ...config,
    clientIp
  });
}
