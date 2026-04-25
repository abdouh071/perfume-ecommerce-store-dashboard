import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language.startsWith('ar-');
  const { resetPassword, currentUser } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Already logged in — no need to reset
  if (currentUser) return <Navigate to="/profile" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t('forgot.error_email_req'));
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setError(t('forgot.error_not_found'));
      } else {
        setError(t('forgot.error_generic'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ─── LEFT: Image Panel ─── */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden">
        <img
          src="/assets/images/image_4.webp"
          alt="L'Essence fragrance"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/60" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="inline-block">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-noto-serif text-white tracking-tight"
            >
              L'Essence<span className="text-[#d4b560]">.</span>
            </motion.h1>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className={`max-w-md ${isRTL ? 'mr-auto text-right' : ''}`}
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#d4b560] font-bold mb-4">
              {t('forgot.panel_badge')}
            </p>
            <h2 className="text-4xl font-noto-serif text-white leading-tight mb-4">
              {t('forgot.panel_title_1')}
              <span className="italic text-[#d4b560]"> {t('forgot.panel_title_2')}</span>
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">
              {t('forgot.panel_desc')}
            </p>
          </motion.div>
          <div />
        </div>
      </div>

      {/* ─── RIGHT: Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center bg-[#faf9f7] px-6 py-10 lg:px-16 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4b560]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#d4b560]/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden inline-block mb-8">
            <h1 className="text-3xl font-noto-serif text-[#1a1c1d] tracking-tight">
              L'Essence<span className="text-[#d4b560]">.</span>
            </h1>
          </Link>

          <AnimatePresence mode="wait">
            {!sent ? (
              /* ── Email Form ── */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className={`mb-8 ${isRTL ? 'text-right' : ''}`}>
                  <h2 className="text-3xl font-noto-serif text-[#1a1c1d] mb-2">
                    {t('forgot.title')}
                  </h2>
                  <p className="text-[#a69b91] text-sm leading-relaxed">
                    {t('forgot.subtitle')}
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 5v3.5M8 10.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className={isRTL ? 'text-right' : ''}>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-1.5">
                      {t('auth.email')}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        placeholder={t('auth.email_placeholder')}
                        autoComplete="email"
                        className={`w-full bg-white border border-[#e2e2e4] rounded-2xl px-4 py-3.5 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] focus:border-[#826a11] outline-none transition-all placeholder:text-[#d1cdca] ${isRTL ? 'ps-11 text-right' : 'pe-11'}`}
                      />
                      <div className={`absolute top-1/2 -translate-y-1/2 text-[#a69b91] ${isRTL ? 'left-4' : 'right-4'}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-[#1a1c1d] text-white rounded-full text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#826a11] transition-all duration-300 shadow-lg shadow-[#1a1c1d]/10 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-[#1a1c1d]"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4" strokeLinecap="round"/>
                        </svg>
                        {t('forgot.sending')}
                      </span>
                    ) : t('forgot.send_btn')}
                  </button>
                </form>

                <p className={`mt-6 text-sm text-[#a69b91] ${isRTL ? 'text-right' : ''}`}>
                  {t('forgot.remembered')}{' '}
                  <Link to="/login" className="text-[#826a11] font-bold hover:underline underline-offset-4">
                    {t('auth.sign_in')}
                  </Link>
                </p>
              </motion.div>
            ) : (
              /* ── Success State ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className={`text-center ${isRTL ? 'text-right' : ''}`}
              >
                {/* Check icon */}
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                </div>
                <h2 className="text-3xl font-noto-serif text-[#1a1c1d] mb-3">
                  {t('forgot.success_title')}
                </h2>
                <p className="text-[#a69b91] text-sm leading-relaxed mb-2">
                  {t('forgot.success_desc')}
                </p>
                <p className="text-[#1a1c1d] font-bold text-sm mb-8">{email}</p>
                <p className="text-[#a69b91] text-xs mb-8">{t('forgot.success_hint')}</p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { setSent(false); setEmail(''); }}
                    className="w-full py-4 bg-white border border-[#e2e2e4] text-[#1a1c1d] rounded-full text-xs uppercase tracking-[0.2em] font-bold hover:border-[#826a11] hover:text-[#826a11] transition-all duration-300"
                  >
                    {t('forgot.try_again')}
                  </button>
                  <Link
                    to="/login"
                    className="w-full py-4 bg-[#1a1c1d] text-white rounded-full text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#826a11] transition-all duration-300 text-center"
                  >
                    {t('auth.sign_in')}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
