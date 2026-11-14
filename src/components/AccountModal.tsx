import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes,
  FaUserCircle,
  FaCalendarAlt,
  FaTv,
  FaShieldAlt,
  FaWhatsapp,
  FaQrcode,
  FaCopy,
  FaCheck,
  FaExchangeAlt,
  FaKey,
  FaSignOutAlt,
  FaBolt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLock,
  FaMobileAlt,
} from 'react-icons/fa';
import { useAuthProfile } from '../hooks/useAuthProfile';
import { getLocalDeviceId, getLocalDeviceName, type ActiveDevice } from '../hooks/useScreenLimiter';
import { supabase } from '../lib/supabase';
import { DEFAULT_PLANS, getSavedPlans, type PlanTier } from '../constants/plans';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'assinatura' | 'planos' | 'dados';
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'assinatura',
}) => {
  const {
    user,
    profile,
    isActive,
    isExpired,
    isSuspended,
    daysRemaining,
    formattedExpiration,
    refreshProfile,
    signOut,
  } = useAuthProfile();

  const [activeTab, setActiveTab] = useState<'assinatura' | 'planos' | 'dados'>(defaultTab);

  // Estados de Edição de Perfil
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [savingData, setSavingData] = useState(false);

  // Estados de Troca de Senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Estados de Notificação
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de Pix e Cópia
  const [copiedPix, setCopiedPix] = useState(false);
  const [showPixDetails, setShowPixDetails] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const plans = getSavedPlans().length > 0 ? getSavedPlans() : DEFAULT_PLANS;

  // Carregar dados iniciais do perfil
  useEffect(() => {
    if (user || profile) {
      setFullName(
        profile?.full_name ||
          user?.user_metadata?.full_name ||
          user?.user_metadata?.display_name ||
          profile?.email?.split('@')[0] ||
          user?.email?.split('@')[0] ||
          ''
      );
      setWhatsapp(profile?.whatsapp || user?.user_metadata?.whatsapp || '');
    }
  }, [user, profile]);

  // Redefine a aba inicial apenas na abertura da modal (evita travar e resetar a troca de abas)
  const prevOpenRef = React.useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setActiveTab(defaultTab);
      setMessage(null);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  // Status visual da conta
  const isTrial = profile?.is_trial || profile?.plan_name?.toLowerCase().includes('teste');
  const currentPlanName = profile?.plan_name || 'SPARTAN PRO';
  const maxScreens = profile?.max_screens || 1;

  // Configuração Pix do sistema
  const savedPix = localStorage.getItem('spartan_pix_config');
  const pixConfig = savedPix
    ? JSON.parse(savedPix)
    : { key: 'gleisson1984@gmail.com', recipientName: 'Gleisson B Silva', city: 'Manaus' };

  const handleCopyPix = () => {
    const payload = `00020126580014br.gov.bcb.pix0136${pixConfig.key}520400005303986540599.005802BR5913${pixConfig.recipientName.slice(0, 13).toUpperCase()}6009${(pixConfig.city || 'MANAUS').slice(0, 9).toUpperCase()}62070503***6304E8A2`;
    navigator.clipboard.writeText(payload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  // Salvar Informações de Contato / Nome
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !profile) return;
    setSavingData(true);
    setMessage(null);

    try {
      const targetId = profile?.id || user?.id || '';
      const targetEmail = (profile?.email || user?.email || '').toLowerCase();
      const nowIso = new Date().toISOString();

      // 1. Atualiza registro local sincronizado com o Painel Admin
      try {
        const regList = JSON.parse(localStorage.getItem('spartan_registered_profiles') || '[]');
        if (Array.isArray(regList)) {
          const updatedList = regList.map((item) =>
            item.id === targetId || item.email?.toLowerCase() === targetEmail
              ? {
                  ...item,
                  full_name: fullName.trim() || item.full_name,
                  whatsapp: whatsapp.trim() || item.whatsapp,
                  admin_updated_at: nowIso,
                }
              : item
          );
          localStorage.setItem('spartan_registered_profiles', JSON.stringify(updatedList));
        }
        const rawWeflix = localStorage.getItem('weflix_user');
        if (rawWeflix) {
          const parsedWeflix = JSON.parse(rawWeflix);
          localStorage.setItem(
            'weflix_user',
            JSON.stringify({
              ...parsedWeflix,
              displayName: fullName.trim() || parsedWeflix.displayName,
              full_name: fullName.trim() || parsedWeflix.full_name,
              whatsapp: whatsapp.trim() || parsedWeflix.whatsapp,
            })
          );
        }
      } catch {
        // ignore
      }

      // 2. Atualizar user_metadata no Supabase Auth (se houver sessão ativa)
      try {
        await supabase.auth.updateUser({
          data: { full_name: fullName.trim(), whatsapp: whatsapp.trim() },
        });
      } catch {
        // ignore
      }

      // 3. Atualizar tabela profiles no Supabase
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
        try {
          await supabase
            .from('profiles')
            .update({ full_name: fullName.trim() || null, whatsapp: whatsapp.trim() || null })
            .eq('id', targetId);
        } catch {
          // ignore
        }
      }

      window.dispatchEvent(new Event('spartan_auth_updated'));
      await refreshProfile();
      setMessage({ type: 'success', text: 'Seus dados foram atualizados com sucesso!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar dados.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSavingData(false);
    }
  };

  // Alterar Senha
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar senha.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSavingPassword(false);
    }
  };

  // Solicitar Troca de Plano
  const handleRequestPlanChange = async (plan: PlanTier) => {
    setMessage(null);
    try {
      const targetId = profile?.id || user?.id || '';
      const targetEmail = (profile?.email || user?.email || '').toLowerCase();
      const nowIso = new Date().toISOString();

      // 1. Atualiza imediatamente no registro compartilhado com o Painel Admin e na sessão local
      try {
        const regList = JSON.parse(localStorage.getItem('spartan_registered_profiles') || '[]');
        if (Array.isArray(regList)) {
          const updatedList = regList.map((item) =>
            item.id === targetId || item.email?.toLowerCase() === targetEmail
              ? {
                  ...item,
                  plan_name: plan.name,
                  max_screens: Number(plan.screens),
                  admin_updated_at: nowIso,
                }
              : item
          );
          localStorage.setItem('spartan_registered_profiles', JSON.stringify(updatedList));
        }
        const rawWeflix = localStorage.getItem('weflix_user');
        if (rawWeflix) {
          const parsedWeflix = JSON.parse(rawWeflix);
          localStorage.setItem(
            'weflix_user',
            JSON.stringify({
              ...parsedWeflix,
              plan_name: plan.name,
              max_screens: Number(plan.screens),
            })
          );
        }
      } catch {
        // ignore
      }

      // 2. Registrar preferência no perfil do Supabase
      if (targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
        try {
          await supabase
            .from('profiles')
            .update({
              plan_name: plan.name,
              max_screens: plan.screens,
            })
            .eq('id', targetId);
        } catch {
          // ignore
        }
      }

      window.dispatchEvent(new Event('spartan_auth_updated'));
      await refreshProfile();

      // Montar mensagem para o WhatsApp do suporte
      const textMsg = encodeURIComponent(
        `Olá! Sou o cliente ${user?.email || ''} e gostaria de migrar meu plano Cine Spartan para o ${plan.name} (${plan.screens} telas) por R$ ${plan.monthlyPrice.toFixed(2)}/mês. Como faço o pagamento via Pix?`
      );
      window.open(`https://wa.me/5592993746740?text=${textMsg}`, '_blank');
      setMessage({
        type: 'success',
        text: `Solicitação para o plano ${plan.name} enviada! Finalize pelo WhatsApp ou realize o Pix para ativação imediata.`,
      });
      setShowPixDetails(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao solicitar troca de plano.';
      setMessage({ type: 'error', text: msg });
    }
  };

  // Desconectar Outras Telas
  const handleDisconnectOtherScreens = async () => {
    setDisconnecting(true);
    try {
      const myDeviceId = getLocalDeviceId();
      const myDeviceName = getLocalDeviceName();
      const mySession: ActiveDevice[] = [
        {
          deviceId: myDeviceId,
          deviceName: myDeviceName,
          lastPing: Date.now(),
        },
      ];

      const targetId = profile?.id || user?.id;
      if (targetId) {
        try {
          localStorage.setItem(`cinespartan_active_devices_${targetId}`, JSON.stringify(mySession));
        } catch {}

        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
          try {
            await supabase
              .from('profiles')
              .update({ active_devices: mySession })
              .eq('id', targetId);
          } catch {}
        }
      }

      try {
        await supabase.auth.updateUser({
          data: {
            active_devices: mySession,
          },
        });
      } catch {}

      setMessage({ type: 'success', text: 'Todas as outras telas foram desconectadas com sucesso!' });
    } catch {
      setMessage({ type: 'error', text: 'Não foi possível desconectar as outras telas no momento.' });
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#0f0f18] border border-purple-900/50 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden relative"
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition"
          aria-label="Fechar"
        >
          <FaTimes />
        </button>

        {/* Cabeçalho do Perfil */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-950/40 via-red-950/20 to-black/60 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-red-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-purple-950/60 font-black shrink-0">
              {fullName ? fullName.slice(0, 2).toUpperCase() : <FaUserCircle />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white">{fullName || 'Minha Conta'}</h2>
                {isSuspended ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Suspenso
                  </span>
                ) : isExpired ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                    <FaLock className="text-[9px]" /> Vencido
                  </span>
                ) : isTrial ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <FaBolt className="text-[9px]" /> Teste Grátis
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <FaCheckCircle className="text-[9px]" /> Ativo
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Badge do Plano Atual */}
          <div className="bg-black/40 border border-purple-500/30 px-3.5 py-2 rounded-xl text-right self-start sm:self-auto">
            <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider block">
              {isTrial ? 'Plano Selecionado (Em Teste)' : 'Plano Contratado'}
            </span>
            <span className="text-sm font-black text-white">{currentPlanName}</span>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-white/5 bg-black/40 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('assinatura');
              setMessage(null);
            }}
            className={`pb-3 px-3 transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'assinatura' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FaShieldAlt className="text-purple-400" />
            <span>Minha Assinatura</span>
            {activeTab === 'assinatura' && (
              <motion.div
                layoutId="accountTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-red-500"
              />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('planos');
              setMessage(null);
            }}
            className={`pb-3 px-3 transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'planos' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FaExchangeAlt className="text-purple-400" />
            <span>Trocar de Plano</span>
            {activeTab === 'planos' && (
              <motion.div
                layoutId="accountTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-red-500"
              />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('dados');
              setMessage(null);
            }}
            className={`pb-3 px-3 transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'dados' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FaUserCircle className="text-purple-400" />
            <span>Meus Dados</span>
            {activeTab === 'dados' && (
              <motion.div
                layoutId="accountTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-red-500"
              />
            )}
          </button>
        </div>

        {/* Feedback de Notificações */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mx-5 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
                message.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/60 border-red-500/40 text-red-200'
              }`}
            >
              {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
              <span>{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conteúdo com Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* ABA 1: MINHA ASSINATURA */}
          {activeTab === 'assinatura' && (
            <div className="space-y-5">
              {/* Banner Informativo de Teste Grátis */}
              {isTrial && isActive && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-xs text-amber-200 flex items-start gap-2.5 shadow-sm">
                  <FaBolt className="text-amber-400 text-sm shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Período de Teste Grátis Ativo ({daysRemaining}d restantes):</strong> Aproveite sua degustação completa! O seu plano mensal <strong>{currentPlanName}</strong> entrará em vigor oficialmente após a renovação e confirmação do pagamento via Pix.
                  </div>
                </div>
              )}

              {/* Cartões de Métricas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Vencimento */}
                <div className="bg-black/50 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      {isTrial ? 'Fim do Teste Grátis' : 'Vencimento'}
                    </span>
                    <span className="text-xs font-bold text-white block mt-0.5">
                      {formattedExpiration}
                    </span>
                  </div>
                </div>

                {/* Dias Restantes */}
                <div className="bg-black/50 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? (isTrial ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400') : 'bg-red-500/10 text-red-400'
                  }`}>
                    <FaBolt />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      {isTrial ? 'Período de Teste' : 'Validade'}
                    </span>
                    <span className={`text-xs font-black block mt-0.5 ${
                      isActive ? (isTrial ? 'text-amber-400' : 'text-emerald-400') : 'text-red-400'
                    }`}>
                      {isActive
                        ? (isTrial ? `${daysRemaining} ${daysRemaining === 1 ? 'dia de teste' : 'dias de teste'}` : `${daysRemaining} ${daysRemaining === 1 ? 'dia restante' : 'dias restantes'}`)
                        : (isTrial ? 'Teste Expirado' : 'Acesso Vencido')}
                    </span>
                    </span>
                  </div>
                </div>

                {/* Telas Simultâneas */}
                <div className="bg-black/50 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <FaTv />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Limite de Telas</span>
                    <span className="text-xs font-bold text-white block mt-0.5">
                      {maxScreens} {maxScreens > 1 ? 'Telas Simultâneas' : 'Tela Simultânea'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Aviso se a conta estiver vencida ou em teste */}
              {isExpired && (
                <div className="bg-red-950/40 border border-red-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-xl shrink-0">
                      <FaLock />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Sua assinatura expirou</h4>
                      <p className="text-xs text-red-300">
                        Renove agora via Pix instantâneo para continuar assistindo imediatamente!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPixDetails(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition shrink-0"
                  >
                    Pagar / Renovar Pix
                  </button>
                </div>
              )}

              {/* Botões de Ação Rápida */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Botão Pix */}
                <button
                  onClick={() => setShowPixDetails((prev) => !prev)}
                  className="p-3.5 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 rounded-xl flex items-center justify-between transition group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <FaQrcode />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Dados de Pagamento Pix</span>
                      <span className="text-[11px] text-emerald-300">Chave Pix, QR Code & Confirmação</span>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold group-hover:translate-x-1 transition-transform">
                    {showPixDetails ? 'Ocultar ▲' : 'Ver ▼'}
                  </span>
                </button>

                {/* Botão Suporte WhatsApp */}
                <a
                  href={`https://wa.me/5592993746740?text=${encodeURIComponent(
                    `Olá Cine Spartan! Sou o cliente ${user?.email || ''}. Minha assinatura está no plano ${currentPlanName}. Gostaria de tirar dúvidas ou renovar.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-xl flex items-center justify-between transition group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
                      <FaWhatsapp />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Falar com o Administrador</span>
                      <span className="text-[11px] text-gray-400">Atendimento e suporte via WhatsApp</span>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold group-hover:translate-x-1 transition-transform">
                    Abrir →
                  </span>
                </a>
              </div>

              {/* Caixa Expansível de Detalhes Pix */}
              <AnimatePresence>
                {showPixDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-black/60 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <FaQrcode className="text-emerald-400" />
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">
                          Pagamento Instantâneo Pix Spartan
                        </h4>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-bold">Liberação Imediata</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                          Chave Pix (E-mail)
                        </span>
                        <span className="font-mono text-emerald-300 font-bold block select-all">
                          {pixConfig.key}
                        </span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                          Titular / Beneficiário
                        </span>
                        <span className="text-gray-200 font-bold block">{pixConfig.recipientName}</span>
                      </div>
                    </div>

                    {/* Copiar Chave */}
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      {copiedPix ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                      <span>{copiedPix ? 'Chave Pix Copiada com Sucesso!' : 'Copiar Chave Pix'}</span>
                    </button>

                    <p className="text-[11px] text-gray-400 text-center">
                      Após realizar o Pix, envie o comprovante no WhatsApp com o e-mail{' '}
                      <strong className="text-purple-300">{user?.email}</strong> para liberação imediata.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Gestão de Dispositivos Conectados */}
              <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 text-gray-300 flex items-center justify-center">
                    <FaMobileAlt />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Dispositivos Conectados</h5>
                    <p className="text-[11px] text-gray-400">
                      Plano permite até <strong className="text-purple-400">{maxScreens}</strong> conexões ao mesmo tempo.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectOtherScreens}
                  disabled={disconnecting}
                  className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-semibold border border-white/10 transition disabled:opacity-50"
                >
                  {disconnecting ? 'Desconectando...' : 'Desconectar Outras Telas'}
                </button>
              </div>
            </div>
          )}

          {/* ABA 2: TROCAR DE PLANO */}
          {activeTab === 'planos' && (
            <div className="space-y-4">
              <div className="text-center sm:text-left">
                <h3 className="text-sm font-black text-white">Escolha o Melhor Plano para Você</h3>
                <p className="text-xs text-gray-400">
                  Faça upgrade a qualquer momento para ter mais telas simultâneas e assistir em mais aparelhos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {plans.map((pl) => {
                  const isCurrent = pl.name.toLowerCase() === currentPlanName.toLowerCase();
                  return (
                    <div
                      key={pl.id}
                      className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-purple-950/40 border-purple-500/80 shadow-lg shadow-purple-950/40'
                          : 'bg-black/40 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {pl.badge && (
                        <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-purple-600 to-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                          {pl.badge}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-black text-white">{pl.name}</h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <FaCheck /> Atual
                            </span>
                          )}
                        </div>

                        <div className="my-3">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-white">
                              R$ {pl.monthlyPrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">/mês</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-[11px] text-gray-300 py-2 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <FaTv className="text-purple-400 text-xs shrink-0" />
                            <span>
                              <strong>{pl.screens}</strong> {pl.screens > 1 ? 'Telas Simultâneas' : 'Tela Individual'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaCheckCircle className="text-emerald-400 text-xs shrink-0" />
                            <span>{pl.quality}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">{pl.description}</p>
                        </div>
                      </div>

                      <div className="pt-4 mt-auto">
                        {isCurrent ? (
                          <div className="w-full py-2 bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold text-xs rounded-xl text-center">
                            Seu Plano Atual
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRequestPlanChange(pl)}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                          >
                            Mudar para Este Plano
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-black/50 border border-purple-900/30 p-3.5 rounded-xl text-center text-xs text-gray-300">
                💡 Precisa de um plano customizado com mais de 4 telas para seu comércio ou condomínio?{' '}
                <a
                  href={`https://wa.me/5592993746740?text=${encodeURIComponent(
                    `Olá! Gostaria de um plano personalizado com mais de 4 telas para minha conta ${user?.email || ''}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 font-bold underline hover:text-purple-300"
                >
                  Fale com nosso suporte
                </a>
                .
              </div>
            </div>
          )}

          {/* ABA 3: MEUS DADOS */}
          {activeTab === 'dados' && (
            <div className="space-y-6">
              {/* Formulário de Informações de Contato */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h4 className="text-xs font-black uppercase text-purple-300 tracking-wider">
                  Informações Pessoais
                </h4>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    E-mail da Conta (Login)
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 bg-black/40 border border-gray-800 rounded-xl text-xs text-gray-400 font-mono cursor-not-allowed"
                  />
                  <span className="text-[10px] text-gray-500 block mt-1">
                    O e-mail é o identificador único da sua conta Cine Spartan.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">
                      WhatsApp com DDD
                    </label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Ex: 92993746740"
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingData}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {savingData ? 'Salvando...' : 'Salvar Informações Pessoais'}
                </button>
              </form>

              <hr className="border-white/5" />

              {/* Alterar Senha */}
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="flex items-center gap-2">
                  <FaKey className="text-purple-400" />
                  <h4 className="text-xs font-black uppercase text-purple-300 tracking-wider">
                    Alterar Senha de Acesso
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">Nova Senha</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full px-3 py-2 bg-black/60 border border-gray-800 focus:border-purple-500 rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPassword || !newPassword}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  {savingPassword ? 'Alterando senha...' : 'Atualizar Minha Senha'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-black/60 border-t border-white/5 flex items-center justify-between">
          <button
            type="button"
            onClick={async () => {
              onClose();
              await signOut();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition"
          >
            <FaSignOutAlt />
            <span>Sair da Conta (Logout)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountModal;
