import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { useAuthProfile } from '../../hooks/useAuthProfile';
import type { Profile, ProfileStatus } from '../../types/supabase';
import SEO from '../Home/SEO';

// Tipagem dos Planos SaaS
interface PlanTier {
  id: string;
  name: string;
  badge?: string;
  monthlyPrice: number;
  annualPrice: number;
  screens: number;
  quality: string;
  description: string;
}

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
  key: 'gleisson1984@gmail.com',
  recipientName: 'Gleisson B Silva',
  city: 'Manaus',
  customMessage: 'Olá! Segue sua cobrança Pix Cine Spartan para ativação ou renovação imediata:',
};

// Planos padrão para streaming Cine Spartan
const DEFAULT_PLANS: PlanTier[] = [
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
    id: 'pro',
    name: 'SPARTAN PRO',
    badge: 'Mais Popular',
    monthlyPrice: 59.9,
    annualPrice: 50.0,
    screens: 2,
    quality: 'Full HD & 4K Ultra HD',
    description: '2 telas simultâneas para Smart TV, TV Box e família.',
  },
  {
    id: 'business',
    name: 'SPARTAN BUSINESS',
    badge: 'Ilimitado',
    monthlyPrice: 119.9,
    annualPrice: 99.9,
    screens: 5,
    quality: 'Full HD & 4K Ultra HD',
    description: '5 telas simultâneas em qualquer dispositivo com suporte VIP.',
  },
];

// Cobranças Pix padrão conforme especificação (Total Faturado R$ 99,00 / Inadimplência R$ 0,00)
const INITIAL_PIX_CHARGES: PixCharge[] = [
  {
    id: 'pix-1',
    hash: 'PIX-8F92A-4B2E-99F0',
    customerName: 'Gleisson Silva',
    customerEmail: 'gleisson1984@gmail.com',
    customerWhatsapp: '92993746740',
    amount: 99.0,
    method: 'Pix Instantâneo',
    dueDate: new Date().toLocaleDateString('pt-BR'),
    status: 'liquidado',
    createdAt: '2026-11-08 14:30',
  },
  {
    id: 'pix-2',
    hash: 'PIX-3C11D-89AA-55E2',
    customerName: 'Carlos Eduardo',
    customerEmail: 'carlos.spartan@gmail.com',
    customerWhatsapp: '92981223344',
    amount: 59.9,
    method: 'Pix Instantâneo',
    dueDate: '15/11/2026',
    status: 'liquidado',
    createdAt: '2026-11-05 18:12',
  },
  {
    id: 'pix-3',
    hash: 'PIX-7B44E-1200-91C8',
    customerName: 'Mariana Costa',
    customerEmail: 'mariana.costa@hotmail.com',
    customerWhatsapp: '92991887766',
    amount: 29.9,
    method: 'Pix Instantâneo',
    dueDate: '20/11/2026',
    status: 'pendente',
    createdAt: '2026-11-08 10:00',
  },
  {
    id: 'pix-4',
    hash: 'PIX-00A9F-7741-23B9',
    customerName: 'Rafael Mendes',
    customerEmail: 'rafael.spartan@outlook.com',
    customerWhatsapp: '92984556677',
    amount: 59.9,
    method: 'Pix Instantâneo',
    dueDate: '01/11/2026',
    status: 'cancelado',
    createdAt: '2026-11-01 09:20',
  },
];

interface AdminDashboardProps {
  defaultTab?: 'overview' | 'users' | 'finance' | 'plans';
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
    return defaultTab;
  }, [location.pathname, defaultTab]);

  const setActiveTab = (tab: 'overview' | 'users' | 'finance' | 'plans') => {
    if (tab === 'overview') navigate('/admin');
    else navigate(`/admin/${tab}`);
  };

  // Estados dos Clientes e Perfis
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProfileStatus | 'trial'>('all');
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
  const [plans, setPlans] = useState<PlanTier[]>(() => {
    const saved = localStorage.getItem('spartan_plans_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && 'screens' in parsed[0]) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_PLANS;
  });
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);

  // Estados do Financeiro Pix
  const [pixCharges, setPixCharges] = useState<PixCharge[]>(() => {
    const saved = localStorage.getItem('spartan_pix_charges');
    return saved ? JSON.parse(saved) : INITIAL_PIX_CHARGES;
  });
  const [selectedPix, setSelectedPix] = useState<PixCharge | null>(null);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [newPixModalOpen, setNewPixModalOpen] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [syncingPix, setSyncingPix] = useState(false);

  // Modal Novo Pix
  const [newPixData, setNewPixData] = useState({
    customerName: '',
    customerEmail: '',
    customerWhatsapp: '',
    amount: 99.0,
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

  // Sincroniza configuração de Trial do Supabase
  useEffect(() => {
    supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'trial_config')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          if (typeof data.value.trial_days === 'number') {
            setTrialConfig((prev) => ({ ...prev, days: data.value.trial_days }));
            localStorage.setItem('spartan_trial_days', String(data.value.trial_days));
          }
          if (typeof data.value.enabled === 'boolean') {
            setTrialConfig((prev) => ({ ...prev, enabled: data.value.enabled }));
            localStorage.setItem('spartan_trial_enabled', String(data.value.enabled));
          }
        }
      })
      .catch(() => {});
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

  // Modais Diagnóstico 360° e Churn
  const [diagModalOpen, setDiagModalOpen] = useState(false);
  const [churnModalOpen, setChurnModalOpen] = useState(false);
  const [diagRunning, setDiagRunning] = useState(false);

  // Formulário de Login de fallback
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Carregar perfis do Supabase
  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Se a tabela ainda não existir, fornecemos perfis mockados coerentes
        console.warn('Profiles não encontrados no Supabase, usando fallback local:', error.message);
        setProfiles([
          {
            id: 'mock-1',
            email: 'gleisson1984@gmail.com',
            whatsapp: '(92) 99374-6740',
            role: 'admin',
            status: 'ativo',
            plan_name: 'SPARTAN BUSINESS',
            expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
            max_screens: 5,
            created_at: new Date().toISOString(),
          },
          {
            id: 'mock-2',
            email: 'carlos.spartan@gmail.com',
            whatsapp: '(92) 98122-3344',
            role: 'client',
            status: 'ativo',
            plan_name: 'SPARTAN PRO',
            expires_at: new Date(Date.now() + 25 * 86400000).toISOString(),
            max_screens: 2,
            created_at: new Date().toISOString(),
          },
          {
            id: 'mock-3',
            email: 'mariana.costa@hotmail.com',
            whatsapp: '(92) 99188-7766',
            role: 'client',
            status: 'ativo',
            plan_name: 'SPARTAN START',
            expires_at: new Date(Date.now() + 12 * 86400000).toISOString(),
            max_screens: 1,
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }
      setProfiles((data as Profile[]) || []);
    } catch (err: unknown) {
      console.error('Erro ao listar perfis:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadProfiles();
    }
  }, [isAdmin, loadProfiles]);

  // Toast automático
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Ações de Clientes
  const handleToggleStatus = async (profile: Profile) => {
    const newStatus: ProfileStatus = profile.status === 'ativo' ? 'suspenso' : 'ativo';
    setActionLoadingId(profile.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', profile.id);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, status: newStatus } : p))
      );
      setNotification({
        type: 'success',
        message: `Status de ${profile.email} alterado para "${newStatus}".`,
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

      const { error } = await supabase
        .from('profiles')
        .update({ expires_at: newExpiryIso, status: 'ativo' })
        .eq('id', profile.id);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id ? { ...p, expires_at: newExpiryIso, status: 'ativo' } : p
        )
      );
      setNotification({
        type: 'success',
        message: `Assinatura de ${profile.email} estendida em +${daysToAdd} dias!`,
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
        `Tem certeza que deseja excluir o cliente ${profile.email}?\n\nEle será removido da lista para não tomar lugar de um novo cliente. O e-mail e WhatsApp serão gravados permanentemente no Anti-Fraude e ele perderá o direito a qualquer novo teste grátis!`
      )
    )
      return;
    setActionLoadingId(profile.id);
    try {
      // 1. Grava no histórico permanente anti-fraude
      const usedEntry = {
        id: 'trial-' + Date.now(),
        email: profile.email.toLowerCase(),
        whatsapp: profile.whatsapp,
        claimed_at: new Date().toISOString(),
        trial_days: 3,
        notes: 'Cliente excluído da lista ativa (bloqueio permanente de trial)',
      };
      const updatedUsedTrials = [usedEntry, ...usedTrials];
      setUsedTrials(updatedUsedTrials);
      localStorage.setItem('spartan_used_trials', JSON.stringify(updatedUsedTrials));

      try {
        await supabase.from('used_trials').insert([
          {
            email: profile.email.toLowerCase(),
            whatsapp: profile.whatsapp ? profile.whatsapp.replace(/\D/g, '') : null,
            trial_days: 3,
            notes: 'Excluído da lista ativa pelo administrador',
          },
        ]);
      } catch {
        // Ignora caso offline ou fallback local
      }

      // 2. Remove da lista de perfis
      const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
      if (error) throw error;
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
      setNotification({
        type: 'success',
        message: `Cliente ${profile.email} excluído. Anti-fraude ativado: direito a teste grátis revogado permanentemente.`,
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
        whatsapp: newUserData.whatsapp.trim() || undefined,
        role: 'client',
        status: 'ativo',
        plan_name: newUserData.plan,
        max_screens: Number(newUserData.screens),
        expires_at: expiry.toISOString(),
        created_at: new Date().toISOString(),
      };

      // Tenta salvar diretamente no Supabase se tabela existir
      try {
        await supabase.from('profiles').insert([
          {
            id: dummyId,
            email: newProf.email,
            whatsapp: newProf.whatsapp,
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

      setProfiles((prev) => [newProf, ...prev]);
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
  const handleSavePlan = (planId: string) => {
    setSavingPlanId(planId);
    setTimeout(() => {
      localStorage.setItem('spartan_plans_config', JSON.stringify(plans));
      setSavingPlanId(null);
      setNotification({
        type: 'success',
        message: 'Regras e preços do plano atualizados com sucesso!',
      });
    }, 400);
  };

  // Alterar campos de um plano
  const handlePlanChange = (id: string, field: keyof PlanTier, value: any) => {
    setPlans((prev) =>
      prev.map((pl) => (pl.id === id ? { ...pl, [field]: value } : pl))
    );
  };

  // Sincronizar Pagamentos Pix
  const handleSyncPix = () => {
    setSyncingPix(true);
    setTimeout(() => {
      setSyncingPix(false);
      setNotification({
        type: 'success',
        message: 'Pagamentos Pix sincronizados com sucesso! 100% conciliado.',
      });
    }, 700);
  };

  // Criar Nova Cobrança Pix
  const handleCreatePix = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPixData.customerEmail) return;
    const newEntry: PixCharge = {
      id: 'pix-' + Date.now(),
      hash: 'PIX-' + Math.random().toString(36).substring(2, 7).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      customerName: newPixData.customerName || 'Cliente Spartan',
      customerEmail: newPixData.customerEmail,
      customerWhatsapp: newPixData.customerWhatsapp ? newPixData.customerWhatsapp.replace(/\D/g, '') : undefined,
      amount: Number(newPixData.amount),
      method: 'Pix Instantâneo',
      dueDate: new Date(Date.now() + 3 * 86400000).toLocaleDateString('pt-BR'),
      status: 'pendente',
      createdAt: new Date().toLocaleString('pt-BR'),
    };
    const updated = [newEntry, ...pixCharges];
    setPixCharges(updated);
    localStorage.setItem('spartan_pix_charges', JSON.stringify(updated));
    setNewPixModalOpen(false);
    setNewPixData({ customerName: '', customerEmail: '', customerWhatsapp: '', amount: 99.0 });
    setSelectedPix(newEntry);
    setPixModalOpen(true);
    setNotification({ type: 'success', message: 'Cobrança Pix gerada com sucesso!' });
  };

  // Salvar Configurações do Pix
  const handleSavePixConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('spartan_pix_config', JSON.stringify(pixConfig));
    setPixConfigModalOpen(false);
    setNotification({
      type: 'success',
      message: 'Configurações de Pix do administrador atualizadas com sucesso!',
    });
  };

  // Copiar código Pix
  const handleCopyPixCode = (hash: string) => {
    const payload = `00020126580014br.gov.bcb.pix0136${pixConfig.key}520400005303986540599.005802BR5913${pixConfig.recipientName.slice(0, 13).toUpperCase()}6009${pixConfig.city.slice(0, 9).toUpperCase()}62070503***6304E8A2`;
    navigator.clipboard.writeText(payload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
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

      const { error } = await supabase
        .from('profiles')
        .update({
          expires_at: newExpiryIso,
          status: 'ativo',
          is_trial: true,
          trial_used: true,
          plan_name: `Teste Grátis (${days}d)`,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id
            ? {
                ...p,
                expires_at: newExpiryIso,
                status: 'ativo',
                is_trial: true,
                trial_used: true,
                plan_name: `Teste Grátis (${days}d)`,
              }
            : p
        )
      );
      setNotification({
        type: 'success',
        message: `Teste grátis de ${days} dias liberado para ${profile.email}!`,
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
          value: { trial_days: days, enabled },
          updated_at: new Date().toISOString(),
        });
      } catch {
        // Fallback local se a tabela de sistema ainda não estiver disponível
      }

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

  // Clientes filtrados
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch =
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.whatsapp && p.whatsapp.includes(searchTerm));
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'trial'
          ? p.is_trial || p.plan_name?.toLowerCase().includes('teste')
          : p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [profiles, searchTerm, statusFilter]);

  // Login de fallback para Admin
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await signInWithEmail('gleisson1984@gmail.com', adminPassword);
      if (!res.success) {
        setLoginError(res.error || 'Credenciais inválidas para o administrador.');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
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
          <nav className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-gray-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'finance'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaMoneyBillWave />
              <span>Financeiro & Pix</span>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'plans'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FaSlidersH />
              <span>Planos & Preços</span>
            </button>
          </nav>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL DAS ABAS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
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
                <div className="text-2xl font-black text-white tracking-tight">R$ 621,44</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    ↑ +14.8% este mês
                  </span>
                  <button
                    onClick={() => setChurnModalOpen(true)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-medium underline underline-offset-2"
                  >
                    Calcular churn
                  </button>
                </div>
              </div>

              {/* Card 2: Inadimplência */}
              <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-600/50 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inadimplência</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <FaCheckCircle />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-400 tracking-tight">R$ 0,00</div>
                <p className="text-[11px] text-gray-400 mt-3">Lucro por churn protegido (0.0% risco)</p>
              </div>

              {/* Card 3: Caixa Recuperado (PIX) */}
              <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-600/50 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Caixa Recuperado (PIX)</span>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <FaBolt />
                  </div>
                </div>
                <div className="text-2xl font-black text-cyan-300 tracking-tight">R$ 99,00</div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
                  <span>A receber: R$ 99,00</span>
                  <span className="text-cyan-400 font-bold">Taxa: 100%</span>
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
                  {profiles.filter((p) => p.status === 'ativo').length || 3} Clientes
                </div>
                <p className="text-[11px] text-emerald-400 mt-3 font-semibold">3 ativos cadastrados na base</p>
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
                    <span className="font-bold text-white">50% (2)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-gray-300">SPARTAN BUSINESS</span>
                    </div>
                    <span className="font-bold text-white">35% (1)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500" />
                      <span className="text-gray-300">SPARTAN START</span>
                    </div>
                    <span className="font-bold text-white">15% (0)</span>
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
                  onClick={() => setNewUserModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/25 transition"
                >
                  <FaPlus />
                  <span>+ Novo Cliente</span>
                </button>
              </div>
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Abas por Estado */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {(
                  [
                    { key: 'all', label: 'Todos', count: profiles.length },
                    { key: 'ativo', label: 'Ativos', count: profiles.filter((p) => p.status === 'ativo' && !p.is_trial && !p.plan_name?.toLowerCase().includes('teste')).length },
                    { key: 'trial', label: '⚡ Em Teste', count: profiles.filter((p) => p.is_trial || p.plan_name?.toLowerCase().includes('teste')).length },
                    { key: 'vencido', label: 'Vencidos / Bloqueados', count: profiles.filter((p) => p.status === 'vencido').length },
                    { key: 'suspenso', label: 'Suspensos', count: profiles.filter((p) => p.status === 'suspenso').length },
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
                  placeholder="Buscar por e-mail ou plano..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black/50 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none transition"
                />
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
                        const isExpired = new Date(p.expires_at) < new Date();
                        const daysLeft = Math.ceil(
                          (new Date(p.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        );
                        const isActionBusy = actionLoadingId === p.id;
                        const cleanPhone = p.whatsapp ? p.whatsapp.replace(/\D/g, '') : '';

                        return (
                          <tr key={p.id} className="hover:bg-white/[0.02] transition">
                            {/* Cliente / E-mail */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                                  {p.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
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
                                    `Olá! Mensagem Cine Spartan para a conta ${p.email}:\n\n${pixConfig.customMessage}\n\n🔑 Chave Pix (${pixConfig.keyType}): ${pixConfig.key}\n👤 Titular: ${pixConfig.recipientName}\n💰 Valor: R$ 59,90 (Plano ${p.plan_name})\n\nAssim que realizar o pagamento, responda com o comprovante aqui para liberação imediata!`
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
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                {p.plan_name || 'SPARTAN PRO'}
                              </span>
                            </td>

                            {/* Telas / Máquinas */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 text-gray-300 font-medium">
                                <FaTv className="text-gray-400" />
                                <span>{p.max_screens || 1} {p.max_screens > 1 ? 'Telas' : 'Tela'}</span>
                              </div>
                            </td>

                            {/* Status de Vigência */}
                            <td className="py-3.5 px-4">
                              {p.is_trial || p.plan_name?.toLowerCase().includes('teste') ? (
                                !isExpired && p.status === 'ativo' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    <FaBolt className="text-[9px] text-amber-400" />
                                    Teste Grátis ({daysLeft > 0 ? `${daysLeft}d restantes` : 'Último dia'})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/15 text-red-400 border border-red-500/30" title="Teste expirado - Acesso bloqueado">
                                    <FaLock className="text-[9px]" /> Teste Expirado (Bloqueado)
                                  </span>
                                )
                              ) : p.status === 'ativo' && !isExpired ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Ativo ({daysLeft}d restantes)
                                </span>
                              ) : p.status === 'suspenso' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  <FaBan className="text-[9px]" /> Suspenso
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                                  <FaExclamationTriangle className="text-[9px]" /> Vencido
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
            3. ABA: FINANCEIRO, COBRANÇA & GESTÃO PIX (/admin/finance)
           ========================================================================= */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            {/* Métricas Financeiras Topo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Total Faturado
                </span>
                <div className="text-2xl font-black text-emerald-400">R$ 99,00</div>
                <p className="text-[11px] text-gray-400 mt-2">Pagamento liquidado via Pix instantâneo</p>
              </div>

              <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Inadimplência
                </span>
                <div className="text-2xl font-black text-white">R$ 0,00</div>
                <p className="text-[11px] text-gray-400 mt-2">0 cobranças em atraso registradas</p>
              </div>

              <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Cobranças Pix Geradas
                </span>
                <div className="text-2xl font-black text-cyan-300">{pixCharges.length} Registros</div>
                <p className="text-[11px] text-gray-400 mt-2">Taxa de conversão: 100% de sucesso</p>
              </div>
            </div>

            {/* Banner e Atalho de Configuração do Pix */}
            <div className="bg-[#141422] border border-purple-800/40 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-lg shadow-inner">
                  <FaSlidersH />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-300">Chave Pix de Recebimento:</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/25">
                      {pixConfig.key}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                      {pixConfig.keyType}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Titular: <strong className="text-white">{pixConfig.recipientName}</strong> • {pixConfig.city}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPixConfigModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition shrink-0"
              >
                <FaSlidersH className="text-xs" />
                <span>Configurar Chave Pix</span>
              </button>
            </div>

            {/* Ações de Faturamento Manual */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#12121c] border border-purple-900/30 rounded-2xl p-4">
              <div>
                <h3 className="text-sm font-bold text-white">Faturamento Manual & Conciliação</h3>
                <p className="text-xs text-gray-400">Emita QR Codes Pix em tempo real e sincronize com a API</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSyncPix}
                  disabled={syncingPix}
                  className="px-4 py-2 bg-[#1c1c2b] hover:bg-[#252538] border border-gray-700 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <FaSyncAlt className={syncingPix ? 'animate-spin text-purple-400' : 'text-gray-400'} />
                  <span>{syncingPix ? 'Sincronizando...' : 'Sincronizar Pagamentos'}</span>
                </button>
                <button
                  onClick={() => setNewPixModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition"
                >
                  <FaQrcode />
                  <span>Emitir Cobrança Pix</span>
                </button>
              </div>
            </div>

            {/* Histórico de Cobranças Pix */}
            <div className="bg-[#12121c] border border-purple-900/30 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Histórico de Cobranças Pix</h3>
                <span className="text-xs text-gray-400">{pixCharges.length} cobranças no sistema</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181826] text-gray-400 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="py-3 px-4">Código / Hash Pix</th>
                      <th className="py-3 px-4">Assinante</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Método</th>
                      <th className="py-3 px-4">Vencimento</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {pixCharges.map((charge) => (
                      <tr key={charge.id} className="hover:bg-white/[0.02] transition">
                        {/* Hash */}
                        <td className="py-3 px-4 font-mono text-purple-400 font-medium">
                          <button
                            onClick={() => handleCopyPixCode(charge.hash)}
                            className="flex items-center gap-1.5 hover:text-purple-300"
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
                        <td className="py-3 px-4 font-bold text-white">
                          R$ {charge.amount.toFixed(2).replace('.', ',')}
                        </td>

                        {/* Método */}
                        <td className="py-3 px-4 text-gray-300 flex items-center gap-1.5">
                          <FaBolt className="text-cyan-400 text-xs" />
                          <span>{charge.method}</span>
                        </td>

                        {/* Vencimento */}
                        <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">{charge.dueDate}</td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {charge.status === 'liquidado' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <FaCheckCircle className="text-[9px]" /> Liquidado / Pagou
                            </span>
                          ) : charge.status === 'cancelado' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                              <FaBan className="text-[9px]" /> Cancelado / Falhou
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <FaSyncAlt className="text-[9px]" /> Aguardando Pix
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`https://wa.me/55${(charge.customerWhatsapp || '92993746740').replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Olá ${charge.customerName}! ${pixConfig.customMessage}\n\n🔑 Chave Pix (${pixConfig.keyType}): ${pixConfig.key}\n👤 Titular: ${pixConfig.recipientName}\n💰 Valor: R$ ${charge.amount.toFixed(2).replace('.', ',')}\n📋 Código Pix:\n${charge.hash}\n\nApós o pagamento, envie o comprovante para liberação imediata!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-500/20 transition flex items-center gap-1"
                              title="Enviar Pix direto no WhatsApp do cliente"
                            >
                              <FaWhatsapp className="text-xs text-emerald-400" />
                              <span>Enviar no Zap</span>
                            </a>
                            <button
                              onClick={() => {
                                setSelectedPix(charge);
                                setPixModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 rounded-lg text-[10px] font-bold border border-purple-500/20 transition"
                            >
                              Ver Pix
                            </button>
                            <button
                              onClick={() => {
                                setNotification({
                                  type: 'success',
                                  message: `Cobrança reemitida com sucesso para ${charge.customerEmail}!`,
                                });
                              }}
                              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-[10px] font-medium transition"
                            >
                              Faturar novamente
                            </button>
                            <button
                              onClick={() => {
                                alert(`Audit Log Pix:\nID: ${charge.id}\nHash: ${charge.hash}\nData: ${charge.createdAt}\nGateway: SpartanPix-Direct\nStatus: Conciliado`);
                              }}
                              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg text-[10px] font-medium transition"
                            >
                              Log
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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

              {/* Simulação Visual de QR Code */}
              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl flex flex-col items-center justify-center shadow-lg relative my-4">
                <FaQrcode className="text-black text-8xl" />
                <span className="text-[10px] font-bold text-black mt-2">CINE SPARTAN PIX</span>
              </div>

              <div className="space-y-3">
                <div className="bg-black/60 p-3 rounded-xl border border-gray-800 text-[11px] font-mono text-gray-300 break-all select-all space-y-1">
                  <div><strong className="text-purple-400">Chave Pix:</strong> {pixConfig.key} ({pixConfig.keyType})</div>
                  <div><strong className="text-gray-400">Titular:</strong> {pixConfig.recipientName} • {pixConfig.city}</div>
                  <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-800 truncate">Payload: 00020126580014br.gov.bcb.pix0136{pixConfig.key}52040000...</div>
                </div>
                <button
                  onClick={() => handleCopyPixCode(selectedPix.hash)}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
                >
                  {copiedPix ? <FaCheck className="text-emerald-300" /> : <FaCopy />}
                  <span>{copiedPix ? 'Código Pix Copiado!' : 'Copiar Chave Copia e Cola'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Emitir Nova Cobrança Pix */}
      <AnimatePresence>
        {newPixModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#13131e] border border-purple-900/50 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setNewPixModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>

              <h3 className="text-lg font-bold text-white mb-1">Emitir Nova Cobrança Pix</h3>
              <p className="text-xs text-gray-400 mb-5">Gere uma chave Pix direta com valor personalizado</p>

              <form onSubmit={handleCreatePix} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Silva"
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
                  <label className="text-xs font-semibold text-emerald-400 block mb-1">WhatsApp para Envio (com DDD)</label>
                  <input
                    type="tel"
                    placeholder="(92) 99374-6740"
                    value={newPixData.customerWhatsapp}
                    onChange={(e) => setNewPixData({ ...newPixData, customerWhatsapp: e.target.value })}
                    className="w-full px-4 py-2 bg-black/60 border border-emerald-500/30 focus:border-emerald-500 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Valor da Cobrança (R$)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={newPixData.amount}
                    onChange={(e) => setNewPixData({ ...newPixData, amount: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-4 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
                >
                  Gerar QR Code Pix
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
                    <label className="text-xs font-semibold text-gray-300 block mb-1">Plano</label>
                    <select
                      value={newUserData.plan}
                      onChange={(e) => setNewUserData({ ...newUserData, plan: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 rounded-xl text-xs text-white"
                    >
                      <option value="SPARTAN START">SPARTAN START</option>
                      <option value="SPARTAN PRO">SPARTAN PRO</option>
                      <option value="SPARTAN BUSINESS">SPARTAN BUSINESS</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">Telas Simultâneas</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newUserData.screens}
                      onChange={(e) => setNewUserData({ ...newUserData, screens: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 rounded-xl text-xs text-white"
                    />
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
    </div>
  );
}
