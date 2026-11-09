import React, { useState, useMemo, useCallback } from 'react';
import { FaBroadcastTower, FaSearch, FaTv, FaPlay, FaFire, FaFilter } from 'react-icons/fa';
import { CHANNELS, CATEGORIES } from './channelsData';
import LiveTvPlayer from './LiveTvPlayer';
import SEO from '../SEO';
import { useAuthProfile } from '../../../hooks/useAuthProfile';
import SubscriptionLockGate from '../../../components/SubscriptionLockGate';

const LiveTvPage = () => {
  const { isActive, isAdmin } = useAuthProfile();
  const canPlay = isAdmin || isActive;

  const [selectedChannelId, setSelectedChannelId] = useState(CHANNELS[0].id);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Encontra o canal ativo
  const activeChannel = useMemo(() => {
    return CHANNELS.find(c => c.id === selectedChannelId) || CHANNELS[0];
  }, [selectedChannelId]);

  // Filtra canais por categoria e busca
  const filteredChannels = useMemo(() => {
    return CHANNELS.filter(c => {
      const matchCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

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

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
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
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
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
                {cat.id === 'all' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                    {CHANNELS.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Grid Layout: Main Player + Channels Guide */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Video Player Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {!canPlay ? (
              <SubscriptionLockGate title={activeChannel.name} />
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
              <span className="text-[11px] font-semibold text-gray-400">
                {filteredChannels.length} disponíveis
              </span>
            </div>

            {/* Channels Scroll List */}
            <div className="flex flex-col gap-2 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
              {filteredChannels.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs">
                  Nenhum canal encontrado para a sua busca.
                </div>
              ) : (
                filteredChannels.map(channel => {
                  const isActive = channel.id === activeChannel.id;
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

                      {/* Active indicator arrow / play */}
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
    </div>
  );
};

export default LiveTvPage;
