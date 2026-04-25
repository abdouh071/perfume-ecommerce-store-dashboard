import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useProducts } from '../context/ProductContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AllProducts() {
  const { t, i18n } = useTranslation();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { products: PRODUCTS, loading } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial category from URL params (from CategoryGrid links)
  const urlCategory = searchParams.get('category') || '';
  
  const [selectedType, setSelectedType] = useState('All');
  const [selectedFamily, setSelectedFamily] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState(urlCategory || 'All');
  const [priceRange, setPriceRange] = useState(1000000); 
  const [sortBy, setSortBy] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [displaySearchQuery, setDisplaySearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(displaySearchQuery);
      setVisibleCount(6);
    }, 400);
    return () => clearTimeout(timer);
  }, [displaySearchQuery]);

  const TYPES = ['All', 'Eau de Parfum', 'Extrait de Parfum', 'Eau de Toilette', 'Luxury Edition'];
  const FAMILIES = ['All', 'Floral', 'Woody', 'Oriental', 'Fresh', 'Citrus'];
  const SORT_OPTIONS = [
    { label: t('shop.sort_options.default'), value: 'default' },
    { label: t('shop.sort_options.price_low'), value: 'price-asc' },
    { label: t('shop.sort_options.price_high'), value: 'price-desc' },
    { label: t('shop.sort_options.name_az'), value: 'name-asc' },
    { label: t('shop.sort_options.name_za'), value: 'name-desc' },
  ];

  // Lock body scroll when filter drawer is open (iOS-safe method)
  React.useEffect(() => {
    if (isFilterOpen) {
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
  }, [isFilterOpen]);

  // Sync URL category param on change
  React.useEffect(() => {
    if (urlCategory) {
      // Normalize category (e.g. "men" -> "Men")
      const normalized = urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1).toLowerCase();
      setSelectedCategory(normalized);
    } else {
      setSelectedCategory('All');
    }
  }, [urlCategory]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let results = [...PRODUCTS];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(p => {
        const title = (p.title || '').toLowerCase();
        const type = (typeof p.type === 'object' ? p.type?.en : p.type || '').toLowerCase();
        const desc = (typeof p.description === 'object' ? p.description?.en : p.description || '').toLowerCase();
        const notes = (p.notes || []).some(n => n.toLowerCase().includes(q));
        
        return title.includes(q) || type.includes(q) || desc.includes(q) || notes;
      });
    }

    // Type filter
    if (selectedType !== 'All') {
      results = results.filter(p => {
        const type = typeof p.type === 'object' ? p.type?.en : p.type;
        return type === selectedType;
      });
    }

    // Fragrance family filter
    if (selectedFamily !== 'All') {
      results = results.filter(p => {
        const family = typeof p.fragranceFamily === 'object' ? p.fragranceFamily?.en : p.fragranceFamily;
        return family === selectedFamily;
      });
    }

    // Category filter
    if (selectedCategory !== 'All') {
      results = results.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Price filter
    results = results.filter(p => p.price <= priceRange);

    // Sort
    switch (sortBy) {
      case 'price-asc':
        results = [...results].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        results = [...results].sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        results = [...results].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        results = [...results].sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }

    // Push unavailable products to the bottom
    results.sort((a, b) => {
      const aInactive = a.isActive === false ? 1 : 0;
      const bInactive = b.isActive === false ? 1 : 0;
      return aInactive - bInactive;
    });

    return results;
  }, [searchQuery, selectedType, selectedFamily, selectedCategory, priceRange, sortBy, PRODUCTS]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleQuickAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.isActive === false) return;
    
    // Calculate discounted price for 100ml (default for quick add)
    const basePrice = product.sizes?.[0]?.price || product.price;
    const discount = product.discount || 0;
    const finalPrice = Math.floor(Number(basePrice) * (1 - discount / 100));
    
    addItem({ 
      ...product, 
      volume: product.sizes?.[0]?.volume || '100ml',
      price: finalPrice,
      originalPrice: basePrice,
      discount: discount
    });
  };

  const clearFilters = () => {
    setSelectedType('All');
    setSelectedFamily('All');
    setSelectedCategory('All');
    setPriceRange(1000000);
    setSortBy('default');
    setSearchQuery('');
    setDisplaySearchQuery('');
    setVisibleCount(6);
    setSearchParams({});
  };

  const activeFilterCount = [
    selectedType !== 'All',
    selectedFamily !== 'All',
    selectedCategory !== 'All',
    priceRange < 1000000,
    searchQuery.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <Navbar />
      <SEO 
        title={t('shop.title')}
        description={t('shop.description')}
      />
      <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Hero Header */}
        <header className="mb-12 text-center">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-0">
            <div className="flex items-center gap-3 bg-white rounded-full px-6 py-2.5 border border-stone-200 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all duration-300 group">
              <span className="material-symbols-outlined text-stone-500 group-focus-within:text-secondary text-[22px] transition-colors">search</span>
              <input
                type="text"
                value={displaySearchQuery}
                onChange={(e) => setDisplaySearchQuery(e.target.value)}
                placeholder={t('shop.search_placeholder')}
                className="bg-transparent border-none outline-none w-full text-on-surface text-sm placeholder:text-xs placeholder:text-stone-400 font-body"
              />
              {displaySearchQuery && (
                <button onClick={() => setDisplaySearchQuery('')} className="text-stone-400 hover:text-red-500 transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden sticky top-[80px] z-40 bg-surface/90 backdrop-blur-xl pt-2 pb-4 -mx-6 px-6 border-b border-outline-variant/10 flex justify-between items-center mb-6">
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 bg-surface-container px-5 py-2.5 rounded-full border border-outline-variant/30 text-sm font-bold tracking-widest uppercase hover:bg-secondary hover:text-white transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">tune</span>
            {t('shop.refine')}
          </button>
          
          <p className="text-stone-400 text-xs font-body uppercase tracking-widest">
            {filteredProducts.length} {t('shop.results')}
          </p>
        </div>

        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : (
        <>
        {/* Desktop Filter Bar (Horizontal) */}
        <div className="hidden lg:flex sticky top-[90px] z-[45] bg-surface/95 backdrop-blur-xl p-4 px-8 rounded-2xl border border-outline-variant/30 shadow-md flex-row items-center justify-between gap-6 mb-12 w-full transition-all">
          <div className="flex items-center gap-8">
            {/* Category Dropdown */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-secondary font-bold tracking-widest mb-1">{t('shop.category')}</span>
              <select 
                value={selectedCategory} 
                onChange={(e) => { setSelectedCategory(e.target.value); setVisibleCount(6); }}
                className="bg-transparent text-sm font-semibold border-none outline-none cursor-pointer text-on-surface hover:text-secondary transition-colors"
              >
                <option value="All">{t('labels.all_categories')}</option>
                <option value="Women">{t('nav.women')}</option>
                <option value="Men">{t('nav.men')}</option>
                <option value="Unisex">{t('nav.unisex')}</option>
              </select>
            </div>
            
            <div className="w-[1px] h-8 bg-outline-variant/30"></div>

            {/* Type Dropdown */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-secondary font-bold tracking-widest mb-1">{t('shop.type')}</span>
              <select 
                value={selectedType} 
                onChange={(e) => { setSelectedType(e.target.value); setVisibleCount(6); }}
                className="bg-transparent text-sm font-semibold border-none outline-none cursor-pointer text-on-surface hover:text-secondary transition-colors"
              >
                <option value="All">{t('labels.all_types')}</option>
                {TYPES.filter(t => t !== 'All').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="w-[1px] h-8 bg-outline-variant/30"></div>

            {/* Fragrance Family Dropdown */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-secondary font-bold tracking-widest mb-1">{t('shop.fragrance_family')}</span>
              <select 
                value={selectedFamily} 
                onChange={(e) => { setSelectedFamily(e.target.value); setVisibleCount(6); }}
                className="bg-transparent text-sm font-semibold border-none outline-none cursor-pointer text-on-surface hover:text-secondary transition-colors"
              >
                <option value="All">{t('labels.all')}</option>
                {FAMILIES.filter(f => f !== 'All').map(family => (
                  <option key={family} value={family}>{family}</option>
                ))}
              </select>
            </div>

            <div className="w-[1px] h-8 bg-outline-variant/30"></div>

            {/* Price Filter (Simplified for top bar) */}
            <div className="flex flex-col min-w-[150px]">
              <span className="text-[10px] uppercase text-secondary font-bold tracking-widest mb-1">
                {t('shop.price')} (≤ {priceRange.toLocaleString()})
              </span>
              <input 
                className="w-full accent-secondary h-1.5 bg-outline-variant/20 rounded-full appearance-none cursor-pointer" 
                max="1000000" 
                min="100" 
                step="500"
                type="range" 
                value={priceRange}
                onChange={(e) => { setPriceRange(Number(e.target.value)); setVisibleCount(6); }}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-3 bg-surface-container px-4 py-2 rounded-xl">
              <span className="material-symbols-outlined text-[18px] text-stone-400">sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm font-semibold border-none outline-none cursor-pointer text-on-surface"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button 
                onClick={clearFilters}
                className="text-[10px] uppercase tracking-widest text-red-500 font-bold hover:underline whitespace-nowrap"
              >
                {t('shop.clear_all')} ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12">
          
          {/* Mobile Filter Backdrop */}
          {isFilterOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
              onClick={() => setIsFilterOpen(false)}
            />
          )}

          {/* Mobile Filter Drawer */}
          <aside className={`fixed inset-y-0 left-0 z-[200] w-full max-w-[320px] bg-surface flex flex-col shadow-2xl transition-transform duration-500 ease-in-out lg:hidden ${isFilterOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            
            {/* Sticky Drawer Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-md sticky top-0 z-10">
              <h3 className="font-headline text-xl text-on-surface">{t('shop.refine')}</h3>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-secondary/10 hover:text-secondary transition-colors"
                aria-label="Close filters"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 no-scrollbar">
              {/* Category */}
              <div>
                <span className="label-sm uppercase tracking-widest text-secondary font-bold text-[10px] block mb-4">{t('shop.category')}</span>
                <ul className="space-y-4">
                  {['All', 'Women', 'Men', 'Unisex'].map((cat) => (
                    <li
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setVisibleCount(6); }}
                      className={`flex items-center gap-3 cursor-pointer transition-all ${
                        selectedCategory === cat ? 'text-on-surface font-bold translate-x-1' : 'text-stone-500 hover:text-secondary'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                        selectedCategory === cat ? 'bg-secondary scale-150 shadow-[0_0_8px_rgba(115,92,0,0.5)]' : 'bg-stone-300'
                      }`}></div>
                      <span className="text-sm">{cat === 'All' ? t('labels.all_categories') : t(`nav.${cat.toLowerCase()}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Type */}
              <div>
                <span className="label-sm uppercase tracking-widest text-secondary font-bold text-[10px] block mb-4">{t('shop.type')}</span>
                <ul className="space-y-4">
                  {TYPES.map((type) => (
                    <li
                      key={type}
                      onClick={() => { setSelectedType(type); setVisibleCount(6); }}
                      className={`flex items-center gap-3 cursor-pointer transition-all ${
                        selectedType === type ? 'text-on-surface font-bold translate-x-1' : 'text-stone-500 hover:text-secondary'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                        selectedType === type ? 'bg-secondary scale-150 shadow-[0_0_8px_rgba(115,92,0,0.5)]' : 'bg-stone-300'
                      }`}></div>
                      <span className="text-sm">{type === 'All' ? t('labels.all_types') : type}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fragrance Family */}
              <div>
                <span className="label-sm uppercase tracking-widest text-secondary font-bold text-[10px] block mb-4">{t('shop.fragrance_family')}</span>
                <div className="flex flex-wrap gap-2">
                  {FAMILIES.map((family) => (
                    <button
                      key={family}
                      onClick={() => { setSelectedFamily(family); setVisibleCount(6); }}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        selectedFamily === family
                          ? 'bg-secondary text-white shadow-lg shadow-secondary/20'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {family === 'All' ? t('labels.all') : family}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="label-sm uppercase tracking-widest text-secondary font-bold text-[10px]">{t('shop.price')}</span>
                  <span className="text-xs font-bold text-on-surface">{priceRange.toLocaleString()} DZD</span>
                </div>
                <input 
                  className="w-full accent-secondary h-1.5 bg-outline-variant/20 rounded-full appearance-none cursor-pointer" 
                  max="1000000" 
                  min="100" 
                  step="500"
                  type="range" 
                  value={priceRange}
                  onChange={(e) => { setPriceRange(Number(e.target.value)); setVisibleCount(6); }}
                />
                <div className="flex justify-between text-[10px] text-stone-400 mt-2 font-bold uppercase tracking-tighter">
                  <span>100 DZD</span>
                  <span>1M DZD</span>
                </div>
              </div>

              {/* Sort */}
              <div>
                <span className="label-sm uppercase tracking-widest text-secondary font-bold text-[10px] block mb-4">{t('shop.sort')}</span>
                <div className="grid grid-cols-1 gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`text-left px-4 py-3 rounded-xl text-sm transition-all ${
                        sortBy === opt.value 
                        ? 'bg-secondary/10 text-secondary font-bold border border-secondary/20' 
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-6 border-t border-outline-variant/20 bg-surface/80 backdrop-blur-md space-y-3">
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="w-full brushed-metal-cta text-white py-4 rounded-2xl font-bold tracking-[0.2em] uppercase text-xs shadow-xl active:scale-[0.98] transition-all"
              >
                {t('shop.apply_filters')}
              </button>
              {activeFilterCount > 0 && (
                <button 
                  onClick={clearFilters}
                  className="w-full py-2 text-[10px] uppercase tracking-widest text-red-500 font-bold hover:underline"
                >
                  {t('shop.clear_all')} ({activeFilterCount})
                </button>
              )}
            </div>
          </aside>

          {/* Product Grid */}
          <div className="w-full">
            {/* Results count (Desktop only) */}
            <div className="hidden lg:flex justify-between items-center mb-8">
              <p className="text-stone-400 text-sm font-body">
                {filteredProducts.length === 1 
                  ? t('shop.showing_single', { count: visibleProducts.length, total: filteredProducts.length })
                  : t('shop.showing', { count: visibleProducts.length, total: filteredProducts.length })
                }
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-6xl text-stone-300 mb-4 block">search_off</span>
                <h3 className="font-headline text-2xl mb-2">{t('shop.no_results_title')}</h3>
                <p className="text-stone-400 mb-6">{t('shop.no_results_desc')}</p>
                <button
                  onClick={clearFilters}
                  className="px-8 py-3 rounded-full border border-secondary text-secondary font-semibold tracking-widest text-sm hover:bg-secondary hover:text-white transition-all"
                >
                  {t('shop.clear_all')}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-y-10 gap-x-3 md:gap-y-20 md:gap-x-12">
                  {visibleProducts.map((product) => {
                    const isUnavailable = product.isActive === false;
                    const CardWrapper = isUnavailable ? 'div' : Link;
                    const cardProps = isUnavailable 
                      ? { key: product.id, className: 'product-card group relative block cursor-default' }
                      : { key: product.id, to: `/product/${product.id}`, className: 'product-card group relative block' };
                    return (
                    <CardWrapper {...cardProps}>
                      <div className={`aspect-[3/4] rounded-2xl md:rounded-3xl mb-4 md:mb-8 overflow-hidden glass-card shimmer-border relative flex items-center justify-center p-3 md:p-10 transition-all duration-700 ${isUnavailable ? 'opacity-50 grayscale pointer-events-none' : 'group-hover:-translate-y-2'}`}>
                        {/* Unavailable Badge */}
                        {isUnavailable && (
                          <div className="absolute top-2 left-2 md:top-4 md:left-4 z-30 bg-red-500 text-white text-[7px] md:text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-1 md:px-4 md:py-1.5 rounded-full shadow-lg pointer-events-auto leading-none text-center">
                            {t('labels.unavailable')}
                          </div>
                        )}

                        {/* Discount Badge */}
                        {!isUnavailable && product.discount > 0 && (
                          <div className="absolute top-2 left-2 md:top-4 md:left-4 z-30 bg-red-600 text-white text-[7px] md:text-[10px] font-black tracking-widest px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl shadow-lg animate-pulse uppercase leading-none">
                            -{product.discount}% <span className="hidden md:inline">{t('labels.off')}</span>
                          </div>
                        )}

                        {/* Wishlist Button — hidden for unavailable */}
                        {!isUnavailable && (
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
                            className="absolute top-2 right-2 md:top-4 md:right-4 z-20 w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 backdrop-blur-md flex items-center justify-center transition-all active:scale-90 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[14px] md:text-[1.1rem]" style={isInWishlist(product.id) ? { fontVariationSettings: "'FILL' 1", color: '#ef4444' } : { color: 'var(--color-on-surface)' }}>
                              favorite
                            </span>
                          </button>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <img 
                          alt={product.title} 
                          className={`w-full h-full object-contain filter drop-shadow-xl transition-transform duration-1000 ${isUnavailable ? '' : 'group-hover:scale-110'}`}
                          src={product.image}
                          loading="lazy"
                          decoding="async"
                        />
                        
                        {/* Quick Add — hidden for unavailable */}
                        {!isUnavailable && (
                          <div className="quick-add absolute bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-4 opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                            <button 
                              onClick={(e) => handleQuickAdd(e, product)}
                              className="w-full brushed-metal-cta text-white py-2 md:py-3 rounded-xl md:rounded-2xl font-bold tracking-widest md:tracking-[0.2em] text-[8px] md:text-[10px] uppercase shadow-2xl flex items-center justify-center gap-1 md:gap-2"
                            >
                              <span className="material-symbols-outlined text-[10px] md:text-sm">shopping_bag</span>
                              <span className="hidden md:inline">{t('cart.quick_add')}</span>
                              <span className="md:hidden">Add</span>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className={`text-center px-1 md:px-0 ${isUnavailable ? 'opacity-50' : ''}`}>
                        <span className="text-[7px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-secondary font-bold block mb-1 truncate">{typeof product.type === 'object' ? (product.type?.en || '') : (product.type || t('labels.perfume'))}</span>
                        <h2 className={`font-headline text-sm md:text-2xl text-on-surface mb-1 md:mb-2 leading-tight truncate ${isUnavailable ? '' : 'group-hover:text-secondary transition-colors'}`}>{product.title}</h2>
                        <p className="text-on-surface-variant font-light text-xs md:text-lg">
                          {product.discount > 0 ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="text-stone-400 text-sm line-through decoration-red-500/30 font-medium">
                                {Number(product.price).toLocaleString()} DZD
                              </span>
                              <span className="font-headline font-bold text-[#1a1c1d]">
                                {Math.floor(Number(product.price) * (1 - product.discount / 100)).toLocaleString()} DZD
                              </span>
                            </span>
                          ) : (
                            <>{Number(product.price || 0).toLocaleString()} DZD</>
                          )}
                        </p>
                      </div>
                    </CardWrapper>
                    );
                  })}
                </div>

                {/* Load More Section */}
                {hasMore && (
                  <div className="mt-24 flex flex-col items-center gap-6">
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 6)}
                      className="px-12 py-4 rounded-full glass-effect shimmer-border text-on-surface font-semibold tracking-widest text-sm hover:shadow-[0_0_20px_rgba(115,92,0,0.2)] transition-all flex items-center gap-3 active:scale-95 duration-300"
                    >
                      {t('shop.explore_more')}
                      <span className="material-symbols-outlined">expand_more</span>
                    </button>
                    <p className="text-stone-400 text-xs font-body tracking-wider">
                      {t('shop.showing', { count: visibleProducts.length, total: filteredProducts.length }).toUpperCase()}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </>
        )}
      </main>
      <Footer />
    </div>
  )
}