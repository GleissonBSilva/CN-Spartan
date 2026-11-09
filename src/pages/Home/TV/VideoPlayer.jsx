import { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FaServer, FaInfoCircle, FaExpand, FaCompress, FaVolumeUp, FaClosedCaptioning, FaRedoAlt, FaBan } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuthProfile } from '../../../hooks/useAuthProfile';
import SubscriptionLockGate from '../../../components/SubscriptionLockGate';

const SOURCES = [
  // 🇧🇷 Servidores Dublados (Áudio em Português do Brasil)
  { id: 'dub_1', mode: 'dublado', name: '🇧🇷 Servidor 1 (SuperFlix Principal)', url: (id, s, e) => `https://superflixapi.bond/serie/${id}/${s}/${e}` },
  { id: 'dub_2', mode: 'dublado', name: '🇧🇷 Servidor 2 (SuperFlix Alternativo)', url: (id, s, e) => `https://superflixapi.buzz/serie/${id}/${s}/${e}` },
  { id: 'dub_3', mode: 'dublado', name: '🇧🇷 Servidor 3 (MyEmbed BR)', url: (id, s, e) => `https://myembed.biz/serie/${id}/${s}/${e}` },
  { id: 'dub_4', mode: 'dublado', name: '🇧🇷 Servidor 4 (EmbedMovies HD)', url: (id, s, e) => `https://embedmovies.org/serie/${id}/${s}/${e}` },

  // 💬 Servidores Legendados (Áudio Original com Legendas CC em Português PT-BR / Multi)
  { id: 'sub_1', mode: 'legendado', name: '💬 Servidor 1 (MultiEmbed Player)', url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}` },
  { id: 'sub_2', mode: 'legendado', name: '💬 Servidor 2 (VidSrc To)', url: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}` },
  { id: 'sub_3', mode: 'legendado', name: '💬 Servidor 3 (VidSrc Me)', url: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
  { id: 'sub_4', mode: 'legendado', name: '💬 Servidor 4 (VidSrc PM)', url: (id, s, e) => `https://vidsrc.pm/embed/tv/${id}/${s}/${e}` },
  { id: 'sub_5', mode: 'legendado', name: '💬 Servidor 5 (2Embed CC)', url: (id, s, e) => `https://2embed.cc/embedtv/${id}&s=${s}&e=${e}` },

  // 🚫 Servidores Sem Legenda (Áudio Original Puro / Sem Legendas na Tela)
  { id: 'raw_1', mode: 'sem_legenda', name: '🚫 Servidor 1 (VidSrc To)', url: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}` },
  { id: 'raw_2', mode: 'sem_legenda', name: '🚫 Servidor 2 (VidSrc Me)', url: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
  { id: 'raw_3', mode: 'sem_legenda', name: '🚫 Servidor 3 (VidSrc PM)', url: (id, s, e) => `https://vidsrc.pm/embed/tv/${id}/${s}/${e}` },
  { id: 'raw_4', mode: 'sem_legenda', name: '🚫 Servidor 4 (2Embed)', url: (id, s, e) => `https://2embed.cc/embedtv/${id}&s=${s}&e=${e}` },
];

const VideoPlayer = ({ tvId, season = 1, episode = 1, title }) => {
    const { language, t } = useLanguage();
    const { isActive, isAdmin } = useAuthProfile();
    const canPlay = isAdmin || isActive;
    const [shouldRender, setShouldRender] = useState(false);
    const [streamMode, setStreamMode] = useState(() => localStorage.getItem('cinespartan_stream_mode') || 'dublado');
    const [sourceIdx, setSourceIdx] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const playerContainerRef = useRef(null);

    // Servidores visíveis de acordo com o modo escolhido
    const visibleSources = useMemo(() => {
        if (streamMode === 'all') return SOURCES;
        return SOURCES.filter(s => s.mode === streamMode);
    }, [streamMode]);

    // Trocar modo (Dublado, Legendado, Sem Legenda ou Todos)
    const handleModeChange = useCallback((mode) => {
        setStreamMode(mode);
        localStorage.setItem('cinespartan_stream_mode', mode);

        // Encontra o primeiro servidor correspondente ao modo
        const targetIdx = SOURCES.findIndex(s => mode === 'all' ? true : s.mode === mode);
        if (targetIdx !== -1) {
            setSourceIdx(targetIdx);
        }
    }, []);

    // Sincroniza sourceIdx se estiver fora do modo ativo
    useEffect(() => {
        if (streamMode !== 'all') {
            const current = SOURCES[sourceIdx];
            if (!current || current.mode !== streamMode) {
                const firstValid = SOURCES.findIndex(s => s.mode === streamMode);
                if (firstValid !== -1) {
                    setSourceIdx(firstValid);
                }
            }
        }
    }, [streamMode, sourceIdx]);

    useEffect(() => {
        setShouldRender(false);
        const timer = setTimeout(() => setShouldRender(true), 120);
        return () => clearTimeout(timer);
    }, [tvId, season, episode, sourceIdx]);

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

    // Alternar para o próximo servidor do modo ativo
    const handleNextServer = () => {
        if (visibleSources.length <= 1) {
            const nextGlobal = (sourceIdx + 1) % SOURCES.length;
            setSourceIdx(nextGlobal);
            setStreamMode(SOURCES[nextGlobal].mode);
            return;
        }

        const currentVisibleIdx = visibleSources.findIndex(s => SOURCES.indexOf(s) === sourceIdx);
        const nextVisibleIdx = (currentVisibleIdx + 1) % visibleSources.length;
        const nextRealIdx = SOURCES.indexOf(visibleSources[nextVisibleIdx]);
        if (nextRealIdx !== -1) {
            setSourceIdx(nextRealIdx);
        }
    };

    if (!tvId) return null;

    if (!canPlay) {
        return <SubscriptionLockGate title={title} />;
    }

    const currentSource = SOURCES[sourceIdx] || SOURCES[0];
    const iframeSrc = currentSource.url(tvId, season, episode);

    return (
        <div className="w-full flex flex-col gap-3">
            {/* Stream Mode & Controls Toolbar */}
            <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-[#0f141f]/95 border border-white/10 shadow-xl backdrop-blur-md">
                
                {/* Format Tabs (Dublado, Legendado, Sem Legenda) */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">
                            Áudio & Legenda:
                        </span>
                        
                        <div className="flex flex-wrap items-center p-1 rounded-xl bg-black/40 border border-white/10 gap-1">
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
                                <span>💬 Legendado</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleModeChange('sem_legenda')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    streamMode === 'sem_legenda'
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50 ring-1 ring-blue-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <FaBan className="text-xs" />
                                <span>🚫 Sem Legenda</span>
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
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600/20 to-red-600/20 hover:from-amber-600/30 hover:to-red-600/30 text-amber-300 hover:text-white border border-amber-500/30 transition-all shadow-sm"
                        >
                            <FaRedoAlt className="text-[10px]" />
                            <span>Trocar Servidor ({visibleSources.findIndex(s => SOURCES.indexOf(s) === sourceIdx) + 1}/{visibleSources.length})</span>
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
                    <span className="text-xs text-gray-400 font-medium shrink-0">Servidores Disponíveis:</span>
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
                                                : streamMode === 'sem_legenda'
                                                ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400 font-bold'
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
                {streamMode === 'legendado' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                        <FaClosedCaptioning className="text-amber-400 text-sm shrink-0" />
                        <span>
                            <strong>Áudio Original + Legendas (PT-BR):</strong> Caso deseje alterar ou ocultar a legenda no player, clique no ícone <strong>&quot;CC&quot;</strong> ou na engrenagem <strong>⚙️</strong> no rodapé do player. Se travar, clique em <strong>Trocar Servidor</strong>.
                        </span>
                    </div>
                )}
                {streamMode === 'sem_legenda' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs">
                        <FaBan className="text-blue-400 text-sm shrink-0" />
                        <span>
                            <strong>Áudio Original Sem Legenda:</strong> Reprodução limpa sem legendas forçadas na tela. Se o servidor atual apresentar instabilidade, clique em <strong>Trocar Servidor</strong> para testar as outras rotas.
                        </span>
                    </div>
                )}
                {streamMode === 'dublado' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-200 text-xs">
                        <FaVolumeUp className="text-red-400 text-sm shrink-0" />
                        <span>
                            <strong>Áudio Dublado BR:</strong> Transmissão com dublagem em Português do Brasil. Se algum servidor exibir erro ou demorar a carregar, use o <strong>Servidor 2</strong>, <strong>3</strong> ou <strong>4</strong>.
                        </span>
                    </div>
                )}
                {streamMode === 'all' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs">
                        <FaServer className="text-gray-400 text-sm shrink-0" />
                        <span>
                            Visualizando todas as opções (Dublado, Legendado e Sem Legenda). Selecione o servidor desejado acima.
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
                        title="Series Stream"
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
                    <p className="font-semibold text-white">Central de Dicas de Transmissão:</p>
                    <p>• <strong>🇧🇷 Dublado:</strong> Áudio em português do Brasil via SuperFlix, MyEmbed e EmbedMovies.</p>
                    <p>• <strong>💬 Legendado:</strong> Áudio original com legendas em português. Use os controles de &quot;CC&quot; do player se quiser alterar o tamanho ou idioma.</p>
                    <p>• <strong>🚫 Sem Legenda:</strong> Áudio original puro sem legendas na tela para máxima imersão.</p>
                    <p>• <strong>Servidor com Erro?</strong> Clique em <strong>&quot;Trocar Servidor&quot;</strong> no canto direito acima do player para testar as rotas alternativas instantaneamente.</p>
                </div>
            </div>
        </div>
    );
};

VideoPlayer.propTypes = {
    tvId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    season: PropTypes.number,
    episode: PropTypes.number,
    title: PropTypes.string,
};

export default memo(VideoPlayer);
