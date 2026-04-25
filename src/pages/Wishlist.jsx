import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Wishlist() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language.startsWith('ar-');
  const { wishlistItems, removeFromWishlist, clearWishlist, wishlistCount } = useWishlist();
  const { addItem } = useCart();
  const { products: PRODUCTS, loading } = useProducts();
  const [sortBy, setSortBy] = useState('recent');

  const sortedItems = useMemo(() => {
    const items = [...wishlistItems];
    switch (sortBy) {
      case 'priceLow': return items.sort((a, b) => a.price - b.price);
      case 'priceHigh': return items.sort((a, b) => b.price - a.price);
      case 'name': return items.sort((a, b) => a.title.localeCompare(b.title));
      default: return items.reverse(); // recent first
    }
  }, [wishlistItems, sortBy]);

  const recommendations = useMemo(() => {
    const wishlistIds = new Set(wishlistItems.map(p => p.id));
    return PRODUCTS.filter(p => !wishlistIds.has(p.id) && p.isActive !== false).slice(0, 5);
  }, [wishlistItems, PRODUCTS]);

  const handleAddToBag = (item) => {
    // Check if the product is still active in the live data
    const liveProduct = PRODUCTS.find(p => p.id === item.id);
    if (liveProduct && liveProduct.isActive === false) return;
    addItem({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      volume: '100ml',
    });
  };

  const handleMoveAllToBag = () => {
    wishlistItems.forEach(item => {
      const liveProduct = PRODUCTS.find(p => p.id === item.id);
      if (liveProduct && liveProduct.isActive === false) return;
      addItem({
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        volume: '100ml',
      });
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-8">

          {loading ? (
            <LoadingSpinner fullScreen={false} />
          ) : (
            <>
              {/* Page Header */}
          <div className={`flex flex-col md:flex-row md:items-end md:justify-between mb-14 gap-6 ${isRTL ? 'md:flex-row-reverse text-right' : ''}`}>
            <div>
              <h1 className="font-headline text-5xl md:text-6xl mb-3">{t('wishlist.title')}</h1>
              <p className="text-on-surface-variant font-body text-lg">
                {wishlistCount > 0
                  ? `A curated collection of ${wishlistCount} fragrance${wishlistCount !== 1 ? 's' : ''}`
                  : t('wishlist.empty_desc')}
              </p>
            </div>

            {wishlistCount > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleMoveAllToBag}
                  className="flex items-center gap-2 bg-secondary text-on-secondary px-5 py-3 rounded-full font-label text-xs uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-sm">shopping_bag</span>
                  Move All to Bag
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-surface-container-low rounded-full px-5 py-3 font-label text-xs uppercase tracking-widest text-on-surface outline-none border-0 cursor-pointer appearance-none pe-8"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="recent">Recently Added</option>
                  <option value="priceLow">Price: Low → High</option>
                  <option value="priceHigh">Price: High → Low</option>
                  <option value="name">Name: A → Z</option>
                </select>
              </div>
            )}
          </div>

          {/* Empty State */}
          {wishlistCount === 0 && (
            <div className="text-center py-24 animate-fade-in">
              <span className="material-symbols-outlined text-8xl text-outline-variant/40 mb-6 block" style={{ fontVariationSettings: "'FILL' 0" }}>favorite</span>
              <h2 className="font-headline text-3xl mb-4 text-on-surface">{t('wishlist.empty_title')}</h2>
              <p className="text-on-surface-variant font-body text-lg mb-10 max-w-md mx-auto">
                {t('wishlist.empty_desc')}
              </p>
              <Link
                to="/shop"
                className={`bg-secondary text-on-secondary px-10 py-4 rounded-full font-label font-bold tracking-widest uppercase text-sm hover:brightness-110 transition-all inline-flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">explore</span>
                {t('wishlist.discover')}
              </Link>
            </div>
          )}

          {/* Wishlist Grid */}
          {wishlistCount > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 mb-20 animate-fade-in">
              {sortedItems.map((item) => {
                const liveProduct = PRODUCTS.find(p => p.id === item.id);
                const isItemUnavailable = liveProduct && liveProduct.isActive === false;
                return (
                <div key={item.id} className={`group bg-surface-container-lowest rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_8px_30px_-12px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.1)] transition-all duration-500 ${isItemUnavailable ? 'opacity-70' : ''}`}>
                  {/* Image */}
                  <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-surface-container-low flex items-center justify-center p-2 sm:p-0">
                    <Link to={`/product/${item.id}`} className="w-full h-full flex items-center justify-center">
                      <img
                        src={item.image}
                        alt={item.title}
                        className={`w-[85%] sm:w-full h-[85%] sm:h-full object-contain filter hover:drop-shadow-lg sm:object-cover group-hover:scale-105 transition-transform duration-700 ${isItemUnavailable ? 'grayscale-[30%]' : ''}`}
                      />
                    </Link>
                    {isItemUnavailable && (
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-500 text-white text-[8px] sm:text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full shadow-md">
                        Unavailable
                      </div>
                    )}
                    {/* Heart Toggle */}
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-2 right-2 w-7 h-7 sm:top-4 sm:right-4 sm:w-10 sm:h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-red-50 transition-all active:scale-90 shadow-md"
                    >
                      <span className="material-symbols-outlined text-red-500 text-base sm:text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-3 sm:p-5 flex flex-col h-full">
                    <p className="font-label text-[8px] sm:text-[10px] tracking-[0.2em] text-outline uppercase font-semibold mb-1 line-clamp-1">{typeof item.type === 'object' ? (item.type?.en || 'EAU DE PARFUM') : (item.type || 'EAU DE PARFUM')}</p>
                    <Link to={`/product/${item.id}`}>
                      <h3 className="font-headline text-sm sm:text-xl mb-1 hover:text-secondary transition-colors line-clamp-1">{item.title}</h3>
                    </Link>
                    
                    {/* Family Tags */}
                    {item.fragranceFamily && (
                      <div className="flex flex-wrap gap-1 mb-2 hidden sm:flex">
                        <span className="bg-surface-container-low text-on-surface-variant px-2.5 py-1 rounded-full font-label text-[9px] uppercase tracking-widest">
                          {typeof item.fragranceFamily === 'object' ? (item.fragranceFamily?.en || '') : (item.fragranceFamily || '')}
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <p className="text-secondary font-headline text-sm sm:text-lg mb-2">{Number(item.price || 0).toLocaleString()} DZD</p>

                    {/* Added Date */}
                    {item.addedAt && (
                      <p className="text-[9px] sm:text-[11px] text-outline font-label mb-2 hidden sm:block">Added on {formatDate(item.addedAt)}</p>
                    )}

                    {/* Add to Bag */}
                    <div className="mt-auto pt-1 sm:pt-2">
                       <button
                         onClick={() => !isItemUnavailable && handleAddToBag(item)}
                         disabled={isItemUnavailable}
                         className={`w-full py-2 sm:py-3 rounded-full font-label font-bold tracking-widest uppercase text-[9px] sm:text-xs transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-1 sm:gap-2 ${
                           isItemUnavailable 
                             ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                             : 'bg-on-surface text-surface hover:bg-secondary hover:text-on-secondary'
                         }`}
                       >
                         <span className="material-symbols-outlined text-[10px] sm:text-sm">shopping_bag</span>
                         <span className="hidden sm:inline">{isItemUnavailable ? 'Unavailable' : 'Add to Bag'}</span>
                         <span className="sm:hidden">{isItemUnavailable ? '—' : 'Add'}</span>
                       </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* You May Also Like */}
          {recommendations.length > 0 && (
            <section className="mt-10">
              <h2 className="font-headline text-3xl mb-8">You May Also Like</h2>
              <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
                {recommendations.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="min-w-[220px] max-w-[220px] group shrink-0"
                  >
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-surface-container-low mb-3">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <p className="font-label text-[10px] tracking-[0.2em] text-outline uppercase font-semibold">{typeof product.type === 'object' ? (product.type?.en || '') : (product.type || '')}</p>
                    <h4 className="font-headline text-base group-hover:text-secondary transition-colors">{product.title}</h4>
                    <p className="text-secondary font-body text-sm">${product.price.toFixed(2)}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
        )}
        </div>
      </main>
      <Footer />
    </>
  );
}
