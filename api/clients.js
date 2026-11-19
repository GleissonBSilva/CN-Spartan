// Serverless Cloud Sync for Client Profiles across all devices & Admin Dashboard
// Allows TV Boxes, Web, and Admin Dashboard to share active clients in real-time
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SEED_PROFILES = [
  {
    id: 'mock-1',
    email: 'gleisson1984@gmail.com',
    full_name: 'Gleisson Silva (Master Admin)',
    whatsapp: '(92) 99374-6740',
    role: 'admin',
    status: 'ativo',
    plan_name: 'SPARTAN BUSINESS',
    max_screens: 5,
    is_trial: false,
    trial_used: true,
    expires_at: '2027-12-31T23:59:59.000Z',
    created_at: '2026-11-01T10:00:00.000Z'
  }
];

const TMP_DIR = os.tmpdir();
const PROFILES_FILE = path.join(TMP_DIR, 'spartan_clients.json');
const DELETED_FILE = path.join(TMP_DIR, 'spartan_deleted.json');

const BANNED_MOCKS = ['mock-2', 'mock-3', 'carlos.spartan@gmail.com', 'mariana.costa@hotmail.com'];

let memoryProfiles = [...SEED_PROFILES];
let deletedAccounts = [...BANNED_MOCKS];

function loadFromDisk() {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryProfiles = parsed;
      }
    }
  } catch {}

  try {
    if (fs.existsSync(DELETED_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DELETED_FILE, 'utf8'));
      if (Array.isArray(parsed)) {
        deletedAccounts = parsed;
      }
    }
  } catch {}

  // Garante banimento definitivo dos mockups Carlos e Mariana
  for (const b of BANNED_MOCKS) {
    if (!deletedAccounts.includes(b)) deletedAccounts.push(b);
  }
  memoryProfiles = memoryProfiles.filter(p => !BANNED_MOCKS.includes(p.id) && !BANNED_MOCKS.includes(p.email?.toLowerCase()));

  // Garante coerência entre planos e quantidade de telas
  memoryProfiles = memoryProfiles.map(p => {
    const plan = String(p.plan_name || '').toUpperCase();
    let screens = Number(p.max_screens || 1);
    if (plan.includes('START') && screens > 1) screens = 1;
    else if (plan.includes('PRO') && screens > 2) screens = 2;
    return { ...p, max_screens: screens };
  });

  // Garante que os perfis seed existam se não tiverem sido deletados
  for (const seed of SEED_PROFILES) {
    const isDeleted = deletedAccounts.includes(seed.id) || deletedAccounts.includes(seed.email.toLowerCase());
    if (!isDeleted && !memoryProfiles.some(p => p.email?.toLowerCase() === seed.email.toLowerCase())) {
      memoryProfiles.push(seed);
    }
  }
  try {
    if (fs.existsSync(DELETED_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DELETED_FILE, 'utf8'));
      if (Array.isArray(parsed)) {
        deletedAccounts = parsed;
      }
    }
  } catch {}
}

function saveToDisk() {
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(memoryProfiles), 'utf8');
  } catch {}
  try {
    fs.writeFileSync(DELETED_FILE, JSON.stringify(deletedAccounts), 'utf8');
  } catch {}
}

// Initial load
loadFromDisk();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  loadFromDisk();

  // 1. GET: Retorna perfis e contas deletadas/revogadas
  if (req.method === 'GET') {
    // Purga deletados da lista ativa
    memoryProfiles = memoryProfiles.filter(p => {
      const idMatch = p.id && deletedAccounts.includes(p.id);
      const emailMatch = p.email && deletedAccounts.includes(p.email.toLowerCase().trim());
      return !idMatch && !emailMatch;
    });

    return res.status(200).json({
      profiles: memoryProfiles,
      deleted: deletedAccounts
    });
  }

  // 2. POST / PUT: Registra ou atualiza status do cliente (ativo, suspenso, vencido) e telemetria Web/APK
  if (req.method === 'POST' || req.method === 'PUT') {
    const profile = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!profile || (!profile.id && !profile.email)) {
      return res.status(400).json({ error: 'Dados de perfil inválidos' });
    }

    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || '127.0.0.1');

    const cleanEmail = profile.email ? String(profile.email).toLowerCase().trim() : '';
    const cleanId = profile.id ? String(profile.id) : `usr-${Date.now()}`;
    const isMaster = cleanEmail === 'gleisson1984@gmail.com';

    // Se o Administrador realizou uma atualização/reativação explícita, remove da lista negra
    const isExplicitAdminUpdate = Boolean(profile.admin_updated_at);
    if (isExplicitAdminUpdate || isMaster) {
      if (cleanId) deletedAccounts = deletedAccounts.filter(x => x !== cleanId);
      if (cleanEmail) deletedAccounts = deletedAccounts.filter(x => x !== cleanEmail);
    }

    // Se o cliente foi excluído pelo administrador e não é edição explícita, não pode se auto-promover
    const isDeleted = !isMaster && !isExplicitAdminUpdate && (deletedAccounts.includes(cleanId) || (cleanEmail && deletedAccounts.includes(cleanEmail)));
    if (isDeleted) {
      profile.status = 'vencido';
      profile.is_trial = false;
    }

    // Se active_devices foi enviado, injeta o IP do aparelho no último dispositivo atualizado
    let nextDevices = profile.active_devices;
    if (Array.isArray(nextDevices)) {
      nextDevices = nextDevices.map((d) => ({
        ...d,
        ip: d.ip || clientIp
      }));
    }

    const existingIdx = memoryProfiles.findIndex(
      p => (cleanId && p.id === cleanId) || (cleanEmail && p.email?.toLowerCase() === cleanEmail)
    );

    if (existingIdx >= 0) {
      // Se o cliente já está SUSPENSO ou PENDENTE de aprovação, preserva o bloqueio contra telemetria de aparelhos
      const isCurrentlyLocked = memoryProfiles[existingIdx].status === 'suspenso' || memoryProfiles[existingIdx].status === 'pendente';
      const isExplicitAdminStatusUpdate = Boolean(profile.admin_updated_at);

      let targetStatus = profile.status || memoryProfiles[existingIdx].status;
      if (isCurrentlyLocked && !isExplicitAdminStatusUpdate) {
        targetStatus = memoryProfiles[existingIdx].status;
      }

      // Preserva expires_at e is_trial se for uma simples telemetria sem expiração informada
      const targetExpiresAt = profile.expires_at || memoryProfiles[existingIdx].expires_at;
      const targetIsTrial = profile.is_trial !== undefined ? Boolean(profile.is_trial) : memoryProfiles[existingIdx].is_trial;
      const targetPlan = profile.plan_name || memoryProfiles[existingIdx].plan_name;
      let targetScreens = profile.max_screens !== undefined ? Number(profile.max_screens) : memoryProfiles[existingIdx].max_screens;

      // Sincroniza telas estritamente com o plano correspondente oficial (a menos que seja edição explícita do Admin)
      if (!isExplicitAdminUpdate) {
        const cleanPlanUpper = String(targetPlan || '').toUpperCase();
        if (cleanPlanUpper.includes('START')) {
          targetScreens = 1;
        } else if (cleanPlanUpper.includes('PRO')) {
          targetScreens = 2;
        } else if (cleanPlanUpper.includes('FUNDADOR')) {
          targetScreens = 3;
        } else if (cleanPlanUpper.includes('BUSINESS')) {
          targetScreens = 5;
        }
      }

      memoryProfiles[existingIdx] = {
        ...memoryProfiles[existingIdx],
        ...profile,
        status: targetStatus,
        expires_at: targetExpiresAt,
        is_trial: targetIsTrial,
        plan_name: targetPlan,
        max_screens: targetScreens,
        admin_updated_at: profile.admin_updated_at || memoryProfiles[existingIdx].admin_updated_at,
        ...(nextDevices !== undefined ? { active_devices: nextDevices } : {}),
        last_ip: profile.last_ip || clientIp || memoryProfiles[existingIdx].last_ip,
        id: cleanId || memoryProfiles[existingIdx].id,
        email: cleanEmail || memoryProfiles[existingIdx].email,
        updated_at: new Date().toISOString()
      };
    } else {
      // Regra de Negócio Spartan: Novo cadastro NUNCA ganha 30 dias de mês pago automaticamente.
      // O domínio do acesso é exclusivo do Admin. O cliente apenas escolhe o plano.
      // Se for período de teste permitido, ganha estritamente 3 dias com is_trial = true.
      // Se não for teste, entra como 'vencido' aguardando liberação do Admin.
      const isTrial = profile.is_trial !== undefined ? Boolean(profile.is_trial) : true;
      const trialDays = isTrial ? 3 : 0;
      const initialStatus = profile.status ? profile.status : (isTrial ? 'ativo' : 'vencido');
      const initialExpires = profile.expires_at || new Date(Date.now() + trialDays * 86400000).toISOString();

      const initialPlan = profile.plan_name || 'SPARTAN START';
      const initialPlanUpper = initialPlan.toUpperCase();
      let initialScreens = Number(profile.max_screens || 1);
      if (initialPlanUpper.includes('START')) initialScreens = 1;
      else if (initialPlanUpper.includes('PRO')) initialScreens = 2;
      else if (initialPlanUpper.includes('BUSINESS')) initialScreens = 5;

      memoryProfiles.unshift({
        id: cleanId,
        email: cleanEmail,
        full_name: profile.full_name || profile.name || cleanEmail.split('@')[0],
        whatsapp: profile.whatsapp || profile.phone || '',
        role: profile.role || 'client',
        status: initialStatus,
        plan_name: initialPlan,
        max_screens: initialScreens,
        is_trial: isTrial,
        trial_used: Boolean(profile.trial_used),
        active_devices: Array.isArray(nextDevices) ? nextDevices : [],
        last_platform: profile.last_platform || 'web',
        last_ip: clientIp,
        last_seen_at: profile.last_seen_at || new Date().toISOString(),
        expires_at: initialExpires,
        created_at: profile.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    saveToDisk();
    return res.status(200).json({
      success: true,
      profile: memoryProfiles[existingIdx >= 0 ? existingIdx : 0]
    });
  }

  // 3. DELETE: Revoga acesso imediatamente e coloca na lista negra
  if (req.method === 'DELETE') {
    const query = req.query || {};
    const body = req.body || {};
    const id = query.id || body.id;
    const email = query.email || body.email;

    if (id) deletedAccounts.push(String(id));
    if (email) deletedAccounts.push(String(email).toLowerCase().trim());
    deletedAccounts = Array.from(new Set(deletedAccounts));

    memoryProfiles = memoryProfiles.filter(p => {
      if (id && p.id === id) return false;
      if (email && p.email?.toLowerCase() === String(email).toLowerCase().trim()) return false;
      return true;
    });

    saveToDisk();
    return res.status(200).json({ success: true, deleted: [id, email].filter(Boolean) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
