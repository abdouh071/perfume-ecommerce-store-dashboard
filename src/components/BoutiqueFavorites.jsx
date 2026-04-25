import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useProducts } from '../context/ProductContext';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/mousewheel';
import 'swiper/css/keyboard';
import { EffectCoverflow, Navigation, Pagination, Mousewheel, Keyboard } from 'swiper/modules';

export default function BoutiqueFavorites() {
  const { products: PRODUCTS, loading } = useProducts();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { t } = useTranslation();

  if (loading) {
    return (
      <section className="pt-24 pb-8 md:pb-16 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-8 mb-16 flex justify-center md:justify-start items-end">
          {/* Header skeleton */}
          <div className="space-y-3">
            <div className="h-3 w-28 bg-surface-container-high rounded-full animate-pulse" />
            <div className="h-10 w-56 bg-surface-container-high rounded-2xl animate-pulse" />
          </div>
        </div>

        {/* Carousel card skeletons */}
        <div className="flex gap-6 px-8 overflow-hidden">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="shrink-0 w-[300px] md:w-[380px] rounded-[2.5rem] bg-surface-container-high animate-pulse"
              style={{
                aspectRatio: '4/5',
                opacity: i === 0 || i === 3 ? 0.35 : i === 1 ? 0.7 : 1,
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  const { storeSettings } = useCart();
  
  let boutiqueProducts = [];
  if (storeSettings?.boutiqueFavoriteIds?.length > 0) {
    // 1. Prioritize explicit admin selection from Settings
    boutiqueProducts = storeSettings.boutiqueFavoriteIds
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(p => p && p.isActive !== false);
  } else {
    // 2. Fallback: Show the 10 most recently added active products
    // This handles the "make it contains recently added 10 perfumes" requirement
    boutiqueProducts = [...PRODUCTS]
      .filter(p => p.isActive !== false)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      })
      .slice(0, 10);
  }

  return (
    <section className="pt-24 pb-8 md:pb-16 overflow-hidden relative">
      {/* Decorative glass shimmer overlay */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent z-10"></div>
      
      <div className="max-w-7xl mx-auto px-8 mb-10 md:mb-16 flex justify-center md:justify-start items-end text-center md:text-start">
        <div className="space-y-1">
          <span className="text-secondary font-label text-xs tracking-[0.3em] uppercase block mb-2">{t('boutique.subtitle')}</span>
          <h2 className="text-4xl md:text-5xl font-headline tracking-tight">{t('boutique.title')}</h2>
        </div>
      </div>

      <div className="px-4 md:px-0 relative max-w-[100vw]">
        {/* Floating Navigation Arrows - Liquid Glass Style */}
        <button className="swiper-prev absolute left-4 md:left-12 top-[40%] -translate-y-1/2 z-20 w-12 h-12 rounded-full group/prev active:scale-90 transition-all pointer-events-auto">
          {/* Bend */}
          <div className="absolute inset-0 backdrop-blur-[3px] rounded-full [filter:url(#glass-blur)] -z-10 bg-white/5 opacity-50 transition-colors group-hover/prev:bg-white/20" />
          {/* Face */}
          <div className="absolute inset-0 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-[5]" />
          {/* Edge */}
          <div className="absolute inset-0 rounded-full shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] -z-[2]" />
          
          <span className="material-symbols-outlined font-light text-neutral-900 relative z-10 transition-transform group-hover/prev:-translate-x-0.5">chevron_left</span>
        </button>

        <button className="swiper-next absolute right-4 md:right-12 top-[40%] -translate-y-1/2 z-20 w-12 h-12 rounded-full group/next active:scale-90 transition-all pointer-events-auto">
          {/* Bend */}
          <div className="absolute inset-0 backdrop-blur-[3px] rounded-full [filter:url(#glass-blur)] -z-10 bg-white/5 opacity-50 transition-colors group-hover/next:bg-white/20" />
          {/* Face */}
          <div className="absolute inset-0 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-[5]" />
          {/* Edge */}
          <div className="absolute inset-0 rounded-full shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] -z-[2]" />
          
          <span className="material-symbols-outlined font-light text-neutral-900 relative z-10 transition-transform group-hover/next:translate-x-0.5">chevron_right</span>
        </button>

        <Swiper
          modules={[EffectCoverflow, Navigation, Pagination, Mousewheel, Keyboard]}
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView="auto"
          loop={boutiqueProducts.length > 2}
          speed={800}
          mousewheel={{
            forceToAxis: true,
          }}
          keyboard={{
            enabled: true,
          }}
          coverflowEffect={{
            rotate: 5,
            stretch: 0,
            depth: 250,
            modifier: 1,
            slideShadows: false,
          }}
          navigation={{
            prevEl: '.swiper-prev',
            nextEl: '.swiper-next',
          }}
          pagination={{ clickable: true, dynamicBullets: true }}
          className="boutique-swiper !overflow-visible !pb-16"
        >
          {boutiqueProducts.map((product) => (
            <SwiperSlide key={product.id} className="!w-[300px] md:!w-[380px] group">
              <div className="relative p-4">
                {/* Background shadow glow */}
                <div className="absolute -inset-4 bg-secondary/10 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>
                
                <Link to={`/product/${product.id}`} className="block">
                  <div className="glass-card rounded-[2.5rem] aspect-[4/5] overflow-hidden relative mb-6 shimmer-border">
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110"
                      loading="lazy"
                      decoding="async"
                    />
                    
                    {/* Gradient Overlay for contrast on light images - max strength for white backgrounds */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"></div>

                    {/* Glass Overlay - Always visible on mobile/tablet, hover on PC */}
                    <div className="absolute inset-x-4 bottom-4 glass-card p-4 rounded-2xl border border-white/20 transform translate-y-0 opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.4)] overflow-hidden bg-black/20">
                      {/* Inner highlight for extra shelf-like feel */}
                      <div className="absolute inset-x-0 top-0 h-px bg-white/30"></div>
                      
                      <div className="flex gap-2 items-center relative z-10">
                        <div className="flex-1 truncate pe-2 text-left">
                          <h4 className="font-headline text-base text-white truncate [text-shadow:_0_2px_10px_rgb(0_0_0_/_80%)]">{product.title}</h4>
                          <p className="text-[10px] text-white uppercase tracking-[0.2em] truncate [text-shadow:_0_1px_5px_rgb(0_0_0_/_60%)]">{typeof product.type === 'object' ? (product.type?.en || '') : (product.type || '')}</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            toggleWishlist(product);
                          }}
                          className="w-10 h-10 shrink-0 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center hover:bg-white/40 transition-all duration-300 shadow-xl active:scale-90 group/btn"
                          aria-label="Wishlist"
                        >
                          <span className="material-symbols-outlined text-[1.1rem] group-hover/btn:scale-110 transition-transform" style={isInWishlist(product.id) ? { fontVariationSettings: "'FILL' 1", color: '#ef4444' } : {}}>favorite</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            addItem({ ...product, volume: product.sizes?.[0]?.volume || product.volume || '100ml', price: product.sizes?.[0]?.price || product.price });
                          }}
                          className="w-10 h-10 shrink-0 rounded-full bg-white text-black flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300 shadow-xl active:scale-90 group/cartbtn"
                          aria-label="Add to cart"
                        >
                          <span className="material-symbols-outlined text-[1.1rem] group-hover/cartbtn:scale-110 transition-transform">local_mall</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <div className="text-center group-hover:translate-y-2 transition-transform duration-500">
                  <h4 className="font-headline text-xl mb-1">{product.title}</h4>
                  <span className="text-secondary font-semibold tracking-wide">{product.price} DZD</span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
