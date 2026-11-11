import { memo, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaExpand, FaCompress, FaVolumeUp, FaClosedCaptioning, FaSyncAlt, FaQuestionCircle, FaTimes } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuthProfile } from '../../../hooks/useAuthProfile';
import SubscriptionLockGate from '../../../components/SubscriptionLockGate';
import { useScreenLimiter } from '../../../hooks/useScreenLimiter';

// Servidores separados por modalidade real de reprodução: Dublado BR e Legendado (Original HD)
const SERVERS = {
  dublado: [
    {
      id: 'superflix_dub',
      name: 'SuperFlix (Dublado BR - Principal)',
      url: (id, s, e) => `https://superflixapi.bond/serie/${id}/${s}/${e}`
    },
    {
      id: 'vidlink_direct',
      name: 'VidLink Ultra HD (Multi-Áudio)',
      url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=ef4444&secondaryColor=1f2937&iconColor=ef4444`
    },
    {
      id: 'multiembed_dub',
      name: 'MultiEmbed Ultra (Multi-Áudio / Dublado BR)',
      url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
    },
    {
      id: 'autoembed_co',
      name: 'AutoEmbed HD (Multi-Áudio)',
      url: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`
    },
    {
      id: 'embedder_net',
      name: 'Embedder HD',
      url: (id, s, e) => `https://embedder.net/e/series?tmdb=${id}&sea=${s}&epi=${e}`
    }
  ],
  legendado: [
    {
      id: 'vidlink_orig',
      name: 'VidLink Ultra HD (Áudio Original - Principal)',
      url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=ef4444&secondaryColor=1f2937&iconColor=ef4444`
    },
    {
      id: 'multiembed_orig',
      name: 'MultiEmbed Ultra HD (Original)',
      url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
    },
    {
      id: 'vidsrc_pm',
      name: 'VidSrc PM (Áudio Original Estéreo)',
      url: (id, s, e) => `https://vidsrc.pm/embed/tv/${id}/${s}/${e}`
    },
    {
      id: 'autoembed_orig',
      name: 'AutoEmbed HD (Original)',
      url: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`
    },
    {
      id: 'embedder_orig',
      name: 'Embedder HD (Original)',
      url: (id, s, e) => `https://embedder.net/e/series?tmdb=${id}&sea=${s}&epi=${e}`
    },
    {
      id: 'embedsu_orig',
      name: 'Embed.su (Legendado HD)',
      url: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`
    }
  ]
};

const VideoPlayer = ({ tvId, season = 1, episode = 1, title, backdrop, poster }) => {
    const { language } = useLanguage();
    const { isActive, isAdmin } = useAuthProfile();
    const [hasStarted, setHasStarted] = useState(false);
    const [showAudioHelp, setShowAudioHelp] = useState(false);
    const canPlay = isAdmin || isActive;
    const { isScreenBlocked, activeDevices, maxScreens, disconnectOtherDevices } = useScreenLimiter(canPlay && hasStarted);

    // Resolução do modo padrão com base no Painel do Usuário (se pt-BR, começa em Dublado)
    const resolveDefaultMode = useCallback(() => {
        const saved = localStorage.getItem('cinespartan_preferred_stream_mode');
        if (saved === 'dublado' || saved === 'legendado') return saved;
        return language?.startsWith('pt') ? 'dublado' : 'legendado';
    }, [language]);

    const [streamMode, setStreamMode] = useState(resolveDefaultMode);
    const [sourceIdx, setSourceIdx] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [toastMessage, setToastMessage] = useState('');

    const playerContainerRef = useRef(null);
    const hideControlsTimerRef = useRef(null);
    const toastTimerRef = useRef(null);

    const currentSources = SERVERS[streamMode] || SERVERS.dublado;
    const activeServer = currentSources[sourceIdx] || currentSources[0];

    // Atualiza quando o usuário muda o idioma geral no painel
    useEffect(() => {
        const saved = localStorage.getItem('cinespartan_preferred_stream_mode');
        if (!saved) {
            setStreamMode(resolveDefaultMode());
        }
    }, [language, resolveDefaultMode]);

    const showToast = (msg) => {
        setToastMessage(msg);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
            setToastMessage('');
        }, 4000);
    };

    // Auto-hide: controles somem após 3s sem interação
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (hideControlsTimerRef.current) {
            clearTimeout(hideControlsTimerRef.current);
        }
        if (hasStarted) {
            hideControlsTimerRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    }, [hasStarted]);

    useEffect(() => {
        resetControlsTimer();
        return () => {
            if (hideControlsTimerRef.current) {
                clearTimeout(hideControlsTimerRef.current);
            }
        };
    }, [resetControlsTimer]);

    // Ao clicar em Play
    const handleStartPlay = () => {
        setHasStarted(true);
        if (streamMode === 'legendado') {
            showToast('💡 Dica: Se o áudio iniciar mudo, toque no ícone 🔊 no player para desmutar');
        }
    };

    // Troca de Modo: Dublado BR <-> Legendado (Original HD)
    const handleModeChange = (newMode) => {
        if (newMode === streamMode) return;
        setStreamMode(newMode);
        setSourceIdx(0);
        localStorage.setItem('cinespartan_preferred_stream_mode', newMode);

        if (newMode === 'dublado') {
            showToast('🇧🇷 Áudio Dublado em Português ativado');
        } else {
            showToast('🌐 Áudio Original ativado — se iniciar sem som, desmute no ícone 🔊');
        }
    };

    // Alternar servidor reserva se necessário
    const handleNextServer = () => {
        const next = (sourceIdx + 1) % currentSources.length;
        setSourceIdx(next);
        showToast(`🔄 Servidor alternativo: ${currentSources[next].name}`);
    };

    // Fullscreen robusto (Nativo Android/PC + CSS Fixed Viewport Fallback)
    const toggleFullscreen = async () => {
        const el = playerContainerRef.current;
        const isCurrentlyFullscreen = Boolean(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement ||
            isFullscreen
        );

        if (!isCurrentlyFullscreen) {
            try {
                if (el?.requestFullscreen) {
                    await el.requestFullscreen();
                } else if (el?.webkitRequestFullscreen) {
                    await el.webkitRequestFullscreen();
                } else if (el?.mozRequestFullScreen) {
                    await el.mozRequestFullScreen();
                } else if (el?.msRequestFullscreen) {
                    await el.msRequestFullscreen();
                }
            } catch (err) {
                // Fallback para CSS Fullscreen se a API for bloqueada
            }
            setIsFullscreen(true);
        } else {
            try {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    await document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    await document.msExitFullscreen();
                }
            } catch (err) {}
            setIsFullscreen(false);
        }
    };

    // Sincronização automática com eventos de tela cheia do navegador/player
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = Boolean(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );
            setIsFullscreen(isFs);
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFullscreen]);

    if (!tvId) return null;

    if (!canPlay) {
        return <SubscriptionLockGate title={title} />;
    }

    if (isScreenBlocked) {
        return (
            <SubscriptionLockGate
                title={title}
                isScreenLimit={true}
                maxScreens={maxScreens}
                activeDevices={activeDevices}
                onDisconnectOthers={disconnectOtherDevices}
            />
        );
    }

    const iframeSrc = activeServer.url(tvId, season, episode);
    const bgImage = backdrop || poster;

    return (
        <div className="w-full flex flex-col">
            {/* Container do Player com detecção de movimento para auto-hide */}
            <div
                ref={playerContainerRef}
                onMouseMove={resetControlsTimer}
                onTouchStart={resetControlsTimer}
                onClick={resetControlsTimer}
                style={isFullscreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999999, margin: 0, borderRadius: 0 } : {}}
                className={`relative w-full bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center transition-all ${
                    isFullscreen 
                        ? '!fixed !inset-0 !z-[999999] !h-screen !w-screen !rounded-none !ring-0' 
                        : 'aspect-video rounded-2xl ring-1 ring-white/15'
                }`}
            >
                {/* Barra de Controles Discreta Flutuante (Some automaticamente após 3s) */}
                <div
                    className={`absolute top-0 left-0 right-0 z-40 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-all duration-500 ease-in-out ${
                        (showControls || !hasStarted)
                            ? 'opacity-100 pointer-events-auto translate-y-0'
                            : 'opacity-0 pointer-events-none -translate-y-2'
                    }`}
                >
                    {/* Botões Reais de Áudio: Dublado BR vs Legendado */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            type="button"
                            onClick={() => handleModeChange('dublado')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
                                streamMode === 'dublado'
                                    ? 'bg-red-600 text-white shadow-red-900/50 ring-2 ring-white/20'
                                    : 'bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/15 backdrop-blur-md'
                            }`}
                            title="Assistir Dublado em Português"
                        >
                            <FaVolumeUp className="text-xs" />
                            <span>🇧🇷 Dublado</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleModeChange('legendado')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
                                streamMode === 'legendado'
                                    ? 'bg-amber-500 text-black shadow-amber-900/50 ring-2 ring-white/20 font-black'
                                    : 'bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/15 backdrop-blur-md'
                            }`}
                            title="Assistir com Áudio Original e Legendas"
                        >
                            <FaClosedCaptioning className="text-xs" />
                            <span>Original (Legendado)</span>
                        </button>
                    </div>

                    {/* Controles da Direita: Ajuda de Áudio, Troca de Rota e Tela Cheia */}
                    <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={() => setShowAudioHelp(prev => !prev)}
                            className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-blue-600/70 hover:bg-blue-600 text-white border border-blue-400/30 backdrop-blur-md transition-all shadow-md cursor-pointer"
                            title="Ajuda com som mudo ou legendas"
                        >
                            <FaQuestionCircle className="text-[10px]" />
                            <span className="hidden sm:inline">Sem Áudio?</span>
                        </button>

                        {hasStarted && (
                            <button
                                type="button"
                                onClick={handleNextServer}
                                className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-md cursor-pointer"
                                title="Alternar servidor de transmissão se necessário"
                            >
                                <FaSyncAlt className="text-[10px]" />
                                <span className="hidden sm:inline">Trocar Servidor</span>
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
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/95 border border-white/20 text-white text-xs font-medium shadow-2xl backdrop-blur-md animate-fadeIn text-center">
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* Modal / Painel de Ajuda de Áudio */}
                {showAudioHelp && (
                    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md p-6 flex flex-col items-center justify-center animate-fadeIn text-left">
                        <div className="max-w-md w-full bg-[#111319] border border-white/20 rounded-2xl p-5 shadow-2xl relative text-gray-200">
                            <button
                                type="button"
                                onClick={() => setShowAudioHelp(false)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <FaTimes className="text-base" />
                            </button>

                            <div className="flex items-center gap-2.5 mb-3 text-blue-400 font-bold text-base">
                                <FaVolumeUp className="text-lg" />
                                <h3>Como resolver som mudo ou sem voz</h3>
                            </div>

                            <ul className="space-y-2.5 text-xs sm:text-sm leading-relaxed text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-amber-400">1.</span>
                                    <span><strong>Desmutar o Player:</strong> Por padrão de segurança de navegadores (Chrome, Edge, Safari, TV Box), vídeos externos iniciam sem som. Toque no vídeo e clique no <strong>ícone de alto-falante (🔊)</strong> para desmutar.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-amber-400">2.</span>
                                    <span><strong>Sem vozes (Apenas som de fundo):</strong> Séries e filmes originais costumam usar áudio 5.1 Surround (vozes no canal central). Se seu aparelho for estéreo, clique no botão <strong>"Trocar Servidor"</strong> para carregar uma versão estéreo (2.0).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-amber-400">3.</span>
                                    <span><strong>Prefere Dublado?</strong> Clique no botão vermelho <strong>"🇧🇷 Dublado"</strong> para carregar o áudio brasileiro com dublagem completa.</span>
                                </li>
                            </ul>

                            <button
                                type="button"
                                onClick={() => setShowAudioHelp(false)}
                                className="mt-4 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md"
                            >
                                Entendi, voltar ao episódio
                            </button>
                        </div>
                    </div>
                )}

                {!hasStarted ? (
                    /* Tela Limpa Pré-Play: Apenas a Arte e o Botão Central */
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
                                <span>{streamMode === 'dublado' ? '🇧🇷 Dublado em Português' : '🌐 Áudio Original (Legendado)'}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Vídeo em Reprodução */
                    <>
                        <iframe
                            key={`${tvId}-${season}-${episode}-${streamMode}-${activeServer.id}`}
                            src={iframeSrc}
                            allow="autoplay; fullscreen; encrypted-media; picture-in-picture; screen-wake-lock; clipboard-write"
                            allowFullScreen={true}
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
