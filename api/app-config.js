// Vercel Serverless Function - Retorna e atualiza a configuração remota e o IP do cliente
import fs from 'fs';
import path from 'path';

const TMP_CONFIG_FILE = path.join('/tmp', 'spartan_app_config.json');
let memoryConfig = null;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://arckidvhfsffumowjarn.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_L8j30Fn2CUE0OTJgsh3Ipg_IfHZrNFd';

// Planos padrão oficiais com Spartan Fundador exclusivo (3 telas simultâneas)
const OFFICIAL_DEFAULT_PLANS = [
  {
    id: 'start',
    name: 'SPARTAN START',
    monthlyPrice: 29.9,
    annualPrice: 25.0,
    screens: 1,
    quality: 'Full HD & 4K Ultra HD',
    description: '1 tela individual para smartphone, tablet, PC ou TV Box.',
  },
  {
    id: 'fundador',
    name: 'SPARTAN FUNDADOR',
    badge: '🛡️ VIP Fundador',
    monthlyPrice: 34.9,
    annualPrice: 29.9,
    screens: 3,
    quality: 'Full HD & 4K Ultra HD VIP',
    description: 'Condição exclusiva vitalícia reservada apenas para clientes fundadores e pioneiros, liberada diretamente pela administração Spartan (3 telas simultâneas).',
    adminOnly: true,
  },
  {
    id: 'pro',
    name: 'SPARTAN PRO',
    badge: 'Mais Escolhido',
    monthlyPrice: 59.9,
    annualPrice: 50.0,
    screens: 2,
    quality: 'Full HD & 4K Ultra HD',
    description: '2 telas simultâneas para Smart TV, TV Box e família.',
  },
  {
    id: 'business',
    name: 'SPARTAN BUSINESS',
    badge: 'Família VIP',
    monthlyPrice: 119.9,
    annualPrice: 99.9,
    screens: 5,
    quality: 'Full HD & 4K Ultra HD',
    description: '5 telas simultâneas em qualquer dispositivo com suporte prioritário.',
  },
];

function ensureFounderInPlans(list) {
  if (!Array.isArray(list) || list.length === 0) return OFFICIAL_DEFAULT_PLANS;
  const hasFounder = list.some(p => p.id === 'fundador' || String(p.name || '').toUpperCase().includes('FUNDADOR'));
  if (!hasFounder) {
    const copy = [...list];
    copy.splice(1, 0, OFFICIAL_DEFAULT_PLANS[1]);
    return copy;
  }
  // Garante que o fundador tenha adminOnly e 3 telas
  return list.map(p => {
    if (p.id === 'fundador' || String(p.name || '').toUpperCase().includes('FUNDADOR')) {
      return {
        ...p,
        screens: Math.max(3, Number(p.screens || 3)),
        adminOnly: true
      };
    }
    return p;
  });
}

async function fetchFromSupabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/system_settings?select=key,value,updated_at`, {
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
        settings[r.key] = { value: r.value, updated_at: r.updated_at };
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

  // Configuração padrão oficial Spartan
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
    plansConfig: OFFICIAL_DEFAULT_PLANS,
    financialCharges: [],
    last_saved_at: null
  };

  // 1. Carrega do cache salvo em memória/disco local
  const saved = readSavedConfig();
  if (saved) {
    config = { ...config, ...saved };
  }

  // 2. POST ou PUT: Atualiza a configuração remota vinda do Admin Dashboard
  if (req.method === 'POST' || req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (body) {
      const savedPlans = Array.isArray(body.plansConfig) && body.plansConfig.length > 0
        ? ensureFounderInPlans(body.plansConfig)
        : config.plansConfig;

      const nextConfig = {
        ...config,
        minVersion: body.minVersion || config.minVersion,
        latestVersion: body.latestVersion || config.latestVersion,
        forceUpdate: body.forceUpdate !== undefined ? Boolean(body.forceUpdate) : config.forceUpdate,
        apkDownloadUrl: body.apkDownloadUrl || config.apkDownloadUrl,
        maintenanceMode: body.maintenanceMode !== undefined ? Boolean(body.maintenanceMode) : config.maintenanceMode,
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
        plansConfig: savedPlans,
        financialCharges: Array.isArray(body.financialCharges) ? body.financialCharges : config.financialCharges,
        last_saved_at: new Date().toISOString()
      };

      writeSavedConfig(nextConfig);
      config = nextConfig;
    }
    return res.status(200).json({ success: true, ...config });
  }

  // 3. GET: Sincroniza apenas com o Supabase system_settings se o Supabase tiver dados válidos e não sobrescrever edições recentes
  const supabaseSettings = await fetchFromSupabase();
  if (supabaseSettings) {
    if (supabaseSettings.pix_config?.value?.key && (!saved?.last_saved_at || supabaseSettings.pix_config.updated_at > saved.last_saved_at)) {
      config.pixConfig = { ...config.pixConfig, ...supabaseSettings.pix_config.value };
    }
    if (supabaseSettings.app_security_config?.value && (!saved?.last_saved_at || supabaseSettings.app_security_config.updated_at > saved.last_saved_at)) {
      config = { ...config, ...supabaseSettings.app_security_config.value };
    }
    if (Array.isArray(supabaseSettings.plans_config?.value) && supabaseSettings.plans_config.value.length > 0) {
      // Se não há configuração salva localmente pelo admin, usa os planos do Supabase garantindo o Spartan Fundador
      if (!saved?.plansConfig || saved.plansConfig.length === 0) {
        config.plansConfig = ensureFounderInPlans(supabaseSettings.plans_config.value);
      }
    }
    if (Array.isArray(supabaseSettings.financial_charges?.value) && (!saved?.financialCharges || saved.financialCharges.length === 0)) {
      config.financialCharges = supabaseSettings.financial_charges.value;
    }
  }

  config.plansConfig = ensureFounderInPlans(config.plansConfig);

  // 4. Retorna a configuração e o IP do cliente
  return res.status(200).json({
    ...config,
    clientIp
  });
}

