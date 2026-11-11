import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import ParentComponent from './pages/Home/ParentComponent';
import HomePage from './pages/Home/HomePage';
import Movie from './pages/Home/Movie/Movie';
import Series from './pages/Home/TV/Series';
import SearchPage from './pages/Home/SearchPage';
import MovieDetails from './pages/Home/Movie/MovieDetails';
import TvDetails from './pages/Home/TV/TvDetails';
import WatchlistPage from './pages/Home/WatchlistPage';
import ResetPasswordPage from './pages/Home/ResetPasswordPage';
import EmailVerificationPage from './pages/Home/EmailVerificationPage';
import PersonPage from './pages/Home/Person/PersonPage';
import AuthActionPage from './pages/Home/AuthActionPage';
import LiveTvPage from './pages/Home/LiveTV/LiveTvPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AccountPage from './pages/Home/AccountPage';

// Handles TV Remote Control (Back button, Escape, Return)
function TvNavigationHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let backListener;
    try {
      backListener = CapApp.addListener('backButton', () => {
        if (location.pathname !== '/' && location.pathname !== '') {
          navigate(-1);
        } else {
          CapApp.exitApp();
        }
      });
    } catch {
      // Browser environment fallback
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'BrowserBack' || e.key === 'GoBack') {
        const isFullscreenActive = Boolean(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement ||
          document.querySelector('.is-css-fullscreen')
        );
        if (isFullscreenActive) {
          return;
        }
        if (location.pathname !== '/' && location.pathname !== '') {
          e.preventDefault();
          navigate(-1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (backListener && typeof backListener.then === 'function') {
        backListener.then(l => l.remove());
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [location.pathname, navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <TvNavigationHandler />
      <Routes>
        <Route path="/admin" element={<AdminDashboard defaultTab="overview" />} />
        <Route path="/admin/users" element={<AdminDashboard defaultTab="users" />} />
        <Route path="/admin/finance" element={<AdminDashboard defaultTab="finance" />} />
        <Route path="/admin/plans" element={<AdminDashboard defaultTab="plans" />} />
        <Route element={<ParentComponent />}>
          <Route index element={<HomePage />} />
          <Route path="/movies" element={<Movie />} />
          <Route path="/movies/:genreSlug" element={<Movie />} />
          <Route path="/movies/:genreSlug/:sortSlug" element={<Movie />} />
          <Route path="/series" element={<Series />} />
          <Route path="/series/:genreSlug" element={<Series />} />
          <Route path="/series/:genreSlug/:sortSlug" element={<Series />} />
          <Route path="/tv-ao-vivo" element={<LiveTvPage />} />
          <Route path="/movies/watch/:slug" element={<MovieDetails />} />
          <Route path="/series/watch/:slug" element={<TvDetails />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/person/:id/:slug" element={<PersonPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/minha-conta" element={<AccountPage />} />
          <Route path="/conta" element={<AccountPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/auth-action" element={<AuthActionPage />} />
          {/* Legacy detail URLs (auto-canonicalized in page components) */}
          <Route path="/movie/:slug" element={<MovieDetails />} />
          <Route path="/tv/:slug" element={<TvDetails />} />
        </Route>
      </Routes>
      <Analytics />
      <SpeedInsights />
    </Router>
  );
}

export default App;
