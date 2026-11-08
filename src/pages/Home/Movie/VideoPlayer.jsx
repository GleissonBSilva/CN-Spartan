import { memo, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FaServer, FaInfoCircle, FaExpand, FaCompress } from 'react-icons/fa';
import { BiGlobe } from 'react-icons/bi';
import { useLanguage } from '../../../context/LanguageContext';

const SOURCES = [
  { id: 'dub_br_1', lang: 'pt', name: '🇧🇷 Servidor 1 (Dublado BR)', url: (id) => `https://superflixapi.bond/filme/${id}` },
  { id: 'dub_br_2', lang: 'pt', name: '🇧🇷 Servidor 2 (Dublado Alt)', url: (id) => `https://superflixapi.online/filme/${id}` },
  { id: 'vidlink', lang: 'en', name: '🌐 Servidor 3 (VidLink - Legendas PT/EN/ES)', url: (id) => `https://vidlink.pro/movie/${id}?primaryColor=e50914&secondaryColor=ffffff&iconColor=e50914&poster=true&title=true&nextbutton=false` },
  { id: 'embedsu', lang: 'en', name: '⚡ Servidor 4 (EmbedSU)', url: (id) => `https://embed.su/embed/movie/${id}` },
  { id: 'multiembed', lang: 'es', name: '🎬 Servidor 5 (MultiEmbed - Español/Multi)', url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1` },
  { id: 'autoembed', lang: 'en', name: '🚀 Servidor 6 (AutoEmbed)', url: (id) => `https://player.autoembed.cc/embed/movie/${id}` },
];

const LANGUAGE_PRESETS = [
  { id: 'pt', label: '🇧🇷 Dublado (PT)', targetIdx: 0 },
  { id: 'en', label: '🇺🇸 Original / Legendas', targetIdx: 2 },
  { id: 'es', label: '🇪🇸 Español', targetIdx: 4 },
];

const VideoPlayer = ({ movieId }) => {
    const { language, t } = useLanguage();
    const [shouldRender, setShouldRender] = useState(false);
    const [sourceIdx, setSourceIdx] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const playerContainerRef = useRef(null);

    // Auto-select preferred server when language or movieId changes
    useEffect(() => {
        if (language.startsWith('en')) {
            setSourceIdx(2); // VidLink (Original English + Subtitles)
        } else if (language.startsWith('es')) {
            setSourceIdx(4); // MultiEmbed (Español / Multi)
        } else {
            setSourceIdx(0); // Dublado BR
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

    if (!movieId) return null;

    const iframeSrc = SOURCES[sourceIdx].url(movieId);

    return (
        <div className="w-full flex flex-col gap-3">
            {/* Quick Audio / Language Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <BiGlobe className="text-red-400 text-sm" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Idioma do Player:</span>
                    <div className="flex items-center gap-1.5">
                        {LANGUAGE_PRESETS.map((preset) => {
                            const isMatch = (preset.id === 'pt' && (sourceIdx === 0 || sourceIdx === 1)) ||
                                            (preset.id === 'en' && (sourceIdx === 2 || sourceIdx === 3 || sourceIdx === 5)) ||
                                            (preset.id === 'es' && sourceIdx === 4);
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => setSourceIdx(preset.targetIdx)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        isMatch
                                            ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-400'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Fullscreen Button */}
                <button
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Sair da Tela Cheia' : 'Abrir em Tela Cheia'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all shadow border border-white/10"
                >
                    {isFullscreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
                    <span>{isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}</span>
                </button>
            </div>

            {/* Server Toolbar */}
            <div className="flex flex-wrap items-center gap-2 px-1">
                <FaServer className="text-gray-400 text-sm mr-1" />
                <span className="text-xs text-gray-400 font-medium mr-1">{t('server')}:</span>
                {SOURCES.map((src, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSourceIdx(idx)}
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
                    <p className="font-semibold text-white">Opções de Idioma (Dublado e Legendado):</p>
                    <p>• <strong>🇧🇷 Dublado (Português):</strong> Utilize o <strong>Servidor 1</strong> ou <strong>Servidor 2</strong>.</p>
                    <p>• <strong>🇺🇸 Áudio Original com Legendas:</strong> Utilize o <strong>Servidor 3 (VidLink)</strong> e clique no ícone &quot;CC&quot; ou engrenagem no vídeo para selecionar o idioma desejado.</p>
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
