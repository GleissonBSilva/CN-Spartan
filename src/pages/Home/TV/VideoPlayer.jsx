import { memo, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaExpand, FaCompress, FaVolumeUp, FaClosedCaptioning, FaSyncAlt, FaQuestionCircle, FaTimes, FaStepForward } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuthProfile } from '../../../hooks/useAuthProfile';
import SubscriptionLockGate from '../../../components/SubscriptionLockGate';
import { useScreenLimiter } from '../../../hooks/useScreenLimiter';
import { fetchApi } from '../../../lib/apiConfig';

// Servidores Spartan verificados e catalogados por qualidade e idioma real
const SERVERS = [
  {
    id: 'superflix',
    isDubbed: true,
    name: '🍿 SuperFlix (Dublado BR 1)',
    shortName: '🍿 Dublado 1',
    badge: '100% Dublado BR',
    desc: 'Áudio nativo 100% dublado em Português-BR (SuperFlix Principal)',
    url: (id, s, e) => `https://superflixapi.boats/serie/${id}/${s}/${e}`
  },
  {
    id: 'superflix_lat',
    isDubbed: true,
    name: '🇧🇷 SuperFlix (Dublado BR 2)',
    shortName: '🇧🇷 Dublado 2',
    badge: '100% Dublado BR',
    desc: 'Áudio nativo 100% dublado em Português-BR (SuperFlix Reserva)',
    url: (id, s, e) => `https://superflixapi.lat/serie/${id}/${s}/${e}`
  },
  {
    id: 'vidlink',
    isDubbed: false,
    name: '⭐ VidLink Séries (Original HD)',
    shortName: '⭐ Original HD',
    badge: 'Áudio Original HD',
    desc: 'Áudio original em Ultra HD / 4K sem anúncios (VidLink)',
    url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&icons=vid`
  },
  {
    id: 'multiembed',
    isDubbed: false,
    name: '📺 MultiEmbed Séries',
    shortName: '📺 MultiEmbed',
    badge: 'Multi-Fonte',
    desc: 'Servidor alternativo multi-fontes (MultiEmbed)',
    url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  },
  {
    id: 'embedsu',
    isDubbed: false,
    name: '🎬 EmbedSu Séries HD',
    shortName: '🎬 EmbedSu',
    badge: 'Reserva HD',
    desc: 'Servidor reserva em alta definição (EmbedSu)',
    url: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidsrc',
    isDubbed: false,
    name: '⚡ VidSrc Séries Fast',
    shortName: '⚡ VidSrc',
    badge: 'Reserva',
    desc: 'Servidor reserva rápido (VidSrc)',
    url: (id, s, e) => `https://vidsrc.sh/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
  }
];

const VideoPlayer = ({ tvId, season = 1, episode = 1, title, backdrop, poster, hasNextEpisode = false, nextEpisodeTitle = '', onNextEpisode }) => {
    const { language } = useLanguage();
    const { isActive, isAdmin, isSuspended, refreshProfile } = useAuthProfile();
    const [hasStarted, setHasStarted] = useState(false);
    const [showAudioHelp, setShowAudioHelp] = useState(false);

    // Suporte direto e leve a controle remoto de TV Box (Enter, OK, D-Pad Center)
    useEffect(() => {
        const handleRemoteKeyDown = (e) => {
            const code = e.keyCode || e.which;
            if (code === 13 || code === 23 || code === 66 || code === 85 || code === 126) {
                if (!hasStarted) {
                    e.preventDefault();
                    setHasStarted(true);
                }
            }
        };
        window.addEventListener('keydown', handleRemoteKeyDown);
        return () => window.removeEventListener('keydown', handleRemoteKeyDown);
    }, [hasStarted]);

    useEffect(() => {
        setSourceIdx(0);
        setHasStarted(false);
        refreshProfile?.();
    }, [tvId, season, episode]);

    const canPlay = !isSuspended && (isAdmin || isActive);
    const { isScreenBlocked, activeDevices, maxScreens, disconnectOtherDevices } = useScreenLimiter(canPlay && hasStarted);

    // Sempre inicia no servidor principal Dublado BR por padrão
    const resolveDefaultServerIdx = useCallback(() => {
        const saved = localStorage.getItem('cinespartan_preferred_server_idx');
        if (saved !== null) {
            const parsed = parseInt(saved, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed < SERVERS.length) {
                return parsed;
            }
        }
        return 0; // Padrão: 0 = SuperFlix (Dublado BR)
    }, []);

    const [sourceIdx, setSourceIdx] = useState(() => resolveDefaultServerIdx());
    const [serverHealthMap, setServerHealthMap] = useState({});
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isCssFullscreen, setIsCssFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [toastMessage, setToastMessage] = useState('');
    const [nextCountdown, setNextCountdown] = useState(null);

    const playerContainerRef = useRef(null);
    const hideControlsTimerRef = useRef(null);
    const toastTimerRef = useRef(null);
    const countdownTimerRef = useRef(null);

    const activeServer = SERVERS[sourceIdx] || SERVERS[0];

    // Verificação de integridade e disponibilidade dos servidores em tempo real com auto-fallback
    useEffect(() => {
        let isCancelled = false;
        const checkHealth = async () => {
            try {
                const res = await fetchApi(`/api/check-servers?id=${tvId}&type=tv&s=${season}&e=${episode}`);
                if (!res.ok) return;
                const data = await res.json();
                if (isCancelled) return;
                if (data.statusMap) {
                    setServerHealthMap(data.statusMap);
                }
                // Auto-fallback inteligente: se o servidor ativo estiver offline para este episódio,
                // reconecta automaticamente ao servidor recomendado sem travar o cliente
                if (data.recommendedId && data.statusMap) {
                    setSourceIdx(prevIdx => {
                        const current = SERVERS[prevIdx];
                        if (current && data.statusMap[current.id] === false) {
                            const recIdx = SERVERS.findIndex(s => s.id === data.recommendedId);
                            if (recIdx !== -1 && recIdx !== prevIdx) {
                                const recServer = SERVERS[recIdx];
                                if (current.isDubbed && !recServer.isDubbed) {
                                    showToast(`⚠️ Servidores Dublado BR instáveis neste episódio. Alternado para ${recServer.name}`);
                                } else {
                                    showToast(`🔄 Conectado ao servidor reserva ${recServer.name}`);
                                }
                                return recIdx;
                            }
                        }
                        return prevIdx;
                    });
                }
            } catch {}
        };
        checkHealth();
        return () => { isCancelled = true; };
    }, [tvId, season, episode]);

    // Dispara a contagem regressiva de 5 segundos para o próximo episódio
    const triggerNextEpisodeCountdown = useCallback(() => {
        if (!hasNextEpisode || typeof onNextEpisode !== 'function') return;
        setNextCountdown(5);
    }, [hasNextEpisode, onNextEpisode]);

    // Efeito para decrementar o contador de 5 a 0 e dar play automático
    useEffect(() => {
        if (nextCountdown === null) return;
        if (nextCountdown <= 0) {
            setNextCountdown(null);
            onNextEpisode?.();
            return;
        }
        countdownTimerRef.current = setTimeout(() => {
            setNextCountdown(prev => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => {
            if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
        };
    }, [nextCountdown, onNextEpisode]);

    // Ouve mensagens de término ou eventos do iframe (SuperFlix, VidLink, etc.)
    useEffect(() => {
        if (!hasStarted) return;
        const handlePlayerMessage = (e) => {
            try {
                let data = e.data;
                if (typeof data === 'string') {
                    try { data = JSON.parse(data); } catch {}
                }
                if (!data) return;

                // Eventos de vídeo concluído disparados por embeds HTML5 / players externos
                const isEnded =
                    data.event === 'ended' ||
                    data.type === 'ended' ||
                    data === 'ended' ||
                    data.status === 'ended' ||
                    data.action === 'ended';

                if (isEnded) {
                    triggerNextEpisodeCountdown();
                }
            } catch {}
        };

        window.addEventListener('message', handlePlayerMessage);
        return () => window.removeEventListener('message', handlePlayerMessage);
    }, [hasStarted, triggerNextEpisodeCountdown]);



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
        if (!activeServer.isDubbed) {
            showToast('💡 Dica: Se o áudio iniciar mudo ou em outro idioma, use o menu do player para legendas');
        }
    };

    // Selecionar Servidor Direto
    const handleSelectServer = (idx) => {
        setSourceIdx(idx);
        setHasStarted(true);
        try {
            localStorage.setItem('cinespartan_preferred_server_idx', String(idx));
        } catch {}
        showToast(`Conectado ao ${SERVERS[idx].name}`);
    };

    // Alternar servidor reserva se necessário (prioriza servidores online verificados)
    const handleNextServer = () => {
        let next = (sourceIdx + 1) % SERVERS.length;
        for (let i = 0; i < SERVERS.length; i++) {
            const candidateIdx = (sourceIdx + 1 + i) % SERVERS.length;
            if (serverHealthMap[SERVERS[candidateIdx].id] !== false) {
                next = candidateIdx;
                break;
            }
        }
        handleSelectServer(next);
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

    if (!canPlay || isSuspended) {
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
                        : 'w-full aspect-video min-h-[340px] xs:min-h-[380px] sm:min-h-[440px] md:min-h-[520px] rounded-xl sm:rounded-2xl ring-1 ring-white/15'
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
                    {/* Botões Reais de Áudio e Servidor */}
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <button
                            type="button"
                            onClick={() => handleSelectServer(0)}
                            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 ${
                                sourceIdx === 0
                                    ? 'bg-red-600 text-white shadow-red-900/50 ring-2 ring-white/20'
                                    : 'bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/15 backdrop-blur-md'
                            }`}
                            title="Assistir Dublado em Português (SuperFlix Principal)"
                        >
                            <FaVolumeUp className="text-[10px] sm:text-xs" />
                            <span>🇧🇷 Dublado 1</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSelectServer(1)}
                            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 ${
                                sourceIdx === 1
                                    ? 'bg-red-600 text-white shadow-red-900/50 ring-2 ring-white/20'
                                    : 'bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/15 backdrop-blur-md'
                            }`}
                            title="Assistir Dublado em Português (SuperFlix Reserva)"
                        >
                            <FaVolumeUp className="text-[10px] sm:text-xs" />
                            <span>🇧🇷 Dublado 2</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSelectServer(2)}
                            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 ${
                                sourceIdx === 2
                                    ? 'bg-amber-500 text-black shadow-amber-900/50 ring-2 ring-white/20 font-black'
                                    : 'bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/15 backdrop-blur-md'
                            }`}
                            title="Assistir com Áudio Original HD / Legendas (VidLink)"
                        >
                            <FaClosedCaptioning className="text-[10px] sm:text-xs" />
                            <span className="sm:hidden">Original HD</span>
                            <span className="hidden sm:inline">Original HD (VidLink)</span>
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

                        {hasNextEpisode && hasStarted && (
                            <button
                                type="button"
                                onClick={triggerNextEpisodeCountdown}
                                className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all shadow-md cursor-pointer"
                                title="Avançar para o próximo episódio"
                            >
                                <FaStepForward className="text-[10px]" />
                                <span className="hidden sm:inline">Próximo Ep.</span>
                            </button>
                        )}

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

                {/* Overlay de Contagem Regressiva de 5 Segundos para o Próximo Episódio (Estilo Netflix) */}
                {nextCountdown !== null && hasNextEpisode && (
                    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center animate-fadeIn select-none">
                        <div className="max-w-sm w-full bg-[#11131c] border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
                            <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest mb-1">
                                Próximo Episódio
                            </span>
                            <h4 className="text-sm sm:text-base font-black text-white line-clamp-1 mb-4">
                                {nextEpisodeTitle ? `Ep. ${episode + 1} • ${nextEpisodeTitle}` : `Episódio ${episode + 1}`}
                            </h4>

                            {/* Círculo do Contador Regressivo */}
                            <div className="relative w-20 h-20 flex items-center justify-center mb-5">
                                <div className="w-20 h-20 rounded-full border-4 border-red-600/30 flex items-center justify-center">
                                    <span className="text-3xl font-black text-white font-mono animate-pulse">
                                        {nextCountdown}
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-300 mb-5">
                                Iniciando automaticamente em <strong className="text-red-400">{nextCountdown}s</strong> no <strong className="text-emerald-400">SuperFlix Dublado BR</strong>...
                            </p>

                            <div className="flex items-center gap-2.5 w-full">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNextCountdown(null);
                                        onNextEpisode?.();
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-lg shadow-red-900/40 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <FaPlay className="text-[10px]" />
                                    <span>Assistir Agora</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNextCountdown(null)}
                                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-semibold text-xs transition-all border border-white/10 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            </div>
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
                                <span>
                                    {activeServer.isDubbed
                                        ? `🇧🇷 ${activeServer.name}`
                                        : `⭐ ${activeServer.name}`}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Vídeo em Reprodução */
                    <>
                        <iframe
                            key={`${tvId}-${season}-${episode}-${activeServer.id}`}
                            src={iframeSrc}
                            allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *; screen-wake-lock *; display-capture *"
                            title={title || 'Player de Série'}
                            referrerPolicy="no-referrer-when-downgrade"
                            className="w-full h-full border-0"
                            style={{ userSelect: 'none' }}
                        />
                    </>
                )}
            </div>

            {/* Controles e Seletor Transparente de Servidores Spartan */}
            <div className="mt-3 space-y-2 px-1">
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#10131d] rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <FaSyncAlt className="text-red-500 text-xs" />
                            <span>Servidor:</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {SERVERS.map((srv, idx) => {
                                const isSelected = sourceIdx === idx;
                                const isHealthy = serverHealthMap[srv.id];
                                return (
                                    <button
                                        key={srv.id}
                                        type="button"
                                        onClick={() => handleSelectServer(idx)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                            isSelected
                                                ? srv.isDubbed
                                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 ring-1 ring-white/30 font-black'
                                                    : 'bg-amber-500 text-black shadow-lg shadow-amber-500/40 ring-1 ring-white/30 font-black'
                                                : 'bg-[#141824] text-gray-400 hover:text-white hover:bg-[#1e2334] border border-white/5'
                                        }`}
                                    >
                                        <span>{srv.name}</span>
                                        {/* Status em tempo real do health-check */}
                                        {isHealthy === true && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Servidor verificado e online" />
                                        )}
                                        {isHealthy === false && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shrink-0" title="Servidor oscilando para este episódio" />
                                        )}
                                        {isSelected && (
                                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${srv.isDubbed ? 'bg-emerald-300' : 'bg-black'}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Status 100% condizente com o selecionado */}
                    <div className="text-[11px] text-gray-400">
                        {activeServer.isDubbed ? (
                            <span className="text-emerald-400 font-semibold">✓ Áudio nativo 100% dublado em Português-BR ({activeServer.name})</span>
                        ) : (
                            <span className="text-amber-300 font-semibold">✓ Áudio original em alta definição / legendado ({activeServer.name})</span>
                        )}
                    </div>
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
    hasNextEpisode: PropTypes.bool,
    nextEpisodeTitle: PropTypes.string,
    onNextEpisode: PropTypes.func,
};

export default memo(VideoPlayer);
