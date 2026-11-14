import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from './context/LanguageContext'
import { FamilyModeProvider } from './context/FamilyModeContext'
import { WatchlistProvider } from './context/WatchlistContext'
import { AuthProfileProvider } from './context/AuthProfileContext'
import './index.css'
import App from './App.jsx'

// Recuperação automática de chunks obsoletos após novo deploy no Vercel
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const reloadKey = 'spartan_chunk_reload_ts';
  const lastReload = sessionStorage.getItem(reloadKey);
  const now = Date.now();
  if (!lastReload || now - Number(lastReload) > 8000) {
    sessionStorage.setItem(reloadKey, String(now));
    window.location.reload();
  }
});

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg.includes('dynamically imported module') ||
    msg.includes('Expected a JavaScript-or-Wasm module script') ||
    msg.includes('Failed to fetch dynamically imported module')
  ) {
    const reloadKey = 'spartan_chunk_reload_ts';
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 8000) {
      sessionStorage.setItem(reloadKey, String(now));
      window.location.reload();
    }
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProfileProvider>
          <LanguageProvider>
            <FamilyModeProvider>
              <WatchlistProvider>
                <App />
              </WatchlistProvider>
            </FamilyModeProvider>
          </LanguageProvider>
        </AuthProfileProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </StrictMode>,
)
