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
      name: 'SuperFlix (Dublado BR)',
      url: (id, s, e) => `https://superflixapi.bond/serie/${id}/${s}/${e}`
    },
    {
      id: 'multiembed_dub',
      name: 'MultiEmbed (Multi-Áudio & Dublado)',
      url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
    },
    {
      id: 'vidlink_direct',
      name: 'VidLink Ultra HD (Multi-Áudio)',
      url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&iconColor=ef4444`
    }
  ],
  legendado: [
    {
      id: 'vidlink_orig',
      name: 'VidLink Ultra HD (Áudio Original)',
      url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&iconColor=ef4444`
    },
    {
      id: 'multiembed_orig',
      name: 'MultiEmbed (Original / Leg)',
      url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
    },
    {
      id: 'embedsu_orig',
      name: 'Embed.su (Legendado HD)',
      url: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`
    },
    {
      id: 'vidsrc_orig',
      name: 'VidSrc To (Original)',
      url: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
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

    // Sempre inicia no servidor principal Dublado BR por padrão
    const resolveDefaultMode = useCallback(() => {
        return language && !language.startsWith('pt') ? 'legendado' : 'dublado';
    }, [language]);

    const [streamMode, setStreamMode] = useState('dublado');
    const [sourceIdx, setSourceIdx] = useState(0);
    const [antiAdShield, setAntiAdShield] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isCssFullscreen, setIsCssFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [toastMessage, setToastMessage] = useState('');

    const playerContainerRef = useRef(null);
    const hideControlsTimerRef = useRef(null);
    const toastTimerRef = useRef(null);

    const currentSources = SERVERS[streamMode] || SERVERS.dublado;
    const activeServer = currentSources[sourceIdx] || currentSources[0];

    // Atualiza quando o usuário muda o idioma geral no painel
    useEffect(() => {
        localStorage.removeItem('cinespartan_preferred_stream_mode');
        setStreamMode(resolveDefaultMode());
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
    const toggleFullscreen = async (e) => {
        if (e) e.stopPropagation();
        const el = playerContainerRef.current;
        const hasNativeFs = Boolean(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
        const isCurrentlyFullscreen = hasNativeFs || isFullscreen || isCssFullscreen;

        if (!isCurrentlyFullscreen) {
            if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
            setShowControls(false);
            try {
                if (el?.requestFullscreen) {
                    await el.requestFullscreen();
                    setIsFullscreen(true);
                } else if (el?.webkitRequestFullscreen) {
                    await el.webkitRequestFullscreen();
                    setIsFullscreen(true);
                } else if (el?.mozRequestFullScreen) {
                    await el.mozRequestFullScreen();
                    setIsFullscreen(true);
                } else if (el?.msRequestFullscreen) {
                    await el.msRequestFullscreen();
                    setIsFullscreen(true);
                } else {
                    setIsCssFullscreen(true);
                    setIsFullscreen(true);
                }
            } catch {
                // Fallback para CSS Fullscreen apenas se a API nativa for bloqueada
                setIsCssFullscreen(true);
                setIsFullscreen(true);
            }
        } else {
            try {
                if (hasNativeFs) {
                    if (document.exitFullscreen) {
                        await document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        await document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        await document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                        await document.msExitFullscreen();
                    }
                }
            } catch {}
            setIsCssFullscreen(false);
            setIsFullscreen(false);
        }
    };

    // Sincronização automática com eventos de tela cheia do navegador/player
    useEffect(() => {
        document.body.classList.toggle('cinespartan-fullscreen', isFullscreen);
        if (isFullscreen) {
            setShowControls(false);
        }
        return () => {
            document.body.classList.remove('cinespartan-fullscreen');
        };
    }, [isFullscreen]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = Boolean(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );
            setIsFullscreen(isFs);
            if (!isFs) {
                setIsCssFullscreen(false);
            } else {
                setShowControls(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && (isFullscreen || isCssFullscreen)) {
                setIsCssFullscreen(false);
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
    }, [isFullscreen, isCssFullscreen]);

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
                onMouseMove={!isFullscreen ? resetControlsTimer : undefined}
                onTouchStart={!isFullscreen ? resetControlsTimer : undefined}
                onClick={!isFullscreen ? resetControlsTimer : undefined}
                style={isCssFullscreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', zIndex: 999999, margin: 0, borderRadius: 0 } : {}}
                className={`cinespartan-player-container relative w-full bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center ${
                    isCssFullscreen 
                        ? 'is-css-fullscreen !fixed !inset-0 !z-[999999] !h-[100dvh] !w-screen !rounded-none !ring-0' 
                        : 'aspect-video min-h-[235px] sm:min-h-0 rounded-xl sm:rounded-2xl ring-1 ring-white/15'
                }`}
            >
                {/* Sensor de topo (apenas fora da tela cheia) para reexibir os botões ao passar o mouse sobre o iframe */}
                {!isFullscreen && hasStarted && !showControls && (
                    <div
                        onMouseEnter={resetControlsTimer}
                        onMouseMove={resetControlsTimer}
                        onTouchStart={resetControlsTimer}
                        className="absolute top-0 left-0 right-0 h-14 z-30"
                    />
                )}

                {/* Barra de Controles Discreta Flutuante (Fica 100% oculta ao maximizar) */}
                <div
                    className={`absolute top-0 left-0 right-0 z-40 p-2 sm:p-4 flex items-center justify-between gap-1 sm:gap-2 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-all duration-500 ease-in-out ${
                        isFullscreen
                            ? 'hidden opacity-0 pointer-events-none -translate-y-4'
                            : (showControls || !hasStarted)
                                ? 'opacity-100 pointer-events-auto translate-y-0'
                                : 'opacity-0 pointer-events-none -translate-y-2'
                    }`}
                >
                    {/* Botões Reais de Áudio: Dublado BR vs Legendado */}
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <button
                            type="button"
                            onClick={() => handleModeChange('dublado')}
                            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 ${
                                streamMode === 'dublado'
                                    ? 'bg-red-600 text-white shadow-red-900/50 ring-2 ring-white/20'
                                    : 'bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/15 backdrop-blur-md'
                            }`}
                            title="Assistir Dublado em Português"
                        >
                            <FaVolumeUp className="text-[10px] sm:text-xs" />
                            <span>🇧🇷 Dublado</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleModeChange('legendado')}
                            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 ${
                                streamMode === 'legendado'
                                    ? 'bg-amber-500 text-black shadow-amber-900/50 ring-2 ring-white/20 font-black'
                                    : 'bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/15 backdrop-blur-md'
                            }`}
                            title="Assistir com Áudio Original e Legendas"
                        >
                            <FaClosedCaptioning className="text-[10px] sm:text-xs" />
                            <span className="sm:hidden">Legendado</span>
                            <span className="hidden sm:inline">Original (Legendado)</span>
                        </button>
                    </div>

                    {/* Controles da Direita: Ajuda de Áudio, Troca de Rota e Tela Cheia */}
                    <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowAudioHelp(prev => !prev)}
                            className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-600/70 hover:bg-blue-600 text-white border border-blue-400/30 backdrop-blur-md transition-all shadow-md cursor-pointer"
                            title="Ajuda com som mudo ou legendas"
                        >
                            <FaQuestionCircle className="text-[10px]" />
                            <span className="hidden sm:inline">Sem Áudio?</span>
                        </button>

                        {hasStarted && (
                            <button
                                type="button"
                                onClick={handleNextServer}
                                className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/15 backdrop-blur-md transition-all shadow-md cursor-pointer"
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
                            className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-red-600/90 hover:bg-red-600 text-white transition-all shadow-md shadow-red-950/50 cursor-pointer backdrop-blur-md"
                        >
                            {isFullscreen ? <FaCompress className="text-[10px] sm:text-[11px]" /> : <FaExpand className="text-[10px] sm:text-[11px]" />}
                            <span>{isFullscreen ? 'Sair' : 'Tela Cheia'}</span>
                        </button>
                    </div>
                </div>

                {/* Notificação Toast Flutuante */}
                {toastMessage && (
                    <div className="absolute top-12 sm:top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/95 border border-white/20 text-white text-[11px] sm:text-xs font-medium shadow-2xl backdrop-blur-md animate-fadeIn text-center max-w-[90%]">
                        <span className="truncate">{toastMessage}</span>
                    </div>
                )}

                {/* Modal / Painel de Ajuda de Áudio */}
                {showAudioHelp && (
                    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-3 sm:p-6 flex flex-col items-center justify-center animate-fadeIn text-left overflow-y-auto">
                        <div className="max-w-md w-full bg-[#111319] border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl relative text-gray-200">
                            <button
                                type="button"
                                onClick={() => setShowAudioHelp(false)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <FaTimes className="text-base" />
                            </button>

                            <div className="flex items-center gap-2 mb-2.5 sm:mb-3 text-blue-400 font-bold text-sm sm:text-base">
                                <FaVolumeUp className="text-base sm:text-lg" />
                                <h3>Como resolver som mudo ou sem voz</h3>
                            </div>

                            <ul className="space-y-2 text-[11px] sm:text-sm leading-relaxed text-gray-300">
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
                                className="mt-3 sm:mt-4 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md"
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
                        className="relative w-full h-full flex flex-col items-center justify-center pt-7 sm:pt-4 px-3 cursor-pointer group select-none"
                    >
                        {bgImage ? (
                            <img
                                src={bgImage}
                                alt={title || 'Série'}
                                className="absolute inset-0 w-full h-full object-cover object-center opacity-60 group-hover:opacity-75 transition-all duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-red-950/50 via-black to-black" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/70" />

                        {/* Botão de Play Central */}
                        <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-3 max-w-full">
                            <button
                                type="button"
                                autoFocus
                                onClick={handleStartPlay}
                                className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.85)] group-hover:shadow-[0_0_60px_rgba(239,68,68,1)] group-hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-white/20 cursor-pointer"
                                title="Clique para Assistir"
                            >
                                <FaPlay className="text-lg sm:text-2xl md:text-3xl translate-x-0.5 sm:translate-x-1" />
                            </button>

                            <h3 className="text-xs sm:text-base md:text-lg font-black text-white uppercase tracking-wider drop-shadow-lg text-center px-3 line-clamp-1 sm:line-clamp-2 max-w-[92vw]">
                                {title ? `${title} • T${season}:E${episode}` : `Temporada ${season} • Episódio ${episode}`}
                            </h3>
                            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-300 font-medium bg-black/70 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                                <span>{streamMode === 'dublado' ? '🇧🇷 Dublado em Português' : '🌐 Áudio Original (Legendado)'}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Vídeo em Reprodução */
                    <>
                        <iframe
                            key={`${tvId}-${season}-${episode}-${streamMode}-${activeServer.id}-${antiAdShield}`}
                            src={iframeSrc}
                            sandbox={antiAdShield ? "allow-scripts allow-same-origin allow-forms allow-presentation" : undefined}
                            allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *; screen-wake-lock *; clipboard-write *"
                            allowFullScreen={true}
                            webkitallowfullscreen="true"
                            mozallowfullscreen="true"
                            title={title || 'Player de Série'}
                            referrerPolicy="origin"
                            className="w-full h-full border-0"
                            style={{ userSelect: 'none' }}
                        />
                    </>
                )}
            </div>

            {/* Barra Persistente de Servidores e Escudo Anti-Popups */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 mt-3 rounded-xl bg-[#0f141f] border border-white/10 shadow-lg">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-300">Servidor:</span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600/25 text-red-400 border border-red-500/30">
                        {activeServer.name}
                    </span>

                    <button
                        type="button"
                        onClick={() => {
                            const nextState = !antiAdShield;
                            setAntiAdShield(nextState);
                            showToast(nextState ? '🛡️ Escudo Anti-Popups ATIVADO (Abas bloqueadas)' : '⚠️ Escudo desativado temporariamente');
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            antiAdShield
                                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                                : 'bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30'
                        }`}
                        title={antiAdShield ? "Bloqueia abertura de novas abas e anúncios externos" : "Clique para ativar o escudo anti-popups"}
                    >
                        <span>{antiAdShield ? '🛡️ Anti-Popups: Ativo' : '⚠️ Anti-Popups: Desativado'}</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-gray-400 hidden sm:inline">Se o episódio falhar ou der erro:</span>
                    {currentSources.map((srv, idx) => (
                        <button
                            key={srv.id}
                            type="button"
                            onClick={() => {
                                setSourceIdx(idx);
                                if (!hasStarted) setHasStarted(true);
                                showToast(`Alternado para: ${srv.name}`);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                sourceIdx === idx
                                    ? 'bg-red-600 text-white shadow-md shadow-red-950 ring-1 ring-red-400'
                                    : 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10'
                            }`}
                        >
                            Opção {idx + 1}: {srv.name.split(' ')[0]}
                        </button>
                    ))}
                </div>
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
