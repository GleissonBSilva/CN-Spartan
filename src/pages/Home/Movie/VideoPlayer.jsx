import { memo, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FaServer, FaInfoCircle, FaExpand, FaCompress, FaVolumeUp, FaClosedCaptioning, FaCheck } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';

const SOURCES = [
  { id: 'dub_br_1', type: 'dub', lang: 'pt', name: '🇧🇷 Servidor 1 (Dublado BR)', url: (id) => `https://superflixapi.bond/filme/${id}` },
  { id: 'dub_br_2', type: 'dub', lang: 'pt', name: '🇧🇷 Servidor 2 (Dublado Alt)', url: (id) => `https://superflixapi.online/filme/${id}` },
  { id: 'vidlink', type: 'sub', lang: 'multi', name: '🌐 Servidor 3 (VidLink - Legendas Multi)', url: (id) => `https://vidlink.pro/movie/${id}?primaryColor=e50914&secondaryColor=ffffff&iconColor=e50914&poster=true&title=true&nextbutton=false` },
  { id: 'embedsu', type: 'sub', lang: 'en', name: '⚡ Servidor 4 (EmbedSU - Multi Legendas)', url: (id) => `https://embed.su/embed/movie/${id}` },
  { id: 'multiembed', type: 'sub', lang: 'es', name: '🎬 Servidor 5 (MultiEmbed - Español/Multi)', url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1` },
  { id: 'autoembed', type: 'sub', lang: 'en', name: '🚀 Servidor 6 (AutoEmbed)', url: (id) => `https://player.autoembed.cc/embed/movie/${id}` },
];

const AUDIO_OPTIONS = [
  { id: 'pt', label: '🇧🇷 Dublado (PT)', targetIdx: 0 },
  { id: 'en', label: '🇺🇸 Áudio Original (EN)', targetIdx: 2 },
  { id: 'es', label: '🇪🇸 Español', targetIdx: 4 },
];

const SUBTITLE_OPTIONS = [
  { id: 'pt', label: '🇧🇷 Legenda PT-BR', targetIdx: 2, desc: 'Português (Brasil)' },
  { id: 'en', label: '🇺🇸 Legenda EN', targetIdx: 2, desc: 'English' },
  { id: 'es', label: '🇪🇸 Legenda ES', targetIdx: 4, desc: 'Español' },
  { id: 'multi', label: '🌐 Mais Idiomas (CC)', targetIdx: 2, desc: 'Outros idiomas no menu CC' },
];

const VideoPlayer = ({ movieId }) => {
    const { language, t } = useLanguage();
    const [shouldRender, setShouldRender] = useState(false);
    const [sourceIdx, setSourceIdx] = useState(0);
    const [selectedSubtitle, setSelectedSubtitle] = useState(() => localStorage.getItem('cinespartan_sub_pref') || 'pt');
    const [showSubNotice, setShowSubNotice] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const playerContainerRef = useRef(null);

    // Auto-select preferred server when language or movieId changes
    useEffect(() => {
        if (language.startsWith('en')) {
            setSourceIdx(2);
        } else if (language.startsWith('es')) {
            setSourceIdx(4);
        } else {
            setSourceIdx(0);
        }
    }, [language, movieId]);

    useEffect(() => {
        setShouldRender(false);
        const timer = setTimeout(() => setShouldRender(true), 150);
        return () => clearTimeout(timer);
    }, [movieId, sourceIdx]);

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
        };
    }, []);

    const toggleFullscreen = () => {
        if (!playerContainerRef.current) return;
        if (!document.fullscreenElement) {
            const el = playerContainerRef.current;
            if (el.requestFullscreen) {
                el.requestFullscreen();
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            } else if (el.mozRequestFullScreen) {
                el.mozRequestFullScreen();
            } else if (el.msRequestFullscreen) {
                el.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    };

    const handleSelectAudio = (opt) => {
        setSourceIdx(opt.targetIdx);
        setShowSubNotice(false);
    };

    const handleSelectSubtitle = (opt) => {
        setSelectedSubtitle(opt.id);
        localStorage.setItem('cinespartan_sub_pref', opt.id);
        setSourceIdx(opt.targetIdx);
        setShowSubNotice(true);
    };

    if (!movieId) return null;

    const iframeSrc = SOURCES[sourceIdx].url(movieId);

    return (
        <div className="w-full flex flex-col gap-3">
            {/* Quick Audio & Subtitles Toolbar */}
            <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-[#0f141f]/90 border border-white/10 shadow-xl backdrop-blur-md">
                
                {/* Audio Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                            <FaVolumeUp className="text-red-500 text-sm" /> Áudio:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {AUDIO_OPTIONS.map((opt) => {
                                const isCurrent = (opt.id === 'pt' && (sourceIdx === 0 || sourceIdx === 1)) ||
                                                  (opt.id === 'en' && (sourceIdx === 2 || sourceIdx === 3 || sourceIdx === 5)) ||
                                                  (opt.id === 'es' && sourceIdx === 4);
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleSelectAudio(opt)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                            isCurrent
                                                ? 'bg-red-600 text-white shadow-md shadow-red-950/40 ring-1 ring-red-400'
                                                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fullscreen Button */}
                    <button
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Sair da Tela Cheia' : 'Abrir em Tela Cheia'}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all shadow border border-white/10 shrink-0"
                    >
                        {isFullscreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
                        <span>{isFullscreen ? 'Sair' : 'Tela Cheia'}</span>
                    </button>
                </div>

                {/* Subtitle Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                        <FaClosedCaptioning className="text-amber-400 text-sm" /> Legendas:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {SUBTITLE_OPTIONS.map((opt) => {
                            const isCurrent = (sourceIdx === 2 || sourceIdx === 3 || sourceIdx === 4) && selectedSubtitle === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleSelectSubtitle(opt)}
                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                                        isCurrent
                                            ? 'bg-amber-500/20 text-amber-300 shadow-md border border-amber-500/40 ring-1 ring-amber-400/40'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5'
                                    }`}
                                >
                                    {opt.label}
                                    {isCurrent && <FaCheck className="text-[10px] ml-1 text-amber-400" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Subtitle Helper Notice (when subtitle button clicked) */}
                {showSubNotice && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                            <FaClosedCaptioning className="text-amber-400 text-base shrink-0" />
                            <span>
                                <strong>Legendas ativadas:</strong> Caso a legenda não apareça automaticamente, clique no ícone <strong>&quot;CC&quot;</strong> ou na engrenagem ⚙️ no rodapé do player e selecione o idioma desejado.
                            </span>
                        </div>
                        <button
                            onClick={() => setShowSubNotice(false)}
                            className="text-amber-400 hover:text-amber-100 font-bold ml-2 text-xs uppercase"
                        >
                            Entendi
                        </button>
                    </div>
                )}
            </div>

            {/* Server Toolbar */}
            <div className="flex flex-wrap items-center gap-2 px-1">
                <FaServer className="text-gray-400 text-xs mr-1" />
                <span className="text-xs text-gray-400 font-medium mr-1">{t('server')}:</span>
                {SOURCES.map((src, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setSourceIdx(idx);
                            setShowSubNotice(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            sourceIdx === idx 
                                ? 'bg-red-600 text-white shadow-md' 
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {src.name}
                    </button>
                ))}
            </div>

            {/* Player Container */}
            <div
                ref={playerContainerRef}
                className={`relative w-full bg-black overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all ${
                    isFullscreen 
                        ? 'h-screen w-screen rounded-none ring-0' 
                        : 'aspect-video rounded-xl ring-1 ring-white/10'
                }`}
            >
                {shouldRender && (
                    <iframe
                        key={iframeSrc}
                        src={iframeSrc}
                        allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *; screen-wake-lock *"
                        allowFullScreen
                        webkitallowfullscreen="true"
                        mozallowfullscreen="true"
                        title="Movie Stream"
                        referrerPolicy="origin"
                        className="w-full h-full border-0"
                        style={{ userSelect: 'none' }}
                    />
                )}

                {/* Exit Fullscreen button when in fullscreen */}
                {isFullscreen && (
                    <button
                        onClick={toggleFullscreen}
                        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition-all shadow-lg border border-white/20"
                        title="Sair da Tela Cheia (Esc)"
                    >
                        <FaCompress className="text-sm" />
                    </button>
                )}
            </div>

            {/* Language & Help Tip */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs leading-relaxed">
                <FaInfoCircle className="text-red-500 mt-0.5 flex-shrink-0 text-sm" />
                <div className="flex flex-col gap-1">
                    <p className="font-semibold text-white">Opções de Áudio e Legenda:</p>
                    <p>• <strong>🇧🇷 Áudio Dublado (Português):</strong> Utilize o <strong>Servidor 1</strong> ou <strong>Servidor 2</strong>.</p>
                    <p>• <strong>💬 Legendas em Português ou Outros Idiomas:</strong> Utilize o <strong>Servidor 3 (VidLink)</strong> ou <strong>Servidor 4 (EmbedSU)</strong> e clique no ícone &quot;CC&quot; na barra de controle do vídeo.</p>
                    <p>• <strong>🇪🇸 Español:</strong> Utilize o <strong>Servidor 5 (MultiEmbed)</strong> ou selecione áudio/legenda em espanhol no player.</p>
                </div>
            </div>
        </div>
    );
};

VideoPlayer.propTypes = {
    movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
};

export default memo(VideoPlayer);
