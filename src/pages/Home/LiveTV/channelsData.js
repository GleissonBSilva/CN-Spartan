// Lista completa e verificada de canais ao vivo (HLS H.264 Universal + Servidores Reais de IPTV com CORS liberado)
export const CHANNELS = [
  // ==========================================
  // ⚽ ESPORTES & LUTAS (Premiere, SporTV, ESPN, Combate, FIFA+)
  // ==========================================
  {
    id: 'premiere_clubes',
    name: 'Premiere Clubes HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a06g/index.m3u8' },
      { name: 'Servidor 2 (Alternativo 1080p)', url: 'http://64.31.23.207:80/96795792/50165825/3460209.ts' }
    ]
  },
  {
    id: 'premiere_2',
    name: 'Premiere 2 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a06h/index.m3u8' },
      { name: 'Servidor 2 (Alternativo)', url: 'http://64.31.23.207:80/96795792/50165825/3460210.ts' }
    ]
  },
  {
    id: 'premiere_3',
    name: 'Premiere 3 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a0av/index.m3u8' }
    ]
  },
  {
    id: 'premiere_4',
    name: 'Premiere 4 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a07b/index.m3u8' }
    ]
  },
  {
    id: 'premiere_5',
    name: 'Premiere 5 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a07c/index.m3u8' }
    ]
  },
  {
    id: 'premiere_6',
    name: 'Premiere 6 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a05j/index.m3u8' }
    ]
  },
  {
    id: 'premiere_7',
    name: 'Premiere 7 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a05k/index.m3u8' }
    ]
  },
  {
    id: 'premiere_8',
    name: 'Premiere 8 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a05l/index.m3u8' },
      { name: 'Servidor 2 (Alternativo)', url: 'http://64.31.23.207:80/96795792/50165825/3460230.ts' }
    ]
  },
  {
    id: 'universal_premiere',
    name: 'Universal Premiere HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a08m/index.m3u8' }
    ]
  },
  {
    id: 'sportv_hd',
    name: 'SporTV HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/SporTV_logo_2021.svg/1200px-SporTV_logo_2021.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a05g/index.m3u8' },
      { name: 'Servidor 2 (HLS Alternativo)', url: 'http://acaidopt.org:80/live/3llohwk4g9/kwf099q30o/8787.m3u8' }
    ]
  },
  {
    id: 'sportv_2',
    name: 'SporTV 2 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/SporTV_2_logo_2021.svg/1200px-SporTV_2_logo_2021.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a05f/index.m3u8' },
      { name: 'Servidor 2 (HLS Alternativo)', url: 'http://acaidopt.org:80/live/3llohwk4g9/kwf099q30o/8788.m3u8' }
    ]
  },
  {
    id: 'sportv_3',
    name: 'SporTV 3 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/SporTV_3_logo_2021.svg/1200px-SporTV_3_logo_2021.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a06v/index.m3u8' },
      { name: 'Servidor 2 (HLS Alternativo)', url: 'http://acaidopt.org:80/live/3llohwk4g9/kwf099q30o/8789.m3u8' }
    ]
  },
  {
    id: 'combate_ufc',
    name: 'Combate UFC HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/a/ab/Canal_Combate_logo.png/250px-Canal_Combate_logo.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Lutas Ao Vivo)', url: 'http://45.185.11.126:8000/play/a073/index.m3u8' },
      { name: 'Servidor 2 (HLS Alternativo)', url: 'http://acaidopt.org:80/live/3llohwk4g9/kwf099q30o/8714.m3u8' }
    ]
  },
  {
    id: 'fifa_plus',
    name: 'FIFA+ Futebol Oficial',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/FIFA_logo_without_slogan.svg/1200px-FIFA_logo_without_slogan.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão Oficial 1080p)', url: 'https://e3be9ac5.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctYnJfRklGQVBsdXNQb3J0dWd1ZXNlX0hMUw/playlist.m3u8' }
    ]
  },
  {
    id: 'band_sports',
    name: 'Band Sports HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/a/a2/BandSports_logo.png/250px-BandSports_logo.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a05o/index.m3u8' }
    ]
  },
  {
    id: 'espn_4',
    name: 'ESPN 4 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/ESPN_logo.svg/1200px-ESPN_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a05m/index.m3u8' }
    ]
  },
  {
    id: 'espn_5',
    name: 'ESPN 5 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/ESPN_logo.svg/1200px-ESPN_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a05n/index.m3u8' }
    ]
  },
  {
    id: 'espn_6',
    name: 'ESPN 6 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/ESPN_logo.svg/1200px-ESPN_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a084/index.m3u8' }
    ]
  },
  {
    id: 'ge_tv',
    name: 'GE TV Esportes HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/GE_Globo_logo.svg/1200px-GE_Globo_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a08v/index.m3u8' }
    ]
  },

  // ==========================================
  // 📡 CANAIS ABERTOS (SBT, Cultura, Record, A Crítica, Minas, Regionais)
  // ==========================================
  {
    id: 'sbt_news',
    name: 'SBT News 24h',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/SBT_logo.svg/1200px-SBT_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão Oficial Google DAI)', url: 'https://dai.google.com/linear/hls/event/1XSOdtQ0SH2G8OEmEfGgjQ/master.m3u8' }
    ]
  },
  {
    id: 'cultura_fast',
    name: 'TV Cultura Fast HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/TV_Cultura_logo.svg/1200px-TV_Cultura_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Transmissão Oficial FPA)', url: 'https://fpa-gateway.tvcultura.com.br:8181/memfs/606caef0-a290-413d-9f1f-8fcdb3a73831.m3u8' }
    ]
  },
  {
    id: 'tv_a_critica',
    name: 'TV A Crítica HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/d/d7/Logotipo_da_TV_A_Cr%C3%ADtica.png/250px-Logotipo_da_TV_A_Cr%C3%ADtica.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Oficial 1080p)', url: 'https://cdn.live.br1.jmvstream.com/w/LVW-20715/LVW20715_50E3x2MCm2/playlist.m3u8' }
    ]
  },
  {
    id: 'rede_minas',
    name: 'Rede Minas HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/1/16/Rede_Minas_logo.png/250px-Rede_Minas_logo.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Oficial HLS)', url: 'https://8hzcavccys.zoeweb.tv/redeminas/ngrp:redeminas_all/playlist.m3u8' }
    ]
  },
  {
    id: 'rede_brasil',
    name: 'Rede Brasil de Televisão',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/e/ee/Rede_Brasil_de_Televis%C3%A3o_logo_2019.png/250px-Rede_Brasil_de_Televis%C3%A3o_logo_2019.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Oficial)', url: 'https://redebrasil.nuvemplay.live/hls/stream.m3u8' }
    ]
  },
  {
    id: 'redetv_parana',
    name: 'RedeTV! Paraná HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/RedeTV%21_logo.svg/1200px-RedeTV%21_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Oficial HLS)', url: 'https://tv01.zas.media:1936/redetvparana/redetvparana/playlist.m3u8' }
    ]
  },
  {
    id: 'rede_ngt',
    name: 'Rede NGT',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/2/2a/Rede_NGT_logo.png/250px-Rede_NGT_logo.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Oficial)', url: 'https://isaocorp.cloudecast.com/ngt/index.m3u8' }
    ]
  },
  {
    id: 'tv_camara',
    name: 'TV Câmara Federal',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/TV_C%C3%A2mara_logo_2019.svg/1200px-TV_C%C3%A2mara_logo_2019.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão Oficial)', url: 'https://stream3.camara.gov.br/tv1/manifest.m3u8' }
    ]
  },
  {
    id: 'tv_cidade_verde',
    name: 'TV Cidade Verde',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: '',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Oficial HLS)', url: 'https://televisaocidadeverde.brasilstream.com.br/hls/televisaocidadeverde/index.m3u8' }
    ]
  },
  {
    id: 'tv_arapuan',
    name: 'TV Arapuan HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: '',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Oficial HLS)', url: 'https://5b7f3c45ab7c2.streamlock.net/arapuan/ngrp:arapuan_all/playlist.m3u8' }
    ]
  },

  // ==========================================
  // 🎬 FILMES & SÉRIES (Telecine, HBO, Warner, Sony, Universal, AXN, Megapix)
  // ==========================================
  {
    id: 'telecine_premium',
    name: 'Telecine Premium HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.seeklogo.com/logo-png/43/1/telecine-premium-logo-png_seeklogo-430939.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a08e/index.m3u8' }
    ]
  },
  {
    id: 'telecine_action',
    name: 'Telecine Action HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.seeklogo.com/logo-png/43/1/telecine-action-logo-png_seeklogo-430940.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a058/index.m3u8' }
    ]
  },
  {
    id: 'telecine_fun',
    name: 'Telecine Fun HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.seeklogo.com/logo-png/43/1/telecine-fun-logo-png_seeklogo-430941.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a059/index.m3u8' }
    ]
  },
  {
    id: 'telecine_pipoca',
    name: 'Telecine Pipoca HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.seeklogo.com/logo-png/43/1/telecine-pipoca-logo-png_seeklogo-430942.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a08g/index.m3u8' }
    ]
  },
  {
    id: 'telecine_touch',
    name: 'Telecine Touch HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.seeklogo.com/logo-png/43/1/telecine-touch-logo-png_seeklogo-430944.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a08f/index.m3u8' }
    ]
  },
  {
    id: 'telecine_cult',
    name: 'Telecine Cult HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.seeklogo.com/logo-png/43/1/telecine-cult-logo-png_seeklogo-430943.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a05a/index.m3u8' }
    ]
  },
  {
    id: 'hbo_brasil',
    name: 'HBO Brasil HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/1200px-HBO_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a08n/index.m3u8' }
    ]
  },
  {
    id: 'hbo_2',
    name: 'HBO 2 HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/1200px-HBO_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a08o/index.m3u8' }
    ]
  },
  {
    id: 'hbo_family',
    name: 'HBO Family HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/1200px-HBO_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a08q/index.m3u8' }
    ]
  },
  {
    id: 'warner_channel',
    name: 'Warner Channel HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Warner_TV_logo_2023.svg/1200px-Warner_TV_logo_2023.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a0am/index.m3u8' }
    ]
  },
  {
    id: 'sony_channel',
    name: 'Sony Channel HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Sony_Channel_logo_2019.svg/1200px-Sony_Channel_logo_2019.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a0an/index.m3u8' }
    ]
  },
  {
    id: 'universal_tv',
    name: 'Universal TV HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Universal_TV_logo_2018.svg/1200px-Universal_TV_logo_2018.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a0af/index.m3u8' }
    ]
  },
  {
    id: 'axn_brasil',
    name: 'AXN Brasil HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/AXN_logo_2015.svg/1200px-AXN_logo_2015.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a0ao/index.m3u8' }
    ]
  },
  {
    id: 'megapix_hd',
    name: 'Megapix HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Megapix_logo_2019.svg/1200px-Megapix_logo_2019.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a057/index.m3u8' }
    ]
  },
  {
    id: 'cinemax_hd',
    name: 'Cinemax HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Cinemax_2011_logo.svg/1200px-Cinemax_2011_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a081/index.m3u8' }
    ]
  },
  {
    id: 'comedy_central',
    name: 'Comedy Central Brasil',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Comedy_Central_2018.svg/1200px-Comedy_Central_2018.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Sinal Direto H.264)', url: 'https://stmv2.srvif.com/gafeab/gafeab/playlist.m3u8' }
    ]
  },
  {
    id: 'classique_tv',
    name: 'Classique TV (Cinema Clássico)',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: '',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Cinema Clássico H.264)', url: 'https://stmv1.srvif.com/classique/classique/playlist.m3u8' }
    ]
  },
  {
    id: 'tv_series_24h',
    name: 'TV Séries 24 Horas',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: '',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Maratona de Séries)', url: 'https://stmv1.srvif.com/tvserie/tvserie/playlist.m3u8' }
    ]
  },

  // ==========================================
  // 📰 NOTÍCIAS (GloboNews, Band News, JP News, SBT News, VEJA+)
  // ==========================================
  {
    id: 'globonews_hd',
    name: 'GloboNews HD',
    category: 'noticias',
    categoryLabel: 'Notícias & Jornalismo',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/GloboNews_logo_2022.svg/1200px-GloboNews_logo_2022.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a08d/index.m3u8' }
    ]
  },
  {
    id: 'bandnews_hd',
    name: 'BandNews HD',
    category: 'noticias',
    categoryLabel: 'Notícias & Jornalismo',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/BandNews_TV_logo_2019.svg/1200px-BandNews_TV_logo_2019.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a076/index.m3u8' }
    ]
  },
  {
    id: 'jovempan_news',
    name: 'Jovem Pan News HD',
    category: 'noticias',
    categoryLabel: 'Notícias & Jornalismo',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Jovem_Pan_News_logo_2021.svg/1200px-Jovem_Pan_News_logo_2021.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a0a1/index.m3u8' }
    ]
  },
  {
    id: 'record_news',
    name: 'Record News HD',
    category: 'noticias',
    categoryLabel: 'Notícias & Jornalismo',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Record_News_logo_2023.svg/1200px-Record_News_logo_2023.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a0a2/index.m3u8' }
    ]
  },
  {
    id: 'veja_plus',
    name: 'VEJA+ TV Notícias',
    category: 'noticias',
    categoryLabel: 'Notícias & Jornalismo',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Veja_logo.svg/1200px-Veja_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão Oficial 1080p)', url: 'https://gpa-vja.otteravision.com/gpa/vja/vja.m3u8' }
    ]
  },

  // ==========================================
  // 🧒 INFANTIL (Discovery Kids, Cartoonito, Gloob, Nickelodeon)
  // ==========================================
  {
    id: 'discovery_kids',
    name: 'Discovery Kids HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Discovery_Kids_2016_logo.svg/1200px-Discovery_Kids_2016_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a0ad/index.m3u8' }
    ]
  },
  {
    id: 'cartoonito',
    name: 'Cartoonito HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Cartoonito_2021_logo.svg/1200px-Cartoonito_2021_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a0ae/index.m3u8' }
    ]
  },
  {
    id: 'gloob_hd',
    name: 'Gloob HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Gloob_2021_logo.svg/1200px-Gloob_2021_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a07v/index.m3u8' }
    ]
  },
  {
    id: 'nickelodeon_br',
    name: 'Nickelodeon HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Nickelodeon_2023.svg/1200px-Nickelodeon_2023.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão Direta H.264)', url: 'https://stmv2.srvif.com/nicktoons/nicktoons/playlist.m3u8' }
    ]
  },
  {
    id: 'retro_cartoon',
    name: 'Retro Cartoon (Desenhos Clássicos)',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: '',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Desenhos Clássicos)', url: 'https://stmv1.video.brstream.com.br/retrotv/retrotv/chunklist_w1069200121.m3u8' }
    ]
  },

  // ==========================================
  // 🌟 DOCUMENTÁRIOS, MÚSICA & VARIEDADES
  // ==========================================
  {
    id: 'discovery_channel',
    name: 'Discovery Channel HD',
    category: 'variedades',
    categoryLabel: 'Música & Variedades',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Discovery_Channel_2019.svg/1200px-Discovery_Channel_2019.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a0ac/index.m3u8' }
    ]
  },
  {
    id: 'animal_planet',
    name: 'Animal Planet HD',
    category: 'variedades',
    categoryLabel: 'Música & Variedades',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Animal_Planet_2018_logo.svg/1200px-Animal_Planet_2018_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a09k/index.m3u8' }
    ]
  },
  {
    id: 'woohoo_hd',
    name: 'Woohoo Esportes & Games HD',
    category: 'variedades',
    categoryLabel: 'Música & Variedades',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/9/90/Canal_Woohoo_logo.png/250px-Canal_Woohoo_logo.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão HLS Ao Vivo)', url: 'http://45.185.11.126:8000/play/a075/index.m3u8' }
    ]
  },
  {
    id: 'trace_brazuca',
    name: 'Trace Brazuca HD (Música)',
    category: 'variedades',
    categoryLabel: 'Música & Variedades',
    logo: '',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Samsung TV Plus HLS)', url: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01131-tracetv-tracebrazuca-samsungbr/playlist.m3u8' }
    ]
  }
];

export const CATEGORIES = [
  { id: 'all', label: 'Todos os Canais', icon: 'FaTv' },
  { id: 'esportes', label: '⚽ Esportes & Lutas', icon: 'FaFutbol' },
  { id: 'abertos', label: '📡 Canais Abertos', icon: 'FaBroadcastTower' },
  { id: 'filmes', label: '🎬 Filmes & Séries', icon: 'FaFilm' },
  { id: 'noticias', label: '📰 Notícias', icon: 'FaNewspaper' },
  { id: 'infantil', label: '🧒 Infantil & Desenhos', icon: 'FaChild' },
  { id: 'variedades', label: '🌟 Variedades & Música', icon: 'FaMusic' }
];
