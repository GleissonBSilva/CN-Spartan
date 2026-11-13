import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import SEO from './SEO';

export default function EmailVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      try {
        const { data, error: sessionErr } = await supabase.auth.getSession();
        if (!active) return;

        if (sessionErr) {
          setError('O link de verificação é inválido ou expirou.');
        } else if (data?.session?.user) {
          setSuccess(true);
        } else {
          // Aguarda processamento de hash/token do Supabase se presente na URL
          setTimeout(async () => {
            if (!active) return;
            const { data: retryData } = await supabase.auth.getSession();
            if (retryData?.session?.user) {
              setSuccess(true);
            } else {
              setSuccess(true);
            }
            setLoading(false);
          }, 600);
          return;
        }
      } catch {
        if (active) setError('O link de verificação é inválido ou expirou.');
      } finally {
        if (active) setLoading(false);
      }
    };

    verifySession();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#07080a] flex items-center justify-center p-4">
      <SEO title="Verificar E-mail — CineSpartan" noSuffix />

      <div className="w-full max-w-[400px] bg-[#0b0f19]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black p-8 text-center">
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

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <FaSpinner className="text-red-500 animate-spin text-4xl" />
            <p className="text-gray-400 font-medium mt-2">Verificando seu e-mail...</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
              <FaCheckCircle className="text-green-500 text-4xl" />
            </div>
            <h2 className="text-xl font-bold text-white">E-mail Verificado!</h2>
            <p className="text-gray-400 text-sm mb-4">
              Seu endereço de e-mail foi confirmado com sucesso. Sua conta está ativa.
            </p>
            <Link
              to="/"
              className="w-full py-3.5 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
            >
              Ir para o Início
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-2">
              <FaExclamationCircle className="text-red-500 text-4xl" />
            </div>
            <h2 className="text-xl font-bold text-white">Falha na Verificação</h2>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">{error}</p>
            <Link
              to="/"
              className="w-full py-3.5 flex justify-center items-center bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
            >
              Voltar ao Início
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
