import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useOrders } from '../context/OrderContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import algeriaWilayas from '../data/algeria_wilayas.json';
import staticShippingRates from '../data/shipping_rates.json';
import { fetchStopDesks } from '../services/shippingService';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const directBuyItem = location.state?.directBuyItem;

  const { items: cartItems, subtotal: cartSubtotal, clearCart, storeSettings } = useCart();
  const items = directBuyItem ? [directBuyItem] : cartItems;
  const subtotal = directBuyItem ? (directBuyItem.price * directBuyItem.quantity) : cartSubtotal;

  const { addToast } = useToast();
  const { addOrder, saveIncompleteOrder, deleteIncompleteOrder } = useOrders();
  const { freeShippingThreshold } = storeSettings;

  const STEPS = [
    t('checkout.steps.cart'),
    t('checkout.steps.shipping'),
    t('checkout.steps.payment')
  ];

  const [currentStep, setCurrentStep] = useState(1); // 0=Cart, 1=Shipping, 2=Payment
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [incompleteId, setIncompleteId] = useState(null);
  const [availableStopDesks, setAvailableStopDesks] = useState([]);
  const [isLoadingStopDesks, setIsLoadingStopDesks] = useState(false);

  const [shipping, setShipping] = useState({
    email: '', phone: '', firstName: '', lastName: '',
    address1: '', address2: '', city: '', state: '', zip: '', country: 'DZ',
    wilayaCode: '', commune: '', communeId: '', 
    isStopDesk: false, stopDeskId: '', stopDeskName: ''
  });

  const { currentUser, userProfile, updateUserShipping } = useAuth();

  // Pre-populate checkout form from user profile (runs once when profile loads)
  useEffect(() => {
    if (userProfile && !shipping.email) {
      const saved = userProfile.shipping || {};
      setShipping(prev => ({
        ...prev,
        firstName: saved.firstName || userProfile.firstName || prev.firstName,
        lastName: saved.lastName || userProfile.lastName || prev.lastName,
        email: saved.email || userProfile.email || currentUser?.email || prev.email,
        phone: saved.phone || userProfile.phone || prev.phone,
        address1: saved.address1 || prev.address1,
        address2: saved.address2 || prev.address2,
        city: saved.city || prev.city,
        state: saved.state || prev.state,
        zip: saved.zip || prev.zip,
        country: saved.country || prev.country,
        wilayaCode: saved.wilayaCode || prev.wilayaCode,
        commune: saved.commune || prev.commune,
        communeId: saved.communeId || prev.communeId,
        isStopDesk: saved.isStopDesk || false,
        stopDeskId: saved.stopDeskId || '',
        stopDeskName: saved.stopDeskName || '',
      }));
    }
  }, [userProfile]);

  // Load Stop-Desks when Wilaya changes and isStopDesk is active
  useEffect(() => {
    async function loadCenters() {
      if (shipping.isStopDesk && shipping.wilayaCode && storeSettings.activeProvider) {
        setIsLoadingStopDesks(true);
        const wilaya = algeriaWilayas.find(w => w.code === shipping.wilayaCode);
        try {
          // Backend will auto-resolve providerKey and credentials securely
          const centers = await fetchStopDesks(null, null, wilaya?.name, shipping.wilayaCode);
          setAvailableStopDesks(centers);
        } catch (e) {
          console.error('Failed to load centers:', e);
        } finally {
          setIsLoadingStopDesks(false);
        }
      }
    }
    loadCenters();
  }, [shipping.isStopDesk, shipping.wilayaCode, storeSettings.activeProvider]);

  // Load synced shipping rates from Firestore (prices from courier API)
  const [liveRates, setLiveRates] = useState(null);
  useEffect(() => {
    async function fetchRates() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'shipping_rates'));
        if (snap.exists() && snap.data().rates?.length > 0) {
          setLiveRates(snap.data().rates);
        }
      } catch (err) {
        console.warn("Failed to fetch live shipping rates:", err);
      }
    }
    fetchRates();
  }, []);

  // Use live rates if available, otherwise fall back to static JSON
  const shippingRates = liveRates || staticShippingRates;

  // Compute the communes for the selected wilaya
  const selectedWilayaCommunes = useMemo(() => {
    if (shipping.country !== 'DZ' || !shipping.wilayaCode) return [];
    const wilaya = algeriaWilayas.find(w => w.code === shipping.wilayaCode);
    return wilaya ? wilaya.communes : [];
  }, [shipping.wilayaCode, shipping.country]);



  const [errors, setErrors] = useState({});

  const shippingCost = useMemo(() => {
    if (subtotal >= (freeShippingThreshold || 40000)) return 0;
    if (!shipping.wilayaCode) return 0;

    const rateEntry = shippingRates.find(r => r.code === shipping.wilayaCode);
    if (!rateEntry) return 700; // Fallback

    const basePrice = shipping.isStopDesk ? rateEntry.desk : rateEntry.home;
    return basePrice;
  }, [subtotal, freeShippingThreshold, shipping.isStopDesk, shipping.wilayaCode, shippingRates]);

  const tax = useMemo(() => subtotal * 0.0, [subtotal]); // No tax for now or adjust as needed
  const total = useMemo(() => subtotal + shippingCost + tax, [subtotal, shippingCost, tax]);

  // Track Incomplete Order
  useEffect(() => {
    if (orderPlaced) return;

    const name = shipping.firstName.trim();
    const phone = shipping.phone.trim();

    if (name && phone) {
      let currentId = incompleteId;
      if (!currentId) {
        currentId = `INC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        setIncompleteId(currentId);
      }

      const timer = setTimeout(() => {
        saveIncompleteOrder(currentId, {
          customer: `${shipping.firstName} ${shipping.lastName}`,
          phone: shipping.phone,
          email: shipping.email,
          items: items,
          shipping: shipping,
          total: total,
          subtotal: subtotal,
          shippingCost: shippingCost,
          status: 'Incomplete',
          userId: currentUser ? currentUser.uid : null
        });
      }, 1000); // 1s debounce

      return () => clearTimeout(timer);
    }
  }, [shipping, items, total, orderPlaced]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    if (name === 'wilayaCode') {
      // When wilaya changes, also set the state name and reset commune
      const wilaya = algeriaWilayas.find(w => w.code === value);
      setShipping(prev => ({
        ...prev,
        wilayaCode: value,
        state: wilaya ? wilaya.name : '',
        commune: '',
        communeId: '',
        city: '',
      }));
    } else if (name === 'communeId') {
      // Find the commune name for the selected ID
      const communeObj = selectedWilayaCommunes.find(c => c.id === value);
      setShipping(prev => ({ 
        ...prev, 
        communeId: value, 
        commune: communeObj ? communeObj.name : '',
        city: communeObj ? communeObj.name : '' 
      }));
    } else if (name === 'country') {
      // Reset address fields when country changes
      setShipping(prev => ({
        ...prev,
        country: value,
        wilayaCode: '', state: '', commune: '', communeId: '', city: '',
      }));
    } else {
      setShipping(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateShipping = () => {
    const newErrors = {};
    if (!shipping.email.trim()) newErrors.email = t('checkout.errors.email_req');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) newErrors.email = t('checkout.errors.email_inv');
    if (!shipping.firstName.trim()) newErrors.firstName = t('checkout.errors.fname_req');
    if (!shipping.lastName.trim()) newErrors.lastName = t('checkout.errors.lname_req');
    if (!shipping.address1.trim()) newErrors.address1 = t('checkout.errors.addr_req');
    if (shipping.country === 'DZ') {
      if (!shipping.wilayaCode) newErrors.state = t('checkout.errors.state_req');
      if (!shipping.communeId) newErrors.city = t('checkout.errors.city_req');
      if (shipping.isStopDesk && !shipping.stopDeskId) newErrors.stopDesk = t('checkout.errors.stopdesk_req', 'Please select a pickup point');
    } else {
      if (!shipping.city.trim()) newErrors.city = t('checkout.errors.city_req');
      if (!shipping.state.trim()) newErrors.state = t('checkout.errors.state_req');
    }
    if (!shipping.zip.trim()) newErrors.zip = t('checkout.errors.zip_req');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToPayment = () => {
    if (validateShipping()) setCurrentStep(2);
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      const orderId = await addOrder({
        customer: `${shipping.firstName} ${shipping.lastName}`,
        email: shipping.email,
        status: 'Pending',
        total: `${total.toLocaleString()} DZD`,
        amount: total,
        subtotal: subtotal,
        shippingCost: shippingCost,
        paymentMethod: t('checkout.cod'),
        items: items,
        shipping: shipping,
        timestamp: Date.now(),
        userId: currentUser ? currentUser.uid : null
      });
      setOrderPlaced(orderId);
      if (!directBuyItem) {
        clearCart();
      }
      if (incompleteId) {
        deleteIncompleteOrder(incompleteId);
      }

      // Auto-save shipping info to user profile for next checkout
      if (currentUser) {
        try {
          await updateUserShipping(shipping);
        } catch (e) {
          // Non-critical — don't block the order confirmation
          console.warn('Could not save shipping to profile:', e);
        }
      }
    } catch (err) {
      console.error(err);
      addToast(t('checkout.errors.order_fail'), 'error');
    }
    
    setIsProcessing(false);
  };

  // Redirect if cart is empty and order not placed
  if (items.length === 0 && !orderPlaced) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-surface pt-32 pb-20">
          <div className="max-w-2xl mx-auto px-8 text-center">
            <span className="material-symbols-outlined text-7xl text-outline-variant mb-6 block">shopping_cart</span>
            <h1 className="font-headline text-4xl mb-4">{t('checkout.empty_title')}</h1>
            <p className="text-on-surface-variant mb-10 font-body">{t('checkout.empty_desc')}</p>
            <Link to="/shop" className="bg-secondary text-on-secondary px-10 py-4 rounded-full font-label font-bold tracking-widest uppercase text-sm hover:brightness-110 transition-all">
              {t('product.browse_collection')}
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Order confirmation
  if (orderPlaced) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-surface pt-32 pb-20">
          <div className="max-w-2xl mx-auto px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8 animate-fade-in text-green-600">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h1 className="font-headline text-4xl mb-4 animate-fade-in">{t('checkout.thank_you')}</h1>
            <p className="text-on-surface-variant mb-3 font-body text-lg">{t('checkout.order_success')}</p>
            <p className="text-on-surface-variant mb-2 font-body">{t('checkout.order_number')} {orderPlaced}</p>
            <p className="text-on-surface-variant mb-10 font-body text-sm">{t('checkout.confirmation_sent')} <span className="font-semibold text-on-surface">{shipping.email}</span></p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/" className="bg-secondary text-on-secondary px-10 py-4 rounded-full font-label font-bold tracking-widest uppercase text-sm hover:brightness-110 transition-all">
                {t('checkout.return_home')}
              </Link>
              <Link to="/shop" className="border border-outline-variant/40 text-on-surface px-10 py-4 rounded-full font-label font-bold tracking-widest uppercase text-sm hover:bg-surface-container transition-all">
                {t('checkout.continue_shopping')}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-8">

          {/* Breadcrumb Steps */}
          <div className="flex items-center justify-center gap-3 mb-14">
            {STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <button
                  onClick={() => { if (i < currentStep) setCurrentStep(i); }}
                  className={`flex items-center gap-2 transition-all ${i <= currentStep ? 'text-on-surface' : 'text-outline'} ${i < currentStep ? 'cursor-pointer hover:text-secondary' : ''}`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < currentStep ? 'bg-secondary text-on-secondary' : 
                    i === currentStep ? 'bg-on-surface text-surface' : 
                    'bg-surface-container-high text-outline'
                  }`}>
                    {i < currentStep ? '✓' : i + 1}
                  </span>
                  <span className="font-label text-sm uppercase tracking-widest hidden sm:inline">{step}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-16 h-px ${i < currentStep ? 'bg-secondary' : 'bg-outline-variant/30'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          {/* Mobile Order Summary Accordion (Visible only on mobile) */}
          <div className="lg:hidden mb-8">
            <details className="glass-card rounded-2xl border border-white/20 overflow-hidden shadow-sm">
              <summary className="flex justify-between items-center px-6 py-4 cursor-pointer list-none select-none active:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary">shopping_bag</span>
                  <span className="font-label text-sm uppercase tracking-widest font-bold">{t('checkout.order_summary')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-headline text-lg">{total.toLocaleString()} DZD</span>
                  <span className="material-symbols-outlined text-sm transition-transform duration-300 group-open:rotate-180">expand_more</span>
                </div>
              </summary>
              <div className="px-6 py-4 border-t border-white/10 space-y-4 bg-white/5">
                {items.map(item => (
                  <div key={`${item.id}-${item.volume}`} className="flex gap-3">
                    <div className="w-12 h-15 rounded-lg overflow-hidden bg-surface-container-low shrink-0">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-headline text-xs truncate">{item.title}</p>
                      <p className="text-[10px] text-on-surface-variant font-label">{item.quantity} × {item.volume}</p>
                    </div>
                    <span className="text-xs font-body">{(item.price * item.quantity).toLocaleString()} DZD</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">{t('checkout.subtotal')}</span>
                    <span>{subtotal.toLocaleString()} DZD</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">{t('checkout.shipping')}</span>
                    <span className={shippingCost === 0 ? 'text-green-600 font-semibold' : ''}>{shippingCost === 0 ? t('checkout.free') : `${shippingCost.toLocaleString()} DZD`}</span>
                  </div>
                </div>
              </div>
            </details>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

            {/* Left Column – Forms */}
            <div className="lg:col-span-3 space-y-10">

              {/* SHIPPING STEP */}
              {currentStep === 1 && (
                <div className="animate-fade-in">
                  {/* Contact */}
                  <section className="bg-surface-container-lowest rounded-3xl p-8 md:p-10 mb-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.05)]">
                    <h2 className="font-headline text-2xl mb-8">{t('checkout.contact_info')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField label={t('checkout.email')} name="email" type="email" value={shipping.email} onChange={handleShippingChange} error={errors.email} icon="mail" isRTL={isRTL} />
                      <InputField label={t('checkout.phone')} name="phone" type="tel" value={shipping.phone} onChange={handleShippingChange} icon="phone" isRTL={isRTL} />
                    </div>
                  </section>

                  {/* Address */}
                  <section className="bg-surface-container-lowest rounded-3xl p-8 md:p-10 mb-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.05)]">
                    <h2 className="font-headline text-2xl mb-8">{t('checkout.shipping_address')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField label={t('checkout.first_name')} name="firstName" value={shipping.firstName} onChange={handleShippingChange} error={errors.firstName} isRTL={isRTL} />
                      <InputField label={t('checkout.last_name')} name="lastName" value={shipping.lastName} onChange={handleShippingChange} error={errors.lastName} isRTL={isRTL} />
                      <div className="md:col-span-2">
                        <InputField label={t('checkout.address1')} name="address1" value={shipping.address1} onChange={handleShippingChange} error={errors.address1} isRTL={isRTL} />
                      </div>
                      <div className="md:col-span-2">
                        <InputField label={t('checkout.address2')} name="address2" value={shipping.address2} onChange={handleShippingChange} isRTL={isRTL} />
                      </div>
                      {shipping.country === 'DZ' ? (
                        <>
                          {/* Wilaya & Commune Cascading Selection */}
                          <div className="md:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Combobox 
                                label={t('checkout.state')}
                                options={algeriaWilayas.map(w => ({ id: w.code, label: `${w.code} - ${w.name}`, name: w.name }))}
                                value={shipping.wilayaCode}
                                placeholder={t('checkout.select_wilaya')}
                                onChange={(val, obj) => {
                                  setShipping(prev => ({
                                    ...prev,
                                    wilayaCode: val,
                                    state: obj.name,
                                    commune: '',
                                    communeId: '',
                                    city: ''
                                  }));
                                }}
                                error={errors.state}
                                isRTL={isRTL}
                              />

                              {shipping.wilayaCode ? (
                                <Combobox 
                                  label={t('checkout.city')}
                                  options={selectedWilayaCommunes.map(c => ({ id: c.id.toString(), label: c.name }))}
                                  value={shipping.communeId}
                                  placeholder={t('checkout.select_commune')}
                                  onChange={(val, obj) => {
                                    setShipping(prev => ({ 
                                      ...prev, 
                                      communeId: val, 
                                      commune: obj.label,
                                      city: obj.label 
                                    }));
                                  }}
                                  error={errors.city}
                                  isRTL={isRTL}
                                />
                              ) : (
                                <div className="flex flex-col">
                                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">{t('checkout.city')}</label>
                                  <div className="w-full bg-surface-container-low rounded-2xl px-5 py-4 text-on-surface-variant font-body opacity-50">
                                    {t('checkout.select_wilaya_first', 'Select a Wilaya first')}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <InputField label={t('checkout.city')} name="city" value={shipping.city} onChange={handleShippingChange} error={errors.city} isRTL={isRTL} />
                          <InputField label={t('checkout.state')} name="state" value={shipping.state} onChange={handleShippingChange} error={errors.state} isRTL={isRTL} />
                        </>
                      )}
                      <InputField label={t('checkout.zip')} name="zip" value={shipping.zip} onChange={handleShippingChange} error={errors.zip} isRTL={isRTL} />
                      <div className="flex flex-col">
                        <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">{t('checkout.country')}</label>
                        <select
                          name="country"
                          value={shipping.country}
                          onChange={handleShippingChange}
                          className="w-full bg-surface-container-low rounded-2xl px-5 py-4 text-on-surface font-body focus:ring-2 focus:ring-secondary/40 outline-none transition-all border-0 appearance-none"
                        >
                          <option value="DZ">{t('countries.DZ')}</option>
                          <option value="FR">{t('countries.FR')}</option>
                          <option value="US">{t('countries.US')}</option>
                          <option value="CA">{t('countries.CA')}</option>
                          <option value="UK">{t('countries.UK')}</option>
                          <option value="DE">{t('countries.DE')}</option>
                          <option value="AE">{t('countries.AE')}</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Shipping Method */}
                  <section className="bg-surface-container-lowest rounded-3xl p-8 md:p-10 mb-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.05)]">
                    <h2 className="font-headline text-2xl mb-8">{t('checkout.shipping_method')}</h2>
                    <div className="space-y-4">
                      <ShippingOption
                        selected={!shipping.isStopDesk}
                        onSelect={() => setShipping(prev => ({ ...prev, isStopDesk: false, stopDeskId: '', stopDeskName: '' }))}
                        title={t('checkout.home_delivery', 'Home Delivery')}
                        time={t('checkout.home_delivery_time', '2-3 business days')}
                        price={subtotal >= freeShippingThreshold ? t('checkout.free') : (shipping.wilayaCode && shippingRates.find(r => r.code === shipping.wilayaCode) ? `${shippingRates.find(r => r.code === shipping.wilayaCode).home.toLocaleString()} DZD` : t('checkout.select_wilaya_first', 'Select Wilaya'))}
                        isFree={subtotal >= freeShippingThreshold}
                        isRTL={isRTL}
                      />
                      <ShippingOption
                        selected={shipping.isStopDesk}
                        onSelect={() => setShipping(prev => ({ ...prev, isStopDesk: true }))}
                        title={t('checkout.stopdesk', 'StopDesk (Pickup Point)')}
                        time={t('checkout.stopdesk_time', '1-2 business days')}
                        price={subtotal >= freeShippingThreshold ? t('checkout.free') : (shipping.wilayaCode && shippingRates.find(r => r.code === shipping.wilayaCode) ? `${shippingRates.find(r => r.code === shipping.wilayaCode).desk.toLocaleString()} DZD` : t('checkout.select_wilaya_first', 'Select Wilaya'))}
                        isFree={subtotal >= freeShippingThreshold}
                        isRTL={isRTL}
                      />
                    </div>
                    {shipping.isStopDesk && (
                      <div className="mt-6 animate-fade-in">
                        <Combobox
                          label={t('checkout.select_stopdesk', 'Select a Pickup Point')}
                          options={availableStopDesks.map(desk => ({ id: desk.id, label: desk.name, address: desk.address }))}
                          value={shipping.stopDeskId}
                          placeholder={t('checkout.choose_point', 'Choose a point')}
                          onChange={(val, obj) => {
                            setShipping(prev => ({ ...prev, stopDeskId: val, stopDeskName: obj.label }));
                          }}
                          isLoading={isLoadingStopDesks}
                          error={errors.stopDesk}
                          isRTL={isRTL}
                        />
                      </div>
                    )}
                  </section>



                  <button
                    onClick={goToPayment}
                    className="w-full brushed-metal-cta text-white py-5 rounded-full font-label font-bold tracking-widest uppercase text-sm shadow-[0_10px_20px_-5px_rgba(95,94,94,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(115,92,0,0.2)] transition-all duration-500 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {t('checkout.continue_payment')}
                    <span className={`material-symbols-outlined text-sm ${isRTL ? 'rotate-180' : ''}`}>arrow_forward</span>
                  </button>
                </div>
              )}

              {/* PAYMENT STEP — Cash on Delivery only */}
              {currentStep === 2 && (
                <div className="animate-fade-in">
                  <section className="bg-surface-container-lowest rounded-3xl p-8 md:p-10 mb-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.05)]">
                    <h2 className="font-headline text-2xl mb-8">{t('checkout.payment_method')}</h2>
                    <div className="text-center py-10 animate-fade-in px-4">
                      <div className="w-20 h-20 rounded-full bg-[#fdfaf7] border border-[#a69b91]/20 flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-[#a69b91]">payments</span>
                      </div>
                      <h3 className="font-headline text-xl mb-3 text-[#1a1c1d]">{t('checkout.cod')}</h3>
                      <p className="font-body text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                        {t('checkout.cod_desc')} <span className="font-bold text-on-surface text-lg">{total.toLocaleString()} DZD</span>
                      </p>
                    </div>
                  </section>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    className="w-full bg-secondary text-on-secondary py-5 rounded-full font-label font-bold tracking-widest uppercase text-sm shadow-[0_10px_20px_-5px_rgba(115,92,0,0.3)] hover:brightness-110 transition-all duration-500 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        {t('checkout.processing')}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">lock</span>
                        {t('checkout.place_order')} — {total.toLocaleString()} DZD
                      </>
                    )}
                  </button>

                  {/* Trust badges */}
                  <div className="flex flex-wrap items-center justify-center gap-8 mt-8">
                    {[
                      { icon: 'verified_user', label: t('checkout.ssl') },
                      { icon: 'refresh', label: t('checkout.returns') },
                      { icon: 'workspace_premium', label: t('checkout.authentic') },
                    ].map(badge => (
                      <div key={badge.label} className="flex items-center gap-2 text-outline">
                        <span className="material-symbols-outlined text-lg">{badge.icon}</span>
                        <span className="font-label text-xs uppercase tracking-wider">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column – Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.05)] sticky top-28">
                <h2 className="font-headline text-2xl mb-8">{t('checkout.order_summary')}</h2>

                {/* Items */}
                <div className="space-y-6 mb-8">
                  {items.map(item => (
                    <div key={`${item.id}-${item.volume}`} className="flex gap-4">
                      <div className="w-16 h-20 rounded-xl overflow-hidden bg-surface-container-low shrink-0 relative">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} w-5 h-5 bg-on-surface text-surface text-[10px] font-bold rounded-full flex items-center justify-center`}>{item.quantity}</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-headline text-sm">{item.title}</h4>
                        <p className="text-xs text-on-surface-variant font-label">{item.volume}</p>
                      </div>
                      <span className="font-body text-sm self-center">{(item.price * item.quantity).toLocaleString()} DZD</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-3 border-t border-outline-variant/20 pt-6">
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-on-surface-variant">{t('checkout.subtotal')}</span>
                    <span>{subtotal.toLocaleString()} DZD</span>
                  </div>
                  <div className="flex justify-between items-start font-body text-sm">
                    <div className="flex flex-col">
                      <span className="text-on-surface-variant">{t('checkout.shipping')}</span>
                      {shipping.state && (
                        <span className="text-[10px] text-secondary font-bold uppercase tracking-tight">
                          {shipping.state} — {shipping.isStopDesk ? t('shipping.stopdesk', 'Office') : t('shipping.home', 'Home')}
                        </span>
                      )}
                    </div>
                    <span className={shippingCost === 0 ? 'text-green-600 font-semibold' : ''}>
                      {shippingCost === 0 ? t('checkout.free') : `${shippingCost.toLocaleString()} DZD`}
                    </span>
                  </div>
                  {tax > 0 && (
                    <div className="flex justify-between font-body text-sm">
                      <span className="text-on-surface-variant">{t('checkout.tax')}</span>
                      <span>{tax.toLocaleString()} DZD</span>
                    </div>
                  )}
                  <div className="flex justify-between font-headline text-xl pt-3 border-t border-outline-variant/20">
                    <span>{t('checkout.total')}</span>
                    <span>{total.toLocaleString()} DZD</span>
                  </div>
                </div>

                {/* Free shipping badge */}
                {subtotal >= freeShippingThreshold && (
                  <div className="mt-6 flex items-center gap-2 bg-green-50 text-green-700 rounded-2xl px-4 py-3">
                    <span className="material-symbols-outlined text-lg">local_shipping</span>
                    <span className="font-label text-xs uppercase tracking-widest">{t('checkout.free_shipping_applied')}</span>
                  </div>
                )}
                {subtotal < freeShippingThreshold && (
                  <div className="mt-6 flex items-center gap-2 bg-surface-container-low text-on-surface-variant rounded-2xl px-4 py-3">
                    <span className="material-symbols-outlined text-lg">local_shipping</span>
                    <span className="font-label text-xs tracking-wider">
                      {t('checkout.add_more_for_free', { amount: (freeShippingThreshold - subtotal).toLocaleString() })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* --- Sub-components --- */

function InputField({ label, name, value, onChange, error, type = 'text', placeholder, icon, isRTL }) {
  return (
    <div className="flex flex-col">
      <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <span className={`material-symbols-outlined absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-lg text-outline`}>{icon}</span>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-surface-container-low rounded-2xl ${icon ? (isRTL ? 'pe-12' : 'ps-12') : 'px-5'} ${isRTL ? 'ps-5' : 'pe-5'} py-4 text-on-surface font-body outline-none transition-all border border-transparent focus:border-secondary/30 focus:ring-4 focus:ring-secondary/5 ${error ? 'border-red-400 ring-2 ring-red-400/20' : ''}`}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 font-label">{error}</p>}
    </div>
  );
}

function ShippingOption({ selected, onSelect, title, time, price, isFree, isRTL }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all border-2 ${
        selected ? 'border-secondary/50 bg-secondary/5' : 'border-transparent bg-surface-container-low hover:bg-surface-container'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-secondary' : 'border-outline-variant'}`}>
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-secondary" />}
        </div>
        <div className={isRTL ? 'text-end' : 'text-start'}>
          <p className="font-headline text-base">{title}</p>
          <p className="text-xs text-on-surface-variant font-label">{time}</p>
        </div>
      </div>
      <span className={`font-body font-semibold ${isFree ? 'text-green-600' : ''}`}>{price}</span>
    </button>
  );
}

function Combobox({ label, options, value, onChange, placeholder, error, isRTL, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { t } = useTranslation();
  
  const selectedOption = options.find(o => o.id === value);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col relative">
      <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">{label}</label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-surface-container-low rounded-2xl px-5 py-4 text-on-surface font-body text-start transition-all border-0 flex justify-between items-center ${error ? 'ring-2 ring-red-400/60' : 'focus:ring-2 focus:ring-secondary/40'}`}
        >
          <span className={!selectedOption ? 'text-on-surface-variant' : ''}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className={`material-symbols-outlined transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
        </button>
        
        {isOpen && (
          <div className="absolute z-[100] mt-2 w-full bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-fade-in">
            <div className="p-3 border-b border-outline-variant/10">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('labels.search', 'Search...')}
                className="w-full bg-surface-container rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </div>
            <div className="max-h-60 overflow-y-auto no-scrollbar">
              {isLoading ? (
                <div className="p-4 text-center text-xs text-on-surface-variant">{t('labels.loading', 'Loading...')}</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-center text-xs text-on-surface-variant">{t('shop.no_results_title', 'No results')}</div>
              ) : (
                filtered.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id, opt);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-start px-5 py-3 text-sm hover:bg-secondary/10 transition-colors border-s-4 ${value === opt.id ? 'border-secondary bg-secondary/5 font-bold' : 'border-transparent'}`}
                  >
                    {opt.label}
                    {opt.address && <p className="text-[10px] text-on-surface-variant font-normal">{opt.address}</p>}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1 font-label">{error}</p>}
    </div>
  );
}
