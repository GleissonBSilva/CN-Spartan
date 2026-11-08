import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const SUPPORTED_LANGUAGES = [
  { code: 'pt-BR', label: 'Português (BR)', flag: '🇧🇷', short: 'PT' },
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸', short: 'EN' },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸', short: 'ES' },
];

const TRANSLATIONS = {
  'pt-BR': {
    // Menu & Navigation
    home: 'Início',
    movies: 'Filmes',
    tv_shows: 'Séries',
    search: 'Buscar',
    watchlist: 'Minha Lista',
    sign_in: 'Entrar',
    log_out: 'Sair',
    menu: 'Menu',
    genres: 'Gêneros',
    language: 'Idioma',

    // Home rows & sections
    trending_movies: 'Filmes em Alta',
    top_10_movies: 'Top 10 Filmes da Semana',
    now_playing: 'Em Cartaz nos Cinemas',
    trending_tv: 'Séries em Alta',
    top_10_tv: 'Top 10 Séries da Semana',
    asian_tv: 'Séries Asiáticas',
    continue_watching: 'Continuar Assistindo',
    for_you: 'Recomendados para Você',
    see_all: 'Ver todos',
    play: 'Assistir',
    more_info: 'Mais Detalhes',
    watch_now: 'Assistir Agora',

    // Details & player
    season: 'Temporada',
    episode: 'Episódio',
    episodes: 'Episódios',
    overview: 'Sinopse',
    no_overview: 'Nenhuma sinopse disponível neste idioma.',
    cast: 'Elenco Principal',
    similar_titles: 'Títulos Semelhantes',
    server: 'Servidor',
    player_tip: '💡 Dica: Para áudio/legendas em Português no player principal, clique no ícone "CC" ou na engrenagem no canto do vídeo e selecione Português (Brasil). Se um servidor demorar ou falhar, teste os outros servidores acima.',
    back: 'Voltar',
    add_watchlist: 'Salvar na Lista',
    in_watchlist: 'Na Minha Lista',
    runtime: 'Duração',
    release_date: 'Lançamento',
    rating: 'Avaliação',
    search_episodes: 'Buscar episódios...',

    // Search & Filter
    search_placeholder: 'Buscar filmes, séries, pessoas...',
    filter: 'Filtros',
    sort_by: 'Ordenar por',
    most_popular: 'Mais Populares',
    top_rated: 'Melhor Avaliados',
    newest: 'Mais Recentes',
    oldest: 'Mais Antigos',
    highest_grossing: 'Maior Bilheteria',
    all: 'Todos',
    no_results: 'Nenhum resultado encontrado',
    reset_filters: 'Redefinir Filtros',
    min_rating: 'Avaliação Mínima',
    year: 'Ano',

    // Watchlist
    watchlist_title: 'Minha Lista',
    watchlist_empty: 'Sua lista está vazia.',
    watchlist_login_prompt: 'Faça login para salvar seus filmes e séries favoritos.',

    // Genres
    genre_28: 'Ação',
    genre_12: 'Aventura',
    genre_16: 'Animação',
    genre_35: 'Comédia',
    genre_80: 'Crime',
    genre_99: 'Documentário',
    genre_18: 'Drama',
    genre_10751: 'Família',
    genre_14: 'Fantasia',
    genre_36: 'História',
    genre_27: 'Terror',
    genre_10402: 'Música',
    genre_9648: 'Mistério',
    genre_10749: 'Romance',
    genre_878: 'Ficção Científica',
    genre_10770: 'Cinema TV',
    genre_53: 'Suspense',
    genre_10752: 'Guerra',
    genre_37: 'Faroeste',
    genre_10759: 'Ação e Aventura',
    genre_10762: 'Kids',
    genre_10764: 'Reality',
    genre_10765: 'Sci-Fi e Fantasia',
    genre_10766: 'Novela',
    genre_10767: 'Guerra e Política',
    genre_10768: 'Faroeste',
    genre_anime: 'Anime',
    genre_kdrama: 'K-Drama',
    genre_cdrama: 'C-Drama',
    genre_donghua: 'Donghua',
    genre_thai_movie: 'Filmes Tailandeses',
    genre_korean_movie: 'Filmes Coreanos',
    genre_chinese_movie: 'Filmes Chineses',
    genre_thai_drama: 'Dramas Tailandeses',
  },
  'en-US': {
    home: 'Home',
    movies: 'Movies',
    tv_shows: 'TV Shows',
    search: 'Search',
    watchlist: 'Watchlist',
    sign_in: 'Sign In',
    log_out: 'Log Out',
    menu: 'Menu',
    genres: 'Genres',
    language: 'Language',

    trending_movies: 'Trending Movies',
    top_10_movies: 'Top 10 Movies This Week',
    now_playing: 'Now Playing in Theaters',
    trending_tv: 'Trending TV Shows',
    top_10_tv: 'Top 10 Series This Week',
    asian_tv: 'Asian TV Shows',
    continue_watching: 'Continue Watching',
    for_you: 'Recommended for You',
    see_all: 'See all',
    play: 'Play',
    more_info: 'More Info',
    watch_now: 'Watch Now',

    season: 'Season',
    episode: 'Episode',
    episodes: 'Episodes',
    overview: 'Overview',
    no_overview: 'No overview available in this language.',
    cast: 'Top Cast',
    similar_titles: 'Similar Titles',
    server: 'Server',
    player_tip: '💡 Tip: For subtitles or audio tracks, click the "CC" or gear icon on the player controls and select your preferred language. If a server is slow, switch between the servers above.',
    back: 'Back',
    add_watchlist: 'Add to Watchlist',
    in_watchlist: 'In Watchlist',
    runtime: 'Runtime',
    release_date: 'Release Date',
    rating: 'Rating',
    search_episodes: 'Search episodes...',

    search_placeholder: 'Search movies, TV shows, actors...',
    filter: 'Filters',
    sort_by: 'Sort by',
    most_popular: 'Most Popular',
    top_rated: 'Top Rated',
    newest: 'Newest',
    oldest: 'Oldest',
    highest_grossing: 'Highest Grossing',
    all: 'All',
    no_results: 'No results found',
    reset_filters: 'Reset Filters',
    min_rating: 'Minimum Rating',
    year: 'Year',

    watchlist_title: 'My Watchlist',
    watchlist_empty: 'Your watchlist is empty.',
    watchlist_login_prompt: 'Sign in to save your favorite movies and shows.',

    genre_28: 'Action',
    genre_12: 'Adventure',
    genre_16: 'Animation',
    genre_35: 'Comedy',
    genre_80: 'Crime',
    genre_99: 'Documentary',
    genre_18: 'Drama',
    genre_10751: 'Family',
    genre_14: 'Fantasy',
    genre_36: 'History',
    genre_27: 'Horror',
    genre_10402: 'Music',
    genre_9648: 'Mystery',
    genre_10749: 'Romance',
    genre_878: 'Science Fiction',
    genre_10770: 'TV Movie',
    genre_53: 'Thriller',
    genre_10752: 'War',
    genre_37: 'Western',
    genre_10759: 'Action & Adventure',
    genre_10762: 'Kids',
    genre_10764: 'Reality',
    genre_10765: 'Sci-Fi & Fantasy',
    genre_10766: 'Soap',
    genre_10767: 'War & Politics',
    genre_10768: 'Western',
    genre_anime: 'Anime',
    genre_kdrama: 'K-Drama',
    genre_cdrama: 'C-Drama',
    genre_donghua: 'Donghua',
    genre_thai_movie: 'Thai Movie',
    genre_korean_movie: 'Korean Movie',
    genre_chinese_movie: 'Chinese Movie',
    genre_thai_drama: 'Thai Drama',
  },
  'es-ES': {
    home: 'Inicio',
    movies: 'Películas',
    tv_shows: 'Series',
    search: 'Buscar',
    watchlist: 'Mi Lista',
    sign_in: 'Iniciar Sesión',
    log_out: 'Cerrar Sesión',
    menu: 'Menú',
    genres: 'Géneros',
    language: 'Idioma',

    trending_movies: 'Películas en Tendencia',
    top_10_movies: 'Top 10 Películas de la Semana',
    now_playing: 'En Cines',
    trending_tv: 'Series en Tendencia',
    top_10_tv: 'Top 10 Series de la Semana',
    asian_tv: 'Series Asiáticas',
    continue_watching: 'Continuar Viendo',
    for_you: 'Recomendado para Ti',
    see_all: 'Ver todos',
    play: 'Reproducir',
    more_info: 'Más Información',
    watch_now: 'Ver Ahora',

    season: 'Temporada',
    episode: 'Episodio',
    episodes: 'Episodios',
    overview: 'Sinopsis',
    no_overview: 'Sin descripción disponible en este idioma.',
    cast: 'Reparto Principal',
    similar_titles: 'Títulos Similares',
    server: 'Servidor',
    player_tip: '💡 Consejo: Para subtítulos o audio en su idioma, haga clic en el icono "CC" o en el engranaje del reproductor. Si un servidor es lento, pruebe con los otros servidores de arriba.',
    back: 'Volver',
    add_watchlist: 'Añadir a mi Lista',
    in_watchlist: 'En mi Lista',
    runtime: 'Duración',
    release_date: 'Estreno',
    rating: 'Calificación',
    search_episodes: 'Buscar episodios...',

    search_placeholder: 'Buscar películas, series, actores...',
    filter: 'Filtros',
    sort_by: 'Ordenar por',
    most_popular: 'Más Populares',
    top_rated: 'Mejor Valoradas',
    newest: 'Más Recientes',
    oldest: 'Más Antiguas',
    highest_grossing: 'Mayor Recaudación',
    all: 'Todos',
    no_results: 'No se encontraron resultados',
    reset_filters: 'Restablecer Filtros',
    min_rating: 'Calificación Mínima',
    year: 'Año',

    watchlist_title: 'Mi Lista',
    watchlist_empty: 'Tu lista está vacía.',
    watchlist_login_prompt: 'Inicia sesión para guardar tus títulos favoritos.',

    genre_28: 'Acción',
    genre_12: 'Aventura',
    genre_16: 'Animación',
    genre_35: 'Comedia',
    genre_80: 'Crimen',
    genre_99: 'Documental',
    genre_18: 'Drama',
    genre_10751: 'Familia',
    genre_14: 'Fantasía',
    genre_36: 'Historia',
    genre_27: 'Terror',
    genre_10402: 'Música',
    genre_9648: 'Misterio',
    genre_10749: 'Romance',
    genre_878: 'Ciencia Ficción',
    genre_10770: 'Película de TV',
    genre_53: 'Suspense',
    genre_10752: 'Guerra',
    genre_37: 'Western',
    genre_10759: 'Acción y Aventura',
    genre_10762: 'Kids',
    genre_10764: 'Reality',
    genre_10765: 'Sci-Fi y Fantasía',
    genre_10766: 'Telenovela',
    genre_10767: 'Guerra y Política',
    genre_10768: 'Western',
    genre_anime: 'Anime',
    genre_kdrama: 'K-Drama',
    genre_cdrama: 'C-Drama',
    genre_donghua: 'Donghua',
    genre_thai_movie: 'Películas Tailandesas',
    genre_korean_movie: 'Películas Coreanas',
    genre_chinese_movie: 'Películas Chinas',
    genre_thai_drama: 'Dramas Tailandeses',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('weflix_language') || 'pt-BR';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('weflix_language', lang);
  };

  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['pt-BR']?.[key] || TRANSLATIONS['en-US']?.[key] || key;
  };

  const getGenreName = (genreId, fallbackName) => {
    if (genreId === -1) return t('genre_anime');
    if (genreId === -2) return t('genre_kdrama');
    if (genreId === -3) return t('genre_cdrama');
    if (genreId === -4) return t('genre_donghua');
    if (genreId === -5) return t('genre_thai_drama');
    return t(`genre_${genreId}`) !== `genre_${genreId}` ? t(`genre_${genreId}`) : fallbackName;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getGenreName, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
