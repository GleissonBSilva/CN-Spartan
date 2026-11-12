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
  },
  {
    id: 'mock-2',
    email: 'carlos.spartan@gmail.com',
    full_name: 'Carlos Eduardo',
    whatsapp: '(92) 98122-3344',
    role: 'client',
    status: 'ativo',
    plan_name: 'SPARTAN PRO',
    max_screens: 2,
    is_trial: false,
    trial_used: true,
    expires_at: new Date(Date.now() + 25 * 86400000).toISOString(),
    created_at: '2026-11-08T14:30:00.000Z'
  },
  {
    id: 'mock-3',
    email: 'mariana.costa@hotmail.com',
    full_name: 'Mariana Costa',
    whatsapp: '(92) 99188-7766',
    role: 'client',
    status: 'ativo',
    plan_name: 'SPARTAN START',
    max_screens: 1,
    is_trial: false,
    trial_used: true,
    expires_at: new Date(Date.now() + 12 * 86400000).toISOString(),
    created_at: '2026-11-05T09:15:00.000Z'
  }
];

const TMP_DIR = os.tmpdir();
const PROFILES_FILE = path.join(TMP_DIR, 'spartan_clients.json');
const DELETED_FILE = path.join(TMP_DIR, 'spartan_deleted.json');

let memoryProfiles = [...SEED_PROFILES];
let deletedAccounts = [];

function loadFromDisk() {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryProfiles = parsed;
      }
    }
  } catch {}

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

  // 2. POST / PUT: Registra ou atualiza status do cliente (ativo, suspenso, vencido)
  if (req.method === 'POST' || req.method === 'PUT') {
    const profile = req.body;
    if (!profile || (!profile.id && !profile.email)) {
      return res.status(400).json({ error: 'Dados de perfil inválidos' });
    }

    const cleanEmail = profile.email ? String(profile.email).toLowerCase().trim() : '';
    const cleanId = profile.id ? String(profile.id) : `usr-${Date.now()}`;

    // Se estiver ativando ou reativando, remove da lista de deletados
    if (profile.status === 'ativo') {
      deletedAccounts = deletedAccounts.filter(x => x !== cleanId && x !== cleanEmail);
    }

    const existingIdx = memoryProfiles.findIndex(
      p => (cleanId && p.id === cleanId) || (cleanEmail && p.email?.toLowerCase() === cleanEmail)
    );

    if (existingIdx >= 0) {
      memoryProfiles[existingIdx] = {
        ...memoryProfiles[existingIdx],
        ...profile,
        id: cleanId || memoryProfiles[existingIdx].id,
        email: cleanEmail || memoryProfiles[existingIdx].email,
        updated_at: new Date().toISOString()
      };
    } else {
      memoryProfiles.unshift({
        id: cleanId,
        email: cleanEmail,
        full_name: profile.full_name || profile.name || cleanEmail.split('@')[0],
        whatsapp: profile.whatsapp || profile.phone || '',
        role: profile.role || 'client',
        status: profile.status || 'ativo',
        plan_name: profile.plan_name || 'SPARTAN PRO',
        max_screens: Number(profile.max_screens || 2),
        is_trial: Boolean(profile.is_trial),
        trial_used: Boolean(profile.trial_used),
        expires_at: profile.expires_at || new Date(Date.now() + 30 * 86400000).toISOString(),
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
