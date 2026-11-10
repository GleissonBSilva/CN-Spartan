import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes, FaStar } from 'react-icons/fa';
import { BiMoviePlay, BiTv } from 'react-icons/bi';
import { toDetailPath } from '../pages/Home/urlUtils';
import { useLanguage } from '../context/LanguageContext';
import { useFamilyMode } from '../context/FamilyModeContext';

const API_KEY = import.meta.env.VITE_TMDB_API || '5f7f80e39e460ebace782d8aa6cfe1f2';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api.themoviedb.org/3';
const POSTER_SM = 'https://image.tmdb.org/t/p/w92';

export default function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { language, t } = useLanguage();
  const { filterFamilyItems } = useFamilyMode();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Ctrl+K or Command+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const url = new URL(`${BASE_URL}/search/multi`);
        url.searchParams.append('api_key', API_KEY);
        url.searchParams.append('query', trimmed);
        url.searchParams.append('language', language);
        url.searchParams.append('include_adult', 'false');

        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        
        // Filter to only movies and tv shows
        const filtered = (data.results ?? []).filter(
          (item) => item.media_type === 'movie' || item.media_type === 'tv'
        );

        // Apply family mode filter
        const safeItems = filterFamilyItems(filtered);
        setResults(safeItems.slice(0, 6));
        setIsOpen(true);
      } catch {
        /* ignore */
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, language, filterFamilyItems]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsOpen(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSelect = (item) => {
    setIsOpen(false);
    setQuery('');
    const type = item.media_type === 'tv' ? 'tv' : 'movie';
    const path = toDetailPath(type, item.id, item.title || item.name);
    navigate(path);
  };

  return (
    <div ref={containerRef} className="relative z-50">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim().length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={t('search_placeholder') || 'Buscar filmes, séries...'}
          className="w-44 sm:w-60 md:w-72 lg:w-80 h-9 pl-9 pr-8 rounded-full bg-black/50 hover:bg-black/60 focus:bg-black/80 border border-white/10 hover:border-white/20 focus:border-red-500/80 text-xs text-white placeholder-gray-400 backdrop-blur-md transition-all duration-200 outline-none shadow-lg focus:shadow-red-950/20"
        />
        <FaSearch className="absolute left-3 text-gray-400 text-xs pointer-events-none" />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="text-xs" />
          </button>
        ) : (
          <span className="hidden xl:inline absolute right-2.5 px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono text-gray-400 pointer-events-none">
            Ctrl+K
          </span>
        )}
      </form>

      {/* Dropdown Results */}
      {isOpen && (results.length > 0 || isLoading) && (
        <div className="absolute top-11 left-0 right-0 sm:right-auto sm:w-80 md:w-96 bg-[#10131a]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-fade-in divide-y divide-white/5">
          {isLoading && results.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <span>Buscando...</span>
            </div>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                {results.map((item) => {
                  const title = item.title || item.name;
                  const date = item.release_date || item.first_air_date || '';
                  const year = date.slice(0, 4);
                  const isTv = item.media_type === 'tv';
                  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-white/[0.08] transition-colors group"
                    >
                      {item.poster_path ? (
                        <img
                          src={`${POSTER_SM}${item.poster_path}`}
                          alt={title}
                          className="w-9 h-13 object-cover rounded-lg shrink-0 shadow ring-1 ring-white/10 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-9 h-13 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                          {isTv ? <BiTv className="text-gray-500" /> : <BiMoviePlay className="text-gray-500" />}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                          {title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-semibold text-gray-300">
                            {isTv ? 'Série' : 'Filme'}
                          </span>
                          {year && <span>{year}</span>}
                          {rating && (
                            <span className="flex items-center gap-1 text-amber-400">
                              <FaStar className="text-[9px]" />
                              {rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* View all results button */}
              <button
                onClick={handleSubmit}
                className="w-full p-2.5 text-center text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Ver todos os resultados para &quot;{query}&quot;</span>
                <span>→</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
