import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  FaPlay, FaExpand, FaCompress, FaVolumeUp, FaClosedCaptioning, 
  FaSyncAlt, FaTv, FaBolt, FaShieldAlt, FaMobileAlt, FaFilm,
  FaQuestionCircle, FaCheck, FaTimes
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthProfile } from '../../hooks/useAuthProfile';
import SubscriptionLockGate from '../SubscriptionLockGate';
import { useScreenLimiter } from '../../hooks/useScreenLimiter';

// Servidores Turbo otimizados especialmente para TV Box e Celular Android (Máxima estabilidade e sem popups)
const TV_SERVERS = {
  movie: {
    dublado: [
      {
        id: 'tv_superflix_dub',
        name: '🍿 SuperFlix Dublado BR (100% Áudio PT-BR)',
        tag: 'DUBLADO BR',
        url: (id) => `https://superflixapi.boats/filme/${id}`
      },
      {
        id: 'tv_multiembed_dub',
        name: '📺 MultiEmbed Dublado (Multi-Áudio BR)',
        tag: 'ALTERNATIVA HD',
        url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`
      },
      {
        id: 'tv_vidlink_dub',
        name: '⭐ VidLink Multi-Áudio HD (Sem Anúncios)',
        tag: 'ULTRA HD',
        url: (id) => `https://vidlink.pro/movie/${id}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&icons=vid`
      },
      {
        id: 'tv_vidsrc_dub',
        name: '⚡ VidSrc Fast HD (Multi-Áudio)',
        tag: 'VELOZ',
        url: (id) => `https://vidsrc.sh/embed/movie?tmdb=${id}`
      }
    ],
    legendado: [
      {
        id: 'tv_vidlink_orig',
        name: '⭐ VidLink Ultra HD (Sem Anúncios • CC Legendas)',
        tag: 'RECOMENDADO CC',
        url: (id) => `https://vidlink.pro/movie/${id}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&icons=vid`
      },
      {
        id: 'tv_vidsrc_orig',
        name: '⚡ VidSrc Original Fast (Legendas CC)',
        tag: 'ALTA DEFINIÇÃO',
        url: (id) => `https://vidsrc.sh/embed/movie?tmdb=${id}`
      },
      {
        id: 'tv_multiembed_orig',
        name: '📺 MultiEmbed Original (Multi-Legendas CC)',
        tag: 'ORIGINAL HD',
        url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`
      }
    ]
  },
  tv: {
    dublado: [
      {
        id: 'tv_superflix_tv_dub',
        name: '🍿 SuperFlix Séries BR (100% Áudio PT-BR)',
        tag: 'DUBLADO BR',
        url: (id, s, e) => `https://superflixapi.boats/serie/${id}/${s}/${e}`
      },
      {
        id: 'tv_multiembed_tv_dub',
        name: '📺 MultiEmbed Séries (Multi-Áudio BR)',
        tag: 'ALTERNATIVA HD',
        url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
      },
      {
        id: 'tv_vidlink_tv_dub',
        name: '⭐ VidLink Séries HD (Sem Anúncios)',
        tag: 'ULTRA HD',
        url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&icons=vid`
      },
      {
        id: 'tv_vidsrc_tv_dub',
        name: '⚡ VidSrc Séries Fast',
        tag: 'VELOZ',
        url: (id, s, e) => `https://vidsrc.sh/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
      }
    ],
    legendado: [
      {
        id: 'tv_vidlink_tv_orig',
        name: '⭐ VidLink Séries HD (Sem Anúncios • CC Legendas)',
        tag: 'RECOMENDADO CC',
        url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&icons=vid`
      },
      {
        id: 'tv_vidsrc_tv_orig',
        name: '⚡ VidSrc Séries Original Fast (Legendas CC)',
        tag: 'VELOZ',
        url: (id, s, e) => `https://vidsrc.sh/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
      },
      {
        id: 'tv_multiembed_tv_orig',
        name: '📺 MultiEmbed Séries Leg (Multi-Legendas CC)',
        tag: 'ORIGINAL HD',
        url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
      }
    ]
  }
};

function VideoPlayerTVBox({
  movieId,
  tvId,
  season = 1,
  episode = 1,
  title,
  backdrop,
  poster
}) {
  const isSeries = Boolean(tvId);
  const mediaId = isSeries ? tvId : movieId;

  const { language } = useLanguage();
  const { isActive, isAdmin, isSuspended, refreshProfile } = useAuthProfile();

  const [hasStarted, setHasStarted] = useState(false);
  const [streamMode, setStreamMode] = useState(() => (language?.startsWith('pt') === false ? 'legendado' : 'dublado'));
  const [sourceIdx, setSourceIdx] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCssFullscreen, setIsCssFullscreen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showCcModal, setShowCcModal] = useState(false);

  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const hideTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Detecta se o dispositivo é um celular/tablet touch
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 800
      );
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  useEffect(() => {
    refreshProfile?.();
  }, [mediaId, season, episode, refreshProfile]);

  const canPlay = !isSuspended && (isAdmin || isActive);
  const { isScreenBlocked, activeDevices, maxScreens, disconnectOtherDevices } = useScreenLimiter(canPlay && hasStarted);

  const serverGroup = isSeries ? TV_SERVERS.tv : TV_SERVERS.movie;
  const currentSources = serverGroup[streamMode] || serverGroup.dublado;
  const activeServer = currentSources[sourceIdx] || currentSources[0];

  const iframeSrc = isSeries
    ? activeServer.url(mediaId, season, episode)
    : activeServer.url(mediaId);

  // Mantém a tela da TV Box ou Celular sempre ligada durante o filme (Screen Wake Lock API)
  useEffect(() => {
    let released = false;
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && hasStarted && !released) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch {
          // ignore
        }
      }
    };

    if (hasStarted) {
      requestWakeLock();
    }

    return () => {
      released = true;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [hasStarted]);

  const showToast = useCallback((msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 3200);
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (hasStarted) {
        setShowControls(false);
      }
    }, 4500);
  }, [hasStarted]);

  // Alternar tela cheia nativa ou CSS expandido
  const toggleFullscreen = useCallback(() => {
    const isGoingFullscreen = !isFullscreen && !isCssFullscreen;

    if (isGoingFullscreen) {
      // 1. Invoca a ponte nativa do APK (gira para Paisagem horizontal + esconde barras do Android)
      if (window.AndroidNative?.setFullscreen) {
        try {
          window.AndroidNative.setFullscreen(true);
        } catch (e) {
          console.warn('Native fullscreen error:', e);
        }
      }

      // 2. Trava orientação para Paisagem via W3C API se disponível
      try {
        if (window.screen?.orientation?.lock) {
          window.screen.orientation.lock('landscape').catch(() => {});
        }
      } catch {}

      // 3. Requisita Tela Cheia HTML5 (no iframe, no container ou no documentElement)
      const el = containerRef.current;
      const iframe = iframeRef.current;
      const target = (hasStarted && iframe) ? iframe : el;

      if (target?.requestFullscreen) {
        target.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
          document.documentElement.requestFullscreen?.().catch(() => {});
        });
      } else if (target?.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }

      setIsFullscreen(true);
      setIsCssFullscreen(true);
      try {
        document.body.style.overflow = 'hidden';
      } catch {}
      showToast('Modo Tela Cheia Ativado');
    } else {
      // Saindo da tela cheia
      if (window.AndroidNative?.setFullscreen) {
        try {
          window.AndroidNative.setFullscreen(false);
        } catch (e) {
          console.warn('Native exit fullscreen error:', e);
        }
      }

      try {
        if (window.screen?.orientation?.unlock) {
          window.screen.orientation.unlock();
        }
      } catch {}

      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }

      setIsFullscreen(false);
      setIsCssFullscreen(false);
      try {
        document.body.style.overflow = '';
      } catch {}
      showToast('Modo Tela Cheia Desativado');
    }
  }, [isFullscreen, isCssFullscreen, hasStarted, showToast]);

  useEffect(() => {
    window.__cineSpartanExitFullscreen = () => {
      if (isFullscreen || isCssFullscreen) {
        toggleFullscreen();
        return true;
      }
      return false;
    };
    return () => {
      delete window.__cineSpartanExitFullscreen;
    };
  }, [isFullscreen, isCssFullscreen, toggleFullscreen]);

  useEffect(() => {
    const handleFsChange = () => {
      const fs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(fs);
      if (!fs && !window.AndroidNative) {
        setIsCssFullscreen(false);
        try {
          document.body.style.overflow = '';
        } catch {}
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Navegação por Controle Remoto de TV Box (D-Pad & Botão OK)
  useEffect(() => {
    const handleTvRemoteKeyDown = (e) => {
      resetControlsTimer();
      const code = e.keyCode || e.which;

      // OK / Enter / D-Pad Center / Media Play (13, 23, 66, 85, 126)
      if (code === 13 || code === 23 || code === 66 || code === 85 || code === 126) {
        if (!hasStarted) {
          e.preventDefault();
          setHasStarted(true);
          showToast('Iniciando reprodução...');
        }
      }

      // Seta Esquerda (21) ou Direita (22): Alterna servidores rapidamente
      if (code === 21) {
        e.preventDefault();
        setSourceIdx((prev) => (prev > 0 ? prev - 1 : currentSources.length - 1));
      } else if (code === 22) {
        e.preventDefault();
        setSourceIdx((prev) => (prev + 1 < currentSources.length ? prev + 1 : 0));
      }

      // Seta Cima (19) ou Baixo (20): Alterna Dublado / Legendado
      if (code === 19 || code === 20) {
        e.preventDefault();
        setStreamMode((prev) => (prev === 'dublado' ? 'legendado' : 'dublado'));
        setSourceIdx(0);
      }
    };

    window.addEventListener('keydown', handleTvRemoteKeyDown);
    return () => window.removeEventListener('keydown', handleTvRemoteKeyDown);
  }, [hasStarted, currentSources.length, resetControlsTimer, showToast]);

  if (!mediaId) return null;

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

  const bgImage = backdrop || poster;

  return (
    <div className="w-full flex flex-col select-none">
      {/* CONTAINER DO PLAYER (Espaçoso no Celular e Perfeito na TV) */}
      <div
        ref={containerRef}
        onMouseMove={resetControlsTimer}
        onTouchStart={resetControlsTimer}
        style={isCssFullscreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', zIndex: 9999999, margin: 0, padding: 0, borderRadius: 0 } : {}}
        className={`relative w-full bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black group transition-all duration-300 ${
          isCssFullscreen 
            ? '!fixed !inset-0 !z-[9999999] !h-[100dvh] !h-screen !w-screen !rounded-none !border-0 !m-0 !p-0' 
            : isTheaterMode
            ? 'w-full aspect-video min-h-[290px] xs:min-h-[350px] sm:min-h-[480px] md:min-h-[620px] lg:min-h-[720px] shadow-[0_0_50px_rgba(239,68,68,0.25)] ring-2 ring-red-500/30'
            : 'w-full aspect-video min-h-[210px] xs:min-h-[250px] sm:min-h-[380px] md:min-h-[480px] lg:min-h-[560px]'
        }`}
      >
        {/* Toast Flutuante de Notificação */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-black/95 border border-red-500/60 text-white font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 animate-bounce max-w-[90%] text-center">
            <FaBolt className="text-amber-400 text-xs shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

        {/* Selos de Identificação no Topo */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2 pointer-events-none">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/90 text-white text-[10px] sm:text-[11px] font-black tracking-wider uppercase shadow-lg border border-red-400/30">
            {isTouchDevice ? <FaMobileAlt className="text-xs" /> : <FaTv className="text-xs" />}
            <span>{isTouchDevice ? 'SPARTAN MOBILE VIP' : 'TV BOX TURBO VIP'}</span>
          </span>
          <span className="hidden xs:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-emerald-400 text-[9px] sm:text-[10px] font-bold border border-emerald-500/30">
            <FaShieldAlt className="text-[10px]" />
            <span>ESCUDO ANTI-POPUP</span>
          </span>
        </div>

        {/* Botões de Controle no Topo Direito (Cinema & Tela Cheia) */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 sm:gap-2">
          {!isFullscreen && !isCssFullscreen && (
            <button
              type="button"
              onClick={() => {
                setIsTheaterMode(prev => !prev);
                showToast(isTheaterMode ? 'Modo Normal Ativado' : '🎬 Modo Cinema Expandido Ativado');
              }}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md transition-all shadow-lg active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                isTheaterMode 
                  ? 'bg-amber-500 text-black border-amber-300 font-black' 
                  : 'bg-black/70 hover:bg-black/95 text-white border-white/15'
              }`}
              title="Expandir tamanho do Player para Modo Cinema"
            >
              <FaFilm className="text-xs" />
              <span className="hidden sm:inline">{isTheaterMode ? 'Reduzir' : 'Modo Cinema'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-white text-xs font-bold border backdrop-blur-md transition-all shadow-lg active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              isFullscreen || isCssFullscreen
                ? 'z-[99999999] bg-red-600/95 hover:bg-red-600 border-red-400/60 shadow-red-950/70'
                : 'bg-black/70 hover:bg-black/95 border-white/15'
            }`}
            title="Alternar Tela Cheia"
          >
            {isFullscreen || isCssFullscreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
            <span>{isFullscreen || isCssFullscreen ? 'Sair' : 'Tela Cheia'}</span>
          </button>
        </div>

        {/* TELA DE INÍCIO COM ÁREA DE CLIQUE TOTAL (Toque em qualquer lugar para dar Play) */}
        {!hasStarted ? (
          <div
            onClick={() => {
              setHasStarted(true);
              showToast('Carregando servidor com áudio e vídeo HD...');
            }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 sm:p-6 text-center cursor-pointer group/poster transition-all"
          >
            {bgImage && (
              <img
                src={bgImage}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover/poster:opacity-65 transition-all duration-700 group-hover/poster:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

            {/* Conteúdo Central com Espaçamento Amplo */}
            <div className="relative z-10 flex flex-col items-center max-w-md px-2 pointer-events-none">
              <h2 className="text-base sm:text-2xl md:text-3xl font-black text-white tracking-tight mb-1 drop-shadow-md line-clamp-2">
                {title}
              </h2>
              {isSeries && (
                <span className="text-xs font-bold text-red-300 bg-red-950/70 px-2.5 py-0.5 rounded-md border border-red-500/30 mb-2">
                  Temporada {season} • Episódio {episode}
                </span>
              )}

              {/* Botão de Play Gigante, Confortável e Brilhante */}
              <div
                className="my-3 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-red-600 group-hover/poster:bg-red-500 text-white flex items-center justify-center text-2xl sm:text-3xl md:text-4xl shadow-[0_0_40px_rgba(239,68,68,0.85)] border-2 border-white/30 transition-transform duration-300 group-hover/poster:scale-110 active:scale-95 ring-4 ring-red-500/30"
              >
                <FaPlay className="ml-1 text-white" />
              </div>

              {/* Informação do Áudio Atual */}
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-200 font-bold bg-black/75 px-3 py-1 rounded-full border border-white/15 backdrop-blur-md">
                {streamMode === 'dublado' ? <FaVolumeUp className="text-red-400" /> : <FaClosedCaptioning className="text-amber-400" />}
                <span>{streamMode === 'dublado' ? '🇧🇷 Dublado em Português' : '🌐 Áudio Original (Legendado)'}</span>
              </div>

              {/* Dica de Toque / Controle */}
              <span className="text-[11px] text-gray-300 mt-2 font-medium opacity-80">
                {isTouchDevice ? '👆 Toque em qualquer lugar para dar Play' : '🎮 Pressione OK no controle da TV para dar Play'}
              </span>
            </div>
          </div>
        ) : (
          /* IFRAME STREAMING BLINDADO */
          <iframe
            ref={iframeRef}
            key={`${mediaId}-${isSeries ? `${season}-${episode}` : ''}-${streamMode}-${activeServer.id}`}
            src={iframeSrc}
            title={title}
            allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *; screen-wake-lock *; display-capture *"
            allowFullScreen
            webkitallowfullscreen="true"
            mozallowfullscreen="true"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full border-0 relative z-10"
          />
        )}
      </div>

      {/* ── BARRA ERGONÔMICA DE SERVIDORES E ÁUDIO (Abaixo do Player) ── */}
      {/* Dá espaço total e confortável para o cliente escolher o servidor e o áudio sem espremer a tela */}
      <div className="w-full mt-3 flex flex-col gap-2.5 bg-[#0f1118]/90 border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Seletor Dublado vs Legendado */}
          <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => {
                setStreamMode('dublado');
                setSourceIdx(0);
                showToast('Áudio alternado para Dublado BR');
              }}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                streamMode === 'dublado'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FaVolumeUp className="text-xs" />
              <span>🇧🇷 Dublado BR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStreamMode('legendado');
                setSourceIdx(0);
                showToast('Áudio alternado para Legendado com Legendas CC');
              }}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                streamMode === 'legendado'
                  ? 'bg-amber-500 text-black shadow-md font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FaClosedCaptioning className="text-xs" />
              <span>🌐 Legendado</span>
            </button>
          </div>

          {/* Botão de Tela Cheia, Ajuda CC e Troca Rápida */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCcModal(true)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Ajuda de Áudio e Instruções de Legendas CC"
            >
              <FaClosedCaptioning className="text-xs" />
              <span>Legendas CC</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const nextIdx = (sourceIdx + 1) % currentSources.length;
                setSourceIdx(nextIdx);
                setHasStarted(true);
                showToast(`Alternando para ${currentSources[nextIdx].name}...`);
              }}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Trocar de servidor se este estiver travando"
            >
              <FaSyncAlt className="text-xs" />
              <span>Trocar Rota</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
            >
              <FaExpand className="text-xs" />
              <span>Tela Cheia</span>
            </button>
          </div>
        </div>

        {/* Lista de Servidores em Botões Grandes e Fáceis de Tocar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <FaBolt className="text-red-500 text-xs" />
            <span>Servidor:</span>
          </span>

          {currentSources.map((srv, idx) => {
            const isSelected = idx === sourceIdx;
            return (
              <button
                key={srv.id}
                type="button"
                onClick={() => {
                  setSourceIdx(idx);
                  setHasStarted(true);
                  showToast(`Conectado ao ${srv.name}`);
                }}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer active:scale-95 shrink-0 ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950/70 ring-2 ring-red-400/40'
                    : 'bg-[#181b24] hover:bg-[#222633] text-gray-300 border-white/5 hover:text-white'
                }`}
              >
                <span>{srv.name}</span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                {srv.tag && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${isSelected ? 'bg-black/40 text-amber-300' : 'bg-black/30 text-gray-400'}`}>
                    {srv.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MODAL EXPLICATIVO DE LEGENDAS (CC) & ÁUDIO ── */}
      {showCcModal && (
        <div className="fixed inset-0 z-[999999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#12151f] border border-white/15 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setShowCcModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <FaTimes className="text-sm" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-lg">
                <FaClosedCaptioning />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">Áudio Dublado & Legendas (CC)</h3>
                <p className="text-xs text-gray-400">Como funciona o áudio e legendas no Spartan</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-gray-300">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <h4 className="font-bold text-red-400 flex items-center gap-2 mb-1">
                  <FaVolumeUp className="text-xs" />
                  <span>1. Áudio Dublado em Português BR</span>
                </h4>
                <p className="text-gray-300/90 text-xs leading-relaxed">
                  Basta selecionar a aba <strong className="text-white">"🇧🇷 Dublado BR"</strong>. O <strong>Servidor 1 (SuperFlix)</strong> e o <strong>Servidor 2 (MultiEmbed)</strong> já iniciam diretamente com áudio falado em Português do Brasil.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 mb-1">
                  <FaClosedCaptioning className="text-xs" />
                  <span>2. Legendas (CC) em Português ou Inglês</span>
                </h4>
                <p className="text-gray-300/90 text-xs leading-relaxed mb-2">
                  Selecione a aba <strong className="text-white">"🌐 Legendado"</strong>. O <strong>Servidor 1 (VidLink)</strong> e o <strong>Servidor 2 (VidSrc)</strong> possuem o menu oficial de Closed Captions:
                </p>
                <div className="bg-black/60 rounded-xl p-2.5 border border-white/5 text-[11px] text-gray-300 space-y-1">
                  <p>👉 Dentro do vídeo em reprodução, toque na tela para abrir os controles do player.</p>
                  <p>👉 No canto inferior direito do vídeo, toque no botão <strong>[CC]</strong> (ou no ícone de balão de fala).</p>
                  <p>👉 Escolha <strong className="text-emerald-400">Portuguese (Português)</strong> para ativar a legenda desejada.</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setStreamMode('dublado');
                  setSourceIdx(0);
                  setShowCcModal(false);
                  showToast('Conectado ao Servidor Dublado BR');
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                Assistir Dublado BR
              </button>
              <button
                type="button"
                onClick={() => {
                  setStreamMode('legendado');
                  setSourceIdx(0);
                  setShowCcModal(false);
                  showToast('Modo Legendado ativado! Clique em [CC] no player');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all shadow-md cursor-pointer"
              >
                Ativar Legendado com CC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

VideoPlayerTVBox.propTypes = {
  movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tvId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  season: PropTypes.number,
  episode: PropTypes.number,
  title: PropTypes.string,
  backdrop: PropTypes.string,
  poster: PropTypes.string
};

export default memo(VideoPlayerTVBox);
