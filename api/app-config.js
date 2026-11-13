// Vercel Serverless Function - Retorna e atualiza a configuração remota e o IP do cliente
import fs from 'fs';
import path from 'path';

const TMP_CONFIG_FILE = path.join('/tmp', 'spartan_app_config.json');
let memoryConfig = null;

function readSavedConfig() {
  try {
    if (fs.existsSync(TMP_CONFIG_FILE)) {
      const raw = fs.readFileSync(TMP_CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        memoryConfig = parsed;
        return parsed;
      }
    }
  } catch {}
  return memoryConfig;
}

function writeSavedConfig(cfg) {
  memoryConfig = cfg;
  try {
    fs.writeFileSync(TMP_CONFIG_FILE, JSON.stringify(cfg), 'utf8');
  } catch {}
}

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
    webAccessEnabled: true,
    apkAccessEnabled: true,
    globalBroadcastMessage: '',
    blockedIps: [],
    blockedDevices: []
  };

  const saved = readSavedConfig();
  if (saved) {
    config = { ...config, ...saved };
  }

  // 1. POST ou PUT: Atualiza a configuração remota vinda do Admin Dashboard
  if (req.method === 'POST' || req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (body) {
      const nextConfig = {
        minVersion: body.minVersion || config.minVersion,
        latestVersion: body.latestVersion || config.latestVersion,
        forceUpdate: Boolean(body.forceUpdate),
        apkDownloadUrl: body.apkDownloadUrl || config.apkDownloadUrl,
        maintenanceMode: Boolean(body.maintenanceMode),
        maintenanceMessage: body.maintenanceMessage || config.maintenanceMessage,
        updateMessage: body.updateMessage || config.updateMessage,
        webAccessEnabled: body.webAccessEnabled !== undefined ? Boolean(body.webAccessEnabled) : config.webAccessEnabled,
        apkAccessEnabled: body.apkAccessEnabled !== undefined ? Boolean(body.apkAccessEnabled) : config.apkAccessEnabled,
        globalBroadcastMessage: body.globalBroadcastMessage !== undefined ? String(body.globalBroadcastMessage) : config.globalBroadcastMessage,
        blockedIps: Array.isArray(body.blockedIps) ? body.blockedIps : (config.blockedIps || []),
        blockedDevices: Array.isArray(body.blockedDevices) ? body.blockedDevices : (config.blockedDevices || [])
      };
      writeSavedConfig(nextConfig);
      config = { ...config, ...nextConfig };
    }
    return res.status(200).json({ success: true, ...config });
  }

  // 2. GET: Retorna a configuração e o IP do cliente
  return res.status(200).json({
    ...config,
    clientIp
  });
}
