import { memo, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaExpand, FaCompress, FaVolumeUp, FaClosedCaptioning, FaSyncAlt } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuthProfile } from '../../../hooks/useAuthProfile';
import SubscriptionLockGate from '../../../components/SubscriptionLockGate';

// Servidores de Séries e Animes separados por modalidade de áudio com fallback automático
const SERVERS_BY_AUDIO = {
  dublado: [
    {
      id: 'dub_superflix',
      name: 'SuperFlix HD (Dublado BR)',
      url: (id, s, e) => `https://superflixapi.bond/serie/${id}/${s}/${e}`
    },
    {
      id: 'dub_superflix_buzz',
      name: 'SuperFlix 2 (Dublado BR)',
      url: (id, s, e) => `https://superflixapi.buzz/serie/${id}/${s}/${e}`
    },
    {
      id: 'dub_myembed',
      name: 'MyEmbed BR (Dublado)',
      url: (id, s, e) => `https://myembed.biz/serie/${id}/${s}/${e}`
    },
    {
      id: 'dub_embedmovies',
      name: 'EmbedMovies (Dublado)',
      url: (id, s, e) => `https://embedmovies.org/serie/${id}/${s}/${e}`
    }
  ],
  original: [
    {
      id: 'orig_vidlink',
      name: 'VidLink Ultra HD (Multi-Áudio / Legendas)',
      url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=ef4444&secondaryColor=1f2937&iconColor=ef4444`
    },
    {
      id: 'orig_embedsu',
      name: 'Embed.su (Multi-Legendas)',
      url: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`
    },
    {
      id: 'orig_multiembed',
      name: 'MultiEmbed (Legendado)',
      url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
    },
    {
      id: 'orig_vidsrc',
      name: 'VidSrc To (Original)',
      url: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
    }
  ]
};

const VideoPlayer = ({ tvId, season = 1, episode = 1, title, backdrop, poster }) => {
    const { t } = useLanguage();
    const { isActive, isAdmin } = useAuthProfile();
    const canPlay = isAdmin || isActive;

    // Preferência de áudio salva ou padrão direto (Dublado BR)
    const [audioMode, setAudioMode] = useState(() => {
        return localStorage.getItem('cinespartan_preferred_audio') || 'dublado';
    });

    // O usuário precisa apenas clicar no Play direto
    const [hasStarted, setHasStarted] = useState(false);
    const [serverIdx, setServerIdx] = useState(0);
    const [serverStatus, setServerStatus] = useState('parado');
    const [statusMessage, setStatusMessage] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const playerContainerRef = useRef(null);
    const watchdogTimerRef = useRef(null);

    const currentServers = SERVERS_BY_AUDIO[audioMode] || SERVERS_BY_AUDIO.dublado;
    const activeServer = currentServers[serverIdx] || currentServers[0];

    // Detecção automática em segundo plano
    const startServerWatchdog = useCallback((idx) => {
        if (watchdogTimerRef.current) {
            clearTimeout(watchdogTimerRef.current);
        }
        setServerStatus('conectando');
        setStatusMessage(`Conectando...`);

        // Se após 7s não carregar, troca silenciosamente para rota reserva
        watchdogTimerRef.current = setTimeout(() => {
            const nextIdx = (idx + 1) % currentServers.length;
            if (nextIdx !== idx) {
                setServerStatus('alternando');
                setStatusMessage(`Otimizando conexão com servidor alternativo...`);
                setTimeout(() => {
                    setServerIdx(nextIdx);
                }, 400);
            }
        }, 7000);
    }, [currentServers]);

    // Ao clicar em Play: inicia o episódio direto sem intermediários
    const handleStartPlay = () => {
        setHasStarted(true);
        startServerWatchdog(serverIdx);
    };

    // Troca de idioma em tempo real enquanto o episódio está tocando
    const handleAudioChange = (newMode) => {
        if (newMode === audioMode) return;
        setAudioMode(newMode);
        setServerIdx(0);
        localStorage.setItem('cinespartan_preferred_audio', newMode);
        if (hasStarted) {
            startServerWatchdog(0);
        }
    };

    // Alternar servidor manualmente se desejar
    const handleNextServer = () => {
        const next = (serverIdx + 1) % currentServers.length;
        setServerIdx(next);
        if (hasStarted) {
            startServerWatchdog(next);
        }
    };

    useEffect(() => {
        if (hasStarted) {
            startServerWatchdog(serverIdx);
        }
        return () => {
            if (watchdogTimerRef.current) {
                clearTimeout(watchdogTimerRef.current);
            }
        };
    }, [tvId, season, episode, audioMode, serverIdx, hasStarted, startServerWatchdog]);

    const handleIframeLoad = () => {
        if (watchdogTimerRef.current) {
            clearTimeout(watchdogTimerRef.current);
        }
        setServerStatus('pronto');
        setStatusMessage('');
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

    return (
        <div className="w-full flex flex-col gap-2.5">
            {/* Controles pós-play: Só aparecem quando o episódio já estiver em reprodução */}
            {hasStarted && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md animate-fadeIn">
                    
                    {/* Troca rápida de Áudio / Legenda durante o episódio */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                            <FaVolumeUp className="text-red-500 text-xs" />
                            <span>Áudio:</span>
                        </span>

                        <button
                            type="button"
                            onClick={() => handleAudioChange('dublado')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                audioMode === 'dublado'
                                    ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            🇧🇷 Dublado BR
                        </button>

                        <button
                            type="button"
                            onClick={() => handleAudioChange('original')}
                            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                audioMode === 'original'
                                    ? 'bg-amber-500 text-black shadow-md shadow-amber-950/50'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <FaClosedCaptioning className="text-xs" />
                            <span>Original (Legendado)</span>
                        </button>
                    </div>

                    {/* Controles da direita: Rota e Tela Cheia */}
                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={handleNextServer}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-all border border-white/10"
                            title="Alternar rota de transmissão"
                        >
                            <FaSyncAlt className={`text-[10px] ${serverStatus === 'alternando' ? 'animate-spin text-amber-400' : ''}`} />
                            <span className="hidden sm:inline">Trocar Servidor</span>
                        </button>

                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md shadow-red-950/50"
                        >
                            {isFullscreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
                            <span>{isFullscreen ? 'Sair' : 'Tela Cheia'}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Container do Player (Capa com Play Gigante antes do clique, ou Vídeo direto) */}
            <div
                ref={playerContainerRef}
                className={`relative w-full bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center transition-all ${
                    isFullscreen 
                        ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none ring-0' 
                        : 'aspect-video rounded-2xl ring-1 ring-white/15'
                }`}
            >
                {!hasStarted ? (
                    /* Tela Limpa: Apenas a Arte da Série e o Botão de Play Central */
                    <div
                        onClick={handleStartPlay}
                        className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer group select-none"
                    >
                        {/* Imagem de Fundo Cinematográfica */}
                        {bgImage ? (
                            <img
                                src={bgImage}
                                alt={title || 'Série'}
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-all duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-red-950/50 via-black to-black" />
                        )}

                        {/* Vinheta Escura Estilo Cinema */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/70" />

                        {/* Botão de Play Gigante no Centro (Focado para controle remoto da TV Box) */}
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
                                {title || 'Assistir Episódio'}
                            </h3>
                            <span className="text-xs text-gray-300 font-medium bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                                Clique para Iniciar
                            </span>
                        </div>
                    </div>
                ) : (
                    /* Vídeo em Reprodução Imediata */
                    <>
                        {/* Aviso sutil de alternância se o servidor oscilar */}
                        {serverStatus === 'alternando' && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-black/90 border border-amber-500/50 text-amber-300 text-xs shadow-2xl backdrop-blur-md animate-bounce">
                                <FaSyncAlt className="animate-spin text-sm text-amber-400" />
                                <span>{statusMessage}</span>
                            </div>
                        )}

                        <iframe
                            key={`${tvId}-${season}-${episode}-${audioMode}-${activeServer.id}`}
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
