import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaGoogle, FaEnvelope, FaLock, FaUser, FaSpinner, FaExclamationCircle, FaCheckCircle, FaWhatsapp } from 'react-icons/fa';
import { BiMoviePlay } from 'react-icons/bi';
import { supabase } from '../lib/supabase';
import { auth, googleProvider, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const FIREBASE_ERRORS = {
  'auth/invalid-email':               'That email address doesn\'t look right.',
  'auth/user-not-found':              'No account found with that email.',
  'auth/wrong-password':              'Incorrect password. Please try again.',
  'auth/invalid-credential':          'Email or password is incorrect.',
  'auth/email-already-in-use':        'An account with this email already exists.',
  'auth/weak-password':               'Password must be at least 6 characters.',
  'auth/too-many-requests':           'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed':      'Network error. Please check your connection.',
  'auth/popup-closed-by-user':        'Sign-in popup was closed. Please try again.',
  'auth/cancelled-popup-request':     'Another sign-in popup is already open.',
  'auth/popup-blocked':               'Popup was blocked by your browser. Please allow popups and try again.',
  'auth/user-disabled':               'This account has been disabled. Contact support.',
};

const getFirebaseError = (err) => {
  const code = err?.code || '';
  return FIREBASE_ERRORS[code] || 'Something went wrong. Please try again.';
};

// Upsert user profile in Firestore (merge so existing data is not overwritten)
const saveUserToFirestore = async (user) => {
  const ref = doc(db, 'users', user.uid);
  await setDoc(ref, {
    uid: user.uid,
    displayName: user.displayName || null,
    email: user.email,
    photoURL: user.photoURL || null,
    emailVerified: user.emailVerified || false,
    lastLoginAt: serverTimestamp(),
  }, { merge: true });
};

const formatAuthError = (msg) => {
  if (!msg) return 'E-mail ou senha incorretos.';
  if (msg.includes('Email not confirmed')) return 'E-mail ainda não confirmado. Acesse o painel do Supabase para confirmar ou cheque seu Gmail.';
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado. Faça login.';
  if (msg.includes('Password should be')) return 'A senha deve ter pelo menos 6 caracteres.';
  return msg;
};

export default function AuthModal({ isOpen, onClose }) {
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
    if (!isOpen) return;
    if (sessionStorage.getItem('spartan_settings_404')) return;

    supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'trial_config')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          sessionStorage.setItem('spartan_settings_404', 'true');
          return;
        }
        if (data?.value) {
          if (typeof data.value.trial_days === 'number') {
            setTrialDays(data.value.trial_days);
            localStorage.setItem('spartan_trial_days', String(data.value.trial_days));
          }
          if (typeof data.value.enabled === 'boolean') {
            setTrialEnabled(data.value.enabled);
            localStorage.setItem('spartan_trial_enabled', String(data.value.enabled));
          }
        }
      })
      .catch(() => {
        sessionStorage.setItem('spartan_settings_404', 'true');
      });
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
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (err) {
      setError(getFirebaseError(err));
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
        // Autenticação primária pelo Supabase (Cine Spartan Database)
        const { data: supaData, error: supaError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (supaError) {
          // Se falhar no Supabase, tenta o Firebase como fallback
          try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            await result.user.reload();
            if (!result.user.emailVerified) {
              await auth.signOut();
              setError('Por favor, verifique seu e-mail antes de entrar.');
              setLoading(false);
              return;
            }
          } catch {
            setError(formatAuthError(supaError.message));
            setLoading(false);
            return;
          }
        }

        if (supaData?.user) {
          localStorage.setItem('weflix_user', JSON.stringify({
            uid: supaData.user.id,
            email: supaData.user.email,
            displayName: supaData.user.user_metadata?.display_name || email.split('@')[0],
          }));
        }

        onClose();
      } else {
        const cleanPhone = whatsapp.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          setError('WhatsApp com DDD é obrigatório para envio da chave Pix de liberação.');
          setLoading(false);
          return;
        }

        // Cadastro no Supabase com suporte a Trial configurável
        const effectiveTrialDays = trialEnabled ? trialDays : 0;
        const { data: supaData, error: supaError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: name,
              whatsapp: cleanPhone,
              trial_days: effectiveTrialDays,
            },
          },
        });

        if (supaError) {
          setError(formatAuthError(supaError.message));
          setLoading(false);
          return;
        }

        if (supaData?.user) {
          try {
            await supabase
              .from('profiles')
              .update({ whatsapp: cleanPhone })
              .eq('id', supaData.user.id);
          } catch {
            // Silencioso se trigger já tiver gravado
          }

          localStorage.setItem('weflix_user', JSON.stringify({
            uid: supaData.user.id,
            email: supaData.user.email,
            displayName: name,
            whatsapp: cleanPhone,
          }));
        }

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
      const result = await signInWithPopup(auth, googleProvider);
      // Save/update user profile in Firestore
      saveUserToFirestore(result.user).catch(console.error);
      onClose();
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
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
              className="w-full max-w-[400px] bg-[#0b0f19]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black overflow-hidden pointer-events-auto"
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
                        <p className="text-green-300 font-semibold text-sm">Reset email sent!</p>
                        <p className="text-gray-500 text-xs">Check your inbox for a password reset link from Firebase.</p>
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
                          ? `Criar Conta & Liberar ${trialDays} Dias Grátis`
                          : 'Criar Minha Conta'
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
