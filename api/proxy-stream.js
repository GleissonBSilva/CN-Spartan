export default async function handler(req, res) {
  try {
    const target = req.query.url;
    if (!target) {
      return res.status(400).send('Missing url param');
    }

    const response = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Upstream returned ${response.status}`);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    const contentType = response.headers.get('content-type') || '';
    const actualUrl = response.url || target;
    const isM3u8 = target.includes('.m3u8') || actualUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegURL');

    if (isM3u8) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      const text = await response.text();

      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
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
      const buffer = Buffer.from(await response.arrayBuffer());
      return res.status(200).send(buffer);
    }
  } catch (err) {
    console.error('[StreamProxy Error]:', err.message);
    return res.status(502).send(`Proxy error: ${err.message}`);
  }
}
