import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaLock, FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import SEO from './SEO';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    let active = true;

    const checkRecoverySession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;

        if (data?.session?.user) {
          setEmail(data.session.user.email || '');
          setValidating(false);
          return;
        }

        // Verifica também parâmetros na URL caso o link tenha acabado de redirecionar
        const hash = window.location.hash;
        const search = window.location.search;
        if (hash.includes('access_token') || hash.includes('type=recovery') || search.includes('code=')) {
          setTimeout(async () => {
            if (!active) return;
            const { data: retryData } = await supabase.auth.getSession();
            if (retryData?.session?.user) {
              setEmail(retryData.session.user.email || '');
            } else {
              setError('Link de redefinição inválido ou expirado. Solicite um novo link na tela de login.');
            }
            setValidating(false);
          }, 800);
          return;
        }

        setError('Link de redefinição inválido ou expirado. Solicite um novo link na tela de login.');
        setValidating(false);
      } catch {
        if (active) {
          setError('Não foi possível validar o link de redefinição de senha.');
          setValidating(false);
        }
      }
    };

    checkRecoverySession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || session?.user) {
        setEmail(session?.user?.email || '');
        setError('');
        setValidating(false);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Erro ao atualizar a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-[#07080a] flex items-center justify-center p-4">
        <FaSpinner className="text-red-500 animate-spin text-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080a] flex items-center justify-center p-4">
      <SEO title="Redefinir Senha — CineSpartan" noSuffix />

      <div className="w-full max-w-[400px] bg-[#0b0f19]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black p-8">
        <div className="flex justify-center items-center gap-2.5 mb-8">
          <img
            src="/logo-icon.png"
            alt="CineSpartan"
            className="w-12 h-12 rounded-xl object-contain shadow ring-1 ring-red-500/30 bg-black/40 shrink-0"
          />
          <span className="text-2xl font-black text-white tracking-tight">
            Cine<span className="text-red-500">Spartan</span>
          </span>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
              <FaCheckCircle className="text-green-500 text-4xl" />
            </div>
            <h2 className="text-xl font-bold text-white">Senha Atualizada!</h2>
            <p className="text-gray-400 text-sm mb-4">
              Sua senha foi alterada com sucesso. Você já pode acessar o Cine Spartan normalmente.
            </p>
            <Link
              to="/"
              className="w-full py-3.5 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
            >
              Ir para o Início
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-2 text-center">Definir Nova Senha</h2>
            {email ? (
              <p className="text-gray-400 text-sm text-center mb-6">para {email}</p>
            ) : (
              <div className="mb-6" />
            )}

            {error && (
              <div className="flex items-start gap-2.5 mb-6 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
                <FaExclamationCircle className="text-red-400 text-base shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm font-medium leading-snug">{error}</p>
              </div>
            )}

            {error ? (
              <Link
                to="/"
                className="w-full py-3.5 flex justify-center items-center bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
              >
                Voltar ao Início
              </Link>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <FaLock className="text-gray-500 text-sm" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nova Senha (mín. 6 caracteres)"
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-sm"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <FaLock className="text-gray-500 text-sm" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar Nova Senha"
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 flex justify-center items-center gap-2 disabled:opacity-50 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] bg-red-600 hover:bg-red-500 transition-all"
                >
                  {loading && <FaSpinner className="animate-spin" />}
                  Salvar Nova Senha
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
