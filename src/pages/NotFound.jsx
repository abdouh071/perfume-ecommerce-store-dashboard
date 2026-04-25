import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFound() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language.startsWith('ar-');

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen bg-[#fcfbf9] flex items-center justify-center px-6 py-32"
      >
        <div className="max-w-xl w-full text-center">

          {/* Animated 404 number */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative mb-8 select-none"
          >
            <span className="text-[180px] font-noto-serif font-bold text-[#e8e4df] leading-none block">
              404
            </span>
            {/* Floating bottle icon centered over the 404 */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-20 h-20 bg-[#1a1c1d] rounded-[28px] flex items-center justify-center shadow-2xl shadow-[#1a1c1d]/20">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d4b560" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 3h6v2a4 4 0 0 1 4 4v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a4 4 0 0 1 4-4V3z"/>
                  <path d="M9 3h6"/>
                  <path d="M12 11v4"/>
                  <path d="M10 13h4"/>
                </svg>
              </div>
            </motion.div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#d4b560] mb-4">
              {t('not_found.badge')}
            </p>
            <h1 className="text-4xl md:text-5xl font-noto-serif text-[#1a1c1d] mb-4 leading-tight">
              {t('not_found.title_1')}<br />
              <span className="italic text-[#a69b91]">{t('not_found.title_2')}</span>
            </h1>
            <p className="text-[#a69b91] text-base mb-10 leading-relaxed">
              {t('not_found.desc')}
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/"
              className="px-8 py-4 bg-[#1a1c1d] text-white rounded-full text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#826a11] transition-all duration-300 shadow-lg shadow-[#1a1c1d]/10 hover:shadow-xl hover:-translate-y-0.5"
            >
              {t('not_found.return_home')}
            </Link>
            <Link
              to="/shop"
              className="px-8 py-4 bg-white border border-[#e2e2e4] text-[#1a1c1d] rounded-full text-[10px] uppercase tracking-[0.2em] font-bold hover:border-[#826a11] hover:text-[#826a11] transition-all duration-300"
            >
              {t('not_found.browse')}
            </Link>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 flex items-center justify-center gap-6 flex-wrap"
          >
            {[
              { key: 'track',      to: '/track-order' },

              { key: 'contact',    to: '/contact' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[11px] uppercase tracking-widest font-bold text-[#a69b91] hover:text-[#826a11] transition-colors"
              >
                {t(`not_found.${link.key}`)}
              </Link>
            ))}
          </motion.div>

        </div>
      </main>
      <Footer />
    </>
  );
}
