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
  FaServer,
  FaTv,
  FaInfoCircle
} from 'react-icons/fa';

const LiveTvPlayer = ({ channel, onNextChannel, onPrevChannel }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  const [sourceIdx, setSourceIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentSource = channel?.sources?.[sourceIdx] || channel?.sources?.[0];
  const isEmbed = currentSource?.url?.includes('multiembed.mov') || currentSource?.url?.includes('embed');

  // Reset state when channel changes
  useEffect(() => {
    setSourceIdx(0);
    setHasError(false);
    setIsLoading(true);
  }, [channel?.id]);

  // Handle HLS stream loading
  useEffect(() => {
    if (!currentSource?.url || isEmbed) {
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setHasError(false);

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = currentSource.url;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {
          // Autoplay policy: start muted if needed
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('Live stream network error, trying recover...', data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('Live stream media error, recovering...', data);
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal HLS error:', data);
              hls.destroy();
              setHasError(true);
              setErrorMessage('Falha ao conectar à transmissão deste canal.');
              setIsLoading(false);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari support
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });
      video.addEventListener('error', () => {
        setHasError(true);
        setErrorMessage('Transmissão ao vivo indisponível neste momento.');
        setIsLoading(false);
      });
    } else {
      setHasError(true);
      setErrorMessage('Seu navegador não suporta streaming HLS ao vivo.');
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentSource?.url, isEmbed]);

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
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleNextServer = () => {
    if (!channel?.sources || channel.sources.length <= 1) return;
    const nextIdx = (sourceIdx + 1) % channel.sources.length;
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
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Servidores alternativos */}
          {channel?.sources?.length > 1 && (
            <button
              type="button"
              onClick={handleNextServer}
              title="Trocar para o servidor alternativo deste canal"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/30 transition-all shadow-sm"
            >
              <FaRedoAlt className="text-[10px]" />
              <span>Trocar Rota ({sourceIdx + 1}/{channel.sources.length})</span>
            </button>
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
          isFullscreen ? 'h-screen w-screen rounded-none ring-0' : 'aspect-video rounded-2xl ring-1 ring-white/10'
        }`}
      >
        {isEmbed ? (
          <iframe
            key={currentSource.url}
            src={currentSource.url}
            allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *"
            allowFullScreen
            title={channel.name}
            className="w-full h-full border-0"
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            playsInline
            controls={false}
          />
        )}

        {/* Loading Spinner */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none">
            <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-600 rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-semibold text-white animate-pulse">Sintonizando {channel.name}...</p>
          </div>
        )}

        {/* Error Fallback Banner */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 p-6 text-center">
            <FaTv className="text-4xl text-red-500 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Sinal Temporariamente Fora do Ar</h3>
            <p className="text-xs text-gray-400 max-w-md mb-4 leading-relaxed">
              {errorMessage || 'Este canal está fora do ar no momento ou em intervalo de transmissão.'}
            </p>
            {channel?.sources?.length > 1 && (
              <button
                onClick={handleNextServer}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg transition-all"
              >
                <FaRedoAlt />
                <span>Testar Rota Alternativa ({sourceIdx + 1}/{channel.sources.length})</span>
              </button>
            )}
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
          <strong>Dica Esportiva:</strong> Canais como <strong>Premiere</strong> ativam seu sinal principal e abrem múltiplas câmeras durante os horários dos jogos da rodada. Se um canal demorar a carregar, clique em <strong>&quot;Trocar Rota&quot;</strong> ou selecione outro canal na grade ao lado.
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
