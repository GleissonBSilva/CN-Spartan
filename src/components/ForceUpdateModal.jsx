import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaDownload, FaSyncAlt, FaShieldAlt, FaTools, FaWhatsapp } from 'react-icons/fa';
import { CURRENT_APP_VERSION } from '../config/appVersion';
import { App as CapApp } from '@capacitor/app';
import { isTvBoxOrApk } from '../hooks/useAppUpdateGuard';

const ForceUpdateModal = ({ reason, config, onRecheck }) => {
  // Se for atualização de APK mas o usuário estiver navegando no PC, não bloqueia
  if (reason === 'UPDATE_REQUIRED' && !isTvBoxOrApk()) {
    return null;
  }
  // Previne que o botão Voltar do controle da TV feche a tela de bloqueio
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'BrowserBack' || e.key === 'GoBack') {
        e.preventDefault();
        e.stopPropagation();
        try {
          CapApp.exitApp();
        } catch {}
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  const handleDownload = () => {
    const url = config?.apkDownloadUrl || 'https://cn-spartan.vercel.app/cinespartan.apk';
    window.open(url, '_system');
  };

  const handleWhatsApp = () => {
    const phone = '5592993746740';
    const text = encodeURIComponent(`Olá! Meu aplicativo Cine Spartan (v${CURRENT_APP_VERSION}) está solicitando liberação de acesso.`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-[#07090e] p-4 select-none">
      {/* Background Decorativo com Luz Vermelha Spartan */}
      <div className="absolute inset-0 bg-radial from-red-600/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent" />

      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-[#0f131d] border border-white/10 p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col items-center text-center">
        
        {/* Ícone de Destaque */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mb-5 bg-gradient-to-br from-red-600/20 to-red-950/40 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
          {(reason === 'UPDATE_REQUIRED' || reason === 'WEB_DISABLED') && <FaDownload className="text-3xl sm:text-4xl text-red-500 animate-bounce" />}
          {(reason === 'MAINTENANCE' || reason === 'APK_DISABLED') && <FaTools className="text-3xl sm:text-4xl text-amber-500 animate-pulse" />}
          {(reason === 'IP_BLOCKED' || reason === 'DEVICE_BLOCKED') && <FaShieldAlt className="text-3xl sm:text-4xl text-red-500" />}
        </div>

        {/* Título Principal */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
          {reason === 'UPDATE_REQUIRED' && 'Atualização Obrigatória'}
          {reason === 'MAINTENANCE' && 'Servidores em Manutenção'}
          {(reason === 'IP_BLOCKED' || reason === 'DEVICE_BLOCKED') && 'Acesso Bloqueado'}
          {reason === 'WEB_DISABLED' && 'Acesso Exclusivo via Aplicativo (APK)'}
          {reason === 'APK_DISABLED' && 'Aplicativo APK em Manutenção'}
        </h2>

        {/* Badge de Versão */}
        {reason === 'UPDATE_REQUIRED' && (
          <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-xs font-bold text-red-400">
            <span>Sua versão: v{CURRENT_APP_VERSION}</span>
            <span>•</span>
            <span>Nova versão: v{config?.latestVersion || config?.minVersion || '1.1.0'}</span>
          </div>
        )}

        {/* Mensagem Explicativa */}
        <p className="mt-4 text-xs sm:text-sm leading-relaxed text-gray-300 max-w-md">
          {reason === 'UPDATE_REQUIRED' && (config?.updateMessage || 'Uma nova versão do aplicativo foi lançada com melhorias de estabilidade, canais ao vivo e correções. Atualize seu aplicativo para continuar assistindo.')}
          {reason === 'MAINTENANCE' && (config?.maintenanceMessage || 'Estamos realizando uma manutenção preventiva para melhorar sua experiência. O serviço será restabelecido em breve.')}
          {(reason === 'IP_BLOCKED' || reason === 'DEVICE_BLOCKED') && 'Este endereço IP ou dispositivo teve o acesso suspenso pela administração do Cine Spartan.'}
          {reason === 'WEB_DISABLED' && 'O acesso via navegador web foi desativado pelo administrador. Baixe e instale o aplicativo oficial Cine Spartan (APK) para continuar assistindo.'}
          {reason === 'APK_DISABLED' && 'O acesso pelo aplicativo APK está temporariamente pausado para atualização dos servidores. Acesse pelo navegador web ou aguarde alguns instantes.'}
        </p>

        {/* Ações / Botões com Foco Automático para Controle Remoto */}
        <div className="mt-6 sm:mt-8 w-full flex flex-col gap-3">
          {(reason === 'UPDATE_REQUIRED' || reason === 'WEB_DISABLED') && (
            <button
              type="button"
              autoFocus
              onClick={handleDownload}
              className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 focus:bg-red-500 focus:ring-4 focus:ring-red-400/50 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)] cursor-pointer"
            >
              <FaDownload className="text-base sm:text-lg" />
              <span>{reason === 'WEB_DISABLED' ? 'Baixar Aplicativo Oficial (APK)' : 'Baixar Atualização (APK)'}</span>
            </button>
          )}

          {(reason === 'MAINTENANCE' || reason === 'APK_DISABLED') && (
            <button
              type="button"
              autoFocus
              onClick={onRecheck}
              className="w-full py-3.5 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 focus:bg-amber-500 focus:ring-4 focus:ring-amber-400/50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <FaSyncAlt className="text-base" />
              <span>Verificar Novamente</span>
            </button>
          )}

          {(reason === 'IP_BLOCKED' || reason === 'DEVICE_BLOCKED') && (
            <button
              type="button"
              autoFocus
              onClick={handleWhatsApp}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 focus:bg-emerald-500 focus:ring-4 focus:ring-emerald-400/50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <FaWhatsapp className="text-lg" />
              <span>Contatar Suporte no WhatsApp</span>
            </button>
          )}

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[11px] text-gray-500">Cine Spartan TV • Sistema de Segurança v{CURRENT_APP_VERSION}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

ForceUpdateModal.propTypes = {
  reason: PropTypes.string,
  config: PropTypes.object,
  onRecheck: PropTypes.func
};

export default ForceUpdateModal;
