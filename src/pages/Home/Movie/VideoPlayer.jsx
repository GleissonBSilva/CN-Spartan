import { memo, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FaServer, FaInfoCircle, FaExpand, FaCompress } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';

const SOURCES = [
  { name: '🇧🇷 Servidor 1 (Dublado BR)', url: (id) => `https://superflixapi.bond/filme/${id}` },
  { name: '🇧🇷 Servidor 2 (Dublado Alt)', url: (id) => `https://superflixapi.online/filme/${id}` },
  { name: '🌐 Servidor 3 (VidLink - Legendas PT-BR)', url: (id) => `https://vidlink.pro/movie/${id}?primaryColor=e50914&secondaryColor=ffffff&iconColor=e50914&poster=true&title=true&nextbutton=false` },
  { name: '⚡ Servidor 4 (EmbedSU)', url: (id) => `https://embed.su/embed/movie/${id}` },
  { name: '🎬 Servidor 5 (MultiEmbed)', url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1` },
  { name: '🚀 Servidor 6 (AutoEmbed)', url: (id) => `https://player.autoembed.cc/embed/movie/${id}` },
];

const VideoPlayer = ({ movieId }) => {
    const { t } = useLanguage();
    const [shouldRender, setShouldRender] = useState(false);
    const [sourceIdx, setSourceIdx] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const playerContainerRef = useRef(null);

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
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 px-1">
                <FaServer className="text-gray-400 text-sm mr-1" />
                <span className="text-sm text-gray-400 font-medium mr-2">{t('server')}:</span>
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

                {/* Tela Cheia Button */}
                <button
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Sair da Tela Cheia' : 'Abrir em Tela Cheia'}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all shadow border border-white/10"
                >
                    {isFullscreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
                    <span>{isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}</span>
                </button>
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
                    <p>• <strong>🇧🇷 Áudio Dublado em Português:</strong> Utilize o <strong>Servidor 1 (Dublado BR)</strong> ou <strong>Servidor 2 (Dublado Alt)</strong>.</p>
                    <p>• <strong>🌐 Áudio Original com Legendas em Português:</strong> Utilize o <strong>Servidor 3 (VidLink)</strong> e clique no ícone &quot;CC&quot; na barra do vídeo para ativar legendas em português.</p>
                    <p>• <strong>⛶ Tela Cheia:</strong> Use o botão <strong>&quot;Tela Cheia&quot;</strong> acima do player ou o controle do próprio vídeo.</p>
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
