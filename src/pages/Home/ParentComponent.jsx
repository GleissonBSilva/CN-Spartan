import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BiUpArrowAlt, BiHomeAlt, BiMoviePlay, BiTv, BiSearch, BiBookmark } from 'react-icons/bi';
import { FaUserCircle, FaSignOutAlt, FaBroadcastTower } from 'react-icons/fa';
import Sidebar from './Sidebar';
import { buildBrowsePath, getCategoryBySlug } from './urlFilters';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebase";
import AuthModal from "../../components/AuthModal";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSelector from "../../components/LanguageSelector";
import FamilyModeControl from "../../components/FamilyModeControl";
import { useAuthProfile } from "../../hooks/useAuthProfile";

function ParentComponent() {
  const { signOut: supaSignOut } = useAuthProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleOpenAuthModal = () => setIsAuthModalOpen(true);
    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal);
  }, []);

  const handleLogout = async () => {
    try {
      await supaSignOut();
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const activePage =
    location.pathname === '/'                  ? 'home'
    : location.pathname.startsWith('/movies')  ? 'movies'
    : location.pathname.startsWith('/series')  ? 'series'
    : location.pathname.startsWith('/tv-ao-vivo') ? 'livetv'
    : location.pathname.startsWith('/search')  ? 'search'
    : location.pathname.startsWith('/watchlist') ? 'watchlist'
    : location.pathname.startsWith('/movie/')  ? 'movies'
    : location.pathname.startsWith('/tv/')     ? 'series'
    : 'home';

  const handleScroll = useCallback(() => {
    setScrollPosition(window.scrollY);
  }, []);
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Hide bottom nav when the virtual keyboard is open (mobile)
  useEffect(() => {
    let timeoutId;
    const handleFocus = (e) => {
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') {
        setKeyboardOpen(true);
      }
    };
    const handleBlur = (e) => {
      const tag = e.target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') {
        // Delay closing slightly to prevent flicker if jumping between inputs
        timeoutId = setTimeout(() => {
          // Double check if focus moved to another input
          const activeTag = document.activeElement?.tagName?.toLowerCase();
          if (activeTag !== 'input' && activeTag !== 'textarea') {
            setKeyboardOpen(false);
          }
        }, 150);
      }
    };

    // Use capture phase for focus/blur as they are much more reliable than focusin/focusout bubbling on iOS PWAs
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    const vv = window.visualViewport;
    const handleResize = () => {
      if (vv && vv.height < window.innerHeight * 0.85) {
        setKeyboardOpen(true);
      }
    };
    if (vv) vv.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
      if (vv) vv.removeEventListener('resize', handleResize);
    };
  }, []);

  const selectedGenreId = (() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'movies' && pathParts[1]) {
      return getCategoryBySlug('movie', pathParts[1])?.id ?? null;
    }
    if (pathParts[0] === 'series' && pathParts[1]) {
      return getCategoryBySlug('tv', pathParts[1])?.id ?? null;
    }
    return searchParams.get('genre') ? Number(searchParams.get('genre')) : null;
  })();

  const handleNavigation = (page) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (page === 'home')        navigate('/');
    else if (page === 'movies') navigate('/movies');
    else if (page === 'series') navigate('/series');
    else if (page === 'livetv') navigate('/tv-ao-vivo');
    else                        navigate(`/${page}`);
  };

  const handleGenreSelect = (genreId) => {
    const type = activePage === 'series' ? 'tv' : 'movie';
    window.scrollTo({ top: 0, behavior: 'auto' });
    navigate(buildBrowsePath(type, genreId, 'popularity.desc'));
  };

  return (
    <div className="min-h-screen relative text-white">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigation}
        selectedGenreId={selectedGenreId}
        onGenreSelect={handleGenreSelect}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {scrollPosition > 300 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-4 right-4 z-50 text-white p-3 rounded-full bg-white/10 hover:bg-white/20 shadow-lg hover:scale-110 transition-all duration-300"
          aria-label="Scroll to Top"
        >
          <BiUpArrowAlt className="text-2xl" />
        </button>
      )}

      {/* Global Top Controls (Family Mode & Language) */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2.5">
        <FamilyModeControl />
        <LanguageSelector />
      </div>

      {/* Page content */}
      <div className="md:pl-[84px] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {!import.meta.env.VITE_TMDB_API && (
          <div className="bg-amber-950/80 border-b border-amber-600/30 px-4 py-2.5 text-center text-xs text-amber-200 sticky top-0 z-40 backdrop-blur-md">
            ⚠️ <strong>Configuração do TMDB:</strong> Chave de API não detectada no ambiente. Adicione sua chave <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">VITE_TMDB_API</code> no arquivo <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">.env</code> para carregar os títulos ao vivo.
          </div>
        )}
        <Outlet />

        {/* Footer — home page only */}
        {location.pathname === '/' && <footer className="bg-[#0a0c12]">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-600">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-icon.png"
                alt="CineSpartan"
                className="w-7 h-7 rounded-md object-contain ring-1 ring-red-500/20 bg-black/40"
              />
              <span className="text-white font-black text-sm">Cine<span className="text-red-500">Spartan</span></span>
              <span>·</span>
              <span>Developed by <span className="text-gray-400 font-semibold">Phyo Min Thein</span></span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span>© {new Date().getFullYear()} CineSpartan</span>
                <span>·</span>
                <span>
                  Data by{' '}
                  <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white underline underline-offset-2 transition-colors">
                    TMDB
                  </a>
                </span>
              </div>
              <a href="//www.dmca.com/Protection/Status.aspx?ID=204cd8cc-b62c-4f4a-aa8b-939824095655" title="DMCA.com Protection Status" className="dmca-badge"> <img src="https://images.dmca.com/Badges/dmca_protected_sml_120m.png?ID=204cd8cc-b62c-4f4a-aa8b-939824095655" alt="DMCA.com Protection Status" /></a>
            </div>
          </div>
        </footer>}
      </div>

      {/* Mobile bottom navigation */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070b14] border-t border-white/[0.08] shadow-[0_-10px_30px_rgba(0,0,0,0.55)] items-center justify-around px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] ${keyboardOpen ? 'hidden' : 'flex'}`}>
        {[
          { id: 'home',   icon: BiHomeAlt,   label: t('home') },
          { id: 'movies', icon: BiMoviePlay, label: t('movies') },
          { id: 'series', icon: BiTv,        label: t('tv_shows') },
          { id: 'livetv', icon: FaBroadcastTower, label: t('live_tv') },
          { id: 'search', icon: BiSearch,    label: t('search') },
          { id: 'watchlist', icon: BiBookmark, label: t('watchlist') },
        ].map(({ id, icon: Icon, label }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => handleNavigation(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                isActive ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="text-2xl" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
        {/* Mobile Profile/Auth Button */}
        {user ? (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors text-red-500/80 hover:text-red-400"
          >
            <FaSignOutAlt className="text-2xl" />
            <span className="text-[10px] font-medium font-bold uppercase tracking-wider">{t('log_out')}</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors text-gray-500 hover:text-gray-300"
          >
            <FaUserCircle className="text-2xl" />
            <span className="text-[10px] font-medium">{t('sign_in')}</span>
          </button>
        )}
      </nav>

      {/* Auth Modal Form */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

export default ParentComponent;
