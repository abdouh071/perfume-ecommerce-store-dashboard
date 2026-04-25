import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useWishlist } from '../context/WishlistContext';
import { useProducts } from '../context/ProductContext';
import algeriaWilayas from '../data/algeria_wilayas.json';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_COLORS = {
  'Processing': 'bg-blue-100 text-blue-700',
  'Dispatched': 'bg-yellow-100 text-yellow-700',
  'Delivered': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-red-100 text-red-700',
  'Incomplete': 'bg-neutral-100 text-neutral-700'
};

export default function Profile() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { currentUser, userProfile, logout, updateUserShipping } = useAuth();
  const { orders, incompleteOrders, loading: ordersLoading } = useOrders();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { products } = useProducts();

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [shippingForm, setShippingForm] = useState(userProfile?.shipping || {
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'DZ',
    wilayaCode: '',
    commune: '',
    communeId: ''
  });

  const myOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(o => o.userId === currentUser.uid);
  }, [orders, currentUser]);

  const myIncomplete = useMemo(() => {
    if (!currentUser) return [];
    return incompleteOrders.filter(o => o.userId === currentUser.uid);
  }, [incompleteOrders, currentUser]);

  const myWishlist = useMemo(() => {
    if (!wishlistItems || !Array.isArray(wishlistItems)) return [];
    const wishlistIds = wishlistItems.map(item => typeof item === 'object' ? item.id : item);
    return products.filter(p => wishlistIds.includes(p.id));
  }, [wishlistItems, products]);

  const selectedWilayaCommunes = useMemo(() => {
    if (shippingForm.country !== 'DZ' || !shippingForm.wilayaCode) return [];
    const wilaya = algeriaWilayas.find(w => w.code === shippingForm.wilayaCode);
    return wilaya ? wilaya.communes : [];
  }, [shippingForm.wilayaCode, shippingForm.country]);

  // Sync shipping form with profile data
  useEffect(() => {
    if (userProfile?.shipping) {
      setShippingForm(userProfile.shipping);
    }
  }, [userProfile]);

  // Protect route
  useEffect(() => {
    if (!currentUser && !ordersLoading) {
      navigate('/login');
    }
  }, [currentUser, navigate, ordersLoading]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    if (name === 'wilayaCode') {
      const wilaya = algeriaWilayas.find(w => w.code === value);
      setShippingForm(prev => ({
        ...prev,
        wilayaCode: value,
        state: wilaya ? wilaya.name : '',
        commune: '',
        communeId: '',
        city: '',
      }));
    } else if (name === 'communeId') {
      const communeObj = selectedWilayaCommunes.find(c => c.id === value);
      setShippingForm(prev => ({ 
        ...prev, 
        communeId: value, 
        commune: communeObj ? communeObj.name : '',
        city: communeObj ? communeObj.name : '' 
      }));
    } else {
      setShippingForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveShipping = async () => {
    try {
      await updateUserShipping(shippingForm);
      setIsEditingAddress(false);
    } catch (err) {
      console.error(err);
      alert(t('profile.overview.fail_save'));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const InputField = ({ label, name, value, onChange, disabled }) => (
    <div className="flex flex-col">
      <label className="font-label text-[10px] uppercase tracking-widest text-[#a69b91] mb-2">{label}</label>
      <input
        type="text"
        name={name}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-surface-container-low border border-[#e2e2e4] rounded-2xl px-4 py-3.5 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] focus:border-[#826a11] outline-none transition-all disabled:opacity-50"
      />
    </div>
  );

  return (
    <>
      <Navbar />
      <main className={`min-h-screen bg-surface pt-32 pb-24 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="bg-white rounded-3xl p-8 border border-outline-variant/30 sticky top-32 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-yellow-700/10 text-yellow-700 flex items-center justify-center font-bold text-2xl">
                  {(userProfile?.firstName?.[0] || currentUser.email?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <h2 className="font-headline text-lg text-on-surface truncate">
                    {userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : t('nav.account')}
                  </h2>
                  <p className="text-xs text-on-surface-variant truncate">{currentUser.email}</p>
                </div>
              </div>

              <nav className="flex flex-col gap-2">
                {[
                  { id: 'overview', label: t('profile.sidebar.overview'), icon: 'person' },
                  { id: 'orders', label: t('profile.sidebar.orders'), icon: 'shopping_bag' },
                  { id: 'wishlist', label: t('profile.sidebar.wishlist'), icon: 'favorite' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-5 py-4 rounded-xl font-label text-xs uppercase tracking-widest transition-all ${
                      activeTab === tab.id 
                        ? 'bg-[#1a1c1d] text-white shadow-md' 
                        : 'text-[#5f5e5e] hover:bg-neutral-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-outline-variant/30">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-5 py-4 w-full rounded-xl font-label text-xs uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  {t('profile.sidebar.logout')}
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
              {ordersLoading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-outline-variant/30">
                  <LoadingSpinner fullScreen={false} />
                  <p className="font-label text-[10px] uppercase tracking-widest text-[#a69b91]">Loading your data...</p>
                </div>
              ) : (
              <AnimatePresence mode="wait">

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                   <h1 className="font-headline text-3xl mb-8 border-b border-outline-variant/30 pb-4">{t('profile.title')}</h1>
                  
                  <div className="bg-white rounded-3xl p-8 border border-outline-variant/30 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-headline text-xl">{t('profile.overview.shipping_title')}</h3>
                      <button 
                        onClick={() => setIsEditingAddress(!isEditingAddress)}
                        className="text-xs font-bold uppercase tracking-widest text-[#826a11] hover:underline"
                      >
                        {isEditingAddress ? t('profile.overview.cancel') : t('profile.overview.edit')}
                      </button>
                    </div>

                    {isEditingAddress ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputField label={t('checkout.address1')} name="address1" value={shippingForm.address1} onChange={handleShippingChange} />
                          <InputField label={t('checkout.address2')} name="address2" value={shippingForm.address2} onChange={handleShippingChange} />
                          <InputField label={t('checkout.zip')} name="zip" value={shippingForm.zip} onChange={handleShippingChange} />
                        </div>

                        {shippingForm.country === 'DZ' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <label className="font-label text-[10px] uppercase tracking-widest text-[#a69b91] mb-2">{t('checkout.state')}</label>
                              <select
                                name="wilayaCode"
                                value={shippingForm.wilayaCode}
                                onChange={handleShippingChange}
                                className="w-full bg-surface-container-low border border-[#e2e2e4] rounded-2xl px-4 py-3.5 text-sm outline-none font-body"
                              >
                                <option value="">{t('checkout.state')}</option>
                                {algeriaWilayas.map(w => <option key={w.code} value={w.code}>{w.code} - {w.name}</option>)}
                              </select>
                            </div>
                            <div className="flex flex-col">
                              <label className="font-label text-[10px] uppercase tracking-widest text-[#a69b91] mb-2">{t('checkout.city')}</label>
                              <select
                                name="communeId"
                                value={shippingForm.communeId}
                                onChange={handleShippingChange}
                                disabled={!shippingForm.wilayaCode}
                                className="w-full bg-surface-container-low border border-[#e2e2e4] rounded-2xl px-4 py-3.5 text-sm outline-none font-body disabled:opacity-50"
                              >
                                <option value="">{t('checkout.city')}</option>
                                {selectedWilayaCommunes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                          </div>
                        )}

                        <div className="pt-4 flex justify-end">
                          <button
                            onClick={handleSaveShipping}
                            className="bg-[#1a1c1d] text-white px-8 py-3 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-[#826a11] transition-all focus:scale-95"
                          >
                            {t('profile.overview.save_address')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-body text-[#5f5e5e] leading-relaxed">
                        {userProfile?.shipping?.address1 ? (
                          <>
                            {userProfile.shipping.address1}<br />
                            {userProfile.shipping.address2 && <>{userProfile.shipping.address2}<br /></>}
                            {userProfile.shipping.city || ''}, {userProfile.shipping.state || ''} {userProfile.shipping.zip || ''}<br />
                            {userProfile.shipping.country || ''}
                          </>
                        ) : (
                          <span className="italic text-neutral-400">{t('profile.overview.no_address')}</span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <h1 className="font-headline text-3xl mb-8 border-b border-outline-variant/30 pb-4">{t('profile.orders.title')}</h1>

                  {myOrders.length === 0 && myIncomplete.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-outline-variant/30 shadow-sm">
                      <span className="material-symbols-outlined text-6xl text-outline-variant mb-4 opacity-50">inventory_2</span>
                      <h3 className="font-headline text-xl mb-2">{t('profile.orders.empty_title')}</h3>
                      <p className="text-on-surface-variant font-body mb-6">{t('profile.orders.empty_desc')}</p>
                      <Link to="/shop" className="bg-[#1a1c1d] text-white px-8 py-4 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-[#826a11] transition-all">{t('profile.orders.start_shopping')}</Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Live Orders First */}
                      {myOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-sm overflow-hidden relative group">
                          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/20 pb-4 mb-4 gap-4">
                            <div>
                              <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">{t('profile.orders.order_id')}{order.id}</p>
                              <p className="font-body text-sm text-on-surface-variant">{order.date}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${STATUS_COLORS[order.status] || STATUS_COLORS['Processing']}`}>
                                {order.status}
                              </span>
                              <span className="font-headline text-lg">{order.total}</span>
                            </div>
                          </div>

                          {/* Items Preview */}
                          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {(order?.items || []).map((item, idx) => (
                              <div key={`${order.id}-item-${idx}`} className="flex-shrink-0 flex gap-4 w-64 bg-surface-container-low p-3 rounded-2xl">
                                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0">
                                  {item?.image && <img src={item.image} alt={item?.title || 'Product'} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex flex-col justify-center min-w-0">
                                  <p className="font-headline text-sm truncate">{item?.title || 'Unknown Product'}</p>
                                  <p className="text-xs text-on-surface-variant">Qty: {item?.quantity || 0} | {item?.volume || ''}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Incomplete Orders */}
                      {myIncomplete.map(order => (
                        <div key={order.id} className="bg-white/50 rounded-3xl p-6 border border-dashed border-outline-variant/50 relative group">
                          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/20 pb-4 mb-4 gap-4">
                            <div>
                              <p className="text-[10px] uppercase font-bold tracking-widest text-[#826a11] mb-1">{t('profile.orders.incomplete')}</p>
                              <p className="font-body text-sm text-on-surface-variant">{t('profile.orders.last_updated')}: {order.lastUpdated}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-neutral-100 text-neutral-600">{t('profile.orders.pending')}</span>
                              <Link to={`/checkout?resume=${order.id}`} className="text-xs font-bold uppercase tracking-widest text-white bg-[#826a11] px-5 py-2.5 rounded-full hover:brightness-110">{t('profile.orders.resume')}</Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* WISHLIST TAB */}
              {activeTab === 'wishlist' && (
                <motion.div
                  key="wishlist"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h1 className="font-headline text-3xl mb-8 border-b border-outline-variant/30 pb-4">{t('profile.wishlist.title')}</h1>

                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-outline-variant/30 shadow-sm">
                      <span className="material-symbols-outlined text-6xl text-outline-variant mb-4 opacity-50">favorite</span>
                      <h3 className="font-headline text-xl mb-2">{t('profile.wishlist.empty_title')}</h3>
                      <p className="text-on-surface-variant font-body mb-6">{t('profile.wishlist.empty_desc')}</p>
                      <Link to="/shop" className="bg-[#1a1c1d] text-white px-8 py-4 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-[#826a11] transition-all">{t('profile.wishlist.discover')}</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {wishlistItems.map(product => (
                        <div key={product.id} className="group relative bg-white rounded-3xl overflow-hidden border border-outline-variant/30 shadow-sm hover:shadow-xl transition-all duration-300">
                          <button
                            onClick={() => removeFromWishlist(product.id)}
                            className="absolute z-10 top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                          
                          <Link to={`/product/${product.id}`} className="block aspect-[4/5] bg-surface-container overflow-hidden">
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          </Link>
                          
                          <div className="p-4">
                            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-secondary mb-1">{product?.type || ''}</p>
                            <h3 className="font-headline text-sm mb-2 truncate">{product?.title || 'Unknown'}</h3>
                            <p className="font-body text-xs text-on-surface-variant font-semibold">{Number(product?.price || 0).toLocaleString()} DZD</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
