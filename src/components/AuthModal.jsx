import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaGoogle, FaEnvelope, FaLock, FaUser, FaSpinner, FaExclamationCircle, FaCheckCircle, FaWhatsapp, FaTv } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { getSavedPlans } from '../constants/plans';
import { useAuthProfile } from '../hooks/useAuthProfile';

const formatAuthError = (msg) => {
  if (!msg) return 'E-mail ou senha incorretos.';
  if (msg.includes('Email not confirmed')) return 'E-mail ainda não confirmado. Acesse o painel do Supabase para confirmar ou cheque seu Gmail.';
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado. Faça login.';
  if (msg.includes('Password should be')) return 'A senha deve ter pelo menos 6 caracteres.';
  return msg;
};

export default function AuthModal({ isOpen, onClose }) {
  const { refreshProfile } = useAuthProfile();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  // Holds a pending Google OAuthCredential when account collision detected
  const [pendingGoogleCred, setPendingGoogleCred] = useState(null);

  const [verificationSent, setVerificationSent] = useState(false);

  // Planos disponíveis para assinatura
  const plans = useMemo(() => getSavedPlans(), []);
  const [selectedPlanId, setSelectedPlanId] = useState('pro');
  const selectedPlan = useMemo(() => plans.find(p => p.id === selectedPlanId) || plans[0], [plans, selectedPlanId]);

  // Configuração Dinâmica de Teste Grátis (Trial) gerenciada pelo Admin
  const [trialDays, setTrialDays] = useState(() => {
    const saved = localStorage.getItem('spartan_trial_days');
    return saved ? parseInt(saved, 10) : 3;
  });
  const [trialEnabled, setTrialEnabled] = useState(() => {
    const saved = localStorage.getItem('spartan_trial_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    // Configurações locais de trial mantidas via storage
    const savedDays = localStorage.getItem('spartan_trial_days');
    if (savedDays) {
      setTrialDays(parseInt(savedDays, 10));
    }
    const savedEnabled = localStorage.getItem('spartan_trial_enabled');
    if (savedEnabled !== null) {
      setTrialEnabled(savedEnabled === 'true');
    }
  }, [isOpen]);

  // Formata telefone celular com DDD brasileiro (XX) XXXXX-XXXX
  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // Cloudflare Turnstile
  const turnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const renderWidget = () => {
      if (!turnstileRef.current || !window.turnstile) return;
      if (turnstileWidgetId.current !== null) {
        try { window.turnstile.remove(turnstileWidgetId.current); } catch { /* ignore */ }
      }
      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: '0x4AAAAAADXIPkP3kbxBSU8N',
        theme: 'dark',
      });
    };

    // If Turnstile already loaded before this modal opened, render immediately
    if (window._turnstileReady || window.turnstile) {
      setTimeout(renderWidget, 100); // small delay for modal DOM to mount
    } else {
      // Wait for the onload event fired from index.html
      window.addEventListener('turnstile-ready', renderWidget, { once: true });
    }

    return () => {
      window.removeEventListener('turnstile-ready', renderWidget);
      if (turnstileWidgetId.current !== null && window.turnstile) {
        try { window.turnstile.remove(turnstileWidgetId.current); } catch { /* ignore */ }
        turnstileWidgetId.current = null;
      }
    };
  }, [isOpen]);


  // Clear errors when switching tabs
  const handleSwitchTab = (toLogin) => {
    setIsLogin(toLogin);
    setError('');
    setShowReset(false);
    setResetSent(false);
    setPendingGoogleCred(null);
    setVerificationSent(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { error: supaResetErr } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (supaResetErr) {
        throw supaResetErr;
      }
      setResetSent(true);
    } catch (err) {
      setError(formatAuthError(err?.message || 'Não foi possível enviar o link de recuperação.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const cleanLoginEmail = email.trim().toLowerCase();
        // Autenticação primária pelo Supabase (Cine Spartan Database)
        const { data: supaData, error: supaError } = await supabase.auth.signInWithPassword({
          email: cleanLoginEmail,
          password,
        });

        if (supaError) {
          // Verifica se o cliente acabou de se cadastrar localmente (ou aguarda confirmação de e-mail do Supabase)
          let localRegisteredUser = null;
          try {
            const regList = JSON.parse(localStorage.getItem('spartan_registered_profiles') || '[]');
            if (Array.isArray(regList)) {
              localRegisteredUser = regList.find(
                (p) => p.email?.toLowerCase() === cleanLoginEmail
              );
            }
          } catch {
            localRegisteredUser = null;
          }

          if (localRegisteredUser) {
            localStorage.setItem('weflix_user', JSON.stringify({
              uid: localRegisteredUser.id,
              id: localRegisteredUser.id,
              email: localRegisteredUser.email,
              displayName: localRegisteredUser.full_name || localRegisteredUser.email.split('@')[0],
              full_name: localRegisteredUser.full_name || localRegisteredUser.email.split('@')[0],
              whatsapp: localRegisteredUser.whatsapp,
              plan_name: localRegisteredUser.plan_name,
              max_screens: localRegisteredUser.max_screens,
              is_trial: localRegisteredUser.is_trial,
              status: localRegisteredUser.status,
              expires_at: localRegisteredUser.expires_at,
            }));
            window.dispatchEvent(new Event('spartan_auth_updated'));
            await refreshProfile();
            onClose();
            return;
          }

          // Se o Supabase bloqueou por pendência de e-mail de confirmação, busca perfil ativo no banco
          if (supaError.message?.toLowerCase().includes('email not confirmed')) {
            try {
              const { data: dbProf } = await supabase
                .from('profiles')
                .select('*')
                .ilike('email', cleanLoginEmail)
                .maybeSingle();

              if (dbProf) {
                localStorage.setItem('weflix_user', JSON.stringify({
                  uid: dbProf.id,
                  id: dbProf.id,
                  email: dbProf.email,
                  displayName: dbProf.full_name || dbProf.email.split('@')[0],
                  full_name: dbProf.full_name || dbProf.email.split('@')[0],
                  whatsapp: dbProf.whatsapp,
                  plan_name: dbProf.plan_name,
                  max_screens: dbProf.max_screens,
                  is_trial: dbProf.is_trial,
                  status: dbProf.status,
                  expires_at: dbProf.expires_at,
                }));
                window.dispatchEvent(new Event('spartan_auth_updated'));
                await refreshProfile();
                onClose();
                return;
              }
            } catch {
              // fallback segue adiante
            }
          }

          setError(formatAuthError(supaError.message));
          setLoading(false);
          return;
        }

        if (supaData?.user) {
          localStorage.setItem('weflix_user', JSON.stringify({
            uid: supaData.user.id,
            id: supaData.user.id,
            email: supaData.user.email,
            displayName: supaData.user.user_metadata?.display_name || supaData.user.user_metadata?.full_name || cleanLoginEmail.split('@')[0],
            full_name: supaData.user.user_metadata?.full_name || supaData.user.user_metadata?.display_name || cleanLoginEmail.split('@')[0],
            whatsapp: supaData.user.user_metadata?.whatsapp,
            plan_name: supaData.user.user_metadata?.plan_name,
            max_screens: supaData.user.user_metadata?.max_screens,
          }));
          window.dispatchEvent(new Event('spartan_auth_updated'));
          await refreshProfile();
        }

        onClose();
      } else {
        const cleanPhone = whatsapp.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          setError('WhatsApp com DDD é obrigatório para envio da chave Pix de liberação.');
          setLoading(false);
          return;
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanName = name.trim() || cleanEmail.split('@')[0];
        const chosenPlanName = selectedPlan?.name || 'SPARTAN PRO';
        const chosenPlanScreens = Number(selectedPlan?.screens || 2);
        const chosenPlanPrice = Number(selectedPlan?.monthlyPrice || 59.9);

        // Verifica se e-mail ou WhatsApp foram bloqueados permanentemente no Anti-Fraude
        let alreadyUsedTrial = false;
        try {
          const localUsed = JSON.parse(localStorage.getItem('spartan_used_trials') || '[]');
          if (Array.isArray(localUsed)) {
            alreadyUsedTrial = localUsed.some(
              (item) =>
                (item.email && item.email.toLowerCase() === cleanEmail) ||
                (item.whatsapp && String(item.whatsapp).replace(/\D/g, '') === cleanPhone)
            );
          }
        } catch {
          // ignore
        }

        // Checagem Anti-Fraude no Supabase em tempo real (impede múltiplos testes grátis)
        if (!alreadyUsedTrial) {
          try {
            const { data: supaUsed } = await supabase
              .from('used_trials')
              .select('id')
              .or(`email.eq.${cleanEmail},whatsapp.eq.${cleanPhone}`)
              .limit(1);
            if (supaUsed && supaUsed.length > 0) {
              alreadyUsedTrial = true;
            }
          } catch {
            // ignore
          }
        }

        // Todo novo usuário que se cadastra já entra imediatamente no prazo de Teste Grátis (salvo se bloqueado no Anti-Fraude)
        const configuredDays = Math.max(1, Number(trialDays) || 3);
        const effectiveTrialDays = !alreadyUsedTrial && trialEnabled !== false ? configuredDays : 0;
        const isTrialActive = effectiveTrialDays > 0;
        const initialStatus = isTrialActive ? 'ativo' : 'vencido';
        const nowIso = new Date().toISOString();
        const expiryDate = new Date(Date.now() + effectiveTrialDays * 24 * 60 * 60 * 1000).toISOString();

        const { data: supaData, error: supaError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              display_name: cleanName,
              full_name: cleanName,
              whatsapp: cleanPhone,
              plan_name: chosenPlanName,
              plan_price: chosenPlanPrice,
              max_screens: chosenPlanScreens,
              trial_days: effectiveTrialDays,
              is_trial: isTrialActive,
              status: initialStatus,
              expires_at: expiryDate,
            },
          },
        });

        // Se o erro for "User already registered", avisa o cliente; se for limite de envio de e-mail do Supabase, conclui o cadastro normalmente
        if (supaError && supaError.message?.includes('User already registered')) {
          setError(formatAuthError(supaError.message));
          setLoading(false);
          return;
        }

        const newUserId = supaData?.user?.id || `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        // Persiste o novo perfil diretamente no banco do Supabase se o usuário foi autenticado
        if (supaData?.user?.id) {
          try {
            await supabase.from('profiles').upsert([
              {
                id: supaData.user.id,
                email: cleanEmail,
                full_name: cleanName,
                whatsapp: cleanPhone,
                role: 'client',
                status: initialStatus,
                plan_name: chosenPlanName,
                max_screens: chosenPlanScreens,
                expires_at: expiryDate,
              }
            ]);
          } catch (e) {
            console.error('Falha ao gravar perfil com whatsapp no Supabase, tentando simplificado:', e);
            try {
              await supabase.from('profiles').upsert([
                {
                  id: supaData.user.id,
                  email: cleanEmail,
                  role: 'client',
                  status: initialStatus,
                  plan_name: chosenPlanName,
                  max_screens: chosenPlanScreens,
                  expires_at: expiryDate,
                }
              ]);
            } catch {}
          }
        }

        const createdProfile = {
          id: newUserId,
          email: cleanEmail,
          full_name: cleanName,
          whatsapp: cleanPhone,
          role: 'client',
          plan_name: chosenPlanName,
          max_screens: chosenPlanScreens,
          is_trial: isTrialActive,
          trial_used: true,
          status: initialStatus,
          expires_at: expiryDate,
          created_at: nowIso,
          admin_updated_at: nowIso,
        };

        // 1. Persiste imediatamente no registro compartilhado com o Painel Admin e AuthProfileContext
        try {
          const existingProfiles = JSON.parse(localStorage.getItem('spartan_registered_profiles') || '[]');
          const filtered = Array.isArray(existingProfiles)
            ? existingProfiles.filter((p) => p.id !== createdProfile.id && p.email?.toLowerCase() !== cleanEmail)
            : [];
          localStorage.setItem('spartan_registered_profiles', JSON.stringify([createdProfile, ...filtered]));
        } catch {
          // ignore
        }

        // 2. Registra no histórico de Teste Grátis (Anti-Fraude)
        if (isTrialActive) {
          try {
            const localUsed = JSON.parse(localStorage.getItem('spartan_used_trials') || '[]');
            const filteredUsed = Array.isArray(localUsed)
              ? localUsed.filter((u) => u.email?.toLowerCase() !== cleanEmail)
              : [];
            const newTrialEntry = {
              id: 'trial-' + Date.now(),
              email: cleanEmail,
              whatsapp: cleanPhone,
              claimed_at: nowIso,
              trial_days: effectiveTrialDays,
              notes: `Teste grátis (${effectiveTrialDays}d) no plano ${chosenPlanName} (${chosenPlanScreens} telas)`,
            };
            localStorage.setItem('spartan_used_trials', JSON.stringify([newTrialEntry, ...filteredUsed]));
          } catch {
            // ignore
          }
        }

        // 3. Gera automaticamente a cobrança Pix pendente no Painel Admin conforme o plano e dados do cliente
        try {
          const existingCharges = JSON.parse(localStorage.getItem('spartan_pix_charges') || 'null');
          const baseCharges = Array.isArray(existingCharges) ? existingCharges : [];
          const newPixCharge = {
            id: 'pix-' + Date.now(),
            hash: 'PIX-' + Math.random().toString(36).substring(2, 7).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            customerName: cleanName,
            customerEmail: cleanEmail,
            customerWhatsapp: cleanPhone,
            amount: chosenPlanPrice,
            method: `Pix (${chosenPlanName} • ${chosenPlanScreens} ${chosenPlanScreens > 1 ? 'Telas' : 'Tela'})`,
            dueDate: new Date(expiryDate).toLocaleDateString('pt-BR'),
            status: 'pendente',
            createdAt: new Date().toLocaleString('pt-BR'),
          };
          const filteredCharges = baseCharges.filter(
            (c) => !(c.customerEmail?.toLowerCase() === cleanEmail && c.status === 'pendente')
          );
          localStorage.setItem('spartan_pix_charges', JSON.stringify([newPixCharge, ...filteredCharges]));
        } catch {
          // ignore
        }

        // 4. Sincroniza o cliente na nuvem (api/clients) para aparecer imediatamente no Painel Admin em qualquer aparelho
        const clientSyncPayload = {
          id: newUserId,
          email: cleanEmail,
          full_name: cleanName,
          whatsapp: cleanPhone,
          role: 'client',
          plan_name: chosenPlanName,
          max_screens: chosenPlanScreens,
          is_trial: isTrialActive,
          trial_used: true,
          status: initialStatus,
          expires_at: expiryDate,
          created_at: nowIso,
        };

        try {
          fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientSyncPayload)
          }).catch(() => {});

          fetch('https://cn-spartan.vercel.app/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientSyncPayload)
          }).catch(() => {});
        } catch {}

        // Sincroniza na tabela profiles do Supabase com colunas válidas
        if (supaData?.user?.id) {
          try {
            await supabase
              .from('profiles')
              .upsert({
                id: supaData.user.id,
                email: cleanEmail,
                full_name: cleanName,
                whatsapp: cleanPhone,
                role: 'client',
                plan_name: chosenPlanName,
                max_screens: chosenPlanScreens,
                status: initialStatus,
                expires_at: expiryDate,
              }, { onConflict: 'id' });
          } catch {
            try {
              await supabase
                .from('profiles')
                .upsert({
                  id: supaData.user.id,
                  email: cleanEmail,
                  role: 'client',
                  plan_name: chosenPlanName,
                  max_screens: chosenPlanScreens,
                  status: initialStatus,
                  expires_at: expiryDate,
                }, { onConflict: 'id' });
            } catch {}
          }
        }

        // 5. Ativa a sessão imediata do cliente no navegador para já entrar assistindo no período de teste grátis
        localStorage.setItem('weflix_user', JSON.stringify({
          uid: newUserId,
          id: newUserId,
          email: cleanEmail,
          displayName: cleanName,
          full_name: cleanName,
          whatsapp: cleanPhone,
          plan_name: chosenPlanName,
          max_screens: chosenPlanScreens,
          is_trial: isTrialActive,
          status: initialStatus,
          expires_at: expiryDate,
        }));

        window.dispatchEvent(new Event('spartan_auth_updated'));
        await refreshProfile();
        onClose();
      }
    } catch (err) {
      setError(err?.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { error: supaOAuthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (supaOAuthErr) throw supaOAuthErr;
    } catch (err) {
      setError(err?.message || 'Erro ao autenticar com o Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-[460px] bg-[#0b0f19]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black overflow-hidden pointer-events-auto"
            >
              <div className="p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/logo-icon.png"
                      alt="CineSpartan"
                      className="w-11 h-11 rounded-xl object-contain shadow-md ring-1 ring-red-500/30 bg-black/40 shrink-0"
                    />
                    <span className="text-xl font-black text-white tracking-tight">
                      Cine<span className="text-red-500">Spartan</span>
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => handleSwitchTab(true)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      isLogin ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchTab(false)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      !isLogin ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Info Note / Error */}
                <AnimatePresence mode="wait">
                  {error ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-2.5 mb-6 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3"
                    >
                      <FaExclamationCircle className="text-red-400 text-base shrink-0 mt-0.5" />
                      <p className="text-red-300 text-sm font-medium leading-snug">{error}</p>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-gray-400 text-sm mb-6 text-center"
                    >
                      {isLogin
                        ? 'Bem-vindo de volta! Entre para acessar seu streaming.'
                        : trialEnabled && trialDays > 0
                          ? `Cadastre-se e aproveite ${trialDays} dias de Teste Grátis em Full HD & 4K!`
                          : 'Crie sua conta para acessar filmes, séries e animes no Cine Spartan.'}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Form OR Forgot Password */}
                {showReset ? (
                  <form className="space-y-4" onSubmit={handleForgotPassword}>
                    {resetSent ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-3 py-4 text-center"
                      >
                        <FaCheckCircle className="text-green-400 text-4xl" />
                        <p className="text-green-300 font-semibold text-sm">Link de recuperação enviado!</p>
                        <p className="text-gray-500 text-xs">Verifique sua caixa de entrada para redefinir sua senha.</p>
                        <button
                          type="button"
                          onClick={() => { setShowReset(false); setResetSent(false); setError(''); }}
                          className="mt-2 text-sm text-red-400 hover:text-red-300 font-semibold underline underline-offset-2 transition-colors"
                        >
                          ← Back to Log In
                        </button>
                      </motion.div>
                    ) : (
                      <>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <FaEnvelope className="text-gray-500 text-sm" />
                          </div>
                          <input
                            type="email"
                            required
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Your email address"
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-sm"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3.5 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all active:scale-[0.98]"
                        >
                          {loading && <FaSpinner className="animate-spin" />}
                          Send Reset Link
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowReset(false); setError(''); }}
                          className="w-full text-sm text-gray-500 hover:text-gray-300 font-semibold transition-colors py-1"
                        >
                          ← Back to Log In
                        </button>
                      </>
                    )}
                  </form>
                ) : verificationSent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-4 text-center"
                  >
                    <FaCheckCircle className="text-green-400 text-4xl" />
                    <h2 className="text-white font-bold text-lg mt-2">Verify your email</h2>
                    <p className="text-gray-400 text-sm">
                      We've sent a verification link to <strong className="text-white">{email}</strong>. 
                      Please check your inbox and click the link to activate your account.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSwitchTab(true)}
                      className="mt-4 w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                    >
                      Return to Log In
                    </button>
                  </motion.div>
                ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {!isLogin && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="relative"
                      >
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <FaUser className="text-gray-500 text-sm" />
                        </div>
                        <input
                          type="text"
                          required={!isLogin}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nome Completo *"
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium text-sm"
                        />
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="relative"
                      >
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <FaWhatsapp className="text-emerald-400 text-sm" />
                        </div>
                        <input
                          type="tel"
                          required={!isLogin}
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                          placeholder="WhatsApp com DDD (Ex: 92 99374-6740) *"
                          className="w-full bg-black/20 border border-emerald-500/30 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-sm"
                        />
                        <div className="text-[10px] text-emerald-400/90 mt-1 pl-1 font-medium">
                          * Obrigatório para envio da chave Pix e suporte.
                        </div>
                      </motion.div>

                      {/* Seletor do Tipo de Plano (sempre com Teste Grátis conforme dias de teste) */}
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 pt-1 pb-1"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                          <span>Escolha seu Plano:</span>
                          {trialEnabled && trialDays > 0 && (
                            <span className="text-[10px] text-amber-400 font-black bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                              🎁 {trialDays} Dias de Teste Grátis
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {plans.map((p) => {
                            const isSelected = p.id === selectedPlanId;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPlanId(p.id)}
                                className={`relative p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                                  isSelected
                                    ? 'bg-red-600/20 border-red-500 ring-2 ring-red-500/50 shadow-lg shadow-red-950/60'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400 hover:text-white'
                                }`}
                              >
                                {p.badge && (
                                  <span className="absolute -top-2 left-2 px-1.5 py-0.5 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[8px] font-black rounded-full uppercase tracking-wider">
                                    {p.badge}
                                  </span>
                                )}
                                <div>
                                  <div className="text-[11px] font-black text-white truncate">{p.name.replace('SPARTAN ', '')}</div>
                                  <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                                    <FaTv className="text-[9px] text-red-400 shrink-0" />
                                    <span>{p.screens} {p.screens > 1 ? 'Telas' : 'Tela'}</span>
                                  </div>
                                </div>
                                <div className="text-xs font-black text-white mt-2">
                                  R$ {p.monthlyPrice.toFixed(2).replace('.', ',')}
                                  <span className="text-[8px] font-normal text-gray-400">/mês</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {trialEnabled && trialDays > 0 ? (
                          <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 font-medium leading-tight">
                            ✨ <strong>Degustação Ativa:</strong> Você terá <strong>{trialDays} dias de teste grátis</strong> com acesso em <strong>{selectedPlan.screens} {selectedPlan.screens > 1 ? 'telas simultâneas' : 'tela individual'}</strong>. Após o teste, sua conta será bloqueada até a confirmação do pagamento.
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-400 bg-white/5 border border-white/10 rounded-xl p-2 font-medium">
                            Plano selecionado: <strong className="text-white">{selectedPlan.name}</strong> ({selectedPlan.screens} {selectedPlan.screens > 1 ? 'telas simultâneas' : 'tela individual'}).
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}

                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-500 text-sm" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-sm"
                    />
                  </div>

                  {isLogin && (
                    <div className="flex justify-end -mt-1">
                      <button
                        type="button"
                        onClick={() => { setShowReset(true); setResetEmail(email); setError(''); }}
                        className="text-xs text-gray-500 hover:text-red-400 font-semibold underline underline-offset-2 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                  <div ref={turnstileRef} className="flex justify-center" />

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 mt-2 flex justify-center items-center gap-2 disabled:opacity-50 text-white font-bold rounded-xl transition-all active:scale-[0.98] ${
                      pendingGoogleCred
                        ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                        : 'bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                    }`}
                  >
                    {loading && <FaSpinner className="animate-spin" />}
                    {pendingGoogleCred
                      ? <><FaGoogle /> Sign In & Link Google</>
                      : isLogin
                        ? 'Entrar'
                        : trialEnabled && trialDays > 0
                          ? `Criar Conta & Iniciar Teste (${selectedPlan.name.replace('SPARTAN ', '')})`
                          : `Criar Conta (${selectedPlan.name.replace('SPARTAN ', '')})`
                    }
                  </button>
                </form>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-gray-500 uppercase font-semibold">Or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Google Button */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <FaGoogle className="text-red-500" />
                  Continue with Google
                </button>
              </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
