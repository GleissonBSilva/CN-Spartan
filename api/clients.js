// Serverless Cloud Sync for Client Profiles across all devices & Admin Dashboard
// Allows TV Boxes, Web, and Admin Dashboard to share active clients in real-time

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

let memoryProfiles = [...SEED_PROFILES];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET: Retorna todos os clientes cadastrados
  if (req.method === 'GET') {
    let cloudList = [...memoryProfiles];

    // Tenta também buscar do Supabase profiles
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://arckidvhfsffumowjarn.supabase.co';
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_L8j30Fn2CUE0OTJgsh3Ipg_IfHZrNFd';
      const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (response.ok) {
        const supaData = await response.json();
        if (Array.isArray(supaData)) {
          for (const sp of supaData) {
            if (!cloudList.some(c => c.id === sp.id || (sp.email && c.email?.toLowerCase() === sp.email.toLowerCase()))) {
              cloudList.push(sp);
            }
          }
        }
      }
    } catch (e) {
      // continua com memoryProfiles
    }

    return res.status(200).json(cloudList);
  }

  // 2. POST / PUT: Registra ou atualiza um cliente vindo de qualquer TV Box ou aparelho
  if (req.method === 'POST' || req.method === 'PUT') {
    const profile = req.body;
    if (!profile || (!profile.id && !profile.email)) {
      return res.status(400).json({ error: 'Dados de perfil inválidos' });
    }

    const cleanEmail = profile.email ? profile.email.toLowerCase().trim() : '';
    const cleanId = profile.id || `usr-${Date.now()}`;

    const normalizedProfile = {
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
    };

    // Atualiza na memória
    const existingIdx = memoryProfiles.findIndex(
      p => p.id === cleanId || (cleanEmail && p.email?.toLowerCase() === cleanEmail)
    );
    if (existingIdx >= 0) {
      memoryProfiles[existingIdx] = { ...memoryProfiles[existingIdx], ...normalizedProfile };
    } else {
      memoryProfiles.unshift(normalizedProfile);
    }

    // Tenta salvar também no Supabase
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://arckidvhfsffumowjarn.supabase.co';
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_L8j30Fn2CUE0OTJgsh3Ipg_IfHZrNFd';
      await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: normalizedProfile.id,
          email: normalizedProfile.email,
          role: normalizedProfile.role,
          status: normalizedProfile.status,
          plan_name: normalizedProfile.plan_name,
          max_screens: normalizedProfile.max_screens,
          expires_at: normalizedProfile.expires_at
        })
      });
    } catch (e) {
      // Ignora erro de RLS se tabela for restrita
    }

    return res.status(200).json({ success: true, profile: normalizedProfile });
  }

  // 3. DELETE: Remove perfil
  if (req.method === 'DELETE') {
    const { id, email } = req.query;
    if (id || email) {
      memoryProfiles = memoryProfiles.filter(p => {
        if (id && p.id === id) return false;
        if (email && p.email?.toLowerCase() === String(email).toLowerCase()) return false;
        return true;
      });
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
