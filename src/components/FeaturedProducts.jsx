import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useTranslation } from 'react-i18next';

export default function FeaturedProducts() {
  const { addItem, storeSettings } = useCart();
  const { products: PRODUCTS, loading } = useProducts();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  if (loading) {
    return (
      <section className="pt-8 pb-8 bg-surface px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-6 md:mb-10 gap-4">
            <div className="space-y-3">
              <div className="h-9 w-64 bg-surface-container-high rounded-2xl animate-pulse" />
              <div className="h-4 w-80 bg-surface-container-high rounded-xl animate-pulse" />
            </div>
            <div className="h-4 w-20 bg-surface-container-high rounded-xl animate-pulse" />
          </div>

          {/* Grid skeleton — mirrors 7/12 + 5/12 layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Main large card */}
            <div className="md:col-span-7 rounded-[2.5rem] overflow-hidden min-h-[500px] bg-surface-container-high animate-pulse" />
            {/* Two side cards */}
            <div className="md:col-span-5 grid grid-rows-2 gap-8">
              <div className="rounded-[2.5rem] bg-surface-container-high animate-pulse" />
              <div className="rounded-[2.5rem] bg-surface-container-high animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Use admin-selected featured products, filtering out disabled ones
  const featuredIds = storeSettings.featuredProductIds || [];
  const activeProducts = PRODUCTS.filter(p => p.isActive !== false);
  
  let featured;
  if (featuredIds.length > 0) {
    // Get selected featured products that are still active
    const activeFeatured = featuredIds
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(p => p && p.isActive !== false);
    
    // If some featured products are disabled, auto-fill with other active products
    if (activeFeatured.length < 3) {
      const usedIds = new Set(activeFeatured.map(p => p.id));
      const replacements = activeProducts
        .filter(p => !usedIds.has(p.id))
        .slice(0, 3 - activeFeatured.length);
      featured = [...activeFeatured, ...replacements].slice(0, 3);
    } else {
      featured = activeFeatured.slice(0, 3);
    }
  } else {
    featured = activeProducts.filter(p => p.featured).slice(0, 3);
  }

  if (featured.length === 0) return null;

  // 1 large item, remaining smaller items
  const main = featured[0];
  const side = featured.slice(1, 3);

  return (
    <section className="pt-8 pb-8 bg-surface px-8">
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col md:flex-row justify-between items-end mb-6 md:mb-10 gap-4`}>
          <div className="text-start">
            <h2 className="text-4xl font-headline text-on-surface mb-2">{t('featured.title', 'Featured Fragrances')}</h2>
            <p className="text-on-surface-variant font-body">{t('featured.subtitle', 'Selected by our master curators for their complex notes.')}</p>
          </div>
          <Link to="/shop" className={`text-secondary font-bold tracking-widest uppercase text-xs flex items-center gap-2 border-b border-secondary/30 pb-1`}>
            {t('featured.explore_all', 'Explore all')} <span className={`material-symbols-outlined text-sm ${isRTL ? 'rotate-180' : ''}`}>chevron_right</span>
          </Link>
        </div>
        
        {/* The "Bento Box" Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8">
          
          {/* Main Featured Item */}
          <div className="md:col-span-7 rounded-3xl md:rounded-[2.5rem] overflow-hidden group relative h-[450px] md:h-[500px]">
            <Link to={`/product/${main.id}`} className="block w-full h-full relative z-10">
              <img className="absolute inset-0 w-full h-full object-cover transform-gpu backface-hidden will-change-transform group-hover:scale-105 transition-transform duration-1000" src={main.image} alt={main.title} decoding="async" />
            </Link>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-20"></div>
            <div className={`absolute bottom-6 md:bottom-10 start-6 md:start-10 text-start text-white z-30`}>
              <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] mb-3 block text-white/80 font-bold">{t('labels.best_seller', 'Best Seller')}</span>
              <Link to={`/product/${main.id}`}>
                <h3 className="text-3xl md:text-4xl font-headline mb-4 hover:text-secondary transition-colors leading-none">{main.title}</h3>
              </Link>
              <div className={`flex flex-col sm:flex-row items-start font-body sm:items-center gap-4 mt-4 md:mt-6`}>
                <div className="flex flex-col">
                  {main.discount > 0 && (
                    <span className="text-[10px] md:text-xs text-white/50 line-through decoration-red-500/80 font-medium">
                      {Number(main.price).toLocaleString()} DZD
                    </span>
                  )}
                  <span className="text-xl md:text-2xl font-light tracking-tight text-white/90">
                    {Math.floor(Number(main.price) * (1 - (main.discount || 0) / 100)).toLocaleString()} DZD
                  </span>
                </div>
                <button 
                  onClick={() => {
                    const basePrice = main.sizes?.[0]?.price || main.price;
                    const discount = main.discount || 0;
                    const finalPrice = Math.floor(Number(basePrice) * (1 - discount / 100));
                    addItem({ 
                      ...main, 
                      volume: main.sizes?.[0]?.volume || main.volume || '100ml', 
                      price: finalPrice,
                      originalPrice: basePrice,
                      discount: discount
                    });
                  }}
                  className="bg-white/10 backdrop-blur-2xl border border-white/30 px-6 py-2.5 md:px-8 md:py-3 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-all active:scale-95 brushed-metal-cta mt-2 sm:mt-0"
                >
                  {t('cart.add_to_bag', 'Add to Bag')}
                </button>
              </div>
            </div>
          </div>

          {/* Side Items (Bento Squares on Mobile) */}
          <div className="md:col-span-5 grid grid-cols-2 md:grid-cols-1 md:grid-rows-2 gap-3 md:gap-8">
            {side.map((product, idx) => (
              <div key={product.id} className="bg-black/[0.03] border border-black/[0.05] shadow-sm rounded-3xl md:rounded-[2.5rem] md:p-8 flex flex-col md:flex-row items-center md:justify-between group overflow-hidden relative text-center md:text-start transition-colors transform-gpu" style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}>
                
                {/* Desktop Glow effect */}
                <div className="hidden md:block absolute -inset-4 bg-secondary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                {/* Image Edge-to-Edge on Mobile, Floating on Desktop */}
                <Link to={`/product/${product.id}`} className="w-full aspect-square md:h-44 md:w-32 relative z-10 transform-gpu transition-transform duration-700 md:group-hover:scale-[1.15] mb-0 md:mb-0 order-first md:order-last overflow-hidden md:overflow-visible">
                  <img className="absolute inset-0 w-full h-full object-cover md:object-contain filter transform-gpu backface-hidden will-change-transform group-hover:scale-105 transition-transform duration-[1.5s] md:drop-shadow-2xl" src={product.image} alt={product.title} decoding="async" />
                </Link>

                {/* Text Content */}
                <div className="flex flex-col gap-1 md:gap-2 relative z-10 items-center md:items-start w-full p-4 md:p-0 md:max-w-[60%] order-last md:order-first">
                  <span className="text-[7px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-secondary font-bold w-full truncate">{idx === 0 ? t('labels.new_arrival', 'New Arrival') : t('labels.limited_edition', 'Limited Edition')}</span>
                  <Link to={`/product/${product.id}`} className="w-full">
                    <h3 className="text-xs md:text-2xl font-headline hover:text-secondary transition-colors leading-tight truncate w-full">{product.title}</h3>
                  </Link>
                  <div className="flex flex-col items-center md:items-start md:mt-1 w-full font-body">
                    {product.discount > 0 && (
                      <span className="text-[8px] md:text-[10px] text-stone-400 line-through decoration-red-500/30">
                        {Number(product.price).toLocaleString()} DZD
                      </span>
                    )}
                    <span className="text-[10px] md:text-xl font-medium text-on-surface-variant">
                      {Math.floor(Number(product.price) * (1 - (product.discount || 0) / 100)).toLocaleString()} DZD
                    </span>
                  </div>
                  <div className="mt-2 md:mt-4 w-full flex justify-center md:justify-start">
                    <button 
                      onClick={() => {
                        const basePrice = product.sizes?.[0]?.price || product.price;
                        const discount = product.discount || 0;
                        const finalPrice = Math.floor(Number(basePrice) * (1 - discount / 100));
                        addItem({ 
                          ...product, 
                          volume: product.sizes?.[0]?.volume || product.volume || '100ml', 
                          price: finalPrice,
                          originalPrice: basePrice,
                          discount: discount
                        });
                      }}
                      className="text-on-surface text-[8px] md:text-[10px] uppercase tracking-widest font-bold border-b border-on-surface/20"
                    >
                      {t('cart.quick_add', 'Quick Add')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom Call to Action */}
        <div className="mt-10 md:mt-16 flex justify-center w-full">
          <Link to="/shop" className={`text-secondary hover:text-neutral-900 border-b border-secondary/30 hover:border-neutral-900 font-bold tracking-widest uppercase text-xs sm:text-sm flex items-center gap-2 pb-1 transition-all group`}>
            {t('featured.explore_all', 'Explore all')} 
            <span className={`material-symbols-outlined text-sm sm:text-base transition-transform duration-300 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}>
              chevron_right
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
