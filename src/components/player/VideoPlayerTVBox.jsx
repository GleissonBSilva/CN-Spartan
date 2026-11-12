import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  FaPlay, FaExpand, FaCompress, FaVolumeUp, FaClosedCaptioning, 
  FaSyncAlt, FaTv, FaBolt, FaShieldAlt, FaQuestionCircle, FaCheckCircle
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthProfile } from '../../hooks/useAuthProfile';
import SubscriptionLockGate from '../SubscriptionLockGate';
import { useScreenLimiter } from '../../hooks/useScreenLimiter';

// Servidores Turbo otimizados especialmente para TV Box e Android APK (Máxima estabilidade e sem popups)
const TV_SERVERS = {
  movie: {
    dublado: [
      {
        id: 'tv_vidlink_dub',
        name: '⭐ VidLink Ultra HD (Dublado / Multi-Áudio)',
        tag: 'RECOMENDADO TV BOX',
        url: (id) => `https://vidlink.pro/movie/${id}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&iconColor=ef4444`
      },
      {
        id: 'tv_superflix_dub',
        name: 'SuperFlix Spartan (Dublado BR)',
        tag: 'DUBLAGEM BR',
        url: (id) => `https://superflixapi.bond/filme/${id}`
      },
      {
        id: 'tv_multiembed_dub',
        name: 'MultiEmbed TV (Multi-Áudio)',
        tag: 'ALTERNATIVA HD',
        url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`
      },
      {
        id: 'tv_vidsrc_dub',
        name: 'VidSrc Fast (Multi-Áudio)',
        tag: 'VELOCIDADE MÁXIMA',
        url: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`
      }
    ],
    legendado: [
      {
        id: 'tv_vidlink_orig',
        name: '⭐ VidLink Ultra HD (Áudio Original & Legendas PT)',
        tag: 'RECOMENDADO TV BOX',
        url: (id) => `https://vidlink.pro/movie/${id}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&iconColor=ef4444`
      },
      {
        id: 'tv_multiembed_orig',
        name: 'MultiEmbed TV (Original / Leg)',
        tag: 'ORIGINAL HD',
        url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`
      },
      {
        id: 'tv_vidsrc_orig',
        name: 'VidSrc To (Original)',
        tag: 'ALTA DEFINIÇÃO',
        url: (id) => `https://vidsrc.to/embed/movie/${id}`
      }
    ]
  },
  tv: {
    dublado: [
      {
        id: 'tv_vidlink_tv_dub',
        name: '⭐ VidLink Ultra HD (Séries Dublado / Multi-Áudio)',
        tag: 'RECOMENDADO TV BOX',
        url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&iconColor=ef4444`
      },
      {
        id: 'tv_superflix_tv_dub',
        name: 'SuperFlix Séries (Dublado BR)',
        tag: 'DUBLAGEM BR',
        url: (id, s, e) => `https://superflixapi.bond/serie/${id}/${s}/${e}`
      },
      {
        id: 'tv_multiembed_tv_dub',
        name: 'MultiEmbed Séries (Multi-Áudio)',
        tag: 'ALTERNATIVA HD',
        url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
      },
      {
        id: 'tv_vidsrc_tv_dub',
        name: 'VidSrc Séries (Multi-Áudio)',
        tag: 'VELOCIDADE MÁXIMA',
        url: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
      }
    ],
    legendado: [
      {
        id: 'tv_vidlink_tv_orig',
        name: '⭐ VidLink Ultra HD (Séries Original & Legendas PT)',
        tag: 'RECOMENDADO TV BOX',
        url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&primaryColor=ef4444&secondaryColor=1f2937&iconColor=ef4444`
      },
      {
        id: 'tv_multiembed_tv_orig',
        name: 'MultiEmbed Séries (Original / Leg)',
        tag: 'ORIGINAL HD',
        url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
      },
      {
        id: 'tv_vidsrc_tv_orig',
        name: 'VidSrc To (Original)',
        tag: 'ALTA DEFINIÇÃO',
        url: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
      }
    ]
  }
};

/**
 * Player exclusivo para CineSpartan TV Box & APK Android
 * - Isolado da versão Web
 * - Suporte nativo a Controle Remoto (D-Pad, OK, Voltar, Play/Pause)
 * - Escudo anti-anúncios e popups integrado
 * - WakeLock para manter a tela da TV sempre ligada
 */
function VideoPlayerTVBox({
  movieId,
  tvId,
  season = 1,
  episode = 1,
  title,
  backdrop,
  poster,
  releaseDate,
  status,
  videos
}) {
  const isSeries = Boolean(tvId);
  const mediaId = isSeries ? tvId : movieId;

  const { language } = useLanguage();
  const { isActive, isAdmin, isSuspended, refreshProfile } = useAuthProfile();
  const [hasStarted, setHasStarted] = useState(false);
  const [streamMode, setStreamMode] = useState(() => (language && !language.startsWith('pt') ? 'legendado' : 'dublado'));
  const [sourceIdx, setSourceIdx] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [focusedBtn, setFocusedBtn] = useState('play'); // 'play', 'server_0', 'server_1', 'mode'

  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Verificação de permissão de assinatura
  useEffect(() => {
    refreshProfile?.();
  }, [mediaId, season, episode, refreshProfile]);

  const canPlay = !isSuspended && (isAdmin || isActive);
  const { isScreenBlocked, activeDevices, maxScreens, disconnectOtherDevices } = useScreenLimiter(canPlay && hasStarted);

  // Fontes de servidores baseadas no tipo de mídia (Filme ou Série)
  const serverGroup = isSeries ? TV_SERVERS.tv : TV_SERVERS.movie;
  const currentSources = serverGroup[streamMode] || serverGroup.dublado;
  const activeServer = currentSources[sourceIdx] || currentSources[0];

  const iframeSrc = isSeries
    ? activeServer.url(tvId, season, episode)
    : activeServer.url(movieId);

  // Trava de tela ligada (Screen Wake Lock) para TV Box
  useEffect(() => {
    let released = false;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && hasStarted && !released) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch {}
    };
    if (hasStarted) requestWakeLock();

    return () => {
      released = true;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [hasStarted]);

  // Mensagem temporária na tela (Toast de feedback na TV)
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  }, []);

  // Temporizador para esconder os controles da TV após 4 segundos sem uso
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (hasStarted) setShowControls(false);
    }, 4500);
  }, [hasStarted]);

  // Navegação por Controle Remoto da TV Box (D-Pad: Setas, OK, Play, Voltar)
  useEffect(() => {
    const handleTvRemoteKeyDown = (e) => {
      resetControlsTimer();
      const code = e.keyCode || e.which;

      // OK / Enter / D-Pad Center / Media Play (13, 23, 66, 85, 126)
      if (code === 13 || code === 23 || code === 66 || code === 85 || code === 126) {
        if (!hasStarted) {
          e.preventDefault();
          setHasStarted(true);
          showToast('Iniciando reprodução no modo TV Box Turbo...');
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
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black group select-none"
    >
      {/* Toast de Notificação na TV */}
      {toastMessage && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-black/90 border border-red-500/50 text-white font-bold text-sm shadow-2xl flex items-center gap-2 animate-bounce">
          <FaBolt className="text-amber-400 text-xs" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Selo Exclusivo CineSpartan TV Box */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 pointer-events-none">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600/90 text-white text-[11px] font-black tracking-wider uppercase shadow-lg border border-red-400/40">
          <FaTv className="text-xs" />
          <span>TV BOX TURBO VIP</span>
        </span>
        <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
          <FaShieldAlt className="text-[10px]" />
          <span>ESCUDO ANTI-POPUP ATIVO</span>
        </span>
      </div>

      {/* TELA DE INÍCIO DA TV BOX (Pôster com botão Play Gigante) */}
      {!hasStarted ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
          {bgImage && (
            <img
              src={bgImage}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[2px]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

          <div className="relative z-10 flex flex-col items-center max-w-lg">
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight mb-2 drop-shadow-lg">
              {title}
            </h2>
            {isSeries && (
              <span className="text-sm font-bold text-red-400 bg-red-950/60 px-3 py-1 rounded-lg border border-red-500/30 mb-4">
                Temporada {season} • Episódio {episode}
              </span>
            )}

            {/* Botão Play TV Gigante */}
            <button
              onClick={() => {
                setHasStarted(true);
                showToast('Carregando servidor dedicado...');
              }}
              className="mt-2 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-2xl shadow-red-900/80 border-2 border-white/20 transition-all hover:scale-105 ring-4 ring-red-500/30"
              title="Pressione OK ou clique para assistir"
            >
              <FaPlay className="ml-1 text-white" />
            </button>

            <span className="text-xs font-semibold text-gray-300 mt-4 bg-black/70 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
              <span>🎮 Pressione</span>
              <kbd className="px-2 py-0.5 bg-red-600/40 text-red-300 rounded font-bold border border-red-500/40 text-[11px]">OK</kbd>
              <span>no controle da TV para dar Play</span>
            </span>
          </div>
        </div>
      ) : (
        /* IFRAME STREAMING BLINDADO DA TV BOX */
        <iframe
          key={`${mediaId}-${isSeries ? `${season}-${episode}` : ''}-${streamMode}-${activeServer.id}`}
          src={iframeSrc}
          title={title}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture; screen-wake-lock"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full border-0 relative z-10"
        />
      )}

      {/* BARRA DE CONTROLE DA TV BOX (Auto-hide após 4s) */}
      {hasStarted && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black via-black/85 to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Seletor Dublado / Legendado */}
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
              <button
                onClick={() => {
                  setStreamMode('dublado');
                  setSourceIdx(0);
                  showToast('Modo Dublado BR ativado');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  streamMode === 'dublado'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FaVolumeUp className="text-[11px]" />
                <span>Dublado BR</span>
              </button>

              <button
                onClick={() => {
                  setStreamMode('legendado');
                  setSourceIdx(0);
                  showToast('Modo Legendado ativado');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  streamMode === 'legendado'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FaClosedCaptioning className="text-[11px]" />
                <span>Legendado</span>
              </button>
            </div>

            {/* Seletor Rápido de Servidores Otimizados para TV Box */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
              {currentSources.map((srv, idx) => {
                const isSelected = idx === sourceIdx;
                return (
                  <button
                    key={srv.id}
                    onClick={() => {
                      setSourceIdx(idx);
                      showToast(`Servidor alternado para ${srv.name}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950/60 ring-2 ring-red-400/50 scale-105'
                        : 'bg-white/10 hover:bg-white/20 text-gray-300 border-white/10'
                    }`}
                  >
                    <span>{srv.name}</span>
                    {srv.tag && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-black">
                        {srv.tag}
                      </span>
                    )}
                  </button>
                );
              })}
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
  poster: PropTypes.string,
  releaseDate: PropTypes.string,
  status: PropTypes.string,
  videos: PropTypes.array
};

export default memo(VideoPlayerTVBox);
