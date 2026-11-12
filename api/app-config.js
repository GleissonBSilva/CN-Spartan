// Vercel Serverless Function - Retorna e atualiza a configuração remota e o IP do cliente
let memoryConfig = null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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

  if (memoryConfig) {
    config = { ...config, ...memoryConfig };
  }

  // 1. POST ou PUT: Atualiza a configuração remota vinda do Admin Dashboard
  if (req.method === 'POST' || req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (body) {
      memoryConfig = {
        minVersion: body.minVersion || config.minVersion,
        latestVersion: body.latestVersion || config.latestVersion,
        forceUpdate: Boolean(body.forceUpdate),
        apkDownloadUrl: body.apkDownloadUrl || config.apkDownloadUrl,
        maintenanceMode: Boolean(body.maintenanceMode),
        maintenanceMessage: body.maintenanceMessage || config.maintenanceMessage,
        updateMessage: body.updateMessage || config.updateMessage,
        blockedIps: Array.isArray(body.blockedIps) ? body.blockedIps : (config.blockedIps || []),
        blockedDevices: Array.isArray(body.blockedDevices) ? body.blockedDevices : []
      };
      config = { ...config, ...memoryConfig };
    }
    return res.status(200).json({ success: true, ...config });
  }

  // 2. GET: Retorna a configuração e o IP do cliente
  return res.status(200).json({
    ...config,
    clientIp
  });
}
