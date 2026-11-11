import React, { useEffect, useRef, useState, memo } from 'react';
import PropTypes from 'prop-types';
import Hls from 'hls.js';
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress,
  FaRedoAlt,
  FaTv,
  FaInfoCircle,
  FaStepForward,
  FaStepBackward,
  FaExternalLinkAlt
} from 'react-icons/fa';

// Helper to route external streams without CORS through our same-origin stream proxy
const isNativePlatform = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window?.Capacitor?.isNativePlatform?.() === true ||
    window?.Capacitor?.getPlatform?.() === 'android' ||
    window?.Capacitor?.getPlatform?.() === 'ios' ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && !window.location.port)
  );
};

const getProxyBase = () => {
  return isNativePlatform() ? 'https://cn-spartan.vercel.app/api/proxy-stream' : '/api/proxy-stream';
};

const resolveStreamUrl = (url, forceProxy = false) => {
  if (!url) return '';
  // Se for embed (iframe / youtube / multiembed), mantém direto
  if (
    url.includes('youtube.com') ||
    url.includes('embed') ||
    url.includes('multiembed') ||
    url.includes('/api/proxy-stream')
  ) {
    return url;
  }

  const isNative = isNativePlatform();
  const proxyBase = getProxyBase();

  if (forceProxy) {
    return `${proxyBase}?url=${encodeURIComponent(url)}`;
  }

  // Pluto TV / jmp2.uk sempre exigem proxy devido ao cabeçalho CORS restrito do servidor
  if (url.includes('jmp2.uk') || url.includes('pluto.tv')) {
    return `${proxyBase}?url=${encodeURIComponent(url)}`;
  }

  // No navegador web (HTTPS), streams HTTP puros ou com CORS restrito precisam de proxy
  if (!isNative) {
    if (
      url.startsWith('http://') ||
      url.includes('45.185.') ||
      url.includes('64.31.') ||
      url.includes('170.83.') ||
      url.includes('138.204.') ||
      url.includes('acaidopt.org') ||
      url.includes('tvcultura') ||
      url.includes('zoeweb.tv') ||
      url.includes('amagi.tv') ||
      url.includes('wurl.tv') ||
      url.includes(':8000') ||
      url.includes(':2082') ||
      url.includes(':8080') ||
      url.includes(':8083')
    ) {
      return `${proxyBase}?url=${encodeURIComponent(url)}`;
    }
  }

  return url;
};

const LiveTvPlayer = ({ channel, onNextChannel, onPrevChannel }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  const [sourceIdx, setSourceIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const sources = channel?.sources || [];
  const currentSource = sources[sourceIdx] || sources[0];
  const isEmbed = Boolean(
    currentSource?.url?.includes('multiembed.mov') ||
    currentSource?.url?.includes('embedsports.me') ||
    currentSource?.url?.includes('youtube.com/embed') ||
    currentSource?.url?.includes('embed') ||
    currentSource?.url?.includes('live=')
  );

  // Reset state when channel changes
  useEffect(() => {
    setSourceIdx(0);
    setHasError(false);
    setIsLoading(true);
    setIsPlaying(false);
  }, [channel?.id]);

  // Video element event listeners to reliably track playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed) return;

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setHasError(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [isEmbed, currentSource?.url]);

  // Watchdog timer to ensure the player NEVER hangs indefinitely on "Carregando"
  useEffect(() => {
    let timer;
    if (isLoading && !hasError && !isEmbed) {
      timer = setTimeout(() => {
        if (isLoading && !isPlaying) {
          console.warn('[LiveTvPlayer] Stream load timeout (15s) for:', currentSource?.url);
          // If there is another route available, automatically attempt the next route
          if (sources.length > 1 && sourceIdx < sources.length - 1) {
            setSourceIdx(prev => prev + 1);
          } else {
            setIsLoading(false);
            setHasError(true);
            setErrorMessage('O sinal deste canal está demorando para responder ou em intervalo. Clique em "Rota Alternativa" ou escolha outro canal.');
          }
        }
      }, 15000);
    }
    return () => clearTimeout(timer);
  }, [isLoading, isPlaying, hasError, isEmbed, sourceIdx, sources.length, currentSource?.url]);

  // Handle stream loading (HLS or Native)
  useEffect(() => {
    if (!currentSource?.url || isEmbed) {
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setHasError(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = resolveStreamUrl(currentSource.url);

    if (Hls.isSupported()) {
      const hlsConfig = {
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: 45,
        maxMaxBufferLength: 90,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        manifestLoadingTimeOut: 20000,
        levelLoadingTimeOut: 20000,
        fragLoadingTimeOut: 35000,
        fragLoadingMaxRetry: 8,
        fragLoadingRetryDelay: 1000,
        fragLoadingMaxRetryTimeout: 64000,
        manifestLoadingMaxRetry: 6,
        manifestLoadingRetryDelay: 1000,
      };

      const hls = new Hls(hlsConfig);

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setHasError(false);
        // Start muted for 100% reliable autoplay compliance across all browsers
        video.muted = true;
        setIsMuted(true);
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => {
              setIsPlaying(false);
            });
        }
      });

      hls.on(Hls.Events.LEVEL_LOADED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        // Ignore non-fatal internal events (like bufferSeekOverHole or retry attempts)
        if (!data.fatal) {
          return;
        }

        console.warn('[Hls] Fatal Error:', data.type, data.details);

        if (data.details === 'manifestIncompatibleCodecsError' || data.details === 'bufferIncompatibleCodecsError') {
          hls.destroy();
          if (sources.length > 1 && sourceIdx < sources.length - 1) {
            setSourceIdx(prev => prev + 1);
          } else {
            setIsLoading(false);
            setHasError(true);
            setErrorMessage('Codec de vídeo incompatível com o navegador atual.');
          }
          return;
        }

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.destroy();
              // Se falhou por CORS ou rede e ainda não tentou o proxy, tenta via proxy CORS
              if (!streamUrl.includes('proxy-stream')) {
                const proxiedRetryUrl = resolveStreamUrl(currentSource.url, true);
                const retryHls = new Hls(hlsConfig);
                hlsRef.current = retryHls;
                retryHls.loadSource(proxiedRetryUrl);
                retryHls.attachMedia(video);
                retryHls.on(Hls.Events.MANIFEST_PARSED, () => {
                  setIsLoading(false);
                  setHasError(false);
                  video.muted = true;
                  setIsMuted(true);
                  video.play().catch(() => {});
                });
                retryHls.on(Hls.Events.LEVEL_LOADED, () => {
                  setIsLoading(false);
                });
                retryHls.on(Hls.Events.ERROR, (_evt, retryErr) => {
                  if (retryErr.fatal) {
                    retryHls.destroy();
                    if (sources.length > 1 && sourceIdx < sources.length - 1) {
                      setSourceIdx(prev => prev + 1);
                    } else {
                      setIsLoading(false);
                      setHasError(true);
                      setErrorMessage('Não foi possível conectar ao servidor de streaming deste canal.');
                    }
                  }
                });
                return;
              }

              if (sources.length > 1 && sourceIdx < sources.length - 1) {
                setSourceIdx(prev => prev + 1);
              } else {
                setIsLoading(false);
                setHasError(true);
                setErrorMessage('Não foi possível conectar ao servidor de streaming deste canal.');
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setIsLoading(false);
              setHasError(true);
              setErrorMessage('Falha ao reproduzir o sinal ao vivo.');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari iOS/macOS Native HLS
      video.src = streamUrl;
      const onLoaded = () => {
        setIsLoading(false);
        setHasError(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      };
      const onError = () => {
        setIsLoading(false);
        setHasError(true);
        setErrorMessage('Sinal temporariamente indisponível no navegador.');
      };

      video.addEventListener('loadedmetadata', onLoaded, { once: true });
      video.addEventListener('error', onError, { once: true });
    } else {
      setIsLoading(false);
      setHasError(true);
      setErrorMessage('Navegador não suporta streaming HLS nativo.');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentSource?.url, isEmbed, sourceIdx, sources.length]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);

    const el = containerRef.current;
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

  const handleNextServer = () => {
    if (sources.length <= 1) return;
    const nextIdx = (sourceIdx + 1) % sources.length;
    setSourceIdx(nextIdx);
    setHasError(false);
    setIsLoading(true);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#0f141f]/95 border border-white/10 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-red-500">
              AO VIVO
            </span>
          </div>

          <div className="h-4 w-px bg-white/20 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">{channel.name}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-300 uppercase">
              {channel.resolution || 'HD'}
            </span>
            {isEmbed && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase hidden sm:inline">
                Web Embed
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Quick channel skip */}
          {onPrevChannel && (
            <button
              onClick={onPrevChannel}
              title="Canal Anterior"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10 transition-all text-xs"
            >
              <FaStepBackward />
            </button>
          )}

          {onNextChannel && (
            <button
              onClick={onNextChannel}
              title="Próximo Canal"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10 transition-all text-xs"
            >
              <FaStepForward />
            </button>
          )}

          {/* Servidores alternativos */}
          {sources.length > 1 && (
            <button
              type="button"
              onClick={handleNextServer}
              title="Trocar para rota alternativa"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/30 transition-all shadow-sm"
            >
              <FaRedoAlt className="text-[10px]" />
              <span>Rota {sourceIdx + 1}/{sources.length}</span>
            </button>
          )}

          {/* Abrir link externo se for embed */}
          {isEmbed && currentSource?.url && (
            <a
              href={currentSource.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir player em nova aba"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-all border border-white/10"
            >
              <FaExternalLinkAlt className="text-[10px]" />
              <span className="hidden md:inline">Nova Aba</span>
            </a>
          )}

          {/* Botão de Tela Cheia */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Abrir em Tela Cheia'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all shadow border border-white/10"
          >
            {isFullscreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Sair' : 'Tela Cheia'}</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div
        ref={containerRef}
        className={`relative w-full bg-black overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all ${
          isFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none ring-0' : 'aspect-video rounded-2xl ring-1 ring-white/10'
        }`}
      >
        {isEmbed ? (
          <iframe
            key={currentSource.url}
            src={currentSource.url}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            title={channel.name}
            className="w-full h-full border-0"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
              playsInline
              muted={isMuted}
              controls={false}
            />

            {/* Central Play Button overlay when paused */}
            {!isPlaying && !isLoading && !hasError && (
              <button
                onClick={togglePlay}
                type="button"
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-all z-10 group"
                title="Clique para Reproduzir"
              >
                <div className="w-16 h-16 rounded-full bg-red-600/90 group-hover:bg-red-600 flex items-center justify-center text-white shadow-2xl transform group-hover:scale-110 transition-all">
                  <FaPlay className="text-xl ml-1" />
                </div>
              </button>
            )}

            {/* Unmute prompt banner */}
            {isPlaying && isMuted && (
              <button
                type="button"
                onClick={toggleMute}
                className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-amber-300 hover:text-white text-xs font-semibold backdrop-blur-md border border-amber-500/40 transition-all shadow-lg animate-pulse"
                title="Clique para ativar som"
              >
                <FaVolumeMute className="text-sm text-amber-400" />
                <span>Clique para ativar o áudio</span>
              </button>
            )}
          </>
        )}

        {/* Loading Spinner */}
        {isLoading && !hasError && !isEmbed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none">
            <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-600 rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-semibold text-white animate-pulse">Sintonizando {channel.name}...</p>
          </div>
        )}

        {/* Error Fallback Banner */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 p-6 text-center">
            <FaTv className="text-4xl text-red-500 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Sinal Fora do Ar ou em Intervalo</h3>
            <p className="text-xs text-gray-400 max-w-md mb-4 leading-relaxed">
              {errorMessage || 'Este canal está fora do ar no momento ou em intervalo entre transmissões.'}
            </p>
            <div className="flex items-center gap-3">
              {sources.length > 1 && (
                <button
                  onClick={handleNextServer}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg transition-all"
                >
                  <FaRedoAlt />
                  <span>Testar Rota Alternativa ({sourceIdx + 1}/{sources.length})</span>
                </button>
              )}
              {onNextChannel && (
                <button
                  onClick={onNextChannel}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/10"
                >
                  <FaStepForward />
                  <span>Próximo Canal</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Custom Overlay Controls (Visible on hover if not iframe) */}
        {!isEmbed && (
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity duration-200 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-md"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <FaPause className="text-sm" /> : <FaPlay className="text-sm ml-0.5" />}
              </button>

              <button
                onClick={toggleMute}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-md"
                title={isMuted ? 'Ativar Som' : 'Silenciar'}
              >
                {isMuted ? <FaVolumeMute className="text-sm" /> : <FaVolumeUp className="text-sm" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-md"
                title="Tela Cheia"
              >
                {isFullscreen ? <FaCompress className="text-sm" /> : <FaExpand className="text-sm" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Helpful Tip */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs">
        <FaInfoCircle className="text-red-500 shrink-0 text-sm" />
        <span>
          <strong>Dica Esportiva:</strong> Canais como <strong>Premiere</strong> e <strong>SporTV</strong> transmitem via Web Player e iniciam a cobertura minutos antes das partidas. Caso o player necessite, clique no botão de reprodução dentro do vídeo.
        </span>
      </div>
    </div>
  );
};

LiveTvPlayer.propTypes = {
  channel: PropTypes.object.isRequired,
  onNextChannel: PropTypes.func,
  onPrevChannel: PropTypes.func,
};

export default memo(LiveTvPlayer);
