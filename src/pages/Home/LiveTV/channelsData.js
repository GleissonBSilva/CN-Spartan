// Base de canais ao vivo verificados para o Cine Spartan
export const CHANNELS = [
  // ==========================================
  // ⚽ ESPORTES & PREMIERE
  // ==========================================
  {
    id: 'premiere_1',
    name: 'Premiere Clubes HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Stream Ao Vivo)', url: 'http://srv.elitehdbr.vip:8880/live/t4556102246/s4556102246/177.ts' },
      { name: 'Servidor 2 (HLS Alternativo)', url: 'https://cr7v.short.gy/Canal4/index.m3u8' },
      { name: 'Servidor 3 (Web Embed)', url: 'https://multiembed.mov/?live=premiere1' }
    ]
  },
  {
    id: 'premiere_2',
    name: 'Premiere 2 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (HLS HD)', url: 'https://cr7v.short.gy/Canal4/index.m3u8' },
      { name: 'Servidor 2 (Alternativo)', url: 'http://srv.elitehdbr.vip:8880/live/t4556102246/s4556102246/178.ts' }
    ]
  },
  {
    id: 'premiere_3',
    name: 'Premiere 3 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (HLS HD)', url: 'https://cr7v.short.gy/Canal4/index.m3u8' }
    ]
  },
  {
    id: 'premiere_4',
    name: 'Premiere 4 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (HLS HD)', url: 'https://cr7v.short.gy/Canal4/index.m3u8' }
    ]
  },
  {
    id: 'premiere_5',
    name: 'Premiere 5 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/42/1/premiere-futebol-clube-logo-png_seeklogo-420216.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (HLS Fast)', url: 'http://dnsul.top:80/live/paquita/pai/7098.m3u8' }
    ]
  },
  {
    id: 'caze_tv',
    name: 'CazéTV HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/47/1/cazetv-logo-png_seeklogo-476776.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor Oficial (1080p)', url: 'http://138.204.86.4:8080/CAZE_TV/playlist.m3u8' }
    ]
  },
  {
    id: 'espn_br',
    name: 'ESPN Brasil HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (1080p HD)', url: 'http://181.78.197.59:8000/play/a07z/index.m3u8' }
    ]
  },
  {
    id: 'espn_4',
    name: 'ESPN 4 HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (1080p HD)', url: 'http://181.78.197.59:8000/play/a07n/index.m3u8' }
    ]
  },
  {
    id: 'combate',
    name: 'Canal Combate HD',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/33/2/combate-logo-png_seeklogo-330553.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (UFC & Lutas)', url: 'http://143.14.134.107/167/index.m3u8' }
    ]
  },
  {
    id: 'fifa_plus',
    name: 'FIFA+ Brasil',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/FIFA_logo_without_slogan.svg/1200px-FIFA_logo_without_slogan.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Futebol Mundial)', url: 'https://e3be9ac5.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctYnJfRklGQVBsdXNQb3J0dWd1ZXNlX0hMUw/playlist.m3u8' }
    ]
  },
  {
    id: 'pluto_sports',
    name: 'Pluto TV Esportes',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://images.seeklogo.com/logo-png/38/1/pluto-tv-logo-png_seeklogo-384351.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Fast Stream)', url: 'https://jmp2.uk/plu-5f32d2db0af67400077f29c4.m3u8' }
    ]
  },
  {
    id: 'redbull_tv',
    name: 'Red Bull TV Brasil',
    category: 'esportes',
    categoryLabel: 'Esportes & Futebol',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_TV_logo.svg/1200px-Red_Bull_TV_logo.svg.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Radicais & F1)', url: 'https://d03ae6b5c6724c24867e97a3dc04934a.mediatailor.us-west-2.amazonaws.com/v1/master/ba62fe743df0fe93366eba3a257d792884136c7f/LINEAR-1026-WORBBRPTFAST-WHALETVPLUS/1026/hls/master/playlist.m3u8' }
    ]
  },

  // ==========================================
  // 📺 CANAIS ABERTOS NACIONAIS
  // ==========================================
  {
    id: 'globo_sp',
    name: 'Rede Globo SP',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Rede_Globo_logo_2021.svg/1200px-Rede_Globo_logo_2021.svg.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (SatLabs HD)', url: 'https://cdn-sp2.satlabscloud.com.br/GLOBO_HD/index.m3u8' },
      { name: 'Servidor 2 (Globo Brasília)', url: 'http://170.84.165.204/CANAL_21_HD/index.m3u8' }
    ]
  },
  {
    id: 'sbt_nacional',
    name: 'SBT Nacional HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/SBT_logo.svg/1200px-SBT_logo.svg.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (JMV Stream)', url: 'https://cdn.live.br1.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/chunklist.m3u8' },
      { name: 'Servidor 2 (SBT Interior)', url: 'https://cdn.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/playlist.m3u8' }
    ]
  },
  {
    id: 'record_tv',
    name: 'Record TV HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Record_logo_2023.svg/1200px-Record_logo_2023.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Interior SP)', url: 'http://200.77.176.130:8000/udp/224.0.0.4:49152' }
    ]
  },
  {
    id: 'cultura_fast',
    name: 'TV Cultura Fast HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/TV_Cultura_logo_2019.svg/1200px-TV_Cultura_logo_2019.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor Oficial (FPA Gateway)', url: 'https://fpa-gateway.tvcultura.com.br:8181/memfs/606caef0-a290-413d-9f1f-8fcdb3a73831.m3u8' }
    ]
  },
  {
    id: 'redetv',
    name: 'RedeTV! HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/RedeTV%21_logo_2018.svg/1200px-RedeTV%21_logo_2018.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (RedeTV! Mais)', url: 'https://tv01.zas.media:1936/redetvparana/redetvparana/playlist.m3u8' }
    ]
  },
  {
    id: 'tv_brasil',
    name: 'TV Brasil HD',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/TV_Brasil_logo_2023.svg/1200px-TV_Brasil_logo_2023.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Oficial EBC)', url: 'http://170.83.49.66:8083/AMCHD/index.m3u8' }
    ]
  },
  {
    id: 'rede_brasil',
    name: 'Rede Brasil de Televisão',
    category: 'abertos',
    categoryLabel: 'Canais Abertos',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Rede_Brasil_de_Televis%C3%A3o_logo_2020.png/1200px-Rede_Brasil_de_Televis%C3%A3o_logo_2020.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Full HD)', url: 'http://45.190.28.50/TRUTV_HD/index.m3u8' }
    ]
  },

  // ==========================================
  // 📰 NOTÍCIAS
  // ==========================================
  {
    id: 'globo_news',
    name: 'GloboNews HD',
    category: 'noticias',
    categoryLabel: 'Notícias',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/GloboNews_logo_2022.svg/1200px-GloboNews_logo_2022.svg.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (24 Horas HD)', url: 'http://79.127.238.228:14093' }
    ]
  },
  {
    id: 'cnn_brasil',
    name: 'CNN Brasil HD',
    category: 'noticias',
    categoryLabel: 'Notícias',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN_Brasil_logo.svg/1200px-CNN_Brasil_logo.svg.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor Oficial (CloudFront)', url: 'https://d25usgadhphvwi.cloudfront.net/hls/main.m3u8' }
    ]
  },
  {
    id: 'jovem_pan_news',
    name: 'Jovem Pan News HD',
    category: 'noticias',
    categoryLabel: 'Notícias',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Jovem_Pan_News_logo_2021.svg/1200px-Jovem_Pan_News_logo_2021.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Ao Vivo)', url: 'http://170.83.49.66:8083/JOVEMPANNEWSHD/index.m3u8' }
    ]
  },
  {
    id: 'record_news',
    name: 'Record News HD',
    category: 'noticias',
    categoryLabel: 'Notícias',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Record_News_logo_2023.svg/1200px-Record_News_logo_2023.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Stream Direto)', url: 'http://45.162.64.114/RECORD_NEWS/index.m3u8' }
    ]
  },
  {
    id: 'sbt_news',
    name: 'SBT News 24h',
    category: 'noticias',
    categoryLabel: 'Notícias',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/SBT_logo.svg/1200px-SBT_logo.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor Oficial (Google DAI)', url: 'https://dai.google.com/linear/hls/event/1XSOdtQ0SH2G8OEmEfGgjQ/master.m3u8' }
    ]
  },
  {
    id: 'bm_news',
    name: 'BM&C News HD',
    category: 'noticias',
    categoryLabel: 'Notícias',
    logo: 'https://yt3.googleusercontent.com/ytc/AIdro_k6yvU1aF3uQ6wP3c2f0n2y=s900-c-k-c0x00ffffff-no-rj',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Economia & Mercado)', url: 'http://45.162.64.114/ARTE1/index.m3u8' }
    ]
  },

  // ==========================================
  // 🎬 FILMES & SÉRIES
  // ==========================================
  {
    id: 'telecine_action',
    name: 'Telecine Action HD',
    category: 'filmes_series',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Telecine_Action_logo_2021.svg/1200px-Telecine_Action_logo_2021.svg.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Ação & Explosão)', url: 'http://170.83.16.50/AXN/index.m3u8' }
    ]
  },
  {
    id: 'telecine_premium',
    name: 'Telecine Premium HD',
    category: 'filmes_series',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Telecine_Premium_logo_2021.svg/1200px-Telecine_Premium_logo_2021.svg.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Estreias)', url: 'http://45.190.28.50/AE_HD/index.m3u8' }
    ]
  },
  {
    id: 'sony_movies',
    name: 'Sony Movies HD',
    category: 'filmes_series',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Sony_Movies_logo.svg/1200px-Sony_Movies_logo.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Sony Hollywood)', url: 'http://45.190.28.50/AXN_HD/index.m3u8' }
    ]
  },
  {
    id: 'amc_brasil',
    name: 'AMC Brasil HD',
    category: 'filmes_series',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/AMC_logo_2019.svg/1200px-AMC_logo_2019.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Séries & Filmes)', url: 'http://170.83.49.66:8083/AMCHD/index.m3u8' }
    ]
  },
  {
    id: 'globoplay_novelas',
    name: 'Globoplay Novelas HD',
    category: 'filmes_series',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Globoplay_logo_2020.svg/1200px-Globoplay_logo_2020.svg.png',
    resolution: '1080p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Clássicos da Teledramaturgia)', url: 'http://79.127.238.228:14455' }
    ]
  },
  {
    id: 'csi_miami',
    name: 'CSI: Miami 24h',
    category: 'filmes_series',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/CSI_Miami_logo.svg/1200px-CSI_Miami_logo.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Investigação Contínua)', url: 'https://jmp2.uk/plu-63eb9c5351f5d000085e8d7e.m3u8' }
    ]
  },
  {
    id: 'pluto_cine_sucessos',
    name: 'Pluto TV Filmes Sucessos',
    category: 'filmes_series',
    categoryLabel: 'Filmes & Séries',
    logo: 'https://images.seeklogo.com/logo-png/38/1/pluto-tv-logo-png_seeklogo-384351.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Grandes Bilheterias)', url: 'https://jmp2.uk/plu-5f12111c9e6c2c00078ef3bb.m3u8' }
    ]
  },

  // ==========================================
  // 🧒 INFANTIL & DESENHOS
  // ==========================================
  {
    id: 'cartoon_network',
    name: 'Cartoon Network HD',
    category: 'infantil',
    categoryLabel: 'Infantil',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Cartoon_Network_2010_logo.svg/1200px-Cartoon_Network_2010_logo.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Desenhos & Animações)', url: 'http://45.190.28.50/TRUTV_HD/index.m3u8' }
    ]
  },
  {
    id: 'bob_esponja',
    name: 'Bob Esponja 24 Horas',
    category: 'infantil',
    categoryLabel: 'Infantil',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/SpongeBob_SquarePants_logo.svg/1200px-SpongeBob_SquarePants_logo.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Fenda do Biquíni)', url: 'https://jmp2.uk/plu-61b790b985706b00072cb797.m3u8' }
    ]
  },
  {
    id: 'turma_monica',
    name: 'Turma da Mônica TV',
    category: 'infantil',
    categoryLabel: 'Infantil',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/0/0e/Turma_da_M%C3%B4nica_logo.png/800px-Turma_da_M%C3%B4nica_logo.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Mauricio de Sousa)', url: 'https://jmp2.uk/plu-5ffcc5130fd98c0007f2e216.m3u8' }
    ]
  },
  {
    id: 'avatar_aang',
    name: 'Avatar: A Lenda de Aang',
    category: 'infantil',
    categoryLabel: 'Infantil',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Avatar_The_Last_Airbender_logo.svg/1200px-Avatar_The_Last_Airbender_logo.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Mundo dos Elementos)', url: 'https://jmp2.uk/plu-61f1d27a189ed10007b7393e.m3u8' }
    ]
  },
  {
    id: 'naruto_br',
    name: 'Naruto Shippuden 24h',
    category: 'infantil',
    categoryLabel: 'Infantil',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Naruto_logo.svg/1200px-Naruto_logo.svg.png',
    resolution: '720p',
    type: 'hls',
    sources: [
      { name: 'Servidor 1 (Ninja Legends)', url: 'https://jmp2.uk/plu-620ff46e0a576e0007dc2f89.m3u8' }
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
