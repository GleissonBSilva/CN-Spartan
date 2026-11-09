// Lista completa e verificada de canais ao vivo (HTTPS e com suporte a CORS para navegadores)
export const CHANNELS = [
  // ==========================================
  // ⚽ ESPORTES & LUTAS (Premiere, CazéTV, ESPN, FIFA+, etc.)
  // ==========================================
  {
    id: 'caze_tv',
    name: 'CazéTV HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/47/1/cazetv-logo-png_seeklogo-476776.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Oficial 1080p)', url: 'https://d25usgadhphvwi.cloudfront.net/hls/main.m3u8' },
      { name: 'Servidor 2 (YouTube Stream)', url: 'https://www.youtube.com/embed/live_stream?channel=UCj8kT_r_z_23u6x-jUv1wfw' }
    ]
  },
  {
    id: 'fifa_plus',
    name: 'FIFA+ Futebol Brasil',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/FIFA_logo_without_slogan.svg/1200px-FIFA_logo_without_slogan.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Transmissão Oficial)', url: 'https://e3be9ac5.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctYnJfRklGQVBsdXNQb3J0dWd1ZXNlX0hMUw/playlist.m3u8' }
    ]
  },
  {
    id: 'redbull_tv',
    name: 'Red Bull TV Esportes Radicais',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_TV_logo.svg/1200px-Red_Bull_TV_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Velocidade & Radicais)', url: 'https://d03ae6b5c6724c24867e97a3dc04934a.mediatailor.us-west-2.amazonaws.com/v1/master/ba62fe743df0fe93366eba3a257d792884136c7f/LINEAR-1026-WORBBRPTFAST-WHALETVPLUS/1026/hls/master/playlist.m3u8' }
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
      { name: 'Servidor 1 (Web Embed Ao Vivo)', url: 'https://multiembed.mov/?live=premiere1' },
      { name: 'Servidor 2 (HLS Alternativo)', url: 'https://cr7v.short.gy/Canal4/index.m3u8' }
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
      { name: 'Servidor 1 (Web Embed)', url: 'https://multiembed.mov/?live=premiere2' }
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
      { name: 'Servidor 1 (Web Embed)', url: 'https://multiembed.mov/?live=premiere3' }
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
      { name: 'Servidor 1 (Web Embed)', url: 'https://multiembed.mov/?live=premiere4' }
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
      { name: 'Servidor 1 (Web Embed)', url: 'https://multiembed.mov/?live=premiere5' }
    ]
  },
  {
    id: 'sportv_hd',
    name: 'SporTV HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/SporTV_logo_2021.svg/1200px-SporTV_logo_2021.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Embed)', url: 'https://multiembed.mov/?live=sportv' }
    ]
  },
  {
    id: 'espn_brasil',
    name: 'ESPN Brasil HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Web Embed)', url: 'https://multiembed.mov/?live=espn' }
    ]
  },
  {
    id: 'combate_ufc',
    name: 'Combate HD (UFC & Lutas)',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/33/2/combate-logo-png_seeklogo-330553.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Lutas & Boxe)', url: 'https://multiembed.mov/?live=combate' }
    ]
  },

  // ==========================================
  // 🎬 FILMES & SÉRIES (Telecine, Sony, Universal, AMC, etc.)
  // ==========================================
  {
    id: 'telecine_premium',
    name: 'Telecine Premium HD',
    category: 'filmes_series',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Telecine_Premium_logo_2021.svg/1200px-Telecine_Premium_logo_2021.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Estreias)', url: 'https://awtv.nuvemplay.live/hls/stream.m3u8' }
    ]
  },
  {
    id: 'telecine_action',
    name: 'Telecine Action HD',
    category: 'filmes_series',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Telecine_Action_logo_2021.svg/1200px-Telecine_Action_logo_2021.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Ação & Suspense)', url: 'https://stream.ichibansys.com:3230/hybrid/play.m3u8' }
    ]
  },
  {
    id: 'mytime_movie',
    name: 'MyTime Movie Network HD',
    category: 'filmes_series',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.seeklogo.com/logo-png/42/1/mytime-logo-png_seeklogo-420000.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Cinema Mundial)', url: 'https://appletree-mytime-samsungbrazil.amagi.tv/playlist.m3u8' }
    ]
  },
  {
    id: 'classique_tv',
    name: 'Classique TV (Cinema Clássico)',
    category: 'filmes_series',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://stmv1.srvif.com/classique/classique/logo.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Clássicos de Ouro)', url: 'https://stmv1.srvif.com/classique/classique/playlist.m3u8' }
    ]
  },
  {
    id: 'tv_series_24h',
    name: 'TV Séries 24 Horas',
    category: 'filmes_series',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.seeklogo.com/logo-png/38/1/pluto-tv-logo-png_seeklogo-384351.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Maratona de Séries)', url: 'https://stmv1.srvif.com/tvserie/tvserie/playlist.m3u8' }
    ]
  },
  {
    id: 'comedy_central',
    name: 'Comedy Central Brasil',
    category: 'filmes_series',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Comedy_Central_2018.svg/1200px-Comedy_Central_2018.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Humor & Stand-up)', url: 'https://stmv2.srvif.com/gafeab/gafeab/playlist.m3u8' }
    ]
  },

  // ==========================================
  // 📡 CANAIS ABERTOS NACIONAIS
  // ==========================================
  {
    id: 'globo_hd',
    name: 'Rede Globo HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Rede_Globo_logo_2021.svg/1200px-Rede_Globo_logo_2021.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Afiliada TV Fronteira)', url: 'https://tvfronteira.brasilstream.com.br/hls/tvfronteira/index.m3u8' },
      { name: 'Servidor 2 (Web Stream)', url: 'https://multiembed.mov/?live=globo' }
    ]
  },
  {
    id: 'sbt_news',
    name: 'SBT News 24 Horas',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/SBT_logo.svg/1200px-SBT_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor Oficial (Google DAI)', url: 'https://dai.google.com/linear/hls/event/1XSOdtQ0SH2G8OEmEfGgjQ/master.m3u8' }
    ]
  },
  {
    id: 'sbt_interior',
    name: 'SBT Regional HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/SBT_logo.svg/1200px-SBT_logo.svg.png',
    resolution: '818p',
    sources: [
      { name: 'Servidor 1 (SBT Stream)', url: 'https://video09.logicahost.com.br/sbtmutum/sbtmutum/playlist.m3u8' }
    ]
  },
  {
    id: 'tv_cultura',
    name: 'TV Cultura Fast HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/TV_Cultura_logo_2019.svg/1200px-TV_Cultura_logo_2019.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor Oficial (FPA Gateway)', url: 'https://fpa-gateway.tvcultura.com.br:8181/memfs/606caef0-a290-413d-9f1f-8fcdb3a73831.m3u8' }
    ]
  },
  {
    id: 'rede_brasil',
    name: 'Rede Brasil de Televisão',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Rede_Brasil_de_Televis%C3%A3o_logo_2020.png/1200px-Rede_Brasil_de_Televis%C3%A3o_logo_2020.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (NuvemPlay HD)', url: 'https://redebrasil.nuvemplay.live/hls/stream.m3u8' }
    ]
  },
  {
    id: 'tv_a_critica',
    name: 'TV A Crítica HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/TV_A_Cr%C3%ADtica_logo_2020.png/1200px-TV_A_Cr%C3%ADtica_logo_2020.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (JMV Stream)', url: 'https://cdn.live.br1.jmvstream.com/w/LVW-20715/LVW20715_50E3x2MCm2/playlist.m3u8' }
    ]
  },
  {
    id: 'redetv_parana',
    name: 'RedeTV! HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/RedeTV%21_logo_2018.svg/1200px-RedeTV%21_logo_2018.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Zas Media)', url: 'https://tv01.zas.media:1936/redetvparana/redetvparana/playlist.m3u8' }
    ]
  },
  {
    id: 'com_brasil',
    name: 'COM Brasil HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://images.seeklogo.com/logo-png/38/1/pluto-tv-logo-png_seeklogo-384351.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (CloudFront)', url: 'https://dfr80qz435crc.cloudfront.net/EFGH/Amagi/NewCo/New_Brasil_BR/New_Brasil.m3u8' }
    ]
  },
  {
    id: 'tv_camara',
    name: 'TV Câmara Nacional',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/TV_C%C3%A2mara_logo_2019.svg/1200px-TV_C%C3%A2mara_logo_2019.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor Oficial (Governo)', url: 'https://stream3.camara.gov.br/tv1/manifest.m3u8' }
    ]
  },

  // ==========================================
  // 📰 NOTÍCIAS & INFORMAÇÃO
  // ==========================================
  {
    id: 'cnn_brasil',
    name: 'CNN Brasil HD',
    category: 'noticias',
    categoryLabel: 'Notícias',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN_Brasil_logo.svg/1200px-CNN_Brasil_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (CloudFront Oficial)', url: 'https://d25usgadhphvwi.cloudfront.net/hls/main.m3u8' }
    ]
  },
  {
    id: 'veja_plus',
    name: 'VEJA+ TV Notícias',
    category: 'noticias',
    categoryLabel: 'Notícias',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Veja_logo.svg/1200px-Veja_logo.svg.png',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Ottera Vision)', url: 'https://gpa-vja.otteravision.com/gpa/vja/vja.m3u8' }
    ]
  },
  {
    id: 'times_brasil',
    name: 'Times Brasil CNBC',
    category: 'noticias',
    categoryLabel: 'Notícias',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/CNBC_logo.svg/1200px-CNBC_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Leiniao HLS)', url: 'https://ssai2-ads.api.leiniao.com/global-adinsertion-api/hls/live/v2/21fdb6dd7491406bba86497a24390a25/playlist.m3u8' }
    ]
  },
  {
    id: 'j3news',
    name: 'J3News TV 24h',
    category: 'noticias',
    categoryLabel: 'Notícias',
    logo: 'https://video01.brascast.com/favicon.ico',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (BrasCast News)', url: 'https://video01.brascast.com/d92ebb4f/d92ebb4f/playlist.m3u8' }
    ]
  },

  // ==========================================
  // 🧒 INFANTIL & DESENHOS
  // ==========================================
  {
    id: 'nickelodeon_br',
    name: 'Nickelodeon Toons Brasil',
    category: 'infantil',
    categoryLabel: 'Infantil',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Nickelodeon_2009_logo.svg/1200px-Nickelodeon_2009_logo.svg.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Desenhos & Animações)', url: 'https://stmv2.srvif.com/nicktoons/nicktoons/playlist.m3u8' }
    ]
  },
  {
    id: 'retro_cartoon',
    name: 'Retro Cartoon Clássicos',
    category: 'infantil',
    categoryLabel: 'Infantil',
    logo: 'https://images.seeklogo.com/logo-png/38/1/pluto-tv-logo-png_seeklogo-384351.png',
    resolution: '720p',
    sources: [
      { name: 'Servidor 1 (Desenhos Retrô)', url: 'https://stmv1.video.brstream.com.br/retrotv/retrotv/chunklist_w1069200121.m3u8' }
    ]
  },
  {
    id: 'kuriakos_kids',
    name: 'Kuriakos Kids TV',
    category: 'infantil',
    categoryLabel: 'Infantil',
    logo: 'https://w2.manasat.com/favicon.ico',
    resolution: '1080p',
    sources: [
      { name: 'Servidor 1 (Educativo Infantil)', url: 'https://w2.manasat.com/kkids/smil:kkids.smil/playlist.m3u8' }
    ]
  }
];

export const CATEGORIES = [
  { id: 'all', label: 'Todos os Canais', icon: '📺' },
  { id: 'esportes', label: 'Esportes & Premiere', icon: '⚽' },
  { id: 'abertos', label: 'Canais Abertos', icon: '📡' },
  { id: 'filmes_series', label: 'Filmes & Séries', icon: '🎬' },
  { id: 'noticias', label: 'Notícias', icon: '📰' },
  { id: 'infantil', label: 'Infantil', icon: '🧒' }
];
