// Vercel Serverless Function - Health-Check em tempo real dos servidores de streaming Spartan
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id = '299536', type = 'movie', s = '1', e = '1' } = req.query;

  const serverTargets = type === 'tv'
    ? [
        { id: 'superflix', url: `https://superflixapi.boats/serie/${id}/${s}/${e}` },
        { id: 'vidlink', url: `https://vidlink.pro/tv/${id}/${s}/${e}` },
        { id: 'multiembed', url: `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}` },
        { id: 'embedsu', url: `https://embed.su/embed/tv/${id}/${s}/${e}` },
        { id: 'vidsrc', url: `https://vidsrc.sh/embed/tv?tmdb=${id}&season=${s}&episode=${e}` }
      ]
    : [
        { id: 'superflix', url: `https://superflixapi.boats/filme/${id}` },
        { id: 'vidlink', url: `https://vidlink.pro/movie/${id}` },
        { id: 'multiembed', url: `https://multiembed.mov/?video_id=${id}&tmdb=1` },
        { id: 'embedsu', url: `https://embed.su/embed/movie/${id}` },
        { id: 'vidsrc', url: `https://vidsrc.sh/embed/movie?tmdb=${id}` }
      ];

  const results = await Promise.all(
    serverTargets.map(async (target) => {
      const start = Date.now();
      try {
        const response = await fetch(target.url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(2200)
        });
        const ok = response.status >= 200 && response.status < 400;
        return {
          id: target.id,
          ok,
          status: response.status,
          latency: Date.now() - start
        };
      } catch (err) {
        return {
          id: target.id,
          ok: false,
          error: err.name || 'Offline',
          latency: Date.now() - start
        };
      }
    })
  );

  const statusMap = {};
  let recommendedId = 'superflix';
  let firstOnline = null;

  for (const r of results) {
    statusMap[r.id] = r.ok;
    if (r.ok && !firstOnline) {
      firstOnline = r.id;
    }
  }

  // Se o SuperFlix estiver offline para o título, recomenda o primeiro servidor online
  if (!statusMap.superflix && firstOnline) {
    recommendedId = firstOnline;
  }

  return res.status(200).json({
    id,
    type,
    recommendedId,
    servers: results,
    statusMap
  });
}
