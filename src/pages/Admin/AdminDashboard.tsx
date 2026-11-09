import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { useAuthProfile } from '../../hooks/useAuthProfile';
import type { Profile, ProfileStatus } from '../../types/supabase';
import SEO from '../Home/SEO';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signInWithEmail } = useAuthProfile();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProfileStatus>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Login form state se não for admin
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Carregar todos os perfis cadastrados no Supabase
  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      setProfiles((data as Profile[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar clientes';
      console.error('Erro ao listar perfis:', err);
      setNotification({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadProfiles();
    }
  }, [isAdmin, loadProfiles]);

  // Ação 1: Alternar Status (Ativo <-> Suspenso)
  const handleToggleStatus = async (profile: Profile) => {
    const newStatus: ProfileStatus = profile.status === 'ativo' ? 'suspenso' : 'ativo';
    setActionLoadingId(profile.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', profile.id);

      if (error) throw error;

      setProfiles(prev =>
        prev.map(p => (p.id === profile.id ? { ...p, status: newStatus } : p))
      );
      setNotification({
        type: 'success',
        message: `Status de ${profile.email} alterado para "${newStatus.toUpperCase()}".`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar status';
      setNotification({ type: 'error', message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Ação 2: Estender Validade (+30, +60, +90 dias)
  const handleExtendSubscription = async (profile: Profile, days: number) => {
    setActionLoadingId(profile.id);
    try {
      // Se já estiver vencido, começa a contar a partir de agora; se ainda tiver tempo, soma ao prazo atual
      const currentExp = new Date(profile.expires_at).getTime();
      const baseTime = currentExp > Date.now() ? currentExp : Date.now();
      const newExpiry = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({
          expires_at: newExpiry,
          status: 'ativo', // Ao estender, reativa a assinatura automaticamente
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfiles(prev =>
        prev.map(p =>
          p.id === profile.id ? { ...p, expires_at: newExpiry, status: 'ativo' } : p
        )
      );

      setNotification({
        type: 'success',
        message: `+${days} dias adicionados para ${profile.email}! Nova validade definida.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao estender validade';
      setNotification({ type: 'error', message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Métricas
  const metrics = useMemo(() => {
    const now = Date.now();
    let active = 0;
    let expired = 0;
    let suspended = 0;

    profiles.forEach(p => {
      const expTime = new Date(p.expires_at).getTime();
      if (p.status === 'suspenso') {
        suspended++;
      } else if (p.status === 'vencido' || expTime <= now) {
        expired++;
      } else {
        active++;
      }
    });

    return { total: profiles.length, active, expired, suspended };
  }, [profiles]);

  // Lista filtrada
  const filteredProfiles = useMemo(() => {
    const now = Date.now();
    return profiles.filter(p => {
      const matchSearch =
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.plan_name.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      const isActuallyExpired = new Date(p.expires_at).getTime() <= now;

      if (statusFilter === 'ativo') return p.status === 'ativo' && !isActuallyExpired;
      if (statusFilter === 'vencido') return p.status === 'vencido' || isActuallyExpired;
      if (statusFilter === 'suspenso') return p.status === 'suspenso';
      return true;
    });
  }, [profiles, searchTerm, statusFilter]);

  // Handler de login para a tela de acesso restrito
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const { error } = await signInWithEmail('gleisson1984@gmail.com', adminPassword);
      if (error) {
        setLoginError(error.message || 'Senha incorreta para o administrador.');
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Se estiver carregando auth inicial
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-gray-400">Verificando credenciais Cine Spartan...</span>
        </div>
      </div>
    );
  }

  // TELA DE ACESSO RESTRITO (se não for admin)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 text-white">
        <SEO title="Acesso Restrito — Cine Spartan Admin" noSuffix />
        <div className="w-full max-w-md bg-[#0f141f]/95 border border-red-500/30 rounded-3xl p-8 shadow-2xl shadow-red-950/40 backdrop-blur-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto mb-5 text-red-500 text-3xl shadow-lg shadow-red-950/50">
            <FaLock />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2">Painel Administrativo</h1>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Área de controle de clientes e assinaturas restrita para o administrador mestre:
            <span className="block text-red-400 font-bold mt-1">gleisson1984@gmail.com</span>
          </p>

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-3.5 text-left mb-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                E-mail do Administrador
              </label>
              <input
                type="email"
                disabled
                value="gleisson1984@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-gray-300 text-sm font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Senha do Supabase
              </label>
              <input
                type="password"
                required
                placeholder="Digite sua senha de admin"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-red-500 text-white text-sm focus:outline-none transition-colors"
              />
            </div>

            {loginError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2"
            >
              <FaUserShield />
              <span>{isLoggingIn ? 'Autenticando...' : 'Acessar Painel Master'}</span>
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mx-auto"
          >
            <FaArrowLeft /> Voltar ao Catálogo
          </button>
        </div>
      </div>
    );
  }

  // TELA COMPLETA DO PAINEL ADMINISTRATIVO
  return (
    <div className="min-h-screen bg-[#07090e] text-gray-200 pb-20">
      <SEO title="Painel de Clientes & Assinaturas — Cine Spartan" noSuffix />

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0a0d14]/90 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
              title="Voltar para a Home"
            >
              <FaArrowLeft className="text-sm" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-950/50 text-white text-lg">
                <FaShieldAlt />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight leading-none flex items-center gap-2">
                  Cine<span className="text-red-500">Spartan</span> Admin
                </h1>
                <span className="text-[11px] text-gray-400 font-medium">
                  Controle de Assinaturas & Clientes
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-white">{user?.email}</span>
              <span className="text-[10px] uppercase tracking-wider text-red-400 font-bold">
                Administrador Mestre
              </span>
            </div>
            <button
              onClick={loadProfiles}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition-all"
            >
              <FaRedoAlt className={loading ? 'animate-spin' : ''} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 flex flex-col gap-6">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-sm font-medium animate-in fade-in duration-200 ${
              notification.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs uppercase font-bold hover:underline ml-4"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0f141f]/90 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Clientes</span>
              <FaUsers className="text-blue-400 text-base" />
            </div>
            <span className="text-3xl font-black text-white">{metrics.total}</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f141f]/90 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Ativos</span>
              <FaCheckCircle className="text-emerald-400 text-base" />
            </div>
            <span className="text-3xl font-black text-emerald-400">{metrics.active}</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f141f]/90 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Vencidos</span>
              <FaExclamationTriangle className="text-amber-400 text-base" />
            </div>
            <span className="text-3xl font-black text-amber-400">{metrics.expired}</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f141f]/90 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Suspensos</span>
              <FaBan className="text-red-400 text-base" />
            </div>
            <span className="text-3xl font-black text-red-400">{metrics.suspended}</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0f141f]/90 border border-white/10 shadow-lg">
          <div className="relative flex-1 min-w-[260px]">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input
              type="text"
              placeholder="Buscar por e-mail ou plano..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-red-500/50 text-white text-xs placeholder-gray-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
            {(['all', 'ativo', 'vencido', 'suspenso'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === tab
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'all' ? 'Todos' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl bg-[#0f141f]/90 border border-white/10 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/50 border-b border-white/10 text-gray-400 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Cliente / E-mail</th>
                  <th className="py-3.5 px-4">Plano / Telas</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Validade</th>
                  <th className="py-3.5 px-4 text-right">Ações de Gestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        <span>Carregando clientes do Supabase...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      Nenhum cliente encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map(p => {
                    const isExp = new Date(p.expires_at).getTime() <= Date.now();
                    const isSusp = p.status === 'suspenso';
                    const isAct = p.status === 'ativo' && !isExp;
                    const isMaster = p.email.toLowerCase() === 'gleisson1984@gmail.com';

                    let expDateFormatted = '';
                    try {
                      expDateFormatted = new Intl.DateTimeFormat('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }).format(new Date(p.expires_at));
                    } catch {
                      expDateFormatted = p.expires_at;
                    }

                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* E-mail / Role */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm flex items-center gap-1.5">
                              {p.email}
                              {p.role === 'admin' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-600/30 text-red-400 border border-red-500/40">
                                  ADMIN
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                              ID: {p.id.slice(0, 8)}...
                            </span>
                          </div>
                        </td>

                        {/* Plano / Telas */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-semibold">
                              {p.plan_name}
                            </span>
                            <span className="flex items-center gap-1 text-gray-400 text-[11px]">
                              <FaTv className="text-gray-500" /> {p.max_screens}x
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {isSusp ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                              <FaBan className="text-[10px]" /> Suspenso
                            </span>
                          ) : isExp ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <FaExclamationTriangle className="text-[10px]" /> Vencido
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <FaCheckCircle className="text-[10px]" /> Ativo
                            </span>
                          )}
                        </td>

                        {/* Validade */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="text-gray-200 font-bold">{expDateFormatted}</span>
                            <span
                              className={`text-[10px] font-semibold ${
                                isExp ? 'text-red-400' : 'text-gray-500'
                              }`}
                            >
                              {isExp
                                ? 'Expirou'
                                : `${Math.max(
                                    0,
                                    Math.ceil(
                                      (new Date(p.expires_at).getTime() - Date.now()) /
                                        (1000 * 60 * 60 * 24)
                                    )
                                  )} dias restantes`}
                            </span>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Alternar Status (Ativar / Suspender) */}
                            {!isMaster && (
                              <button
                                type="button"
                                disabled={actionLoadingId === p.id}
                                onClick={() => handleToggleStatus(p)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  p.status === 'suspenso'
                                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
                                    : 'bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/30'
                                }`}
                                title={
                                  p.status === 'suspenso'
                                    ? 'Reativar assinatura do cliente'
                                    : 'Suspender acesso deste cliente'
                                }
                              >
                                {p.status === 'suspenso' ? 'Ativar' : 'Suspender'}
                              </button>
                            )}

                            {/* Botões de Estender Validade */}
                            <div className="inline-flex items-center rounded-lg bg-black/40 border border-white/10 p-0.5">
                              {[30, 60, 90].map(days => (
                                <button
                                  key={days}
                                  type="button"
                                  disabled={actionLoadingId === p.id}
                                  onClick={() => handleExtendSubscription(p, days)}
                                  className="px-2 py-1 text-[11px] font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
                                  title={`Adicionar +${days} dias de assinatura`}
                                >
                                  +{days}d
                                </button>
                              ))}
                            </div>
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
      </main>
    </div>
  );
}
