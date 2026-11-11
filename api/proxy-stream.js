import { Readable } from 'node:stream';

export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    const target = req.query.url;
    if (!target) {
      return res.status(400).send('Missing url param');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*'
    };

    if (target.includes('pluto.tv')) {
      headers['Origin'] = 'https://pluto.tv';
      headers['Referer'] = 'https://pluto.tv/';
    } else {
      headers['Referer'] = target;
    }

    const response = await fetch(target, {
      signal: controller.signal,
      headers
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).send(`Upstream returned ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const actualUrl = response.url || target;
    const isM3u8 = target.includes('.m3u8') || actualUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegURL');

    if (isM3u8) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      const text = await response.text();

      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          if (trimmed.startsWith('/api/proxy-stream')) return trimmed;
          let fullUrl;
          try {
            fullUrl = trimmed.startsWith('http') ? trimmed : new URL(trimmed, actualUrl).href;
          } catch {
            fullUrl = trimmed;
          }
          return `/api/proxy-stream?url=${encodeURIComponent(fullUrl)}`;
        }
        if (trimmed.startsWith('#EXT') && trimmed.includes('URI="')) {
          return trimmed.replace(/URI="([^"]+)"/g, (match, p1) => {
            if (p1.startsWith('/api/proxy-stream')) return match;
            let fullUrl;
            try {
              fullUrl = p1.startsWith('http') ? p1 : new URL(p1, actualUrl).href;
            } catch {
              fullUrl = p1;
            }
            return `URI="/api/proxy-stream?url=${encodeURIComponent(fullUrl)}"`;
          });
        }
        return line;
      }).join('\n');

      return res.status(200).send(rewritten);
    } else {
      res.setHeader('Content-Type', contentType || 'video/MP2T');
      // Permite que a Edge CDN da Vercel armazene os segmentos .ts em cache global
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=180, stale-while-revalidate=300');

      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      if (response.body) {
        Readable.fromWeb(response.body).pipe(res);
      } else {
        res.status(200).end();
      }
    }
  } catch (err) {
    console.error('[StreamProxy Error]:', err.message);
    if (!res.headersSent) {
      return res.status(502).send(`Proxy error: ${err.message}`);
    }
  }
}
