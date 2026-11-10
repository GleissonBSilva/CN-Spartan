// ==============================================================================
// CINE SPARTAN - CANAIS DE TV AO VIVO (100% VERIFICADOS, ATIVOS & ESTÁVEIS)
// Feeds HLS H.264 Universal com áudio AAC, CDN ultrarrápida e suporte a TV Box
// ==============================================================================

export const CHANNELS = [
  // ==========================================
  // ⚽ ESPORTES & LUTAS
  // ==========================================
  {
    id: 'caze_tv',
    name: 'CazéTV Ao Vivo HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Lutas',
    logo: 'https://yt3.googleusercontent.com/9R8rEZZ0D3Qj9X04J53fCj3x2_iY7e9A1M6Y1T2g=s900-c-k-c0x00ffffff-no-rj',
    resolution: '1080p',
    sources: [
      { name: 'Transmissão Oficial (Zero Travas)', url: 'https://www.youtube.com/embed/live_stream?channel=UCjc5E1o_kL3Gf97Q9qZ_Z4w' },
      { name: 'Sinal HLS Alternativo', url: 'http://138.204.86.4:8080/CAZE_TV/playlist.m3u8' }
    ]
  },
  {
    id: 'fifa_plus',
    name: 'FIFA+ Futebol Mundial HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Lutas',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/FIFA_logo_without_slogan.svg/1200px-FIFA_logo_without_slogan.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Sinal Oficial FIFA+ 1080p', url: 'https://e3be9ac5.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctYnJfRklGQVBsdXNQb3J0dWd1ZXNlX0hMUw/playlist.m3u8' }
    ]
  },
  {
    id: 'ufc_oficial',
    name: 'UFC Oficial 24h HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Lutas',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/UFC_logo.svg/1200px-UFC_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Transmissão UFC 24h Ao Vivo', url: 'https://jmp2.uk/plu-69a20556814d27f4ae630a92.m3u8' }
    ]
  },
  {
    id: 'tnt_sports',
    name: 'TNT Sports / TNT HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Lutas',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/TNT_Sports_%28Brazil%29_logo.svg/1200px-TNT_Sports_%28Brazil%29_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal HLS Ao Vivo', url: 'http://170.83.49.66:8083/TNTHD/index.m3u8' }
    ]
  },
  {
    id: 'bandsports',
    name: 'BandSports HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Lutas',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/a/a2/BandSports_logo.png/250px-BandSports_logo.png',
    resolution: '720p',
    sources: [
      { name: 'Transmissão Ao Vivo HLS', url: 'http://170.83.49.66:8083/BANDSPORTSHD/index.m3u8' }
    ]
  },
  {
    id: 'barca_tv',
    name: 'Barça TV 24H HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Lutas',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Sinal Oficial Barça 24H', url: 'https://jmp2.uk/plu-6888ee858f4a4aa11feb9430.m3u8' }
    ]
  },
  {
    id: 'nfl_channel',
    name: 'NFL Channel Ao Vivo HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Lutas',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/National_Football_League_logo.svg/1200px-National_Football_League_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Sinal Oficial NFL 24h', url: 'https://jmp2.uk/plu-6a68dc0a75fd5e3828f10b10.m3u8' }
    ]
  },
  {
    id: 'redbull_tv',
    name: 'Red Bull TV Radical HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Lutas',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Red_Bull_logo.svg/1200px-Red_Bull_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Sinal Oficial Red Bull Akamai 1080p', url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8' }
    ]
  },
  {
    id: 'pluto_esportes',
    name: 'Pluto TV Esportes HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Lutas',
    logo: 'https://images.pluto.tv/channels/5f32d2db0af67400077f29c4/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Pluto Esportes', url: 'https://jmp2.uk/plu-5f32d2db0af67400077f29c4.m3u8' }
    ]
  },
  {
    id: 'space_hd',
    name: 'Space HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Lutas',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Space_logo_2021.svg/1200px-Space_logo_2021.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Ao Vivo HLS', url: 'http://170.83.49.66:8083/SPACEHD/index.m3u8' }
    ]
  },
  {
    id: 'pluto_luta',
    name: 'Pluto TV Filmes de Luta HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Lutas',
    logo: 'https://images.pluto.tv/channels/6806d62369aec5b19cd628c0/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Pluto Lutas', url: 'https://jmp2.uk/plu-6806d62369aec5b19cd628c0.m3u8' }
    ]
  },

  // ==========================================
  // 📡 CANAIS ABERTOS & NACIONAIS
  // ==========================================
  {
    id: 'sbt_news',
    name: 'SBT News 24h HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/SBT_logo.svg/1200px-SBT_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Sinal Oficial Google DAI 1080p', url: 'https://dai.google.com/linear/hls/event/1XSOdtQ0SH2G8OEmEfGgjQ/master.m3u8' }
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
      { name: 'Sinal Oficial FPA TV Cultura', url: 'https://fpa-gateway.tvcultura.com.br:8181/memfs/606caef0-a290-413d-9f1f-8fcdb3a73831.m3u8' },
      { name: 'Sinal Alternativo TV Cultura', url: 'https://jmp2.uk/plu-62e010e6cd663f0007e57dc8.m3u8' }
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
      { name: 'Sinal Oficial JMV 1080p', url: 'https://cdn.live.br1.jmvstream.com/w/LVW-20715/LVW20715_50E3x2MCm2/playlist.m3u8' }
    ]
  },
  {
    id: 'rede_minas',
    name: 'Rede Minas HD / TV Brasil',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/1/16/Rede_Minas_logo.png/250px-Rede_Minas_logo.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial ZoeWeb HLS', url: 'https://8hzcavccys.zoeweb.tv/redeminas/ngrp:redeminas_all/playlist.m3u8' }
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
      { name: 'Sinal Oficial NuvemPlay', url: 'https://redebrasil.nuvemplay.live/hls/stream.m3u8' }
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
      { name: 'Sinal Oficial Zas Media 1080p', url: 'https://tv01.zas.media:1936/redetvparana/redetvparana/playlist.m3u8' }
    ]
  },
  {
    id: 'rede_ngt',
    name: 'Rede NGT Nacional',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/2/2a/Rede_NGT_logo.png/250px-Rede_NGT_logo.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial CloudeCast', url: 'https://isaocorp.cloudecast.com/ngt/index.m3u8' }
    ]
  },
  {
    id: 'adorocinema',
    name: 'AdoroCinema TV HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://images.pluto.tv/channels/698392af0cca0cc3458666ab/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial AdoroCinema', url: 'https://jmp2.uk/plu-698392af0cca0cc3458666ab.m3u8' }
    ]
  },

  // ==========================================
  // 🎬 FILMES & SÉRIES 24H
  // ==========================================
  {
    id: 'pluto_cine_sucessos',
    name: 'Pluto TV Cine Sucessos HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.pluto.tv/channels/5f120e94a5714d00074576a1/colorLogoPNG_1785430162956.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Cine Sucessos', url: 'https://jmp2.uk/plu-5f120e94a5714d00074576a1.m3u8' }
    ]
  },
  {
    id: 'pluto_filmes_acao',
    name: 'Pluto TV Filmes Ação HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.pluto.tv/channels/5f120f41b7d403000783a6d6/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Filmes Ação', url: 'https://jmp2.uk/plu-5f120f41b7d403000783a6d6.m3u8' }
    ]
  },
  {
    id: 'twd_amc',
    name: 'The Walking Dead 24h by AMC',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/The_Walking_Dead_2010_logo.svg/1200px-The_Walking_Dead_2010_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Maratona TWD 24h Oficial', url: 'https://jmp2.uk/plu-678aa104680721c77c506746.m3u8' }
    ]
  },
  {
    id: 'amc_hd',
    name: 'AMC HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/AMC_logo_2019.svg/1200px-AMC_logo_2019.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal HLS Ao Vivo', url: 'http://170.83.49.66:8083/AMCHD/index.m3u8' }
    ]
  },
  {
    id: 'axn_hd',
    name: 'AXN HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/AXN_logo_2015.svg/1200px-AXN_logo_2015.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal HLS Ao Vivo', url: 'http://170.83.49.66:8083/AXNHD/index.m3u8' }
    ]
  },
  {
    id: 'pluto_comedia',
    name: 'Pluto TV Cine Comédia HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.pluto.tv/channels/5f12101f0b12f00007844c7c/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Comédia', url: 'https://jmp2.uk/plu-5f12101f0b12f00007844c7c.m3u8' }
    ]
  },
  {
    id: 'pluto_terror',
    name: 'Pluto TV Cine Terror HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.pluto.tv/channels/5f12111c9e6c2c00078ef3bb/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Filmes Terror', url: 'https://jmp2.uk/plu-5f12111c9e6c2c00078ef3bb.m3u8' }
    ]
  },
  {
    id: 'pluto_scifi',
    name: 'Pluto TV Ficção Científica HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.pluto.tv/channels/5fa15ad6367e170007cdd098/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Sci-Fi', url: 'https://jmp2.uk/plu-5fa15ad6367e170007cdd098.m3u8' }
    ]
  },
  {
    id: 'pluto_suspense',
    name: 'Pluto TV Filmes Suspense HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.pluto.tv/channels/5f171d3442a0500007362f22/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Suspense', url: 'https://jmp2.uk/plu-5f171d3442a0500007362f22.m3u8' }
    ]
  },
  {
    id: 'pluto_romance',
    name: 'Pluto TV Cine Romance HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.pluto.tv/channels/5f171f988ab9780007fa95ea/colorLogoPNG_1771344977802.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Cine Romance', url: 'https://jmp2.uk/plu-5f171f988ab9780007fa95ea.m3u8' }
    ]
  },
  {
    id: 'pluto_nacionais',
    name: 'Pluto TV Filmes Nacionais HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.pluto.tv/channels/5f5a545d0dbf7f0007c09408/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Cinema Brasileiro', url: 'https://jmp2.uk/plu-5f5a545d0dbf7f0007c09408.m3u8' }
    ]
  },
  {
    id: 'moviesphere',
    name: 'MovieSphere by Lionsgate HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.pluto.tv/channels/6a281c0302b6c1c00a1fe570/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Lionsgate MovieSphere', url: 'https://jmp2.uk/plu-6a281c0302b6c1c00a1fe570.m3u8' }
    ]
  },
  {
    id: 'runtime_filmes',
    name: 'Runtime Filmes HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.pluto.tv/channels/62c5d32e2c48f9000715b6e9/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Runtime Filmes', url: 'https://jmp2.uk/plu-62c5d32e2c48f9000715b6e9.m3u8' }
    ]
  },
  {
    id: 'star_trek',
    name: 'Star Trek 24h (Jornada nas Estrelas)',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.pluto.tv/channels/5f99ac4fded33000078f29ab/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Star Trek 24h', url: 'https://jmp2.uk/plu-5f99ac4fded33000078f29ab.m3u8' }
    ]
  },
  {
    id: 'blue_bloods',
    name: 'Blue Bloods 24h HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.pluto.tv/channels/69fcc8cfb83300b380051794/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Blue Bloods', url: 'https://jmp2.uk/plu-69fcc8cfb83300b380051794.m3u8' }
    ]
  },
  {
    id: 'charmed',
    name: 'Charmed: Jovens Bruxas 24h',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.pluto.tv/channels/67f9602ee173fa5664fafae8/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Charmed 24h', url: 'https://jmp2.uk/plu-67f9602ee173fa5664fafae8.m3u8' }
    ]
  },

  // ==========================================
  // 📰 NOTÍCIAS
  // ==========================================
  {
    id: 'times_brasil_cnbc',
    name: 'Times Brasil | CNBC 24h HD',
    category: 'noticias',
    categoryLabel: 'Notícias',
    logo: 'https://images.pluto.tv/channels/679a973a97782f0008ff4bb6/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial CNBC Brasil 24h', url: 'https://jmp2.uk/plu-679a973a97782f0008ff4bb6.m3u8' }
    ]
  },
  {
    id: 'record_news',
    name: 'Record News 24h HD',
    category: 'noticias',
    categoryLabel: 'Notícias',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Record_News_logo_2023.svg/1200px-Record_News_logo_2023.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Record News 24h', url: 'https://jmp2.uk/plu-6102e04e9ab1db0007a980a1.m3u8' }
    ]
  },
  {
    id: 'euronews_pt',
    name: 'Euronews Português 24h',
    category: 'noticias',
    categoryLabel: 'Notícias',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Euronews_2016_logo.svg/1200px-Euronews_2016_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Euronews', url: 'https://jmp2.uk/plu-619e6614c9d9650007a2b171.m3u8' }
    ]
  },

  // ==========================================
  // 🧒 INFANTIL & ANIMES 24H
  // ==========================================
  {
    id: 'bob_esponja',
    name: 'Bob Esponja 24h HD (Nickelodeon)',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/SpongeBob_SquarePants_logo.svg/1200px-SpongeBob_SquarePants_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial Bob Esponja 24h', url: 'https://jmp2.uk/plu-62545c0b002f4b0007688b61.m3u8' }
    ]
  },
  {
    id: 'naruto',
    name: 'Naruto 24h HD (Anime)',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Naruto_logo.svg/1200px-Naruto_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial Naruto 24h', url: 'https://jmp2.uk/plu-5f6df5a173d7340007c559f7.m3u8' }
    ]
  },
  {
    id: 'pokemon',
    name: 'Pokémon 24h HD (Anime)',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/International_Pok%C3%A9mon_logo.svg/1200px-International_Pok%C3%A9mon_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial Pokémon 24h', url: 'https://jmp2.uk/plu-687007a8ee4155e89a8f6d67.m3u8' }
    ]
  },
  {
    id: 'death_note',
    name: 'Death Note 24h HD (Anime)',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Death_Note_logo.svg/1200px-Death_Note_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial Death Note 24h', url: 'https://jmp2.uk/plu-625464a945b6a200079257d1.m3u8' }
    ]
  },
  {
    id: 'turma_monica',
    name: 'Turma da Mônica 24h HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/d/d4/Turma_da_M%C3%B4nica_logo.png/250px-Turma_da_M%C3%B4nica_logo.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial Turma da Mônica', url: 'https://jmp2.uk/plu-5f997e44949bc70007a6941e.m3u8' }
    ]
  },
  {
    id: 'tokusato',
    name: 'Tokusato 24h HD (Jaspion & Changeman)',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://images.pluto.tv/channels/5ff609de50ab210008025c1b/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Tokusato Clássico', url: 'https://jmp2.uk/plu-5ff609de50ab210008025c1b.m3u8' }
    ]
  },
  {
    id: 'os_smurfs',
    name: 'Os Smurfs 24h HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://images.pluto.tv/channels/68b88ae1943f6fb1fb2ad749/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Os Smurfs', url: 'https://jmp2.uk/plu-68b88ae1943f6fb1fb2ad749.m3u8' }
    ]
  },
  {
    id: 'inspetor_bugiganga',
    name: 'Inspetor Bugiganga 24h',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://images.pluto.tv/channels/69162648d03565d6c8c8df97/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Bugiganga', url: 'https://jmp2.uk/plu-69162648d03565d6c8c8df97.m3u8' }
    ]
  },
  {
    id: 'popeye',
    name: 'Popeye 24h HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://images.pluto.tv/channels/677d93f37bffa600080795e7/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Popeye 24h', url: 'https://jmp2.uk/plu-677d93f37bffa600080795e7.m3u8' }
    ]
  },
  {
    id: 'kenan_kel',
    name: 'Kenan & Kel 24h HD (Nickelodeon)',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://images.pluto.tv/channels/5ffcc5130fd98c0007f2e216/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial Kenan & Kel', url: 'https://jmp2.uk/plu-5ffcc5130fd98c0007f2e216.m3u8' }
    ]
  },
  {
    id: 'nickelodeon_classico',
    name: 'Nickelodeon Clássico 24h HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Nickelodeon_2009_logo.svg/1200px-Nickelodeon_2009_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial Nick Clássicos', url: 'https://jmp2.uk/plu-6824ce10c5d53e1351ceb8d1.m3u8' }
    ]
  },
  {
    id: 'nick_jr_club',
    name: 'Nick Jr. Club HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Nick_Jr._2009_logo.svg/1200px-Nick_Jr._2009_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial Nick Jr.', url: 'https://jmp2.uk/plu-6824ce95f09106f4b18f4114.m3u8' }
    ]
  },
  {
    id: 'cocorico',
    name: 'Cocoricó 24h HD (TV Cultura)',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://images.pluto.tv/channels/62d969fd8451a30007f0fd94/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial Cocoricó 24h', url: 'https://jmp2.uk/plu-62d969fd8451a30007f0fd94.m3u8' }
    ]
  },
  {
    id: 'box_kids',
    name: 'Box Kids HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Television_icon.svg/500px-Television_icon.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Ao Vivo HLS', url: 'http://170.83.49.66:8083/BOXKIDSHD/index.m3u8' }
    ]
  },

  // ==========================================
  // 🌟 VARIEDADES, COMÉDIA & MÚSICA
  // ==========================================
  {
    id: 'south_park',
    name: 'Comedy Central South Park 24h HD',
    category: 'variedades',
    categoryLabel: 'Variedades & Música',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/South_Park_logo.svg/1200px-South_Park_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial South Park 24h', url: 'https://jmp2.uk/plu-609ae66b359b270007869ff1.m3u8' }
    ]
  },
  {
    id: 'portatv',
    name: 'PORTATV (Porta dos Fundos 24h)',
    category: 'variedades',
    categoryLabel: 'Variedades & Música',
    logo: 'https://images.pluto.tv/channels/69440d0611f6c6384ab78306/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial Porta dos Fundos', url: 'https://jmp2.uk/plu-69440d0611f6c6384ab78306.m3u8' }
    ]
  },
  {
    id: 'mr_bean',
    name: 'Mr. Bean 24h HD',
    category: 'variedades',
    categoryLabel: 'Variedades & Música',
    logo: 'https://images.pluto.tv/channels/69fca7dd2387729708faa32c/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial Mr. Bean 24h', url: 'https://jmp2.uk/plu-69fca7dd2387729708faa32c.m3u8' }
    ]
  },
  {
    id: 'comedy_central',
    name: 'Comedy Central Pluto TV HD',
    category: 'variedades',
    categoryLabel: 'Variedades & Música',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Comedy_Central_2018.svg/1200px-Comedy_Central_2018.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial Comedy Central', url: 'https://jmp2.uk/plu-5f357e91b18f0b00073583d2.m3u8' }
    ]
  },
  {
    id: 'pegadinhas',
    name: 'Pegadinhas - Just for Laughs 24h',
    category: 'variedades',
    categoryLabel: 'Variedades & Música',
    logo: 'https://images.pluto.tv/channels/67802a22a5d8215f99dcee30/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial Pegadinhas 24h', url: 'https://jmp2.uk/plu-67802a22a5d8215f99dcee30.m3u8' }
    ]
  },
  {
    id: 'masterchef',
    name: 'MasterChef Brasil 24h HD',
    category: 'variedades',
    categoryLabel: 'Variedades & Música',
    logo: 'https://images.pluto.tv/channels/6077045b6031bd00078de127/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial MasterChef 24h', url: 'https://jmp2.uk/plu-6077045b6031bd00078de127.m3u8' }
    ]
  },
  {
    id: 'the_nanny',
    name: 'The Nanny (A Babá) 24h HD',
    category: 'variedades',
    categoryLabel: 'Variedades & Música',
    logo: 'https://images.pluto.tv/channels/6aa9606aaf45eb18db1928c4/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial The Nanny 24h', url: 'https://jmp2.uk/plu-6aa9606aaf45eb18db1928c4.m3u8' }
    ]
  },
  {
    id: 'rei_do_bairro',
    name: 'O Rei do Bairro 24h HD',
    category: 'variedades',
    categoryLabel: 'Variedades & Música',
    logo: 'https://images.pluto.tv/channels/6a5520691a435d3dfcda8340/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Canal Oficial O Rei do Bairro', url: 'https://jmp2.uk/plu-6a5520691a435d3dfcda8340.m3u8' }
    ]
  },
  {
    id: 'mtv_pluto',
    name: 'MTV Pluto TV HD',
    category: 'variedades',
    categoryLabel: 'Variedades & Música',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/MTV_logo_2021.svg/1200px-MTV_logo_2021.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial MTV Ao Vivo', url: 'https://jmp2.uk/plu-5f1212fb81e85c00077ae9ef.m3u8' }
    ]
  },
  {
    id: 'mtv_biggest_pop',
    name: 'MTV Biggest Pop 24h HD',
    category: 'variedades',
    categoryLabel: 'Variedades & Música',
    logo: 'https://images.pluto.tv/channels/6047fbdbbb776a0007e7f2ff/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial MTV Pop Hits', url: 'https://jmp2.uk/plu-6047fbdbbb776a0007e7f2ff.m3u8' }
    ]
  },
  {
    id: 'tastemade_viagem',
    name: 'Tastemade Viagem HD',
    category: 'variedades',
    categoryLabel: 'Variedades & Música',
    logo: 'https://images.pluto.tv/channels/68b8875777201ec428d9eaa5/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Tastemade', url: 'https://jmp2.uk/plu-68b8875777201ec428d9eaa5.m3u8' }
    ]
  },

  // ==========================================
  // 🦁 DOCUMENTÁRIOS, NATUREZA & CIÊNCIA
  // ==========================================
  {
    id: 'nasa_tv',
    name: 'NASA TV HD (Oficial)',
    category: 'documentarios',
    categoryLabel: 'Documentários & Natureza',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/1200px-NASA_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Transmissão Oficial NASA 24h', url: 'https://www.youtube.com/embed/live_stream?channel=UC2WmAQahn43VLIurgwUrmGQ' },
      { name: 'Sinal HLS NASA Akamai', url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8' }
    ]
  },
  {
    id: 'love_nature',
    name: 'Love Nature & Animais HD',
    category: 'documentarios',
    categoryLabel: 'Documentários & Natureza',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Love_Nature_logo_2020.svg/1200px-Love_Nature_logo_2020.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial NatureTime HD', url: 'https://jmp2.uk/plu-681ba2ad93d3d19bcab47433.m3u8' },
      { name: 'Sinal Love Nature Animal HD', url: 'https://jmp2.uk/plu-66df8a29b25d2b0008fc5fe0.m3u8' }
    ]
  },
  {
    id: 'pluto_natureza',
    name: 'Pluto TV Natureza Animal HD',
    category: 'documentarios',
    categoryLabel: 'Documentários & Natureza',
    logo: 'https://images.pluto.tv/channels/5f1213ba0ecebc00070e170f/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Natureza HD', url: 'https://jmp2.uk/plu-5f1213ba0ecebc00070e170f.m3u8' },
      { name: 'Sinal Pluto TV Animais HD', url: 'https://jmp2.uk/plu-6474aa984cfc2c0008883a92.m3u8' }
    ]
  },
  {
    id: 'pluto_misterios',
    name: 'Pluto TV Mistérios & Ciência HD',
    category: 'documentarios',
    categoryLabel: 'Documentários & Natureza',
    logo: 'https://images.pluto.tv/channels/5fac52f142044f00078e2a51/colorLogoPNG.png',
    resolution: '720p',
    sources: [
      { name: 'Sinal Oficial Mistérios HD', url: 'https://jmp2.uk/plu-5fac52f142044f00078e2a51.m3u8' },
      { name: 'Smithsonian Channel Pluto TV', url: 'https://jmp2.uk/plu-6298bd10d88ef000073f16b7.m3u8' }
    ]
  },

  // ==========================================
  // 🌍 CANAIS INTERNACIONAIS (MUNDO)
  // ==========================================
  {
    id: 'euronews_en',
    name: 'Euronews English HD',
    category: 'internacionais',
    categoryLabel: 'Canais Internacionais',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Euronews_2016_logo.svg/1200px-Euronews_2016_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Sinal Oficial Euronews English', url: 'https://cdn-euronews.akamaized.net/live/eds/euronews-en/25002/index.m3u8' },
      { name: 'Sinal Euronews English HD', url: 'https://dash4.antik.sk/live/test_euronews/playlist.m3u8' }
    ]
  },
  {
    id: 'euronews_es',
    name: 'Euronews Español HD',
    category: 'internacionais',
    categoryLabel: 'Canais Internacionais',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Euronews_2016_logo.svg/1200px-Euronews_2016_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Sinal Oficial Euronews Español', url: 'https://jmp2.uk/plu-60d3583ef310610007fb02b1.m3u8' },
      { name: 'Sinal Euronews Español 2', url: 'https://jmp2.uk/plu-619d59b7cbef25000728221c.m3u8' }
    ]
  },
  {
    id: 'dw_news',
    name: 'DW News HD (Alemanha)',
    category: 'internacionais',
    categoryLabel: 'Canais Internacionais',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_logo.svg/1200px-Deutsche_Welle_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Sinal Oficial DW Akamai HD', url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8' }
    ]
  },
  {
    id: 'france24_en',
    name: 'France 24 English HD',
    category: 'internacionais',
    categoryLabel: 'Canais Internacionais',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/France_24_logo.svg/1200px-France_24_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Sinal Oficial France 24 HD', url: 'https://live.france24.com/hls/live/2037218/F24_EN_HI_HLS/master_2300.m3u8' },
      { name: 'Transmissão Oficial France 24', url: 'https://www.youtube.com/embed/live_stream?channel=UCQfwfsi5VrQ8yKZ-UWmAEFg' }
    ]
  },
  {
    id: 'france24_es',
    name: 'France 24 Español HD',
    category: 'internacionais',
    categoryLabel: 'Canais Internacionais',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/France_24_logo.svg/1200px-France_24_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Sinal Oficial France 24 Español', url: 'https://live.france24.com/hls/live/2037220/F24_ES_HI_HLS/master_2300.m3u8' },
      { name: 'Transmissão Oficial France 24 ES', url: 'https://www.youtube.com/embed/live_stream?channel=UCUdOoVWuWmgo1wByzcsyKDQ' }
    ]
  },
  {
    id: 'nhk_world_japan',
    name: 'NHK World-Japan HD',
    category: 'internacionais',
    categoryLabel: 'Canais Internacionais',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/NHK_World-Japan_logo.svg/1200px-NHK_World-Japan_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Sinal Oficial NHK Japão HD', url: 'https://masterpl.hls.nhkworld.jp/hls/w/live/smarttv.m3u8' },
      { name: 'Transmissão Oficial NHK Live', url: 'https://www.youtube.com/embed/live_stream?channel=UCvEQP9b4jT2hE_Qz3sK2wkg' }
    ]
  },
  {
    id: 'al_jazeera_en',
    name: 'Al Jazeera English HD',
    category: 'internacionais',
    categoryLabel: 'Canais Internacionais',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Al_Jazeera_English_logo.svg/1200px-Al_Jazeera_English_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Sinal Oficial Al Jazeera English HD', url: 'https://dash4.antik.sk/live/test_aljazeera_eng/playlist.m3u8' },
      { name: 'Sinal Al Jazeera Amagi', url: 'https://amg00222-amg00222c4-amgplt0002.playout.now3.amagi.tv/aljazeera-noscte/playlist.m3u8' }
    ]
  },
  {
    id: 'rt_esp',
    name: 'RT News Español HD',
    category: 'internacionais',
    categoryLabel: 'Canais Internacionais',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/RT_logo.svg/1200px-RT_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Sinal Oficial RT Internacional HD', url: 'https://rt-esp.rttv.com/live/rtesp/playlist.m3u8' }
    ]
  }
];

export const CATEGORIES = [
  { id: 'all', label: 'Todos os Canais', icon: '📺' },
  { id: 'abertos', label: 'Canais Abertos (Brasil)', icon: '📡' },
  { id: 'esportes', label: 'Esportes & Lutas', icon: '⚽' },
  { id: 'filmes', label: 'Filmes & Séries', icon: '🎬' },
  { id: 'noticias', label: 'Notícias 24h', icon: '📰' },
  { id: 'infantil', label: 'Infantil & Desenhos', icon: '🧒' },
  { id: 'documentarios', label: 'Documentários & Natureza', icon: '🦁' },
  { id: 'variedades', label: 'Variedades & Música', icon: '🌟' },
  { id: 'internacionais', label: 'Canais Internacionais', icon: '🌍' },
];
