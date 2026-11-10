import { memo, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaExpand, FaCompress, FaVolumeUp, FaClosedCaptioning, FaSyncAlt, FaCheck, FaChevronDown } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuthProfile } from '../../../hooks/useAuthProfile';
import SubscriptionLockGate from '../../../components/SubscriptionLockGate';

// Idiomas e Legendas Principais
export const AUDIO_OPTIONS = [
  { code: 'pt', label: 'Português', subLabel: 'Dublado BR', flag: '🇧🇷' },
  { code: 'en', label: 'Inglês', subLabel: 'Original', flag: '🇺🇸' },
  { code: 'es', label: 'Espanhol', subLabel: 'Español', flag: '🇪🇸' },
  { code: 'ko', label: 'Coreano', subLabel: '한국어', flag: '🇰🇷' },
  { code: 'ja', label: 'Japonês', subLabel: '日本語', flag: '🇯🇵' },
  { code: 'fr', label: 'Francês', subLabel: 'Français', flag: '🇫🇷' },
];

export const SUBTITLE_OPTIONS = [
  { code: 'pt', label: 'Português', subLabel: 'Brasil', flag: '🇧🇷' },
  { code: 'en', label: 'Inglês', subLabel: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Espanhol', subLabel: 'Español', flag: '🇪🇸' },
  { code: 'ko', label: 'Coreano', subLabel: '한국어', flag: '🇰🇷' },
  { code: 'ja', label: 'Japonês', subLabel: '日本語', flag: '🇯🇵' },
  { code: 'off', label: 'Desativada', subLabel: 'Sem legendas', flag: '🚫' },
];

// Gerador de rotas de transmissão dinâmicas com Servidor Principal fixo para Séries/Animes
const getSourcesForAudio = (audioCode, subtitleCode) => {
  return [
    // ⭐ 1. SERVIDOR PRINCIPAL FIXO (Cine Spartan Ultra HD - Direto sem anúncios, com CC no player)
    {
      id: 'vidlink_principal',
      name: 'Servidor Principal (Ultra HD)',
      url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&iconColor=ef4444`
    },
    // 🇧🇷 2. SERVIDOR DUBLADO BR (SuperFlix - Com áudio dublado em português)
    {
      id: 'superflix_dublado',
      name: 'Servidor Dublado BR (Português)',
      url: (id, s, e) => `https://superflixapi.bond/serie/${id}/${s}/${e}`
    },
    // 🌐 3. Servidor Alternativo (Embed.su)
    {
      id: 'embedsu_alt',
      name: 'Servidor Alternativo 1 (Embed.su)',
      url: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`
    },
    // 🎬 4. Servidor Alternativo 2 (VidSrc)
    {
      id: 'vidsrc_alt',
      name: 'Servidor Alternativo 2 (VidSrc)',
      url: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
    }
  ];
};

const VideoPlayer = ({ tvId, season = 1, episode = 1, title, backdrop, poster }) => {
    const { language } = useLanguage();
    const { isActive, isAdmin } = useAuthProfile();
    const canPlay = isAdmin || isActive;

    // Resolução do idioma padrão com base no Painel do Usuário
    const resolveDefaultAudio = useCallback(() => {
        const saved = localStorage.getItem('cinespartan_preferred_audio');
        if (saved) return saved;
        if (language?.startsWith('en')) return 'en';
        if (language?.startsWith('es')) return 'es';
        if (language?.startsWith('ko')) return 'ko';
        if (language?.startsWith('ja')) return 'ja';
        if (language?.startsWith('fr')) return 'fr';
        return 'pt'; // Português como padrão principal
    }, [language]);

    const resolveDefaultSubtitle = useCallback(() => {
        const saved = localStorage.getItem('cinespartan_preferred_subtitle');
        if (saved) return saved;
        if (language?.startsWith('en')) return 'en';
        if (language?.startsWith('es')) return 'es';
        if (language?.startsWith('ko')) return 'ko';
        if (language?.startsWith('ja')) return 'ja';
        return 'pt'; // Português como legenda principal
    }, [language]);

    const [selectedAudio, setSelectedAudio] = useState(resolveDefaultAudio);
    const [selectedSubtitle, setSelectedSubtitle] = useState(resolveDefaultSubtitle);

    // Dropdowns do display
    const [openAudioMenu, setOpenAudioMenu] = useState(false);
    const [openSubtitleMenu, setOpenSubtitleMenu] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Estado da reprodução e auto-hide dos controles
    const [hasStarted, setHasStarted] = useState(false);
    const [sourceIdx, setSourceIdx] = useState(0);
    const [serverStatus, setServerStatus] = useState('parado');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const playerContainerRef = useRef(null);
    const watchdogTimerRef = useRef(null);
    const toastTimerRef = useRef(null);
    const hideControlsTimerRef = useRef(null);

    // Fontes ativas baseadas no idioma de áudio e legendas selecionados
    const availableSources = getSourcesForAudio(selectedAudio, selectedSubtitle);
    const activeServer = availableSources[sourceIdx] || availableSources[0];

    // Função para manter controles discretos e fazê-los sumir após 3s de inatividade
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (hideControlsTimerRef.current) {
            clearTimeout(hideControlsTimerRef.current);
        }
        // Só agenda o auto-hide se os menus suspensos estiverem fechados e o vídeo já tiver iniciado
        if (!openAudioMenu && !openSubtitleMenu && hasStarted) {
            hideControlsTimerRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    }, [openAudioMenu, openSubtitleMenu, hasStarted]);

    // Dispara a recontagem sempre que o status de início ou menus mudarem
    useEffect(() => {
        resetControlsTimer();
        return () => {
            if (hideControlsTimerRef.current) {
                clearTimeout(hideControlsTimerRef.current);
            }
        };
    }, [resetControlsTimer]);

    // Atualiza quando o usuário muda o idioma geral no painel
    useEffect(() => {
        const savedAudio = localStorage.getItem('cinespartan_preferred_audio');
        if (!savedAudio) {
            setSelectedAudio(resolveDefaultAudio());
        }
        const savedSub = localStorage.getItem('cinespartan_preferred_subtitle');
        if (!savedSub) {
            setSelectedSubtitle(resolveDefaultSubtitle());
        }
    }, [language, resolveDefaultAudio, resolveDefaultSubtitle]);

    const showToast = (msg) => {
        setToastMessage(msg);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
            setToastMessage('');
        }, 4000);
    };

    // Ao clicar em Play: inicia diretamente no Servidor Principal sem troca automática
    const handleStartPlay = () => {
        setHasStarted(true);
        setServerStatus('conectando');
    };

    // Troca de Áudio: alterna automaticamente entre Dublado BR e Áudio Original no Servidor Principal
    const handleSelectAudio = (code) => {
        setSelectedAudio(code);
        setOpenAudioMenu(false);
        localStorage.setItem('cinespartan_preferred_audio', code);

        const item = AUDIO_OPTIONS.find(a => a.code === code);
        if (code === 'pt') {
            // Seleciona o servidor com dublagem brasileira gravada
            setSourceIdx(1);
            showToast(`🇧🇷 Áudio Dublado BR selecionado (Servidor Dublado)`);
        } else {
            // Seleciona o Servidor Principal Ultra HD com áudio original
            setSourceIdx(0);
            showToast(`🔊 Áudio ${item ? item.label : code} no Servidor Principal`);
        }
    };

    // Troca de Legenda: orienta o uso do botão nativo [CC] no player
    const handleSelectSubtitle = (code) => {
        setSelectedSubtitle(code);
        setOpenSubtitleMenu(false);
        localStorage.setItem('cinespartan_preferred_subtitle', code);

        const item = SUBTITLE_OPTIONS.find(s => s.code === code);
        if (code === 'off') {
            showToast(`🚫 Legendas desativadas (desative no ícone CC do vídeo)`);
        } else {
            showToast(`💬 Legenda ${item ? item.label : code}: ative no ícone [CC] no canto inferior do vídeo`);
        }
    };

    // Alternar rota manual (caso o usuário decida testar outro servidor explicitamente)
    const handleNextServer = () => {
        const next = (sourceIdx + 1) % availableSources.length;
        setSourceIdx(next);
        showToast(`🔄 Servidor: ${availableSources[next].name}`);
    };

    const handleIframeLoad = () => {
        setServerStatus('pronto');
    };

    // Fechar menus ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.language-control-menu')) {
                setOpenAudioMenu(false);
                setOpenSubtitleMenu(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Fullscreen robusto
    const toggleFullscreen = () => {
        const nextState = !isFullscreen;
        setIsFullscreen(nextState);

        const el = playerContainerRef.current;
        if (nextState) {
            try {
                if (el?.requestFullscreen) {
                    el.requestFullscreen().catch(() => {});
                } else if (el?.webkitRequestFullscreen) {
                    el.webkitRequestFullscreen();
                }
            } catch (err) {}
        } else {
            try {
                if (document.fullscreenElement) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen().catch(() => {});
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                }
            } catch (err) {}
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    if (!tvId) return null;

    if (!canPlay) {
        return <SubscriptionLockGate title={title} />;
    }

    const iframeSrc = activeServer.url(tvId, season, episode);
    const bgImage = backdrop || poster;
    const currentAudioObj = AUDIO_OPTIONS.find(a => a.code === selectedAudio) || AUDIO_OPTIONS[0];
    const currentSubObj = SUBTITLE_OPTIONS.find(s => s.code === selectedSubtitle) || SUBTITLE_OPTIONS[0];

    return (
        <div className="w-full flex flex-col">
            {/* Container do Player com detecção de movimento para auto-hide */}
            <div
                ref={playerContainerRef}
                onMouseMove={resetControlsTimer}
                onTouchStart={resetControlsTimer}
                onClick={resetControlsTimer}
                className={`relative w-full bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center transition-all ${
                    isFullscreen 
                        ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none ring-0' 
                        : 'aspect-video rounded-2xl ring-1 ring-white/15'
                }`}
            >
                {/* Barra de Controles Discreta Flutuante (Some automaticamente após 3s) */}
                <div
                    className={`absolute top-0 left-0 right-0 z-40 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-all duration-500 ease-in-out ${
                        (showControls || !hasStarted || openAudioMenu || openSubtitleMenu)
                            ? 'opacity-100 pointer-events-auto translate-y-0'
                            : 'opacity-0 pointer-events-none -translate-y-2'
                    }`}
                >
                    {/* Seletor de Áudio / Idioma & Legenda */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 language-control-menu">
                        {/* Botão de Áudio / Idioma */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenAudioMenu(p => !p);
                                    setOpenSubtitleMenu(false);
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-black/60 hover:bg-black/90 text-gray-200 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-md cursor-pointer"
                                title="Alterar idioma do áudio"
                            >
                                <FaVolumeUp className="text-red-500 text-[11px]" />
                                <span>{currentAudioObj.flag} {currentAudioObj.label}</span>
                                <FaChevronDown className="text-[9px] text-gray-400 ml-0.5" />
                            </button>

                            {/* Menu Suspenso de Idiomas de Áudio */}
                            {openAudioMenu && (
                                <div className="absolute left-0 top-full mt-1.5 w-52 rounded-xl bg-[#12141c]/95 border border-white/20 shadow-2xl py-1 z-[1000] backdrop-blur-xl animate-fadeIn">
                                    <div className="px-3 py-1 border-b border-white/10 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                        Idioma do Áudio
                                    </div>
                                    {AUDIO_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.code}
                                            type="button"
                                            onClick={() => handleSelectAudio(opt.code)}
                                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold hover:bg-red-600/20 transition-colors text-left ${
                                                selectedAudio === opt.code ? 'text-red-400 bg-red-600/10' : 'text-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{opt.flag}</span>
                                                <div>
                                                    <p className="font-bold text-[11px] sm:text-xs">{opt.label}</p>
                                                    <p className="text-[9px] text-gray-400 font-normal">{opt.subLabel}</p>
                                                </div>
                                            </div>
                                            {selectedAudio === opt.code && <FaCheck className="text-[10px] text-red-500" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Botão de Legendas */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenSubtitleMenu(p => !p);
                                    setOpenAudioMenu(false);
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-black/60 hover:bg-black/90 text-gray-200 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-md cursor-pointer"
                                title="Alterar legendas"
                            >
                                <FaClosedCaptioning className="text-amber-400 text-[11px]" />
                                <span>{currentSubObj.flag} {currentSubObj.label}</span>
                                <FaChevronDown className="text-[9px] text-gray-400 ml-0.5" />
                            </button>

                            {/* Menu Suspenso de Legendas */}
                            {openSubtitleMenu && (
                                <div className="absolute left-0 top-full mt-1.5 w-52 rounded-xl bg-[#12141c]/95 border border-white/20 shadow-2xl py-1 z-[1000] backdrop-blur-xl animate-fadeIn">
                                    <div className="px-3 py-1 border-b border-white/10 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                        Legendas
                                    </div>
                                    {SUBTITLE_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.code}
                                            type="button"
                                            onClick={() => handleSelectSubtitle(opt.code)}
                                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold hover:bg-amber-500/20 transition-colors text-left ${
                                                selectedSubtitle === opt.code ? 'text-amber-400 bg-amber-500/10' : 'text-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{opt.flag}</span>
                                                <div>
                                                    <p className="font-bold text-[11px] sm:text-xs">{opt.label}</p>
                                                    <p className="text-[9px] text-gray-400 font-normal">{opt.subLabel}</p>
                                                </div>
                                            </div>
                                            {selectedSubtitle === opt.code && <FaCheck className="text-[10px] text-amber-400" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controles da Direita: Rota e Tela Cheia */}
                    <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                        {hasStarted && (
                            <button
                                type="button"
                                onClick={handleNextServer}
                                className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-md cursor-pointer"
                                title="Alternar rota de transmissão se travar"
                            >
                                <FaSyncAlt className={`text-[9px] ${serverStatus === 'alternando' ? 'animate-spin text-amber-400' : ''}`} />
                                <span className="hidden sm:inline">Trocar Rota</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
                            className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-red-600/90 hover:bg-red-600 text-white transition-all shadow-md shadow-red-950/50 cursor-pointer backdrop-blur-md"
                        >
                            {isFullscreen ? <FaCompress className="text-[11px]" /> : <FaExpand className="text-[11px]" />}
                            <span>{isFullscreen ? 'Sair' : 'Tela Cheia'}</span>
                        </button>
                    </div>
                </div>

                {/* Notificação Toast Flutuante */}
                {toastMessage && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/95 border border-white/20 text-white text-xs font-medium shadow-2xl backdrop-blur-md animate-fadeIn">
                        <span>{toastMessage}</span>
                    </div>
                )}

                {!hasStarted ? (
                    /* Tela Limpa: Apenas a Arte da Série e o Botão de Play Gigante */
                    <div
                        onClick={handleStartPlay}
                        className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer group select-none"
                    >
                        {bgImage ? (
                            <img
                                src={bgImage}
                                alt={title || 'Série'}
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-all duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-red-950/50 via-black to-black" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/70" />

                        {/* Botão de Play Central */}
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <button
                                type="button"
                                autoFocus
                                onClick={handleStartPlay}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.85)] group-hover:shadow-[0_0_60px_rgba(239,68,68,1)] group-hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-white/20 cursor-pointer"
                                title="Clique para Assistir"
                            >
                                <FaPlay className="text-2xl sm:text-3xl translate-x-1" />
                            </button>

                            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider drop-shadow-lg text-center px-4">
                                {title ? `${title} • T${season}:E${episode}` : `Temporada ${season} • Episódio ${episode}`}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-300 font-medium bg-black/70 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                                <span>{currentAudioObj.flag} {currentAudioObj.label}</span>
                                <span>•</span>
                                <span>💬 {currentSubObj.label}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Vídeo em Reprodução Direta no Servidor Principal */
                    <>
                        <iframe
                            key={`${tvId}-${season}-${episode}-${selectedAudio}-${selectedSubtitle}-${activeServer.id}`}
                            src={iframeSrc}
                            onLoad={handleIframeLoad}
                            allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *; screen-wake-lock *"
                            allowFullScreen
                            webkitallowfullscreen="true"
                            mozallowfullscreen="true"
                            title={title || 'Player de Série'}
                            referrerPolicy="origin"
                            className="w-full h-full border-0"
                            style={{ userSelect: 'none' }}
                        />

                        {/* Botão de Fechar Tela Cheia quando em Fullscreen */}
                        {isFullscreen && (
                            <button
                                onClick={toggleFullscreen}
                                className="absolute top-4 right-4 z-[10000] flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/85 hover:bg-black text-white backdrop-blur-md transition-all shadow-2xl border border-white/30 text-xs font-bold"
                                title="Sair da Tela Cheia"
                            >
                                <FaCompress className="text-sm text-red-500" />
                                <span>Sair da Tela Cheia</span>
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

VideoPlayer.propTypes = {
    tvId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    season: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    episode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    backdrop: PropTypes.string,
    poster: PropTypes.string,
};

export default memo(VideoPlayer);
