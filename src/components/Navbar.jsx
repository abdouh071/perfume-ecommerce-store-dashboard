import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const languages = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'ar', label: 'AR', name: 'العربية' },
    { code: 'fr', label: 'FR', name: 'Français' }
  ];

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-[10px] font-bold tracking-widest text-neutral-800 dark:text-neutral-200"
      >
        <span className="material-symbols-outlined text-sm opacity-60">language</span>
        {currentLanguage.label}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 min-w-[120px] glass-card rounded-2xl border border-white/30 shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 text-start text-[11px] font-bold tracking-widest uppercase transition-colors ${
                i18n.language === lang.code 
                  ? 'bg-yellow-700/10 text-yellow-700' 
                  : 'text-neutral-600 hover:bg-white/10 dark:text-neutral-400'
              }`}
            >
              {lang.name}
              {i18n.language === lang.code && (
                <span className="material-symbols-outlined text-xs">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displaySearchQuery, setDisplaySearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const { setIsCartOpen, items, storeSettings } = useCart();
  const { wishlistCount } = useWishlist();
  const { products: PRODUCTS } = useProducts();
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const { currentUser, logout, userProfile } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const desktopMenuRef = useRef(null);

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(displaySearchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [displaySearchQuery]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const results = PRODUCTS.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.type || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.notes || []).some(n => n.toLowerCase().includes(q)) ||
        (p.fragranceFamily || '').toLowerCase().includes(q)
      ).slice(0, 5);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, PRODUCTS]);

  // Auto-focus search input
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close search and user menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
        setSearchQuery('');
        setDisplaySearchQuery('');
      }
      const isOutsideMobile = !userMenuRef.current || !userMenuRef.current.contains(e.target);
      const isOutsideDesktop = !desktopMenuRef.current || !desktopMenuRef.current.contains(e.target);
      
      if (isOutsideMobile && isOutsideDesktop) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSearchQuery('');
        setDisplaySearchQuery('');
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const handleSearchSelect = (productId) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setDisplaySearchQuery('');
    navigate(`/product/${productId}`);
  };

  // Pre-fetch functions for smoother navigation
  const prefetch = (path) => {
    switch (path) {
      case '/': import('../pages/Home'); break;
      case '/shop': import('../pages/AllProducts'); break;
      case '/about': import('../pages/AboutUs'); break;
      case '/contact': import('../pages/ContactUs'); break;
      case '/wishlist': import('../pages/Wishlist'); break;
      case '/profile': import('../pages/Profile'); break;
      default: break;
    }
  };

  const isRTL = i18n.language === 'ar';

  const navLinkClass = (path) =>
    `${isActive(path) ? 'text-yellow-700 dark:text-yellow-500 font-semibold' : 'text-neutral-500 dark:text-neutral-400'} hover:text-yellow-700 transition-colors duration-300 whitespace-nowrap`;

  return (
    <>
      <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} xmlns="http://www.w3.org/2000/svg">  
        <filter id="glass-blur" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">  
          <feTurbulence type="fractalNoise" baseFrequency="0.003 0.007" numOctaves="1" result="turbulence" />  
          <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="200" xChannelSelector="R" yChannelSelector="G" />  
        </filter>  
      </svg>

      <nav className="fixed top-4 inset-x-0 mx-auto w-[95%] max-w-7xl z-[110] transition-all duration-300 group">
        
        {/* Liquid Glass Background Layers */}
        <div className="absolute inset-0 backdrop-blur-[3px] rounded-2xl [filter:url(#glass-blur)] -z-[3]" />
        <div className="absolute inset-0 rounded-2xl shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-[2]" />
        <div className="absolute inset-0 rounded-2xl shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] dark:shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.1),inset_-3px_-3px_3px_0_rgba(255,255,255,0.1)] -z-[1]" />

        <div className="w-full flex items-center justify-between px-4 md:px-8 py-4 relative z-10">
          
          {/* MOBILE LEFT: Search & Profile */}
          <div className="flex md:hidden items-center gap-4 flex-1">
            {/* Mobile Search Button */}
            <div ref={searchContainerRef} className="relative">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-neutral-700 dark:text-neutral-200 hover:text-yellow-700 transition-all active:opacity-80 active:scale-95"
              >
                <span className="material-symbols-outlined outline-none">search</span>
              </button>

              {/* Search Dropdown */}
              {isSearchOpen && (
                <div className="fixed top-20 inset-x-0 mx-auto w-[90vw] glass-card rounded-2xl border border-white/30 shadow-2xl overflow-hidden z-[100]">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                      <span className="material-symbols-outlined text-neutral-400 text-xl">search</span>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={displaySearchQuery}
                        onChange={(e) => setDisplaySearchQuery(e.target.value)}
                        placeholder={t('nav.search', 'Search fragrances...')}
                        className="bg-transparent border-none outline-none text-neutral-900 drop-shadow-sm placeholder:drop-shadow-none placeholder:text-neutral-700 placeholder:font-medium w-full text-sm font-body font-medium"
                      />
                      {displaySearchQuery && (
                        <button onClick={() => setDisplaySearchQuery('')} className="text-neutral-400 hover:text-neutral-600">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search Results */}
                  <div className="max-h-[300px] overflow-y-auto">
                    {searchQuery.trim() && searchResults.length === 0 && (
                      <div className="p-6 text-center text-neutral-800 font-body text-sm font-medium">
                        {t('nav.no_results')} "{searchQuery}"
                      </div>
                    )}
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSearchSelect(product.id)}
                        className={`w-full flex items-center gap-4 p-4 hover:bg-white/10 transition-colors ${isRTL ? 'text-end' : 'text-start'}`}
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-low shrink-0">
                          <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-700 font-bold">{typeof product.type === 'object' ? (product.type?.en || '') : (product.type || '')}</p>
                          <h4 className="font-headline text-base text-neutral-900 truncate">{product.title}</h4>
                          <p className="text-sm text-neutral-600">{product.price.toLocaleString()} DZD</p>
                        </div>
                      </button>
                    ))}
                    {!searchQuery.trim() && (
                      <div className="p-6 text-center text-neutral-800 font-body text-sm font-medium">
                        {t('nav.start_typing')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Profile Dropdown Wrapper */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="text-neutral-700 dark:text-neutral-200 hover:text-yellow-700 transition-all active:opacity-80 active:scale-95 flex items-center justify-center w-8 h-8 rounded-full border border-transparent"
              >
                {currentUser && userProfile ? (
                  <span className="font-bold text-xs uppercase bg-yellow-700/10 text-yellow-700 w-full h-full flex items-center justify-center rounded-full border border-yellow-700/20">
                    {userProfile?.firstName?.[0] || currentUser.email?.[0] || 'U'}
                  </span>
                ) : (
                  <span className="material-symbols-outlined outline-none">person</span>
                )}
              </button>
              
              {/* Profile Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute top-full left-0 mt-3 min-w-[180px] glass-card rounded-2xl border border-white/30 shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  {currentUser ? (
                    <>
                      <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                        <p className="text-xs font-bold text-on-surface truncate">{userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : currentUser.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-start text-[11px] font-bold tracking-widest uppercase transition-colors text-neutral-600 hover:bg-white/10 border-b border-white/5">
                        <span className="material-symbols-outlined text-sm">person</span> My Profile
                      </Link>
                      {['admin', 'manager', 'confirmer'].includes(userProfile?.role) && (
                        <Link to="/admin" onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-start text-[11px] font-bold tracking-widest uppercase transition-colors text-neutral-600 hover:bg-white/10 border-b border-white/5">
                          <span className="material-symbols-outlined text-sm">admin_panel_settings</span> Dashboard
                        </Link>
                      )}
                    </>
                  ) : (
                    <Link to="/login" onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-start text-[11px] font-bold tracking-widest uppercase transition-colors text-neutral-600 hover:bg-white/10 border-b border-white/5">
                      <span className="material-symbols-outlined text-sm">login</span> Sign In
                    </Link>
                  )}
                  <Link to="/wishlist" onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors text-neutral-600 hover:bg-white/10 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-sm" style={wishlistCount > 0 ? { color: '#ef4444', fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
                      Wishlist
                    </div>
                    {wishlistCount > 0 && (
                      <span className="bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{wishlistCount}</span>
                    )}
                  </Link>
                  {currentUser && (
                    <button
                      onClick={async () => {
                        await logout();
                        setIsUserMenuOpen(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-start text-[11px] font-bold tracking-widest uppercase transition-colors text-red-500 hover:bg-red-50"
                    >
                      Logout <span className="material-symbols-outlined text-sm">logout</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LOGO - Centered implicitly on mobile, left on desktop */}
          <div className="flex-1 md:flex hidden items-center">
            <Link 
              to="/" 
              onClick={() => {
                setIsMenuOpen(false);
                setIsSearchOpen(false);
                setIsUserMenuOpen(false);
                window.scrollTo(0, 0);
              }}
              className="text-2xl font-bold tracking-tighter text-neutral-800 dark:text-neutral-100 font-headline whitespace-nowrap"
            >
              {storeSettings?.storeName || "L'Essence"}
            </Link>
          </div>

          <Link 
            to="/" 
            onClick={() => {
              setIsMenuOpen(false);
              setIsSearchOpen(false);
              setIsUserMenuOpen(false);
              window.scrollTo(0, 0);
            }}
            className="text-2xl font-bold tracking-tighter text-neutral-800 dark:text-neutral-100 font-headline absolute left-1/2 -translate-x-1/2 md:hidden whitespace-nowrap"
          >
            {storeSettings?.storeName || "L'Essence"}
          </Link>
          
          {/* DESKTOP LINKS - Perfectly centered */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-8 font-headline text-sm tracking-widest uppercase">
            <Link onMouseEnter={() => prefetch('/')} className={navLinkClass('/')} to="/">{t('nav.home')}</Link>
            <Link onMouseEnter={() => prefetch('/shop')} className={navLinkClass('/shop')} to="/shop">{t('nav.shop')}</Link>

            <Link onMouseEnter={() => prefetch('/about')} className={navLinkClass('/about')} to="/about">{t('nav.about')}</Link>
            <Link onMouseEnter={() => prefetch('/contact')} className={navLinkClass('/contact')} to="/contact">{t('nav.contact')}</Link>
          </div>

          {/* DESKTOP RIGHT (Search, User, Cart) & MOBILE RIGHT (Cart, Burger) */}
          <div className="flex items-center justify-end flex-1 gap-6">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Desktop Search */}
            <div className="hidden md:block relative">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-neutral-700 dark:text-neutral-200 hover:text-yellow-700 transition-all active:opacity-80 active:scale-95"
              >
                <span className="material-symbols-outlined outline-none">search</span>
              </button>
              {isSearchOpen && (
                <div className="absolute top-12 right-0 w-[400px] glass-card rounded-2xl border border-white/30 shadow-2xl overflow-hidden z-[100]">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                      <span className="material-symbols-outlined text-neutral-400 text-xl">search</span>
                      <input
                        autoFocus
                        type="text"
                        value={displaySearchQuery}
                        onChange={(e) => setDisplaySearchQuery(e.target.value)}
                        placeholder={t('nav.search', 'Search fragrances...')}
                        className="bg-transparent border-none outline-none text-neutral-900 drop-shadow-sm placeholder:drop-shadow-none placeholder:text-neutral-700 placeholder:font-medium w-full text-sm font-body font-medium"
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {searchQuery.trim() && searchResults.length === 0 && (
                      <div className="p-6 text-center text-neutral-800 font-body text-sm font-medium">
                        {t('nav.no_results')} "{searchQuery}"
                      </div>
                    )}
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSearchSelect(product.id)}
                        className={`w-full flex items-center gap-4 p-4 hover:bg-white/10 transition-colors ${isRTL ? 'text-end' : 'text-start'}`}
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-low shrink-0">
                          <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-700 font-bold">{typeof product.type === 'object' ? (product.type?.en || '') : (product.type || '')}</p>
                          <h4 className="font-headline text-base text-neutral-900 truncate">{product.title}</h4>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Profile Wrapper */}
            <div 
              className="hidden md:block relative"
              ref={desktopMenuRef}
              onMouseEnter={() => setIsUserMenuOpen(true)}
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="text-neutral-700 dark:text-neutral-200 hover:text-yellow-700 transition-all active:opacity-80 active:scale-95 flex items-center justify-center w-8 h-8 rounded-full border border-transparent"
              >
                {currentUser && userProfile ? (
                  <span className="font-bold text-xs uppercase bg-yellow-700/10 text-yellow-700 w-full h-full flex items-center justify-center rounded-full border border-yellow-700/20">
                    {userProfile?.firstName?.[0] || currentUser.email?.[0] || 'U'}
                  </span>
                ) : (
                  <span className="material-symbols-outlined outline-none">person</span>
                )}
              </button>
              {isUserMenuOpen && (
                <div className="absolute top-full right-0 pt-3 z-[100]">
                  <div className="min-w-[180px] glass-card rounded-2xl border border-white/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {currentUser ? (
                    <>
                      <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                        <p className="text-xs font-bold text-on-surface truncate">{userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : currentUser.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors text-neutral-600 hover:bg-white/10 border-b border-white/5">
                        <span className="material-symbols-outlined text-sm">person</span> My Profile
                      </Link>
                      {['admin', 'manager', 'confirmer'].includes(userProfile?.role) && (
                        <Link to="/admin" onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-start text-[11px] font-bold tracking-widest uppercase transition-colors text-neutral-600 hover:bg-white/10 border-b border-white/5">
                          <span className="material-symbols-outlined text-sm">admin_panel_settings</span> Dashboard
                        </Link>
                      )}
                    </>
                  ) : (
                    <Link to="/login" onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors text-neutral-600 hover:bg-white/10 border-b border-white/5">
                      <span className="material-symbols-outlined text-sm">login</span> Sign In
                    </Link>
                  )}
                  {currentUser && (
                    <button
                      onClick={async () => {
                        await logout();
                        setIsUserMenuOpen(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors text-red-500 hover:bg-red-50"
                    >
                      Logout <span className="material-symbols-outlined text-sm">logout</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Wishlist Button */}
            <Link 
              onMouseEnter={() => prefetch('/wishlist')}
              to="/wishlist" 
              className="hidden md:flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:text-yellow-700 transition-all active:opacity-80 active:scale-95 relative"
            >
              <span className="material-symbols-outlined outline-none" style={wishlistCount > 0 ? { color: '#ef4444', fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-label font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button (Always visible) */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="text-neutral-700 dark:text-neutral-200 hover:text-yellow-700 transition-all active:opacity-80 active:scale-95 relative"
            >
              <span className="material-symbols-outlined outline-none" data-icon="shopping_cart">shopping_cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-white text-[9px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-label font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>
            
            {/* Mobile Burger Menu Button */}
            <button 
              className="md:hidden text-neutral-700 dark:text-neutral-200 hover:text-yellow-700 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="material-symbols-outlined" data-icon={isMenuOpen ? "close" : "menu"}>
                {isMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl pt-32 px-8 flex flex-col gap-6 md:hidden transition-all duration-300">
          <Link className={`text-3xl font-headline ${isActive('/') ? 'text-yellow-700 dark:text-yellow-500 font-bold' : 'text-neutral-800 dark:text-neutral-200'}`} to="/" onClick={() => setIsMenuOpen(false)}>{t('nav.home')}</Link>
          <Link className={`text-3xl font-headline ${isActive('/shop') ? 'text-yellow-700 dark:text-yellow-500 font-bold' : 'text-neutral-800 dark:text-neutral-200'}`} to="/shop" onClick={() => setIsMenuOpen(false)}>{t('nav.shop')}</Link>

          <Link className={`text-3xl font-headline ${isActive('/wishlist') ? 'text-red-500 font-bold' : 'text-neutral-800 dark:text-neutral-200'}`} to="/wishlist" onClick={() => setIsMenuOpen(false)}>{t('nav.wishlist')}</Link>
          <Link className={`text-3xl font-headline ${isActive('/about') ? 'text-yellow-700 dark:text-yellow-500 font-bold' : 'text-neutral-800 dark:text-neutral-200'}`} to="/about" onClick={() => setIsMenuOpen(false)}>{t('nav.about')}</Link>
          <Link className={`text-3xl font-headline ${isActive('/contact') ? 'text-yellow-700 dark:text-yellow-500 font-bold' : 'text-neutral-800 dark:text-neutral-200'}`} to="/contact" onClick={() => setIsMenuOpen(false)}>{t('nav.contact')}</Link>
          
          <div className="mt-auto pb-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-6 px-1">{t('nav.select_language', 'Select Language')}</p>
            <div className="flex gap-4">
              {[
                { code: 'en', label: 'English' },
                { code: 'ar', label: 'العربية' },
                { code: 'fr', label: 'Français' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    setIsMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                    i18n.language === lang.code 
                      ? 'bg-yellow-700 text-white shadow-lg shadow-yellow-700/20 scale-105' 
                      : 'bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
