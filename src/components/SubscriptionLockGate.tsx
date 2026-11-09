import React from 'react';
import { FaLock, FaBan, FaCalendarTimes, FaWhatsapp, FaUserCheck, FaRedoAlt } from 'react-icons/fa';
import { useAuthProfile } from '../hooks/useAuthProfile';

interface SubscriptionLockGateProps {
  onOpenAuth?: () => void;
  title?: string;
}

export default function SubscriptionLockGate({ onOpenAuth, title }: SubscriptionLockGateProps) {
  const { user, profile, isExpired, isSuspended, formattedExpiration, refreshProfile, loading } = useAuthProfile();

  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5592993746740';

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá! Gostaria de assinar/renovar meu plano no Cine Spartan. Meu e-mail é: ${user?.email || 'novo cliente'}`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
  };

  const handleOpenLogin = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      window.dispatchEvent(new Event('openAuthModal'));
    }
  };

  if (loading) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-[#090c14] border border-white/10 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm font-semibold text-gray-400">Verificando status de assinatura...</span>
      </div>
    );
  }

  // CASO 1: Usuário não autenticado
  if (!user) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-[#0c0f18] via-[#090b12] to-black border border-red-500/30 flex flex-col items-center justify-center p-6 sm:p-10 text-center shadow-2xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute inset-0 bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 text-3xl flex items-center justify-center mb-4 shadow-lg shadow-red-950/60">
            <FaLock />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
            Acesso Exclusivo para Assinantes
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-6">
            O catálogo e player do <strong className="text-white">Cine Spartan</strong> são protegidos. Faça login com sua conta ou assine para liberar este título em alta definição.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <button
              type="button"
              onClick={handleOpenLogin}
              className="flex-1 min-w-[160px] py-3 px-5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <FaUserCheck />
              <span>Entrar / Cadastrar</span>
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 min-w-[160px] py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <FaWhatsapp className="text-lg" />
              <span>Assinar no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CASO 2: Conta suspensa
  if (isSuspended) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-[#120a0d] via-[#0b0709] to-black border border-red-600/40 flex flex-col items-center justify-center p-6 sm:p-10 text-center shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-md flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 text-3xl flex items-center justify-center mb-4 shadow-lg shadow-red-950/60">
            <FaBan />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
            Acesso Temporariamente Suspenso
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-6">
            Sua conta <strong className="text-white">{user.email}</strong> foi suspensa pelo administrador. Entre em contato com a equipe de suporte para reativação.
          </p>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="py-3 px-6 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <FaWhatsapp className="text-lg" />
            <span>Falar com o Suporte (WhatsApp)</span>
          </button>
        </div>
      </div>
    );
  }

  // CASO 3: Assinatura ou Teste Grátis vencido
  if (isExpired) {
    const isTrialExpired = profile?.is_trial || profile?.plan_name?.toLowerCase().includes('teste');

    return (
      <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-[#150f08] via-[#0d0905] to-black border border-amber-500/40 flex flex-col items-center justify-center p-6 sm:p-10 text-center shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-md flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-3xl flex items-center justify-center mb-4 shadow-lg shadow-amber-950/60">
            <FaCalendarTimes />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
            {isTrialExpired ? 'Seu Teste Grátis Expirou' : 'Assinatura Cine Spartan Vencida'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-2">
            {isTrialExpired
              ? 'Esperamos que tenha gostado da experiência! Para continuar assistindo sem limites em Full HD e 4K, ative sua assinatura via Pix agora mesmo.'
              : `Sua assinatura do plano ${profile?.plan_name || 'Mensal'} expirou em:`}
          </p>
          <div className="px-3.5 py-1.5 rounded-full bg-black/60 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold mb-6">
            {isTrialExpired ? 'Degustação Finalizada' : formattedExpiration}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 min-w-[160px] py-3 px-5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl shadow-lg shadow-amber-950/60 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <FaWhatsapp className="text-lg" />
              <span>{isTrialExpired ? 'Liberar Acesso via Pix' : 'Renovar Assinatura'}</span>
            </button>

            <button
              type="button"
              onClick={() => refreshProfile()}
              className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 text-sm"
              title="Já pagou? Clique para atualizar o status da sua conta"
            >
              <FaRedoAlt className="text-xs" />
              <span>Já paguei</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
