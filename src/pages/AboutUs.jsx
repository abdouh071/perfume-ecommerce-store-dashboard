import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation, Trans } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const LiquidGlassCard = ({ children, className = "p-8", rounded = "rounded-3xl" }) => (
  <div className={`relative w-full ease-out transform-gpu isolate ${className}`}>
    <div className={`absolute inset-0 backdrop-blur-[4px] bg-white/10 dark:bg-black/10 ${rounded} [filter:url(#glass-blur-about)] -z-30 transform-gpu`} />
    <div className={`absolute inset-0 ${rounded} shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-20`} />
    <div className={`absolute inset-0 ${rounded} shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] dark:shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.1),inset_-3px_-3px_3px_0_rgba(255,255,255,0.1)] -z-10`} />
    <div className="relative z-10 w-full h-full">
      {children}
    </div>
  </div>
);

const AboutUs = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <Navbar />
      <SEO 
        title={t('nav.about')}
        description={t('about_us.description')}
      />
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} xmlns="http://www.w3.org/2000/svg">  
          <filter id="glass-blur-about" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">  
            <feTurbulence type="fractalNoise" baseFrequency="0.003 0.007" numOctaves="1" result="turbulence" />  
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="200" xChannelSelector="R" yChannelSelector="G" />  
          </filter>  
        </svg>

        {/* Decorative elements */}
        <div className="absolute top-40 left-1/4 w-72 h-72 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-zinc-400/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <header className="text-center mb-24 relative">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-label text-xs tracking-[0.3em] uppercase text-yellow-700 dark:text-yellow-500 mb-6"
          >
            {t('about_us.subtitle')}
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-headline text-5xl md:text-7xl tracking-tight text-neutral-800 dark:text-neutral-100 font-light leading-none mb-8"
          >
            <Trans i18nKey="about_us.title" components={{ 0: <span className="italic" /> }} />
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto text-neutral-600 dark:text-neutral-400 font-light text-lg"
          >
            {t('about_us.description')}
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full relative rounded-[2.5rem] overflow-hidden min-h-[400px] lg:min-h-[600px] shadow-xl group"
          >
             <img 
                alt="Philosophy" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                src="/assets/images/image_3.webp" 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <LiquidGlassCard className="p-10 md:p-12">
              <h3 className="font-headline text-3xl font-light mb-6 text-neutral-900 dark:text-white">{t('about_us.philosophy_title')}</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed font-light text-sm md:text-base">
                {t('about_us.philosophy_desc')}
              </p>
            </LiquidGlassCard>
            
            <LiquidGlassCard className="p-10 md:p-12">
              <h3 className="font-headline text-3xl font-light mb-6 text-neutral-900 dark:text-white">{t('about_us.artisan_title')}</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed font-light text-sm md:text-base">
                {t('about_us.artisan_desc')}
              </p>
            </LiquidGlassCard>
          </motion.div>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
