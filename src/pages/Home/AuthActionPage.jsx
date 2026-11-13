import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

export default function AuthActionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const mode = searchParams.get('mode') || searchParams.get('type');

    if (mode === 'resetPassword' || mode === 'recovery') {
      navigate(`/reset-password${location.search}${location.hash}`, { replace: true });
    } else if (mode === 'verifyEmail' || mode === 'signup') {
      navigate(`/verify-email${location.search}${location.hash}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate, searchParams, location]);

  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
