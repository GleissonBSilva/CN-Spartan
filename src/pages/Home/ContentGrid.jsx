import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import ContentCard from './ContentCard';
import { fetchContentByGenre, fetchTrending } from './Fetcher';
import { SPECIAL_PARAMS } from './tmdb';
import { BiWifi } from 'react-icons/bi';
import { FaSearch } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useFamilyMode } from '../../context/FamilyModeContext';

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const MAX_PAGES = 500;

const ErrorWarning = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-16">
    <BiWifi className="text-red-400 w-10 h-10" />
    <p className="text-gray-400 text-sm font-medium">Connection error — check your network</p>
  </div>
);

const EmptyState = ({ onReset }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center text-xl">
        <span className="text-gray-300">?</span>
      </div>
      <h3 className="text-white font-bold text-lg">{t('no_results') || 'Nenhum resultado encontrado'}</h3>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-1 inline-flex items-center rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-300 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          {t('reset_filters') || 'Redefinir'}
        </button>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  onReset: PropTypes.func,
};

const ContentGrid = ({
  genreId,
  type,
  onSelect,
  sortBy = 'popularity.desc',
  onReset,
  searchQuery = '',
  onClearSearch,
  genreName = '',
}) => {
  const { language, t } = useLanguage();
  const { filterFamilyItems } = useFamilyMode();
  const [fetchParams, setFetchParams] = useState({ genreId, type, sortBy, page: 1, language });

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // In-genre API search state
  const [apiSearchResults, setApiSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const seenIdsRef = useRef(new Set());
  const abortRef = useRef(null);
  const observerRef = useRef(null);
  const lastElementRef = useRef(null);

  // When genre/type/sort props change, reset fetchParams to page 1.
  useEffect(() => {
    setHasAttemptedFetch(false);
    setFetchParams({ genreId, type, sortBy, page: 1, language });
  }, [genreId, type, sortBy, language]);

  // Execute a fetch whenever fetchParams changes.
  useEffect(() => {
    const { genreId: gId, type: t, sortBy: s, page } = fetchParams;
    const today = new Date().toISOString().slice(0, 10);
    const shouldTightenNewestTv = t === 'tv' && s === 'first_air_date.desc';

    if (page === 1) {
      abortRef.current?.abort();
      loadingRef.current = false;
      seenIdsRef.current = new Set();
      hasMoreRef.current = true;
      setError(null);
    }

    if (!hasMoreRef.current || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    const overrideParams = gId != null && gId < 0 ? (SPECIAL_PARAMS[`${gId}_${t}`] ?? null) : null;
    const fetchPromise = gId == null
      ? fetchTrending(t, page, 'week', signal, language)
      : fetchContentByGenre(t, gId, page, overrideParams, s, signal, language);

    fetchPromise
      .then((newContent) => {
        if (signal.aborted) return;
        const sanitized = shouldTightenNewestTv
          ? newContent.filter((item) => (
            Boolean(item.poster_path) &&
            Boolean(item.first_air_date) &&
            item.first_air_date <= today &&
            Number(item.vote_count || 0) >= 20
          ))
          : newContent;

        const unique = sanitized.filter((item) => {
          if (seenIdsRef.current.has(item.id)) return false;
          seenIdsRef.current.add(item.id);
          return true;
        });

        if (page === 1) {
          setRefreshToken((prev) => prev + 1);
        }

        setItems((prev) => (page === 1 ? unique : [...prev, ...unique]));
        hasMoreRef.current = unique.length > 0 && page < MAX_PAGES;
      })
      .catch((err) => {
        if (signal.aborted || err?.name === 'AbortError') return;
        setError(err.message);
      })
      .finally(() => {
        if (signal.aborted) return;
        setLoading(false);
        setHasAttemptedFetch(true);
        loadingRef.current = false;
      });

    return () => { controller.abort(); };
  }, [fetchParams]);

  // Handle in-genre search with debounced API queries
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setApiSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const apiKey = import.meta.env.VITE_TMDB_API || '5f7f80e39e460ebace782d8aa6cfe1f2';
        const baseUrl = import.meta.env.VITE_BASE_URL || 'https://api.themoviedb.org/3';
        const url = new URL(`${baseUrl}/search/${type}`);
        url.searchParams.append('api_key', apiKey);
        url.searchParams.append('query', q);
        url.searchParams.append('language', language);
        url.searchParams.append('include_adult', 'false');

        const res = await fetch(url.toString(), { signal: controller.signal });
        const data = await res.json();
        const rawResults = data.results || [];

        // Filter search results by genre if a genre is selected
        const filtered = rawResults.filter((item) => {
          if (genreId == null) return true;
          if (genreId > 0) {
            return item.genre_ids?.includes(genreId);
          }
          // Special Curated Categories
          if (genreId === -1) { // Anime
            const isAnim = item.genre_ids?.includes(16);
            const isJapanese = item.original_language === 'ja' || item.origin_country?.includes('JP');
            return isAnim && isJapanese;
          }
          if (genreId === -2) { // Thai Movie or K-Drama
            if (type === 'tv') return item.origin_country?.includes('KR') || item.original_language === 'ko';
            return item.origin_country?.includes('TH') || item.original_language === 'th';
          }
          if (genreId === -3) { // Korean Movie or C-Drama
            if (type === 'tv') return (item.origin_country?.includes('CN') || item.original_language === 'zh') && !item.genre_ids?.includes(16);
            return item.origin_country?.includes('KR') || item.original_language === 'ko';
          }
          if (genreId === -4) { // Chinese Movie or Donghua
            if (type === 'tv') return item.genre_ids?.includes(16) && (item.origin_country?.includes('CN') || item.original_language === 'zh');
            return item.origin_country?.includes('CN') || item.original_language === 'zh';
          }
          if (genreId === -5) { // Thai Drama
            return item.origin_country?.includes('TH') || item.original_language === 'th';
          }
          return true;
        });

        setApiSearchResults(filtered);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('In-genre search error:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, genreId, type, language]);

  // Combine items with search filter
  const activeItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return items;
    }

    // 1. Matches from already fetched items in this genre
    const localMatches = items.filter((item) => {
      const title = (item.title || item.name || '').toLowerCase();
      return title.includes(q);
    });

    // 2. Merge with TMDB search results filtered by this genre
    const combined = [...localMatches];
    const seen = new Set(localMatches.map((i) => i.id));
    for (const item of apiSearchResults) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }
    return combined;
  }, [items, searchQuery, apiSearchResults]);

  const visibleItems = useMemo(() => {
    return filterFamilyItems(activeItems);
  }, [activeItems, filterFamilyItems]);

  const isSearchActive = Boolean(searchQuery.trim());

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && !loadingRef.current && hasMoreRef.current && !isSearchActive) {
      setFetchParams((prev) => ({
        ...prev,
        page: Math.min(prev.page + 1, MAX_PAGES),
      }));
    }
  }, [isSearchActive]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
    });
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [handleObserver]);

  useEffect(() => {
    const currentElement = lastElementRef.current;
    const currentObserver = observerRef.current;
    if (currentElement && currentObserver) {
      currentObserver.observe(currentElement);
    }
    return () => {
      if (currentElement && currentObserver) {
        currentObserver.unobserve(currentElement);
      }
    };
  }, [items]);

  const renderContent = () => {
    return visibleItems.map((item, index) => {
      const isLastElement = index === visibleItems.length - 1;
      const posterPath = item.poster_path
        ? `${POSTER_BASE_URL}${item.poster_path}`
        : '/placeholder.svg';

      return (
        <motion.div
          key={`${refreshToken}-${item.id}`}
          ref={isLastElement && !isSearchActive ? lastElementRef : null}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.26,
            ease: 'easeOut',
            delay: Math.min(index, 14) * 0.018,
          }}
        >
          <ContentCard
            title={item.title || item.name}
            poster={posterPath}
            rating={item.vote_average}
            onClick={() => onSelect(item)}
            releaseDate={item.release_date || item.first_air_date}
            mediaId={item.id}
            mediaType={type}
            posterPath={item.poster_path}
            voteAverage={item.vote_average}
          />
        </motion.div>
      );
    });
  };

  const isRefreshing = loading && fetchParams.page === 1 && items.length > 0;

  return (
    <div className="px-2 sm:px-4 py-4">
      {/* In-Genre Search Summary Bar */}
      {isSearchActive && (
        <div className="mb-4 flex items-center justify-between bg-white/[0.04] border border-white/10 px-4 py-2.5 rounded-xl animate-fade-in">
          <p className="text-xs text-gray-300">
            Pesquisando por &quot;<strong className="text-white">{searchQuery}</strong>&quot; em <span className="text-red-400 font-semibold">{genreName || 'Gênero'}</span>
            <span className="text-gray-500 ml-1">({visibleItems.length} {visibleItems.length === 1 ? 'resultado' : 'resultados'})</span>
          </p>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className="text-xs text-red-400 hover:text-red-300 underline font-medium ml-3"
            >
              Limpar pesquisa
            </button>
          )}
        </div>
      )}

      {/* Initial loading skeleton */}
      {visibleItems.length === 0 && (loading || !hasAttemptedFetch) && !isSearchActive && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className="w-full aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {/* Soft refresh indicator when switching tabs/genres/sorts */}
      {isRefreshing && (
        <div className="mb-3 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Updating
            </span>
          </div>
        </div>
      )}

      {/* Search empty state */}
      {isSearchActive && visibleItems.length === 0 && !isSearching && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-lg text-gray-400">
            <FaSearch />
          </div>
          <p className="text-white font-semibold text-sm">
            Nenhum título encontrado para &quot;{searchQuery}&quot; em {genreName || 'este gênero'}.
          </p>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className="mt-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
            >
              Limpar pesquisa
            </button>
          )}
        </div>
      )}

      <div
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 overflow-visible"
        style={{ paddingTop: 24, paddingBottom: 24, marginTop: -24, marginBottom: -24 }}
      >
        {renderContent()}
      </div>

      {hasAttemptedFetch && !loading && !error && visibleItems.length === 0 && !isSearchActive && (
        <EmptyState onReset={onReset} />
      )}

      {/* Infinite-scroll spinner */}
      {visibleItems.length > 0 && (loading || isSearching) && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-red-600 border-t-transparent" />
        </div>
      )}

      {error && <ErrorWarning />}
    </div>
  );
};

ContentGrid.propTypes = {
  genreId: PropTypes.number,
  type: PropTypes.oneOf(['movie', 'tv']).isRequired,
  onSelect: PropTypes.func.isRequired,
  sortBy: PropTypes.string,
  onReset: PropTypes.func,
  searchQuery: PropTypes.string,
  onClearSearch: PropTypes.func,
  genreName: PropTypes.string,
};

export default ContentGrid;
