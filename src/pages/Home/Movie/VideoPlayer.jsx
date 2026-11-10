import { memo, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaServer, FaExpand, FaCompress, FaVolumeUp, FaClosedCaptioning, FaShieldAlt, FaSyncAlt } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuthProfile } from '../../../hooks/useAuthProfile';
import SubscriptionLockGate from '../../../components/SubscriptionLockGate';

// Servidores separados por modalidade de áudio com prioridade automática
const SERVERS_BY_AUDIO = {
  dublado: [
    {
      id: 'dub_superflix',
      name: 'SuperFlix HD (Dublado BR)',
      badge: 'Principal',
      url: (id) => `https://superflixapi.bond/filme/${id}`
    },
    {
      id: 'dub_superflix_buzz',
      name: 'SuperFlix 2 (Dublado BR)',
      badge: 'Alternativo',
      url: (id) => `https://superflixapi.buzz/filme/${id}`
    },
    {
      id: 'dub_myembed',
      name: 'MyEmbed BR (Dublado)',
      badge: 'Reserva 1',
      url: (id) => `https://myembed.biz/filme/${id}`
    },
    {
      id: 'dub_embedmovies',
      name: 'EmbedMovies (Dublado)',
      badge: 'Reserva 2',
      url: (id) => `https://embedmovies.org/filme/${id}`
    }
  ],
  original: [
    {
      id: 'orig_vidlink',
      name: 'VidLink Ultra HD (Multi-Áudio / Legendas)',
      badge: 'Ultra HD',
      url: (id) => `https://vidlink.pro/movie/${id}?primaryColor=ef4444&secondaryColor=1f2937&iconColor=ef4444`
    },
    {
      id: 'orig_embedsu',
      name: 'Embed.su (Multi-Legendas)',
      badge: 'HD',
      url: (id) => `https://embed.su/embed/movie/${id}`
    },
    {
      id: 'orig_multiembed',
      name: 'MultiEmbed (Legendado)',
      badge: 'Alternativo',
      url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`
    },
    {
      id: 'orig_vidsrc',
      name: 'VidSrc To (Original)',
      badge: 'Reserva',
      url: (id) => `https://vidsrc.to/embed/movie/${id}`
    }
  ]
};

const VideoPlayer = ({ movieId, title, backdrop, poster }) => {
    const { t } = useLanguage();
    const { isActive, isAdmin } = useAuthProfile();
    const canPlay = isAdmin || isActive;

    // 1. Idioma inicial preferido do usuário (padrão: Dublado BR)
    const [audioMode, setAudioMode] = useState(() => {
        return localStorage.getItem('cinespartan_preferred_audio') || 'dublado';
    });

    // 2. O filme aguarda o play do usuário tanto no APK quanto localmente
    const [hasStarted, setHasStarted] = useState(false);
    const [serverIdx, setServerIdx] = useState(0);
    const [serverStatus, setServerStatus] = useState('parado'); // 'parado', 'conectando', 'pronto', 'alternando'
    const [statusMessage, setStatusMessage] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const playerContainerRef = useRef(null);
    const watchdogTimerRef = useRef(null);

    // Servidores disponíveis para o modo de áudio atual
    const currentServers = SERVERS_BY_AUDIO[audioMode] || SERVERS_BY_AUDIO.dublado;
    const activeServer = currentServers[serverIdx] || currentServers[0];

    // Detecção automática e watchdog do servidor após dar o play
    const startServerWatchdog = useCallback((idx) => {
        if (watchdogTimerRef.current) {
            clearTimeout(watchdogTimerRef.current);
        }
        setServerStatus('conectando');
        setStatusMessage(`Conectando ao servidor: ${currentServers[idx]?.name || 'Principal'}...`);

        // Watchdog: Se após 7s não carregar, tenta automaticamente o próximo servidor funcional
        watchdogTimerRef.current = setTimeout(() => {
            const nextIdx = (idx + 1) % currentServers.length;
            if (nextIdx !== idx) {
                setServerStatus('alternando');
                setStatusMessage(`Servidor instável. Alternando automaticamente para rota alternativa...`);
                setTimeout(() => {
                    setServerIdx(nextIdx);
                }, 500);
            }
        }, 7000);
    }, [currentServers]);

    // Iniciar reprodução ao clicar no Play
    const handleStartPlay = () => {
        setHasStarted(true);
        startServerWatchdog(serverIdx);
    };

    // Troca de idioma de áudio em tempo real durante a reprodução
    const handleAudioChange = (newMode) => {
        if (newMode === audioMode) return;
        setAudioMode(newMode);
        setServerIdx(0);
        localStorage.setItem('cinespartan_preferred_audio', newMode);
        if (hasStarted) {
            startServerWatchdog(0);
        }
    };

    // Forçar próximo servidor manualmente se desejado
    const handleNextServer = () => {
        const next = (serverIdx + 1) % currentServers.length;
        setServerIdx(next);
        if (hasStarted) {
            startServerWatchdog(next);
        }
    };

    // Monitora troca de movieId / áudio / servidor quando ativo
    useEffect(() => {
        if (hasStarted) {
            startServerWatchdog(serverIdx);
        }
        return () => {
            if (watchdogTimerRef.current) {
                clearTimeout(watchdogTimerRef.current);
            }
        };
    }, [movieId, audioMode, serverIdx, hasStarted, startServerWatchdog]);

    // Quando o iframe carrega com sucesso
    const handleIframeLoad = () => {
        if (watchdogTimerRef.current) {
            clearTimeout(watchdogTimerRef.current);
        }
        setServerStatus('pronto');
        setStatusMessage('Transmissão conectada com sucesso');
    };

    // Fullscreen robusto (Nativo Android + CSS Fixed Viewport)
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

    // Listener para tecla ESC
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    if (!movieId) return null;

    if (!canPlay) {
        return <SubscriptionLockGate title={title} />;
    }

    const iframeSrc = activeServer.url(movieId);
    const bgImage = backdrop || poster;

    return (
        <div className="w-full flex flex-col gap-3">
            {/* HUD de Controle em Tempo Real (Estilo YouCine / Netflix) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md">
                
                {/* Seletor de Idioma de Áudio (Troca imediata antes ou durante o play) */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FaVolumeUp className="text-red-500 text-xs" />
                        <span>Áudio:</span>
                    </span>

                    <div className="flex items-center p-1 rounded-lg bg-white/5 border border-white/10 gap-1">
                        <button
                            type="button"
                            onClick={() => handleAudioChange('dublado')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                audioMode === 'dublado'
                                    ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                            title="Áudio Dublado em Português do Brasil"
                        >
                            <span>🇧🇷 Dublado BR</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAudioChange('original')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                audioMode === 'original'
                                    ? 'bg-amber-500 text-black shadow-md shadow-amber-950/50'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                            title="Áudio Original com Legendas em Português"
                        >
                            <FaClosedCaptioning className="text-xs" />
                            <span>Original (Legendado)</span>
                        </button>
                    </div>
                </div>

                {/* Status do Servidor Automático e Botões de Ação */}
                <div className="flex items-center gap-2 ml-auto">
                    {hasStarted && (
                        <>
                            {/* Indicador de Status do Servidor */}
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-gray-300">
                                <span className={`w-2 h-2 rounded-full ${
                                    serverStatus === 'pronto' ? 'bg-green-500 animate-pulse' : 'bg-yellow-400 animate-ping'
                                }`} />
                                <span>{activeServer.name}</span>
                            </div>

                            {/* Botão de Alternar Servidor Manual */}
                            <button
                                type="button"
                                onClick={handleNextServer}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all border border-white/10"
                                title="Alternar imediatamente para outra rota"
                            >
                                <FaSyncAlt className={`text-[10px] ${serverStatus === 'alternando' ? 'animate-spin text-amber-400' : ''}`} />
                                <span className="hidden md:inline">Alternar Rota</span>
                            </button>
                        </>
                    )}

                    {/* Botão de Tela Cheia */}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Sair da Tela Cheia' : 'Abrir em Tela Cheia'}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md shadow-red-950/50"
                    >
                        {isFullscreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
                        <span>{isFullscreen ? 'Sair' : 'Tela Cheia'}</span>
                    </button>
                </div>
            </div>

            {/* Container do Player com Capa de Aguardando Play ou Iframe */}
            <div
                ref={playerContainerRef}
                className={`relative w-full bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center transition-all ${
                    isFullscreen 
                        ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none ring-0' 
                        : 'aspect-video rounded-2xl ring-1 ring-white/15'
                }`}
            >
                {!hasStarted ? (
                    /* Tela Aguardando Play pelo Usuário (Estilo Netflix / YouCine) */
                    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
                        {/* Imagem de Fundo Cinematográfica */}
                        {bgImage ? (
                            <img
                                src={bgImage}
                                alt={title || 'Filme'}
                                className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105 filter blur-[2px] transition-transform duration-700 hover:scale-100"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-black to-black" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />

                        {/* Conteúdo Central com Botão de Play */}
                        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg">
                            <span className="text-[11px] uppercase tracking-widest text-red-500 font-extrabold mb-2 px-3 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                                {audioMode === 'dublado' ? '🇧🇷 Pronto em Dublado BR' : '🌐 Pronto em Áudio Original'}
                            </span>
                            
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-6 drop-shadow-xl line-clamp-2">
                                {title || 'Assistir Filme'}
                            </h2>

                            {/* Botão de Play Grande e Brilhante (Compatível com controle remoto da TV) */}
                            <button
                                type="button"
                                onClick={handleStartPlay}
                                autoFocus
                                className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-base uppercase tracking-wider shadow-[0_0_35px_rgba(239,68,68,0.6)] hover:shadow-[0_0_50px_rgba(239,68,68,0.9)] transform hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-red-400/50"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white text-white group-hover:text-red-600 transition-colors">
                                    <FaPlay className="text-xs translate-x-0.5" />
                                </div>
                                <span>Assistir Agora</span>
                            </button>

                            <p className="text-xs text-gray-400 mt-4 font-medium">
                                Servidor funcional será detectado e conectado automaticamente.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Iframe em Reprodução */
                    <>
                        {/* Watchdog / Fallback Status Bar */}
                        {serverStatus === 'alternando' && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-black/90 border border-amber-500/50 text-amber-300 text-xs shadow-2xl backdrop-blur-md animate-bounce">
                                <FaSyncAlt className="animate-spin text-sm text-amber-400" />
                                <span>{statusMessage}</span>
                            </div>
                        )}

                        <iframe
                            key={`${movieId}-${audioMode}-${activeServer.id}`}
                            src={iframeSrc}
                            onLoad={handleIframeLoad}
                            allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *; screen-wake-lock *"
                            allowFullScreen
                            webkitallowfullscreen="true"
                            mozallowfullscreen="true"
                            title={title || 'Player de Filme'}
                            referrerPolicy="origin"
                            className="w-full h-full border-0"
                            style={{ userSelect: 'none' }}
                        />

                        {/* Botão Flutuante de Fechar Tela Cheia quando em Fullscreen */}
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
    movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    backdrop: PropTypes.string,
    poster: PropTypes.string,
};

export default memo(VideoPlayer);
