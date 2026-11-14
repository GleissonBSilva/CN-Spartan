import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  BiSearch,
  BiHomeAlt,
  BiMoviePlay,
  BiTv,
  BiBookmark,
  BiX
} from 'react-icons/bi';
import { FaSignOutAlt, FaUserCircle, FaShieldAlt, FaBroadcastTower, FaDownload } from 'react-icons/fa';
import { GENRES, SPECIAL_CATEGORIES } from './tmdb';
import { CATEGORIES as TV_CATEGORIES } from './LiveTV/channelsData';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthProfile } from '../../hooks/useAuthProfile';
import LanguageSelector from '../../components/LanguageSelector';

const NAV_ITEMS = [
  { id: 'search', icon: BiSearch, action: 'navigate', label: 'Search' },
  { id: 'home', icon: BiHomeAlt, action: 'navigate', label: 'Home' },
  { id: 'movies', icon: BiMoviePlay, action: 'navigate', label: 'Movies' },
  { id: 'series', icon: BiTv, action: 'navigate', label: 'TV Shows' },
  { id: 'livetv', icon: FaBroadcastTower, action: 'navigate', label: 'TV Ao Vivo' },
  { id: 'watchlist', icon: BiBookmark, action: 'navigate', label: 'Watchlist' },
];

function Sidebar({ activePage, onNavigate, selectedGenreId, onGenreSelect, onOpenAuthModal, onOpenAccountModal, onOpenDownloadModal, isMobileOpen = false, onCloseMobile }) {
  const navigate = useNavigate();
  const { user: supaUser, isAdmin, profile, daysRemaining, isActive, signOut: supaSignOut } = useAuthProfile();
  const { t, getGenreName } = useLanguage();

  const user = supaUser
    ? {
        uid: supaUser.id,
        email: supaUser.email,
        displayName:
          supaUser.user_metadata?.display_name ||
          supaUser.user_metadata?.full_name ||
          supaUser.email?.split('@')[0],
      }
    : null;

  const getNavLabel = (id, fallback) => {
    if (id === 'home') return t('home');
    if (id === 'movies') return t('movies');
    if (id === 'series') return t('tv_shows');
    if (id === 'livetv') return t('live_tv');
    if (id === 'search') return t('search');
    if (id === 'watchlist') return t('watchlist');
    return fallback;
  };

  const handleLogout = async () => {
    try {
      await supaSignOut();
      if (onCloseMobile) onCloseMobile();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavClick = (id) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleCategoryClick = (genreId) => {
    if (onGenreSelect) onGenreSelect(genreId);
    if (onCloseMobile) onCloseMobile();
  };

  const ACTIVE_MAP = { search: 'search', movies: 'movies', series: 'series', livetv: 'livetv', watchlist: 'watchlist', home: 'home' };
  const activeId = ACTIVE_MAP[activePage] ?? 'home';

  const showCategories = activePage === 'movies' || activePage === 'series' || activePage === 'livetv';
  const genreType = activePage === 'movies' ? 'movie' : 'tv';
  const allCategories = showCategories
    ? activePage === 'livetv'
      ? TV_CATEGORIES.map((c) => ({ id: c.id, name: c.label }))
      : [...GENRES[genreType], ...SPECIAL_CATEGORIES[genreType]].sort((a, b) => a.name.localeCompare(b.name))
    : [];

  return (
    <>
      {/* Backdrop escuro ao abrir a barra lateral no celular */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 z-[55] bg-black/75 backdrop-blur-sm animate-fadeIn"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          group fixed top-0 left-0 h-[100dvh] z-[60]
          flex flex-col
          w-[265px] max-w-[82vw] md:w-[80px] lg:w-[84px] md:hover:w-[260px]
          bg-gray-900/98 backdrop-blur-xl
          border-r border-white/10
          shadow-2xl shadow-black/60
          overflow-hidden
          transition-all duration-300 ease-in-out
          select-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />

        {/* Topo: Logo + Botão Fechar (Mobile) */}
        <div className="relative flex items-center justify-between md:justify-center md:group-hover:justify-start w-full px-3 md:px-2 pt-3.5 pb-3 shrink-0 border-b border-white/5 md:border-b-0">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 min-w-0 text-left hover:opacity-95 transition-all duration-300"
          >
            <div className="w-12 h-11 md:w-[58px] md:h-[50px] flex items-center justify-center shrink-0 rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-lg shadow-black/40 group-hover:border-red-500/40 group-hover:shadow-red-950/60 transition-all duration-300">
              <img
                src="/logo-cinespartan.png"
                alt="CineSpartan"
                className="w-full h-full object-contain rounded-2xl filter drop-shadow-[0_2px_12px_rgba(220,38,38,0.5)] transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex md:hidden md:group-hover:flex flex-col leading-tight whitespace-nowrap min-w-0 pr-1">
              <span className="text-white font-black text-lg md:text-[20px] tracking-tight uppercase truncate">
                Cine<span className="text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]">Spartan</span>
              </span>
              <span className="text-red-400/80 text-[10px] font-semibold tracking-[0.2em] uppercase mt-0.5">
                Streaming
              </span>
            </div>
          </button>

          {/* Botão fechar gaveta no celular */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors"
            aria-label="Fechar menu lateral"
          >
            <BiX className="text-2xl" />
          </button>
        </div>

        {/* Área central rolável (Menu + Categorias) para perfeito enquadramento em qualquer altura de tela */}
        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar flex flex-col py-2">
          {/* Nav section label */}
          <div className="px-4 mb-1.5 shrink-0 flex md:hidden md:group-hover:flex">
            <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-500 whitespace-nowrap">
              {t('menu')}
            </span>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-1 px-2.5 shrink-0">
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
              const isActiveItem = activeId === id;
              const displayLabel = getNavLabel(id, label);
              return (
                <button
                  key={id}
                  onClick={() => handleNavClick(id)}
                  title={displayLabel}
                  className={`
                    relative flex items-center justify-start md:justify-center md:group-hover:justify-start gap-3.5 px-3.5 py-2.5 rounded-2xl
                    w-full text-[13px] sm:text-[14px] font-medium whitespace-nowrap
                    border transition-colors duration-200 focus:outline-none
                    ${isActiveItem
                      ? 'border-red-500/40 bg-red-500/15 text-white shadow-sm shadow-red-950/30'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className={`text-[22px] shrink-0 transition-colors duration-200 ${isActiveItem ? 'text-red-400' : ''}`} />
                  <span className="inline md:hidden md:group-hover:inline truncate">
                    {displayLabel}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Botão de Destaque para Download do App (Android, TV Box, Smart TV) */}
          <div className="px-2.5 my-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                if (onOpenDownloadModal) onOpenDownloadModal();
              }}
              title="Baixar Aplicativo para Android, TV Box e Smart TV"
              className="
                relative flex items-center justify-start md:justify-center md:group-hover:justify-start gap-3 px-3 py-2.5 rounded-2xl
                w-full text-[12px] sm:text-[13px] font-extrabold whitespace-nowrap
                bg-gradient-to-r from-red-600/25 to-amber-600/25 border border-red-500/40 text-white hover:from-red-600/40 hover:to-amber-600/40 hover:border-red-400
                transition-all duration-200 focus:outline-none shadow-md shadow-red-950/40 group/dl
              "
            >
              <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center shrink-0 shadow-sm group-hover/dl:scale-110 transition-transform">
                <FaDownload className="text-white text-[11px]" />
              </div>
              <div className="flex md:hidden md:group-hover:flex flex-col text-left min-w-0">
                <span className="text-white font-black truncate leading-tight">Baixar App</span>
                <span className="text-amber-400 text-[9px] font-bold uppercase tracking-wider truncate">Android • TV Box</span>
              </div>
            </button>
          </div>

          {/* Categories section — movies / series / livetv */}
          {showCategories && (
            <div className="mt-3 pt-3 border-t border-white/10 flex flex-col">
              {/* Section label */}
              <div className="px-4 mb-1.5 shrink-0 flex md:hidden md:group-hover:flex">
                <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-500 whitespace-nowrap">
                  {activePage === 'livetv' ? 'Canais & Categorias' : t('genres')}
                </span>
              </div>
              {/* Genre / category list */}
              <div className="px-2.5 flex flex-col gap-0.5">
                {allCategories.map((genre) => {
                  const isActiveGenre = String(selectedGenreId) === String(genre.id);
                  const localizedGenreName = activePage === 'livetv' ? genre.name : getGenreName(genre.id, genre.name);
                  return (
                    <button
                      key={genre.id}
                      onClick={() => handleCategoryClick(genre.id)}
                      title={localizedGenreName}
                      className={`
                        relative flex items-center justify-start md:justify-center md:group-hover:justify-start gap-3.5 px-3.5 py-2 rounded-xl
                        w-full text-[12px] sm:text-[13px] font-medium whitespace-nowrap
                        border transition-colors duration-200 focus:outline-none text-left
                        ${isActiveGenre
                          ? 'border-red-500/35 bg-red-500/15 text-white'
                          : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }
                      `}
                    >
                      <span
                        className={`
                          w-2 h-2 rounded-full shrink-0 transition-all duration-200
                          ${isActiveGenre ? 'bg-red-400 scale-110' : 'bg-gray-600'}
                        `}
                      />
                      <span className="inline md:hidden md:group-hover:inline truncate">
                        {localizedGenreName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé fixo da Barra Lateral: Idioma + Admin + Conta + Sair */}
        <div className="mt-auto pt-2.5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:pb-4 px-2.5 shrink-0 border-t border-white/10 relative z-10 bg-gray-900/98 flex flex-col gap-1.5">
          <div className="flex items-center justify-start md:justify-center md:group-hover:justify-start px-2 py-1 transition-all">
            <LanguageSelector compact />
            <div className="flex md:hidden md:group-hover:flex flex-col ml-2.5 text-left text-xs leading-tight min-w-0">
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">{t('language')}</span>
              <span className="text-gray-300 font-medium text-[11px] truncate">Alternar idioma</span>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                navigate('/admin');
              }}
              title="Painel de Clientes & Assinaturas"
              className="
                relative flex items-center justify-start md:justify-center md:group-hover:justify-start gap-3.5 px-3.5 py-2 rounded-2xl
                w-full whitespace-nowrap
                bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30 hover:text-white transition-all duration-200 focus:outline-none shadow-md shadow-red-950/40
              "
            >
              <FaShieldAlt className="text-[19px] shrink-0" />
              <div className="flex md:hidden md:group-hover:flex flex-col text-left min-w-0">
                <span className="text-white text-[12px] font-bold truncate">Painel Master</span>
                <span className="text-red-400 text-[9px] font-black uppercase tracking-wider truncate">Gestão Clientes</span>
              </div>
            </button>
          )}

          {user ? (
            <>
              <button
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  onOpenAccountModal();
                }}
                title="Minha Conta, Vencimento & Trocar Plano"
                className="
                  relative flex items-center justify-start md:justify-center md:group-hover:justify-start gap-3.5 px-3.5 py-2 rounded-2xl
                  w-full whitespace-nowrap
                  bg-purple-950/30 border border-purple-500/30 text-gray-200 hover:bg-purple-600/25 hover:border-purple-500/50 hover:text-white transition-all duration-200 focus:outline-none shadow-md group/acc
                "
              >
                <FaUserCircle className="text-[20px] text-purple-400 shrink-0 group-hover/acc:scale-110 transition-transform" />
                <div className="flex md:hidden md:group-hover:flex flex-col text-left min-w-0">
                  <span className="text-white text-[12px] font-bold truncate">
                    {profile?.plan_name || 'Minha Conta'}
                  </span>
                  <span
                    className={`text-[10px] font-black truncate ${
                      isActive ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {isActive ? `${daysRemaining}d restantes` : 'Assinatura Vencida'}
                  </span>
                </div>
              </button>

              <button
                onClick={handleLogout}
                title={t('log_out')}
                className="
                  relative flex items-center justify-start md:justify-center md:group-hover:justify-start gap-3.5 px-3.5 py-2 rounded-2xl
                  w-full whitespace-nowrap
                  border border-transparent text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-colors duration-200 focus:outline-none group/user
                "
              >
                <FaSignOutAlt className="text-[20px] shrink-0" />
                <div className="flex md:hidden md:group-hover:flex flex-col text-left min-w-0">
                  <span className="text-white truncate text-[12px] font-bold">{user.displayName || user.email?.split('@')[0]}</span>
                  <span className="text-red-400 text-[9px] font-bold uppercase tracking-wider">{t('log_out')}</span>
                </div>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                onOpenAuthModal();
              }}
              title={t('sign_in')}
              className="
                relative flex items-center justify-start md:justify-center md:group-hover:justify-start gap-3.5 px-3.5 py-2.5 rounded-2xl
                w-full text-[13px] font-medium whitespace-nowrap
                border border-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-colors duration-200 focus:outline-none
              "
            >
              <FaUserCircle className="text-[22px] shrink-0" />
              <span className="inline md:hidden md:group-hover:inline truncate">
                {t('sign_in')}
              </span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

Sidebar.propTypes = {
  activePage: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  selectedGenreId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onGenreSelect: PropTypes.func,
  onOpenAuthModal: PropTypes.func,
  onOpenAccountModal: PropTypes.func,
  onOpenDownloadModal: PropTypes.func,
  isMobileOpen: PropTypes.bool,
  onCloseMobile: PropTypes.func,
};

export default React.memo(Sidebar);
