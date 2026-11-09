import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Lightweight Proxy Plugin for live HLS streams without CORS
function streamProxyPlugin() {
  return {
    name: 'stream-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy-stream', async (req, res) => {
        try {
          const parsedUrl = new URL(req.url, 'http://localhost');
          const target = parsedUrl.searchParams.get('url');
          if (!target) {
            res.statusCode = 400;
            return res.end('Missing url param');
          }

          // Fetch target with Node
          const response = await fetch(target, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': '*/*'
            }
          });

          if (!response.ok) {
            res.statusCode = response.status;
            return res.end(`Upstream returned ${response.status}`);
          }

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');

          const contentType = response.headers.get('content-type') || '';
          const isM3u8 = target.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegURL');

          if (isM3u8) {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            const text = await response.text();
            const baseUrl = target.substring(0, target.lastIndexOf('/') + 1);

            const rewritten = text.split('\n').map(line => {
              const trimmed = line.trim();
              if (trimmed && !trimmed.startsWith('#')) {
                const fullUrl = trimmed.startsWith('http') ? trimmed : (baseUrl + trimmed);
                return `/api/proxy-stream?url=${encodeURIComponent(fullUrl)}`;
              }
              if (trimmed.startsWith('#EXT') && trimmed.includes('URI="')) {
                return trimmed.replace(/URI="([^"]+)"/g, (match, p1) => {
                  const fullUrl = p1.startsWith('http') ? p1 : (baseUrl + p1);
                  return `URI="/api/proxy-stream?url=${encodeURIComponent(fullUrl)}"`;
                });
              }
              return line;
            }).join('\n');

            return res.end(rewritten);
          } else {
            res.setHeader('Content-Type', contentType || 'video/MP2T');
            const buffer = Buffer.from(await response.arrayBuffer());
            return res.end(buffer);
          }
        } catch (err) {
          console.error('[StreamProxy Error]:', err.message);
          res.statusCode = 502;
          res.end(`Proxy error: ${err.message}`);
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), streamProxyPlugin()],
  server: {
    host: '0.0.0.0' // Expose on all network interfaces
  }
})
