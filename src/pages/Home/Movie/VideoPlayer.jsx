import { memo, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute, FaClosedCaptioning, FaSyncAlt, FaCalendarAlt, FaFilm, FaQuestionCircle, FaTimes } from 'react-icons/fa';
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
      url: (id) => `https://superflixapi.bond/filme/${id}`
    },
    {
      id: 'vidlink_direct',
      name: 'VidLink Ultra HD (Multi-Áudio)',
      url: (id) => `https://vidlink.pro/movie/${id}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&iconColor=ef4444`
    }
  ],
  legendado: [
    {
      id: 'vidlink_orig',
      name: 'VidLink Ultra HD (Áudio Original)',
      url: (id) => `https://vidlink.pro/movie/${id}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&iconColor=ef4444`
    },
    {
      id: 'embedsu_orig',
      name: 'Embed.su (Legendado HD)',
      url: (id) => `https://embed.su/embed/movie/${id}`
    },
    {
      id: 'vidsrc_orig',
      name: 'VidSrc To (Original)',
      url: (id) => `https://vidsrc.to/embed/movie/${id}`
    }
  ]
};

const VideoPlayer = ({ movieId, title, backdrop, poster, releaseDate, status, videos }) => {
    const { language } = useLanguage();
    const { isActive, isAdmin } = useAuthProfile();
    const [hasStarted, setHasStarted] = useState(false);
    const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
    const [showAudioHelp, setShowAudioHelp] = useState(false);
    const canPlay = isAdmin || isActive;
    const { isScreenBlocked, activeDevices, maxScreens, disconnectOtherDevices } = useScreenLimiter(canPlay && hasStarted);

    // Verificar se o título é lançamento futuro ou em produção
    const isUnreleased = Boolean(
      (releaseDate && new Date(releaseDate) > new Date()) ||
      (status && ['In Production', 'Post Production', 'Planned', 'Em Produção', 'Pós-Produção'].includes(status))
    );

    const formattedReleaseDate = releaseDate
      ? new Date(releaseDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      : null;

    const trailer = Array.isArray(videos)
      ? (videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
         videos.find(v => v.site === 'YouTube' && v.type === 'Teaser') ||
         videos.find(v => v.site === 'YouTube'))
      : null;

    // Sempre inicia no servidor principal Dublado BR por padrão
    const resolveDefaultMode = useCallback(() => {
        return language && !language.startsWith('pt') ? 'legendado' : 'dublado';
    }, [language]);

    const [streamMode, setStreamMode] = useState('dublado');
    const [sourceIdx, setSourceIdx] = useState(0);
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
    const handleStartPlay = (startAsTrailer = false) => {
        setIsPlayingTrailer(startAsTrailer);
        setHasStarted(true);
        if (!startAsTrailer && streamMode === 'legendado') {
            showToast('💡 Dica: Se o áudio iniciar mudo, toque no ícone 🔊 no player para desmutar');
        }
    };

    // Troca de Modo: Dublado BR <-> Legendado (Original HD)
    const handleModeChange = (newMode) => {
        setIsPlayingTrailer(false);
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
        setIsPlayingTrailer(false);
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

    if (!movieId) return null;

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

    const iframeSrc = isPlayingTrailer && trailer
        ? `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`
        : activeServer.url(movieId);

    const bgImage = backdrop || poster;

    return (
        <div className="w-full flex flex-col">
            {/* Aviso especial para Títulos em Breve / Não Lançados */}
            {isUnreleased && (
                <div className="mb-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                        <FaCalendarAlt className="text-amber-400 text-base shrink-0" />
                        <div>
                            <span className="font-bold text-amber-300">Estreia Prevista: {formattedReleaseDate || 'Em Breve'}</span>
                            <span className="text-amber-200/80 block sm:inline sm:ml-2">
                                (Filme em produção / antes do lançamento nos cinemas. Servidores de streaming só disponibilizam cópias completas após a estreia.)
                            </span>
                        </div>
                    </div>
                    {trailer && (
                        <button
                            type="button"
                            onClick={() => handleStartPlay(true)}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md cursor-pointer"
                        >
                            <FaFilm className="text-xs" />
                            <span>Ver Trailer Oficial</span>
                        </button>
                    )}
                </div>
            )}

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
                                !isPlayingTrailer && streamMode === 'dublado'
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
                                !isPlayingTrailer && streamMode === 'legendado'
                                    ? 'bg-amber-500 text-black shadow-amber-900/50 ring-2 ring-white/20 font-black'
                                    : 'bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/15 backdrop-blur-md'
                            }`}
                            title="Assistir com Áudio Original e Legendas"
                        >
                            <FaClosedCaptioning className="text-[10px] sm:text-xs" />
                            <span className="sm:hidden">Legendado</span>
                            <span className="hidden sm:inline">Original (Legendado)</span>
                        </button>

                        {trailer && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsPlayingTrailer(true);
                                    setHasStarted(true);
                                    showToast('🎬 Reproduzindo Trailer Oficial');
                                }}
                                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 ${
                                    isPlayingTrailer
                                        ? 'bg-blue-600 text-white shadow-blue-900/50 ring-2 ring-white/20'
                                        : 'bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/15 backdrop-blur-md'
                                }`}
                                title="Assistir Trailer Oficial"
                            >
                                <FaFilm className="text-[10px] sm:text-xs" />
                                <span className="hidden xs:inline sm:inline">Trailer</span>
                            </button>
                        )}
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

                        {hasStarted && !isPlayingTrailer && (
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
                                    <span><strong>Sem vozes (Apenas som de fundo):</strong> Filmes estrangeiros em alta definição costumam usar áudio 5.1 Surround (vozes no canal central). Se o seu som for estéreo, clique no botão <strong>"Trocar Servidor"</strong> para carregar uma versão estéreo (2.0).</span>
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
                                Entendi, voltar ao filme
                            </button>
                        </div>
                    </div>
                )}

                {!hasStarted ? (
                    /* Tela Limpa Pré-Play: Apenas a Arte e o Botão Central */
                    <div
                        onClick={() => handleStartPlay(false)}
                        className="relative w-full h-full flex flex-col items-center justify-center pt-7 sm:pt-4 px-3 cursor-pointer group select-none"
                    >
                        {bgImage ? (
                            <img
                                src={bgImage}
                                alt={title || 'Filme'}
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
                                onClick={() => handleStartPlay(false)}
                                className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.85)] group-hover:shadow-[0_0_60px_rgba(239,68,68,1)] group-hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-white/20 cursor-pointer"
                                title="Clique para Assistir"
                            >
                                <FaPlay className="text-lg sm:text-2xl md:text-3xl translate-x-0.5 sm:translate-x-1" />
                            </button>

                            <h3 className="text-xs sm:text-base md:text-lg font-black text-white uppercase tracking-wider drop-shadow-lg text-center px-3 line-clamp-1 sm:line-clamp-2 max-w-[92vw]">
                                {title || 'Assistir Filme'}
                            </h3>
                            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-300 font-medium bg-black/70 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                                <span>{streamMode === 'dublado' ? '🇧🇷 Dublado em Português' : '🌐 Áudio Original (Legendado)'}</span>
                            </div>

                            {/* Se o filme for futuro/não lançado, oferece atalho direto para o trailer */}
                            {isUnreleased && trailer && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartPlay(true);
                                    }}
                                    className="mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-amber-500/90 hover:bg-amber-400 text-black font-extrabold text-[10px] sm:text-xs shadow-xl transition-all cursor-pointer ring-2 ring-white/20 hover:scale-105"
                                >
                                    <FaFilm className="text-xs sm:text-sm" />
                                    <span>Assistir Trailer Oficial</span>
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Vídeo em Reprodução */
                    <>
                        <iframe
                            key={`${movieId}-${isPlayingTrailer ? 'trailer' : streamMode}-${activeServer.id}`}
                            src={iframeSrc}
                            allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *; screen-wake-lock *; clipboard-write *"
                            allowFullScreen={true}
                            webkitallowfullscreen="true"
                            mozallowfullscreen="true"
                            title={title || 'Player de Filme'}
                            referrerPolicy="origin"
                            className="w-full h-full border-0"
                            style={{ userSelect: 'none' }}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

VideoPlayer.propTypes = {
    movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    backdrop: PropTypes.string,
    poster: PropTypes.string,
    releaseDate: PropTypes.string,
    status: PropTypes.string,
    videos: PropTypes.array,
};

export default memo(VideoPlayer);
