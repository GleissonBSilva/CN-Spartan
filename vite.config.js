import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Readable } from 'node:stream'

// Lightweight Proxy Plugin for live HLS streams without CORS
function streamProxyPlugin() {
  return {
    name: 'stream-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy-stream', async (req, res) => {
        try {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            return res.end();
          }

          const parsedUrl = new URL(req.url, 'http://localhost');
          const target = parsedUrl.searchParams.get('url');
          if (!target) {
            res.statusCode = 400;
            return res.end('Missing url param');
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
          }

          let response = await fetch(target, {
            signal: controller.signal,
            headers
          });

          // Se o upstream rejeitou com 403, tenta como cliente IPTV padrão (VLC)
          if (response.status === 403 && !target.includes('pluto.tv')) {
            try {
              const iptvRes = await fetch(target, {
                signal: controller.signal,
                headers: {
                  'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
                  'Accept': '*/*'
                }
              });
              if (iptvRes.ok) {
                response = iptvRes;
              }
            } catch {}
          }

          clearTimeout(timeout);

          if (!response.ok) {
            res.statusCode = response.status;
            return res.end(`Upstream returned ${response.status}`);
          }

          const contentType = response.headers.get('content-type') || '';
          const actualUrl = response.url || target;
          const isM3u8 = target.includes('.m3u8') || actualUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegURL');

          if (isM3u8) {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
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
                const isChildM3u8 = fullUrl.includes('.m3u8');
                const cacheBust = isChildM3u8 ? `&_t=${Date.now()}` : '';
                return `/api/proxy-stream?url=${encodeURIComponent(fullUrl)}${cacheBust}`;
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
                  const isChildM3u8 = fullUrl.includes('.m3u8');
                  const cacheBust = isChildM3u8 ? `&_t=${Date.now()}` : '';
                  return `URI="/api/proxy-stream?url=${encodeURIComponent(fullUrl)}${cacheBust}"`;
                });
              }
              return line;
            }).join('\n');

            return res.end(rewritten);
          } else {
            res.setHeader('Content-Type', contentType || 'video/MP2T');
            res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=180, stale-while-revalidate=300');
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              res.setHeader('Content-Length', contentLength);
            }
            if (response.body) {
              Readable.fromWeb(response.body).pipe(res);
            } else {
              res.end();
            }
          }
        } catch (err) {
          console.error('[StreamProxy Error]:', err.message);
          if (!res.headersSent) {
            res.statusCode = 502;
            res.end(`Proxy error: ${err.message}`);
          }
        }
      });
    }
  };
}

// Emulate Serverless Functions in local Vite development mode
function apiServerlessPlugin() {
  return {
    name: 'api-serverless',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url, 'http://localhost');
          if (url.pathname === '/api/clients' || url.pathname === '/api/clients.js') {
            req.query = Object.fromEntries(url.searchParams.entries());
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
              let body = '';
              for await (const chunk of req) body += chunk;
              try { req.body = body ? JSON.parse(body) : {}; } catch { req.body = {}; }
            }
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify(data));
            };
            const { default: clientsHandler } = await import('./api/clients.js');
            return await clientsHandler(req, res);
          }
          if (url.pathname === '/api/app-config' || url.pathname === '/api/app-config.js') {
            req.query = Object.fromEntries(url.searchParams.entries());
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
              let body = '';
              for await (const chunk of req) body += chunk;
              try { req.body = body ? JSON.parse(body) : {}; } catch { req.body = {}; }
            }
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify(data));
            };
            const { default: appConfigHandler } = await import('./api/app-config.js');
            return await appConfigHandler(req, res);
          }
        } catch (err) {
          console.error('[API Middleware Error]:', err);
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), streamProxyPlugin(), apiServerlessPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-hls': ['hls.js'],
          'vendor-ui': ['framer-motion', 'react-icons'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0', // Expose on all network interfaces
    watch: {
      ignored: ['**/android/**', '**/*.apk']
    },
    headers: {
      'Permissions-Policy': 'fullscreen=*, picture-in-picture=*, autoplay=*, encrypted-media=*, screen-wake-lock=*'
    }
  }
})
