// Vercel Serverless Function - Retorna e atualiza a configuração remota e o IP do cliente
import fs from 'fs';
import path from 'path';

const TMP_CONFIG_FILE = path.join('/tmp', 'spartan_app_config.json');
let memoryConfig = null;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://arckidvhfsffumowjarn.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_L8j30Fn2CUE0OTJgsh3Ipg_IfHZrNFd';

async function fetchFromSupabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/system_settings?select=key,value`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      },
      signal: AbortSignal.timeout(2500)
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;
    const settings = {};
    for (const r of rows) {
      if (r.key && r.value) {
        settings[r.key] = r.value;
      }
    }
    return settings;
  } catch {
    return null;
  }
}

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

  // Configuração padrão oficial Spartan (chave Pix padrão: gsroboticmania@gmail.com)
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
    blockedDevices: [],
    pixConfig: {
      keyType: 'email',
      key: 'gsroboticmania@gmail.com',
      recipientName: 'Spartan',
      city: 'Manaus',
      customMessage: 'Olá! Segue sua cobrança Pix Cine Spartan para ativação ou renovação imediata:'
    },
    plansConfig: null
  };

  // 1. Carrega do cache temporário se existir
  const saved = readSavedConfig();
  if (saved) {
    config = { ...config, ...saved };
  }

  // 2. Sempre sincroniza com o Supabase system_settings para que nunca reverta na Vercel (persistência 100% permanente)
  const supabaseSettings = await fetchFromSupabase();
  if (supabaseSettings) {
    if (supabaseSettings.pix_config && typeof supabaseSettings.pix_config === 'object' && supabaseSettings.pix_config.key) {
      config.pixConfig = {
        ...config.pixConfig,
        ...supabaseSettings.pix_config
      };
    }
    if (supabaseSettings.app_security_config && typeof supabaseSettings.app_security_config === 'object') {
      config = {
        ...config,
        ...supabaseSettings.app_security_config
      };
    }
    if (Array.isArray(supabaseSettings.plans_config) && supabaseSettings.plans_config.length > 0) {
      config.plansConfig = supabaseSettings.plans_config;
    }
  }

  // 3. POST ou PUT: Atualiza a configuração remota vinda do Admin Dashboard
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
        blockedDevices: Array.isArray(body.blockedDevices) ? body.blockedDevices : (config.blockedDevices || []),
        pixConfig: body.pixConfig && typeof body.pixConfig === 'object' ? {
          keyType: body.pixConfig.keyType || config.pixConfig?.keyType || 'email',
          key: String(body.pixConfig.key || config.pixConfig?.key || '').trim(),
          recipientName: String(body.pixConfig.recipientName || config.pixConfig?.recipientName || 'Spartan').trim(),
          city: String(body.pixConfig.city || config.pixConfig?.city || 'Manaus').trim(),
          customMessage: String(body.pixConfig.customMessage || config.pixConfig?.customMessage || '')
        } : config.pixConfig,
        plansConfig: Array.isArray(body.plansConfig) && body.plansConfig.length > 0 ? body.plansConfig : config.plansConfig
      };
      writeSavedConfig(nextConfig);
      config = { ...config, ...nextConfig };
    }
    return res.status(200).json({ success: true, ...config });
  }

  // 4. GET: Retorna a configuração e o IP do cliente
  return res.status(200).json({
    ...config,
    clientIp
  });
}
