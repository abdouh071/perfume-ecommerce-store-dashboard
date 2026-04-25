import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language.startsWith('ar-');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle, currentUser } = useAuth();

  // Redirect already-logged-in users to their profile
  if (currentUser) return <Navigate to="/profile" replace />;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    
    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      console.error(err);
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed login attempts. Please try again later.');
          break;
        default:
          setError('Failed to sign in. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── LEFT: Image Panel ─── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <img
          src="/assets/images/image_1.webp"
          alt="Luxury fragrance"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/60" />

        {/* Content on image */}
        <div className={`relative z-10 flex flex-col justify-between p-12 w-full ${isRTL ? 'items-end text-right' : ''}`}>
          {/* Logo */}
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

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className={`max-w-md ${isRTL ? 'mr-auto' : ''}`}
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#d4b560] font-bold mb-4">{t('auth.welcome_back')}</p>
            <h2 className="text-4xl font-noto-serif text-white leading-tight mb-4">
              {t('auth.login_tagline_1')}<span className="italic text-[#d4b560]">{t('auth.login_tagline_2')}</span>{t('auth.login_tagline_3')}
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">
              {t('auth.login_desc')}
            </p>
          </motion.div>

          {/* Bottom decorative */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center gap-6"
          >
            <div className="flex -space-x-3">
              {[0, 2, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden">
                  <img src={`/assets/images/image_${i}.webp`} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-white/40 text-xs">
              <span className="text-white font-bold">2,400+</span> fragrance lovers joined this month
            </p>
          </motion.div>
        </div>
      </div>

      {/* ─── RIGHT: Login Form ─── */}
      <div className="flex-1 flex items-center justify-center bg-[#faf9f7] px-6 py-12 lg:px-16 relative">
        {/* Subtle decorative circle */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4b560]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#d4b560]/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden inline-block mb-10">
            <h1 className="text-3xl font-noto-serif text-[#1a1c1d] tracking-tight">
              L'Essence<span className="text-[#d4b560]">.</span>
            </h1>
          </Link>

          {/* Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-noto-serif text-[#1a1c1d] mb-2">{t('auth.sign_in')}</h2>
            <p className="text-[#a69b91] text-sm">
              {t('auth.no_account')}{' '}
              <Link to="/register" className="text-[#826a11] font-bold hover:underline underline-offset-4 transition-all">
                {t('auth.create_one')}
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5M8 10.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className={isRTL ? "text-right" : ""}>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('auth.email_placeholder')}
                  autoComplete="email"
                  className={`w-full bg-white border border-[#e2e2e4] rounded-2xl px-5 py-4 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] focus:border-[#826a11] outline-none transition-all placeholder:text-[#d1cdca] ${isRTL ? 'text-right' : ''}`}
                />
                <div className={`absolute top-1/2 -translate-y-1/2 text-[#a69b91] ${isRTL ? 'left-4' : 'right-4'}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="3"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className={isRTL ? "text-right" : ""}>
              <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91]">
                  {t('auth.password')}
                </label>
                <Link to="/forgot-password" className="text-[11px] text-[#826a11] font-bold hover:underline underline-offset-4 transition-all">
                  {t('auth.forgot_password')}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.password_placeholder')}
                  autoComplete="current-password"
                  className={`w-full bg-white border border-[#e2e2e4] rounded-2xl px-5 py-4 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] focus:border-[#826a11] outline-none transition-all placeholder:text-[#d1cdca] ${isRTL ? 'pe-5 ps-12 text-right' : 'pe-12 text-left'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-[#a69b91] hover:text-[#1a1c1d] transition-colors ${isRTL ? 'left-4' : 'right-4'}`}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <path d="m1 1 22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-[#e2e2e4] text-[#826a11] focus:ring-[#826a11] accent-[#826a11] cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-[#5f5e5e] cursor-pointer select-none">
                {t('auth.remember_me')}
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#1a1c1d] text-white rounded-full text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#826a11] transition-all duration-300 shadow-lg shadow-[#1a1c1d]/10 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-[#1a1c1d] relative overflow-hidden"
            >
              {isLoading ? (
                <span className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4" strokeLinecap="round"/></svg>
                  {t('auth.signing_in')}
                </span>
              ) : (
                t('auth.sign_in')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-[#e2e2e4]" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#d1cdca]">{t('auth.or_continue')}</span>
            <div className="flex-1 h-px bg-[#e2e2e4]" />
          </div>

          {/* Social Buttons */}
          <div className={`grid grid-cols-2 gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2.5 py-3.5 bg-white border border-[#e2e2e4] rounded-2xl text-sm font-bold text-[#1a1c1d] hover:border-[#826a11] hover:bg-[#fcfbf9] transition-all group disabled:opacity-60 disabled:cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="group-hover:text-[#826a11] transition-colors">Google</span>
            </button>
            <button className={`flex items-center justify-center gap-2.5 py-3.5 bg-white border border-[#e2e2e4] rounded-2xl text-sm font-bold text-[#1a1c1d] hover:border-[#826a11] hover:bg-[#fcfbf9] transition-all group ${isRTL ? 'flex-row-reverse' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1a1c1d">
                <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.18 0-.36-.02-.53-.06-.01-.12-.04-.31-.04-.51 0-1.08.47-2.25 1.2-3.05C13.54 1.67 14.97 1 16.31 1c.02.14.04.29.04.43h.01zM21.81 17.38c-.26.58-.54 1.12-.87 1.64-.46.72-.84 1.22-1.13 1.5-.45.46-.93.7-1.45.71-.37 0-.82-.11-1.34-.32-.52-.21-1-.32-1.44-.32-.46 0-.96.11-1.49.32-.54.22-.97.33-1.3.34-.5.02-1-.23-1.48-.73-.32-.31-.71-.83-1.2-1.57-.51-.8-.94-1.72-1.27-2.77-.36-1.14-.54-2.24-.54-3.3 0-1.22.26-2.28.79-3.15.42-.7.97-1.24 1.67-1.64s1.46-.6 2.28-.61c.39 0 .91.12 1.56.37s1.06.37 1.23.37c.13 0 .56-.13 1.31-.4.71-.25 1.31-.35 1.79-.32 1.32.11 2.32.63 2.99 1.58-1.18.72-1.77 1.72-1.76 3.01 0 1 .38 1.84 1.12 2.5.33.32.7.56 1.12.73-.09.26-.19.51-.29.77v-.01z"/>
              </svg>
              <span className="group-hover:text-[#826a11] transition-colors">Apple</span>
            </button>
          </div>

          {/* Footer */}
          <p className="mt-10 text-center text-[11px] text-[#d1cdca]">
            {t('auth.terms_agree_1')}
            <a href="#" className="text-[#a69b91] hover:text-[#826a11] underline underline-offset-2">{t('auth.terms_agree_2')}</a>
            {t('auth.terms_agree_3')}
            <a href="#" className="text-[#a69b91] hover:text-[#826a11] underline underline-offset-2">{t('auth.terms_agree_4')}</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
