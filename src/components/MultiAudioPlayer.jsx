import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

/**
 * Player HLS com seleção de faixa de áudio (dublagem) e legendas.
 * - Chrome/Edge/Firefox/Android WebView: hls.js (MSE)
 * - Safari/iOS: HLS nativo + video.audioTracks
 * A preferência de idioma fica salva em localStorage (storageKey).
 */

const DEFAULT_LANG = 'pt-BR';

const readPreferredLang = (storageKey) => {
  try {
    return localStorage.getItem(storageKey) || DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
};

const savePreferredLang = (storageKey, lang) => {
  try {
    if (lang) localStorage.setItem(storageKey, lang);
  } catch {
    // localStorage indisponível (modo privado / WebView restrita): ignora
  }
};

// Casa "pt-BR" com "pt-BR", "pt-br", "pt", "por"
const langMatches = (trackLang, wanted) => {
  if (!trackLang || !wanted) return false;
  const a = String(trackLang).toLowerCase();
  const b = String(wanted).toLowerCase();
  if (a === b) return true;
  const base = (s) => (s === 'por' ? 'pt' : s === 'eng' ? 'en' : s.split('-')[0]);
  return base(a) === base(b);
};

const labelFor = (track, idx) => {
  // ffmpeg não aceita espaços no var_stream_map, então os nomes vêm com "_"
  const raw = track?.name || track?.lang || track?.label || track?.language;
  return raw ? String(raw).replace(/_/g, ' ') : `Faixa ${idx + 1}`;
};

function MultiAudioPlayer({ src, poster, title, storageKey = 'cs_audio_lang', autoPlay = false }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const recoverRef = useRef({ network: 0, media: 0 });

  const [audioTracks, setAudioTracks] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(-1);
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [currentSub, setCurrentSub] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const pickInitialAudio = useCallback(
    (tracks, getLang) => {
      const wanted = readPreferredLang(storageKey);
      const idx = tracks.findIndex((t) => langMatches(getLang(t), wanted));
      return idx >= 0 ? idx : 0;
    },
    [storageKey]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    setError('');
    setIsLoading(true);
    setAudioTracks([]);
    setSubtitleTracks([]);
    setCurrentAudio(-1);
    setCurrentSub(-1);
    recoverRef.current = { network: 0, media: 0 };

    let nativeCleanup = null;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        manifestLoadingTimeOut: 10000,
        fragLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 1,
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        const tracks = hls.audioTracks || [];
        setAudioTracks(tracks);
        if (tracks.length > 0) {
          const idx = pickInitialAudio(tracks, (t) => t.lang);
          hls.audioTrack = idx;
          setCurrentAudio(idx);
        }
        hls.subtitleDisplay = true;
        hls.subtitleTrack = -1;
        if (autoPlay) video.play().catch(() => {});
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_e, data) => {
        setAudioTracks(data?.audioTracks || []);
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_e, data) => {
        if (typeof data?.id === 'number') setCurrentAudio(data.id);
      });

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_e, data) => {
        setSubtitleTracks(data?.subtitleTracks || []);
      });

      hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (_e, data) => {
        if (typeof data?.id === 'number') setCurrentSub(data.id);
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data?.fatal) return;
        const status = data.response?.code;

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR && status === 404) {
            setIsLoading(false);
            setError('Arquivo de vídeo não encontrado. Gere o HLS com scripts/dub/package-hls.mjs.');
            hls.destroy();
            hlsRef.current = null;
            return;
          }
          if (recoverRef.current.network < 2) {
            recoverRef.current.network += 1;
            hls.startLoad();
            return;
          }
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          if (recoverRef.current.media < 2) {
            recoverRef.current.media += 1;
            hls.recoverMediaError();
            return;
          }
        }

        console.warn('[MultiAudioPlayer] Erro fatal:', data.type, data.details);
        setIsLoading(false);
        setError('Não foi possível reproduzir este vídeo.');
        hls.destroy();
        hlsRef.current = null;
      });

      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS: HLS nativo
      video.src = src;

      const syncNativeTracks = () => {
        const list = video.audioTracks ? Array.from(video.audioTracks) : [];
        setAudioTracks(list.map((t) => ({ name: t.label, lang: t.language })));
        if (list.length > 0) {
          const idx = pickInitialAudio(list, (t) => t.language);
          list.forEach((t, i) => {
            t.enabled = i === idx;
          });
          setCurrentAudio(idx);
        }
        const subs = video.textTracks
          ? Array.from(video.textTracks).filter((t) => t.kind === 'subtitles' || t.kind === 'captions')
          : [];
        setSubtitleTracks(subs.map((t) => ({ name: t.label, lang: t.language })));
      };

      const onLoaded = () => {
        setIsLoading(false);
        syncNativeTracks();
        if (autoPlay) video.play().catch(() => {});
      };
      const onError = () => {
        setIsLoading(false);
        setError('Não foi possível reproduzir este vídeo.');
      };

      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onError);
      nativeCleanup = () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onError);
      };
    } else {
      setIsLoading(false);
      setError('Seu navegador não suporta streaming HLS.');
    }

    return () => {
      if (nativeCleanup) nativeCleanup();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeAttribute('src');
      video.load();
    };
  }, [src, autoPlay, pickInitialAudio]);

  const selectAudio = (idx) => {
    const track = audioTracks[idx];
    if (!track) return;
    const hls = hlsRef.current;
    const video = videoRef.current;
    if (hls) {
      hls.audioTrack = idx;
    } else if (video?.audioTracks) {
      Array.from(video.audioTracks).forEach((t, i) => {
        t.enabled = i === idx;
      });
    }
    setCurrentAudio(idx);
    savePreferredLang(storageKey, track.lang);
    setMenuOpen(false);
  };

  const selectSubtitle = (idx) => {
    const hls = hlsRef.current;
    const video = videoRef.current;
    if (hls) {
      hls.subtitleTrack = idx;
    } else if (video?.textTracks) {
      const subs = Array.from(video.textTracks).filter((t) => t.kind === 'subtitles' || t.kind === 'captions');
      subs.forEach((t, i) => {
        t.mode = i === idx ? 'showing' : 'disabled';
      });
    }
    setCurrentSub(idx);
    setMenuOpen(false);
  };

  const hasOptions = audioTracks.length > 1 || subtitleTracks.length > 0;

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        poster={poster}
        title={title}
        crossOrigin="anonymous"
      />

      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-4 border-white/30 border-t-red-600 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center">
          <p className="text-sm text-gray-200">{error}</p>
        </div>
      )}

      {!error && hasOptions && (
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="px-3 py-1.5 rounded bg-black/70 hover:bg-black/90 text-white text-xs font-bold border border-white/20"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            🎧 Áudio e legendas
          </button>

          {menuOpen && (
            <div className="mt-2 w-56 rounded-md bg-zinc-900/95 border border-white/10 shadow-xl text-sm text-white p-2">
              {audioTracks.length > 0 && (
                <>
                  <p className="px-2 py-1 text-[11px] uppercase tracking-wide text-gray-400">Áudio</p>
                  {audioTracks.map((t, i) => (
                    <button
                      key={`a-${i}`}
                      type="button"
                      onClick={() => selectAudio(i)}
                      className={`w-full text-left px-2 py-1.5 rounded hover:bg-white/10 ${
                        i === currentAudio ? 'text-red-500 font-bold' : ''
                      }`}
                    >
                      {i === currentAudio ? '✓ ' : ''}
                      {labelFor(t, i)}
                    </button>
                  ))}
                </>
              )}

              {subtitleTracks.length > 0 && (
                <>
                  <p className="px-2 py-1 mt-1 text-[11px] uppercase tracking-wide text-gray-400">Legendas</p>
                  <button
                    type="button"
                    onClick={() => selectSubtitle(-1)}
                    className={`w-full text-left px-2 py-1.5 rounded hover:bg-white/10 ${
                      currentSub === -1 ? 'text-red-500 font-bold' : ''
                    }`}
                  >
                    {currentSub === -1 ? '✓ ' : ''}Desativadas
                  </button>
                  {subtitleTracks.map((t, i) => (
                    <button
                      key={`s-${i}`}
                      type="button"
                      onClick={() => selectSubtitle(i)}
                      className={`w-full text-left px-2 py-1.5 rounded hover:bg-white/10 ${
                        i === currentSub ? 'text-red-500 font-bold' : ''
                      }`}
                    >
                      {i === currentSub ? '✓ ' : ''}
                      {labelFor(t, i)}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MultiAudioPlayer;
