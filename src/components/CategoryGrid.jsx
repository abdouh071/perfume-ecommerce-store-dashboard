import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';

export default function CategoryGrid() {
  const { t, i18n } = useTranslation();
  const { storeSettings } = useCart();
  const currentLang = i18n.language || 'en';
  
  const categories = storeSettings?.curatedCategories || [];

  return (
    <section id="categories-section" className="pt-8 pb-24 bg-surface-container-low">
      <div className="max-w-7xl mx-auto px-8">
        <h2 className="text-center text-4xl font-headline mb-16">{t('categories.title')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat, index) => {
            const displayName = typeof cat.name === 'object' ? (cat.name?.en || cat.slug) : (cat.name || cat.slug);
            return (
              <Link
                key={cat.slug || index}
                to={cat.slug === 'luxury' ? '/shop' : `/shop?category=${cat.slug}`}
                className="relative aspect-[3/4] rounded-[2rem] overflow-hidden group cursor-pointer shadow-xl block"
              >
                <img 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  src={cat.image} 
                  alt={`${displayName} fragrances`}
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] group-hover:backdrop-blur-0 transition-all"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="glass-glow backdrop-blur-md px-8 py-3 rounded-full border border-white/40 group-hover:scale-110 transition-transform duration-500">
                    <span className="text-white font-headline text-xl">{displayName}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
