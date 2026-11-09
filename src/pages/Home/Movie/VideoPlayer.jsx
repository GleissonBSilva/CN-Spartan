import { memo, useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FaServer, FaInfoCircle, FaExpand, FaCompress, FaVolumeUp, FaClosedCaptioning, FaRedoAlt } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuthProfile } from '../../../hooks/useAuthProfile';
import SubscriptionLockGate from '../../../components/SubscriptionLockGate';

const SOURCES = [
  // Servidores Dublados (Áudio em Português)
  { id: 'dub_1', mode: 'dublado', name: '🇧🇷 Servidor 1 (Dublado BR)', url: (id) => `https://superflixapi.bond/filme/${id}` },
  { id: 'dub_2', mode: 'dublado', name: '🇧🇷 Servidor 2 (Dublado Alt)', url: (id) => `https://superflixapi.online/filme/${id}` },

  // Servidores Legendados (Áudio Original com Legendas CC em Português, Inglês, Espanhol, etc.)
  { id: 'sub_1', mode: 'legendado', name: '💬 Servidor 3 (VidLink - Legendas PT/EN/ES)', url: (id) => `https://vidlink.pro/movie/${id}?primaryColor=e50914&secondaryColor=ffffff&iconColor=e50914&poster=true&title=true&nextbutton=false` },
  { id: 'sub_2', mode: 'legendado', name: '💬 Servidor 4 (SmashyStream - Multi)', url: (id) => `https://embed.smashystream.com/playere.php?tmdb=${id}` },
  { id: 'sub_3', mode: 'legendado', name: '💬 Servidor 5 (MultiEmbed - Legendado)', url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1` },
];

const VideoPlayer = ({ movieId, title }) => {
    const { language, t } = useLanguage();
    const { isActive, isAdmin } = useAuthProfile();
    const canPlay = isAdmin || isActive;
    const [shouldRender, setShouldRender] = useState(false);
    const [sourceIdx, setSourceIdx] = useState(0);
    const [streamMode, setStreamMode] = useState(() => localStorage.getItem('cinespartan_stream_mode') || 'dublado');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const playerContainerRef = useRef(null);

    // Filtered sources according to the selected mode
    const visibleSources = useMemo(() => {
        if (streamMode === 'all') return SOURCES;
        return SOURCES.filter(s => s.mode === streamMode);
    }, [streamMode]);

    // When mode changes, make sure sourceIdx points to an active valid source in that mode
    const handleModeChange = (mode) => {
        setStreamMode(mode);
        localStorage.setItem('cinespartan_stream_mode', mode);
        if (mode === 'dublado') {
            setSourceIdx(0); // Servidor 1 Dublado
        } else if (mode === 'legendado') {
            setSourceIdx(2); // Servidor 3 VidLink Legendado
        }
    };

    // Auto-select preferred format when language changes
    useEffect(() => {
        if (language.startsWith('en') || language.startsWith('es') || language.startsWith('fr')) {
            setStreamMode('legendado');
            setSourceIdx(2);
        } else {
            setStreamMode('dublado');
            setSourceIdx(0);
        }
    }, [language, movieId]);

    useEffect(() => {
        setShouldRender(false);
        const timer = setTimeout(() => setShouldRender(true), 120);
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

    const handleNextServer = () => {
        const nextIdx = (sourceIdx + 1) % SOURCES.length;
        setSourceIdx(nextIdx);
        setStreamMode(SOURCES[nextIdx].mode);
    };

    if (!movieId) return null;

    if (!canPlay) {
        return <SubscriptionLockGate title={title} />;
    }

    const currentSource = SOURCES[sourceIdx] || SOURCES[0];
    const iframeSrc = currentSource.url(movieId);

    return (
        <div className="w-full flex flex-col gap-3">
            {/* Stream Mode & Controls Toolbar */}
            <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-[#0f141f]/95 border border-white/10 shadow-xl backdrop-blur-md">
                
                {/* Format Tabs (Dublado vs Legendado) */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">
                            Formato:
                        </span>
                        
                        <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 gap-1">
                            <button
                                type="button"
                                onClick={() => handleModeChange('dublado')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    streamMode === 'dublado'
                                        ? 'bg-red-600 text-white shadow-md shadow-red-950/50 ring-1 ring-red-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <FaVolumeUp className="text-xs" />
                                <span>🇧🇷 Dublado</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleModeChange('legendado')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    streamMode === 'legendado'
                                        ? 'bg-amber-500 text-black shadow-md shadow-amber-950/50 ring-1 ring-amber-300'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <FaClosedCaptioning className="text-xs" />
                                <span>💬 Legendado (Multi CC)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleModeChange('all')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    streamMode === 'all'
                                        ? 'bg-white/20 text-white ring-1 ring-white/30'
                                        : 'text-gray-500 hover:text-gray-300'
                                }`}
                                title="Exibir todos os servidores disponíveis"
                            >
                                Todos
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        {/* Fallback Next Server Button */}
                        <button
                            type="button"
                            onClick={handleNextServer}
                            title="Se o vídeo travar ou der erro, clique para testar o próximo servidor"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all"
                        >
                            <FaRedoAlt className="text-[10px]" />
                            <span className="hidden sm:inline">Trocar Servidor</span>
                        </button>

                        {/* Fullscreen Button */}
                        <button
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Sair da Tela Cheia' : 'Abrir em Tela Cheia'}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all shadow border border-white/10"
                        >
                            {isFullscreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
                            <span>{isFullscreen ? 'Sair' : 'Tela Cheia'}</span>
                        </button>
                    </div>
                </div>

                {/* Server Selector for the Active Mode */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                    <FaServer className="text-gray-400 text-xs shrink-0" />
                    <span className="text-xs text-gray-400 font-medium shrink-0">Opções do Player:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {visibleSources.map((src) => {
                            const realIdx = SOURCES.findIndex(s => s.id === src.id);
                            const isActive = sourceIdx === realIdx;
                            return (
                                <button
                                    key={src.id}
                                    type="button"
                                    onClick={() => setSourceIdx(realIdx)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                        isActive
                                            ? streamMode === 'legendado'
                                                ? 'bg-amber-500 text-black shadow-md ring-1 ring-amber-300 font-bold'
                                                : 'bg-red-600 text-white shadow-md ring-1 ring-red-400 font-bold'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5'
                                    }`}
                                >
                                    {src.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Context-aware Explanation Banner */}
                {streamMode === 'legendado' ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                        <FaClosedCaptioning className="text-amber-400 text-sm shrink-0" />
                        <span>
                            <strong>Áudio Original com Legendas:</strong> Para ativar ou mudar a legenda (Português, Inglês, Espanhol, etc.), clique no ícone <strong>&quot;CC&quot;</strong> ou na engrenagem ⚙️ no rodapé do próprio player.
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-200 text-xs">
                        <FaVolumeUp className="text-red-400 text-sm shrink-0" />
                        <span>
                            <strong>Áudio Dublado:</strong> Transmissão com áudio em Português do Brasil. Se o vídeo demorar a carregar, use o <strong>Servidor 2</strong>.
                        </span>
                    </div>
                )}
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

            {/* Help Tip */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs leading-relaxed">
                <FaInfoCircle className="text-red-500 mt-0.5 flex-shrink-0 text-sm" />
                <div className="flex flex-col gap-1">
                    <p className="font-semibold text-white">Dica de Transmissão:</p>
                    <p>• <strong>Dublado:</strong> Escolha <strong>🇧🇷 Dublado</strong> para assistir com áudio em português.</p>
                    <p>• <strong>Legendado:</strong> Escolha <strong>💬 Legendado</strong> para áudio original e selecione o idioma da legenda desejada (Português, Inglês, Espanhol) no ícone &quot;CC&quot; do player.</p>
                    <p>• Caso algum servidor falhe ou apresente instabilidade, use o botão <strong>&quot;Trocar Servidor&quot;</strong> acima.</p>
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
