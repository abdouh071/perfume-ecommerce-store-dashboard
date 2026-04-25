import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectCoverflow } from 'swiper/modules';
import { useProducts } from '../context/ProductContext';
import ProductReviews from '../components/ProductReviews';
import SEO from '../components/SEO';
import LoadingSpinner from '../components/LoadingSpinner';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

export default function ProductDetails() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, storeSettings } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedVolume, setSelectedVolume] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [imageLoaded, setImageLoaded] = useState(false);
  const { products: PRODUCTS, loading } = useProducts();
  const [selectedImage, setSelectedImage] = useState('');
  const notesRef = React.useRef(null);
  const ctaRef = React.useRef(null);
  const [showStickyCTA, setShowStickyCTA] = useState(true);

  const product = PRODUCTS.find(p => p.id === id);

  // Intersection observer for sticky CTA
  useEffect(() => {
    if (!ctaRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      // Hide sticky bar when the real CTA is intersecting the viewport
      setShowStickyCTA(!entry.isIntersecting);
    }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });
    
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [product, loading]);

  // Initialize selectedVolume and selectedImage once product is loaded
  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      if (product.sizes && product.sizes.length > 0) {
        setSelectedVolume(product.sizes[0].volume);
      } else {
        setSelectedVolume(product.volume || '100ml');
      }
    }
  }, [product]);

  // Reset image loaded state when selected image changes for smooth transitions
  useEffect(() => {
    setImageLoaded(false);
  }, [selectedImage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-200 md:bg-surface font-body text-on-surface">
        <Navbar />
        <LoadingSpinner />
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-200 md:bg-surface font-body text-on-surface">
        <Navbar />
        <main className="pt-28 pb-24 px-6 md:px-12 max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-8xl text-stone-300 mb-6">search_off</span>
          <h1 className="font-headline text-4xl mb-4">{t('product.not_found')}</h1>
          <p className="text-on-surface-variant mb-8 max-w-md">{t('product.not_found_desc')}</p>
          <Link to="/shop" className="brushed-metal-cta text-white px-10 py-4 rounded-full font-bold tracking-[0.2em] text-sm uppercase">
            {t('product.browse_collection')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isUnavailable = product.isActive === false;

  // Related products (filtering current one and disabled products, same family first)
  const relatedProducts = [
    ...PRODUCTS.filter(p => p.id !== product.id && p.isActive !== false && (p.fragranceFamily || '') === (product.fragranceFamily || '')),
    ...PRODUCTS.filter(p => p.id !== product.id && p.isActive !== false && (p.fragranceFamily || '') !== (product.fragranceFamily || '')),
  ].slice(0, 6);

  // Dynamic price calculation from sizes array
  const { originalPrice, currentPrice } = (() => {
    let basePrice = 0;
    if (product.sizes && product.sizes.length > 0) {
      const selectedSize = product.sizes.find(s => s.volume === selectedVolume);
      basePrice = selectedSize ? Number(selectedSize.price) : Number(product.price);
    } else {
      basePrice = Number(product.price);
    }
    
    const discount = Number(product.discount) || 0;
    const discounted = discount > 0 ? Math.floor(basePrice * (1 - discount / 100)) : basePrice;
    
    return { 
      originalPrice: basePrice, 
      currentPrice: discounted 
    };
  })();

  const handleAddToCart = () => {
    if (isUnavailable) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        ...product,
        price: currentPrice,
        originalPrice: originalPrice,
        discount: Number(product.discount) || 0,
        volume: selectedVolume
      });
    }
    setQuantity(1);
  };

  const handleBuyNow = () => {
    if (isUnavailable) return;
    const directBuyItem = {
      ...product,
      price: currentPrice,
      originalPrice: originalPrice,
      discount: Number(product.discount) || 0,
      volume: selectedVolume,
      quantity: quantity
    };
    navigate('/checkout', { state: { directBuyItem } });
  };

  return (
    <div className="min-h-screen bg-stone-200 md:bg-surface font-body text-on-surface overflow-x-clip">
      <Navbar />
      <SEO 
        title={product.title}
        description={typeof product.description === 'object' ? (product.description?.en || '') : (product.description || '')}
        image={product.image}
        price={currentPrice}
        type="product"
      />
      <main className={`relative pt-[86px] md:pt-28 pb-24 px-4 md:px-12 max-w-7xl mx-auto min-h-screen ${i18n.language === 'ar' ? 'text-end' : 'text-start'}`}>
        {/* Floating Background Blobs */}
        <div className="absolute top-20 -left-20 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-40 -right-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10"></div>

        {/* Breadcrumb */}
        <nav className={`flex items-center gap-2 text-sm text-stone-400 mb-7 font-body ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Link to="/" className="hover:text-secondary transition-colors">{t('nav.home')}</Link>
          <span className="material-symbols-outlined text-xs">{i18n.language === 'ar' ? 'chevron_left' : 'chevron_right'}</span>
          <Link to="/shop" className="hover:text-secondary transition-colors">{t('nav.shop')}</Link>
          <span className="material-symbols-outlined text-xs">{i18n.language === 'ar' ? 'chevron_left' : 'chevron_right'}</span>
          <span className="text-on-surface font-medium">{product.title}</span>
        </nav>

        {/* Mobile-only: Title & Price above image */}
        <div className={`lg:hidden mb-4 space-y-2 ${i18n.language === 'ar' ? 'text-end' : 'text-start'}`}>
          <p className="font-label text-[10px] tracking-[0.4em] text-secondary uppercase font-bold">{typeof product.type === 'object' ? (product.type?.en || '') : (product.type || '')}</p>
          <h1 className="font-headline text-3xl tracking-tighter leading-tight">{product.title}</h1>
          <div className={`flex items-center gap-4 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className="flex flex-col">
              {product.discount > 0 && (
                <span className="text-xs text-stone-400 line-through decoration-red-500 decoration-2 font-medium">
                  {originalPrice.toLocaleString()} DZD
                </span>
              )}
              <span className="text-3xl font-headline tracking-wide text-secondary font-bold">
                {currentPrice.toLocaleString()} <span className="text-lg font-light">DZD</span>
              </span>
            </div>
            {product.discount > 0 && (
              <div className="bg-red-500 text-white px-2.5 py-1 rounded-xl text-[9px] font-black tracking-widest uppercase animate-pulse">
                -{product.discount}% {t('labels.off')}
              </div>
            )}
            {isUnavailable ? (
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold py-1 px-3 bg-red-100 rounded-full text-red-600">
                {t('labels.unavailable')}
              </span>
            ) : !product.discount && (
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold py-1 px-3 bg-secondary/10 rounded-full text-secondary">
                {t('product.in_stock')}
              </span>
            )}
          </div>
        </div>

        <div className={`flex flex-col lg:flex-row gap-8 lg:gap-16 items-start ${i18n.language === 'ar' ? 'lg:flex-row-reverse' : ''}`}>
          {/* Product Visual */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            <div className="relative group">
              <div className="relative rounded-3xl md:rounded-[3rem] overflow-hidden flex items-center justify-center aspect-[20/17] lg:aspect-[4/3] lg:max-h-[500px] glass-card scent-shadow p-0 transition-all duration-1000 bg-white/5">
                <img 
                  alt={product.title} 
                  className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 origin-center ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
                  key={selectedImage}
                  src={selectedImage || product.image}
                  onLoad={() => setImageLoaded(true)}
                  loading="eager"
                  decoding="async"
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-6 md:-bottom-12 font-headline italic text-5xl md:text-9xl text-on-surface opacity-[0.03] select-none z-[-1] tracking-tighter ${i18n.language === 'ar' ? '-right-6 md:-right-12' : '-left-6 md:-left-12'}`}>
                {product.title.split(' ')[0]}
              </div>
            </div>

            {/* Gallery Thumbnails */}
            <div className="relative z-20 grid grid-cols-4 gap-4">
              <button 
                onClick={() => setSelectedImage(product.image)}
                className={`aspect-square rounded-2xl overflow-hidden glass-card p-2 border-2 transition-all ${selectedImage === product.image ? 'border-secondary' : 'border-white/20 hover:border-white/40'}`}
              >
                <img src={product.image} alt="Main" className="w-full h-full object-cover rounded-xl" loading="lazy" decoding="async" />
              </button>
              {(product.gallery || []).map((img, idx) => img && (
                <button 
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-square rounded-2xl overflow-hidden glass-card p-2 border-2 transition-all ${selectedImage === img ? 'border-secondary' : 'border-white/20 hover:border-white/40'}`}
                >
                  <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover rounded-xl" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>

            {/* Product Reviews (Desktop Only) */}
            <div className="-mt-24 hidden lg:block w-full relative z-10 bg-surface/50 backdrop-blur-xl rounded-[2rem] pt-8">
              <ProductReviews productId={product.id} productName={product.title} />
            </div>
          </div>

          {/* Product Details */}
          <div className="w-full lg:w-1/2 flex flex-col space-y-6 md:space-y-8 lg:sticky lg:top-32">
            <div className="glass-card p-6 md:p-12 rounded-3xl md:rounded-[2.5rem] scent-shadow border border-white/20 relative overflow-hidden">
              <div className="space-y-4">
                <p className="font-label text-xs tracking-[0.4em] text-secondary uppercase font-bold">{typeof product.type === 'object' ? (product.type?.en || '') : (product.type || '')}</p>
                <h1 className="font-headline text-4xl md:text-7xl tracking-tighter leading-tight md:leading-none">{product.title}</h1>
                <div className={`flex items-center gap-6 pt-4 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className="flex flex-col">
                    {product.discount > 0 && (
                      <span className="text-sm text-stone-400 line-through decoration-red-500 decoration-2 font-medium">
                        {originalPrice.toLocaleString()} DZD
                      </span>
                    )}
                    <span className="text-3xl md:text-4xl font-headline tracking-tighter text-[#1a1c1d]">
                      {currentPrice.toLocaleString()} <span className="text-xl font-light">DZD</span>
                    </span>
                  </div>

                  {product.discount > 0 && (
                    <div className="bg-red-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase animate-pulse">
                      -{product.discount}% {t('labels.off')}
                    </div>
                  )}

                  {isUnavailable ? (
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold py-1.5 px-4 bg-red-100 rounded-full text-red-600">
                      {t('labels.unavailable')}
                    </span>
                  ) : !product.discount && (
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold py-1 px-3 bg-secondary/10 rounded-full text-secondary">
                      {t('product.in_stock')}
                    </span>
                  )}
                </div>
              </div>

              {/* Tabs: Description / Notes */}
              <div className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-on-surface/5 space-y-6">
                <div className={`flex gap-4 md:gap-6 border-b border-on-surface/10 overflow-x-auto no-scrollbar whitespace-nowrap ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all ${
                      activeTab === 'description' 
                        ? 'text-secondary border-b-2 border-secondary' 
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    {t('product.description')}
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all ${
                      activeTab === 'notes' 
                        ? 'text-secondary border-b-2 border-secondary' 
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    {t('product.notes')}
                  </button>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all ${
                      activeTab === 'details' 
                        ? 'text-secondary border-b-2 border-secondary' 
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    {t('product.details')}
                  </button>
                </div>

                {activeTab === 'description' && (
                  <p className="text-on-surface-variant font-body leading-relaxed text-lg max-w-prose animate-fade-in">
                    "{typeof product.description === 'object' ? (product.description?.en || '') : (product.description || '')}"
                  </p>
                )}

                {activeTab === 'notes' && (
                  <div className="relative animate-fade-in">
                    {/* Mobile nav buttons */}
                    <button
                      onClick={() => notesRef.current?.scrollBy({ left: i18n.language === 'ar' ? 200 : -200, behavior: 'smooth' })}
                      className="md:hidden absolute -left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center transition-all active:scale-90 text-secondary group/btn isolate"
                    >
                      <div className="absolute inset-0 backdrop-blur-[3px] rounded-full [filter:url(#glass-blur)] -z-[3]" />
                      <div className="absolute inset-0 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-[2]" />
                      <div className="absolute inset-0 rounded-full shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] group-hover/btn:shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.6),inset_-3px_-3px_3px_0_rgba(255,255,255,0.6)] transition-all duration-300 -z-[1]" />
                      <span className="material-symbols-outlined text-xl relative z-10">chevron_left</span>
                    </button>
                    <button
                      onClick={() => notesRef.current?.scrollBy({ left: i18n.language === 'ar' ? -200 : 200, behavior: 'smooth' })}
                      className="md:hidden absolute -right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center transition-all active:scale-90 text-secondary group/btn isolate"
                    >
                      <div className="absolute inset-0 backdrop-blur-[3px] rounded-full [filter:url(#glass-blur)] -z-[3]" />
                      <div className="absolute inset-0 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-[2]" />
                      <div className="absolute inset-0 rounded-full shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] group-hover/btn:shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.6),inset_-3px_-3px_3px_0_rgba(255,255,255,0.6)] transition-all duration-300 -z-[1]" />
                      <span className="material-symbols-outlined text-xl relative z-10">chevron_right</span>
                    </button>

                    <div ref={notesRef} className={`flex md:grid md:grid-cols-3 gap-4 md:gap-6 pt-2 overflow-x-auto snap-x snap-mandatory pb-2 -mx-2 px-2 md:mx-0 md:px-0 md:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      {product.topNotes ? (
                        <div className="flex-none w-[70%] md:w-auto snap-center space-y-1 text-center rounded-2xl p-4 md:p-6 bg-[#fbf9f4] border border-[#e8e4d9]">
                          <span className="material-symbols-outlined text-secondary text-2xl mb-2 opacity-50">shutter_speed</span>
                          <span className="text-[10px] uppercase tracking-[0.3em] text-secondary font-bold block mb-1">{t('product.top_notes')}</span>
                          <p className="text-sm font-medium tracking-wide leading-relaxed">{typeof product.topNotes === 'object' ? (product.topNotes?.en || '') : (product.topNotes || '')}</p>
                        </div>
                      ) : null}

                      {product.heartNotes ? (
                        <div className="flex-none w-[70%] md:w-auto snap-center space-y-1 text-center rounded-2xl p-4 md:p-6 bg-[#fbf9f4] border border-[#e8e4d9]">
                          <span className="material-symbols-outlined text-secondary text-2xl mb-2 opacity-50">favorite</span>
                          <span className="text-[10px] uppercase tracking-[0.3em] text-secondary font-bold block mb-1">{t('product.heart_notes')}</span>
                          <p className="text-sm font-medium tracking-wide leading-relaxed">{typeof product.heartNotes === 'object' ? (product.heartNotes?.en || '') : (product.heartNotes || '')}</p>
                        </div>
                      ) : null}

                      {product.baseNotes ? (
                        <div className="flex-none w-[70%] md:w-auto snap-center space-y-1 text-center rounded-2xl p-4 md:p-6 bg-[#fbf9f4] border border-[#e8e4d9]">
                          <span className="material-symbols-outlined text-secondary text-2xl mb-2 opacity-50">foundation</span>
                          <span className="text-[10px] uppercase tracking-[0.3em] text-secondary font-bold block mb-1">{t('product.base_notes')}</span>
                          <p className="text-sm font-medium tracking-wide leading-relaxed">{typeof product.baseNotes === 'object' ? (product.baseNotes?.en || '') : (product.baseNotes || '')}</p>
                        </div>
                      ) : null}

                      {!product.topNotes && !product.heartNotes && !product.baseNotes && (
                        <div className="col-span-full w-full py-12 text-center">
                          <span className="material-symbols-outlined text-4xl text-stone-300 mb-4 block">air</span>
                          <p className="text-stone-400 font-body">{t('product.no_notes_desc')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between py-3 border-b border-on-surface/5">
                      <span className="text-sm text-stone-400 uppercase tracking-widest">{t('shop.type')}</span>
                      <span className="text-sm font-medium">{typeof product.type === 'object' ? (product.type?.en || '') : (product.type || t('labels.perfume'))}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-on-surface/5">
                      <span className="text-sm text-stone-400 uppercase tracking-widest">{t('product.family')}</span>
                      <span className="text-sm font-medium">{typeof product.fragranceFamily === 'object' ? (product.fragranceFamily?.en || '—') : (product.fragranceFamily || '—')}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-on-surface/5">
                      <span className="text-sm text-stone-400 uppercase tracking-widest">{t('shop.category')}</span>
                      <span className="text-sm font-medium capitalize">{t(`nav.${(product.category || 'unisex').toLowerCase()}`)}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-sm text-stone-400 uppercase tracking-widest">{t('product.available_sizes')}</span>
                      <span className="text-sm font-medium">50ml, 100ml</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Separator */}
              <div className="h-px w-full bg-stone-300 my-8"></div>

              {/* Volume Selector */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs uppercase tracking-widest font-bold">
                  <span>{t('product.size')}</span>
                  <span className="text-secondary">{selectedVolume}</span>
                </div>
                <div className={`grid grid-cols-3 gap-2 md:gap-3 lg:gap-4 ${i18n.language === 'ar' ? 'direction-rtl' : ''}`}>
                  {product.sizes && product.sizes.length > 0 ? (
                    product.sizes.map((sizeObj, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setSelectedVolume(sizeObj.volume)} 
                        className={`w-full py-3 px-1 md:px-3 rounded-2xl border text-sm font-bold tracking-widest transition-all duration-300 active:scale-95 ${
                          selectedVolume === sizeObj.volume 
                            ? 'border-secondary bg-secondary text-white shadow-xl translate-y-[-2px]' 
                            : 'border-outline-variant/30 glass-card text-on-surface hover:border-secondary hover:text-secondary'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs">{sizeObj.volume}</span>
                          <span className={`text-[9px] font-bold tracking-normal uppercase text-center ${selectedVolume === sizeObj.volume ? 'text-white/90' : 'text-secondary/80'}`}>
                            {product.discount > 0 ? (
                                <span className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
                                    <span className={`line-through opacity-50 ${selectedVolume === sizeObj.volume ? 'text-white' : 'text-stone-400'}`}>
                                        {Number(sizeObj.price).toLocaleString()}
                                    </span>
                                    <span>
                                        {Math.floor(Number(sizeObj.price) * (1 - product.discount / 100)).toLocaleString()} DZD
                                    </span>
                                </span>
                            ) : (
                                <>{Number(sizeObj.price).toLocaleString()} DZD</>
                            )}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    ['50ml', '100ml'].map(size => (
                      <button 
                        key={size} 
                        onClick={() => setSelectedVolume(size)} 
                        className={`flex-1 py-4 rounded-2xl border text-sm font-bold tracking-widest transition-all duration-300 active:scale-95 ${
                          selectedVolume === size 
                            ? 'border-secondary bg-secondary text-white shadow-xl translate-y-[-2px]' 
                            : 'border-outline-variant/30 glass-card text-on-surface hover:border-secondary hover:text-secondary'
                        }`}
                      >
                        {size}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mt-6 space-y-4">
                <span className="text-xs uppercase tracking-widest font-bold block">{t('product.quantity')}</span>
                <div className={`flex items-center gap-4 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-4 rounded-full border border-outline-variant/30 px-4 py-2 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                      className="text-lg hover:text-secondary w-8 h-8 flex items-center justify-center transition-colors"
                    >
                      −
                    </button>
                    <span className="font-body text-lg w-8 text-center font-medium">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(10, quantity + 1))} 
                      className="text-lg hover:text-secondary w-8 h-8 flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-base font-bold text-secondary">{t('cart.total')}: {(currentPrice * quantity).toLocaleString()} DZD</span>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="mt-10" ref={ctaRef}>
                <div className={`flex gap-3 mb-3 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <button 
                    onClick={handleAddToCart} 
                    disabled={isUnavailable}
                    className={`flex-1 py-5 rounded-2xl font-bold tracking-[0.3em] uppercase text-xs shadow-2xl flex items-center justify-center gap-4 transition-all group ${
                      isUnavailable 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'brushed-metal-cta text-white active:scale-[0.98]'
                    }`}
                  >
                    {isUnavailable ? t('labels.unavailable') : t('cart.add_to_bag')} 
                    {!isUnavailable && (
                      <span className={`material-symbols-outlined text-sm transition-transform ${i18n.language === 'ar' ? 'group-hover:-translate-x-2' : 'group-hover:translate-x-2'}`}>
                        {i18n.language === 'ar' ? 'arrow_back' : 'arrow_forward'}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="w-[72px] shrink-0 rounded-2xl glass-card border border-outline-variant/30 flex items-center justify-center hover:bg-red-50 hover:border-red-100 transition-all active:scale-[0.98]"
                    aria-label="Wishlist"
                  >
                     <span className="material-symbols-outlined text-[28px] transition-transform" style={isInWishlist(product.id) ? { fontVariationSettings: "'FILL' 1", color: '#ef4444' } : {}}>favorite</span>
                  </button>
                </div>
                <button 
                  onClick={() => { if (!isUnavailable) { handleBuyNow(); } }}
                  disabled={isUnavailable}
                  className={`w-full py-5 rounded-2xl font-bold tracking-[0.3em] uppercase text-xs flex items-center justify-center gap-3 transition-all mb-6 group ${
                    isUnavailable 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-secondary text-white border-2 border-secondary hover:bg-white hover:text-secondary active:scale-[0.98] shadow-lg'
                  }`}
                >
                  {t('cart.buy_now', 'BUY NOW')}
                  {!isUnavailable && (
                    <span className="material-symbols-outlined text-sm transition-transform group-hover:scale-110">shopping_bag</span>
                  )}
                </button>
                <p className="text-[10px] text-center text-on-surface-variant tracking-[0.2em] font-medium uppercase">
                  {t('product.free_shipping_threshold', { threshold: storeSettings.freeShippingThreshold || 40000 })}
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
              <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl flex items-center gap-3 md:gap-4">
                <span className="material-symbols-outlined text-secondary text-xl md:text-2xl">auto_awesome</span>
                <div>
                  <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">{t('product.sustainability')}</h4>
                  <p className="text-[7px] md:text-[8px] text-on-surface-variant uppercase tracking-tighter">{t('product.fair_trade')}</p>
                </div>
              </div>
              <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl flex items-center gap-3 md:gap-4">
                <span className="material-symbols-outlined text-secondary text-xl md:text-2xl">eco</span>
                <div>
                  <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">{t('product.vault')}</h4>
                  <p className="text-[7px] md:text-[8px] text-on-surface-variant uppercase tracking-tighter">{t('product.signature_wrapped')}</p>
                </div>
              </div>
              <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl flex items-center gap-3 md:gap-4">
                <span className="material-symbols-outlined text-secondary text-xl md:text-2xl">verified</span>
                <div>
                  <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">{t('product.authentic')}</h4>
                  <p className="text-[7px] md:text-[8px] text-on-surface-variant uppercase tracking-tighter">{t('product.genuine')}</p>
                </div>
              </div>
              <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl flex items-center gap-3 md:gap-4">
                <span className="material-symbols-outlined text-secondary text-xl md:text-2xl">local_shipping</span>
                <div>
                  <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">{t('product.fast_delivery')}</h4>
                  <p className="text-[7px] md:text-[8px] text-on-surface-variant uppercase tracking-tighter">{t('product.delivery_days')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews (Mobile Only) */}
        <div className="lg:hidden block mt-12 w-full">
          <ProductReviews productId={product.id} productName={product.title} />
        </div>

        {/* Related Products Carousel */}
        <section className="mt-40">
          <div className={`flex flex-col md:flex-row justify-between items-center mb-16 gap-4 text-center md:text-start ${i18n.language === 'ar' ? 'md:flex-row-reverse' : ''}`}>
            <div>
              <span className="text-secondary font-bold text-[10px] uppercase tracking-[0.5em] block mb-2">{t('product.discovery')}</span>
              <h2 className="text-5xl font-headline tracking-tighter">{t('product.you_may_like')}</h2>
            </div>
            {/* Desktop-only header buttons */}
            <div className={`hidden md:flex gap-4 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <button className="rel-prev w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 transition-all active:scale-90 text-secondary group/btn isolate relative">
                <div className="absolute inset-0 backdrop-blur-[3px] rounded-full [filter:url(#glass-blur)] -z-[3]" />
                <div className="absolute inset-0 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-[2]" />
                <div className="absolute inset-0 rounded-full shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] group-hover/btn:shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.6),inset_-3px_-3px_3px_0_rgba(255,255,255,0.6)] transition-all duration-300 -z-[1]" />
                <span className="material-symbols-outlined !text-3xl relative z-10">chevron_left</span>
              </button>
              <button className="rel-next w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 transition-all active:scale-90 text-secondary group/btn isolate relative">
                <div className="absolute inset-0 backdrop-blur-[3px] rounded-full [filter:url(#glass-blur)] -z-[3]" />
                <div className="absolute inset-0 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-[2]" />
                <div className="absolute inset-0 rounded-full shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] group-hover/btn:shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.6),inset_-3px_-3px_3px_0_rgba(255,255,255,0.6)] transition-all duration-300 -z-[1]" />
                <span className="material-symbols-outlined !text-3xl relative z-10">chevron_right</span>
              </button>
            </div>
          </div>
          {/* Carousel with edge-positioned buttons on mobile */}
          <div className="relative">
            {/* Mobile edge buttons */}
            <button className="rel-prev md:hidden absolute -left-1 top-[35%] -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 text-secondary group/btn isolate">
              <div className="absolute inset-0 backdrop-blur-[3px] rounded-full [filter:url(#glass-blur)] -z-[3]" />
              <div className="absolute inset-0 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-[2]" />
              <div className="absolute inset-0 rounded-full shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] group-hover/btn:shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.6),inset_-3px_-3px_3px_0_rgba(255,255,255,0.6)] transition-all duration-300 -z-[1]" />
              <span className="material-symbols-outlined text-xl relative z-10">chevron_left</span>
            </button>
            <button className="rel-next md:hidden absolute -right-1 top-[35%] -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 text-secondary group/btn isolate">
              <div className="absolute inset-0 backdrop-blur-[3px] rounded-full [filter:url(#glass-blur)] -z-[3]" />
              <div className="absolute inset-0 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-[2]" />
              <div className="absolute inset-0 rounded-full shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] group-hover/btn:shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.6),inset_-3px_-3px_3px_0_rgba(255,255,255,0.6)] transition-all duration-300 -z-[1]" />
              <span className="material-symbols-outlined text-xl relative z-10">chevron_right</span>
            </button>

            <Swiper 
              modules={[Navigation, EffectCoverflow]} 
              slidesPerView="auto" 
              centeredSlides={false} 
              spaceBetween={32} 
              navigation={{ prevEl: '.rel-prev', nextEl: '.rel-next' }} 
              className="related-products-swiper !overflow-visible"
            >
              {relatedProducts.map((p) => (
                <SwiperSlide key={p.id} className="!w-[160px] md:!w-[320px] group pb-10">
                  <Link to={`/product/${p.id}`} className="block">
                    <div className="aspect-[4/5] rounded-[1.5rem] md:rounded-[2.5rem] glass-card shimmer-border mb-3 md:mb-6 overflow-hidden relative flex items-center justify-center p-4 md:p-8 transition-all duration-700 group-hover:-translate-y-2">
                      <img alt={p.title} className="w-[75%] md:w-[80%] h-[75%] md:h-[80%] object-contain filter drop-shadow-lg md:drop-shadow-2xl transition-transform duration-1000 group-hover:scale-110" src={p.image} loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <span className="font-bold text-white text-[8px] md:text-[10px] tracking-[0.4em] uppercase px-4 md:px-8 py-2 md:py-3 border border-white/40 rounded-full shadow-2xl text-center leading-tight mx-2">{t('product.view_details')}</span>
                      </div>
                    </div>
                    <div className="text-center px-1 md:px-4">
                      <h3 className="font-headline text-lg md:text-2xl mb-0.5 md:mb-1 group-hover:text-secondary transition-colors">{p.title}</h3>
                      <p className="text-on-surface-variant font-light text-xs md:text-base">{Number(p.price || 0).toLocaleString()} DZD</p>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Bar (Mobile Only) */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-30 bg-[#fbf9f4]/95 backdrop-blur-md px-4 py-3 border-t border-[#e8e4d9] shadow-[0_-10px_30px_rgba(0,0,0,0.08)] transition-transform duration-300 md:hidden flex gap-3 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''} ${showStickyCTA ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <button 
          onClick={handleAddToCart} 
          disabled={isUnavailable}
          className={`flex-[0.8] py-3.5 rounded-xl font-bold tracking-widest uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 transition-all ${
            isUnavailable 
              ? 'bg-gray-300 text-gray-500' 
              : 'brushed-metal-cta text-white active:scale-[0.98]'
          }`}
        >
          {isUnavailable ? t('labels.unavailable') : t('cart.add_to_bag')} 
        </button>
        
        <button 
          onClick={() => { if (!isUnavailable) { handleBuyNow(); } }}
          disabled={isUnavailable}
          className={`flex-1 py-3.5 rounded-xl font-bold tracking-[0.2em] uppercase text-[10px] flex items-center justify-center gap-2 transition-all shadow-xl border-2 border-secondary ${
            isUnavailable 
              ? 'bg-gray-100 text-gray-400 border-none' 
              : 'bg-secondary text-white hover:bg-white hover:text-secondary active:scale-[0.98]'
          }`}
        >
          {t('cart.buy_now', 'BUY NOW')}
        </button>
      </div>

      <Footer />
    </div>
  );
}