import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Truck, Check, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import SHIPPING_PROVIDERS from '../services/shippingConfig';
import { useTranslation } from 'react-i18next';

export default function TrackOrder() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language.startsWith('ar-');
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [orderResult, setOrderResult] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim()) {
      setError(t('tracking.err_input'));
      return;
    }

    setIsSearching(true);
    setError('');
    setOrderResult(null);

    try {
      const formattedOrderId = orderId.startsWith('#') ? orderId.substring(1) : orderId;
      const q = query(collection(db, 'orders'), where('id', '==', formattedOrderId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError(t('tracking.err_not_found'));
        setIsSearching(false);
        return;
      }

      const orderData = querySnapshot.docs[0].data();
      
      // Verify phone number (basic normalization)
      const inputPhone = phone.replace(/\D/g, '');
      const savedPhone = (orderData.shipping?.phone || orderData.phone || '').replace(/\D/g, '');

      if (inputPhone !== savedPhone && inputPhone.slice(-9) !== savedPhone.slice(-9)) {
        setError(t('tracking.err_mismatch'));
        setIsSearching(false);
        return;
      }

      setOrderResult(orderData);
    } catch (err) {
      console.error(err);
      setError(t('tracking.err_server'));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] pt-32 pb-20 px-4 md:px-8 font-noto-serif">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-[#1a1c1d] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#1a1c1d]/10">
             <Package size={28} className="text-[#d4b560]" />
          </div>
          <h1 className="text-4xl md:text-5xl text-[#1a1c1d] mb-4">{t('tracking.title')}</h1>
          <p className="text-[#a69b91] font-medium max-w-md mx-auto leading-relaxed">
            {t('tracking.desc')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-8 bg-white/80 rounded-[40px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] mb-8 border border-white/50"
        >
          <form onSubmit={handleSearch} className="space-y-6">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isRTL ? 'text-right' : ''}`}>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2 ps-1">{t('tracking.order_id')}</label>
                <div className="relative">
                  <Package className={`absolute top-1/2 -translate-y-1/2 text-[#d1cdca] ${isRTL ? 'right-4' : 'left-4'}`} size={18} />
                  <input
                    type="text"
                    placeholder={t('tracking.order_id_ph')}
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className={`w-full bg-[#f9f9fb] border border-transparent focus:border-[#826a11]/30 rounded-2xl py-4 text-sm text-[#1a1c1d] focus:outline-none transition-all placeholder:text-[#d1cdca] focus:bg-white focus:shadow-[0_4px_20px_rgba(130,106,17,0.05)] ${isRTL ? 'pe-12 ps-4 text-right' : 'ps-12 pe-4'}`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2 ps-1">{t('tracking.phone')}</label>
                <div className="relative">
                  <span className={`absolute top-1/2 -translate-y-1/2 text-[#d1cdca] font-mono text-sm ${isRTL ? 'right-4' : 'left-4'}`}>+213</span>
                  <input
                    type="tel"
                    placeholder={t('tracking.phone_ph')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full bg-[#f9f9fb] border border-transparent focus:border-[#826a11]/30 rounded-2xl py-4 text-sm text-[#1a1c1d] focus:outline-none transition-all placeholder:text-[#d1cdca] focus:bg-white focus:shadow-[0_4px_20px_rgba(130,106,17,0.05)] ${isRTL ? 'pe-16 ps-4 text-right' : 'ps-16 pe-4'}`}
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start font-medium ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                >
                  <AlertCircle size={16} className={`${isRTL ? 'ms-2' : 'me-2'} mt-0.5 shrink-0`} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-4 bg-[#1a1c1d] text-white rounded-2xl text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#826a11] transition-all flex items-center justify-center shadow-lg shadow-[#1a1c1d]/10 disabled:opacity-70 group"
            >
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search size={16} className={`${isRTL ? 'ms-2' : 'me-2'} group-hover:scale-110 transition-transform`} /> {t('tracking.button')}
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {orderResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[40px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-[#e2e2e4]/50"
            >
              <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-8 border-b border-[#eeeef0] ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91] mb-1">{t('tracking.status')}</p>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h2 className="text-3xl text-[#1a1c1d]">{t(`admin.dashboard.status.${(orderResult.status || 'processing').toLowerCase()}`, { defaultValue: orderResult.status || 'Processing' })}</h2>
                    <span className={`w-3 h-3 rounded-full ${
                      orderResult.status === 'Delivered' ? 'bg-[#21804f] shadow-[0_0_12px_rgba(33,128,79,0.4)]' :
                      orderResult.status === 'Cancelled' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]' :
                      orderResult.status === 'Shipped' ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]' :
                      'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                    }`} />
                  </div>
                </div>
                <div className={`text-start ${isRTL ? 'md:text-left' : 'md:text-end'}`}>
                   <p className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91] mb-1">{t('tracking.date')}</p>
                   <p className="text-sm font-bold text-[#1a1c1d]">{orderResult.date || 'N/A'}</p>
                </div>
              </div>

              {orderResult.status === 'Shipped' && orderResult.trackingNumber && (
                <div className="mb-8 p-6 bg-[#f9f9fb] rounded-3xl border border-[#e2e2e4]">
                   <div className={`flex items-center mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm ${isRTL ? 'ms-4' : 'me-4'}`}>
                         <Truck size={18} className="text-[#826a11]" />
                      </div>
                      <div className={isRTL ? 'text-right' : ''}>
                         <p className="text-xs font-bold text-[#1a1c1d]">{orderResult.shippingService || t('tracking.carrier')}</p>
                         <p className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91]">{t('tracking.tracking_no')}: <span className="text-[#826a11] font-mono">{orderResult.trackingNumber}</span></p>
                      </div>
                   </div>
                   
                   {(() => {
                     const pUrl = Object.values(SHIPPING_PROVIDERS).find(p => p.title === orderResult.shippingService)?.trackingUrl;
                     if (pUrl) {
                       return (
                         <a 
                           href={pUrl} 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex w-full items-center justify-center py-3.5 bg-[#1a1c1d] text-white rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-[#826a11] transition-all shadow-md group"
                         >
                          {t('tracking.track_website')}
                        </a>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              <div>
                <p className={`text-[10px] uppercase tracking-widest font-bold text-[#a69b91] mb-4 ${isRTL ? 'text-right' : ''}`}>{t('tracking.items')}</p>
                <div className="space-y-4">
                  {orderResult.items?.map((item, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-4 bg-[#f9f9fb] rounded-2xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                       <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm shrink-0">
                            {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-3 text-[#d1cdca]" />}
                          </div>
                          <div className={isRTL ? 'text-right' : ''}>
                            <p className="text-sm font-bold text-[#1a1c1d]">{item.title}</p>
                            <p className="text-[10px] text-[#a69b91] tracking-wider uppercase font-bold">{typeof item.type === 'object' ? (item.type?.en || '') : (item.type || '')} • {item.size}</p>
                          </div>
                       </div>
                       <p className="text-sm font-bold text-[#5f5e5e]">x{item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
