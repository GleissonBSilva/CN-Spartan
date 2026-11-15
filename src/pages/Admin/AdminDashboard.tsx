import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaShieldAlt,
  FaUsers,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBan,
  FaSearch,
  FaRedoAlt,
  FaCalendarPlus,
  FaArrowLeft,
  FaTv,
  FaLock,
  FaUserShield,
  FaWhatsapp,
  FaChartLine,
  FaMoneyBillWave,
  FaSlidersH,
  FaFileCsv,
  FaPlus,
  FaQrcode,
  FaCopy,
  FaCheck,
  FaTrash,
  FaSyncAlt,
  FaTimes,
  FaBolt,
  FaSave,
  FaEdit,
  FaDesktop,
  FaMobileAlt,
  FaGlobe,
  FaPowerOff,
  FaEye,
  FaCreditCard,
  FaBarcode,
  FaCalendarDay,
  FaCalendarAlt,
  FaHistory,
  FaExchangeAlt,
  FaFilter,
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { useAuthProfile } from '../../hooks/useAuthProfile';
import type { Profile, ProfileStatus } from '../../types/supabase';
import { DEFAULT_PLANS, getSavedPlans, savePlansConfig, type PlanTier } from '../../constants/plans';
import { generatePixPayload, getPixQrCodeUrl } from '../../utils/pix';
import { fetchApi } from '../../lib/apiConfig';
import SEO from '../Home/SEO';

// Tipagem de Cobrança Pix
interface PixCharge {
  id: string;
  hash: string;
  customerName: string;
  customerEmail: string;
  customerWhatsapp?: string;
  amount: number;
  method: string;
  dueDate: string;
  status: 'liquidado' | 'cancelado' | 'pendente';
  createdAt: string;
}

// Configuração do Pix do Administrador
interface PixConfig {
  keyType: 'email' | 'cpf' | 'cnpj' | 'telefone' | 'aleatoria';
  key: string;
  recipientName: string;
  city: string;
  customMessage: string;
}

const DEFAULT_PIX_CONFIG: PixConfig = {
  keyType: 'email',
  key: 'gsroboticmania@gmail.com',
  recipientName: 'Spartan',
  city: 'Manaus',
  customMessage: 'Olá! Segue sua cobrança Pix Cine Spartan para ativação ou renovação imediata:',
};

// Configurações de Segurança e Trava do APK & Web
interface AppSecurityConfig {
  minVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
  apkDownloadUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updateMessage: string;
  webAccessEnabled: boolean;
  apkAccessEnabled: boolean;
  globalBroadcastMessage: string;
  blockedIps: string[];
  blockedDevices: string[];
}

const DEFAULT_SECURITY_CONFIG: AppSecurityConfig = {
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
};

// Lançamentos e Cobranças padrão do sistema (Total Faturado e Conciliado)
const INITIAL_PIX_CHARGES: PixCharge[] = [
  {
    id: 'pix-1',
    hash: 'PIX-8F92A-4B2E-99F0',
    customerName: 'Gleisson Silva (Master Admin)',
    customerEmail: 'gleisson1984@gmail.com',
    customerWhatsapp: '92993746740',
    amount: 119.9,
    method: 'Pix Instantâneo',
    dueDate: new Date().toLocaleDateString('pt-BR'),
    status: 'liquidado',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pay-2',
    hash: 'CARD-4C19A-88D1-33B2',
    customerName: 'GS Robotic (Cliente PRO)',
    customerEmail: 'gsroboticmania@gmail.com',
    customerWhatsapp: '92993746740',
    amount: 59.9,
    method: 'Cartão de Crédito',
    dueDate: new Date().toLocaleDateString('pt-BR'),
    status: 'liquidado',
    createdAt: new Date().toISOString(),
  },
];

interface AdminDashboardProps {
  defaultTab?: 'overview' | 'users' | 'finance' | 'plans' | 'security';
}

export default function AdminDashboard({ defaultTab = 'overview' }: AdminDashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading: authLoading, signInWithEmail } = useAuthProfile();

  // Determina a aba ativa pela URL ou prop
  const activeTab = useMemo(() => {
    if (location.pathname.includes('/users')) return 'users';
    if (location.pathname.includes('/finance')) return 'finance';
    if (location.pathname.includes('/plans')) return 'plans';
    if (location.pathname.includes('/security') || location.pathname.includes('/apk')) return 'security';
    return defaultTab;
  }, [location.pathname, defaultTab]);

  const setActiveTab = (tab: 'overview' | 'users' | 'finance' | 'plans' | 'security') => {
    if (tab === 'overview') navigate('/admin');
    else navigate(`/admin/${tab}`);
  };

  // Estados dos Clientes e Perfis
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProfileStatus | 'trial'>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'online' | 'apk' | 'web'>('all');
  const [devicesModalProfile, setDevicesModalProfile] = useState<Profile | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Lista Anti-Fraude de Testes Utilizados (permanente)
  const [usedTrials, setUsedTrials] = useState<Array<{ id: string; email: string; whatsapp?: string; claimed_at: string; trial_days: number; notes?: string }>>(() => {
    const saved = localStorage.getItem('spartan_used_trials');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'trial-seed-1',
            email: 'cliente.antigo@gmail.com',
            whatsapp: '92988112233',
            claimed_at: '2026-11-02',
            trial_days: 3,
            notes: 'Teste grátis utilizado e expirado',
          },
        ];
  });
  const [trialsModalOpen, setTrialsModalOpen] = useState(false);

  // Estados dos Planos
  const [plans, setPlans] = useState<PlanTier[]>(() => getSavedPlans());
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);

  // Estados do Financeiro Pix
  const [pixCharges, setPixCharges] = useState<PixCharge[]>(() => {
    const saved = localStorage.getItem('spartan_pix_charges');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (c: any) =>
              c.customerEmail?.toLowerCase() !== 'carlos.spartan@gmail.com' &&
              c.customerEmail?.toLowerCase() !== 'mariana.costa@hotmail.com' &&
              c.id !== 'pix-2' &&
              c.id !== 'pix-3'
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('spartan_pix_charges', JSON.stringify(cleaned));
          }
          return cleaned;
        }
      } catch {}
    }
    return INITIAL_PIX_CHARGES;
  });
  const [selectedPix, setSelectedPix] = useState<PixCharge | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [newPixModalOpen, setNewPixModalOpen] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [syncingPix, setSyncingPix] = useState(false);

  // Filtros Avançados de Gestão Financeira (Dia, Mês, Ano e Tipos de Pagamento)
  const [financePeriod, setFinancePeriod] = useState<'all' | 'today' | 'month' | 'year'>('month');
  const [financeMethodFilter, setFinanceMethodFilter] = useState<'all' | 'pix' | 'cartao' | 'boleto' | 'outro'>('all');
  const [financeStatusFilter, setFinanceStatusFilter] = useState<'all' | 'liquidado' | 'pendente' | 'cancelado'>('all');
  const [financeSearch, setFinanceSearch] = useState('');

  // Modal Novo Lançamento / Cobrança
  const [newPixData, setNewPixData] = useState<{
    customerName: string;
    customerEmail: string;
    customerWhatsapp: string;
    amount: number;
    method: string;
    status: 'pendente' | 'liquidado';
    unlockClient: boolean;
  }>({
    customerName: '',
    customerEmail: '',
    customerWhatsapp: '',
    amount: 59.9,
    method: 'Pix Instantâneo',
    status: 'pendente',
    unlockClient: true,
  });

  // Configurações do Pix do Master Admin
  const [pixConfig, setPixConfig] = useState<PixConfig>(() => {
    const saved = localStorage.getItem('spartan_pix_config');
    return saved ? JSON.parse(saved) : DEFAULT_PIX_CONFIG;
  });
  const [pixConfigModalOpen, setPixConfigModalOpen] = useState(false);

  // Configuração do Período de Teste Grátis (Trial)
  const [trialConfig, setTrialConfig] = useState<{ enabled: boolean; days: number }>(() => {
    const savedDays = localStorage.getItem('spartan_trial_days');
    const savedEnabled = localStorage.getItem('spartan_trial_enabled');
    return {
      enabled: savedEnabled !== null ? savedEnabled === 'true' : true,
      days: savedDays ? parseInt(savedDays, 10) : 3,
    };
  });
  const [savingTrialConfig, setSavingTrialConfig] = useState(false);

  // Sincroniza configuração de Trial local
  useEffect(() => {
    const savedDays = localStorage.getItem('spartan_trial_days');
    const savedEnabled = localStorage.getItem('spartan_trial_enabled');
    if (savedDays || savedEnabled !== null) {
      setTrialConfig({
        enabled: savedEnabled !== null ? savedEnabled === 'true' : true,
        days: savedDays ? parseInt(savedDays, 10) : 3,
      });
    }
  }, []);

  // Modal Novo Cliente
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    plan: 'SPARTAN PRO',
    screens: 2,
    days: 30,
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Modal Editar Cliente & Telas
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const editingProfileRef = useRef<Profile | null>(null);
  editingProfileRef.current = editingProfile;
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    plan: 'SPARTAN PRO',
    screens: 2,
    status: 'ativo' as ProfileStatus,
    expiresAt: '',
    whatsapp: '',
    isTrial: false,
  });
  const [savingEditProfile, setSavingEditProfile] = useState(false);

  // Configuração da Trava do APK e Segurança Remota
  const [securityConfig, setSecurityConfig] = useState<AppSecurityConfig>(() => {
    try {
      const saved = localStorage.getItem('spartan_app_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SECURITY_CONFIG,
          ...parsed,
          blockedIps: Array.isArray(parsed?.blockedIps) ? parsed.blockedIps : [],
          blockedDevices: Array.isArray(parsed?.blockedDevices) ? parsed.blockedDevices : [],
        };
      }
    } catch {}
    return DEFAULT_SECURITY_CONFIG;
  });
  const [newIpToBlock, setNewIpToBlock] = useState('');
  const [newDeviceToBlock, setNewDeviceToBlock] = useState('');
  const [savingSecurity, setSavingSecurity] = useState(false);

  // Carrega configuração de segurança e sistema do servidor /api/app-config e Supabase system_settings
  useEffect(() => {
    fetchApi('/api/app-config')
      .then((r) => (r.ok ? r.json() : null))
      .then((remote) => {
        if (remote) {
          setSecurityConfig((prev) => {
            const merged = {
              ...prev,
              ...remote,
              blockedIps: Array.isArray(remote.blockedIps) ? remote.blockedIps : (prev.blockedIps || []),
              blockedDevices: Array.isArray(remote.blockedDevices) ? remote.blockedDevices : (prev.blockedDevices || []),
            };
            try {
              localStorage.setItem('spartan_app_config', JSON.stringify(merged));
            } catch {}
            return merged;
          });

          if (remote.pixConfig && remote.pixConfig.key) {
            setPixConfig((prev) => ({ ...prev, ...remote.pixConfig }));
            try {
              localStorage.setItem('spartan_pix_config', JSON.stringify(remote.pixConfig));
            } catch {}
          }

          if (Array.isArray(remote.plansConfig) && remote.plansConfig.length > 0) {
            setPlans(remote.plansConfig);
            savePlansConfig(remote.plansConfig);
          }

          if (Array.isArray(remote.financialCharges) && remote.financialCharges.length > 0) {
            setPixCharges(remote.financialCharges);
            try {
              localStorage.setItem('spartan_pix_charges', JSON.stringify(remote.financialCharges));
            } catch {}
          }
        }
      })
      .catch(() => {});

    // Também carrega do banco Supabase system_settings para persistência permanente em nuvem
    supabase
      .from('system_settings')
      .select('key, value')
      .then(({ data }) => {
        if (!Array.isArray(data)) return;
        for (const row of data) {
          const val = row.value as any;
          if (!val) continue;
          if (row.key === 'app_security_config') {
            setSecurityConfig((prev) => {
              const merged = {
                ...prev,
                ...val,
                blockedIps: Array.isArray(val.blockedIps) ? val.blockedIps : (prev.blockedIps || []),
                blockedDevices: Array.isArray(val.blockedDevices) ? val.blockedDevices : (prev.blockedDevices || []),
              };
              try {
                localStorage.setItem('spartan_app_config', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          } else if (row.key === 'trial_config') {
            const days = typeof val.trial_days === 'number' ? val.trial_days : (typeof val.days === 'number' ? val.days : 3);
            const enabled = typeof val.enabled === 'boolean' ? val.enabled : true;
            setTrialConfig({ days, enabled });
            try {
              localStorage.setItem('spartan_trial_days', String(days));
              localStorage.setItem('spartan_trial_enabled', String(enabled));
            } catch {}
          } else if (row.key === 'pix_config' && val.key) {
            setPixConfig((prev) => ({ ...prev, ...val }));
            try {
              localStorage.setItem('spartan_pix_config', JSON.stringify(val));
            } catch {}
          } else if (row.key === 'plans_config' && Array.isArray(val) && val.length > 0) {
            setPlans(val);
            savePlansConfig(val);
          } else if (row.key === 'financial_charges' && Array.isArray(val) && val.length > 0) {
            setPixCharges(val);
            try {
              localStorage.setItem('spartan_pix_charges', JSON.stringify(val));
            } catch {}
          }
        }
      })
      .catch(() => {});
  }, []);

  const persistSecurityConfig = async (nextConfig: AppSecurityConfig, toastMsg?: string) => {
    setSavingSecurity(true);
    try {
      const cleanConfig: AppSecurityConfig = {
        ...DEFAULT_SECURITY_CONFIG,
        ...nextConfig,
        blockedIps: Array.isArray(nextConfig?.blockedIps) ? nextConfig.blockedIps : [],
        blockedDevices: Array.isArray(nextConfig?.blockedDevices) ? nextConfig.blockedDevices : [],
      };
      setSecurityConfig(cleanConfig);
      localStorage.setItem('spartan_app_config', JSON.stringify(cleanConfig));

      try {
        await supabase.from('system_settings').upsert({
          key: 'app_security_config',
          value: cleanConfig as any,
          updated_at: new Date().toISOString(),
        });
      } catch {}

      try {
        await fetchApi('/api/app-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanConfig),
        }).catch(() => {});
      } catch {}

      setNotification({
        type: 'success',
        message: toastMsg || 'Controle Web/APK e configurações de segurança salvas com sucesso!',
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Erro ao salvar configurações de segurança.',
      });
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleSaveSecurity = async () => {
    await persistSecurityConfig(securityConfig);
  };

  // Modais Diagnóstico 360° e Churn
  const [diagModalOpen, setDiagModalOpen] = useState(false);
  const [churnModalOpen, setChurnModalOpen] = useState(false);
  const [diagRunning, setDiagRunning] = useState(false);

  // Formulário de Login de fallback
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Persiste a lista de transações financeiras no localStorage, Supabase system_settings e API Vercel
  const saveFinancialCharges = useCallback(async (list: PixCharge[]) => {
    try {
      localStorage.setItem('spartan_pix_charges', JSON.stringify(list));
    } catch {}

    // 1. Sincroniza na API remota /api/app-config
    try {
      await fetchApi('/api/app-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialCharges: list }),
      }).catch(() => {});
    } catch {}

    // 2. Persiste no Supabase system_settings
    try {
      await supabase.from('system_settings').upsert({
        key: 'financial_charges',
        value: list as any,
        updated_at: new Date().toISOString(),
      });
    } catch {}
  }, []);

  // Sincroniza a lista de perfis no registro local compartilhado com AuthModal e AuthProfileContext
  const saveProfilesRegistry = useCallback((list: Profile[]) => {
    try {
      localStorage.setItem('spartan_registered_profiles', JSON.stringify(list));
    } catch {
      // ignore
    }
  }, []);

  // Persiste alterações no Supabase de forma resiliente (ignora IDs mock/locais e faz fallback se colunas novas ainda não existirem no banco)
  const persistProfileToSupabase = useCallback(async (profileId: string, fullPayload: Record<string, any>) => {
    // Sincroniza sempre na nuvem em tempo real (suporte a Web e APK Nativo)
    const cloudPayload = {
      id: profileId,
      admin_updated_at: fullPayload.admin_updated_at || new Date().toISOString(),
      ...fullPayload
    };
    try {
      await fetchApi('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloudPayload)
      });
    } catch {}

    try {
      const isUuid = Boolean(profileId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId));

      // Se for UUID, atualiza no Supabase
      if (isUuid) {
        const basePayload: Record<string, any> = {};
        if (fullPayload.status !== undefined) basePayload.status = fullPayload.status;
        if (fullPayload.expires_at !== undefined) basePayload.expires_at = fullPayload.expires_at;
        if (fullPayload.plan_name !== undefined) basePayload.plan_name = fullPayload.plan_name;
        if (fullPayload.max_screens !== undefined) basePayload.max_screens = fullPayload.max_screens;
        if (fullPayload.role !== undefined) basePayload.role = fullPayload.role;
        if (fullPayload.email !== undefined) basePayload.email = fullPayload.email;
        if (fullPayload.whatsapp !== undefined) basePayload.whatsapp = fullPayload.whatsapp;
        if (fullPayload.full_name !== undefined) basePayload.full_name = fullPayload.full_name;
        if (fullPayload.active_devices !== undefined) basePayload.active_devices = fullPayload.active_devices;
        if (fullPayload.is_trial !== undefined) basePayload.is_trial = fullPayload.is_trial;
        if (fullPayload.trial_used !== undefined) basePayload.trial_used = fullPayload.trial_used;

        if (basePayload.status) {
          try {
            await (supabase as any).rpc('update_profile_status_admin', {
              target_user_id: profileId,
              new_status: basePayload.status,
            });
          } catch {}
        }

        try {
          await supabase
            .from('profiles')
            .update(basePayload)
            .eq('id', profileId);
        } catch {
          // Fallback resiliente caso as colunas whatsapp, full_name ou active_devices não existam na instância remota
          delete basePayload.whatsapp;
          delete basePayload.full_name;
          delete basePayload.active_devices;
          try {
            await supabase
              .from('profiles')
              .update(basePayload)
              .eq('id', profileId);
          } catch {}
        }
      }

      // SEMPRE sincroniza com /api/clients (mesmo para IDs customizados/não-UUID) para que o APK e TV Box recebam a alteração na hora!
      try {
        const cloudSyncBody = {
          id: profileId,
          ...fullPayload,
          admin_updated_at: fullPayload.admin_updated_at || new Date().toISOString(),
        };
        await fetchApi('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cloudSyncBody),
        });
      } catch (errApi) {
        console.warn('Aviso ao sincronizar alteração na API:', errApi);
      }
    } catch (err) {
      console.warn('Aviso ao sincronizar alteração no Supabase (mantido localmente):', err);
    }
  }, []);

  // Carregar perfis do Supabase + sincronizar novos cadastros e preservar edições feitas pelo Admin
  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      let localList: Profile[] = [];
      try {
        const rawLocal = JSON.parse(localStorage.getItem('spartan_registered_profiles') || '[]');
        if (Array.isArray(rawLocal)) localList = rawLocal;
      } catch {
        localList = [];
      }

      // Sincroniza clientes cadastrados na nuvem (api/clients) para unificar todas as TV Boxes e aparelhos
      let cloudDeleted: string[] = [];
      try {
        // Tenta obter da nuvem oficial da Vercel (onde os celulares e TV Boxes se comunicam)
        const clientRes = await fetchApi('/api/clients');

        if (clientRes && clientRes.ok) {
          const cloudData = await clientRes.json();
          const cloudClients = Array.isArray(cloudData) ? cloudData : (cloudData.profiles || []);
          if (Array.isArray(cloudData?.deleted)) {
            cloudDeleted = cloudData.deleted;
          }
          if (Array.isArray(cloudClients)) {
            for (const cc of cloudClients) {
              const existingIdx = localList.findIndex(lp => lp.id === cc.id || (cc.email && lp.email?.toLowerCase() === cc.email.toLowerCase()));
              if (existingIdx >= 0) {
                const localAdminTime = localList[existingIdx].admin_updated_at ? new Date(localList[existingIdx].admin_updated_at).getTime() : 0;
                const cloudAdminTime = (cc.admin_updated_at || cc.updated_at) ? new Date(cc.admin_updated_at || cc.updated_at).getTime() : 0;
                if (localAdminTime >= cloudAdminTime) {
                  // Edição local do admin é mais recente ou igual; não permite que cache defasado reverta status/validade
                  localList[existingIdx] = { ...cc, ...localList[existingIdx] };
                } else {
                  localList[existingIdx] = { ...localList[existingIdx], ...cc };
                }
              } else {
                localList.unshift(cc);
              }
            }
          }
        }
      } catch {}

      let deletedList: string[] = [];
      try {
        const rawDeleted = JSON.parse(localStorage.getItem('spartan_deleted_profiles') || '[]');
        if (Array.isArray(rawDeleted)) {
          deletedList = rawDeleted;
        }
      } catch {
        deletedList = [];
      }
      const BANNED_MOCKS = ['mock-2', 'mock-3', 'carlos.spartan@gmail.com', 'mariana.costa@hotmail.com'];
      deletedList = Array.from(new Set([...deletedList, ...cloudDeleted, ...BANNED_MOCKS]));

      // Purga imediata de mockups de teste de qualquer cache local
      localList = localList.filter(
        (p) =>
          !BANNED_MOCKS.includes(p.id) &&
          !BANNED_MOCKS.includes(p.email?.toLowerCase()?.trim())
      );

      // Se o perfil foi excluído (ID ou E-mail), ele NÃO deve ser re-incluído
      const isDeletedProfile = (p: { id?: string; email?: string; status?: string }) => {
        if (!p) return false;
        const idMatch = Boolean(p.id && deletedList.includes(p.id));
        const emailMatch = Boolean(p.email && deletedList.includes(p.email.toLowerCase().trim()));
        return idMatch || emailMatch;
      };

      const fallbackMocks: Profile[] = [
        {
          id: 'mock-1',
          email: 'gleisson1984@gmail.com',
          full_name: 'Gleisson Silva (Master Admin)',
          whatsapp: '(92) 99374-6740',
          role: 'admin',
          status: 'ativo',
          plan_name: 'SPARTAN BUSINESS',
          expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
          max_screens: 5,
          created_at: new Date().toISOString(),
        },
        {
          id: 'usr-gsrobotic-1',
          email: 'gsroboticmania@gmail.com',
          full_name: 'GS Robotic (Cliente PRO)',
          whatsapp: '(92) 99374-6740',
          role: 'client',
          status: 'ativo',
          plan_name: 'SPARTAN PRO (Teste Grátis)',
          expires_at: '2026-11-16T01:44:54.699Z',
          max_screens: 2,
          is_trial: true,
          trial_used: true,
          created_at: '2026-11-15T01:44:54.702Z',
        },
        {
          id: 'usr-amandha-1',
          email: 'amandha.azevedo19@gmail.com',
          full_name: 'Amanda Castro de Azevedo',
          whatsapp: '(92) 99348-6301',
          role: 'client',
          status: 'ativo',
          plan_name: 'SPARTAN START',
          expires_at: '2026-11-17T23:19:21.426Z',
          max_screens: 1,
          is_trial: true,
          trial_used: true,
          created_at: '2026-11-14T23:19:21.426Z',
        },
      ];

      let data: any = null;
      let error: any = null;
      try {
        const res = await supabase
          .from('profiles')
          .select('id, email, role, status, plan_name, expires_at, max_screens, created_at')
          .order('created_at', { ascending: false });
        data = res.data;
        error = res.error;
      } catch (e) {
        error = e;
      }

      if (error) {
        try {
          const res = await supabase
            .from('profiles')
            .select('id, email, role, status, plan_name, expires_at, max_screens, created_at')
            .order('created_at', { ascending: false });
          data = res.data;
          error = res.error;
        } catch {}
      }

      // Se não retornou linhas do Supabase (por exemplo por restrição de RLS para anon), utiliza cloudList da API
      const initialRows: Profile[] = Array.isArray(data) && data.length > 0 ? (data as Profile[]) : cloudList;

      if (error || initialRows.length === 0) {
        if (error) console.warn('Profiles não encontrados no Supabase, usando API/fallback:', error.message);
        const combined = (cloudList.length > 0 ? cloudList : localList).filter((c) => !isDeletedProfile(c));
        for (const m of fallbackMocks) {
          if (
            !isDeletedProfile(m) &&
            !combined.some((c) => c.id === m.id || c.email.toLowerCase() === m.email.toLowerCase())
          ) {
            combined.push(m);
          }
        }
        saveProfilesRegistry(combined);
        setProfiles(combined);
        return;
      }

      const dbProfiles = initialRows
        .filter((dbP) => !isDeletedProfile(dbP))
        .map((dbP) => {
          const localMatch = localList.find(
            (lp) => lp.id === dbP.id || lp.email?.toLowerCase() === dbP.email?.toLowerCase()
          );

          // Se o Admin já editou este cliente, preserva integralmente os dados salvos pelo Admin
          const hasAdminEdit = Boolean(localMatch?.admin_updated_at);

          const needsPlanSync =
            localMatch &&
            localMatch.plan_name &&
            (dbP.plan_name?.toLowerCase().startsWith('teste grátis') || dbP.plan_name === 'Mensal');

          const mergedEmail = hasAdminEdit && localMatch?.email ? localMatch.email : dbP.email;
          const mergedPlan =
            hasAdminEdit && localMatch?.plan_name
              ? localMatch.plan_name
              : needsPlanSync
              ? localMatch!.plan_name
              : dbP.plan_name;
          let mergedScreens =
            hasAdminEdit && localMatch?.max_screens
              ? Number(localMatch.max_screens)
              : dbP.max_screens && dbP.max_screens > 1
              ? dbP.max_screens
              : localMatch?.max_screens || dbP.max_screens || 1;
          const mergedPlanUpper = String(mergedPlan || '').toUpperCase();
          if (mergedPlanUpper.includes('START') && mergedScreens > 1) mergedScreens = 1;
          else if (mergedPlanUpper.includes('PRO') && mergedScreens > 2) mergedScreens = 2;
          else if (mergedPlanUpper.includes('BUSINESS') && mergedScreens < 5) mergedScreens = 5;
          const mergedWhatsapp =
            localMatch?.whatsapp || dbP.whatsapp || undefined;
          const mergedName =
            localMatch?.full_name || dbP.full_name || undefined;
          const mergedIsTrial =
            hasAdminEdit && localMatch?.is_trial !== undefined
              ? localMatch.is_trial
              : dbP.is_trial !== undefined
              ? dbP.is_trial
              : localMatch?.is_trial ?? Boolean(dbP.plan_name?.toLowerCase().includes('teste'));
          // Se o perfil está marcado como suspenso (pelo banco ou pelo Admin), prevalece estritamente 'suspenso'
          let finalStatus: ProfileStatus = dbP.status;
          let finalExpiresAt: string = dbP.expires_at;

          if (dbP.status === 'suspenso' || localMatch?.status === 'suspenso') {
            finalStatus = 'suspenso';
          } else if (hasAdminEdit && localMatch?.status) {
            finalStatus = localMatch.status;
          }

          if (hasAdminEdit && localMatch?.expires_at) {
            finalExpiresAt = localMatch.expires_at;
          } else if (mergedIsTrial && localMatch?.expires_at) {
            finalExpiresAt = localMatch.expires_at;
          }

          // Proteção contra divergência de teste com 30 dias:
          // Novo cliente em teste só tem direito aos dias de teste (padrão 3 dias), nunca 30 dias antes de pagar
          if (mergedIsTrial && !hasAdminEdit) {
            const createdTime = new Date(dbP.created_at || localMatch?.created_at || Date.now()).getTime();
            const expTime = new Date(finalExpiresAt).getTime();
            const daysDiff = (expTime - createdTime) / (1000 * 60 * 60 * 24);
            if (daysDiff > 7) {
              const trialDaysCfg = trialConfig.days || 3;
              finalExpiresAt = new Date(createdTime + trialDaysCfg * 24 * 60 * 60 * 1000).toISOString();
            }
          }

          // Bloqueio automático imediato ao expirar a assinatura (apenas se não estiver suspenso)
          if (finalStatus !== 'suspenso' && dbP.role !== 'admin' && new Date(finalExpiresAt).getTime() <= Date.now()) {
            finalStatus = 'vencido';
          }

          return {
            ...dbP,
            email: mergedEmail,
            full_name: mergedName,
            whatsapp: mergedWhatsapp,
            plan_name: mergedPlan,
            max_screens: mergedScreens,
            is_trial: mergedIsTrial,
            expires_at: finalExpiresAt,
            status: finalStatus,
            active_devices:
              Array.isArray(localMatch?.active_devices) && localMatch!.active_devices.length > 0
                ? localMatch!.active_devices
                : Array.isArray(dbP.active_devices)
                ? dbP.active_devices
                : [],
            last_platform: localMatch?.last_platform || dbP.last_platform,
            last_ip: localMatch?.last_ip || dbP.last_ip,
            last_seen_at: localMatch?.last_seen_at || dbP.last_seen_at,
            admin_updated_at: localMatch?.admin_updated_at || dbP.admin_updated_at,
          };
        });

      // Inclui cadastros recentes ou clientes locais que não estão na tabela do Supabase
      for (const lp of localList) {
        if (
          !isDeletedProfile(lp) &&
          !dbProfiles.some((dp) => dp.id === lp.id || dp.email.toLowerCase() === lp.email.toLowerCase())
        ) {
          const isExp = lp.role !== 'admin' && new Date(lp.expires_at).getTime() <= Date.now();
          dbProfiles.unshift({
            ...lp,
            status: isExp && lp.status === 'ativo' ? 'vencido' : lp.status,
          });
        }
      }

      // Garante que todos os clientes ativos padrão existam na lista se não tiverem sido deletados pelo admin
      for (const m of fallbackMocks) {
        if (
          !isDeletedProfile(m) &&
          !dbProfiles.some((dp) => dp.id === m.id || dp.email.toLowerCase() === m.email.toLowerCase())
        ) {
          dbProfiles.push(m);
        }
      }

      saveProfilesRegistry(dbProfiles);
      setProfiles(dbProfiles);
    } catch (err: unknown) {
      console.error('Erro ao listar perfis:', err);
    } finally {
      setLoading(false);
    }
  }, [saveProfilesRegistry, persistProfileToSupabase]);

  useEffect(() => {
    if (isAdmin) {
      loadProfiles();
    }
  }, [isAdmin, loadProfiles]);

  // Monitora novos cadastros, cobranças Pix e bloqueia automaticamente clientes cujo teste acabou
  useEffect(() => {
    if (!isAdmin) return;

    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === 'spartan_registered_profiles') {
        loadProfiles();
      } else if (e.key === 'spartan_pix_charges' && e.newValue) {
        try {
          setPixCharges(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      } else if (e.key === 'spartan_used_trials' && e.newValue) {
        try {
          setUsedTrials(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };

    const expiryInterval = setInterval(() => {
      setProfiles((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          if (p.role !== 'admin' && p.status === 'ativo' && new Date(p.expires_at).getTime() <= Date.now()) {
            changed = true;
            if (typeof p.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id)) {
              supabase.from('profiles').update({ status: 'vencido' }).eq('id', p.id).then(() => {});
            }
            return { ...p, status: 'vencido' as ProfileStatus };
          }
          return p;
        });
        if (changed) {
          saveProfilesRegistry(next);
          return next;
        }
        return prev;
      });
    }, 15000);

    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      clearInterval(expiryInterval);
    };
  }, [isAdmin, loadProfiles, saveProfilesRegistry]);

  // Atualização em tempo real (Auto-Sync a cada 4s + Foco na Janela / Retorno de Aba)
  useEffect(() => {
    if (!isAdmin) return;

    let isPolling = false;

    const pollRemoteClients = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const res = await fetchApi('/api/clients');
        if (!res || !res.ok) return;
        const remoteData = await res.json();
        const remoteList: Profile[] = Array.isArray(remoteData) ? remoteData : (remoteData?.profiles || []);
        const remoteDeleted: string[] = Array.isArray(remoteData?.deleted) ? remoteData.deleted : [];

        if (!Array.isArray(remoteList)) return;

        setProfiles((prev) => {
          let changed = false;

          // 1. Remove perfis deletados na nuvem
          let currentList = prev.filter((p) => {
            const isDel = remoteDeleted.includes(p.id) || (p.email && remoteDeleted.includes(p.email.toLowerCase().trim()));
            if (isDel) {
              changed = true;
              return false;
            }
            return true;
          });

          // 2. Atualiza dados de telemetria de perfis existentes (aparelhos ativos, telas conectadas, pings, IP e plataforma)
          // REGRA DE OURO SPARTAN: O Administrador no Painel Admin é a autoridade absoluta.
          // O polling automático em segundo plano NUNCA deve reverter o plano, telas, validade ou status que o Admin configurou!
          const updatedList = currentList.map((p) => {
            const match = remoteList.find(
              (r: any) =>
                r.id === p.id ||
                (r.email && p.email && String(r.email).toLowerCase() === String(p.email).toLowerCase())
            );
            if (!match) return p;

            const remoteDevices = Array.isArray(match.active_devices) ? match.active_devices : p.active_devices || [];
            const nextPlatform = match.last_platform || p.last_platform;
            const nextIp = match.last_ip || p.last_ip;
            const nextSeen = match.last_seen_at || p.last_seen_at;

            const hasTelemetryChanged =
              JSON.stringify(remoteDevices) !== JSON.stringify(p.active_devices || []) ||
              nextPlatform !== p.last_platform ||
              nextIp !== p.last_ip ||
              nextSeen !== p.last_seen_at;

            if (hasTelemetryChanged) {
              changed = true;
              return {
                ...p, // Preserva integralmente tudo que o Admin alterou (plano, telas, status, validade, dados)
                active_devices: remoteDevices,
                last_platform: nextPlatform,
                last_ip: nextIp,
                last_seen_at: nextSeen,
              };
            }
            return p;
          });

          // 3. Adiciona NOVOS clientes cadastrados na nuvem (Web, APK ou TV Box)
          const existingIds = new Set(updatedList.map((p) => p.id));
          const existingEmails = new Set(updatedList.map((p) => (p.email || '').toLowerCase().trim()));

          const newClients = remoteList.filter((r) => {
            if (!r.id && !r.email) return false;
            const idExists = r.id && existingIds.has(r.id);
            const emailExists = r.email && existingEmails.has(r.email.toLowerCase().trim());
            return !idExists && !emailExists;
          });

          if (newClients.length > 0) {
            changed = true;
            updatedList.unshift(...newClients);
          }

          if (changed) {
            saveProfilesRegistry(updatedList);
            return updatedList;
          }
          return prev;
        });

        // Atualiza modal de dispositivos se estiver aberto
        setDevicesModalProfile((curr) => {
          if (!curr) return null;
          const match = remoteList.find(
            (r: any) =>
              r.id === curr.id ||
              (r.email && curr.email && String(r.email).toLowerCase() === String(curr.email).toLowerCase())
          );
          if (!match) return curr;
          return {
            ...curr,
            ...match,
            active_devices: Array.isArray(match.active_devices) ? match.active_devices : curr.active_devices || [],
            last_platform: match.last_platform || curr.last_platform,
            last_ip: match.last_ip || curr.last_ip,
            last_seen_at: match.last_seen_at || curr.last_seen_at,
          };
        });
      } catch {
        // ignore
      } finally {
        isPolling = false;
      }
    };

    // Executa imediatamente e a cada 4 segundos
    pollRemoteClients();
    const timer = setInterval(pollRemoteClients, 4000);

    // Quando o usuário foca na tela ou retorna para a aba
    const handleFocus = () => pollRemoteClients();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pollRemoteClients();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAdmin, saveProfilesRegistry]);

  // Controle de Sessões e Aparelhos (Web & APK)
  const handleDisconnectDevices = async (profile: Profile, targetDeviceId?: string) => {
    setActionLoadingId(profile.id);
    try {
      const currentDevices = Array.isArray(profile.active_devices) ? profile.active_devices : [];
      const nextDevices = targetDeviceId
        ? currentDevices.filter((d) => d.deviceId !== targetDeviceId)
        : [];
      const nowStamp = new Date().toISOString();

      await persistProfileToSupabase(profile.id, {
        email: profile.email,
        full_name: profile.full_name,
        whatsapp: profile.whatsapp,
        plan_name: profile.plan_name,
        max_screens: profile.max_screens,
        status: profile.status,
        expires_at: profile.expires_at,
        active_devices: nextDevices,
        last_platform: profile.last_platform,
        last_ip: profile.last_ip,
        last_seen_at: profile.last_seen_at,
        admin_updated_at: nowStamp,
      });

      setProfiles((prev) => {
        const next = prev.map((p) => {
          const isTarget = p.id === profile.id || (p.email && profile.email && p.email.toLowerCase() === profile.email.toLowerCase());
          if (isTarget) {
            return { ...p, active_devices: nextDevices, admin_updated_at: nowStamp };
          }
          return p;
        });
        saveProfilesRegistry(next);
        return next;
      });

      setDevicesModalProfile((curr) =>
        curr && curr.id === profile.id ? { ...curr, active_devices: nextDevices } : curr
      );

      setNotification({
        type: 'success',
        message: targetDeviceId
          ? `Aparelho desconectado de ${profile.full_name || profile.email}!`
          : `Todas as telas de ${profile.full_name || profile.email} foram derrubadas!`,
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Erro ao desconectar aparelho do cliente.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleBlockDevice = async (deviceId: string) => {
    if (!deviceId) return;
    const current = Array.isArray(securityConfig?.blockedDevices) ? securityConfig.blockedDevices : [];
    const isBlocked = current.includes(deviceId);
    const nextList = isBlocked ? current.filter((d) => d !== deviceId) : [...current, deviceId];
    await persistSecurityConfig(
      { ...securityConfig, blockedDevices: nextList },
      isBlocked
        ? `Aparelho ${deviceId} desbloqueado com sucesso!`
        : `Aparelho ${deviceId} bloqueado permanentemente!`
    );
  };

  const handleQuickBlockIp = async (ip: string) => {
    if (!ip) return;
    const current = Array.isArray(securityConfig?.blockedIps) ? securityConfig.blockedIps : [];
    const isBlocked = current.includes(ip);
    const nextList = isBlocked ? current.filter((i) => i !== ip) : [...current, ip];
    await persistSecurityConfig(
      { ...securityConfig, blockedIps: nextList },
      isBlocked ? `IP ${ip} removido da lista negra!` : `IP ${ip} adicionado à lista negra!`
    );
  };

  // Toast automático
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Ações de Clientes
  const handleToggleStatus = async (profile: Profile) => {
    const isCurrentlySuspended = profile.status === 'suspenso';
    const newStatus: ProfileStatus = isCurrentlySuspended ? 'ativo' : 'suspenso';
    // Se estiver reativando um cliente cuja validade já estava vencida, estende +30 dias para não bloquear de novo em 15s
    let newExpiresAt = profile.expires_at;
    if (newStatus === 'ativo' && new Date(profile.expires_at).getTime() <= Date.now()) {
      const dt = new Date();
      dt.setDate(dt.getDate() + 30);
      newExpiresAt = dt.toISOString();
    }
    const nowStamp = new Date().toISOString();

    setActionLoadingId(profile.id);
    try {
      await persistProfileToSupabase(profile.id, {
        email: profile.email,
        full_name: profile.full_name,
        whatsapp: profile.whatsapp,
        plan_name: profile.plan_name,
        max_screens: profile.max_screens,
        status: newStatus,
        expires_at: newExpiresAt,
        admin_updated_at: nowStamp,
      });

      // Se for suspenso, desconecta imediatamente todos os aparelhos ativos
      if (newStatus === 'suspenso') {
        try {
          await persistProfileToSupabase(profile.id, {
            active_devices: [],
          });
        } catch {}
      }

      setProfiles((prev) => {
        const next = prev.map((p) => {
          const isTarget = p.id === profile.id || (p.email && profile.email && p.email.toLowerCase() === profile.email.toLowerCase());
          if (isTarget) {
            return {
              ...p,
              status: newStatus,
              expires_at: newExpiresAt,
              admin_updated_at: nowStamp,
              active_devices: newStatus === 'suspenso' ? [] : p.active_devices,
            };
          }
          return p;
        });
        saveProfilesRegistry(next);
        return next;
      });
      setNotification({
        type: 'success',
        message: `Status de ${profile.full_name || profile.email} alterado para "${newStatus.toUpperCase()}". Sincronizado em tempo real com todos os dispositivos!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar status';
      setNotification({ type: 'error', message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExtendSubscription = async (profile: Profile, daysToAdd: number) => {
    setActionLoadingId(profile.id);
    try {
      const currentExpiry = new Date(profile.expires_at);
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + daysToAdd);
      const newExpiryIso = baseDate.toISOString();
      const nowStamp = new Date().toISOString();

      await persistProfileToSupabase(profile.id, {
        email: profile.email,
        full_name: profile.full_name,
        whatsapp: profile.whatsapp,
        plan_name: profile.plan_name,
        max_screens: profile.max_screens,
        expires_at: newExpiryIso,
        status: 'ativo',
        is_trial: false,
        admin_updated_at: nowStamp,
      });

      setProfiles((prev) => {
        const next = prev.map((p) => {
          const isTarget = p.id === profile.id || (p.email && profile.email && p.email.toLowerCase() === profile.email.toLowerCase());
          if (isTarget) {
            return {
              ...p,
              expires_at: newExpiryIso,
              status: 'ativo' as ProfileStatus,
              is_trial: false,
              admin_updated_at: nowStamp,
            };
          }
          return p;
        });
        saveProfilesRegistry(next);
        return next;
      });
      setNotification({
        type: 'success',
        message: `Assinatura de ${profile.full_name || profile.email} estendida em +${daysToAdd} dias!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao estender assinatura';
      setNotification({ type: 'error', message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir o cliente ${profile.email}?\n\nEle será excluído do Supabase (profiles e auth.users) para liberar espaço no banco, e seu e-mail e WhatsApp serão gravados permanentemente no Anti-Fraude (used_trials).\n\nSe ele tentar se cadastrar novamente, o cadastro será permitido mas ele NÃO terá direito a teste grátis (entrará como vencido)!`
      )
    )
      return;
    setActionLoadingId(profile.id);
    try {
      const cleanEmail = profile.email.toLowerCase().trim();
      const cleanPhone = profile.whatsapp ? profile.whatsapp.replace(/\D/g, '') : null;
      const isUuid = Boolean(profile.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id));

      // 1. Grava no histórico permanente anti-fraude local e no Supabase (used_trials)
      const usedEntry = {
        id: 'trial-' + Date.now(),
        email: cleanEmail,
        whatsapp: cleanPhone || profile.whatsapp,
        claimed_at: new Date().toISOString(),
        trial_days: 3,
        notes: 'Cliente excluído pelo Administrador - Anti-Fraude Permanente',
      };
      const updatedUsedTrials = [usedEntry, ...usedTrials];
      setUsedTrials(updatedUsedTrials);
      localStorage.setItem('spartan_used_trials', JSON.stringify(updatedUsedTrials));

      try {
        await supabase.from('used_trials').insert([
          {
            email: cleanEmail,
            whatsapp: cleanPhone,
            trial_days: 3,
            notes: 'Excluído pelo Administrador - Anti-Fraude Permanente',
          },
        ]);
      } catch (errUt) {
        console.warn('Registro em used_trials no Supabase:', errUt);
      }

      // 2. Notifica a nuvem /api/clients para revogação em tempo real em todas as TV Boxes e dispositivos
      try {
        await fetchApi(`/api/clients?id=${encodeURIComponent(profile.id)}&email=${encodeURIComponent(cleanEmail)}`, {
          method: 'DELETE'
        }).catch(() => {});
      } catch {}

      // 3. Registra exclusão permanente local para nunca mais reaparecer no reload
      try {
        const rawDeleted = JSON.parse(localStorage.getItem('spartan_deleted_profiles') || '[]');
        const deletedArr = Array.isArray(rawDeleted) ? rawDeleted : [];
        const updatedDeleted = Array.from(new Set([...deletedArr, profile.id, cleanEmail]));
        localStorage.setItem('spartan_deleted_profiles', JSON.stringify(updatedDeleted));
      } catch {}

      // 4. Executa a exclusão definitiva no Supabase (auth.users e public.profiles) via RPC
      let rpcSuccess = false;
      try {
        const { error: rpcErr } = await (supabase as any).rpc('delete_user_by_admin', {
          target_user_id: isUuid ? profile.id : null,
          target_email: cleanEmail,
        });
        if (!rpcErr) rpcSuccess = true;
      } catch {}

      if (!rpcSuccess && isUuid) {
        try {
          const { error: rpcErr2 } = await (supabase as any).rpc('delete_user_by_admin', {
            target_user_id: profile.id,
          });
          if (!rpcErr2) rpcSuccess = true;
        } catch {}
      }

      if (!rpcSuccess) {
        try {
          await (supabase as any).rpc('delete_user_by_email_admin', {
            target_email: cleanEmail,
          });
        } catch {}
      }

      // 5. Deleta diretamente da tabela profiles por ID e por e-mail
      try {
        if (isUuid) {
          await supabase.from('profiles').delete().eq('id', profile.id);
        }
        await supabase.from('profiles').delete().ilike('email', cleanEmail);
      } catch (e) {
        console.warn('Erro ao deletar de public.profiles:', e);
      }

      // 6. Atualiza o estado da lista e limpa do cache do navegador
      setProfiles((prev) => {
        const next = prev.filter((p) => p.id !== profile.id && p.email?.toLowerCase().trim() !== cleanEmail);
        saveProfilesRegistry(next);
        return next;
      });

      // Limpa do spartan_registered_profiles
      try {
        const reg = JSON.parse(localStorage.getItem('spartan_registered_profiles') || '[]');
        if (Array.isArray(reg)) {
          const filteredReg = reg.filter((p: any) => p.id !== profile.id && p.email?.toLowerCase().trim() !== cleanEmail);
          localStorage.setItem('spartan_registered_profiles', JSON.stringify(filteredReg));
        }
      } catch {}

      setNotification({
        type: 'success',
        message: `Cliente ${profile.email} excluído com sucesso do banco e adicionado ao Anti-Fraude!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir cliente';
      setNotification({ type: 'error', message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Exportar CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Email', 'WhatsApp (Pix)', 'Role', 'Status', 'Plano', 'Telas', 'Expira Em', 'Criado Em'];
    const rows = profiles.map((p) => [
      p.id,
      p.email,
      p.whatsapp || 'Nao informado',
      p.role,
      p.status,
      p.plan_name,
      p.max_screens,
      new Date(p.expires_at).toLocaleDateString('pt-BR'),
      new Date(p.created_at).toLocaleDateString('pt-BR'),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spartan_clientes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotification({ type: 'success', message: 'CSV exportado com sucesso!' });
  };

  // Abrir Modal de Novo Cliente com Telas Sincronizadas do Plano
  const handleOpenNewUserModal = () => {
    const defaultPlan = plans.find((p) => p.name.includes('PRO')) || plans[0] || { name: 'SPARTAN PRO', screens: 2 };
    setNewUserData({
      name: '',
      email: '',
      whatsapp: '',
      plan: defaultPlan.name,
      screens: defaultPlan.screens,
      days: trialConfig.enabled ? (trialConfig.days || 3) : 30,
    });
    setNewUserModalOpen(true);
  };

  // Seleção de Plano com Preenchimento Automático de Telas Simultâneas
  const handleSelectPlan = (planName: string) => {
    const foundPlan = plans.find((p) => p.name.toLowerCase() === planName.toLowerCase());
    let autoScreens = 1;
    if (foundPlan) {
      autoScreens = foundPlan.screens;
    } else if (planName.toUpperCase().includes('START')) {
      autoScreens = 1;
    } else if (planName.toUpperCase().includes('PRO')) {
      autoScreens = 2;
    } else if (planName.toUpperCase().includes('BUSINESS')) {
      autoScreens = 5;
    }

    setNewUserData((prev) => ({
      ...prev,
      plan: planName,
      screens: autoScreens,
    }));
  };

  // Cadastrar Novo Cliente
  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.email.trim()) return;
    setCreatingUser(true);
    try {
      const dummyId = 'usr-' + Math.random().toString(36).substring(2, 9);
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + newUserData.days);

      const newProf: Profile = {
        id: dummyId,
        email: newUserData.email.trim().toLowerCase(),
        full_name: newUserData.name.trim() || undefined,
        whatsapp: newUserData.whatsapp.trim() || undefined,
        role: 'client',
        status: 'ativo',
        plan_name: newUserData.plan,
        is_trial: trialConfig.enabled && newUserData.days <= (trialConfig.days || 7),
        trial_used: true,
        max_screens: Number(newUserData.screens),
        expires_at: expiry.toISOString(),
        created_at: new Date().toISOString(),
      };

      // Sincroniza na nuvem para unificar com todos os aparelhos
      try {
        fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProf)
        }).catch(() => {});
      } catch {}

      // Tenta salvar diretamente no Supabase com colunas válidas
      try {
        await supabase.from('profiles').upsert([
          {
            id: dummyId,
            email: newProf.email,
            full_name: newProf.full_name,
            whatsapp: newProf.whatsapp,
            role: newProf.role,
            status: newProf.status,
            plan_name: newProf.plan_name,
            max_screens: newProf.max_screens,
            expires_at: newProf.expires_at,
          },
        ]);
      } catch {
        try {
          await supabase.from('profiles').upsert([
            {
              id: dummyId,
              email: newProf.email,
              role: newProf.role,
              status: newProf.status,
              plan_name: newProf.plan_name,
              max_screens: newProf.max_screens,
              expires_at: newProf.expires_at,
            },
          ]);
        } catch {
          // Fallback local
        }
      }

      // Se foi criado como cliente pago (dias > dias de teste), registra a transação financeira no Supabase e na nuvem
      if (!newProf.is_trial) {
        const foundPlanObj = plans.find((pl) => pl.name.toUpperCase() === newProf.plan_name?.toUpperCase());
        const planAmount = foundPlanObj?.monthlyPrice || 59.9;
        const newPaidCharge: PixCharge = {
          id: 'pay-' + Date.now(),
          hash: 'PAY-' + Math.random().toString(36).substring(2, 7).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
          customerName: newProf.full_name || newProf.email.split('@')[0],
          customerEmail: newProf.email,
          customerWhatsapp: newProf.whatsapp,
          amount: planAmount,
          method: `Ativação (${newProf.plan_name})`,
          dueDate: new Date().toLocaleDateString('pt-BR'),
          status: 'liquidado',
          createdAt: new Date().toISOString(),
        };
        setPixCharges((prev) => {
          const updated = [newPaidCharge, ...prev];
          saveFinancialCharges(updated);
          return updated;
        });
      }

      setProfiles((prev) => {
        const next = [newProf, ...prev];
        saveProfilesRegistry(next);
        return next;
      });
      setNewUserModalOpen(false);
      setNewUserData({ name: '', email: '', whatsapp: '', plan: 'SPARTAN PRO', screens: 2, days: 30 });
      setNotification({
        type: 'success',
        message: `Novo cliente ${newProf.email} cadastrado com sucesso!`,
      });
    } finally {
      setCreatingUser(false);
    }
  };

  // Salvar Plano Editado
  const handleSavePlan = async (planId: string) => {
    setSavingPlanId(planId);
    try {
      savePlansConfig(plans);

      // 1. Sincroniza imediatamente com a nuvem /api/app-config para todos os clientes
      try {
        await fetchApi('/api/app-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plansConfig: plans }),
        }).catch(() => {});
      } catch {}

      // 2. Persiste no Supabase system_settings se disponível
      try {
        await supabase.from('system_settings').upsert({
          key: 'plans_config',
          value: plans as any,
          updated_at: new Date().toISOString(),
        });
      } catch {}
      setNotification({
        type: 'success',
        message: 'Regras e preços do plano atualizados com sucesso e propagados para os clientes!',
      });
    } finally {
      setSavingPlanId(null);
    }
  };

  // Alterar campos de um plano
  const handlePlanChange = (id: string, field: keyof PlanTier, value: any) => {
    setPlans((prev) =>
      prev.map((pl) => (pl.id === id ? { ...pl, [field]: value } : pl))
    );
  };

  // Sincronizar Pagamentos Pix
  const handleSyncPix = async () => {
    setSyncingPix(true);
    try {
      const res = await fetchApi('/api/app-config');
      if (res && res.ok) {
        const remote = await res.json();
        if (Array.isArray(remote.financialCharges) && remote.financialCharges.length > 0) {
          setPixCharges(remote.financialCharges);
          try {
            localStorage.setItem('spartan_pix_charges', JSON.stringify(remote.financialCharges));
          } catch {}
        }
      }
      setNotification({
        type: 'success',
        message: 'Pagamentos Pix sincronizados com a nuvem e 100% conciliados!',
      });
    } catch {
      setNotification({
        type: 'success',
        message: 'Pagamentos Pix conciliados localmente.',
      });
    } finally {
      setSyncingPix(false);
    }
  };

  // Criar Nova Cobrança ou Lançamento Financeiro
  const handleCreatePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPixData.customerEmail) return;
    const isPaid = newPixData.status === 'liquidado';
    const methodClean = newPixData.method || 'Pix Instantâneo';
    const hashPrefix = methodClean.toLowerCase().includes('cart') ? 'CARD' : methodClean.toLowerCase().includes('bolet') ? 'BOL' : 'PIX';
    const newEntry: PixCharge = {
      id: 'charge-' + Date.now(),
      hash: `${hashPrefix}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      customerName: newPixData.customerName || 'Cliente Spartan',
      customerEmail: newPixData.customerEmail,
      customerWhatsapp: newPixData.customerWhatsapp ? newPixData.customerWhatsapp.replace(/\D/g, '') : undefined,
      amount: Number(newPixData.amount) || 0,
      method: methodClean,
      dueDate: new Date().toLocaleDateString('pt-BR'),
      status: newPixData.status,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...pixCharges];
    setPixCharges(updated);
    saveFinancialCharges(updated);
    setNewPixModalOpen(false);

    // Se registrado como já liquidado e a opção de desbloquear estiver ativa
    if (isPaid && newPixData.unlockClient) {
      const match = profiles.find((p) => p.email.toLowerCase() === newPixData.customerEmail.toLowerCase());
      if (match) {
        await handleConfirmPaymentAndUnlock(match);
      }
    }

    setNewPixData({
      customerName: '',
      customerEmail: '',
      customerWhatsapp: '',
      amount: 59.9,
      method: 'Pix Instantâneo',
      status: 'pendente',
      unlockClient: true,
    });

    if (!isPaid && methodClean.toLowerCase().includes('pix')) {
      setSelectedPix(newEntry);
      setPixModalOpen(true);
    }
    setNotification({
      type: 'success',
      message: isPaid ? 'Pagamento registrado e liquidado com sucesso!' : 'Cobrança gerada com sucesso!',
    });
  };

  // Cancelar cobrança
  const handleCancelCharge = (chargeId: string) => {
    const updated = pixCharges.map((c) =>
      c.id === chargeId ? { ...c, status: 'cancelado' as const } : c
    );
    setPixCharges(updated);
    saveFinancialCharges(updated);
    setNotification({ type: 'success', message: 'Cobrança marcada como cancelada.' });
  };

  // Excluir registro financeiro
  const handleDeleteCharge = (chargeId: string) => {
    if (!window.confirm('Deseja excluir este registro do histórico financeiro?')) return;
    const updated = pixCharges.filter((c) => c.id !== chargeId);
    setPixCharges(updated);
    saveFinancialCharges(updated);
    setNotification({ type: 'success', message: 'Registro financeiro removido com sucesso.' });
  };

  // Salvar Configurações do Pix
  const handleSavePixConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('spartan_pix_config', JSON.stringify(pixConfig));

    // 1. Notifica abas/componentes locais imediatamente
    window.dispatchEvent(new CustomEvent('spartan_pix_config_changed', { detail: pixConfig }));

    // 2. Persiste no servidor /api/app-config para sincronização universal com todos os clientes
    try {
      await fetchApi('/api/app-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixConfig }),
      }).catch(() => {});
    } catch {}

    // 3. Persiste no banco Supabase system_settings se acessível
    try {
      await supabase.from('system_settings').upsert({
        key: 'pix_config',
        value: pixConfig as any,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    setPixConfigModalOpen(false);
    setNotification({
      type: 'success',
      message: 'Configurações de Pix atualizadas e propagadas para todos os clientes!',
    });
  };

  // Copiar código Pix Copia e Cola (BR Code Oficial BACEN)
  const [copiedPixKey, setCopiedPixKey] = useState(false);
  const handleCopyPixCode = (hash: string) => {
    const amount = selectedPix?.amount || 59.90;
    const payload = generatePixPayload({
      key: pixConfig.key,
      recipientName: pixConfig.recipientName,
      city: pixConfig.city,
      amount,
      txId: (hash || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25),
    });
    navigator.clipboard.writeText(payload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(pixConfig.key);
    setCopiedPixKey(true);
    setTimeout(() => setCopiedPixKey(false), 2000);
  };

  // Diagnóstico 360°
  const handleRunDiag = () => {
    setDiagRunning(true);
    setTimeout(() => {
      setDiagRunning(false);
      setDiagModalOpen(true);
    }, 600);
  };

  // Conceder Teste Grátis Manualmente
  const handleGrantTrial = async (profile: Profile, days: number = 3) => {
    setActionLoadingId(profile.id);
    try {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + days);
      const newExpiryIso = baseDate.toISOString();
      const nowStamp = new Date().toISOString();
      const preservedPlan =
        profile.plan_name && !profile.plan_name.toLowerCase().startsWith('teste grátis')
          ? profile.plan_name
          : 'SPARTAN PRO';

      await persistProfileToSupabase(profile.id, {
        expires_at: newExpiryIso,
        status: 'ativo',
        is_trial: true,
        trial_used: true,
        plan_name: preservedPlan,
      });

      setProfiles((prev) => {
        const next = prev.map((p) => {
          const isTarget = p.id === profile.id || (p.email && profile.email && p.email.toLowerCase() === profile.email.toLowerCase());
          if (isTarget) {
            return {
              ...p,
              expires_at: newExpiryIso,
              status: 'ativo' as ProfileStatus,
              is_trial: true,
              trial_used: true,
              plan_name: preservedPlan,
              admin_updated_at: nowStamp,
            };
          }
          return p;
        });
        saveProfilesRegistry(next);
        return next;
      });
      setNotification({
        type: 'success',
        message: `Teste grátis de ${days} dias liberado para ${profile.full_name || profile.email}!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao conceder teste';
      setNotification({ type: 'error', message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Salvar Regras de Teste Grátis (Trial) do Sistema
  const handleSaveTrialConfig = async (days: number, enabled: boolean) => {
    setSavingTrialConfig(true);
    try {
      const updated = { days, enabled };
      setTrialConfig(updated);
      localStorage.setItem('spartan_trial_days', String(days));
      localStorage.setItem('spartan_trial_enabled', String(enabled));

      try {
        await supabase.from('system_settings').upsert({
          key: 'trial_config',
          value: { trial_days: days, enabled } as any,
          updated_at: new Date().toISOString(),
        });
      } catch {}

      setNotification({
        type: 'success',
        message: enabled
          ? `Período de Teste Grátis atualizado para ${days} dias com sucesso!`
          : 'Teste Grátis desativado com sucesso! Novos clientes deverão contratar imediatamente.',
      });
    } finally {
      setSavingTrialConfig(false);
    }
  };

  // Abrir Modal de Edição de Conta & Telas
  const handleOpenEditModal = (p: Profile) => {
    let expFormatted = '';
    if (p.expires_at) {
      try {
        expFormatted = new Date(p.expires_at).toISOString().slice(0, 10);
      } catch {
        expFormatted = '';
      }
    }
    setEditingProfile(p);
    setEditFormData({
      fullName: p.full_name || '',
      email: p.email || '',
      plan: p.plan_name || 'SPARTAN PRO',
      screens: p.max_screens || 1,
      status: p.status,
      expiresAt: expFormatted,
      whatsapp: p.whatsapp || '',
      isTrial: !!p.is_trial,
    });
  };

  // Salvar Alterações de Conta & Telas
  const handleSaveEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    setSavingEditProfile(true);
    try {
      let finalExpires = editingProfile.expires_at;
      if (editFormData.expiresAt) {
        finalExpires = new Date(editFormData.expiresAt + 'T23:59:59Z').toISOString();
      }
      // Se o Admin colocou status "ativo", mas a data de expiração estava no passado, estende automaticamente (+30 dias ou +dias de teste)
      if (editFormData.status === 'ativo' && new Date(finalExpires).getTime() <= Date.now()) {
        const dt = new Date();
        dt.setDate(dt.getDate() + (editFormData.isTrial ? trialConfig.days || 3 : 30));
        finalExpires = dt.toISOString();
      }

      const nowStamp = new Date().toISOString();
      const updatedFullName = editFormData.fullName.trim() || undefined;
      const updatedEmail = editFormData.email.trim().toLowerCase() || editingProfile.email;
      const updatedWhatsapp = editFormData.whatsapp.trim() || undefined;

      // 1. Atualiza imediatamente o estado na tela e no localStorage
      setProfiles((prev) => {
        const next = prev.map((item) => {
          const isTarget =
            item.id === editingProfile.id ||
            (item.email && editingProfile.email && item.email.toLowerCase() === editingProfile.email.toLowerCase()) ||
            (item.email && updatedEmail && item.email.toLowerCase() === updatedEmail.toLowerCase());

          if (isTarget) {
            return {
              ...item,
              full_name: updatedFullName,
              email: updatedEmail,
              plan_name: editFormData.plan,
              max_screens: Number(editFormData.screens),
              status: editFormData.status,
              expires_at: finalExpires,
              whatsapp: updatedWhatsapp,
              is_trial: editFormData.isTrial,
              admin_updated_at: nowStamp,
            };
          }
          return item;
        });
        saveProfilesRegistry(next);
        return next;
      });

      // 2. Persiste em segundo plano na nuvem e no Supabase com admin_updated_at
      persistProfileToSupabase(editingProfile.id, {
        full_name: updatedFullName || null,
        email: updatedEmail,
        plan_name: editFormData.plan,
        max_screens: Number(editFormData.screens),
        status: editFormData.status,
        expires_at: finalExpires,
        whatsapp: updatedWhatsapp || null,
        is_trial: editFormData.isTrial,
        admin_updated_at: nowStamp,
      }).catch((e) => console.warn('Erro ao persistir na nuvem:', e));

      setNotification({
        type: 'success',
        message: `Dados de ${updatedFullName || updatedEmail} salvos com sucesso! (${editFormData.plan} • ${editFormData.screens} telas)`,
      });
      setEditingProfile(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar alterações do cliente.';
      setNotification({ type: 'error', message: msg });
    } finally {
      setSavingEditProfile(false);
    }
  };

  // Desbloquear e Confirmar Pagamento Pix (+30 dias), encerrando o modo de teste e liquidando a cobrança Pix
  const handleConfirmPaymentAndUnlock = async (p: Profile) => {
    setActionLoadingId(p.id);
    try {
      const currentExpiry = new Date(p.expires_at);
      const baseDate = currentExpiry > new Date() && !p.is_trial ? currentExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + 30);
      const newExpiryIso = baseDate.toISOString();
      const nowStamp = new Date().toISOString();

      // Mantém o plano escolhido pelo cliente (ou SPARTAN PRO se estava com label genérico de teste)
      const unlockedPlan =
        p.plan_name && !p.plan_name.toLowerCase().startsWith('teste grátis') && p.plan_name !== 'Assinatura Necessária'
          ? p.plan_name
          : 'SPARTAN PRO';

      const foundPlanObj = plans.find((pl) => pl.name.toUpperCase() === unlockedPlan.toUpperCase()) || DEFAULT_PLANS.find((pl) => pl.name.toUpperCase() === unlockedPlan.toUpperCase());
      const planUpper = unlockedPlan.toUpperCase();
      const unlockedScreens = foundPlanObj ? foundPlanObj.screens : (planUpper.includes('BUSINESS') ? 5 : planUpper.includes('PRO') ? 2 : 1);
      const planAmount = foundPlanObj?.monthlyPrice || 59.9;

      await persistProfileToSupabase(p.id, {
        status: 'ativo',
        is_trial: false,
        trial_used: true,
        plan_name: unlockedPlan,
        max_screens: unlockedScreens,
        expires_at: newExpiryIso,
      });

      setProfiles((prev) => {
        const next = prev.map((item) => {
          const isTarget = item.id === p.id || (item.email && p.email && item.email.toLowerCase() === p.email.toLowerCase());
          if (isTarget) {
            return {
              ...item,
              status: 'ativo' as ProfileStatus,
              is_trial: false,
              trial_used: true,
              plan_name: unlockedPlan,
              max_screens: unlockedScreens,
              expires_at: newExpiryIso,
              admin_updated_at: nowStamp,
            };
          }
          return item;
        });
        saveProfilesRegistry(next);
        return next;
      });

      // Liquida cobrança Pix pendente desse cliente ou registra o pagamento liquidado
      setPixCharges((prevCharges) => {
        const hasPending = prevCharges.some(
          (c) => c.customerEmail.toLowerCase() === p.email.toLowerCase() && c.status === 'pendente'
        );
        let updatedCharges: PixCharge[];
        if (hasPending) {
          updatedCharges = prevCharges.map((c) =>
            c.customerEmail.toLowerCase() === p.email.toLowerCase() && c.status === 'pendente'
              ? { ...c, status: 'liquidado' as const, dueDate: new Date().toLocaleDateString('pt-BR') }
              : c
          );
        } else {
          const paidEntry: PixCharge = {
            id: 'pix-' + Date.now(),
            hash: 'PIX-' + Math.random().toString(36).substring(2, 7).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            customerName: p.full_name || p.email.split('@')[0],
            customerEmail: p.email,
            customerWhatsapp: p.whatsapp,
            amount: planAmount,
            method: `Pix (${unlockedPlan})`,
            dueDate: new Date().toLocaleDateString('pt-BR'),
            status: 'liquidado',
            createdAt: new Date().toLocaleString('pt-BR'),
          };
          updatedCharges = [paidEntry, ...prevCharges];
        }
        saveFinancialCharges(updatedCharges);
        return updatedCharges;
      });

      setNotification({
        type: 'success',
        message: `Pagamento confirmado! Acesso de ${p.full_name || p.email} (${unlockedPlan}) desbloqueado por +30 dias!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao desbloquear cliente.';
      setNotification({ type: 'error', message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Confirmar pagamento Pix diretamente pela aba Financeiro & Pix e desbloquear o cliente automaticamente
  const handleConfirmPixCharge = async (charge: PixCharge) => {
    const matchingProfile = profiles.find(
      (p) => p.email.toLowerCase() === charge.customerEmail.toLowerCase()
    );
    if (matchingProfile) {
      await handleConfirmPaymentAndUnlock(matchingProfile);
    } else {
      const updated = pixCharges.map((c) =>
        c.id === charge.id ? { ...c, status: 'liquidado' as const } : c
      );
      setPixCharges(updated);
      saveFinancialCharges(updated);
      setNotification({
        type: 'success',
        message: `Pagamento Pix de ${charge.customerName} (${charge.customerEmail}) confirmado e liquidado!`,
      });
    }
  };

  // Métricas Dinâmicas do Painel Admin (atualizadas conforme cadastros, planos escolhidos, período de teste e pagamentos)
  const dashboardStats = useMemo(() => {
    const now = Date.now();
    const activeClients = profiles.filter(
      (p) => p.status === 'ativo' && new Date(p.expires_at).getTime() > now
    );
    const paidActiveClients = activeClients.filter(
      (p) => !p.is_trial && !p.plan_name?.toLowerCase().includes('teste')
    );
    const trialActiveClients = activeClients.filter(
      (p) => p.is_trial || p.plan_name?.toLowerCase().includes('teste')
    );
    const expiredOrBlockedClients = profiles.filter(
      (p) => p.status === 'vencido' || (p.role !== 'admin' && new Date(p.expires_at).getTime() <= now)
    );
    const suspendedClients = profiles.filter((p) => p.status === 'suspenso');

    const getPlanPrice = (planName?: string) => {
      const upper = (planName || '').toUpperCase();
      const matched = plans.find((pl) => upper.includes(pl.name.toUpperCase()));
      if (matched) return matched.monthlyPrice;
      if (upper.includes('BUSINESS')) return 119.9;
      if (upper.includes('START')) return 29.9;
      return 59.9;
    };

    const estimatedMrr = activeClients.reduce((acc, p) => acc + getPlanPrice(p.plan_name), 0);
    const totalLiquidado = pixCharges
      .filter((c) => c.status === 'liquidado')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const totalPendente = pixCharges
      .filter((c) => c.status === 'pendente')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);

    const proCount = profiles.filter((p) => (p.plan_name || '').toUpperCase().includes('PRO')).length;
    const businessCount = profiles.filter(
      (p) => (p.plan_name || '').toUpperCase().includes('BUSINESS') || p.role === 'admin'
    ).length;
    const startCount = profiles.filter((p) => (p.plan_name || '').toUpperCase().includes('START')).length;
    const totalForDist = Math.max(1, proCount + businessCount + startCount);

    const proPct = Math.round((proCount / totalForDist) * 100);
    const businessPct = Math.round((businessCount / totalForDist) * 100);
    const startPct = Math.max(0, 100 - proPct - businessPct);

    // Métricas em tempo real de Web vs APK / TV Box
    const ONLINE_THRESHOLD_MS = 120000; // 2 minutos
    let onlineClientsCount = 0;
    let onlineScreensCount = 0;
    let apkClientsCount = 0;
    let webClientsCount = 0;

    for (const p of profiles) {
      const devices = Array.isArray(p.active_devices) ? p.active_devices : [];
      const liveDevices = devices.filter((d) => now - (d.lastPing || 0) < ONLINE_THRESHOLD_MS);
      if (liveDevices.length > 0) {
        onlineClientsCount += 1;
        onlineScreensCount += liveDevices.length;
      }

      const hasApkDevice =
        p.last_platform === 'apk' ||
        p.last_platform === 'tvbox' ||
        devices.some(
          (d) =>
            d.platform === 'apk' ||
            d.platform === 'tvbox' ||
            /tv box|apk|android/i.test(d.deviceName || '')
        );
      const hasWebDevice =
        p.last_platform === 'web' ||
        p.last_platform === 'mobile-web' ||
        devices.some(
          (d) =>
            d.platform === 'web' ||
            d.platform === 'mobile-web' ||
            /web|windows|mac|linux/i.test(d.deviceName || '')
        );

      if (hasApkDevice) apkClientsCount += 1;
      if (hasWebDevice || (!hasApkDevice && devices.length === 0)) webClientsCount += 1;
    }

    return {
      totalClients: profiles.length,
      activeCount: activeClients.length,
      paidActiveCount: paidActiveClients.length,
      trialActiveCount: trialActiveClients.length,
      expiredCount: expiredOrBlockedClients.length,
      suspendedCount: suspendedClients.length,
      estimatedMrr,
      totalLiquidado,
      totalPendente,
      proCount,
      businessCount,
      startCount,
      proPct,
      businessPct,
      startPct,
      onlineClientsCount,
      onlineScreensCount,
      apkClientsCount,
      webClientsCount,
      getPlanPrice,
    };
  }, [profiles, pixCharges, plans]);

  // Cálculos Avançados do Módulo Financeiro (Dia, Mês, Ano e Métodos de Pagamento)
  const financialStats = useMemo(() => {
    const now = new Date();

    const parseChargeDate = (c: PixCharge): Date => {
      const raw = c.createdAt || c.dueDate || '';
      if (!raw) return new Date();
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(raw)) {
        const [datePart, timePart] = raw.split(/[\s,]+/);
        const [d, m, y] = datePart.split('/').map(Number);
        const [hh, mm] = (timePart || '00:00').split(':').map(Number);
        return new Date(y, m - 1, d, hh || 0, mm || 0);
      }
      const parsed = new Date(raw);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    const getMethodKey = (methodStr?: string): 'pix' | 'cartao' | 'boleto' | 'outro' => {
      const lower = (methodStr || '').toLowerCase();
      if (lower.includes('pix')) return 'pix';
      if (
        lower.includes('cart') ||
        lower.includes('créd') ||
        lower.includes('cred') ||
        lower.includes('déb') ||
        lower.includes('deb') ||
        lower.includes('card')
      )
        return 'cartao';
      if (lower.includes('bolet')) return 'boleto';
      return 'outro';
    };

    const isToday = (d: Date) =>
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const isThisMonth = (d: Date) =>
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();

    const isThisYear = (d: Date) => d.getFullYear() === now.getFullYear();

    // 1. Métricas do DIA (Hoje)
    const todayCharges = pixCharges.filter((c) => isToday(parseChargeDate(c)));
    const todayLiquidado = todayCharges
      .filter((c) => c.status === 'liquidado')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const todayCountLiquidado = todayCharges.filter((c) => c.status === 'liquidado').length;
    const todayPendente = todayCharges
      .filter((c) => c.status === 'pendente')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const todayCountPendente = todayCharges.filter((c) => c.status === 'pendente').length;

    // 2. Métricas do MÊS (Mês Atual)
    const monthCharges = pixCharges.filter((c) => isThisMonth(parseChargeDate(c)));
    const monthLiquidado = monthCharges
      .filter((c) => c.status === 'liquidado')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const monthCountLiquidado = monthCharges.filter((c) => c.status === 'liquidado').length;
    const monthPendente = monthCharges
      .filter((c) => c.status === 'pendente')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const monthCountPendente = monthCharges.filter((c) => c.status === 'pendente').length;

    // 3. Métricas do ANO (Ano Atual)
    const yearCharges = pixCharges.filter((c) => isThisYear(parseChargeDate(c)));
    const yearLiquidado = yearCharges
      .filter((c) => c.status === 'liquidado')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const yearCountLiquidado = yearCharges.filter((c) => c.status === 'liquidado').length;
    const yearPendente = yearCharges
      .filter((c) => c.status === 'pendente')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const yearCountPendente = yearCharges.filter((c) => c.status === 'pendente').length;

    // 4. Métricas Totais Históricas
    const allLiquidado = pixCharges
      .filter((c) => c.status === 'liquidado')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const allCountLiquidado = pixCharges.filter((c) => c.status === 'liquidado').length;
    const allPendente = pixCharges
      .filter((c) => c.status === 'pendente')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const allCountPendente = pixCharges.filter((c) => c.status === 'pendente').length;

    // 5. Métricas do Período Selecionado no Filtro (Hoje, Mês, Ano ou Todos)
    let selectedPeriodCharges = pixCharges;
    if (financePeriod === 'today') {
      selectedPeriodCharges = todayCharges;
    } else if (financePeriod === 'month') {
      selectedPeriodCharges = monthCharges;
    } else if (financePeriod === 'year') {
      selectedPeriodCharges = yearCharges;
    }

    const periodLiquidado = selectedPeriodCharges
      .filter((c) => c.status === 'liquidado')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const periodCountLiquidado = selectedPeriodCharges.filter((c) => c.status === 'liquidado').length;
    const periodPendente = selectedPeriodCharges
      .filter((c) => c.status === 'pendente')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const periodCountPendente = selectedPeriodCharges.filter((c) => c.status === 'pendente').length;
    const periodTicketMedio =
      periodCountLiquidado > 0 ? periodLiquidado / periodCountLiquidado : 0;
    const periodTaxaConversao =
      selectedPeriodCharges.length > 0
        ? Math.round((periodCountLiquidado / selectedPeriodCharges.length) * 100)
        : 0;

    // 6. Faturamento por Tipo de Pagamento no Período Selecionado
    const periodLiquidadoCharges = selectedPeriodCharges.filter((c) => c.status === 'liquidado');
    const pixChargesList = periodLiquidadoCharges.filter((c) => getMethodKey(c.method) === 'pix');
    const cartaoChargesList = periodLiquidadoCharges.filter((c) => getMethodKey(c.method) === 'cartao');
    const boletoChargesList = periodLiquidadoCharges.filter((c) => getMethodKey(c.method) === 'boleto');
    const outroChargesList = periodLiquidadoCharges.filter((c) => getMethodKey(c.method) === 'outro');

    const pixTotal = pixChargesList.reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const cartaoTotal = cartaoChargesList.reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const boletoTotal = boletoChargesList.reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const outroTotal = outroChargesList.reduce((acc, c) => acc + Number(c.amount || 0), 0);

    const baseForPct = Math.max(1, periodLiquidado);
    const pixPct = Math.round((pixTotal / baseForPct) * 100);
    const cartaoPct = Math.round((cartaoTotal / baseForPct) * 100);
    const boletoPct = Math.round((boletoTotal / baseForPct) * 100);
    const outroPct = Math.max(0, 100 - pixPct - cartaoPct - boletoPct);

    // 7. Lista Filtrada para a Tabela Financeira
    const filteredCharges = selectedPeriodCharges.filter((c) => {
      // Filtro de Método
      if (financeMethodFilter !== 'all' && getMethodKey(c.method) !== financeMethodFilter) {
        return false;
      }
      // Filtro de Status
      if (financeStatusFilter !== 'all' && c.status !== financeStatusFilter) {
        return false;
      }
      // Busca por texto
      if (financeSearch.trim()) {
        const query = financeSearch.toLowerCase().trim();
        const nameMatch = (c.customerName || '').toLowerCase().includes(query);
        const emailMatch = (c.customerEmail || '').toLowerCase().includes(query);
        const hashMatch = (c.hash || '').toLowerCase().includes(query);
        const methodMatch = (c.method || '').toLowerCase().includes(query);
        if (!nameMatch && !emailMatch && !hashMatch && !methodMatch) {
          return false;
        }
      }
      return true;
    });

    return {
      todayLiquidado,
      todayCountLiquidado,
      todayPendente,
      todayCountPendente,
      monthLiquidado,
      monthCountLiquidado,
      monthPendente,
      monthCountPendente,
      yearLiquidado,
      yearCountLiquidado,
      yearPendente,
      yearCountPendente,
      allLiquidado,
      allCountLiquidado,
      allPendente,
      allCountPendente,
      periodLiquidado,
      periodCountLiquidado,
      periodPendente,
      periodCountPendente,
      periodTicketMedio,
      periodTaxaConversao,
      pixTotal,
      pixCount: pixChargesList.length,
      pixPct,
      cartaoTotal,
      cartaoCount: cartaoChargesList.length,
      cartaoPct,
      boletoTotal,
      boletoCount: boletoChargesList.length,
      boletoPct,
      outroTotal,
      outroCount: outroChargesList.length,
      outroPct,
      filteredCharges,
      getMethodKey,
    };
  }, [pixCharges, financePeriod, financeMethodFilter, financeStatusFilter, financeSearch]);

  // Clientes filtrados
  const filteredProfiles = useMemo(() => {
    const now = Date.now();
    const ONLINE_THRESHOLD_MS = 120000;
    return profiles.filter((p) => {
      const isExp = p.role !== 'admin' && new Date(p.expires_at).getTime() <= now;
      const effectiveStatus: ProfileStatus = isExp && p.status === 'ativo' ? 'vencido' : p.status;
      const isTrialUser = Boolean(p.is_trial || p.plan_name?.toLowerCase().includes('teste'));
      const devices = Array.isArray(p.active_devices) ? p.active_devices : [];
      const liveDevices = devices.filter((d) => now - (d.lastPing || 0) < ONLINE_THRESHOLD_MS);

      const hasApk =
        p.last_platform === 'apk' ||
        p.last_platform === 'tvbox' ||
        devices.some(
          (d) =>
            d.platform === 'apk' ||
            d.platform === 'tvbox' ||
            /tv box|apk|android/i.test(d.deviceName || '')
        );
      const hasWeb =
        p.last_platform === 'web' ||
        p.last_platform === 'mobile-web' ||
        devices.some(
          (d) =>
            d.platform === 'web' ||
            d.platform === 'mobile-web' ||
            /web|windows|mac|linux/i.test(d.deviceName || '')
        );

      const q = searchTerm.toLowerCase();
      const matchSearch =
        p.email.toLowerCase().includes(q) ||
        (p.full_name && p.full_name.toLowerCase().includes(q)) ||
        p.plan_name.toLowerCase().includes(q) ||
        (p.whatsapp && p.whatsapp.includes(searchTerm)) ||
        (p.last_ip && p.last_ip.toLowerCase().includes(q)) ||
        devices.some(
          (d) =>
            (d.deviceName && d.deviceName.toLowerCase().includes(q)) ||
            (d.deviceId && d.deviceId.toLowerCase().includes(q)) ||
            (d.ip && d.ip.toLowerCase().includes(q))
        );

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'trial'
          ? isTrialUser && effectiveStatus === 'ativo'
          : statusFilter === 'ativo'
          ? effectiveStatus === 'ativo' && !isTrialUser
          : effectiveStatus === statusFilter;

      const matchPlatform =
        platformFilter === 'all'
          ? true
          : platformFilter === 'online'
          ? liveDevices.length > 0
          : platformFilter === 'apk'
          ? hasApk
          : hasWeb || (!hasApk && devices.length === 0);

      return matchSearch && matchStatus && matchPlatform;
    });
  }, [profiles, searchTerm, statusFilter, platformFilter]);

  // Login de fallback para Admin
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const { error } = await signInWithEmail('gleisson1984@gmail.com', adminPassword);
      if (error) {
        setLoginError(error.message || 'Credenciais inválidas para o administrador.');
      } else {
        loadProfiles();
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Renderizador se não for admin logado
  if (!authLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#09090e] text-white flex flex-col justify-center items-center p-4">
        <SEO title="Acesso Master - Cine Spartan" description="Painel Administrativo Restrito" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#13131c] border border-purple-900/40 rounded-2xl p-8 shadow-2xl shadow-purple-950/40 relative"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto flex items-center justify-center mb-6 shadow-lg shadow-purple-600/30">
            <FaLock className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-black text-center text-white mb-2">Painel Master Spartan</h1>
          <p className="text-sm text-gray-400 text-center mb-6">
            Acesso exclusivo para <span className="text-purple-400 font-semibold">gleisson1984@gmail.com</span>
          </p>

          {loginError && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
              <FaExclamationTriangle className="text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">E-mail Master</label>
              <input
                type="text"
                value="gleisson1984@gmail.com"
                disabled
                className="w-full px-4 py-2.5 bg-black/40 border border-gray-800 rounded-xl text-gray-400 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Senha de Acesso</label>
              <input
                type="password"
                placeholder="Digite sua senha..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-black/60 border border-purple-900/40 focus:border-purple-500 rounded-xl text-white text-sm outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/25 transition disabled:opacity-50"
            >
              {isLoggingIn ? 'Autenticando...' : 'Entrar no Painel Master'}
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 text-center text-xs text-gray-500 hover:text-gray-300 transition"
          >
            ← Voltar para o Catálogo
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080d] text-gray-100 flex flex-col font-sans">
      <SEO title="Painel Admin - Cine Spartan SaaS" description="Gestão Master SaaS, Assinantes e Finanças" />

      {/* Notificação Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-600/80 text-emerald-200'
                : 'bg-red-950/90 border-red-600/80 text-red-200'
            }`}
          >
            {notification.type === 'success' ? <FaCheckCircle className="text-emerald-400" /> : <FaExclamationTriangle className="text-red-400" />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER MASTER DO PAINEL */}
      <header className="bg-[#101018] border-b border-purple-900/30 sticky top-0 z-40 backdrop-blur-md">
        <div className="w-full max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-400 hover:text-white bg-black/40 hover:bg-black/60 rounded-xl transition"
              title="Voltar ao catálogo"
            >
              <FaArrowLeft />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-600/30">
                <FaShieldAlt className="text-white text-lg" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black text-white tracking-wide">CINE SPARTAN</h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Master SaaS
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  gleisson1984@gmail.com • Painel Administrativo
                </p>
              </div>
            </div>
          </div>

          {/* Abas Principais de Navegação */}
          <nav className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-gray-800 overflow-x-auto max-w-full scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaChartLine />
              <span>Visão Geral</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaUsers />
              <span>Clientes & Assinantes</span>
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'finance'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaMoneyBillWave />
              <span>Financeiro & Gestão</span>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'plans'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaSlidersH />
              <span>Planos & Preços</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaShieldAlt />
              <span>Trava APK & Segurança</span>
            </button>
          </nav>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL DAS ABAS */}
      <main className="w-full max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {/* =========================================================================
            1. ABA: VISÃO GERAL (MRR SAAS)
           ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Cards de Métricas Principais conforme especificação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: MRR Estimado */}
              <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-600/50 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">MRR Estimado</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <FaChartLine />
                  </div>
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  R$ {dashboardStats.estimatedMrr.toFixed(2).replace('.', ',')}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    ↑ {dashboardStats.activeCount} assinaturas em vigor
                  </span>
                  <button
                    onClick={() => setChurnModalOpen(true)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-medium underline underline-offset-2"
                  >
                    Calcular churn
                  </button>
                </div>
              </div>

              {/* Card 2: Inadimplência / Bloqueados */}
              <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-600/50 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Testes / Vencidos</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <FaCheckCircle />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-400 tracking-tight">
                  {dashboardStats.trialActiveCount} em Teste • {dashboardStats.expiredCount} Bloq.
                </div>
                <p className="text-[11px] text-gray-400 mt-3">
                  Bloqueio automático após fim do período de teste
                </p>
              </div>

              {/* Card 3: Caixa Recuperado (PIX) */}
              <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-600/50 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Caixa Liquidado (PIX)</span>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <FaBolt />
                  </div>
                </div>
                <div className="text-2xl font-black text-cyan-300 tracking-tight">
                  R$ {dashboardStats.totalLiquidado.toFixed(2).replace('.', ',')}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
                  <span>A receber: R$ {dashboardStats.totalPendente.toFixed(2).replace('.', ',')}</span>
                  <span className="text-cyan-400 font-bold">Pix Direto</span>
                </div>
              </div>

              {/* Card 4: Total de Clientes */}
              <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-600/50 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total de Clientes</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <FaUsers />
                  </div>
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {dashboardStats.totalClients} Clientes
                </div>
                <p className="text-[11px] text-emerald-400 mt-3 font-semibold">
                  {dashboardStats.activeCount} ativos ({dashboardStats.trialActiveCount} em período de teste)
                </p>
              </div>
            </div>

            {/* Bloco Destaque: Girar Diagnóstico 360° */}
            <div className="bg-gradient-to-r from-purple-950/60 via-[#151524] to-indigo-950/60 border border-purple-800/40 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Scanner Operacional
                  </span>
                  <h3 className="text-lg font-bold text-white">Diagnóstico e Relatórios 360°</h3>
                </div>
                <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                  Analise instantaneamente o CAC, LTV projetado, margem operacional de lucro e saúde da infraestrutura de streaming Cine Spartan.
                </p>
              </div>
              <button
                onClick={handleRunDiag}
                disabled={diagRunning}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/30 transition shrink-0 flex items-center gap-2"
              >
                <FaSyncAlt className={diagRunning ? 'animate-spin' : ''} />
                <span>{diagRunning ? 'Analisando...' : 'Girar Diagnóstico 360°'}</span>
              </button>
            </div>

            {/* Gráficos Analíticos: Área/Onda e Rosca/Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico de Área/Onda: Evolução do Faturamento Recorrente */}
              <div className="lg:col-span-2 bg-[#12121c] border border-purple-900/30 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Evolução do Faturamento Recorrente (MRR)</h3>
                    <p className="text-xs text-gray-400">Crescimento contínuo nos últimos meses</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Meta: R$ 1.000 / mês
                  </span>
                </div>

                {/* SVG Area / Wave Chart */}
                <div className="w-full h-64 relative mt-4">
                  <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9333ea" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="50%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>

                    {/* Linhas de Grade Horizontais */}
                    <line x1="0" y1="40" x2="500" y2="40" stroke="#252538" strokeDasharray="3 3" />
                    <line x1="0" y1="90" x2="500" y2="90" stroke="#252538" strokeDasharray="3 3" />
                    <line x1="0" y1="140" x2="500" y2="140" stroke="#252538" strokeDasharray="3 3" />

                    {/* Área Preenchida com Gradiente */}
                    <path
                      d="M 10 160 Q 90 150, 160 120 T 310 90 T 420 50 L 490 35 L 490 190 L 10 190 Z"
                      fill="url(#areaGradient)"
                    />

                    {/* Linha Curva Suave (Onda) */}
                    <path
                      d="M 10 160 Q 90 150, 160 120 T 310 90 T 420 50 L 490 35"
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Pontos de Destaque */}
                    <circle cx="10" cy="160" r="4.5" fill="#a855f7" className="animate-pulse" />
                    <circle cx="160" cy="120" r="4.5" fill="#818cf8" />
                    <circle cx="310" cy="90" r="4.5" fill="#6366f1" />
                    <circle cx="420" cy="50" r="4.5" fill="#34d399" />
                    <circle cx="490" cy="35" r="5.5" fill="#10b981" />
                  </svg>

                  {/* Legenda dos Meses no Eixo X */}
                  <div className="flex justify-between text-[11px] text-gray-400 mt-2 px-2">
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Ago</span>
                    <span>Set</span>
                    <span>Out</span>
                    <span className="font-bold text-emerald-400">Nov (R$ 621,44)</span>
                  </div>
                </div>
              </div>

              {/* Gráfico de Rosca (Donut): Distribuição por Planos */}
              <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Distribuição por Planos</h3>
                  <p className="text-xs text-gray-400 mb-4">SPARTAN PRO e SPARTAN BUSINESS</p>
                </div>

                {/* SVG Donut Chart */}
                <div className="relative w-44 h-44 mx-auto my-2">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* Círculo de Fundo */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1f1f2e" strokeWidth="16" />
                    {/* Spartan Business (35%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#8b5cf6"
                      strokeWidth="16"
                      strokeDasharray="83.5 238.7"
                      strokeDashoffset="0"
                    />
                    {/* Spartan Pro (50%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="16"
                      strokeDasharray="119.3 238.7"
                      strokeDashoffset="-83.5"
                    />
                    {/* Spartan Start (15%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#06b6d4"
                      strokeWidth="16"
                      strokeDasharray="35.8 238.7"
                      strokeDashoffset="-202.8"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-gray-400 font-medium">Ativos</span>
                    <span className="text-xl font-black text-white">100%</span>
                  </div>
                </div>

                {/* Legendas dos Planos */}
                <div className="space-y-2 mt-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-gray-300">SPARTAN PRO</span>
                    </div>
                    <span className="font-bold text-white">{dashboardStats.proPct}% ({dashboardStats.proCount})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-gray-300">SPARTAN BUSINESS</span>
                    </div>
                    <span className="font-bold text-white">{dashboardStats.businessPct}% ({dashboardStats.businessCount})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500" />
                      <span className="text-gray-300">SPARTAN START</span>
                    </div>
                    <span className="font-bold text-white">{dashboardStats.startPct}% ({dashboardStats.startCount})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            2. ABA: GESTÃO DE CLIENTES & ASSINANTES (/admin/users)
           ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Cabeçalho da Seção com Ações */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Gestão de Clientes & Assinantes</h2>
                <p className="text-xs text-gray-400">
                  Gerenciamento de acessos, telas simultâneas e vigência das assinaturas
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setActiveTab('plans')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    trialConfig.enabled
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                      : 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
                  }`}
                  title="Clique para alterar a duração do teste grátis"
                >
                  <FaBolt className={trialConfig.enabled ? 'text-amber-400' : 'text-gray-500'} />
                  <span>Trial: {trialConfig.enabled ? `${trialConfig.days} dias` : 'Desativado'}</span>
                  <span className="text-[10px] text-gray-400 font-normal underline ml-0.5">Ajustar</span>
                </button>
                <button
                  onClick={() => setTrialsModalOpen(true)}
                  className="px-3.5 py-2 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-600/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                  title="Ver clientes que já usaram o teste grátis e estão bloqueados"
                >
                  <FaShieldAlt className="text-amber-400" />
                  <span>Anti-Fraude ({usedTrials.length})</span>
                </button>
                <button
                  onClick={handleExportCsv}
                  className="px-3.5 py-2 bg-[#1c1c2b] hover:bg-[#252538] border border-gray-700 text-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                >
                  <FaFileCsv className="text-emerald-400" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  onClick={handleOpenNewUserModal}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/25 transition"
                >
                  <FaPlus />
                  <span>+ Novo Cliente</span>
                </button>
              </div>
            </div>

            {/* Painel de Telemetria em Tempo Real (Web vs APK / TV Box) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div
                onClick={() => setPlatformFilter(platformFilter === 'online' ? 'all' : 'online')}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  platformFilter === 'online'
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-900/20'
                    : 'bg-[#12121c] border-emerald-500/20 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Online Agora
                  </span>
                  <FaTv className="text-emerald-400 text-sm" />
                </div>
                <div className="text-2xl font-black text-white">
                  {dashboardStats.onlineScreensCount}{' '}
                  <span className="text-xs font-semibold text-gray-400">
                    {dashboardStats.onlineScreensCount === 1 ? 'tela' : 'telas'} ({dashboardStats.onlineClientsCount} clientes)
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Clique para filtrar quem está assistindo agora</p>
              </div>

              <div
                onClick={() => setPlatformFilter(platformFilter === 'apk' ? 'all' : 'apk')}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  platformFilter === 'apk'
                    ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-900/20'
                    : 'bg-[#12121c] border-purple-500/20 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                    Clientes APK / TV Box
                  </span>
                  <FaMobileAlt className="text-purple-400 text-sm" />
                </div>
                <div className="text-2xl font-black text-white">
                  {dashboardStats.apkClientsCount}{' '}
                  <span className="text-xs font-semibold text-gray-400">contas</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Status APK:{' '}
                  <strong className={securityConfig?.apkAccessEnabled !== false ? 'text-emerald-400' : 'text-red-400'}>
                    {securityConfig?.apkAccessEnabled !== false ? 'Liberado' : 'Bloqueado'}
                  </strong>
                </p>
              </div>

              <div
                onClick={() => setPlatformFilter(platformFilter === 'web' ? 'all' : 'web')}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  platformFilter === 'web'
                    ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-900/20'
                    : 'bg-[#12121c] border-blue-500/20 hover:border-blue-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                    Clientes Navegador Web
                  </span>
                  <FaGlobe className="text-blue-400 text-sm" />
                </div>
                <div className="text-2xl font-black text-white">
                  {dashboardStats.webClientsCount}{' '}
                  <span className="text-xs font-semibold text-gray-400">contas</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Status Web:{' '}
                  <strong className={securityConfig?.webAccessEnabled !== false ? 'text-emerald-400' : 'text-red-400'}>
                    {securityConfig?.webAccessEnabled !== false ? 'Liberado' : 'Bloqueado (Só APK)'}
                  </strong>
                </p>
              </div>

              <div
                onClick={() => setActiveTab('security')}
                className="p-4 rounded-2xl border bg-[#12121c] border-red-500/25 hover:border-red-500/50 cursor-pointer transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
                    Controle Geral Web & APK
                  </span>
                  <FaShieldAlt className="text-red-400 text-sm" />
                </div>
                <div className="flex items-center gap-2 my-1">
                  <span className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-[10px] font-bold text-red-300">
                    {(securityConfig?.blockedDevices || []).length} Aparelhos Banidos
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-[10px] font-bold text-purple-300">
                    {(securityConfig?.blockedIps || []).length} IPs
                  </span>
                </div>
                <p className="text-[10px] text-purple-300 underline font-semibold">
                  Configurar travas Web/APK e aviso global →
                </p>
              </div>
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Abas por Estado */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {(
                    [
                      { key: 'all', label: 'Todos', count: dashboardStats.totalClients },
                      { key: 'ativo', label: 'Ativos (Pagos)', count: dashboardStats.paidActiveCount },
                      { key: 'trial', label: '⚡ Em Teste', count: dashboardStats.trialActiveCount },
                      { key: 'vencido', label: 'Vencidos / Bloqueados', count: dashboardStats.expiredCount },
                      { key: 'suspenso', label: 'Suspensos', count: dashboardStats.suspendedCount },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.key}
                      onClick={() => setStatusFilter(st.key as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        statusFilter === st.key
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {st.label}
                      <span className="ml-1.5 text-[10px] opacity-70">({st.count})</span>
                    </button>
                  ))}
                </div>

                {/* Input de Busca */}
                <div className="relative min-w-[260px]">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, e-mail, IP ou aparelho..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-black/50 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none transition"
                  />
                </div>
              </div>

              {/* Filtro por Plataforma (Web vs APK / TV Box) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-800/70">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mr-1">
                    Plataforma:
                  </span>
                  {(
                    [
                      { key: 'all', label: 'Todas as Plataformas', count: dashboardStats.totalClients },
                      { key: 'online', label: '🟢 Online Agora', count: dashboardStats.onlineClientsCount },
                      { key: 'apk', label: '📱 APK / TV Box', count: dashboardStats.apkClientsCount },
                      { key: 'web', label: '🌐 Navegador Web / PC', count: dashboardStats.webClientsCount },
                    ] as const
                  ).map((pf) => (
                    <button
                      key={pf.key}
                      onClick={() => setPlatformFilter(pf.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                        platformFilter === pf.key
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-black/40 text-gray-400 hover:text-white border border-gray-800'
                      }`}
                    >
                      {pf.label} ({pf.count})
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-bold text-emerald-400 select-none shadow-sm"
                    title="O painel sincroniza novos cadastros, status de pagamento e aparelhos conectados a cada 4 segundos automaticamente."
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Ao Vivo (Auto 4s)</span>
                  </div>

                  <button
                    onClick={() => loadProfiles()}
                    className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition"
                    title="Forçar recarga completa agora"
                  >
                    <FaSyncAlt className={loading ? 'animate-spin' : ''} />
                    <span>Recarregar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabela de Usuários Detalhada */}
            <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181826] text-gray-400 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="py-3.5 px-4">Cliente / E-mail</th>
                      <th className="py-3.5 px-4">WhatsApp (Envio Pix)</th>
                      <th className="py-3.5 px-4">Plano Contratado</th>
                      <th className="py-3.5 px-4">Telas / Máquinas</th>
                      <th className="py-3.5 px-4">Status de Vigência</th>
                      <th className="py-3.5 px-4">Data de Expiração</th>
                      <th className="py-3.5 px-4 text-right">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {filteredProfiles.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          Nenhum cliente encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredProfiles.map((p) => {
                        const isExpired = p.role !== 'admin' && new Date(p.expires_at).getTime() <= Date.now();
                        const daysLeft = Math.ceil(
                          (new Date(p.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        );
                        const isActionBusy = actionLoadingId === p.id;
                        const cleanPhone = p.whatsapp ? p.whatsapp.replace(/\D/g, '') : '';
                        const planPriceFormatted = dashboardStats.getPlanPrice(p.plan_name).toFixed(2).replace('.', ',');

                        return (
                          <tr key={p.id} className="hover:bg-white/[0.02] transition">
                            {/* Cliente / E-mail */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                                  {(p.full_name || p.email).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  {p.full_name && (
                                    <div className="font-bold text-white text-xs leading-tight">{p.full_name}</div>
                                  )}
                                  <div className="font-semibold text-gray-200 flex items-center gap-1.5">
                                    <span>{p.email}</span>
                                    {p.role === 'admin' && (
                                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-gray-500 font-mono">ID: {p.id.slice(0, 8)}...</span>
                                </div>
                              </div>
                            </td>

                            {/* WhatsApp (Envio Pix) */}
                            <td className="py-3.5 px-4">
                              {cleanPhone ? (
                                <a
                                  href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                                    `Olá ${p.full_name || ''}! Mensagem Cine Spartan para a conta ${p.email}:\n\n${pixConfig.customMessage}\n\n🔑 Chave Pix (${pixConfig.keyType}): ${pixConfig.key}\n👤 Titular: ${pixConfig.recipientName}\n💰 Valor: R$ ${planPriceFormatted} (Plano ${p.plan_name})\n\nAssim que realizar o pagamento, responda com o comprovante aqui para liberação imediata!`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold transition group"
                                  title="Clique para abrir WhatsApp e enviar dados do Pix"
                                >
                                  <FaWhatsapp className="text-sm text-emerald-400 group-hover:scale-110 transition" />
                                  <span>{p.whatsapp || cleanPhone}</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-gray-500 italic">Sem WhatsApp</span>
                              )}
                            </td>

                            {/* Plano */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col items-start gap-1">
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                  {p.plan_name || 'SPARTAN PRO'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-semibold">
                                  R$ {planPriceFormatted}/mês
                                </span>
                              </div>
                            </td>

                            {/* Telas / Máquinas (Web & APK em Tempo Real) */}
                            <td className="py-3.5 px-4">
                              {(() => {
                                const devices = Array.isArray(p.active_devices) ? p.active_devices : [];
                                const liveDevices = devices.filter(
                                  (d) => Date.now() - (d.lastPing || 0) < 120000
                                );
                                const hasApk =
                                  p.last_platform === 'apk' ||
                                  p.last_platform === 'tvbox' ||
                                  devices.some(
                                    (d) =>
                                      d.platform === 'apk' ||
                                      d.platform === 'tvbox' ||
                                      /tv box|apk|android/i.test(d.deviceName || '')
                                  );
                                const hasWeb =
                                  p.last_platform === 'web' ||
                                  p.last_platform === 'mobile-web' ||
                                  devices.some(
                                    (d) =>
                                      d.platform === 'web' ||
                                      d.platform === 'mobile-web' ||
                                      /web|windows|mac|linux/i.test(d.deviceName || '')
                                  );

                                return (
                                  <div className="flex flex-col items-start gap-1.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => setDevicesModalProfile(p)}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                          liveDevices.length > 0
                                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                                            : 'bg-gray-800/70 text-gray-300 border-gray-700 hover:bg-gray-800'
                                        }`}
                                        title="Clique para inspecionar e controlar os aparelhos Web e APK deste cliente"
                                      >
                                        {liveDevices.length > 0 ? (
                                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                        ) : (
                                          <FaTv className="text-gray-400 text-[10px]" />
                                        )}
                                        <span>
                                          {liveDevices.length}/{p.max_screens || 1}{' '}
                                          {p.max_screens > 1 ? 'Telas' : 'Tela'}
                                        </span>
                                        {devices.length > 0 && (
                                          <span className="text-[9px] text-purple-300 underline ml-0.5">
                                            ({devices.length} reg.)
                                          </span>
                                        )}
                                      </button>

                                      {devices.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => handleDisconnectDevices(p)}
                                          disabled={isActionBusy}
                                          title="Derrubar todas as telas / aparelhos conectados agora"
                                          className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-[10px] transition cursor-pointer"
                                        >
                                          <FaPowerOff />
                                        </button>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1 flex-wrap">
                                      {hasApk && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-[9px] font-bold text-purple-300">
                                          <FaMobileAlt className="text-[8px]" /> APK / TV Box
                                        </span>
                                      )}
                                      {(hasWeb || (!hasApk && devices.length === 0)) && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-[9px] font-bold text-blue-300">
                                          <FaGlobe className="text-[8px]" /> Web
                                        </span>
                                      )}
                                      {(p.last_ip || devices[0]?.ip) && (
                                        <span className="px-1.5 py-0.5 rounded bg-black/50 border border-gray-800 text-[9px] font-mono text-gray-400">
                                          IP: {p.last_ip || devices[0]?.ip}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Status de Vigência */}
                            <td className="py-3.5 px-4">
                              {p.status === 'suspenso' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  <FaBan className="text-[9px]" /> Suspenso (Bloqueado)
                                </span>
                              ) : p.is_trial || p.plan_name?.toLowerCase().includes('teste') ? (
                                !isExpired && p.status === 'ativo' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    <FaBolt className="text-[9px] text-amber-400" />
                                    Em Teste ({daysLeft > 0 ? `${daysLeft}d restantes` : 'Último dia'})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/15 text-red-400 border border-red-500/30" title="Teste finalizado - Usuário bloqueado automaticamente aguardando pagamento">
                                    <FaLock className="text-[9px]" /> Teste Expirado (Bloqueado)
                                  </span>
                                )
                              ) : p.status === 'ativo' && !isExpired ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Ativo ({daysLeft}d restantes)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                                  <FaLock className="text-[9px]" /> Bloqueado / Vencido
                                </span>
                              )}
                            </td>

                            {/* Data de Expiração */}
                            <td className="py-3.5 px-4 text-gray-300 font-mono text-[11px]">
                              {new Date(p.expires_at).toLocaleDateString('pt-BR')}
                            </td>

                            {/* Ações Rápidas por Linha */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Botão Conceder Teste Grátis */}
                                <button
                                  onClick={() => handleGrantTrial(p, trialConfig.days || 3)}
                                  disabled={isActionBusy}
                                  title={`Liberar ${trialConfig.days || 3} dias de Teste Grátis`}
                                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 rounded-lg text-[10px] font-bold border border-amber-500/20 transition disabled:opacity-50 flex items-center gap-0.5"
                                >
                                  <FaBolt className="text-[8px]" />
                                  <span>+{trialConfig.days || 3}d</span>
                                </button>

                                {/* Botões de Estender Validade */}
                                <button
                                  onClick={() => handleExtendSubscription(p, 30)}
                                  disabled={isActionBusy}
                                  title="Adicionar +30 dias"
                                  className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 rounded-lg text-[10px] font-bold border border-purple-500/20 transition disabled:opacity-50"
                                >
                                  +30d
                                </button>
                                <button
                                  onClick={() => handleExtendSubscription(p, 60)}
                                  disabled={isActionBusy}
                                  title="Adicionar +60 dias"
                                  className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 rounded-lg text-[10px] font-bold border border-purple-500/20 transition disabled:opacity-50"
                                >
                                  +60d
                                </button>
                                <button
                                  onClick={() => handleExtendSubscription(p, 90)}
                                  disabled={isActionBusy}
                                  title="Adicionar +90 dias"
                                  className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 rounded-lg text-[10px] font-bold border border-purple-500/20 transition disabled:opacity-50"
                                >
                                  +90d
                                </button>

                                {/* Alternar Status (Ativo / Suspenso) */}
                                <button
                                  onClick={() => handleToggleStatus(p)}
                                  disabled={isActionBusy}
                                  title={p.status === 'ativo' ? 'Suspender cliente' : 'Ativar cliente'}
                                  className={`p-1.5 rounded-lg border text-xs transition disabled:opacity-50 ${
                                    p.status === 'ativo'
                                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/25'
                                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/25'
                                  }`}
                                >
                                  {p.status === 'ativo' ? <FaBan /> : <FaCheckCircle />}
                                </button>

                                {/* Desbloquear / Confirmar Pagamento Pix (+30d) */}
                                {(isExpired || p.status === 'vencido' || p.status === 'suspenso' || p.is_trial) && (
                                  <button
                                    onClick={() => handleConfirmPaymentAndUnlock(p)}
                                    disabled={isActionBusy}
                                    title="Confirmar Pagamento Pix e Desbloquear Cliente (+30 dias)"
                                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-500/40 transition disabled:opacity-50 flex items-center gap-1 shadow-sm"
                                  >
                                    <FaCheckCircle className="text-[9px]" />
                                    <span>Desbloquear (Pago)</span>
                                  </button>
                                )}

                                {/* Editar Conta / Telas / Plano */}
                                <button
                                  onClick={() => handleOpenEditModal(p)}
                                  disabled={isActionBusy}
                                  title="Editar Conta, Telas Simultâneas e Plano"
                                  className="p-1.5 bg-blue-500/10 hover:bg-blue-500/25 text-blue-300 rounded-lg border border-blue-500/20 transition text-xs disabled:opacity-50 flex items-center gap-1"
                                >
                                  <FaEdit />
                                </button>

                                {/* WhatsApp Direto */}
                                <a
                                  href={`https://wa.me/5592993746740?text=${encodeURIComponent(
                                    `Olá! Mensagem Cine Spartan para a conta ${p.email}: sua assinatura do plano ${p.plan_name} está válida até ${new Date(p.expires_at).toLocaleDateString('pt-BR')}. Dúvidas ou renovações via Pix?`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Enviar mensagem no WhatsApp"
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 rounded-lg border border-emerald-500/20 transition text-xs"
                                >
                                  <FaWhatsapp />
                                </a>

                                {/* Excluir */}
                                <button
                                  onClick={() => handleDeleteUser(p)}
                                  disabled={isActionBusy}
                                  title="Excluir cliente"
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg border border-red-500/20 transition text-xs disabled:opacity-50"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. ABA: FINANCEIRO, COBRANÇA & GESTÃO COMPLETA (/admin/finance)
           ========================================================================= */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            {/* Cabeçalho do Módulo Financeiro */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#12121c] border border-purple-900/30 rounded-2xl p-5 shadow-lg">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white text-lg shadow-md shadow-emerald-600/25">
                    <FaMoneyBillWave />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Controle Financeiro & Meios de Pagamento</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        100% Conciliado
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400">
                      Fluxo de caixa segregado por Dia, Mês e Ano, com controle de Pix, Cartão, Boleto e conciliação automática.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setPixConfigModalOpen(true)}
                  className="px-3.5 py-2 bg-[#1c1c2b] hover:bg-[#252538] border border-gray-700 hover:border-purple-500 text-gray-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <FaSlidersH className="text-xs text-purple-400" />
                  <span>Chave Pix</span>
                </button>
                <button
                  onClick={handleSyncPix}
                  disabled={syncingPix}
                  className="px-3.5 py-2 bg-[#1c1c2b] hover:bg-[#252538] border border-gray-700 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <FaSyncAlt className={syncingPix ? 'animate-spin text-emerald-400' : 'text-gray-400'} />
                  <span>{syncingPix ? 'Sincronizando...' : 'Conciliar'}</span>
                </button>
                <button
                  onClick={() => setNewPixModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition"
                >
                  <FaPlus className="text-xs" />
                  <span>Novo Lançamento</span>
                </button>
              </div>
            </div>

            {/* PAINEL COMPARATIVO DE PERÍODOS (HOJE vs MÊS vs ANO vs GERAL) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FaChartLine className="text-purple-400" />
                  <span>Faturamento por Período (Dia, Mês e Ano)</span>
                </span>
                <span className="text-[11px] text-gray-400">
                  Clique no card para filtrar a tabela automaticamente
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Card HOJE (Dia) */}
                <button
                  type="button"
                  onClick={() => setFinancePeriod('today')}
                  className={`text-left p-4 rounded-2xl border transition relative overflow-hidden group shadow-lg ${
                    financePeriod === 'today'
                      ? 'bg-gradient-to-br from-emerald-950/70 via-[#141824] to-[#101018] border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-[#12121c] border-purple-900/30 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <FaCalendarDay className="text-xs" />
                      <span>Faturamento Hoje (Dia)</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                      Dia {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    R$ {financialStats.todayLiquidado.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-800/80 pt-2">
                    <span className="text-emerald-400 font-semibold">
                      {financialStats.todayCountLiquidado} recebimento(s) hoje
                    </span>
                    <span className="text-amber-400/90 font-mono">
                      Pend: R$ {financialStats.todayPendente.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </button>

                {/* 2. Card ESTE MÊS */}
                <button
                  type="button"
                  onClick={() => setFinancePeriod('month')}
                  className={`text-left p-4 rounded-2xl border transition relative overflow-hidden group shadow-lg ${
                    financePeriod === 'month'
                      ? 'bg-gradient-to-br from-cyan-950/70 via-[#141824] to-[#101018] border-cyan-500 ring-2 ring-cyan-500/30'
                      : 'bg-[#12121c] border-purple-900/30 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <FaCalendarAlt className="text-xs" />
                      <span>Faturamento Este Mês</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                      {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    R$ {financialStats.monthLiquidado.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-800/80 pt-2">
                    <span className="text-cyan-400 font-semibold">
                      {financialStats.monthCountLiquidado} liquidado(s) no mês
                    </span>
                    <span className="text-amber-400/90 font-mono">
                      Pend: R$ {financialStats.monthPendente.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </button>

                {/* 3. Card ESTE ANO */}
                <button
                  type="button"
                  onClick={() => setFinancePeriod('year')}
                  className={`text-left p-4 rounded-2xl border transition relative overflow-hidden group shadow-lg ${
                    financePeriod === 'year'
                      ? 'bg-gradient-to-br from-purple-950/70 via-[#141824] to-[#101018] border-purple-500 ring-2 ring-purple-500/30'
                      : 'bg-[#12121c] border-purple-900/30 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <FaHistory className="text-xs" />
                      <span>Faturamento Este Ano</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">
                      Ano {new Date().getFullYear()}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    R$ {financialStats.yearLiquidado.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-800/80 pt-2">
                    <span className="text-purple-400 font-semibold">
                      {financialStats.yearCountLiquidado} no ano corrente
                    </span>
                    <span className="text-amber-400/90 font-mono">
                      Pend: R$ {financialStats.yearPendente.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </button>

                {/* 4. Card GERAL / ACUMULADO */}
                <button
                  type="button"
                  onClick={() => setFinancePeriod('all')}
                  className={`text-left p-4 rounded-2xl border transition relative overflow-hidden group shadow-lg ${
                    financePeriod === 'all'
                      ? 'bg-gradient-to-br from-indigo-950/70 via-[#141824] to-[#101018] border-indigo-500 ring-2 ring-indigo-500/30'
                      : 'bg-[#12121c] border-purple-900/30 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <FaExchangeAlt className="text-xs" />
                      <span>Total Histórico</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                      Geral
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    R$ {financialStats.allLiquidado.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-800/80 pt-2">
                    <span className="text-indigo-400 font-semibold">
                      {financialStats.allCountLiquidado} recebimento(s) total
                    </span>
                    <span className="text-amber-400/90 font-mono">
                      Pend: R$ {financialStats.allPendente.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* BARRA DE SELEÇÃO DE PERÍODO & DETALHAMENTO DE PERFORMANCE */}
            <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-300">Filtro de Período Ativo:</span>
                  <div className="inline-flex p-1 bg-black/50 border border-gray-800 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setFinancePeriod('today')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        financePeriod === 'today'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <FaCalendarDay className="text-[11px]" />
                      <span>Hoje (Dia)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinancePeriod('month')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        financePeriod === 'month'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <FaCalendarAlt className="text-[11px]" />
                      <span>Este Mês</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinancePeriod('year')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        financePeriod === 'year'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <FaHistory className="text-[11px]" />
                      <span>Este Ano</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinancePeriod('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        financePeriod === 'all'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <FaExchangeAlt className="text-[11px]" />
                      <span>Todo o Período</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>
                    Exibindo dados de:{' '}
                    <strong className="text-white">
                      {financePeriod === 'today'
                        ? 'Hoje (Dia Corrente)'
                        : financePeriod === 'month'
                        ? 'Mês Atual'
                        : financePeriod === 'year'
                        ? 'Ano Fiscal Atual'
                        : 'Histórico Completo'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* 4 Métricas Dinâmicas do Período */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-black/40 border border-gray-800/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Faturado no Período
                  </span>
                  <div className="text-xl font-black text-emerald-400">
                    R$ {financialStats.periodLiquidado.toFixed(2).replace('.', ',')}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    {financialStats.periodCountLiquidado} cobrança(s) recebida(s)
                  </span>
                </div>

                <div className="bg-black/40 border border-gray-800/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Aguardando Pagamento
                  </span>
                  <div className="text-xl font-black text-amber-400">
                    R$ {financialStats.periodPendente.toFixed(2).replace('.', ',')}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    {financialStats.periodCountPendente} cobrança(s) pendente(s)
                  </span>
                </div>

                <div className="bg-black/40 border border-gray-800/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Ticket Médio
                  </span>
                  <div className="text-xl font-black text-purple-300">
                    R$ {financialStats.periodTicketMedio.toFixed(2).replace('.', ',')}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">Por cliente liquidado</span>
                </div>

                <div className="bg-black/40 border border-gray-800/80 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Taxa de Liquidação
                  </span>
                  <div className="text-xl font-black text-cyan-300">
                    {financialStats.periodTaxaConversao}%
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">Pagos vs Emitidos no período</span>
                </div>
              </div>
            </div>

            {/* DISTRIBUIÇÃO POR TIPOS DE PAGAMENTO (PIX, CARTÃO, BOLETO, OUTROS) */}
            <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <FaSlidersH />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Distribuição por Meios de Pagamento (
                      {financePeriod === 'today'
                        ? 'Hoje'
                        : financePeriod === 'month'
                        ? 'Este Mês'
                        : financePeriod === 'year'
                        ? 'Este Ano'
                        : 'Histórico'}
                      )
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Volume arrecadado e participação percentual por cada método
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-gray-300 bg-black/40 px-3 py-1 rounded-lg border border-gray-800">
                  Total Liquidado: <span className="text-emerald-400">R$ {financialStats.periodLiquidado.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* Barra de Progresso Multi-Método */}
              <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden flex shadow-inner border border-gray-800">
                <div
                  style={{ width: `${financialStats.pixPct}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title={`Pix: ${financialStats.pixPct}% (R$ ${financialStats.pixTotal.toFixed(2)})`}
                />
                <div
                  style={{ width: `${financialStats.cartaoPct}%` }}
                  className="bg-purple-500 h-full transition-all duration-500"
                  title={`Cartão de Crédito: ${financialStats.cartaoPct}% (R$ ${financialStats.cartaoTotal.toFixed(2)})`}
                />
                <div
                  style={{ width: `${financialStats.boletoPct}%` }}
                  className="bg-amber-500 h-full transition-all duration-500"
                  title={`Boleto Bancário: ${financialStats.boletoPct}% (R$ ${financialStats.boletoTotal.toFixed(2)})`}
                />
                <div
                  style={{ width: `${financialStats.outroPct}%` }}
                  className="bg-cyan-500 h-full transition-all duration-500"
                  title={`Outros/Dinheiro: ${financialStats.outroPct}% (R$ ${financialStats.outroTotal.toFixed(2)})`}
                />
              </div>

              {/* Grid dos 4 Tipos de Pagamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Pix Instantâneo */}
                <div className="bg-[#161624] border border-emerald-500/20 rounded-xl p-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                      <FaBolt className="text-xs" />
                      <span>Pix Instantâneo</span>
                    </div>
                    <div className="text-lg font-black text-white">
                      R$ {financialStats.pixTotal.toFixed(2).replace('.', ',')}
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      {financialStats.pixCount} transação(ões) liquidada(s)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {financialStats.pixPct}%
                  </span>
                </div>

                {/* 2. Cartão de Crédito */}
                <div className="bg-[#161624] border border-purple-500/20 rounded-xl p-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 mb-1">
                      <FaCreditCard className="text-xs" />
                      <span>Cartão de Crédito</span>
                    </div>
                    <div className="text-lg font-black text-white">
                      R$ {financialStats.cartaoTotal.toFixed(2).replace('.', ',')}
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      {financialStats.cartaoCount} transação(ões) liquidada(s)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {financialStats.cartaoPct}%
                  </span>
                </div>

                {/* 3. Boleto Bancário */}
                <div className="bg-[#161624] border border-amber-500/20 rounded-xl p-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                      <FaBarcode className="text-xs" />
                      <span>Boleto Bancário</span>
                    </div>
                    <div className="text-lg font-black text-white">
                      R$ {financialStats.boletoTotal.toFixed(2).replace('.', ',')}
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      {financialStats.boletoCount} transação(ões) liquidada(s)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {financialStats.boletoPct}%
                  </span>
                </div>

                {/* 4. Outros / Dinheiro */}
                <div className="bg-[#161624] border border-cyan-500/20 rounded-xl p-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 mb-1">
                      <FaMoneyBillWave className="text-xs" />
                      <span>Transferência / Dinheiro</span>
                    </div>
                    <div className="text-lg font-black text-white">
                      R$ {financialStats.outroTotal.toFixed(2).replace('.', ',')}
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      {financialStats.outroCount} transação(ões) liquidada(s)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {financialStats.outroPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Banner e Atalho de Configuração do Pix */}
            <div className="bg-[#141422] border border-purple-800/40 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-lg shadow-inner shrink-0">
                  <FaBolt className="text-emerald-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-300">Chave Pix de Recebimento Direto:</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/25">
                      {pixConfig.key}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                      {pixConfig.keyType}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Titular: <strong className="text-white">{pixConfig.recipientName}</strong> • {pixConfig.city} (Propagado universalmente para APKs e Web)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPixConfigModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition shrink-0"
              >
                <FaSlidersH className="text-xs" />
                <span>Alterar Chave Pix</span>
              </button>
            </div>

            {/* TABELA DE LANÇAMENTOS E HISTÓRICO FINANCEIRO */}
            <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl overflow-hidden shadow-xl space-y-0">
              {/* Barra de Filtros da Tabela */}
              <div className="p-4 border-b border-gray-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#141422]">
                {/* Filtros de Método e Status */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1 mr-1">
                    <FaFilter className="text-[10px]" />
                    <span>Filtrar:</span>
                  </span>

                  {/* Seletor de Tipo de Pagamento */}
                  <select
                    value={financeMethodFilter}
                    onChange={(e) => setFinanceMethodFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-black/50 border border-gray-700 rounded-xl text-xs text-white focus:border-purple-500 outline-none font-medium"
                  >
                    <option value="all">Todos os Métodos</option>
                    <option value="pix">⚡ Pix Instantâneo</option>
                    <option value="cartao">💳 Cartão de Crédito</option>
                    <option value="boleto">📄 Boleto Bancário</option>
                    <option value="outro">💵 Transferência / Dinheiro</option>
                  </select>

                  {/* Seletor de Situação/Status */}
                  <select
                    value={financeStatusFilter}
                    onChange={(e) => setFinanceStatusFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-black/50 border border-gray-700 rounded-xl text-xs text-white focus:border-purple-500 outline-none font-medium"
                  >
                    <option value="all">Todas as Situações</option>
                    <option value="liquidado">✅ Liquidado / Pago</option>
                    <option value="pendente">⏳ Aguardando / Pendente</option>
                    <option value="cancelado">❌ Cancelado / Falhou</option>
                  </select>
                </div>

                {/* Campo de Busca Rápida */}
                <div className="relative min-w-[280px]">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, e-mail, hash ou valor..."
                    value={financeSearch}
                    onChange={(e) => setFinanceSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-black/50 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none transition"
                  />
                </div>
              </div>

              {/* Tabela Responsiva Autoadaptável */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-purple-900/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181826] text-gray-400 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="py-3 px-4">Identificador / Hash</th>
                      <th className="py-3 px-4">Assinante / Cliente</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Tipo de Pagamento</th>
                      <th className="py-3 px-4">Vencimento / Data</th>
                      <th className="py-3 px-4">Situação</th>
                      <th className="py-3 px-4 text-right">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {financialStats.filteredCharges.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          Nenhum lançamento financeiro encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      financialStats.filteredCharges.map((charge) => {
                        const mKey = financialStats.getMethodKey(charge.method);
                        return (
                          <tr key={charge.id} className="hover:bg-white/[0.02] transition">
                            {/* Hash */}
                            <td className="py-3 px-4 font-mono font-medium">
                              <button
                                onClick={() => handleCopyPixCode(charge.hash)}
                                className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition"
                                title="Clique para copiar código"
                              >
                                <span>{charge.hash}</span>
                                <FaCopy className="text-[10px] text-gray-500" />
                              </button>
                            </td>

                            {/* Assinante */}
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{charge.customerName}</div>
                              <div className="text-[10px] text-gray-400">{charge.customerEmail}</div>
                              {charge.customerWhatsapp && (
                                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5 font-bold">
                                  <FaWhatsapp className="text-[10px]" />
                                  <span>{charge.customerWhatsapp}</span>
                                </div>
                              )}
                            </td>

                            {/* Valor */}
                            <td className="py-3 px-4 font-bold text-white text-sm">
                              R$ {charge.amount.toFixed(2).replace('.', ',')}
                            </td>

                            {/* Tipo de Pagamento com Badge */}
                            <td className="py-3 px-4">
                              {mKey === 'pix' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                                  <FaBolt className="text-[9px]" />
                                  <span>{charge.method}</span>
                                </span>
                              ) : mKey === 'cartao' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/25">
                                  <FaCreditCard className="text-[9px]" />
                                  <span>{charge.method}</span>
                                </span>
                              ) : mKey === 'boleto' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/25">
                                  <FaBarcode className="text-[9px]" />
                                  <span>{charge.method}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                                  <FaMoneyBillWave className="text-[9px]" />
                                  <span>{charge.method}</span>
                                </span>
                              )}
                            </td>

                            {/* Vencimento / Data */}
                            <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                              {charge.dueDate}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              {charge.status === 'liquidado' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <FaCheckCircle className="text-[9px]" /> Liquidado / Pago
                                </span>
                              ) : charge.status === 'cancelado' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                                  <FaBan className="text-[9px]" /> Cancelado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  <FaSyncAlt className="text-[9px]" /> Aguardando Pagamento
                                </span>
                              )}
                            </td>

                            {/* Ações */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {charge.status !== 'liquidado' && (
                                  <button
                                    onClick={() => handleConfirmPixCharge(charge)}
                                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-500/40 transition flex items-center gap-1 shadow-sm"
                                    title="Confirmar pagamento recebido e desbloquear cliente (+30 dias)"
                                  >
                                    <FaCheckCircle className="text-[10px] text-emerald-400" />
                                    <span>Confirmar</span>
                                  </button>
                                )}

                                <a
                                  href={`https://wa.me/55${(charge.customerWhatsapp || '92993746740').replace(/\D/g, '')}?text=${encodeURIComponent(
                                    `Olá ${charge.customerName}! Cine Spartan informa:\n\n${
                                      charge.status === 'liquidado'
                                        ? `Seu pagamento de R$ ${charge.amount.toFixed(2).replace('.', ',')} via ${charge.method} foi confirmado e sua assinatura está ativa!`
                                        : `Cobrança Cine Spartan (${charge.method}):\n🔑 Chave Pix: ${pixConfig.key}\n💰 Valor: R$ ${charge.amount.toFixed(2).replace('.', ',')}\n📋 Código: ${charge.hash}\n\nEnvie o comprovante para liberação imediata!`
                                    }`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-500/20 transition flex items-center gap-1"
                                  title="Enviar no WhatsApp"
                                >
                                  <FaWhatsapp className="text-xs text-emerald-400" />
                                  <span>Zap</span>
                                </a>

                                {mKey === 'pix' && (
                                  <button
                                    onClick={() => {
                                      setSelectedPix(charge);
                                      setPixModalOpen(true);
                                    }}
                                    className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 rounded-lg text-[10px] font-bold border border-purple-500/20 transition"
                                    title="Visualizar QR Code Pix"
                                  >
                                    QR Code
                                  </button>
                                )}

                                {charge.status === 'pendente' && (
                                  <button
                                    onClick={() => handleCancelCharge(charge.id)}
                                    className="p-1.5 bg-gray-800 hover:bg-red-950/60 text-gray-400 hover:text-red-300 rounded-lg border border-gray-700/60 transition"
                                    title="Cancelar cobrança"
                                  >
                                    <FaBan className="text-[10px]" />
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteCharge(charge.id)}
                                  className="p-1.5 bg-gray-800 hover:bg-red-950/60 text-gray-400 hover:text-red-300 rounded-lg border border-gray-700/60 transition"
                                  title="Excluir lançamento"
                                >
                                  <FaTrash className="text-[10px]" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            4. ABA: PLANOS, PRECIFICAÇÃO & MONETIZAÇÃO (/admin/plans)
           ========================================================================= */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Planos, Monetização & Teste Grátis</h2>
              <p className="text-xs text-gray-400">
                Ajuste os valores dos planos, telas simultâneas e controle a duração do teste grátis (trial) oferecido para novos clientes.
              </p>
            </div>

            {/* Card de Configuração de Teste Grátis (Trial do Sistema) */}
            <div className="bg-[#12121c] border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl shadow-lg shadow-amber-500/10">
                    <FaBolt />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">Configuração do Teste Grátis (Free Trial)</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        trialConfig.enabled && trialConfig.days > 0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {trialConfig.enabled && trialConfig.days > 0 ? `${trialConfig.days} Dias de Degustação` : 'Desativado'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Controle quantos dias todo novo usuário recebe ao cadastrar o WhatsApp antes de ser cobrado via Pix.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSaveTrialConfig(trialConfig.days || 3, !trialConfig.enabled)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      trialConfig.enabled
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    {trialConfig.enabled ? 'Desativar Teste Grátis' : 'Ativar Teste Grátis'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-800/80 relative z-10">
                {/* Seleção rápida de dias */}
                <div className="lg:col-span-2 space-y-3">
                  <label className="text-xs font-bold text-gray-300 block">
                    Selecione a Duração Padrão do Teste Grátis:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { days: 1, label: '1 Dia (24h)' },
                      { days: 2, label: '2 Dias (48h)' },
                      { days: 3, label: '3 Dias (Recomendado)' },
                      { days: 5, label: '5 Dias' },
                      { days: 7, label: '7 Dias (1 Semana)' },
                    ].map((item) => (
                      <button
                        key={item.days}
                        type="button"
                        onClick={() => handleSaveTrialConfig(item.days, true)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                          trialConfig.enabled && trialConfig.days === item.days
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black border-amber-400 shadow-lg shadow-amber-500/20 font-black'
                            : 'bg-black/40 text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Input numérico livre */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <span className="text-xs text-gray-400">Ou defina outra quantidade de dias:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={trialConfig.days}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setTrialConfig((prev) => ({ ...prev, days: val }));
                        }}
                        className="w-20 px-3 py-1.5 bg-black/60 border border-gray-800 focus:border-amber-500 rounded-xl text-xs font-bold text-white text-center outline-none"
                      />
                      <span className="text-xs text-gray-400">dias</span>
                      <button
                        type="button"
                        onClick={() => handleSaveTrialConfig(trialConfig.days, trialConfig.days > 0)}
                        disabled={savingTrialConfig}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                      >
                        <FaSave className="text-[10px]" />
                        <span>{savingTrialConfig ? 'Salvando...' : 'Aplicar'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Resumo da regra */}
                <div className="bg-black/40 border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Comportamento para Novos Clientes
                    </span>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {trialConfig.enabled && trialConfig.days > 0 ? (
                        <>
                          Ao cadastrar o WhatsApp, o visitante recebe imediatamente <strong className="text-amber-400">{trialConfig.days} dias</strong> de acesso total ao catálogo em Full HD & 4K. Ao expirar, a tela bloqueia exigindo contratação via Pix.
                        </>
                      ) : (
                        <>
                          O teste grátis está <strong className="text-red-400">desativado</strong>. Novos clientes serão cadastrados com status vencido até realizarem o pagamento do plano via Pix.
                        </>
                      )}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-500 flex items-center gap-1.5">
                    <FaShieldAlt className="text-amber-400 shrink-0" />
                    <span>Anti-Fraude impede reutilização mesmo se o perfil for excluído.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cabeçalho dos Planos */}
            <div className="pt-2">
              <h3 className="text-lg font-bold text-white">Configuração Dinâmica de Tiers (Planos)</h3>
              <p className="text-xs text-gray-400">
                Ajuste os valores e telas simultâneas (1, 2 e 5 telas). Transmissão em Full HD & 4K Ultra HD inclusa como padrão em todos os planos.
              </p>
            </div>

            {/* 3 Cards de Planos lado a lado conforme especificação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((pl) => (
                <div
                  key={pl.id}
                  className={`bg-[#12121c] border rounded-2xl p-6 shadow-xl flex flex-col justify-between relative ${
                    pl.badge === 'Mais Popular'
                      ? 'border-purple-500/60 shadow-purple-950/40'
                      : 'border-purple-900/30'
                  }`}
                >
                  {pl.badge && (
                    <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md">
                      {pl.badge}
                    </span>
                  )}

                  <div>
                    <h3 className="text-base font-black text-white tracking-wide mb-1">{pl.name}</h3>
                    <p className="text-xs text-gray-400 mb-6">{pl.description}</p>

                    <div className="space-y-4">
                      {/* Preço Mensal */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 block mb-1">
                          Preço Mensal (R$)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.10"
                            value={pl.monthlyPrice}
                            onChange={(e) => handlePlanChange(pl.id, 'monthlyPrice', parseFloat(e.target.value) || 0)}
                            className="w-full pl-10 pr-4 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-sm font-bold text-white outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Preço Anual */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 block mb-1">
                          Preço Anual / Mês (R$)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">R$</span>
                          <input
                            type="number"
                            step="0.10"
                            value={pl.annualPrice}
                            onChange={(e) => handlePlanChange(pl.id, 'annualPrice', parseFloat(e.target.value) || 0)}
                            className="w-full pl-10 pr-4 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-sm font-bold text-emerald-400 outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Configurações de Telas e Resolução Padrão de Streaming */}
                      <div className="pt-2 border-t border-gray-800 space-y-3">
                        <div>
                          <label className="text-[11px] font-medium text-gray-400 block mb-1">
                            Telas Simultâneas Permitidas
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={pl.screens}
                            onChange={(e) => handlePlanChange(pl.id, 'screens', parseInt(e.target.value) || 1)}
                            className="w-full px-3.5 py-1.5 bg-black/40 border border-gray-800 rounded-lg text-xs font-bold text-white"
                          />
                        </div>

                        {/* Qualidade Padrão Cinema Fixa */}
                        <div className="p-3 bg-black/40 border border-purple-900/30 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-gray-300 block">Qualidade de Vídeo</span>
                            <span className="text-[10px] text-gray-500">Padrão Cine Spartan</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            Full HD & 4K Ultra HD
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botão Salvar Plano */}
                  <div className="mt-6 pt-4 border-t border-gray-800">
                    <button
                      onClick={() => handleSavePlan(pl.id)}
                      disabled={savingPlanId === pl.id}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2"
                    >
                      <FaSave />
                      <span>{savingPlanId === pl.id ? 'Salvando...' : 'Salvar Plano'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            5. ABA: TRAVA REMOTA DO APK, FORCE UPDATE & CONTROLE WEB / BROADCAST
           ========================================================================= */}
        {activeTab === 'security' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Cabeçalho da Aba */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-800">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <FaShieldAlt className="text-red-500" />
                  <span>Trava APK, Controle de Navegador Web & Segurança Remota</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Gerencie o acesso de Navegadores Web vs APK TV Box, envie aviso broadcast em tempo real, defina a versão obrigatória e bloqueie aparelhos/IPs indesejados.
                </p>
              </div>

              <button
                onClick={handleSaveSecurity}
                disabled={savingSecurity}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <FaSave />
                <span>{savingSecurity ? 'Salvando...' : 'Salvar Alterações Remotas'}</span>
              </button>
            </div>

            {/* Painel de Controle de Acesso: Web vs APK & Mensagem Global */}
            <div className="bg-[#10141f] border border-purple-900/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <FaGlobe />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Chaves de Acesso por Plataforma (Web & Aplicativo APK)</h3>
                  <p className="text-[11px] text-gray-400">
                    Ligue ou desligue o acesso pelo navegador do computador ou force todos a usarem o APK instalado no TV Box / Celular
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Switch: Acesso via Navegador Web */}
                <div className="p-4 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FaGlobe className={securityConfig?.webAccessEnabled !== false ? 'text-blue-400' : 'text-gray-500'} />
                      <span className="text-xs font-bold text-white">Acesso via Navegador Web (PC / Desktop / Mobile)</span>
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      {securityConfig?.webAccessEnabled !== false
                        ? 'Clientes podem assistir via navegador (Chrome, Edge, Firefox, etc.)'
                        : 'BLOQUEADO: Exibe tela ordenando o download do APK oficial para TV Box / Android'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSecurityConfig({
                        ...DEFAULT_SECURITY_CONFIG,
                        ...securityConfig,
                        webAccessEnabled: securityConfig?.webAccessEnabled === false ? true : false,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                      securityConfig?.webAccessEnabled !== false ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securityConfig?.webAccessEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch: Acesso via Aplicativo APK / TV Box */}
                <div className="p-4 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FaMobileAlt className={securityConfig?.apkAccessEnabled !== false ? 'text-purple-400' : 'text-gray-500'} />
                      <span className="text-xs font-bold text-white">Acesso via Aplicativo APK (TV Box & Android)</span>
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      {securityConfig?.apkAccessEnabled !== false
                        ? 'Permite conexões vindas do aplicativo Cine Spartan oficial'
                        : 'SUSPENSO: Bloqueia imediatamente o aplicativo em todos os TV Boxes'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSecurityConfig({
                        ...DEFAULT_SECURITY_CONFIG,
                        ...securityConfig,
                        apkAccessEnabled: securityConfig?.apkAccessEnabled === false ? true : false,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                      securityConfig?.apkAccessEnabled !== false ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securityConfig?.apkAccessEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Broadcast Global (Faixa de Aviso no Topo de Todos os Dispositivos) */}
              <div className="pt-2 border-t border-gray-800/80">
                <label className="text-[11px] font-bold text-purple-300 block mb-1">
                  📢 Aviso Global em Tempo Real (Broadcast Web & APK):
                </label>
                <input
                  type="text"
                  value={securityConfig?.globalBroadcastMessage || ''}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...DEFAULT_SECURITY_CONFIG,
                      ...securityConfig,
                      globalBroadcastMessage: e.target.value,
                    })
                  }
                  placeholder="Ex: ⚠️ Manutenção nos servidores às 23:00 para novos lançamentos 4K! | Ou deixe em branco para ocultar"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-purple-500/40 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Exibido em destaque no topo da tela de todos os clientes assistindo na Web ou no APK da TV Box.
                </span>
              </div>
            </div>

            {/* Grid Principal de Configurações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Card 1: Controle de Versão do APK (Force Update) */}
              <div className="bg-[#10141f] border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                      <FaShieldAlt />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Versão Obrigatória do APK (TV Box & Android)</h3>
                      <p className="text-[11px] text-gray-400">Forçar atualização nos TV Boxes (não afeta o acesso no PC via web)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Versão Mínima Permitida:
                    </label>
                    <input
                      type="text"
                      value={securityConfig?.minVersion || ''}
                      onChange={(e) => setSecurityConfig({ ...DEFAULT_SECURITY_CONFIG, ...securityConfig, minVersion: e.target.value })}
                      placeholder="Ex: 1.0.0"
                      className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-xl text-xs text-white focus:border-red-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">APKs do TV Box abaixo desta versão serão travados</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Versão Mais Recente (Último APK):
                    </label>
                    <input
                      type="text"
                      value={securityConfig?.latestVersion || ''}
                      onChange={(e) => setSecurityConfig({ ...DEFAULT_SECURITY_CONFIG, ...securityConfig, latestVersion: e.target.value })}
                      placeholder="Ex: 1.0.0"
                      className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-xl text-xs text-white focus:border-red-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">Exibida no badge de atualização da TV Box</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Link Direto para Download do APK:
                  </label>
                  <input
                    type="url"
                    value={securityConfig?.apkDownloadUrl || ''}
                    onChange={(e) => setSecurityConfig({ ...DEFAULT_SECURITY_CONFIG, ...securityConfig, apkDownloadUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-xl text-xs text-white focus:border-red-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">O botão do controle remoto abrirá este link para download</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Mensagem de Atualização Exibida na TV Box:
                  </label>
                  <textarea
                    rows={2}
                    value={securityConfig?.updateMessage || ''}
                    onChange={(e) => setSecurityConfig({ ...DEFAULT_SECURITY_CONFIG, ...securityConfig, updateMessage: e.target.value })}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-xl text-xs text-white focus:border-red-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Switch: Forçar Atualização Imediata */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-gray-800">
                  <div>
                    <span className="text-xs font-bold text-white block">Forçar Atualização na TV Box</span>
                    <span className="text-[10px] text-gray-400">Bloqueia o APK da TV Box cuja versão for diferente (não afeta o PC)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecurityConfig({ ...DEFAULT_SECURITY_CONFIG, ...securityConfig, forceUpdate: !securityConfig?.forceUpdate })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      securityConfig?.forceUpdate ? 'bg-red-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securityConfig?.forceUpdate ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Card 2: Modo Manutenção, Bloqueio de IP e Bloqueio de Aparelhos (Device ID) */}
              <div className="space-y-6">

                {/* Modo Manutenção (Kill Switch) */}
                <div className="bg-[#10141f] border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <FaBolt />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Modo Manutenção Geral</h3>
                        <p className="text-[11px] text-gray-400">Suspende temporariamente o uso do aplicativo</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSecurityConfig({ ...DEFAULT_SECURITY_CONFIG, ...securityConfig, maintenanceMode: !securityConfig?.maintenanceMode })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        securityConfig?.maintenanceMode ? 'bg-amber-600' : 'bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          securityConfig?.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      Mensagem de Manutenção:
                    </label>
                    <textarea
                      rows={2}
                      value={securityConfig?.maintenanceMessage || ''}
                      onChange={(e) => setSecurityConfig({ ...DEFAULT_SECURITY_CONFIG, ...securityConfig, maintenanceMessage: e.target.value })}
                      className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Bloqueador de Aparelhos Físicos (Device ID) */}
                <div className="bg-[#10141f] border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800">
                    <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                      <FaDesktop />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Aparelhos Bloqueados (Device ID)</h3>
                      <p className="text-[11px] text-gray-400">Bane um aparelho físico específico (TV Box, Celular ou PC) permanentemente</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newDeviceToBlock}
                      onChange={(e) => setNewDeviceToBlock(e.target.value)}
                      placeholder="Cole o Device ID do aparelho..."
                      className="flex-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-xl text-xs text-white focus:border-red-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newDeviceToBlock.trim()) return;
                        handleToggleBlockDevice(newDeviceToBlock.trim());
                        setNewDeviceToBlock('');
                      }}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <FaBan />
                      <span>Banir Aparelho</span>
                    </button>
                  </div>

                  {(!Array.isArray(securityConfig?.blockedDevices) || securityConfig.blockedDevices.length === 0) ? (
                    <p className="text-xs text-gray-500 italic py-1 text-center">Nenhum aparelho físico bloqueado.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pt-1">
                      {(securityConfig?.blockedDevices || []).map((devId) => (
                        <span
                          key={devId}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-mono font-bold"
                        >
                          <span title={devId}>{devId.slice(0, 16)}...</span>
                          <button
                            type="button"
                            onClick={() => handleToggleBlockDevice(devId)}
                            className="text-red-400 hover:text-white ml-1 p-0.5 cursor-pointer"
                            title="Desbloquear Aparelho"
                          >
                            <FaTimes className="text-[10px]" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bloqueador de Endereço IP */}
                <div className="bg-[#10141f] border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <FaBan />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Lista Negra de IPs Bloqueados</h3>
                      <p className="text-[11px] text-gray-400">Impede acessos fraudulentos ou revendas não autorizadas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newIpToBlock}
                      onChange={(e) => setNewIpToBlock(e.target.value)}
                      placeholder="Digite o IP (ex: 189.54.12.8)"
                      className="flex-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-xl text-xs text-white focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newIpToBlock.trim()) return;
                        const ip = newIpToBlock.trim();
                        const currentIps = Array.isArray(securityConfig?.blockedIps) ? securityConfig.blockedIps : [];
                        if (currentIps.includes(ip)) return;
                        setSecurityConfig({
                          ...DEFAULT_SECURITY_CONFIG,
                          ...securityConfig,
                          blockedIps: [...currentIps, ip]
                        });
                        setNewIpToBlock('');
                      }}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <FaPlus />
                      <span>Bloquear</span>
                    </button>
                  </div>

                  {(!Array.isArray(securityConfig?.blockedIps) || securityConfig.blockedIps.length === 0) ? (
                    <p className="text-xs text-gray-500 italic py-2 text-center">Nenhum IP bloqueado no momento.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
                      {(securityConfig?.blockedIps || []).map((ip) => (
                        <span
                          key={ip}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-mono font-bold"
                        >
                          <span>{ip}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const currentIps = Array.isArray(securityConfig?.blockedIps) ? securityConfig.blockedIps : [];
                              setSecurityConfig({
                                ...DEFAULT_SECURITY_CONFIG,
                                ...securityConfig,
                                blockedIps: currentIps.filter((item) => item !== ip)
                              });
                            }}
                            className="text-red-400 hover:text-white ml-1 p-0.5 cursor-pointer"
                            title="Desbloquear IP"
                          >
                            <FaTimes className="text-[10px]" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Caixa Informativa Spartan Guard */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/30 via-black to-purple-950/30 border border-white/10 flex items-start gap-3">
              <FaShieldAlt className="text-red-400 text-xl shrink-0 mt-0.5" />
              <div className="text-xs text-gray-300 leading-relaxed space-y-1">
                <span className="font-bold text-white block">Como funciona a Trava Remota & Controle de Plataforma:</span>
                <p>
                  • <strong>Acesso Navegador Web:</strong> Permite desativar temporariamente o streaming pelo PC caso queira concentrar seus clientes 100% no APK oficial instalado no TV Box ou Android.
                </p>
                <p>
                  • <strong>Aparelhos Bloqueados (Device ID):</strong> Se um cliente compartilhar a senha com terceiros, você pode derrubar ou banir apenas o aparelho intruso sem prejudicar o cliente principal.
                </p>
                <p className="text-gray-400">
                  • <strong>Atualização do APK:</strong> Ao alterar a <strong>Versão Mínima</strong> ou ativar <strong>Forçar Atualização na TV Box</strong>, qualquer aparelho com versão anterior é imediatamente bloqueado com um botão de download para a nova versão.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAIS AUXILIARES (Pix, Novo Cliente, Diagnóstico 360°, Churn)
         ========================================================================= */}

      {/* Modal 1: Ver Pix (QR Code + Chave Copia e Cola) */}
      <AnimatePresence>
        {pixModalOpen && selectedPix && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#13131e] border border-purple-900/50 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setPixModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>

              <div className="text-center mb-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {selectedPix.status === 'liquidado' ? 'Pix Liquidado' : 'Aguardando Pagamento'}
                </span>
                <h3 className="text-lg font-bold text-white mt-2">Pagamento Pix Instantâneo</h3>
                <p className="text-xs text-gray-400">{selectedPix.customerEmail}</p>
                <div className="text-2xl font-black text-white mt-2">
                  R$ {selectedPix.amount.toFixed(2).replace('.', ',')}
                </div>
              </div>

              {/* QR Code Oficial Escaneável com Payload Real */}
              {(() => {
                const currentPixPayload = generatePixPayload({
                  key: pixConfig.key,
                  recipientName: pixConfig.recipientName,
                  city: pixConfig.city,
                  amount: selectedPix.amount,
                  txId: (selectedPix.hash || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25),
                });
                const qrUrl = getPixQrCodeUrl(currentPixPayload, 260);

                return (
                  <>
                    <div className="w-52 h-52 mx-auto bg-white p-2.5 rounded-2xl flex flex-col items-center justify-center shadow-xl border-2 border-emerald-500/40 my-3">
                      <img
                        src={qrUrl}
                        alt="QR Code Pix Oficial"
                        className="w-44 h-44 object-contain rounded-lg"
                        loading="eager"
                      />
                      <span className="text-[10px] font-black text-black tracking-wider uppercase mt-1">CINE SPARTAN PIX</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="bg-black/60 p-3 rounded-xl border border-gray-800 text-[11px] font-mono text-gray-300 break-all select-all space-y-1">
                        <div><strong className="text-purple-400">Chave Pix:</strong> {pixConfig.key} ({pixConfig.keyType})</div>
                        <div><strong className="text-gray-400">Titular:</strong> {pixConfig.recipientName} • {pixConfig.city}</div>
                        <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-800 truncate" title={currentPixPayload}>
                          Payload BR Code: {currentPixPayload}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyPixCode(selectedPix.hash)}
                          className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition"
                        >
                          {copiedPix ? <FaCheck className="text-white" /> : <FaCopy />}
                          <span>{copiedPix ? 'Código Copiado!' : 'Copiar Copia e Cola'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyPixKey}
                          className="w-full py-2.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                        >
                          {copiedPixKey ? <FaCheck className="text-emerald-300" /> : <FaCopy />}
                          <span>{copiedPixKey ? 'Chave Copiada!' : 'Copiar Chave'}</span>
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Novo Registro / Cobrança Financeira */}
      <AnimatePresence>
        {newPixModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#13131e] border border-purple-900/50 rounded-2xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            >
              <button
                onClick={() => setNewPixModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>

              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <FaMoneyBillWave className="text-emerald-400" />
                <span>Novo Lançamento Financeiro</span>
              </h3>
              <p className="text-xs text-gray-400 mb-5">
                Emita cobranças ou registre pagamentos via Pix, Cartão, Boleto ou Dinheiro
              </p>

              <form onSubmit={handleCreatePix} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    placeholder="Ex: João Silva"
                    value={newPixData.customerName}
                    onChange={(e) => setNewPixData({ ...newPixData, customerName: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">E-mail do Assinante</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={newPixData.customerEmail}
                    onChange={(e) => setNewPixData({ ...newPixData, customerEmail: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-400 block mb-1">WhatsApp para Notificação (com DDD)</label>
                  <input
                    type="tel"
                    placeholder="(92) 99374-6740"
                    value={newPixData.customerWhatsapp}
                    onChange={(e) => setNewPixData({ ...newPixData, customerWhatsapp: e.target.value })}
                    className="w-full px-4 py-2 bg-black/60 border border-emerald-500/30 focus:border-emerald-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">Tipo de Pagamento</label>
                    <select
                      value={newPixData.method}
                      onChange={(e) => setNewPixData({ ...newPixData, method: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none font-medium"
                    >
                      <option value="Pix Instantâneo">⚡ Pix Instantâneo</option>
                      <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                      <option value="Boleto Bancário">📄 Boleto Bancário</option>
                      <option value="Transferência / Dinheiro">💵 Transferência / Dinheiro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.10"
                      value={newPixData.amount}
                      onChange={(e) => setNewPixData({ ...newPixData, amount: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Situação / Status Inicial</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewPixData({ ...newPixData, status: 'pendente' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        newPixData.status === 'pendente'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>⏳ Aguardando / Pendente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPixData({ ...newPixData, status: 'liquidado' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        newPixData.status === 'liquidado'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>✅ Já Pago / Liquidado</span>
                    </button>
                  </div>
                </div>

                {newPixData.status === 'liquidado' && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-600/30 rounded-xl flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="unlockClientCheck"
                      checked={newPixData.unlockClient}
                      onChange={(e) => setNewPixData({ ...newPixData, unlockClient: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="unlockClientCheck" className="text-[11px] text-emerald-200 cursor-pointer font-medium">
                      Desbloquear / Renovar cliente por +30 dias se já estiver cadastrado
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <FaCheckCircle className="text-sm" />
                  <span>{newPixData.status === 'liquidado' ? 'Registrar Pagamento Recebido' : 'Emitir Cobrança'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Novo Cliente */}
      <AnimatePresence>
        {newUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#13131e] border border-purple-900/50 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setNewUserModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>

              <h3 className="text-lg font-bold text-white mb-1">Cadastrar Novo Cliente</h3>
              <p className="text-xs text-gray-400 mb-5">Adicione manualmente um assinante e defina a vigência</p>

              <form onSubmit={handleCreateNewUser} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">E-mail do Cliente</label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-emerald-400 block mb-1">WhatsApp com DDD (Obrigatório para Pix) *</label>
                  <input
                    type="tel"
                    placeholder="(92) 99374-6740"
                    value={newUserData.whatsapp}
                    onChange={(e) => setNewUserData({ ...newUserData, whatsapp: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-black/60 border border-emerald-500/30 focus:border-emerald-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">
                      Plano Contratado
                    </label>
                    <select
                      value={newUserData.plan}
                      onChange={(e) => handleSelectPlan(e.target.value)}
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                    >
                      {plans.map((pl) => (
                        <option key={pl.id} value={pl.name}>
                          {pl.name} ({pl.screens} {pl.screens === 1 ? 'tela' : 'telas'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-300">
                        Telas Simultâneas
                      </label>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Automático
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={newUserData.screens}
                        onChange={(e) => setNewUserData({ ...newUserData, screens: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 bg-black/60 border border-purple-500/40 focus:border-purple-500 rounded-xl text-xs font-bold text-white outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium pointer-events-none">
                        {newUserData.screens === 1 ? 'tela' : 'telas'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Validade Inicial</label>
                  <select
                    value={newUserData.days}
                    onChange={(e) => setNewUserData({ ...newUserData, days: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 bg-black/60 border border-gray-800 rounded-xl text-xs text-white"
                  >
                    <option value={trialConfig.days || 3}>
                      {trialConfig.days || 3} Dias (⚡ Padrão do Sistema / Teste Grátis)
                    </option>
                    <option value={1}>1 Dia (Degustação 24 Horas)</option>
                    <option value={2}>2 Dias (Degustação 48 Horas)</option>
                    <option value={3}>3 Dias (Degustação Recomendada)</option>
                    <option value={5}>5 Dias de Degustação</option>
                    <option value={7}>7 Dias (1 Semana Completa)</option>
                    <option value={30}>30 Dias (Mensal)</option>
                    <option value={60}>60 Dias (Bimestral)</option>
                    <option value={90}>90 Dias (Trimestral)</option>
                    <option value={365}>365 Dias (Anual)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
                >
                  {creatingUser ? 'Criando...' : 'Salvar e Ativar Cliente'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Editar Cliente & Gerenciar Telas */}
      <AnimatePresence>
        {editingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#13131e] border border-purple-900/50 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setEditingProfile(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>
              <h3 className="text-lg font-bold text-white mb-1">Editar Conta do Cliente</h3>
              <p className="text-xs text-purple-300 font-mono mb-4">{editingProfile.email}</p>

              <form onSubmit={handleSaveEditProfile} className="space-y-4">
                {/* Nome e E-mail */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">Nome do Cliente</label>
                    <input
                      type="text"
                      value={editFormData.fullName}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">E-mail de Acesso</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
                      required
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                      placeholder="cliente@email.com"
                    />
                  </div>
                </div>

                {/* Plano */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Plano do Cliente</label>
                  <select
                    value={editFormData.plan}
                    onChange={(e) => {
                      const pName = e.target.value;
                      const found = plans.find((p) => p.name === pName);
                      setEditFormData((prev) => ({
                        ...prev,
                        plan: pName,
                        screens: found ? found.screens : prev.screens,
                      }));
                    }}
                    className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                  >
                    {plans.map((pl) => (
                      <option key={pl.id} value={pl.name}>
                        {pl.name} (Padrão: {pl.screens} {pl.screens > 1 ? 'telas' : 'tela'})
                      </option>
                    ))}
                    <option value="Personalizado">Personalizado</option>
                  </select>
                </div>

                {/* Quantidade de Telas Simultâneas */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-300">Quantidade de Telas Simultâneas</label>
                    <span className="text-xs font-bold text-purple-400">
                      {editFormData.screens} {editFormData.screens > 1 ? 'Telas' : 'Tela'}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setEditFormData((prev) => ({ ...prev, screens: num }))}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                          editFormData.screens === num
                            ? 'bg-purple-600 border-purple-500 text-white shadow'
                            : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {num} {num === 1 ? 'Tela' : 'Telas'}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editFormData.screens}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        screens: Math.max(1, parseInt(e.target.value) || 1),
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-black/60 border border-gray-800 rounded-lg text-xs text-white"
                    placeholder="Ou digite o número de telas (ex: 1, 2, 4...)"
                  />
                </div>

                {/* Status e Validade */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">Status da Conta</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          status: e.target.value as ProfileStatus,
                        }))
                      }
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                    >
                      <option value="ativo">Ativo (Liberado)</option>
                      <option value="vencido">Vencido (Bloqueado)</option>
                      <option value="suspenso">Suspenso (Bloqueado)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">Validade (Expira Em)</label>
                    <input
                      type="date"
                      value={editFormData.expiresAt}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, expiresAt: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {/* Atalhos rápidos de validade */}
                <div className="flex gap-1.5">
                  {[7, 15, 30, 60, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        const dt = new Date();
                        dt.setDate(dt.getDate() + d);
                        setEditFormData((prev) => ({
                          ...prev,
                          expiresAt: dt.toISOString().slice(0, 10),
                          status: 'ativo',
                        }));
                      }}
                      className="flex-1 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-gray-300 hover:text-white transition"
                    >
                      +{d}d
                    </button>
                  ))}
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="text-xs font-semibold text-emerald-400 block mb-1">WhatsApp com DDD</label>
                  <input
                    type="tel"
                    value={editFormData.whatsapp}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, whatsapp: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-black/60 border border-emerald-500/30 rounded-xl text-xs text-white outline-none"
                    placeholder="Ex: 11999999999"
                  />
                </div>

                {/* Checkbox Teste Grátis */}
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 bg-black/40 p-2.5 rounded-xl border border-gray-800">
                  <input
                    type="checkbox"
                    checked={editFormData.isTrial}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, isTrial: e.target.checked }))
                    }
                    className="rounded accent-purple-600"
                  />
                  <span>Conta em período de Teste Grátis (bloquear após vencimento)</span>
                </label>

                {/* Ação rápida Confirmar Pagamento */}
                <button
                  type="button"
                  onClick={() => {
                    const dt = new Date();
                    dt.setDate(dt.getDate() + 30);
                    setEditFormData((prev) => ({
                      ...prev,
                      status: 'ativo',
                      isTrial: false,
                      expiresAt: dt.toISOString().slice(0, 10),
                    }));
                  }}
                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <FaCheckCircle /> <span>Confirmar Pagamento Pix (+30 dias Ativo)</span>
                </button>

                {/* Submit */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(null)}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEditProfile}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-50"
                  >
                    {savingEditProfile ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 4: Diagnóstico 360° */}
      <AnimatePresence>
        {diagModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#13131e] border border-purple-900/50 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setDiagModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg">
                  <FaChartLine />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Relatório Diagnóstico 360°</h3>
                  <p className="text-xs text-gray-400">Análise de margem de lucro e caso operacional</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 my-5">
                <div className="bg-black/40 border border-gray-800 p-3.5 rounded-xl">
                  <span className="text-[11px] text-gray-400 block mb-1">Margem Operacional</span>
                  <span className="text-xl font-black text-emerald-400">88.4%</span>
                  <p className="text-[10px] text-gray-500 mt-1">Custo de CDN e infraestrutura baixo</p>
                </div>
                <div className="bg-black/40 border border-gray-800 p-3.5 rounded-xl">
                  <span className="text-[11px] text-gray-400 block mb-1">LTV Estimado</span>
                  <span className="text-xl font-black text-purple-400">R$ 745,00</span>
                  <p className="text-[10px] text-gray-500 mt-1">Retenção média de 12.5 meses</p>
                </div>
                <div className="bg-black/40 border border-gray-800 p-3.5 rounded-xl">
                  <span className="text-[11px] text-gray-400 block mb-1">CAC Médio</span>
                  <span className="text-xl font-black text-cyan-400">R$ 14,20</span>
                  <p className="text-[10px] text-gray-500 mt-1">Recuperação em menos de 1 mês</p>
                </div>
                <div className="bg-black/40 border border-gray-800 p-3.5 rounded-xl">
                  <span className="text-[11px] text-gray-400 block mb-1">Saúde Operacional</span>
                  <span className="text-xl font-black text-white">98 / 100</span>
                  <p className="text-[10px] text-emerald-400 mt-1">Zero downtime detectado</p>
                </div>
              </div>

              <div className="bg-purple-950/30 border border-purple-800/40 p-4 rounded-xl text-xs text-gray-300 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <FaCheckCircle className="text-emerald-400" /> Caso Operacional Concluído
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  A base de clientes ativos possui alta fidelização. Recomenda-se incentivar o upgrade para o plano SPARTAN BUSINESS para clientes com mais de 3 telas ativas.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 5: Churn & Falhas */}
      <AnimatePresence>
        {churnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#13131e] border border-purple-900/50 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setChurnModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>

              <h3 className="text-lg font-bold text-white mb-1">Análise de Churn e Perdas</h3>
              <p className="text-xs text-gray-400 mb-4">Monitoramento de cancelamentos e falhas de pagamento</p>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-gray-800">
                  <span className="text-gray-400">Churn Rate Mensal</span>
                  <span className="font-black text-emerald-400">0.0%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-gray-800">
                  <span className="text-gray-400">Perda Estimada por Churn</span>
                  <span className="font-black text-white">R$ 0,00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-gray-800">
                  <span className="text-gray-400">Pagamentos Recuperados (Pix)</span>
                  <span className="font-black text-cyan-300">100%</span>
                </div>
              </div>

              <button
                onClick={() => setChurnModalOpen(false)}
                className="w-full mt-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition"
              >
                Fechar Análise
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 6: Configurar Chave Pix */}
      <AnimatePresence>
        {pixConfigModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#13131e] border border-purple-900/50 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setPixConfigModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-lg">
                  <FaSlidersH />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Configuração do Pix</h3>
                  <p className="text-xs text-gray-400">Defina a chave Pix onde você receberá os pagamentos</p>
                </div>
              </div>

              <form onSubmit={handleSavePixConfig} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">Tipo de Chave</label>
                    <select
                      value={pixConfig.keyType}
                      onChange={(e) => setPixConfig({ ...pixConfig, keyType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 rounded-xl text-xs text-white"
                    >
                      <option value="email">E-mail</option>
                      <option value="telefone">Telefone</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="aleatoria">Chave Aleatória (EVP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">Cidade do Titular</label>
                    <input
                      type="text"
                      placeholder="Ex: Manaus"
                      value={pixConfig.city}
                      onChange={(e) => setPixConfig({ ...pixConfig, city: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-emerald-400 block mb-1">Chave Pix de Recebimento *</label>
                  <input
                    type="text"
                    placeholder="Ex: gleisson1984@gmail.com"
                    value={pixConfig.key}
                    onChange={(e) => setPixConfig({ ...pixConfig, key: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-black/60 border border-emerald-500/40 focus:border-emerald-500 rounded-xl text-xs text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Nome do Titular / Beneficiário</label>
                  <input
                    type="text"
                    placeholder="Ex: Gleisson B Silva"
                    value={pixConfig.recipientName}
                    onChange={(e) => setPixConfig({ ...pixConfig, recipientName: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Mensagem Padrão do WhatsApp</label>
                  <textarea
                    rows={2}
                    value={pixConfig.customMessage}
                    onChange={(e) => setPixConfig({ ...pixConfig, customMessage: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-gray-300 outline-none"
                    placeholder="Texto que acompanha a chave no WhatsApp..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <FaSave />
                  <span>Salvar Configuração Pix</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 7: Histórico Anti-Fraude de Teste Grátis */}
      <AnimatePresence>
        {trialsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#13131e] border border-amber-500/40 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setTrialsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-lg border border-amber-500/30">
                  <FaShieldAlt />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Anti-Fraude: Testes Grátis Bloqueados</h3>
                  <p className="text-xs text-gray-400">
                    Histórico permanente de clientes que já utilizaram o teste grátis e perderam o direito a novos trials
                  </p>
                </div>
              </div>

              <div className="bg-black/50 border border-gray-800 rounded-xl overflow-hidden my-4 max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181826] text-gray-400 text-[10px] uppercase font-semibold border-b border-gray-800 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">E-mail</th>
                      <th className="py-2.5 px-3">WhatsApp</th>
                      <th className="py-2.5 px-3">Data Utilizado</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 font-mono text-[11px]">
                    {usedTrials.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          Nenhum registro no histórico anti-fraude.
                        </td>
                      </tr>
                    ) : (
                      usedTrials.map((ut) => (
                        <tr key={ut.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-white font-sans">{ut.email}</td>
                          <td className="py-2.5 px-3 text-emerald-400">{ut.whatsapp || 'Não informado'}</td>
                          <td className="py-2.5 px-3 text-gray-400">{new Date(ut.claimed_at).toLocaleDateString('pt-BR')}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
                              Trial Bloqueado
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={async () => {
                                if (window.confirm(`Deseja perdoar ${ut.email} e permitir que ele faça um novo teste grátis?`)) {
                                  try {
                                    await supabase.from('used_trials').delete().eq('email', ut.email);
                                  } catch {
                                    // ignore
                                  }
                                  const updated = usedTrials.filter((t) => t.id !== ut.id);
                                  setUsedTrials(updated);
                                  localStorage.setItem('spartan_used_trials', JSON.stringify(updated));
                                  setNotification({ type: 'success', message: `Bloqueio de ${ut.email} removido.` });
                                }
                              }}
                              className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] font-sans transition"
                              title="Permitir novo teste para este cliente"
                            >
                              Perdoar / Liberar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-200/90 leading-relaxed">
                <strong>🛡️ Como funciona a proteção:</strong> Mesmo que você exclua um cliente da lista ativa para liberar telas ou espaço, o e-mail e o WhatsApp dele permanecem gravados aqui. Se ele tentar criar uma conta nova, o sistema detecta na hora e bloqueia o acesso, exigindo o pagamento via Pix.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 8: Gerenciador de Aparelhos e Telas Conectadas (Web & APK) */}
      <AnimatePresence>
        {devicesModalProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#13131e] border border-purple-900/60 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setDevicesModalProfile(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-purple-900/30">
                  <FaTv />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Aparelhos & Telas de {devicesModalProfile.full_name || devicesModalProfile.email}</span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Controle em tempo real de quem está assistindo via APK / TV Box ou Navegador Web
                  </p>
                </div>
              </div>

              {/* Informações da Conta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 p-3 rounded-xl bg-black/40 border border-gray-800 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Plano</span>
                  <span className="font-bold text-purple-300">{devicesModalProfile.plan_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Limite de Telas</span>
                  <span className="font-bold text-white">{devicesModalProfile.max_screens || 1} Telas Simultâneas</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Último IP</span>
                  <span className="font-mono text-gray-300">{devicesModalProfile.last_ip || 'Desconhecido'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Visto por último</span>
                  <span className="text-gray-300">
                    {devicesModalProfile.last_seen_at
                      ? new Date(devicesModalProfile.last_seen_at).toLocaleTimeString('pt-BR')
                      : 'Agora'}
                  </span>
                </div>
              </div>

              {/* Lista de Aparelhos Registrados */}
              <div className="space-y-2 mb-5 max-h-72 overflow-y-auto">
                {(!Array.isArray(devicesModalProfile.active_devices) || devicesModalProfile.active_devices.length === 0) ? (
                  <div className="p-8 text-center bg-black/30 rounded-xl border border-gray-800 text-gray-400 text-xs">
                    <FaTv className="mx-auto text-2xl text-gray-600 mb-2" />
                    <span>Nenhum aparelho ativo ou tela conectada no momento.</span>
                  </div>
                ) : (
                  devicesModalProfile.active_devices.map((device, idx) => {
                    const isOnline = Date.now() - (device.lastPing || 0) < 120000;
                    const isApk =
                      device.platform === 'apk' ||
                      device.platform === 'tvbox' ||
                      /tv box|apk|android/i.test(device.deviceName || '');
                    const isDeviceBanned = (securityConfig?.blockedDevices || []).includes(device.deviceId);
                    const isIpBanned = device.ip && (securityConfig?.blockedIps || []).includes(device.ip);

                    return (
                      <div
                        key={device.deviceId || idx}
                        className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isOnline
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-black/40 border-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 ${
                              isApk
                                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                                : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {isApk ? <FaMobileAlt /> : <FaDesktop />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-xs">{device.deviceName || 'Aparelho Cine Spartan'}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  isOnline
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                                }`}
                              >
                                {isOnline ? 'Online Agora' : 'Inativo / Recente'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-black/60 border border-gray-800 text-[9px] text-gray-400 font-bold uppercase">
                                {isApk ? 'APK / TV Box' : 'Navegador Web'}
                              </span>
                              {isDeviceBanned && (
                                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold border border-red-500/30">
                                  Aparelho Banido
                                </span>
                              )}
                              {isIpBanned && (
                                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold border border-red-500/30">
                                  IP Banido
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                              <span>ID: {device.deviceId ? `${device.deviceId.slice(0, 12)}...` : 'N/A'}</span>
                              {device.ip && <span>IP: {device.ip}</span>}
                              {device.appVersion && <span>Versão: {device.appVersion}</span>}
                              {device.currentPath && <span>Página: {device.currentPath}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Ações por Aparelho */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleDisconnectDevices(devicesModalProfile, device.deviceId)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Desconectar esta tela imediatamente"
                          >
                            <FaPowerOff className="text-[9px]" />
                            <span>Derrubar Tela</span>
                          </button>

                          {device.deviceId && (
                            <button
                              type="button"
                              onClick={() => handleToggleBlockDevice(device.deviceId)}
                              className={`p-1.5 rounded-lg border text-[10px] transition cursor-pointer ${
                                isDeviceBanned
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/30'
                              }`}
                              title={isDeviceBanned ? 'Desbanir este aparelho' : 'Banir este aparelho (Device ID)'}
                            >
                              <FaBan />
                            </button>
                          )}

                          {device.ip && (
                            <button
                              type="button"
                              onClick={() => handleQuickBlockIp(device.ip!)}
                              className={`p-1.5 rounded-lg border text-[10px] transition cursor-pointer ${
                                isIpBanned
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/30'
                              }`}
                              title={isIpBanned ? 'Desbanir IP deste aparelho' : 'Banir endereço IP'}
                            >
                              <FaShieldAlt />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Botões do Rodapé */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => handleDisconnectDevices(devicesModalProfile)}
                  disabled={
                    !Array.isArray(devicesModalProfile.active_devices) ||
                    devicesModalProfile.active_devices.length === 0
                  }
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-lg shadow-red-900/30"
                >
                  <FaPowerOff />
                  <span>Derrubar Todas as Telas Deste Cliente</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDevicesModalProfile(null)}
                  className="w-full sm:w-auto px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold transition"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
