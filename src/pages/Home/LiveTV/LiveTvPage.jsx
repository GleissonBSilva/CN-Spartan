import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FaBroadcastTower, FaSearch, FaTv, FaPlay, FaPlus, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { CHANNELS, CATEGORIES } from './channelsData';
import LiveTvPlayer from './LiveTvPlayer';
import SEO from '../SEO';
import { useAuthProfile } from '../../../hooks/useAuthProfile';
import SubscriptionLockGate from '../../../components/SubscriptionLockGate';

const LiveTvPage = () => {
  const { isActive, isAdmin } = useAuthProfile();
  const canPlay = isAdmin || isActive;

  // Custom channels loaded from localStorage (M3U or custom added)
  const [customChannels, setCustomChannels] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cinespartan_custom_channels') || '[]');
    } catch {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customCategory, setCustomCategory] = useState('esportes');
  const [m3uUrl, setM3uUrl] = useState('');
  const [isLoadingM3u, setIsLoadingM3u] = useState(false);
  const [modalError, setModalError] = useState('');

  // Combine default channels with user custom channels
  const allChannels = useMemo(() => {
    return [...CHANNELS, ...customChannels];
  }, [customChannels]);

  const [selectedChannelId, setSelectedChannelId] = useState(() => allChannels[0]?.id || 'caze_tv');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active channel object
  const activeChannel = useMemo(() => {
    return allChannels.find(c => c.id === selectedChannelId) || allChannels[0];
  }, [allChannels, selectedChannelId]);

  // Filter channels by category and search
  const filteredChannels = useMemo(() => {
    return allChannels.filter(c => {
      const matchCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [allChannels, selectedCategory, searchQuery]);

  const handleNextChannel = useCallback(() => {
    const currentIdx = filteredChannels.findIndex(c => c.id === activeChannel.id);
    if (currentIdx !== -1 && filteredChannels.length > 1) {
      const nextIdx = (currentIdx + 1) % filteredChannels.length;
      setSelectedChannelId(filteredChannels[nextIdx].id);
    }
  }, [filteredChannels, activeChannel.id]);

  const handlePrevChannel = useCallback(() => {
    const currentIdx = filteredChannels.findIndex(c => c.id === activeChannel.id);
    if (currentIdx !== -1 && filteredChannels.length > 1) {
      const prevIdx = (currentIdx - 1 + filteredChannels.length) % filteredChannels.length;
      setSelectedChannelId(filteredChannels[prevIdx].id);
    }
  }, [filteredChannels, activeChannel.id]);

  // Add a single custom channel
  const handleAddSingleChannel = (e) => {
    e.preventDefault();
    if (!customName.trim() || !customUrl.trim()) {
      setModalError('Preencha o nome e a URL da transmissão.');
      return;
    }

    const newChannel = {
      id: 'custom_' + Date.now(),
      name: customName.trim(),
      category: customCategory,
      categoryLabel: CATEGORIES.find(c => c.id === customCategory)?.label || 'Canais',
      logo: '',
      resolution: 'HD',
      isCustom: true,
      sources: [{ name: 'Stream Direto', url: customUrl.trim() }]
    };

    const updated = [newChannel, ...customChannels];
    setCustomChannels(updated);
    localStorage.setItem('cinespartan_custom_channels', JSON.stringify(updated));
    setSelectedChannelId(newChannel.id);
    setCustomName('');
    setCustomUrl('');
    setIsModalOpen(false);
    setModalError('');
  };

  // Import M3U playlist URL
  const handleImportM3U = async (e) => {
    e.preventDefault();
    if (!m3uUrl.trim()) return;

    setIsLoadingM3u(true);
    setModalError('');

    try {
      const res = await fetch(m3uUrl.trim());
      const text = await res.text();
      const lines = text.split('\n');
      const parsed = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('#EXTINF:')) {
          const title = line.substring(line.indexOf(',') + 1).trim();
          const logoMatch = line.match(/tvg-logo="([^"]+)"/);
          let nextUrl = '';
          for (let j = i + 1; j < lines.length; j++) {
            const l = lines[j].trim();
            if (l && !l.startsWith('#')) {
              nextUrl = l;
              break;
            }
          }
          if (nextUrl && title) {
            const isSport = title.toLowerCase().includes('premiere') || title.toLowerCase().includes('sport') || title.toLowerCase().includes('espn');
            parsed.push({
              id: 'm3u_' + Date.now() + '_' + parsed.length,
              name: title,
              category: isSport ? 'esportes' : 'filmes_series',
              categoryLabel: isSport ? 'Esportes & Futebol' : 'Filmes & Séries',
              logo: logoMatch ? logoMatch[1] : '',
              resolution: 'HD',
              isCustom: true,
              sources: [{ name: 'IPTV Stream', url: nextUrl }]
            });
          }
        }
      }

      if (parsed.length === 0) {
        setModalError('Nenhum canal válido foi encontrado nesta lista M3U.');
        setIsLoadingM3u(false);
        return;
      }

      const updated = [...parsed, ...customChannels];
      setCustomChannels(updated);
      localStorage.setItem('cinespartan_custom_channels', JSON.stringify(updated));
      setSelectedChannelId(parsed[0].id);
      setM3uUrl('');
      setIsModalOpen(false);
    } catch (err) {
      setModalError('Erro ao carregar lista M3U. Verifique o link e se o servidor permite acesso.');
    } finally {
      setIsLoadingM3u(false);
    }
  };

  const handleClearCustom = () => {
    if (window.confirm('Deseja remover todos os canais personalizados importados?')) {
      setCustomChannels([]);
      localStorage.removeItem('cinespartan_custom_channels');
      setSelectedChannelId(CHANNELS[0].id);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-12 text-white">
      <SEO
        title="TV Ao Vivo e Premiere | CineSpartan"
        description="Assista a canais de TV ao vivo, Premiere Futebol, canais abertos, esportes, filmes e notícias com transmissão contínua no CineSpartan."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 border border-red-500/30 shadow-lg shadow-red-950/50">
              <FaBroadcastTower className="text-2xl text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                TV Ao Vivo & Premiere
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/30">
                  Transmissão 24/7
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Canais de futebol ao vivo, abertos, filmes, esportes e notícias em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:w-64">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar canal ou esporte..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0f141f] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Custom Channel / M3U Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold shadow-md transition-all shrink-0"
              title="Adicionar Canal ou Lista M3U"
            >
              <FaPlus className="text-[10px]" />
              <span className="hidden md:inline">Adicionar Canal / M3U</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            const count = cat.id === 'all'
              ? allChannels.length
              : allChannels.filter(c => c.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-lg shadow-red-950/50 ring-1 ring-red-400'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid Layout: Main Player + Channels Guide */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Video Player Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {!canPlay ? (
              <SubscriptionLockGate title={activeChannel?.name || 'Canal Ao Vivo'} />
            ) : (
              <LiveTvPlayer
                channel={activeChannel}
                onNextChannel={handleNextChannel}
                onPrevChannel={handlePrevChannel}
              />
            )}
          </div>

          {/* Channels Guide / Sidebar Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3 p-4 rounded-2xl bg-[#0f141f]/95 border border-white/10 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FaTv className="text-red-500 text-sm" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Guia de Canais
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-400">
                  {filteredChannels.length} canais
                </span>
                {customChannels.length > 0 && (
                  <button
                    onClick={handleClearCustom}
                    title="Limpar canais personalizados"
                    className="p-1 rounded text-gray-500 hover:text-red-400 text-xs"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>

            {/* Channels Scroll List */}
            <div className="flex flex-col gap-2 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
              {filteredChannels.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs">
                  Nenhum canal encontrado para a sua busca.
                </div>
              ) : (
                filteredChannels.map(channel => {
                  const isActive = channel.id === activeChannel?.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannelId(channel.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-all group ${
                        isActive
                          ? 'bg-red-600/20 border border-red-500/50 shadow-md ring-1 ring-red-500/50'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Logo Container */}
                      <div className="w-11 h-11 shrink-0 rounded-lg overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center p-1 relative shadow-inner">
                        {channel.logo ? (
                          <img
                            src={channel.logo}
                            alt={channel.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <FaTv className="text-gray-500 text-lg" />
                        )}
                        {isActive && (
                          <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-ping" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-bold truncate ${
                              isActive ? 'text-white' : 'text-gray-200 group-hover:text-white'
                            }`}
                          >
                            {channel.name}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                            {channel.resolution || 'HD'}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 truncate mt-0.5">
                          {channel.categoryLabel}
                        </span>
                      </div>

                      {/* Active indicator play */}
                      {isActive && (
                        <div className="shrink-0 p-1.5 rounded-lg bg-red-600 text-white shadow-sm">
                          <FaPlay className="text-[9px]" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Adicionar Canal ou Lista M3U */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#0f141f] border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaPlus className="text-red-500 text-xs" />
                <span>Adicionar Canal ou Lista M3U</span>
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setModalError('');
                }}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {modalError}
              </div>
            )}

            {/* Tab 1: Adicionar Canal Único */}
            <form onSubmit={handleAddSingleChannel} className="flex flex-col gap-3 mb-6">
              <span className="text-xs font-bold text-gray-300">1. Adicionar Canal Direto (Link .m3u8):</span>
              <input
                type="text"
                placeholder="Nome do Canal (ex: Premiere 1 HD)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
              <input
                type="url"
                placeholder="URL da transmissão (https://.../stream.m3u8)"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="esportes">⚽ Esportes & Premiere</option>
                <option value="abertos">📡 Canais Abertos</option>
                <option value="filmes_series">🎬 Filmes & Séries</option>
                <option value="noticias">📰 Notícias</option>
                <option value="infantil">🧒 Infantil</option>
              </select>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all"
              >
                Adicionar Canal
              </button>
            </form>

            {/* Tab 2: Importar Lista M3U Completa */}
            <form onSubmit={handleImportM3U} className="flex flex-col gap-3 pt-4 border-t border-white/10">
              <span className="text-xs font-bold text-gray-300">2. Ou Importar Lista M3U Completa (IPTV):</span>
              <input
                type="url"
                placeholder="Link da lista (https://.../lista.m3u)"
                value={m3uUrl}
                onChange={(e) => setM3uUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                disabled={isLoadingM3u}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {isLoadingM3u ? 'Importando Canais...' : 'Carregar Lista M3U'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTvPage;
