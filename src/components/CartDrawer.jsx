import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CartDrawer() {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    items, 
    incrementQuantity, 
    decrementQuantity, 
    removeItem, 
    subtotal, 
    storeSettings 
  } = useCart();
  const { freeShippingThreshold } = storeSettings;
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Lock body scroll when cart is open (iOS-safe method)
  useEffect(() => {
    if (isCartOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.documentElement.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [isCartOpen]);
  
  if (!isCartOpen) return null;
  
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[150] transition-opacity duration-300 touch-none" 
        onClick={() => setIsCartOpen(false)} 
      />
      
      {/* Drawer */}
      <div className={`fixed top-0 ${i18n.language === 'ar' ? 'left-0 border-r' : 'right-0 border-l'} h-full w-full max-w-md z-[160] transform transition-transform duration-500 glass-card bg-zinc-50/90 border-white/20 flex flex-col pt-5 pb-0 text-neutral-900 drop-shadow-sm`}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-8 mb-2">
          <h2 className="font-headline text-3xl text-neutral-900">{t('cart.title')}</h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="px-8 pb-4 border-b border-neutral-200">
          <div className="flex justify-between text-sm font-label uppercase tracking-widest mb-2 text-neutral-900">
            <span>{t('cart.free_shipping')}</span>
            <span className="text-neutral-900 font-bold">
              {amountToFreeShipping > 0 
                ? `${amountToFreeShipping.toFixed(0)} DZD ${t('cart.away')}` 
                : t('cart.unlocked')}
            </span>
          </div>
          <div className="h-1 w-full bg-outline-variant/30 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ease-out ${amountToFreeShipping <= 0 ? 'bg-secondary' : 'bg-on-surface'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4 no-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-neutral-300">shopping_bag</span>
              <p className="font-body text-lg text-neutral-600">{t('cart.empty')}</p>
              <Link 
                to="/shop" 
                onClick={() => setIsCartOpen(false)}
                className="mt-6 border-b border-neutral-900 text-neutral-900 hover:text-secondary hover:border-secondary transition-colors uppercase font-label text-sm tracking-widest pb-1"
              >
                {t('cart.continue_shopping')}
              </Link>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={`${item.id}-${item.volume}`} className={`flex gap-3 sm:gap-4 group ${index !== items.length - 1 ? 'pb-3 border-b border-neutral-300' : ''}`}>
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-surface-container-low shrink-0 relative">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" />
                  <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none"></div>
                </div>
                <div className="flex-1 flex flex-col py-1">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="font-label text-[9px] tracking-[0.2em] text-neutral-500 uppercase font-semibold mb-1">L'ESSENCE</p>
                      <h4 className="font-headline text-sm text-neutral-900 leading-tight">{item.title}</h4>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id, item.volume)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-all active:scale-95"
                      aria-label="Remove item"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                  <p className="text-xs font-medium text-neutral-900 mb-2">{item.volume}</p>
                  
                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center gap-3 rounded-full border border-neutral-300 px-2 py-1 text-neutral-900 w-fit" dir="ltr">
                      <button 
                        onClick={() => decrementQuantity(item.id, item.volume)} 
                        disabled={item.quantity <= 1}
                        className={`text-lg w-6 h-6 rounded-full flex items-center justify-center transition-colors ${item.quantity <= 1 ? 'opacity-30 cursor-not-allowed' : 'active:bg-red-50 active:text-red-500 hover:text-red-500'}`}
                      >
                        −
                      </button>
                      <span className="font-body text-sm w-4 text-center text-neutral-900">{item.quantity}</span>
                      <button onClick={() => incrementQuantity(item.id, item.volume)} className="text-lg w-6 h-6 rounded-full flex items-center justify-center transition-colors active:bg-red-50 active:text-red-500 hover:text-red-500">+</button>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      {item.originalPrice && item.originalPrice !== item.price && (
                        <span className="text-[10px] text-neutral-400 line-through decoration-red-500/50">
                          {(item.originalPrice * item.quantity).toLocaleString()} DZD
                        </span>
                      )}
                      <span className="font-body text-sm font-bold text-neutral-900">{(item.price * item.quantity).toLocaleString()} DZD</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-8 pt-4 pb-12 border-t-2 border-neutral-400/30 bg-black/25 space-y-3 shadow-[0_-10px_40px_rgba(0,0,0,0.12)] relative z-10">
            <div className="flex justify-between items-center text-xl font-headline text-neutral-900">
              <span>{t('cart.subtotal')}</span>
              <span className="font-bold">{subtotal.toFixed(0)} DZD</span>
            </div>
            <p className="text-xs text-neutral-500 font-label text-center">{t('cart.shipping_calc')}</p>
            <button 
              onClick={handleCheckout}
              className="w-full brushed-metal-cta text-white py-5 rounded-full font-label font-bold tracking-widest uppercase text-sm shadow-[0_10px_20px_-5px_rgba(95,94,94,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(115,92,0,0.2)] transition-all duration-500 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">lock</span>
              {t('cart.secure_checkout')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
