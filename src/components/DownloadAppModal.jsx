import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaDownload,
  FaAndroid,
  FaTv,
  FaTimes,
  FaCheck,
  FaCopy,
  FaExternalLinkAlt,
  FaShieldAlt,
  FaBolt,
  FaMobileAlt,
  FaFilm
} from 'react-icons/fa';
import { BiTv, BiMobile, BiLaptop } from 'react-icons/bi';

export default function DownloadAppModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('android');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const downloadUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/cinespartan.apk`
    : 'https://cn-spartan.vercel.app/cinespartan.apk';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
      {/* Backdrop escuro com blur */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#131722] via-[#0d1017] to-[#0a0c10] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl shadow-red-950/40 p-4 sm:p-6 md:p-8 text-white z-10 max-h-[92vh] overflow-y-auto hide-scrollbar">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors"
          aria-label="Fechar"
        >
          <FaTimes className="text-base sm:text-lg" />
        </button>

        {/* Cabeçalho do Modal */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 p-0.5 shadow-lg shadow-red-600/40 mb-3.5 flex items-center justify-center">
            <div className="w-full h-full bg-black/60 rounded-[14px] flex items-center justify-center">
              <FaDownload className="text-2xl sm:text-3xl text-red-400 animate-bounce" />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
              Oficial CineSpartan
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <FaShieldAlt className="text-[9px]" /> 100% Sem Anúncios
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            Baixar Aplicativo <span className="text-red-500">CineSpartan</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mt-1">
            Assista filmes, séries e canais ao vivo em alta definição no seu celular, TV Box e Smart TV.
          </p>
        </div>

        {/* Seletor de Plataforma (Tabs) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 ring-1 ring-white/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FaAndroid className="text-base sm:text-lg" />
            <span>Celular Android</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tvbox')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tvbox'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 ring-1 ring-white/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FaTv className="text-base sm:text-lg" />
            <span>TV Box / Fire TV</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('smarttv')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'smarttv'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 ring-1 ring-white/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BiTv className="text-lg sm:text-xl" />
            <span>Smart TV</span>
          </button>
        </div>

        {/* Conteúdo da Tab: Android (Celular / Tablet) */}
        {activeTab === 'android' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <FaAndroid className="text-2xl" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">CineSpartan APK v2.1.0</h4>
                  <p className="text-xs text-gray-400">Android 7.0 ou superior • 70 MB • Ultra HD 4K</p>
                </div>
              </div>

              <a
                href="/cinespartan.apk"
                download="cinespartan.apk"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-sm shadow-xl shadow-red-950/60 transition-all hover:scale-105 active:scale-95"
              >
                <FaDownload className="text-xs" />
                <span>Baixar APK Direto</span>
              </a>
            </div>

            {/* Como Instalar no Celular */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-left">
              <h5 className="font-bold text-xs uppercase tracking-wider text-gray-300 mb-2.5 flex items-center gap-1.5">
                <FaBolt className="text-amber-400" /> Passo a Passo de Instalação:
              </h5>
              <ol className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-400 font-black flex items-center justify-center shrink-0 text-[11px] border border-red-500/40">1</span>
                  <span>Clique no botão vermelho acima para <b>Baixar APK Direto</b>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-400 font-black flex items-center justify-center shrink-0 text-[11px] border border-red-500/40">2</span>
                  <span>Ao concluir o download, abra o arquivo. Se o Android solicitar, permita <i>"Instalar de fontes desconhecidas"</i>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-400 font-black flex items-center justify-center shrink-0 text-[11px] border border-red-500/40">3</span>
                  <span>Abra o app, faça login com seu e-mail e senha e aproveite tudo sem anúncios!</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Conteúdo da Tab: TV Box / Fire Stick */}
        {activeTab === 'tvbox' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-black text-xs border border-red-500/30">
                  <FaTv />
                </span>
                <h4 className="font-bold text-white text-sm sm:text-base">Instalação via App Downloader (Recomendado)</h4>
              </div>
              <p className="text-xs text-gray-300 mb-3">
                Para instalar na sua TV Box, Fire Stick ou Mi Box sem precisar de pen drive, use o aplicativo oficial <b>Downloader</b> (ícone laranja).
              </p>

              {/* Link para digitar no Downloader */}
              <div className="bg-black/60 border border-white/15 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-left overflow-hidden">
                  <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Link direto para digitar no Downloader:</span>
                  <span className="text-xs sm:text-sm font-mono text-red-400 font-bold select-all truncate block">
                    {downloadUrl}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 cursor-pointer shrink-0"
                >
                  {copied ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                  <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>
            </div>

            {/* Passo a Passo TV Box */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-left">
              <h5 className="font-bold text-xs uppercase tracking-wider text-gray-300 mb-2.5 flex items-center gap-1.5">
                <FaBolt className="text-amber-400" /> 3 Passos Simples na sua TV Box:
              </h5>
              <ol className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-400 font-black flex items-center justify-center shrink-0 text-[11px] border border-red-500/40">1</span>
                  <span>Na loja de apps da sua TV Box / Fire Stick, pesquise por <b>Downloader</b> e instale.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-400 font-black flex items-center justify-center shrink-0 text-[11px] border border-red-500/40">2</span>
                  <span>Abra o Downloader e no campo de URL digite o link acima e clique no botão <b>GO</b>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-400 font-black flex items-center justify-center shrink-0 text-[11px] border border-red-500/40">3</span>
                  <span>O download iniciará automaticamente. Ao concluir, clique em <b>Install</b> e pronto!</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Conteúdo da Tab: Smart TV (Samsung / LG / Roku) */}
        {activeTab === 'smarttv' && (
          <div className="space-y-3.5 animate-fadeIn text-left">
            {/* Opção 1: Navegador da TV */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                  Método 1 • Sem Instalar Nada
                </span>
                <span className="text-xs font-bold text-white">Navegador da Smart TV</span>
              </div>
              <p className="text-xs text-gray-300 mb-2.5">
                Smart TVs Samsung (Tizen) e LG (webOS) rodam o CineSpartan diretamente pelo navegador oficial da TV com suporte a controle remoto:
              </p>
              <ol className="space-y-1.5 text-xs text-gray-300 list-decimal list-inside pl-1">
                <li>Abra o navegador da sua TV (<b>Internet</b> na Samsung ou <b>Web Browser</b> na LG).</li>
                <li>Acesse o endereço: <span className="font-mono text-red-400 font-bold select-all">https://cn-spartan.vercel.app</span></li>
                <li>Adicione a página aos <b>Favoritos</b> ou à <b>Tela Inicial</b> da TV.</li>
              </ol>
            </div>

            {/* Opção 2: Transmitir do Celular */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-wider border border-purple-500/30">
                  Método 2 • Rápido
                </span>
                <span className="text-xs font-bold text-white">Transmitir / Espelhar do Celular</span>
              </div>
              <p className="text-xs text-gray-300">
                Abra o CineSpartan no seu celular (navegador ou APK) e utilize a função <b>Smart View</b>, <b>Chromecast</b> ou <b>AirPlay</b> para transmitir a imagem diretamente para sua Smart TV.
              </p>
            </div>

            {/* Opção 3: TV Box HDMI */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  Método 3 • Máxima Performance
                </span>
                <span className="text-xs font-bold text-white">Aparelho TV Box ou Fire Stick</span>
              </div>
              <p className="text-xs text-gray-300">
                Conecte um dispositivo Android TV ou Amazon Fire Stick na entrada HDMI da sua Smart TV para instalar nosso app oficial nativo com 60 FPS e resposta rápida pelo controle.
              </p>
            </div>
          </div>
        )}

        {/* Rodapé do Modal */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Servidores com sincronização contínua de reprodução</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

DownloadAppModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
