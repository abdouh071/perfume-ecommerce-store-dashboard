import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';

const SLIDE_DURATION = 6000;

export default function Hero() {
  const { storeSettings, isStoreSettingsLoading } = useCart();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'en';
  const isRTL = currentLang === 'ar';

  // ── Resolve hero images from database only ──
  const heroImages = (() => {
    if (Array.isArray(storeSettings.heroImages) && storeSettings.heroImages.length > 0) {
      return storeSettings.heroImages;
    }
    if (storeSettings.heroImage) return [storeSettings.heroImage];
    return []; // No static fallbacks allowed
  })();

  // ── Carousel state ──
  const [activeIndex, setActiveIndex] = useState(0);

  const advanceSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % heroImages.length);
  }, [heroImages.length]);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(advanceSlide, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [advanceSlide, heroImages.length]);

  // ── Multi-lang text helper ──
  const getHeroText = (setting, tKey) => {
    if (setting && typeof setting === 'object' && !Array.isArray(setting)) {
      return setting[currentLang] || setting['en'];
    }
    if (typeof setting === 'string') {
      if (currentLang !== 'en') return t(tKey);
      return setting;
    }
    return t(tKey);
  };

  return (
    <div className="bg-white px-[3px] md:px-[20.5px] pt-20">
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden rounded-2xl bg-[#1a1c1d]">
        {/* ── Ken Burns Carousel Background ── */}
        <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${isStoreSettingsLoading ? 'opacity-0' : 'opacity-100'}`}>
          {heroImages.map((src, index) => (
            <div
              key={`slide-${index}-${src}`}
              className={`hero-slide ${index === activeIndex ? 'active' : ''}`}
            >
              <img
                alt={`L'Essence Hero ${index + 1}`}
                className="w-full h-full object-cover"
                src={src}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'low'}
                decoding="async"
              />
            </div>
          ))}

          {/* Gradient overlay */}
          <div className={`absolute inset-0 z-[1] rounded-2xl bg-gradient-to-r ${isRTL ? 'from-transparent via-surface/50 to-surface/90' : 'from-surface/90 via-surface/50 to-transparent'}`}></div>
        </div>

        {/* ── Prev / Next Arrows (Liquid Glass) ── */}
        {heroImages.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
              aria-label="Previous slide"
              className="absolute left-[18px] md:left-[350px] top-[60%] -translate-y-1/2 z-20 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center group transition-transform active:scale-90 hover:scale-105"
            >
              <div className="absolute inset-0 backdrop-blur-[6px] bg-white/10 rounded-full [filter:url(#glass-blur)] -z-[3] group-hover:bg-white/20 transition-colors duration-300" />
              <div className="absolute inset-0 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-[2]" />
              <div className="absolute inset-0 rounded-full shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] -z-[1]" />
              <span className="material-symbols-outlined text-on-surface text-2xl relative z-10">chevron_left</span>
            </button>
            <button
              onClick={() => setActiveIndex((prev) => (prev + 1) % heroImages.length)}
              aria-label="Next slide"
              className="absolute right-[18px] md:right-[350px] top-[60%] -translate-y-1/2 z-20 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center group transition-transform active:scale-90 hover:scale-105"
            >
              <div className="absolute inset-0 backdrop-blur-[6px] bg-white/10 rounded-full [filter:url(#glass-blur)] -z-[3] group-hover:bg-white/20 transition-colors duration-300" />
              <div className="absolute inset-0 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-[2]" />
              <div className="absolute inset-0 rounded-full shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] -z-[1]" />
              <span className="material-symbols-outlined text-on-surface text-2xl relative z-10">chevron_right</span>
            </button>
          </>
        )}

        {/* ── Slide indicators ── */}
        {heroImages.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-1 rounded-full transition-all duration-500 ${
                  index === activeIndex
                    ? 'w-8 bg-secondary'
                    : 'w-3 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* ── CTA Button ── */}
        <div className={`absolute bottom-[48px] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-center gap-6 transition-opacity duration-700 w-max ${isStoreSettingsLoading ? 'opacity-0' : 'opacity-100'}`}>
          <Link to="/shop" className="bg-[#b59522] text-white px-10 py-4 rounded-full font-bold text-sm hover:bg-[#91771b] transition-all shadow-[0_16px_50px_rgba(181,149,34,0.4)] hover:shadow-[0_20px_70px_rgba(181,149,34,0.6)] flex items-center gap-2 group whitespace-nowrap">
            {getHeroText(storeSettings.heroPrimaryButtonText, 'hero.cta')}
            <span className={`material-symbols-outlined text-sm transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} data-icon="arrow_forward">arrow_forward</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
