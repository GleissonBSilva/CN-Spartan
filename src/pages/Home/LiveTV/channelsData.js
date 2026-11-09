// Lista completa e verificada de canais ao vivo (HLS H.264 Universal + Web Embeds sem CORS)
export const CHANNELS = [
  // ==========================================
  // ⚽ ESPORTES & LUTAS (Premiere, SporTV, ESPN, Combate, FIFA+)
  // ==========================================
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
    id: 'premiere_clubes',
    name: 'Premiere Clubes HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=premiere1' },
      { name: 'Servidor 2 (Alternativo)', url: 'https://embedsports.me/premiere-clubes-stream-1' }
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
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=premiere2' }
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
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=premiere3' }
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
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=premiere4' }
    ]
  },
  {
    id: 'premiere_5',
    name: 'Premiere 5 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=premiere5' }
    ]
  },
  {
    id: 'premiere_6',
    name: 'Premiere 6 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=premiere6' }
    ]
  },
  {
    id: 'premiere_7',
    name: 'Premiere 7 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=premiere7' }
    ]
  },
  {
    id: 'premiere_8',
    name: 'Premiere 8 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=premiere8' }
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
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=sportv1' }
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
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=sportv2' }
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
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=sportv3' }
    ]
  },
  {
    id: 'espn_brasil',
    name: 'ESPN Brasil HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/ESPN_logo.svg/1200px-ESPN_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=espn' }
    ]
  },
  {
    id: 'espn_2',
    name: 'ESPN 2 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/ESPN_logo.svg/1200px-ESPN_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=espn2' }
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
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=espn4' }
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
      { name: 'Servidor 1 (Web Player Lutas)', url: 'https://multiembed.mov/?live=combate' }
    ]
  },
  {
    id: 'caze_tv',
    name: 'CazéTV Ao Vivo',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/47/1/cazetv-logo-png_seeklogo-476776.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Embed)', url: 'https://multiembed.mov/?live=cazetv' }
    ]
  },
  {
    id: 'redbull_tv',
    name: 'Red Bull TV Radicais',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_TV_logo.svg/1200px-Red_Bull_TV_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player)', url: 'https://multiembed.mov/?live=redbulltv' }
    ]
  },

  // ==========================================
  // 📡 CANAIS ABERTOS (Cultura, SBT News, Globo, Record, Band, Regionais)
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
    id: 'globo_sp',
    name: 'TV Globo SP HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/TV_Globo_logo_2021.svg/1200px-TV_Globo_logo_2021.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=globo_sp' }
    ]
  },
  {
    id: 'globo_rj',
    name: 'TV Globo RJ HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/TV_Globo_logo_2021.svg/1200px-TV_Globo_logo_2021.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=globo_rj' }
    ]
  },
  {
    id: 'sbt_nacional',
    name: 'SBT Nacional HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/SBT_logo.svg/1200px-SBT_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=sbt' }
    ]
  },
  {
    id: 'record_tv',
    name: 'Record TV HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Record_logo_2023.svg/1200px-Record_logo_2023.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=record' }
    ]
  },
  {
    id: 'band_tv',
    name: 'Band TV HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Band_logo_2018.svg/1200px-Band_logo_2018.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=band' }
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
  // 🎬 FILMES & SÉRIES (Telecine, HBO, Sony, Warner, AXN, Comédia)
  // ==========================================
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
  {
    id: 'mytime_movie',
    name: 'MyTime Movie Network',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: '',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Filmes e Séries 24h)', url: 'https://appletree-mytime-samsungbrazil.amagi.tv/playlist.m3u8' }
    ]
  },
  {
    id: 'telecine_premium',
    name: 'Telecine Premium HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.seeklogo.com/logo-png/43/1/telecine-premium-logo-png_seeklogo-430939.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=telecine_premium' }
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
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=telecine_action' }
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
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=telecine_fun' }
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
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=telecine_pipoca' }
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
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=telecine_cult' }
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
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=hbo' }
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
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=warner' }
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
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=sony' }
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
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=universal' }
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
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=axn' }
    ]
  },
  {
    id: 'paramount_net',
    name: 'Paramount Network HD',
    category: 'filmes',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Paramount_Network_2020.svg/1200px-Paramount_Network_2020.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=paramount' }
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
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=megapix' }
    ]
  },

  // ==========================================
  // 📰 NOTÍCIAS (SBT News, Veja+, Times Brasil, CNN, GloboNews)
  // ==========================================
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
  {
    id: 'j3news',
    name: 'J3News TV Ao Vivo',
    category: 'noticias',
    categoryLabel: 'Notícias & Jornalismo',
    logo: '',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Oficial HLS)', url: 'https://video01.brascast.com/d92ebb4f/d92ebb4f/playlist.m3u8' }
    ]
  },
  {
    id: 'canal_metropolitano',
    name: 'Canal Metropolitano Notícias',
    category: 'noticias',
    categoryLabel: 'Notícias & Jornalismo',
    logo: '',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Oficial HLS)', url: 'https://stmv5.samcast.com.br/claudio8701/claudio8701/playlist.m3u8' }
    ]
  },
  {
    id: 'tv_brics',
    name: 'TV BRICS Brasil',
    category: 'noticias',
    categoryLabel: 'Notícias & Jornalismo',
    logo: '',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Oficial HLS)', url: 'https://porbrics.mediacdn.ru/cdn/brics/portuguese/playlist.m3u8' }
    ]
  },
  {
    id: 'cnn_brasil',
    name: 'CNN Brasil Ao Vivo',
    category: 'noticias',
    categoryLabel: 'Notícias & Jornalismo',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/CNN_Brasil_logo.svg/1200px-CNN_Brasil_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=cnn_brasil' }
    ]
  },
  {
    id: 'globonews_hd',
    name: 'GloboNews HD',
    category: 'noticias',
    categoryLabel: 'Notícias & Jornalismo',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/GloboNews_logo_2022.svg/1200px-GloboNews_logo_2022.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=globonews' }
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
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=bandnews' }
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
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=jovempan' }
    ]
  },

  // ==========================================
  // 🧒 INFANTIL (Nickelodeon, Desenhos Retrô, NickOnline)
  // ==========================================
  {
    id: 'nickelodeon_br',
    name: 'Nickelodeon HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Nickelodeon_2023.svg/1200px-Nickelodeon_2023.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Transmissão Direta H.264)', url: 'https://stmv2.srvif.com/nicktoons/nicktoons/playlist.m3u8' },
      { name: 'Servidor 2 (Web Player)', url: 'https://multiembed.mov/?live=nickelodeon' }
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
  {
    id: 'nick_online_hd',
    name: 'Nick Online HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Nickelodeon_2023.svg/1200px-Nickelodeon_2023.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Oficial HLS)', url: 'https://x1colegal.com/hls/stream.m3u8' }
    ]
  },
  {
    id: 'gospel_cartoon',
    name: 'Gospel Cartoon Kids',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: '',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Oficial HLS)', url: 'https://stmv1.srvif.com/gospelcartoon/gospelcartoon/playlist.m3u8' }
    ]
  },
  {
    id: 'cartoon_network',
    name: 'Cartoon Network HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Cartoon_Network_2010_logo.svg/1200px-Cartoon_Network_2010_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=cartoon' }
    ]
  },
  {
    id: 'discovery_kids',
    name: 'Discovery Kids HD',
    category: 'infantil',
    categoryLabel: 'Infantil & Desenhos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Discovery_Kids_2016_logo.svg/1200px-Discovery_Kids_2016_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=discovery_kids' }
    ]
  },

  // ==========================================
  // 🌟 MÚSICA, GAMES & DOCUMENTÁRIOS (Trace, Loading, Rock, Discovery)
  // ==========================================
  {
    id: 'trace_brazuca',
    name: 'Trace Brazuca HD (Música)',
    category: 'variedades',
    categoryLabel: 'Música & Variedades',
    logo: '',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Oficial Samsung TV Plus HLS)', url: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01131-tracetv-tracebrazuca-samsungbr/playlist.m3u8' }
    ]
  },
  {
    id: 'loading_tv',
    name: 'Loading TV (Animes & Games)',
    category: 'variedades',
    categoryLabel: 'Música & Variedades',
    logo: '',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Oficial HLS)', url: 'https://stmv1.srvif.com/loadingtv/loadingtv/playlist.m3u8' }
    ]
  },
  {
    id: 'lamore_rock',
    name: 'Lamore Rock Show WebTV',
    category: 'variedades',
    categoryLabel: 'Música & Variedades',
    logo: '',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Rock 24h HLS)', url: 'https://a.cdni.live/rodrigo2364/rodrigo2364/playlist.m3u8' }
    ]
  },
  {
    id: 'petlovers_tv',
    name: 'Petlovers TV',
    category: 'variedades',
    categoryLabel: 'Música & Variedades',
    logo: '',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Oficial HLS)', url: 'https://video04.logicahost.com.br/petloverstv/petloverstv/playlist.m3u8' }
    ]
  },
  {
    id: 'discovery_channel',
    name: 'Discovery Channel HD',
    category: 'variedades',
    categoryLabel: 'Música & Variedades',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Discovery_Channel_2019.svg/1200px-Discovery_Channel_2019.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=discovery' }
    ]
  },
  {
    id: 'history_channel',
    name: 'History Channel HD',
    category: 'variedades',
    categoryLabel: 'Música & Variedades',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/History_Logo.svg/1200px-History_Logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=history' }
    ]
  },
  {
    id: 'national_geographic',
    name: 'National Geographic HD',
    category: 'variedades',
    categoryLabel: 'Música & Variedades',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/National_Geographic_logo.svg/1200px-National_Geographic_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Player Ao Vivo)', url: 'https://multiembed.mov/?live=natgeo' }
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
