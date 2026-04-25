import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  ShoppingBag, 
  Settings, 
  Bell, 
  Search, 
  User, 
  ChevronRight,
  TrendingUp,
  DollarSign,
  Users,
  PlusCircle,
  BarChart3,
  Image as ImageIcon,
  MoreVertical,
  Sun,
  Heart,
  Mountain,
  Upload,
  Type,
  MousePointerClick,
  Star,
  Check,
  X,
  Mail,
  UserCheck,
  MessageSquare,
  Clock,
  Trash2,
  Tag,
  Eye,
  AlertCircle,
  Save,
  Download,
  Truck,
  Edit2,
  Menu
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useProducts } from '../context/ProductContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import SHIPPING_PROVIDERS, { getProvidersByEngine, getProvider, getCredentialLabels } from '../services/shippingConfig';
import { dispatchOrder, testCredentials as testShippingCredentials, trackOrder, fetchRates, fetchOfficialLabel } from '../services/shippingService';
import algeriaWilayas from '../data/algeria_wilayas.json';
import { optimizeImage } from '../utils/imageOptimizer';
// Lazy-loaded heavy sub-components (only downloaded when that tab is first opened)
const ReviewsManager = lazy(() => import('../components/Admin/ReviewManager'));
const VisualAnalytics = lazy(() => import('../components/Admin/VisualAnalytics'));
// Admin Internal Components
const AdminCard = ({ children, className = '' }) => (
  <div className={`bg-white border border-[#e2e2e4] rounded-[32px] overflow-hidden ${className}`}>
    {children}
  </div>
);

const StatCard = ({ title, value, change, icon: Icon }) => {
  const { t } = useTranslation();
  return (
    <AdminCard className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">{title}</p>
          <h3 className="text-4xl font-noto-serif text-[#1a1c1d] tracking-tight">{value}</h3>
        </div>
        <div className="p-4 bg-[#fbfaf9] border border-[#e2e2e4] rounded-2xl">
          <Icon size={24} className="text-[#826a11]" strokeWidth={1.5} />
        </div>
      </div>
      <div className="mt-6 flex items-center text-[11px] uppercase tracking-wider font-bold">
        <span className="text-[#21804f] bg-[#e8f6ef] px-2 py-1 rounded-md">+{change}%</span>
        <span className="text-[#a69b91] ms-2 tracking-widest">{t('admin.dashboard.from_last_month')}</span>
      </div>
    </AdminCard>
  );
};

// Section divider component for settings
const SectionDivider = ({ label, icon: Icon }) => (
  <div className="flex items-center my-2">
    <div className="h-px bg-[#e2e2e4] w-6"></div>
    <div className="flex items-center gap-2 px-3">
      {Icon && <Icon size={14} className="text-[#826a11]" strokeWidth={2} />}
      <span className="text-[10px] font-bold tracking-[0.2em] text-[#a69b91] uppercase whitespace-nowrap">{label}</span>
    </div>
    <div className="h-px bg-[#e2e2e4] flex-1"></div>
  </div>
);

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language.startsWith('ar-');
  const navigate = useNavigate();
  const { currentUser, userProfile, updateUserRole, fetchAllUsers } = useAuth();
  const userRole = userProfile?.role || 'customer';

  const [activeTab, setActiveTab] = useState(() => {
    if (userRole === 'confirmer') return 'orders';
    return 'analytics';
  });
  const { storeSettings, updateStoreSettings, isStoreSettingsLoading } = useCart();
  const { addToast } = useToast();

  const { products: PRODUCTS, loading: productsLoading, error: productsError, addProduct, updateProduct } = useProducts();
  const { orders, incompleteOrders, loading: ordersLoading, error: ordersError, updateOrder, updateIncompleteOrder, convertIncompleteToOrder, deleteIncompleteOrder } = useOrders();
  
  // Team management state (admin only)
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleChangeLoading, setRoleChangeLoading] = useState(null);

  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loading = productsLoading || ordersLoading;
  const error = productsError || ordersError;

  // Role guard: redirect customers away
  useEffect(() => {
    if (!currentUser || !['admin', 'manager', 'confirmer'].includes(userRole)) {
      navigate('/login');
    }
  }, [currentUser, userRole, navigate]);

  // Settings State — all fields initialize from the global context
  const [shippingThreshold, setShippingThreshold] = useState(storeSettings?.freeShippingThreshold || 250);
  const [storeName, setStoreName] = useState(storeSettings?.storeName || "L'Essence");
  const [heroImages, setHeroImages] = useState(() => {
    if (Array.isArray(storeSettings?.heroImages) && storeSettings.heroImages.length > 0) return storeSettings.heroImages;
    if (storeSettings?.heroImage) return [storeSettings.heroImage];
    return []; // No static fallbacks
  });
  const [heroLibrary, setHeroLibrary] = useState(() => {
    if (Array.isArray(storeSettings?.heroLibrary)) {
      return storeSettings.heroLibrary;
    }
    return []; // No static defaults
  });
  const [heroLang, setHeroLang] = useState('en');
  
  const extractString = (val, defaultVal) => typeof val === 'object' && val !== null ? (val.en || '') : (val || defaultVal);
  
  const [heroSubtitle, setHeroSubtitle] = useState(extractString(storeSettings?.heroSubtitle, ''));
  const [heroHeadline, setHeroHeadline] = useState(extractString(storeSettings?.heroHeadline, ''));
  const [heroHeadlineAccent, setHeroHeadlineAccent] = useState(extractString(storeSettings?.heroHeadlineAccent, ''));
  const [heroHeadlineSuffix, setHeroHeadlineSuffix] = useState(extractString(storeSettings?.heroHeadlineSuffix, ''));
  const [heroDescription, setHeroDescription] = useState(extractString(storeSettings?.heroDescription, ''));
  const [heroPrimaryBtn, setHeroPrimaryBtn] = useState(extractString(storeSettings?.heroPrimaryButtonText, 'Shop Now'));
  const [heroSecondaryBtn, setHeroSecondaryBtn] = useState(extractString(storeSettings?.heroSecondaryButtonText, 'The Collection'));


  
  const [curatedCategories, setCuratedCategories] = useState(storeSettings?.curatedCategories || [
    { name: 'Women', slug: 'women', image: '/assets/images/image_4.webp' },
    { name: 'Men', slug: 'men', image: '/assets/images/image_5.webp' },
    { name: 'Unisex', slug: 'unisex', image: '/assets/images/image_6.webp' },
    { name: 'Luxury', slug: 'luxury', image: '/assets/images/image_7.webp' },
  ]);
  const [categoryUploadIndex, setCategoryUploadIndex] = useState(null);
  const [featuredIds, setFeaturedIds] = useState(storeSettings?.featuredProductIds || []);
  const [boutiqueIds, setBoutiqueIds] = useState(storeSettings?.boutiqueFavoriteIds || []);

  // Guard: only sync from Firestore ONCE on initial load.
  // Without this, every onSnapshot re-fire (reconnects, cache refreshes) would
  // overwrite local admin draft state and revert unsaved/just-saved changes.
  const hasSyncedFromDB = useRef(false);

  const [editingProductId, setEditingProductId] = useState(null);

  // Sync local state from Firestore — runs ONCE on initial load only.
  // Using a ref guard prevents subsequent onSnapshot re-fires (e.g., from
  // Firebase reconnects or periodic cache refreshes) from overwriting the
  // admin's local draft state and causing the "4-hour reversion" bug.
  useEffect(() => {
    if (!isStoreSettingsLoading && storeSettings && !hasSyncedFromDB.current) {
      hasSyncedFromDB.current = true; // lock: never sync again this session

      if (storeSettings.freeShippingThreshold !== undefined) setShippingThreshold(storeSettings.freeShippingThreshold);
      if (storeSettings.storeName) setStoreName(storeSettings.storeName);
      
      if (Array.isArray(storeSettings.heroImages) && storeSettings.heroImages.length > 0) {
        setHeroImages(storeSettings.heroImages);
      }
      
      setHeroSubtitle(extractString(storeSettings.heroSubtitle, ''));
      setHeroHeadline(extractString(storeSettings.heroHeadline, ''));
      setHeroHeadlineAccent(extractString(storeSettings.heroHeadlineAccent, ''));
      setHeroHeadlineSuffix(extractString(storeSettings.heroHeadlineSuffix, ''));
      setHeroDescription(extractString(storeSettings.heroDescription, ''));
      setHeroPrimaryBtn(extractString(storeSettings.heroPrimaryButtonText, 'Shop Now'));
      setHeroSecondaryBtn(extractString(storeSettings.heroSecondaryButtonText, 'The Collection'));

      if (Array.isArray(storeSettings.heroLibrary)) {
        setHeroLibrary(storeSettings.heroLibrary);
      }
      
      
      if (Array.isArray(storeSettings.curatedCategories)) {
        setCuratedCategories(storeSettings.curatedCategories);
      }
      
      if (Array.isArray(storeSettings.featuredProductIds)) {
        setFeaturedIds(storeSettings.featuredProductIds);
      }
      
      if (Array.isArray(storeSettings.boutiqueFavoriteIds)) {
        setBoutiqueIds(storeSettings.boutiqueFavoriteIds);
      }
    }
  }, [isStoreSettingsLoading, storeSettings]);
  
  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger' // 'danger' or 'warning'
  });

  // New Product State
  const [newProduct, setNewProduct] = useState({ 
    title: '', 
    price: '', 
    category: 'unisex', 
    type: 'Eau de Parfum',
    volume: '100ml', 
    image: '', 
    description: '',
    featured: false,
    boutique: false,
    fragranceFamily: 'Oriental',
    topNotes: '',
    heartNotes: '',
    baseNotes: '',
    sizes: [{ volume: '100ml', price: '' }],
    gallery: ['', '', ''],
    isActive: true,
    discount: 0
  });
  const [showDiscountPreview, setShowDiscountPreview] = useState(false);
  const [pendingDiscount, setPendingDiscount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);
  const [shippingProvider, setShippingProvider] = useState('yalidine');
  const [isShippingDropdownOpen, setIsShippingDropdownOpen] = useState(false);
  const [isAddingNewService, setIsAddingNewService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [shippingApiToken, setShippingApiToken] = useState('');
  const [shippingApiId, setShippingApiId] = useState('');
  const [shippingApiKey, setShippingApiKey] = useState('');
  const [originWilaya, setOriginWilaya] = useState('');
  const [isSavingShipping, setIsSavingShipping] = useState(false);
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const shippingDropdownRef = useRef(null);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [selectedShippingService, setSelectedShippingService] = useState('');
  const [isSendingToShipping, setIsSendingToShipping] = useState(false);
  const [savedShippingConfig, setSavedShippingConfig] = useState(null);
  const [shippingDispatchLog, setShippingDispatchLog] = useState([]);
  const [liveTrackingStatus, setLiveTrackingStatus] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [orderPipelineTab, setOrderPipelineTab] = useState('Pending');
  const [isSyncingRates, setIsSyncingRates] = useState(false);
  const [isPrintingOfficialLabels, setIsPrintingOfficialLabels] = useState(false);

  // Get provider groups for the dropdown
  const providerGroups = getProvidersByEngine();
  // All providers as flat array for the dropdown
  const allProvidersFlat = Object.values(SHIPPING_PROVIDERS);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shippingDropdownRef.current && !shippingDropdownRef.current.contains(e.target)) {
        setIsShippingDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-fetch users when visiting Clients or Team tab
  useEffect(() => {
    let isActive = true;
    if (['subscribers', 'team'].includes(activeTab) && allUsers.length === 0) {
      setUsersLoading(true);
      fetchAllUsers().then(users => {
        if (isActive) {
          setAllUsers(users);
          setUsersLoading(false);
        }
      }).catch(err => {
        if (isActive) setUsersLoading(false);
      });
    }
    return () => { isActive = false; };
  }, [activeTab]);

  // Load shipping config from Firestore
  useEffect(() => {
    const shippingRef = doc(db, 'settings', 'shipping');
    const unsub = onSnapshot(shippingRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setShippingProvider(data.provider || 'yalidine');
        setShippingApiToken(data.apiToken || '');
        setShippingApiId(data.apiId || '');
        setShippingApiKey(data.apiKey || '');
        setOriginWilaya(data.originWilaya || '');
        if (data.provider === 'custom') {
          setIsAddingNewService(true);
          setNewServiceName(data.customName || '');
        }
        setSavedShippingConfig(data);
      }
    });
    return () => { try { unsub(); } catch(e) { /* suppress Firestore teardown errors */ } };
  }, []);

  const handleSaveShippingConfig = async () => {
    if (isAddingNewService && !newServiceName.trim()) {
      addToast('Please enter a service name', 'error');
      return;
    }
    // Validate based on engine type
    const currentProvider = getProvider(shippingProvider);
    if (currentProvider) {
      const requiredCreds = currentProvider.credentials;
      if (requiredCreds.includes('token') && !shippingApiToken.trim()) {
        addToast('Please enter an API token', 'error');
        return;
      }
      if (requiredCreds.includes('id') && !shippingApiId.trim()) {
        addToast('Please enter an API ID', 'error');
        return;
      }
      if (requiredCreds.includes('key') && !shippingApiKey.trim()) {
        addToast('Please enter an API Key', 'error');
        return;
      }
    } else if (!shippingApiToken.trim()) {
      addToast('Please enter an API token', 'error');
      return;
    }

    setIsSavingShipping(true);
    try {
      const shippingRef = doc(db, 'settings', 'shipping');
      await setDoc(shippingRef, {
        provider: isAddingNewService ? 'custom' : shippingProvider,
        customName: isAddingNewService ? newServiceName.trim() : '',
        apiToken: shippingApiToken.trim(),
        apiId: shippingApiId.trim(),
        apiKey: shippingApiKey.trim(),
        originWilaya: originWilaya,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      addToast('Shipping configuration saved', 'success');
    } catch (err) {
      console.error('Failed to save shipping config:', err);
      addToast('Failed to save shipping configuration', 'error');
    } finally {
      setIsSavingShipping(false);
    }
  };

  const handleTestCredentials = async () => {
    const currentProvider = getProvider(shippingProvider);
    if (!currentProvider) {
      addToast('Select a known provider to test', 'error');
      return;
    }
    setIsTestingCredentials(true);
    try {
      const creds = { token: shippingApiToken, id: shippingApiId, key: shippingApiKey };
      const isValid = await testShippingCredentials(shippingProvider, creds);
      if (isValid) {
        addToast(`${currentProvider.title} credentials are valid ✓`, 'success');
      } else {
        addToast(`${currentProvider.title} credentials are invalid ✗`, 'error');
      }
    } catch (err) {
      addToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setIsTestingCredentials(false);
    }
  };

  const handleEditProductClick = (product) => {
    if (!['admin', 'manager'].includes(userRole)) {
      addToast('You do not have permission to edit products', 'error');
      return;
    }
    setEditingProductId(product.id);
    setNewProduct({
      title: product.title || '',
      price: product.price || '',
      category: product.category || 'unisex',
      type: typeof product.type === 'object' ? (product.type?.en || 'Eau de Parfum') : (product.type || 'Eau de Parfum'),
      volume: product.volume || '100ml',
      image: product.image || '',
      description: typeof product.description === 'object' ? (product.description?.en || '') : (product.description || ''),
      featured: product.featured || false,
      boutique: product.boutique || false,
      fragranceFamily: typeof product.fragranceFamily === 'object' ? (product.fragranceFamily?.en || 'Oriental') : (product.fragranceFamily || 'Oriental'),
      topNotes: typeof product.topNotes === 'object' ? (product.topNotes?.en || '') : (product.topNotes || ''),
      heartNotes: typeof product.heartNotes === 'object' ? (product.heartNotes?.en || '') : (product.heartNotes || ''),
      baseNotes: typeof product.baseNotes === 'object' ? (product.baseNotes?.en || '') : (product.baseNotes || ''),
      sizes: product.sizes?.length ? product.sizes : [{ volume: '100ml', price: '' }],
      gallery: product.gallery || ['', '', ''],
      isActive: product.isActive !== undefined ? product.isActive : true,
      discount: product.discount || 0
    });
    setActiveTab('add-product');
  };

  // State for leads/communications
  const [subscribers, setSubscribers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [isLeadsLoading, setIsLeadsLoading] = useState(true);

  // Fetch Subscribers & Messages
  useEffect(() => {
    const subUnsub = onSnapshot(query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc')), (snapshot) => {
      setSubscribers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const msgUnsub = onSnapshot(query(collection(db, 'messages'), orderBy('sentAt', 'desc')), (snapshot) => {
      setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    setIsLeadsLoading(false);
    return () => {
      try { subUnsub(); } catch(e) { /* suppress Firestore teardown errors */ }
      try { msgUnsub(); } catch(e) { /* suppress Firestore teardown errors */ }
    };
  }, []);

  const handleDeleteEntry = async (collectionName, id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this entry? This action is permanent and cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, collectionName, id));
          addToast('Entry deleted successfully', 'success');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
          addToast('Failed to delete entry', 'error');
        }
      }
    });
  };

  const exportOrdersToCSV = () => {
    if (!orders || orders.length === 0) {
      addToast('No orders to export', 'error');
      return;
    }

    const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'Date', 'Status', 'Payment Method', 'Address', 'City', 'Delivery Method', 'Total'];
    
    const csvRows = [
      headers.join(','),
      ...orders.map(order => {
        return [
          order.id || '',
          order.customer || '',
          order.email || '',
          order.phone || '',
          order.date || '',
          order.status || '',
          order.paymentMethod || '',
          (order.address || '').replace(/,/g, ' '),
          (order.city || '').replace(/,/g, ' '),
          order.deliveryMethod || '',
          (order.total || '').toString().replace(/,/g, '')
        ].map(value => `"${value}"`).join(',');
      })
    ];

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `orders_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addToast('Orders exported successfully', 'success');
  };

  const handlePrintLabels = () => {
    const ordersToPrint = orders.filter(o => selectedOrderIds.includes(o.id));
    if (ordersToPrint.length === 0) return;

    const printWindow = window.open('', '_blank');
    const labelsHtml = ordersToPrint.map(order => `
      <div class="label-page">
        <div class="label-header">
          <div class="store-info">
            <h1 class="store-name">${storeSettings.storeName || "L'ESSENCE"}</h1>
            <p class="store-tagline">Premium Fragrances</p>
          </div>
          <div class="order-type">
            <div class="type-badge">${order.paymentMethod === 'COD' || order.paymentMethod === 'الدفع عند الاستلام' ? 'COD' : 'PREPAID'}</div>
            <p class="order-id">#${order.id}</p>
          </div>
        </div>

        <div class="label-body">
          <div class="recipient-section">
            <p class="section-label">RECIPIENT / المستلم</p>
            <h2 class="customer-name">${order.customer}</h2>
            <p class="customer-phone">${order.shipping?.phone || order.phone || 'No Phone'}</p>
            <div class="address-box">
              <p>${order.shipping?.address1 || order.address || ''}</p>
              <p><strong>${order.shipping?.commune || order.city || ''}, ${order.shipping?.state || ''}</strong></p>
              ${order.shipping?.isStopDesk ? `<p class="stopdesk-badge">PICKUP: ${order.shipping?.stopDeskName}</p>` : ''}
            </div>
          </div>

          <div class="product-manifest">
            <p class="section-label">CONTENTS / المحتويات</p>
            <ul class="item-list">
              ${(order.items || []).map(item => `
                <li>${item.title} x${item.quantity} (${item.volume})</li>
              `).join('')}
            </ul>
          </div>
        </div>

        <div class="label-footer">
          <div class="amount-section">
            <p class="section-label">AMOUNT TO COLLECT</p>
            <p class="total-amount">${order.total}</p>
          </div>
          <div class="barcode-placeholder">
            <div class="barcode-mock"></div>
            <p class="tracking-sub">${order.trackingId || order.id}</p>
          </div>
        </div>
      </div>
    `).join('<div class="page-break"></div>');

    printWindow.document.write(`
      <html>
        <head>
          <title>L'Essence - Shipping Labels</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { 
              margin: 0; 
              padding: 0; 
              font-family: 'Inter', sans-serif;
              background: #f0f0f0;
            }
            .label-page {
              width: 100mm;
              height: 150mm;
              background: white;
              margin: 10mm auto;
              padding: 8mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              border: 1px solid #eee;
              position: relative;
            }
            .page-break { page-break-after: always; }
            .label-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #000;
              padding-bottom: 4mm;
              margin-bottom: 4mm;
            }
            .store-name { margin: 0; font-size: 18px; font-weight: 900; letter-spacing: -0.5px; }
            .store-tagline { margin: 0; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
            .order-type { text-align: right; }
            .type-badge { 
              background: #000; 
              color: #fff; 
              padding: 2px 8px; 
              font-size: 12px; 
              font-weight: 900; 
              border-radius: 4px;
              margin-bottom: 4px;
            }
            .order-id { margin: 0; font-size: 12px; font-weight: 700; color: #666; }
            
            .section-label { 
              font-size: 9px; 
              font-weight: 800; 
              color: #999; 
              margin: 0 0 4px 0;
              letter-spacing: 0.5px;
            }
            .customer-name { margin: 0; font-size: 20px; font-weight: 800; color: #000; }
            .customer-phone { margin: 4px 0 8px 0; font-size: 16px; font-weight: 700; }
            .address-box { 
              background: #f9f9f9; 
              padding: 10px; 
              border-radius: 8px; 
              font-size: 13px; 
              line-height: 1.4;
              margin-bottom: 6mm;
            }
            .address-box p { margin: 0; }
            .stopdesk-badge { 
              margin-top: 6px !important;
              color: #826a11; 
              font-weight: 800; 
              font-size: 11px;
              text-transform: uppercase;
            }

            .product-manifest { flex: 1;  border-top: 1px dashed #eee; padding-top: 4mm; }
            .item-list { padding: 0; margin: 0; list-style: none; }
            .item-list li { font-size: 11px; margin-bottom: 4px; font-weight: 500; }

            .label-footer {
              border-top: 2px solid #000;
              padding-top: 4mm;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .total-amount { font-size: 24px; font-weight: 900; margin: 0; }
            .barcode-mock {
              width: 40mm;
              height: 12mm;
              background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px);
              margin-bottom: 4px;
            }
            .tracking-sub { margin: 0; font-size: 10px; font-weight: 700; text-align: center; }

            @media print {
              body { background: white; }
              .label-page { margin: 0; border: none; }
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleConfirmSelectedOrders = async () => {
    try {
      const ordersToConfirm = orders.filter(o => selectedOrderIds.includes(o.id));
      await Promise.all(ordersToConfirm.map(o => updateOrder(o.id, { status: 'Confirmed' })));
      addToast(`${ordersToConfirm.length} orders marked as Confirmed`, 'success');
      setSelectedOrderIds([]); // Clear selection after processing
    } catch (error) {
      console.error(error);
      addToast('Failed to confirm orders', 'error');
    }
  };

  const handleSyncRates = async () => {
    if (!savedShippingConfig?.provider) {
      addToast('Please configure a shipping provider first', 'error');
      return;
    }
    setIsSyncingRates(true);
    try {
      const providerKey = savedShippingConfig.provider;
      const credentials = {
        id: savedShippingConfig.apiId || '',
        token: savedShippingConfig.apiToken || '',
        key: savedShippingConfig.apiKey || '',
      };
      const originCode = algeriaWilayas.find(w => w.name === savedShippingConfig.originWilaya)?.code || '16';
      const rates = await fetchRates(providerKey, credentials, originCode);

      if (rates.length > 0) {
        // Save rates to Firestore for persistent caching
        await setDoc(doc(db, 'settings', 'shipping_rates'), {
          provider: providerKey,
          rates: rates,
          syncedAt: Date.now(),
          syncedAtHuman: new Date().toLocaleString(),
        });
        addToast(`✅ Synced ${rates.length} Wilaya prices from ${getProvider(providerKey)?.title || providerKey}`, 'success');
      } else {
        addToast('No rates returned from the provider', 'warning');
      }
    } catch (error) {
      console.error('Sync rates error:', error);
      addToast(`Failed to sync rates: ${error.message}`, 'error');
    } finally {
      setIsSyncingRates(false);
    }
  };

  const handlePrintOfficialLabels = async () => {
    const ordersToPrint = orders.filter(o => selectedOrderIds.includes(o.id));
    if (ordersToPrint.length === 0) return;

    if (!savedShippingConfig?.provider) {
      addToast('No shipping provider configured. Falling back to custom labels.', 'warning');
      handlePrintLabels(); // fallback to custom label
      return;
    }

    setIsPrintingOfficialLabels(true);
    const providerKey = savedShippingConfig.provider;
    const credentials = {
      id: savedShippingConfig.apiId || '',
      token: savedShippingConfig.apiToken || '',
      key: savedShippingConfig.apiKey || '',
    };

    let successCount = 0;
    let failedIds = [];

    for (const order of ordersToPrint) {
      const trackingId = order.trackingId;
      if (!trackingId) {
        failedIds.push(order.id + ' (no tracking)');
        continue;
      }
      try {
        const label = await fetchOfficialLabel(trackingId, providerKey, credentials);
        if (label.type === 'url') {
          window.open(label.data, '_blank');
        } else if (label.type === 'blob') {
          window.open(label.data, '_blank');
        } else if (label.type === 'base64') {
          const byteCharacters = atob(label.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        }
        successCount++;
      } catch (err) {
        console.error(`Label failed for ${order.id}:`, err);
        failedIds.push(order.id);
      }
    }

    if (successCount > 0) {
      addToast(`Opened ${successCount} official label(s)`, 'success');
    }
    if (failedIds.length > 0) {
      addToast(`${failedIds.length} label(s) failed: ${failedIds.join(', ')}. Use custom labels instead.`, 'warning');
    }
    setIsPrintingOfficialLabels(false);
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
        // Automatically optimize image (WebP + Compression)
        const optimizedBlob = await optimizeImage(file);
        
        const formData = new FormData();
        // File name needs to end with .webp for some APIs to recognize it correctly
        formData.append('image', optimizedBlob, 'product-image.webp');
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            setNewProduct(prev => ({ ...prev, image: data.data.url }));
            addToast('Image uploaded successfully', 'success');
        } else {
            throw new Error(data.error?.message || 'Upload failed');
        }
    } catch (err) {
        addToast('Error uploading image', 'error');
        console.error(err);
    } finally {
        setIsUploading(false);
    }
  };

  const handleGalleryImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
        // Automatically optimize image (WebP + Compression)
        const optimizedBlob = await optimizeImage(file);
        
        const formData = new FormData();
        formData.append('image', optimizedBlob, `gallery-${index}.webp`);
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            const updatedGallery = [...(newProduct.gallery || ['', '', ''])];
            updatedGallery[index] = data.data.url;
            setNewProduct(prev => ({ ...prev, gallery: updatedGallery }));
            addToast(`Gallery image ${index + 1} uploaded successfully`, 'success');
        } else {
            throw new Error(data.error?.message || 'Upload failed');
        }
    } catch (err) {
        addToast('Error uploading gallery image', 'error');
        console.error(err);
    } finally {
        setIsUploading(false);
    }
  };

  const handleHeroImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setIsUploading(true);
    let successCount = 0;
    
    try {
        for (const file of files) {
            const optimizedBlob = await optimizeImage(file);
            const formData = new FormData();
            formData.append('image', optimizedBlob, `hero-lib-${Date.now()}-${successCount}.webp`);
            
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            if (data.success) {
                const imageUrl = data.data.url;
                setHeroLibrary(prev => [...prev, imageUrl]);
                successCount++;
            }
        }
        
        if (successCount > 0) {
            addToast(`${successCount} image(s) added to library`, 'success');
        }
    } catch (err) {
        addToast('Error uploading images', 'error');
        console.error(err);
    } finally {
        setIsUploading(false);
    }
  };

  const handleCategoryImageUpload = async (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setCategoryUploadIndex(idx);
    try {
        const optimizedBlob = await optimizeImage(file, { maxWidth: 800, quality: 0.8 });
        const formData = new FormData();
        formData.append('image', optimizedBlob, `category-${idx}.webp`);
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            const newUrl = data.data.url;
            const updated = [...curatedCategories];
            updated[idx] = { ...updated[idx], image: newUrl };
            setCuratedCategories(updated);
            addToast('Category image uploaded successfully', 'success');
        } else {
            throw new Error(data.error?.message || 'Upload failed');
        }
    } catch (err) {
        addToast('Error uploading category image', 'error');
        console.error(err);
    } finally {
        setCategoryUploadIndex(null);
    }
  };




  const handleAddProductSubmit = async () => {
    try {
      if (!newProduct.title || !newProduct.price) {
        addToast("Title and Price are required", "error");
        return;
      }
      const productPayload = {
        title: newProduct.title,
        price: parseFloat(newProduct.price) || 0,
        category: newProduct.category,
        type: newProduct.type,
        volume: newProduct.volume || '100ml',
        sizes: newProduct.sizes.filter(s => s.volume && s.price).map(s => ({
          volume: s.volume,
          price: parseFloat(s.price) || 0
        })),
        inventory: 100,
        image: newProduct.image || '',
        description: newProduct.description,
        featured: newProduct.featured,
        boutique: newProduct.boutique,
        fragranceFamily: newProduct.fragranceFamily,
        isActive: newProduct.isActive !== undefined ? newProduct.isActive : true,
        // For compatibility with any legacy code that expects an array of strings in 'notes'
        // we'll populate it with English notes if available.
        notes: [
          ...(newProduct.topNotes.en || '').split(',').map(n => n.trim()).filter(Boolean),
          ...(newProduct.heartNotes.en || '').split(',').map(n => n.trim()).filter(Boolean),
          ...(newProduct.baseNotes.en || '').split(',').map(n => n.trim()).filter(Boolean)
        ],
        topNotes: newProduct.topNotes,
        heartNotes: newProduct.heartNotes,
        baseNotes: newProduct.baseNotes,
        gallery: newProduct.gallery || [],
        discount: parseFloat(newProduct.discount) || 0,
        createdAt: new Date().toISOString()
      };

      if (editingProductId) {
        await updateProduct(editingProductId, productPayload);
        addToast("Product updated successfully!", "success");
      } else {
        await addProduct(productPayload);
        addToast("Product added successfully!", "success");
      }
      
      setNewProduct({ 
        title: '', 
        price: '', 
        category: 'unisex', 
        type: 'Eau de Parfum',
        volume: '100ml', 
        image: '', 
        description: '',
        featured: false,
        boutique: false,
        fragranceFamily: 'Oriental',
        topNotes: '',
        heartNotes: '',
        baseNotes: '',
        sizes: [{ volume: '100ml', price: '' }],
        gallery: ['', '', ''],
        isActive: true,
        discount: 0
      });
      setEditingProductId(null);
      setActiveTab('products');
    } catch(err) {
      addToast(editingProductId ? 'Error updating product' : 'Error saving product', 'error');
      console.error(err);
    }
  };

  const handleSaveSettings = () => {
    updateStoreSettings({ 
      freeShippingThreshold: Number(shippingThreshold),
      storeName,
      heroImages,
      heroSubtitle,
      heroHeadline,
      heroHeadlineAccent,
      heroHeadlineSuffix,
      heroDescription,
      heroPrimaryButtonText: heroPrimaryBtn,
      heroSecondaryButtonText: heroSecondaryBtn,
      featuredProductIds: featuredIds,
      boutiqueFavoriteIds: boutiqueIds,
      curatedCategories: curatedCategories,
      heroLibrary: heroLibrary,
    });
  };

  const toggleHeroImage = (path) => {
    setHeroImages(prev => {
      if (prev.includes(path)) {
        if (prev.length <= 1) return prev;
        return prev.filter(p => p !== path);
      }
      return [...prev, path];
    });
  };

  const toggleFeaturedProduct = (productId) => {
    setFeaturedIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : prev.length < 3 ? [...prev, productId] : prev
    );
  };

  const toggleBoutiqueProduct = (productId) => {
    setBoutiqueIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Define all tabs and which roles can see them
  const allNavigation = [
    { id: 'analytics', name: t('admin.nav.analytics'), icon: BarChart3, roles: ['admin', 'manager', 'confirmer'] },
    { id: 'orders', name: t('admin.nav.orders'), icon: ShoppingBag, roles: ['admin', 'manager', 'confirmer'] },
    { id: 'shipments', name: t('admin.nav.shipments'), icon: Truck, roles: ['admin', 'manager'] },
    { id: 'incomplete-orders', name: t('admin.nav.incomplete'), icon: AlertCircle, roles: ['admin', 'manager', 'confirmer'] },
    { id: 'products', name: t('admin.nav.products'), icon: Package, roles: ['admin', 'manager', 'confirmer'] },
    { id: 'add-product', name: t('admin.nav.add_product'), icon: PlusCircle, roles: ['admin', 'manager'] },
    { id: 'subscribers', name: t('admin.nav.clients'), icon: UserCheck, roles: ['admin', 'manager', 'confirmer'] },
    { id: 'messages', name: t('admin.nav.messages'), icon: MessageSquare, roles: ['admin', 'manager'] },
    { id: 'reviews', name: 'Reviews', icon: Star, roles: ['admin', 'manager'] },
    { id: 'settings', name: t('admin.nav.settings'), icon: Settings, roles: ['admin', 'manager'] },
    { id: 'team', name: t('admin.nav.team'), icon: Users, roles: ['admin'] },
  ];
  const navigation = allNavigation.filter(item => item.roles.includes(userRole));

  const recentOrders = orders ? orders.slice(0, 4) : [];

  if (isStoreSettingsLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfaf9]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-16 h-16 border-4 border-[#826a11]/20 border-t-[#826a11] rounded-full animate-spin" />
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#a69b91] animate-pulse">Initializing Dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <div className="p-8 bg-white border border-[#e2e2e4] rounded-[32px] text-center max-w-lg">
          <div className="text-[#d9534f] mb-4 flex justify-center"><X size={48} strokeWidth={1.5} /></div>
          <h2 className="text-xl font-noto-serif text-[#1a1c1d] mb-2">{t('admin.common.error')}</h2>
          <p className="text-sm text-[#5f5e5e]">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-[#1a1c1d] text-white text-[10px] uppercase font-bold tracking-widest rounded-full hover:bg-[#826a11] transition-colors">{t('admin.common.retry')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F9F9F7] font-manrope flex overflow-hidden ${isRTL ? 'flex-row-reverse text-right' : ''}`}>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Stitch Style */}
      <nav className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-50 w-64 h-screen bg-white flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')} ${isRTL ? 'border-l border-[#e2e2e4]' : 'border-r border-[#e2e2e4]'}`}>
        <div className="p-6 border-b border-[#e2e2e4] flex justify-between items-center">
          <div>
            <Link to="/" className="text-2xl font-noto-serif tracking-tight text-[#1a1c1d]">L'Essence.</Link>
            <p className="text-xs text-[#5f5e5e] mt-1 font-medium tracking-widest uppercase">{t('admin.nav.portal')}</p>
          </div>
          <button className="lg:hidden text-[#5f5e5e]" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center px-6 py-3 transition-all duration-300 relative ${isRTL ? 'border-r-4 flex-row-reverse space-x-reverse' : 'border-l-4'} ${
                  isActive 
                    ? `text-[#1a1c1d] ${isRTL ? 'border-r-[#826a11]' : 'border-l-[#826a11]'} bg-[#F9F9F7]` 
                    : 'text-[#a69b91] border-transparent hover:bg-[#F9F9F7] hover:text-[#1a1c1d]'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#826a11]' : ''} />
                <span className={`${isRTL ? 'mr-3' : 'ms-3'} ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 border-t border-[#e2e2e4] space-y-4">
          {['admin', 'manager'].includes(userRole) && (
            <button className="w-full py-3 bg-[#826a11] text-white rounded-xl font-medium text-sm hover:bg-[#6b570e] transition-colors shadow-sm">
              {t('admin.dashboard.new_collection')}
            </button>
          )}
          <div className="flex items-center p-2">
            <div className="w-10 h-10 rounded-full bg-[#F9F9F7] flex items-center justify-center border border-[#e2e2e4] overflow-hidden">
              <User size={20} className="text-[#a69b91]" />
            </div>
            <div className="ms-3">
              <p className="text-sm font-bold text-[#1a1c1d]">{userProfile?.firstName || currentUser?.email?.split('@')[0] || 'User'}</p>
              <p className="text-xs text-[#a69b91] capitalize">{userRole}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className={`h-20 bg-white border-b border-[#e2e2e4] px-4 lg:px-8 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button 
              className="lg:hidden p-2 -ml-2 text-[#5f5e5e] hover:text-[#1a1c1d] rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="relative hidden md:block">
              <Search className={`absolute top-1/2 -translate-y-1/2 text-[#5f5e5e] ${isRTL ? 'right-3' : 'left-3'}`} size={20} />
              <input 
                type="text" 
                placeholder={t('admin.dashboard.search_ph')}
                className={`pe-4 py-2 w-64 lg:w-96 rounded-xl bg-[#eeeef0]/50 border border-transparent focus:border-[#e2e2e4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a1c1d] transition-all font-manrope text-sm ${isRTL ? 'ps-4 pe-10 text-right' : 'ps-10'}`}
              />
            </div>
          </div>

          <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
            <button className="relative p-2 text-[#5f5e5e] hover:text-[#1a1c1d] hover:bg-[#eeeef0] rounded-xl transition-colors">
              <Bell size={24} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full"></span>
            </button>
            <Link to="/" className="px-4 py-2 bg-[#eeeef0] hover:bg-[#e2e2e4] text-[#1a1c1d] text-sm font-medium rounded-xl transition-all">
              {t('admin.dashboard.view_store')}
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-8"
              >
                <div className={isRTL ? 'text-right' : ''}>
                  <h1 className="text-3xl font-noto-serif text-[#1a1c1d]">{t('admin.nav.analytics')}</h1>
                  <p className="text-[#5f5e5e] mt-1">{t('admin.dashboard.analytics_desc')}</p>
                </div>

                {/* Visual Business Intelligence — lazy loaded */}
                <Suspense fallback={
                  <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-[#826a11] border-t-transparent rounded-full animate-spin" />
                  </div>
                }>
                  <VisualAnalytics orders={orders} products={PRODUCTS} />
                </Suspense>

                {/* Main Dashboard Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Orders Overview */}
                  <div className="lg:col-span-2">
                    <AdminCard className="p-8">
                      <div className={`flex justify-between items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <h2 className="text-2xl font-noto-serif text-[#1a1c1d]">{t('admin.dashboard.recent_orders')}</h2>
                        <button onClick={() => setActiveTab('orders')} className={`text-xs uppercase tracking-widest font-bold text-[#826a11] hover:text-[#1a1c1d] flex items-center transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {t('admin.dashboard.view_all')} <ChevronRight size={14} className={isRTL ? 'me-1 scale-x-[-1]' : 'ms-1'} />
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-start border-collapse">
                          <thead>
                            <tr className={`border-b border-[#e2e2e4] text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                              <th className={`pb-4 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.dashboard.table.id')}</th>
                              <th className={`pb-4 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.dashboard.table.customer')}</th>
                              <th className={`pb-4 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.dashboard.table.status')}</th>
                              <th className={`pb-4 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.dashboard.table.payment')}</th>
                              <th className={`pb-4 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.dashboard.table.total')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e2e2e4]">
                            {recentOrders.map((order, i) => (
                              <tr key={i} className="hover:bg-[#fbfaf9] transition-colors group">
                                <td className="py-5 text-[#1a1c1d] font-bold text-sm tracking-wide">{order.id}</td>
                                <td className="py-5 text-[#5f5e5e] text-sm">{order.customer}</td>
                                <td className="py-5">
                                  <span className={`inline-flex px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md ${
                                    order.status === 'Delivered' ? 'bg-[#e8f6ef] text-[#21804f]' :
                                    order.status === 'Processing' ? 'bg-amber-50 text-amber-700' :
                                    'bg-blue-50 text-blue-700'
                                  }`}>
                                    {t(`admin.dashboard.status.${order.status?.toLowerCase()}`, { defaultValue: order.status })}
                                  </span>
                                </td>
                                <td className="py-5 text-[#a69b91] text-[10px] uppercase font-bold tracking-widest">{order.paymentMethod || 'Card'}</td>
                                <td className="py-5 text-[#1a1c1d] font-noto-serif font-medium">{order.total}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </AdminCard>
                  </div>

                  {/* Quick Actions / Activity */}
                  <div className="space-y-8">
                    <AdminCard className="p-8">
                      <h2 className={`text-xl font-noto-serif text-[#1a1c1d] mb-6 ${isRTL ? 'text-right' : ''}`}>{t('admin.dashboard.quick_actions')}</h2>
                      <div className="space-y-3">
                        {['admin', 'manager'].includes(userRole) && (
                          <button onClick={() => setActiveTab('add-product')} className={`w-full flex items-center justify-between p-4 rounded-xl border border-[#e2e2e4] hover:border-[#826a11] hover:bg-[#fbfaf9] transition-all group ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center text-[#5f5e5e] group-hover:text-[#1a1c1d] ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Package size={18} className={`${isRTL ? 'ms-3' : 'me-3'} text-[#a69b91] group-hover:text-[#826a11] transition-colors`} />
                              <span className="font-bold text-sm">{t('admin.dashboard.add_product')}</span>
                            </div>
                            <ChevronRight size={16} className={`text-[#a69b91] group-hover:text-[#826a11] transition-colors ${isRTL ? 'scale-x-[-1]' : ''}`} />
                          </button>
                        )}
                        <button className={`w-full flex items-center justify-between p-4 rounded-xl border border-[#e2e2e4] hover:border-[#826a11] hover:bg-[#fbfaf9] transition-all group ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex items-center text-[#5f5e5e] group-hover:text-[#1a1c1d] ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <TrendingUp size={18} className={`${isRTL ? 'ms-3' : 'me-3'} text-[#a69b91] group-hover:text-[#826a11] transition-colors`} />
                            <span className="font-bold text-sm">{t('admin.dashboard.discount_code')}</span>
                          </div>
                          <ChevronRight size={16} className={`text-[#a69b91] group-hover:text-[#826a11] transition-colors ${isRTL ? 'scale-x-[-1]' : ''}`} />
                        </button>
                      </div>
                    </AdminCard>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense fallback={
                  <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-2 border-[#826a11] border-t-transparent rounded-full animate-spin" />
                  </div>
                }>
                  <ReviewsManager />
                </Suspense>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-8 pb-20"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-noto-serif text-[#1a1c1d]">{t('admin.settings.title')}</h1>
                    <p className="text-[#a69b91] mt-1 font-bold text-sm tracking-wide">{t('admin.settings.desc')}</p>
                  </div>
                  <button 
                    onClick={handleSaveSettings}
                    className="px-8 py-3 bg-[#1a1c1d] text-white rounded-full text-xs uppercase tracking-widest font-bold hover:bg-[#826a11] transition-colors shadow-lg shadow-[#1a1c1d]/10 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {t('admin.settings.save_all')}
                  </button>
                </div>

                {/* ─── STORE IDENTITY ─── */}
                <AdminCard className="p-8">
                  <SectionDivider label={t('admin.settings.sections.identity')} icon={Type} />
                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">{t('admin.settings.sections.store_name')}</label>
                      <p className="text-sm text-[#5f5e5e] mb-3">{t('admin.settings.sections.store_name_desc')}</p>
                      <input 
                        type="text" 
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full max-w-md bg-[#f9f9fb] border-none rounded-xl px-5 py-4 font-noto-serif text-xl text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca]"
                        placeholder={t('admin.settings.sections.store_name_ph')}
                      />
                    </div>
                  </div>
                </AdminCard>

                {/* ─── HERO CAROUSEL IMAGES ─── */}
                <AdminCard className="p-8">
                  <SectionDivider label={t('admin.settings.sections.hero')} icon={Upload} />
                  <div className="mt-6 space-y-4">
                    <p className="text-sm text-[#5f5e5e]">Select multiple images for the hero carousel. They will crossfade with a cinematic Ken Burns effect.</p>
                    
                    {/* Carousel Preview — selected images in order */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {heroImages.map((src, idx) => (
                        <div key={`preview-${idx}`} className="relative flex-shrink-0 w-28 h-20 rounded-xl overflow-hidden border-2 border-[#826a11] group">
                          <img src={src} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute top-1 left-1 bg-[#826a11] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{idx + 1}</div>
                          {heroImages.length > 1 && (
                            <button onClick={() => toggleHeroImage(src)} className="absolute top-1 right-1 bg-red-500/80 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={12} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-[10px] uppercase tracking-widest text-[#a69b91] font-bold">{heroImages.length} image{heroImages.length !== 1 ? 's' : ''} selected · ~{heroImages.length * 6}s total cycle</p>
                      
                      <label className="relative cursor-pointer group">
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple
                          onChange={handleHeroImageUpload} 
                          className="hidden" 
                          disabled={isUploading}
                        />
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-[#826a11]/40 text-[#826a11] hover:bg-[#826a11]/5 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <Upload size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{isUploading ? t('admin.dashboard.status.uploading') : t('admin.dashboard.products.form.upload')}</span>
                        </div>
                      </label>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91]">{t('admin.settings.sections.hero_image_library')}</label>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {heroLibrary.map((path, idx) => {
                          const selectedIdx = heroImages.indexOf(path);
                          const isSelected = selectedIdx !== -1;
                          return (
                            <div key={idx} className="relative group/lib">
                              <button 
                                onClick={() => toggleHeroImage(path)}
                                className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                                  isSelected ? 'border-[#826a11] ring-2 ring-[#826a11]/30 shadow-lg' : 'border-[#e2e2e4] hover:border-[#826a11]/50'
                                }`}
                              >
                                <img src={path} alt={`Option ${idx}`} className="w-full h-full object-cover" />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-[#826a11]/30 flex items-center justify-center">
                                    <div className="bg-[#826a11] w-6 h-6 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">{selectedIdx + 1}</span>
                                    </div>
                                  </div>
                                )}
                              </button>
                              
                              {/* Delete from library button */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const isDefault = path.startsWith('/assets/images/');
                                  setConfirmModal({
                                    isOpen: true,
                                    title: isDefault ? 'Remove Default Image?' : 'Delete Image?',
                                    message: isDefault 
                                      ? 'Are you sure you want to remove this default image from your gallery? You can always restore it using the "Restore Defaults" button.' 
                                      : 'This image will be removed from your library and any active carousels. This action cannot be undone once settings are saved.',
                                    type: 'danger',
                                    onConfirm: () => {
                                      setHeroLibrary(prev => prev.filter(p => p !== path));
                                      setHeroImages(prev => prev.filter(p => p !== path));
                                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                    }
                                  });
                                }}
                                className="absolute -top-2 -right-2 bg-white shadow-lg text-red-500 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/lib:opacity-100 transition-all z-10 hover:bg-red-50 border border-red-100 transform hover:scale-110"
                                title="Remove from library"
                              >
                                <X size={14} strokeWidth={3} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </AdminCard>


                {/* ─── CURATED CATEGORIES ─── */}
                <AdminCard className="p-8">
                  <SectionDivider label="Curated Categories" icon={ImageIcon} />
                  <div className="mt-6 space-y-8">
                    <p className="text-sm text-[#5f5e5e]">Customize the categories grid on your home page. You can change titles and upload new cover images for each category.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {curatedCategories.map((cat, idx) => (
                        <div key={idx} className="p-6 rounded-2xl bg-[#f9f9fb] border border-[#e2e2e4] group hover:border-[#826a11] transition-all">
                          <div className="flex gap-6">
                            {/* Image Preview & Upload */}
                            <div className="relative w-24 h-32 rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-[#eeeef0]">
                              <img src={cat.image} alt={cat.slug} className="w-full h-full object-cover" />
                              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={(e) => handleCategoryImageUpload(idx, e)} 
                                  className="hidden" 
                                />
                                {categoryUploadIndex === idx ? (
                                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Upload size={20} className="text-white" />
                                )}
                              </label>
                            </div>

                            {/* Name Fields */}
                            <div className="flex-1 space-y-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-[#826a11]">Category {idx + 1}</span>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91]">{cat.slug}</span>
                              </div>
                              
                              <div className={isRTL ? 'text-right' : ''}>
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">Display Name</label>
                                <input
                                  type="text"
                                  value={typeof cat.name === 'object' ? (cat.name?.en || '') : (cat.name || '')}
                                  onChange={(e) => {
                                    const updated = [...curatedCategories];
                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                    setCuratedCategories(updated);
                                  }}
                                  placeholder="Category Name"
                                  className={`w-full bg-[#f9f9fb] border border-[#e2e2e4] rounded-xl px-5 py-3 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca] ${isRTL ? 'text-right' : ''}`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AdminCard>

                {/* ─── FEATURED FRAGRANCES ─── */}
                <AdminCard className="p-8">
                  <SectionDivider label={t('admin.settings.sections.featured')} icon={Star} />
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-[#5f5e5e]">{t('admin.settings.sections.featured_desc')}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        featuredIds.length >= 3 ? 'bg-amber-50 text-amber-700' : 'bg-[#e8f6ef] text-[#21804f]'
                      }`}>
                        {t('admin.settings.sections.featured_selected', { count: featuredIds.length })}
                      </span>
                    </div>

                    {/* Selected Products Row */}
                    {featuredIds.length > 0 && (
                      <div className="mb-6">
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-3">{t('admin.settings.sections.featured_current')}</label>
                        <div className="flex gap-3 flex-wrap">
                          {featuredIds.map(id => {
                            const product = PRODUCTS.find(p => p.id === id);
                            if (!product) return null;
                            return (
                              <div key={id} className="flex items-center bg-[#f9f9fb] border border-[#e2e2e4] rounded-2xl pe-3 overflow-hidden group hover:border-[#826a11] transition-all">
                                <div className="w-12 h-12 shrink-0">
                                  <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                </div>
                                <span className="px-3 text-sm font-bold text-[#1a1c1d] whitespace-nowrap">{product.title}</span>
                                <button 
                                  onClick={() => toggleFeaturedProduct(id)}
                                  className="ms-1 w-5 h-5 rounded-full bg-[#e2e2e4] flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors shrink-0"
                                >
                                  <X size={12} strokeWidth={2.5} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Product Selection Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {PRODUCTS.map(product => {
                        const isSelected = featuredIds.includes(product.id);
                        const isMaxReached = !isSelected && featuredIds.length >= 3;
                        const isProductDisabled = product.isActive === false;
                        const cantSelect = isMaxReached || isProductDisabled;
                        return (
                          <button 
                            key={product.id}
                            onClick={() => !cantSelect && toggleFeaturedProduct(product.id)}
                            disabled={cantSelect && !isSelected}
                            className={`flex items-center p-3 rounded-2xl border transition-all text-start relative ${
                              isSelected 
                                ? 'border-[#826a11] bg-[#fcfbf9] shadow-sm' 
                                : isProductDisabled
                                  ? 'border-red-200 bg-red-50/30 opacity-60 cursor-not-allowed'
                                  : isMaxReached
                                    ? 'border-[#e2e2e4] bg-[#f9f9fb] opacity-40 cursor-not-allowed'
                                    : 'border-[#e2e2e4] hover:border-[#826a11]/50 hover:bg-[#fbfaf9]'
                            }`}
                          >
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#eeeef0] shrink-0 border border-[#e2e2e4]">
                              <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="ms-3 flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#1a1c1d] truncate">{product.title}</p>
                              <p className="text-xs text-[#a69b91]">
                                {typeof product.type === 'object' ? (product.type?.en || '') : (product.type || '')} · {product.price?.toLocaleString()} DZD
                                {isProductDisabled && <span className="ms-1 text-red-500 font-bold"> · {t('admin.dashboard.products.status.disabled')}</span>}
                              </p>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ms-2 transition-all ${
                              isSelected ? 'bg-[#826a11] text-white' : isProductDisabled ? 'border-2 border-red-300' : 'border-2 border-[#e2e2e4]'
                            }`}>
                              {isSelected && <Check size={14} strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </AdminCard>

                {/* ─── BOUTIQUE FAVORITES ─── */}
                <AdminCard className="p-8">
                  <SectionDivider label={t('admin.settings.sections.boutique_favorites')} icon={Heart} />
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-[#5f5e5e]">{t('admin.settings.sections.boutique_favorites_desc')}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        boutiqueIds.length > 0 ? 'bg-[#e8f6ef] text-[#21804f]' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {t('admin.settings.sections.boutique_favorites_selected', { count: boutiqueIds.length })}
                      </span>
                    </div>

                    {/* Selected Products Row */}
                    {boutiqueIds.length > 0 && (
                      <div className="mb-6">
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-3">{t('admin.settings.sections.boutique_favorites_current')}</label>
                        <div className="flex gap-3 flex-wrap">
                          {boutiqueIds.map(id => {
                            const product = PRODUCTS.find(p => p.id === id);
                            if (!product) return null;
                            return (
                              <div key={id} className="flex items-center bg-[#f9f9fb] border border-[#e2e2e4] rounded-2xl pe-3 overflow-hidden group hover:border-[#826a11] transition-all">
                                <div className="w-12 h-12 shrink-0">
                                  <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                </div>
                                <span className="px-3 text-sm font-bold text-[#1a1c1d] whitespace-nowrap">{product.title}</span>
                                <button 
                                  onClick={() => toggleBoutiqueProduct(id)}
                                  className="ms-1 w-5 h-5 rounded-full bg-[#e2e2e4] flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors shrink-0"
                                >
                                  <X size={12} strokeWidth={2.5} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Product Selection Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {PRODUCTS.map(product => {
                        const isSelected = boutiqueIds.includes(product.id);
                        const isProductDisabled = product.isActive === false;
                        return (
                          <button 
                            key={product.id}
                            onClick={() => !isProductDisabled && toggleBoutiqueProduct(product.id)}
                            disabled={isProductDisabled && !isSelected}
                            className={`flex items-center p-3 rounded-2xl border transition-all text-start relative ${
                              isSelected 
                                ? 'border-[#826a11] bg-[#fcfbf9] shadow-sm' 
                                : isProductDisabled
                                  ? 'border-red-200 bg-red-50/30 opacity-60 cursor-not-allowed'
                                  : 'border-[#e2e2e4] hover:border-[#826a11]/50 hover:bg-[#fbfaf9]'
                            }`}
                          >
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#eeeef0] shrink-0 border border-[#e2e2e4]">
                              <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="ms-3 flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#1a1c1d] truncate">{product.title}</p>
                              <p className="text-xs text-[#a69b91] truncate">
                                {typeof product.type === 'object' ? (product.type?.en || '') : (product.type || '')}
                                {isProductDisabled && <span className="ms-1 text-red-500 font-bold"> · {t('admin.dashboard.products.status.disabled')}</span>}
                              </p>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ms-2 transition-all ${
                              isSelected ? 'bg-[#826a11] text-white' : isProductDisabled ? 'border-2 border-red-300' : 'border-2 border-[#e2e2e4]'
                            }`}>
                              {isSelected && <Check size={14} strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </AdminCard>

                {/* ─── CHECKOUT & SHIPPING ─── */}
                <AdminCard className="p-8">
                  <SectionDivider label={t('admin.settings.sections.checkout_shipping')} icon={ShoppingBag} />
                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">{t('admin.settings.sections.shipping_threshold')}</label>
                      <p className="text-sm text-[#5f5e5e] mb-4">{t('admin.settings.sections.shipping_threshold_desc')}</p>
                      <div className="relative w-64">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a69b91]">$</span>
                        <input 
                          type="number" 
                          value={shippingThreshold}
                          onChange={(e) => setShippingThreshold(e.target.value)}
                          className="w-full ps-8 pe-4 py-3 rounded-2xl border border-[#e2e2e4] hover:border-[#826a11] focus:outline-none focus:ring-1 focus:ring-[#826a11] bg-white transition-all text-[#1a1c1d] font-noto-serif"
                        />
                      </div>
                    </div>

                    <div className="pt-8 mt-8 border-t border-[#e2e2e4]">
                      <div className="flex flex-col gap-8">
                        {/* Interface Card */}
                        <div className="w-full bg-white p-6 rounded-[24px] border border-[#e2e2e4] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                          
                          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#f0ebe1]">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-[#1a1c1d] flex items-center justify-center shadow-md">
                                 <Truck size={18} className="text-[#d4b560]" />
                               </div>
                               <div>
                                 <h4 className="font-bold text-[#1a1c1d]">{t('admin.settings.sections.shipping_provider')}</h4>
                                 <p className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91]">{t('admin.settings.sections.active_gateway')}</p>
                               </div>
                             </div>
                             <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-[10px] uppercase tracking-wider font-extrabold flex items-center border border-red-100">
                               <span className="w-1.5 h-1.5 bg-red-600 rounded-full me-2 animate-pulse"></span> {t('admin.settings.sections.disconnected')}
                             </span>
                          </div>

                          <div className="space-y-6">
                            <div ref={shippingDropdownRef} className="relative">
                              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">{t('admin.settings.sections.shipping_partner')}</label>
                              <button
                                onClick={() => setIsShippingDropdownOpen(!isShippingDropdownOpen)}
                                className="w-full flex items-center justify-between bg-[#f9f9fb] border border-transparent rounded-xl px-4 py-3.5 text-start hover:bg-[#f5f4f2] transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  {(() => {
                                    const current = getProvider(shippingProvider);
                                    if (!current) return <span className="text-sm text-[#a69b91]">{isAddingNewService ? newServiceName || 'Custom Service' : 'Select a provider'}</span>;
                                    return (
                                      <>
                                        <div className="w-8 h-8 rounded-lg bg-[#826a11]/10 flex items-center justify-center">
                                          <Truck size={16} className="text-[#826a11]" />
                                        </div>
                                        <span className="text-sm font-bold text-[#1a1c1d]">{current.title} <span className="font-normal text-[#a69b91] capitalize">({current.engine})</span></span>
                                      </>
                                    );
                                  })()}
                                </div>
                                <ChevronRight size={16} className={`text-[#a69b91] transition-transform duration-200 ${isShippingDropdownOpen ? 'rotate-90' : ''}`} />
                              </button>

                              {isShippingDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-[#e2e2e4] shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                                  {Object.entries(providerGroups).map(([engineKey, group]) => (
                                    <div key={engineKey}>
                                      <div className="px-4 py-2 bg-[#f9f9fb] border-b border-[#e2e2e4] sticky top-0">
                                        <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-[#826a11]">{group.label}</span>
                                      </div>
                                      {group.providers.map((provider) => {
                                        const isSelected = shippingProvider === provider.key;
                                        return (
                                          <button
                                            key={provider.key}
                                            onClick={() => { setShippingProvider(provider.key); setIsShippingDropdownOpen(false); setIsAddingNewService(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-start transition-all ${isSelected ? 'bg-[#fcfbf9]' : 'hover:bg-[#fbfaf9]'}`}
                                          >
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#826a11]/10' : 'bg-[#f9f9fb] border border-[#e2e2e4]'}`}>
                                              <Truck size={14} className={isSelected ? 'text-[#826a11]' : 'text-[#5f5e5e]'} />
                                            </div>
                                            <p className="text-sm font-bold text-[#1a1c1d] flex-1">{provider.title}</p>
                                            {isSelected && (
                                              <div className="w-5 h-5 rounded-full bg-[#826a11] flex items-center justify-center">
                                                <Check size={12} className="text-white" strokeWidth={3} />
                                              </div>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ))}
                                  <div className="border-t border-[#e2e2e4]">
                                    <button
                                      onClick={() => { setIsShippingDropdownOpen(false); setIsAddingNewService(true); setShippingProvider('custom'); setNewServiceName(''); }}
                                      className="w-full flex items-center gap-3 px-4 py-3.5 text-start transition-all hover:bg-[#fbfaf9] group"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-[#f9f9fb] border border-dashed border-[#d1cdca] group-hover:border-[#826a11] flex items-center justify-center transition-colors">
                                        <PlusCircle size={16} className="text-[#a69b91] group-hover:text-[#826a11] transition-colors" />
                                      </div>
                                      <p className="text-sm font-bold text-[#a69b91] group-hover:text-[#1a1c1d] transition-colors">{t('admin.settings.sections.custom_service')}</p>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {isAddingNewService && (
                              <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">{t('admin.settings.sections.service_name')}</label>
                                <input
                                  type="text"
                                  value={newServiceName}
                                  onChange={(e) => setNewServiceName(e.target.value)}
                                  placeholder={t('admin.dashboard.products.form.placeholders.story')}
                                  className="w-full bg-[#f9f9fb] border border-transparent rounded-xl px-4 py-3.5 text-sm text-[#1a1c1d] hover:bg-[#f5f4f2] focus:bg-white focus:border-[#826a11] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca] font-bold"
                                  autoFocus
                                />
                              </div>
                            )}

                            {/* Dynamic Credential Fields based on engine type */}
                            {(() => {
                              const currentProvider = getProvider(shippingProvider);
                              const labels = currentProvider ? getCredentialLabels(currentProvider.engine) : [{ key: 'token', label: 'API Token', placeholder: 'Your Token' }];
                              return labels.map(field => (
                                <div key={field.key}>
                                  <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">{field.label}</label>
                                  <div className="relative">
                                    <input
                                      type="password"
                                      value={field.key === 'id' ? shippingApiId : field.key === 'key' ? shippingApiKey : shippingApiToken}
                                      onChange={(e) => {
                                        if (field.key === 'id') setShippingApiId(e.target.value);
                                        else if (field.key === 'key') setShippingApiKey(e.target.value);
                                        else setShippingApiToken(e.target.value);
                                      }}
                                      placeholder={field.placeholder}
                                      className="w-full bg-[#f9f9fb] border border-transparent rounded-xl ps-4 pe-12 py-3.5 text-sm font-mono text-[#1a1c1d] hover:bg-[#f5f4f2] focus:bg-white focus:border-[#826a11] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca]"
                                    />
                                    <Eye size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a69b91] cursor-pointer hover:text-[#1a1c1d]" />
                                  </div>
                                </div>
                              ));
                            })()}

                            {/* Origin Wilaya */}
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">{t('admin.settings.sections.origin_wilaya')}</label>
                              <p className="text-xs text-[#a69b91] mb-2">{t('admin.settings.sections.origin_wilaya_desc')}</p>
                              <select
                                value={originWilaya}
                                onChange={(e) => setOriginWilaya(e.target.value)}
                                className="w-full bg-[#f9f9fb] border border-transparent rounded-xl px-4 py-3.5 text-sm text-[#1a1c1d] hover:bg-[#f5f4f2] focus:bg-white focus:border-[#826a11] focus:ring-1 focus:ring-[#826a11] outline-none transition-all appearance-none"
                              >
                                <option value="">{t('admin.settings.sections.select_wilaya')}</option>
                                {algeriaWilayas.map(w => (
                                  <option key={w.code} value={w.name}>{w.code} - {w.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                              {getProvider(shippingProvider) && (
                                <button
                                  onClick={handleTestCredentials}
                                  disabled={isTestingCredentials}
                                  className="px-6 py-2.5 bg-white border border-[#e2e2e4] text-[#1a1c1d] rounded-full text-xs font-bold tracking-wide hover:border-[#826a11] hover:text-[#826a11] transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isTestingCredentials ? (
                                    <><div className="w-3.5 h-3.5 border-2 border-[#826a11] border-t-transparent rounded-full animate-spin me-2"></div> {t('admin.settings.sections.testing')}</>
                                  ) : (
                                    <><AlertCircle size={14} className="me-2" /> {t('admin.settings.sections.test_credentials')}</>
                                  )}
                                </button>
                              )}
                               <button 
                                 onClick={handleSyncRates}
                                 disabled={isSyncingRates || !savedShippingConfig?.provider}
                                 className="px-6 py-2.5 bg-white border border-[#e2e2e4] text-[#1a1c1d] rounded-full text-xs font-bold tracking-wide hover:border-[#21804f] hover:text-[#21804f] transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                               >
                                 {isSyncingRates ? (
                                   <><div className="w-3.5 h-3.5 border-2 border-[#21804f] border-t-transparent rounded-full animate-spin me-2"></div> Syncing...</>
                                 ) : (
                                   <><Download size={14} className="me-2" /> Sync Prices</>
                                 )}
                               </button>
                               <button 
                                 onClick={handleSaveShippingConfig}
                                 disabled={isSavingShipping}
                                 className="px-8 py-2.5 bg-[#1a1c1d] border border-[#1a1c1d] text-white rounded-full text-xs font-bold tracking-wide hover:bg-[#826a11] hover:border-[#826a11] transition-all shadow-md hover:-translate-y-0.5 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                               >
                                 {isSavingShipping ? (
                                   <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin me-2"></div> {t('admin.settings.sections.saving')}</>
                                 ) : (
                                   <><Save size={14} className="me-2 text-[#d4b560]" strokeWidth={2.5} /> {t('admin.settings.sections.save')}</>
                                 )}
                               </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </AdminCard>

                {/* Bottom Save Button */}
                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleSaveSettings}
                    className="px-10 py-3.5 bg-[#1a1c1d] text-white rounded-full text-xs uppercase tracking-widest font-bold hover:bg-[#826a11] transition-colors shadow-lg shadow-[#1a1c1d]/10 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {t('admin.settings.save_all')}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-8"
              >
                <div className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-4 ${isRTL ? 'md:flex-row-reverse text-right' : ''}`}>
                  <div className={isRTL ? 'text-right' : ''}>
                    <h1 className="text-3xl font-noto-serif text-[#1a1c1d]">{t('admin.dashboard.orders.title')}</h1>
                    <p className="text-[#a69b91] mt-1 font-bold text-sm tracking-wide">{t('admin.dashboard.orders.desc')}</p>
                  </div>
                  <div className={`flex flex-wrap gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button onClick={exportOrdersToCSV} className="px-6 py-2.5 bg-white text-[#1a1c1d] border border-[#e2e2e4] rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-[#fbfaf9] hover:border-[#826a11] transition-all flex items-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <Download size={14} strokeWidth={2.5} className={`${isRTL ? 'ms-2' : 'me-2'} text-[#a69b91]`} /> {t('admin.dashboard.orders.export')}
                    </button>
                  </div>
                </div>

                {/* Pipeline Tabs */}
                <div className="flex overflow-x-auto no-scrollbar border-b border-[#e2e2e4] mb-2">
                  {[
                    { id: 'All', label: 'All', icon: 'list' },
                    { id: 'Pending', label: 'Pending', icon: 'schedule', color: 'text-amber-500' },
                    { id: 'Confirmed', label: 'Confirmed', icon: 'check_circle', color: 'text-[#21804f]' },
                    { id: 'Shipped', label: 'Shipped', icon: 'local_shipping', color: 'text-blue-500' },
                    { id: 'Delivered', label: 'Delivered', icon: 'inventory_2', color: 'text-[#1a1c1d]' },
                    { id: 'Cancelled', label: 'Cancelled', icon: 'cancel', color: 'text-red-500' }
                  ].map(tab => {
                    const isActive = orderPipelineTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setOrderPipelineTab(tab.id);
                          setSelectedOrderIds([]); // Reset selection when switching tabs
                        }}
                        className={`px-6 py-4 flex items-center gap-2 whitespace-nowrap border-b-2 transition-colors ${
                          isActive ? 'border-[#826a11] text-[#1a1c1d] bg-[#fbfaf9]' : 'border-transparent text-[#a69b91] hover:text-[#1a1c1d] hover:bg-[#F9F9F7]'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-lg ${isActive && tab.color ? tab.color : ''}`}>{tab.icon}</span>
                        <span className="font-bold text-sm tracking-wide">{tab.label}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#eeeef0] text-[10px] text-[#5f5e5e] font-bold">
                          {tab.id === 'All' 
                            ? orders.length 
                            : orders.filter(o => o.status === tab.id || (tab.id === 'Pending' && o.status === 'Processing')).length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <AdminCard className="p-8">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                      <thead>
                        <tr className={`border-b border-[#e2e2e4] text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                          <th className={`pb-4 w-10`}>
                            <input 
                              type="checkbox" 
                              className="rounded accent-[#826a11]"
                              checked={
                                orders.filter(o => orderPipelineTab === 'All' || o.status === orderPipelineTab || (orderPipelineTab === 'Pending' && o.status === 'Processing')).length > 0 && 
                                selectedOrderIds.length === orders.filter(o => orderPipelineTab === 'All' || o.status === orderPipelineTab || (orderPipelineTab === 'Pending' && o.status === 'Processing')).length
                              }
                              onChange={(e) => {
                                const currentFilteredOrders = orders.filter(o => orderPipelineTab === 'All' || o.status === orderPipelineTab || (orderPipelineTab === 'Pending' && o.status === 'Processing'));
                                if (e.target.checked) setSelectedOrderIds(currentFilteredOrders.map(o => o.id));
                                else setSelectedOrderIds([]);
                              }}
                            />
                          </th>
                          <th className={`pb-4 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.dashboard.table.id')}</th>
                          <th className={`pb-4 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.dashboard.table.customer')}</th>
                          <th className={`pb-4 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.dashboard.orders.table.date')}</th>
                          <th className={`pb-4 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.dashboard.table.status')}</th>
                          <th className={`pb-4 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.dashboard.table.payment')}</th>
                          <th className={`pb-4 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.dashboard.table.total')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2e2e4]">
                        {orders
                          ?.filter(o => orderPipelineTab === 'All' || o.status === orderPipelineTab || (orderPipelineTab === 'Pending' && o.status === 'Processing'))
                          .map((order, i) => (
                          <tr 
                            key={i} 
                            className={`hover:bg-[#fbfaf9] cursor-pointer transition-colors group ${selectedOrderIds.includes(order.id) ? 'bg-[#826a11]/5' : ''}`}
                          >
                            <td className="py-5" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                className="rounded accent-[#826a11]"
                                checked={selectedOrderIds.includes(order.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedOrderIds([...selectedOrderIds, order.id]);
                                  else setSelectedOrderIds(selectedOrderIds.filter(id => id !== order.id));
                                }}
                              />
                            </td>
                            <td className="py-5 text-[#1a1c1d] font-bold text-sm tracking-wide" onClick={() => setSelectedOrder(order)}>{order.id}</td>
                            <td className="py-5 text-[#5f5e5e] text-sm" onClick={() => setSelectedOrder(order)}>{order.customer}</td>
                            <td className="py-5 text-[#5f5e5e] text-sm" onClick={() => setSelectedOrder(order)}>{order.date}</td>
                            <td className="py-5" onClick={() => setSelectedOrder(order)}>
                              <span className={`inline-flex px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md ${
                                order.status === 'Delivered' ? 'bg-[#e8f6ef] text-[#21804f]' :
                                order.status === 'Processing' ? 'bg-amber-50 text-amber-700' :
                                order.status === 'Shipped' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {t(`admin.dashboard.status.${order.status?.toLowerCase()}`, { defaultValue: order.status })}
                              </span>
                            </td>
                            <td className="py-5 text-[#a69b91] text-[10px] uppercase font-bold tracking-widest">{order.paymentMethod || 'Card'}</td>
                            <td className="py-5 text-[#1a1c1d] font-noto-serif font-medium">{order.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AdminCard>

                {/* Bulk Actions Fixed Bar */}
                <AnimatePresence>
                  {selectedOrderIds.length > 0 && (
                    <motion.div 
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 100, opacity: 0 }}
                      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-[#1a1c1d] text-white px-8 py-4 rounded-[28px] shadow-2xl flex items-center gap-8 border border-[#d4b560]/20"
                    >
                      <div className="flex items-center gap-3 pe-8 border-e border-white/10">
                        <span className="w-8 h-8 rounded-full bg-[#826a11] flex items-center justify-center font-bold text-sm text-white">{selectedOrderIds.length}</span>
                        <span className="text-xs uppercase tracking-widest font-bold whitespace-nowrap">{t('admin.dashboard.orders.selected', 'Orders Selected')}</span>
                      </div>
                      
                      <div className="flex gap-4">
                        {orderPipelineTab === 'Pending' && (
                          <button 
                            onClick={handleConfirmSelectedOrders}
                            className="flex items-center gap-2 px-6 py-2 bg-[#21804f] text-white rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-[#1a663f] transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Confirm
                          </button>
                        )}

                        {orderPipelineTab === 'Confirmed' && (
                          <>
                            <button 
                              onClick={handlePrintOfficialLabels}
                              disabled={isPrintingOfficialLabels}
                              className="flex items-center gap-2 px-6 py-2 bg-white text-[#1a1c1d] rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-[#d4b560] transition-colors disabled:opacity-50"
                            >
                              {isPrintingOfficialLabels ? (
                                <><div className="w-3 h-3 border-2 border-[#826a11] border-t-transparent rounded-full animate-spin"></div> Loading...</>
                              ) : (
                                <><Tag size={14} className="text-[#826a11]" /> Official Labels</>
                              )}
                            </button>
                            <button 
                              onClick={handlePrintLabels}
                              className="flex items-center gap-2 px-5 py-2 bg-white/10 text-white/80 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-white/20 transition-colors border border-white/10"
                            >
                              <Tag size={14} className="text-white/40" />
                              Custom Labels
                            </button>
                            <button 
                              onClick={() => { setIsShippingModalOpen(true); setSelectedShippingService(''); }}
                              className="flex items-center gap-2 px-6 py-2 bg-[#826a11] text-white rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-[#1a1c1d] transition-colors"
                            >
                              <Truck size={14} className="text-[#d4b560]" />
                              Send to Shipping
                            </button>
                          </>
                        )}
                        
                        <button 
                          onClick={() => setSelectedOrderIds([])}
                          className="text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white transition-colors ms-4"
                        >
                          {t('admin.common.cancel', 'Cancel')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'incomplete-orders' && (
              <motion.div
                key="incomplete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-8"
              >
                <div className={isRTL ? 'text-right' : ''}>
                  <h1 className="text-3xl font-noto-serif text-[#1a1c1d]">{t('admin.dashboard.incomplete.title')}</h1>
                  <p className="text-[#a69b91] mt-1 font-bold text-sm tracking-wide">{t('admin.dashboard.incomplete.desc')}</p>
                </div>
                <AdminCard className="p-8">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                      <thead>
                        <tr className={`border-b border-[#e2e2e4] text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                          <th className={`pb-4 font-bold text-start ${isRTL ? 'pe-4 text-right' : 'ps-4'}`}>{t('admin.dashboard.table.customer')}</th>
                          <th className={`pb-4 font-bold text-start ${isRTL ? 'text-right' : ''}`}>{t('admin.dashboard.incomplete.table.contact')}</th>
                          <th className={`pb-4 font-bold text-start ${isRTL ? 'text-right' : ''}`}>{t('admin.dashboard.incomplete.table.items')}</th>
                          <th className={`pb-4 font-bold text-start ${isRTL ? 'text-right' : ''}`}>{t('admin.dashboard.incomplete.table.potential')}</th>
                          <th className={`pb-4 font-bold text-start ${isRTL ? 'text-right' : ''}`}>{t('admin.dashboard.incomplete.table.activity')}</th>
                          <th className={`pb-4 font-bold text-start ${isRTL ? 'ps-4 text-right' : 'pe-4 text-left'}`}>{t('admin.dashboard.table.status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eeeef0]">
                        {incompleteOrders.map((order) => (
                          <tr key={order.id} className="group hover:bg-[#F9F9F7] transition-all cursor-pointer" onClick={() => setSelectedOrder(order)}>
                            <td className="py-5 ps-4">
                              <p className="text-sm font-bold text-[#1a1c1d]">{order.customer || 'Guest'}</p>
                            </td>
                            <td className="py-5">
                              <p className="text-xs font-bold text-[#1a1c1d]">{order.phone}</p>
                              <p className="text-[10px] text-[#a69b91]">{order.email}</p>
                            </td>
                            <td className="py-5 text-xs text-[#5f5e5e] font-medium">
                              {order.items?.length || 0} items
                            </td>
                            <td className="py-5">
                              <p className="text-sm font-bold text-[#1a1c1d]">{(order.total || 0).toLocaleString()} DZD</p>
                            </td>
                            <td className="py-5 text-xs text-[#a69b91] font-bold">
                              {order.lastUpdated}
                            </td>
                            <td className="py-5 pe-4">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] uppercase tracking-wider font-extrabold">
                                  Abandoned
                                </span>
                                {order.phone && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const phone = order.phone.replace(/\D/g, '');
                                      const formattedPhone = phone.startsWith('0') ? '213' + phone.slice(1) : phone;
                                      const message = `Bonjour ${order.customer || 'Cher client'}, nous avons remarqué que vous avez laissé des articles dans votre panier chez L'Essence Pur. Souhaitez-vous de l'aide pour finaliser votre commande ?`;
                                      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                                    }}
                                    className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-lg hover:bg-[#25D366] hover:text-white transition-all transform hover:scale-110 active:scale-95"
                                    title="Recover via WhatsApp"
                                  >
                                    <MessageSquare size={14} strokeWidth={2.5} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {incompleteOrders.length === 0 && (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-[#a69b91] font-medium italic">
                              {t('admin.dashboard.incomplete.empty')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </AdminCard>
              </motion.div>
            )}

            {activeTab === 'shipments' && (
              <motion.div
                key="shipments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-8"
              >
                <div className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-4 ${isRTL ? 'md:flex-row-reverse text-right' : ''}`}>
                  <div className={isRTL ? 'text-right' : ''}>
                    <h1 className="text-3xl font-noto-serif text-[#1a1c1d]">{t('admin.dashboard.shipments.title')}</h1>
                    <p className="text-[#a69b91] mt-1 font-bold text-sm tracking-wide">{t('admin.dashboard.shipments.desc')}</p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <AdminCard className="p-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-1">{t('admin.dashboard.shipments.stats.shipped')}</p>
                    <h3 className="text-3xl font-noto-serif text-[#1a1c1d]">{orders?.filter(o => o.status === 'Shipped').length || 0}</h3>
                  </AdminCard>
                  <AdminCard className="p-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-1">{t('admin.dashboard.shipments.stats.delivered')}</p>
                    <h3 className="text-3xl font-noto-serif text-[#21804f]">{orders?.filter(o => o.status === 'Delivered').length || 0}</h3>
                  </AdminCard>
                  <AdminCard className="p-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-1">{t('admin.dashboard.shipments.stats.cancelled')}</p>
                    <h3 className="text-3xl font-noto-serif text-red-500">{orders?.filter(o => o.status === 'Cancelled').length || 0}</h3>
                  </AdminCard>
                </div>

                <AdminCard className="p-8">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                      <thead>
                        <tr className={`border-b border-[#e2e2e4] text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                          <th className={`pb-4 font-bold text-start ${isRTL ? 'text-right' : ''}`}>{t('admin.dashboard.table.id')}</th>
                          <th className={`pb-4 font-bold text-start ${isRTL ? 'text-right' : ''}`}>{t('admin.dashboard.table.customer')}</th>
                          <th className={`pb-4 font-bold text-start ${isRTL ? 'text-right' : ''}`}>{t('admin.dashboard.shipments.table.service')}</th>
                          <th className={`pb-4 font-bold text-start ${isRTL ? 'text-right' : ''}`}>{t('admin.dashboard.shipments.table.tracking')}</th>
                          <th className={`pb-4 font-bold text-start ${isRTL ? 'text-right' : ''}`}>{t('admin.dashboard.shipments.table.shipped_at')}</th>
                          <th className={`pb-4 font-bold text-start ${isRTL ? 'text-right' : ''}`}>{t('admin.dashboard.table.status')}</th>
                          <th className={`pb-4 font-bold text-start ${isRTL ? 'text-right' : ''}`}>{t('admin.dashboard.table.total')}</th>
                          <th className={`pb-4 font-bold text-end ${isRTL ? 'text-left' : ''}`}>{t('admin.dashboard.shipments.table.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eeeef0]">
                        {orders?.filter(o => o.status === 'Shipped' || o.status === 'Delivered' || o.status === 'Cancelled').length === 0 && (
                          <tr>
                            <td colSpan="8" className="py-16 text-center text-[#a69b91] font-medium italic">
                              {t('admin.dashboard.shipments.empty')}
                            </td>
                          </tr>
                        )}
                        {orders?.filter(o => o.status === 'Shipped' || o.status === 'Delivered' || o.status === 'Cancelled')
                          .sort((a, b) => (b.shippedAt || '').localeCompare(a.shippedAt || ''))
                          .map((order) => (
                          <tr key={order.id} className="group hover:bg-[#F9F9F7] transition-all">
                            <td className="py-5 text-[#1a1c1d] font-bold text-sm tracking-wide">{order.id}</td>
                            <td className="py-5">
                              <p className="text-sm font-bold text-[#1a1c1d]">{order.customer || 'Guest'}</p>
                              <p className="text-[10px] text-[#a69b91]">{order.phone || ''}</p>
                            </td>
                            <td className="py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-[#826a11]/10 flex items-center justify-center">
                                  <Truck size={12} className="text-[#826a11]" />
                                </div>
                                <span className="text-xs font-bold text-[#1a1c1d]">{order.shippingService || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-5">
                              {order.trackingNumber ? (
                                <span className="text-xs font-medium text-[#826a11] bg-[#826a11]/10 px-2.5 py-1 rounded-md tracking-wider">
                                  {order.trackingNumber}
                                </span>
                              ) : (
                                <span className="text-xs text-[#a69b91]">N/A</span>
                              )}
                            </td>
                            <td className="py-5 text-xs text-[#5f5e5e]">
                              {order.shippedAt ? new Date(order.shippedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td className="py-5">
                              <span className={`inline-flex px-2.5 py-1 text-[10px] uppercase tracking-wider font-extrabold rounded-full ${
                                order.status === 'Delivered' ? 'bg-[#e8f6ef] text-[#21804f]' :
                                order.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                'bg-blue-50 text-blue-700'
                              }`}>
                                {t(`admin.dashboard.status.${order.status?.toLowerCase()}`, { defaultValue: order.status })}
                              </span>
                            </td>
                            <td className="py-5 text-[#1a1c1d] font-noto-serif font-medium">{order.total}</td>
                            <td className="py-5 text-end">
                              {order.status === 'Shipped' && (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await setDoc(doc(db, 'orders', order.id), { status: 'Delivered', deliveredAt: new Date().toISOString() }, { merge: true });
                                        addToast(`Order ${order.id} marked as delivered`, 'success');
                                      } catch (err) { addToast('Failed to update', 'error'); }
                                    }}
                                    className="px-3 py-1.5 bg-[#e8f6ef] text-[#21804f] rounded-full text-[10px] uppercase tracking-wider font-extrabold hover:bg-[#21804f] hover:text-white transition-all"
                                  >
                                    Delivered
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await setDoc(doc(db, 'orders', order.id), { status: 'Cancelled', cancelledAt: new Date().toISOString() }, { merge: true });
                                        addToast(`Order ${order.id} cancelled`, 'warning');
                                      } catch (err) { addToast('Failed to update', 'error'); }
                                    }}
                                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-[10px] uppercase tracking-wider font-extrabold hover:bg-red-600 hover:text-white transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                              {order.status === 'Delivered' && (
                                <span className="text-[10px] text-[#21804f] font-bold uppercase tracking-wider">
                                  {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '✓'}
                                </span>
                              )}
                              {order.status === 'Cancelled' && (
                                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                                  {order.cancelledAt ? new Date(order.cancelledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '✗'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AdminCard>
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-8"
              >
                <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                  <div className={isRTL ? 'text-right' : ''}>
                    <h1 className="text-3xl font-noto-serif text-[#1a1c1d]">{t('admin.dashboard.products.title')}</h1>
                    <p className="text-[#a69b91] mt-1 font-bold text-sm tracking-wide">{t('admin.dashboard.products.desc')}</p>
                  </div>
                  {['admin', 'manager'].includes(userRole) && (
                    <button onClick={() => setActiveTab('add-product')} className="px-8 py-3 bg-[#1a1c1d] text-white rounded-full text-xs uppercase tracking-widest font-bold flex items-center hover:bg-[#826a11] transition-colors shadow-lg shadow-[#1a1c1d]/10 hover:shadow-xl hover:-translate-y-0.5">
                      <PlusCircle size={16} className={isRTL ? 'ms-2' : 'me-2'} strokeWidth={2.5} /> {t('admin.dashboard.products.add_button')}
                    </button>
                  )}
                </div>

                <AdminCard className="p-8">
                  <div className={`flex flex-col md:flex-row justify-between items-center mb-8 gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                    <div className="relative w-full md:w-96">
                      <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[#a69b91]`} size={18} />
                      <input 
                        type="text" 
                        placeholder={t('admin.dashboard.products.search_ph')}
                        className={`${isRTL ? 'pe-12 ps-4 text-right' : 'ps-12 pe-4'} py-3 w-full rounded-2xl border border-[#e2e2e4] hover:border-[#826a11] focus:outline-none focus:ring-1 focus:ring-[#826a11] bg-white transition-all text-[#1a1c1d] font-noto-serif`}
                      />
                    </div>
                    <div className="flex space-x-3">
                       <button className="px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold border border-[#e2e2e4] rounded-2xl hover:bg-[#fbfaf9] hover:border-[#826a11] transition-colors text-[#1a1c1d]">{t('admin.dashboard.orders.export')}</button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                      <thead>
                        <tr className={`border-b border-[#e2e2e4] text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'text-right' : ''}`}>
                          <th className="text-start px-6 py-4">{t('admin.dashboard.products.table.product')}</th>
                          <th className="text-start px-6 py-4">{t('admin.dashboard.products.table.category')}</th>
                          <th className="text-start px-6 py-4">{t('admin.dashboard.products.table.inventory')}</th>
                          <th className="text-start px-6 py-4 text-center">{t('admin.dashboard.products.table.price')}</th>
                          <th className="text-start px-6 py-4">{t('admin.dashboard.products.table.status')}</th>
                          <th className="text-start px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2e2e4]">
                        {PRODUCTS.map(product => (
                          <tr key={product.id} className="hover:bg-[#fbfaf9] transition-colors group">
                            <td className="py-5">
                               <div className="flex items-center">
                                 <div className="w-12 h-12 bg-[#eeeef0] rounded-xl me-4 border border-[#e2e2e4] overflow-hidden">
                                   <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                 </div>
                                 <span className="text-[#1a1c1d] font-bold text-sm tracking-wide">{product.title}</span>
                               </div>
                            </td>
                            <td className="py-5 text-[#5f5e5e] text-sm">{typeof product.type === 'object' ? (product.type?.en || '') : (product.type || '')}</td>
                            <td className="py-5">
                               <span className={`text-sm ${product.inventory === 0 ? 'text-amber-600' : 'text-[#5f5e5e]'}`}>
                                  {product.inventory !== undefined ? `${product.inventory} ${t('admin.dashboard.products.status.in_stock')}` : t('admin.dashboard.products.status.stock')}
                               </span>
                            </td>
                            <td className="py-5 text-[#1a1c1d] font-noto-serif font-medium text-center">{product.price?.toLocaleString()} DZD</td>
                            <td className="py-5">
                               <button
                                 onClick={async () => {
                                   if (!['admin', 'manager'].includes(userRole)) {
                                     addToast('You do not have permission to change product status', 'error');
                                     return;
                                   }
                                   try {
                                     await updateProduct(product.id, { isActive: product.isActive === false ? true : false });
                                     addToast(`${product.title} ${product.isActive === false ? 'activated' : 'disabled'}`, product.isActive === false ? 'success' : 'warning');
                                   } catch (err) {
                                     addToast('Failed to update product status', 'error');
                                   }
                                 }}
                                 className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-full transition-all ${!['admin', 'manager'].includes(userRole) ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70' : `cursor-pointer hover:scale-105 active:scale-95 ${product.isActive !== false ? 'bg-[#e8f6ef] text-[#21804f] hover:bg-red-100 hover:text-red-700' : 'bg-red-100 text-red-700 hover:bg-[#e8f6ef] hover:text-[#21804f]'}`}`}
                                 disabled={!['admin', 'manager'].includes(userRole)}
                                 title={!['admin', 'manager'].includes(userRole) ? t('admin.dashboard.products.status.no_permission', { defaultValue: 'No permission to change status' }) : (product.isActive !== false ? t('admin.dashboard.products.status.click_disable', { defaultValue: 'Click to disable' }) : t('admin.dashboard.products.status.click_activate', { defaultValue: 'Click to activate' }))}
                               >
                                 {product.isActive !== false ? t('admin.dashboard.products.status.active') : t('admin.dashboard.products.status.disabled')}
                               </button>
                            </td>
                            <td className="py-5 text-end">
                               <button 
                                 onClick={() => handleEditProductClick(product)}
                                 className="text-[#a69b91] hover:text-[#1a1c1d] transition-colors"
                               >
                                 <MoreVertical size={18}/>
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AdminCard>
              </motion.div>
            )}

            {activeTab === 'add-product' && (
              <motion.div
                key="add-product"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full pb-20"
              >
                <div className={`flex justify-between items-center mb-8 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                   <div className={isRTL ? 'text-right' : ''}>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#826a11] font-bold mb-2">{t('admin.nav.products').toUpperCase()} / {editingProductId ? t('admin.dashboard.products.form.edit_title') : t('admin.dashboard.products.form.new_title')}</p>
                      <h1 className="text-4xl font-noto-serif text-[#1a1c1d]">{editingProductId ? t('admin.dashboard.products.form.edit') : t('admin.dashboard.products.form.create')}</h1>
                   </div>
                   <div className={`flex space-x-4 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <button onClick={() => { setActiveTab('products'); setEditingProductId(null); }} className="px-6 py-2.5 rounded-full border border-[#e2e2e4] text-[#1a1c1d] font-medium hover:bg-[#eeeef0] transition-colors">{t('admin.dashboard.products.form.cancel')}</button>
                      <button onClick={handleAddProductSubmit} className="px-6 py-2.5 rounded-full bg-[#826a11] text-white font-medium hover:bg-[#6b570e] transition-colors shadow-md">{editingProductId ? t('admin.dashboard.products.form.save') : t('admin.dashboard.products.form.publish')}</button>
                   </div>
                </div>

                <div className="bg-white rounded-[32px] p-10 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-[#e2e2e4]">
                   <div className="grid grid-cols-1 xl:grid-cols-12 gap-x-16 gap-y-12">
                      
                      {/* Left Column (Product Info & Pyramid) */}
                      <div className="xl:col-span-7 space-y-12">
                         
                         {/* Section: Product Information */}
                         <div>
                           <div className={`flex items-center mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div className="h-px bg-[#e2e2e4] w-8"></div>
                              <span className="px-4 text-[10px] font-bold tracking-[0.2em] text-[#a69b91] uppercase whitespace-nowrap">{t('admin.dashboard.products.form.info_header')}</span>
                              <div className="h-px bg-[#e2e2e4] flex-1"></div>
                           </div>

                           <div className="space-y-6">
                              <div className={`flex mb-4 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                                <label className={`flex items-center space-x-3 cursor-pointer ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91]">{t('admin.dashboard.products.form.status_label')}</span>
                                  <select 
                                    value={newProduct.isActive !== false ? 'true' : 'false'}
                                    onChange={(e) => setNewProduct({...newProduct, isActive: e.target.value === 'true'})}
                                    className="bg-[#f9f9fb] border-none rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#826a11]"
                                  >
                                    <option value="true" className="text-[#21804f]">{t('admin.dashboard.products.status.active')}</option>
                                    <option value="false" className="text-red-500">{t('admin.dashboard.products.status.disabled')}</option>
                                  </select>
                                </label>
                              </div>
                              <div className={isRTL ? 'text-right' : ''}>
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2 cursor-pointer">{t('admin.dashboard.products.form.product_name')}</label>
                                <input type="text" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} className={`w-full bg-[#f9f9fb] border-none rounded-xl px-5 py-4 font-noto-serif italic text-2xl text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca] ${isRTL ? 'text-right' : ''}`} placeholder={t('admin.dashboard.products.form.placeholders.santal')} />
                              </div>
                              
                              <div className={`grid grid-cols-2 gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                 <div className={`col-span-2 ${isRTL ? 'text-right' : ''}`}>
                                   <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">{t('admin.dashboard.products.form.collection')}</label>
                                   <input type="text" value={newProduct.type} onChange={e => setNewProduct({...newProduct, type: e.target.value})} className={`w-full bg-[#f9f9fb] border-none rounded-xl px-5 py-4 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca] ${isRTL ? 'text-right' : ''}`} placeholder="Eau de Parfum" />
                                 </div>
                                 <div className={isRTL ? 'text-right' : ''}>
                                   <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2 hover:text-[#826a11] transition-colors cursor-pointer">{t('admin.dashboard.products.form.gender')}</label>
                                   <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className={`w-full bg-[#f9f9fb] border-none rounded-xl px-5 py-3 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] outline-none transition-all cursor-pointer ${isRTL ? 'text-right' : ''}`}>
                                      <option value="unisex">{t('admin.dashboard.products.form.genders.unisex')}</option>
                                      <option value="men">{t('admin.dashboard.products.form.genders.men')}</option>
                                      <option value="women">{t('admin.dashboard.products.form.genders.women')}</option>
                                      <option value="luxury">{t('admin.dashboard.products.form.genders.luxury')}</option>
                                   </select>
                                 </div>
                                 <div className={isRTL ? 'text-right' : ''}>
                                   <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">{t('admin.dashboard.products.form.family')}</label>
                                   <input type="text" value={newProduct.fragranceFamily} onChange={e => setNewProduct({...newProduct, fragranceFamily: e.target.value})} className={`w-full bg-[#f9f9fb] border-none rounded-xl px-5 py-4 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca] ${isRTL ? 'text-right' : ''}`} placeholder="Oriental" />
                                 </div>
                              </div>

                              <div className={isRTL ? 'text-right' : ''}>
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">{t('admin.dashboard.products.form.desc_label')}</label>
                                <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} rows="4" className={`w-full bg-[#f9f9fb] border-none rounded-xl px-5 py-4 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca] resize-none ${isRTL ? 'text-right' : ''}`} placeholder={t('admin.dashboard.products.form.placeholders.story')} />
                              </div>
                           </div>
                         </div>

                         {/* Section: Olfactory Pyramid */}
                         <div>
                           <div className={`flex items-center mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div className="h-px bg-[#e2e2e4] w-8"></div>
                              <span className="px-4 text-[10px] font-bold tracking-[0.2em] text-[#a69b91] uppercase whitespace-nowrap">{t('admin.dashboard.products.form.pyramid_header')}</span>
                              <div className="h-px bg-[#e2e2e4] flex-1"></div>
                           </div>
                           
                           <div className="space-y-4">
                              <div className={isRTL ? 'text-right' : ''}>
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">{t('admin.dashboard.products.form.top_notes')}</label>
                                <input type="text" value={newProduct.topNotes} onChange={e => setNewProduct({...newProduct, topNotes: e.target.value})} className={`w-full bg-[#f9f9fb] border-none rounded-xl px-5 py-4 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca] ${isRTL ? 'text-right' : ''}`} placeholder={t('admin.dashboard.products.form.placeholders.notes')} />
                              </div>
                              <div className={isRTL ? 'text-right' : ''}>
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">{t('admin.dashboard.products.form.heart_notes')}</label>
                                <input type="text" value={newProduct.heartNotes} onChange={e => setNewProduct({...newProduct, heartNotes: e.target.value})} className={`w-full bg-[#f9f9fb] border-none rounded-xl px-5 py-4 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca] ${isRTL ? 'text-right' : ''}`} placeholder={t('admin.dashboard.products.form.placeholders.notes')} />
                              </div>
                              <div className={isRTL ? 'text-right' : ''}>
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2">{t('admin.dashboard.products.form.base_notes')}</label>
                                <input type="text" value={newProduct.baseNotes} onChange={e => setNewProduct({...newProduct, baseNotes: e.target.value})} className={`w-full bg-[#f9f9fb] border-none rounded-xl px-5 py-4 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca] ${isRTL ? 'text-right' : ''}`} placeholder={t('admin.dashboard.products.form.placeholders.notes')} />
                              </div>
                           </div>
                         </div>

                      </div>

                      {/* Right Column (Visuals & Inventory) */}
                      <div className="xl:col-span-5 space-y-12">
                         
                         {/* Section: Visual Gallery */}
                         <div>
                           <div className={`flex items-center mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div className="h-px bg-[#e2e2e4] w-8"></div>
                              <span className="px-4 text-[10px] font-bold tracking-[0.2em] text-[#a69b91] uppercase whitespace-nowrap">{t('admin.dashboard.products.form.images_header')}</span>
                              <div className="h-px bg-[#e2e2e4] flex-1"></div>
                           </div>

                           <div className="space-y-4">
                             <label className="border border-dashed border-[#d1cdca] bg-[#fbfaf9] rounded-[32px] h-[340px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#f5f4f2] transition-all hover:border-[#826a11] group relative overflow-hidden">
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                {isUploading ? (
                                    <div className="flex flex-col items-center">
                                      <div className="w-8 h-8 border-2 border-[#826a11] border-t-transparent rounded-full animate-spin mb-4"></div>
                                      <p className="text-[10px] font-bold tracking-[0.2em] text-[#826a11] uppercase">{t('admin.dashboard.status.uploading')}</p>
                                    </div>
                                ) : newProduct.image ? (
                                    <img src={newProduct.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <ImageIcon size={32} className="text-[#d1cdca] mb-4 group-hover:text-[#826a11] transition-colors" strokeWidth={1.5} />
                                        <p className="text-[10px] font-bold tracking-[0.2em] text-[#a69b91] uppercase group-hover:text-[#826a11] transition-colors">{t('admin.dashboard.products.form.upload')}</p>
                                        <p className="text-[10px] text-[#b0a8a1] mt-2">Min 2000 x 2000px</p>
                                    </>
                                )}
                             </label>
                             
                              <div className="grid grid-cols-3 gap-4">
                                {[0, 1, 2].map(i => (
                                  <div key={i} className="relative group">
                                    <label className="border border-dashed border-[#d1cdca] bg-[#fbfaf9] rounded-2xl aspect-square flex items-center justify-center cursor-pointer hover:bg-[#f5f4f2] transition-colors hover:border-[#826a11] overflow-hidden">
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => handleGalleryImageUpload(e, i)}
                                      />
                                      {newProduct.gallery[i] ? (
                                        <img src={newProduct.gallery[i]} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                                      ) : (
                                        <ImageIcon size={24} className="text-[#e2e2e4] group-hover:text-[#826a11]" strokeWidth={1.5} />
                                      )}
                                    </label>
                                    {newProduct.gallery[i] && (
                                      <div className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="w-2 h-2 bg-[#826a11] rounded-full scale-50"></div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                           </div>
                         </div>

                         {/* Section: Inventory Details */}
                         <div>
                           <div className={`flex items-center mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div className="h-px bg-[#e2e2e4] w-8"></div>
                              <span className="px-4 text-[10px] font-bold tracking-[0.2em] text-[#a69b91] uppercase whitespace-nowrap">{t('admin.dashboard.products.form.inventory_header')}</span>
                              <div className="h-px bg-[#e2e2e4] flex-1"></div>
                           </div>

                           <div className="space-y-6">
                              <div className={isRTL ? 'text-right' : ''}>
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-2 hover:text-[#826a11] transition-colors cursor-pointer">{t('admin.dashboard.products.form.sku_label')}</label>
                                <input type="text" className={`w-full bg-[#f9f9fb] border border-[#e2e2e4] rounded-xl px-5 py-3 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca] ${isRTL ? 'text-right' : ''}`} defaultValue="SL-001-GOLD" />
                              </div>

                              <div className={isRTL ? 'text-right' : ''}>
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-4">{t('admin.dashboard.products.form.financials_header')}</label>
                                
                                <div className="space-y-4">
                                  {newProduct.sizes.map((size, index) => (
                                    <div key={index} className={`grid grid-cols-2 gap-4 items-end relative group/size p-4 bg-[#fcfbf9] rounded-2xl border border-[#f0ebe1] hover:border-[#826a11] transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
                                       <div className={isRTL ? 'text-right' : ''}>
                                         <label className="block text-[8px] tracking-[0.1em] font-bold text-[#a69b91] mb-2 uppercase">{t('admin.dashboard.products.table.price')} (DZD)</label>
                                         <input 
                                          type="text" 
                                          value={size.price} 
                                          onChange={e => {
                                            const updatedSizes = [...newProduct.sizes];
                                            updatedSizes[index].price = e.target.value;
                                            const updateObj = { sizes: updatedSizes };
                                            if (index === 0) updateObj.price = e.target.value;
                                            setNewProduct({...newProduct, ...updateObj});
                                          }} 
                                          className="w-full bg-white border border-[#e2e2e4] rounded-xl px-4 py-3 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca]" 
                                          placeholder="12500" 
                                         />
                                       </div>
                                       <div className={isRTL ? 'text-right' : ''}>
                                         <label className="block text-[8px] tracking-[0.1em] font-bold text-[#a69b91] mb-2 uppercase">{t('product.size')}</label>
                                         <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                                           <input 
                                            type="text" 
                                            value={size.volume} 
                                            onChange={e => {
                                              const updatedSizes = [...newProduct.sizes];
                                              updatedSizes[index].volume = e.target.value;
                                              const updateObj = { sizes: updatedSizes };
                                              if (index === 0) updateObj.volume = e.target.value;
                                              setNewProduct({...newProduct, ...updateObj});
                                            }} 
                                            className="flex-1 bg-white border border-[#e2e2e4] rounded-xl px-4 py-3 text-sm text-[#1a1c1d] focus:ring-1 focus:ring-[#826a11] outline-none transition-all placeholder:text-[#d1cdca]" 
                                            placeholder="100ml" 
                                           />
                                           {newProduct.sizes.length > 1 && (
                                             <button 
                                              type="button"
                                              onClick={() => setNewProduct({...newProduct, sizes: newProduct.sizes.filter((_, i) => i !== index)})}
                                              className="p-2 text-[#a69b91] hover:text-red-500 transition-colors"
                                             >
                                               <X size={16} />
                                             </button>
                                           )}
                                         </div>
                                       </div>
                                    </div>
                                  ))}

                                  <button 
                                    onClick={() => setNewProduct({...newProduct, sizes: [...newProduct.sizes, {volume: '', price: ''}]})}
                                    type="button"
                                    className={`w-full py-4 border border-dashed border-[#d1cdca] rounded-xl text-[10px] font-bold tracking-[0.2em] text-[#a69b91] hover:bg-[#fbfaf9] hover:text-[#826a11] hover:border-[#826a11] transition-all flex items-center justify-center uppercase gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                                  >
                                    <PlusCircle size={14} />
                                    {t('admin.dashboard.products.form.add_volume', { defaultValue: 'Add Volume Option' })}
                                  </button>
                                </div>
                              </div>

                              {/* Discount */}
                              <div className={`mt-6 ${isRTL ? 'text-right' : ''}`}>
                                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-4">{t('labels.off', { defaultValue: 'DISCOUNT' }).toUpperCase()}</label>
                                <div className="p-5 bg-[#fcfbf9] rounded-2xl border border-[#f0ebe1] space-y-4">
                                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-sm font-medium text-[#1a1c1d]">{t('product.discount_percentage', { defaultValue: 'Discount Percentage' })}</span>
                                    <span className={`text-lg font-bold ${newProduct.discount > 0 ? 'text-red-500' : 'text-[#a69b91]'}`}>
                                      {newProduct.discount || 0}%
                                    </span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="0" max="90" step="5"
                                    value={newProduct.discount || 0}
                                    onChange={e => setNewProduct({...newProduct, discount: parseInt(e.target.value)})}
                                    className="w-full h-2 bg-[#e2e2e4] rounded-full appearance-none cursor-pointer accent-[#826a11]"
                                  />
                                  <div className="flex justify-between text-[9px] text-[#a69b91] font-bold uppercase tracking-widest">
                                    <span>No discount</span>
                                    <span>90% off</span>
                                  </div>
                                  {newProduct.discount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => { setPendingDiscount(newProduct.discount); setShowDiscountPreview(true); }}
                                      className="w-full mt-2 py-3 bg-[#826a11] text-white rounded-xl text-xs font-bold tracking-[0.15em] uppercase hover:bg-[#6b5710] transition-all flex items-center justify-center gap-2"
                                    >
                                      <Eye size={14} />
                                      Preview Discounted Prices
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-6">
                                  <div 
                                    onClick={() => setNewProduct({...newProduct, featured: !newProduct.featured})}
                                    className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${newProduct.featured ? 'bg-[#826a11]/5 border-[#826a11]' : 'border-[#e2e2e4] hover:bg-[#f9f9fb]'}`}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-bold tracking-[0.1em] text-[#a69b91] uppercase">HOMEPAGE HERO</span>
                                      <span className="text-sm font-medium text-[#1a1c1d]">FEATURED</span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${newProduct.featured ? 'bg-[#826a11]' : 'bg-[#e2e2e4]'}`}>
                                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${newProduct.featured ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                  </div>
                                  <div 
                                    onClick={() => setNewProduct({...newProduct, boutique: !newProduct.boutique})}
                                    className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${newProduct.boutique ? 'bg-[#826a11]/5 border-[#826a11]' : 'border-[#e2e2e4] hover:bg-[#f9f9fb]'}`}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-bold tracking-[0.1em] text-[#a69b91] uppercase">BOUTIQUE SECTION</span>
                                      <span className="text-sm font-medium text-[#1a1c1d]">SELECTION</span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${newProduct.boutique ? 'bg-[#826a11]' : 'bg-[#e2e2e4]'}`}>
                                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${newProduct.boutique ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                  </div>
                               </div>

                              <div className="border border-[#e2e2e4] rounded-xl p-4 flex items-center justify-between mt-4">
                                 <div className="flex items-center text-[#21804f] font-medium text-sm">
                                   <Package size={18} className="me-2 stroke-[1.5]" /> ACTIVE STOCK
                                 </div>
                                 <div className="w-12 h-6 bg-[#826a11] rounded-full relative cursor-pointer shadow-inner">
                                   <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                 </div>
                              </div>

                           </div>
                         </div>

                      </div>

                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'subscribers' && (
              <motion.div
                key="subscribers"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-8 pb-20"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-noto-serif text-[#1a1c1d]">{t('admin.clients.title')}</h1>
                    <p className="text-[#a69b91] mt-1 font-bold text-sm tracking-wide">{t('admin.clients.desc')}</p>
                  </div>
                  <button
                    onClick={async () => {
                      setUsersLoading(true);
                      const users = await fetchAllUsers();
                      setAllUsers(users);
                      setUsersLoading(false);
                    }}
                    className="px-6 py-2.5 bg-[#1a1c1d] text-white rounded-full text-xs uppercase tracking-widest font-bold hover:bg-[#826a11] transition-colors"
                  >
                    {t('admin.clients.refresh')}
                  </button>
                </div>

                {usersLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-[#826a11] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : allUsers.filter(u => !u.role || u.role === 'customer').length === 0 ? (
                  <AdminCard className="p-12 text-center">
                    <UserCheck size={48} className="text-[#e2e2e4] mx-auto mb-4" />
                    <h3 className="font-noto-serif text-xl text-[#1a1c1d] mb-2">{t('admin.clients.empty_title')}</h3>
                    <p className="text-sm text-[#a69b91]">{t('admin.clients.empty_desc')}</p>
                  </AdminCard>
                ) : (
                  <AdminCard>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#e2e2e4]">
                            <th className={`text-start px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'text-right' : ''}`}>{t('admin.clients.table.name')}</th>
                            <th className={`text-start px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'text-right' : ''}`}>{t('admin.clients.table.contact')}</th>
                            <th className={`text-start px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'text-right' : ''}`}>{t('admin.clients.table.location')}</th>
                            <th className={`text-start px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'text-right' : ''}`}>{t('admin.clients.table.date')}</th>
                            {userRole === 'admin' && (
                              <th className={`text-start px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'text-right' : ''}`}>{t('admin.clients.table.role')}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.filter(u => !u.role || u.role === 'customer').map(u => (
                            <tr key={u.id} className="border-b border-[#e2e2e4]/50 hover:bg-[#F9F9F7] transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-[#826a11]/10 flex items-center justify-center text-sm font-bold text-[#826a11] uppercase">
                                    {(u.firstName?.[0] || u.email?.[0] || '?')}
                                  </div>
                                  <span className="font-bold text-sm text-[#1a1c1d]">{u.firstName ? `${u.firstName} ${u.lastName || ''}` : 'Unknown'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-[#1a1c1d] break-all">{u.email || '—'}</p>
                                <p className="text-xs text-[#a69b91]">{u.shipping?.phone || u.phone || 'No Phone'}</p>
                              </td>
                              <td className="px-6 py-4 text-xs text-[#5f5e5e]">
                                {u.shipping?.wilayaCode 
                                  ? (algeriaWilayas.find(w => w.code === u.shipping.wilayaCode)?.name || `Wilaya ${u.shipping.wilayaCode}`)
                                  : '—'}
                              </td>
                              <td className="px-6 py-4 text-xs text-[#5f5e5e]">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                              {userRole === 'admin' && (
                                <td className="px-6 py-4">
                                  <select
                                    value={u.role || 'customer'}
                                    onChange={async (e) => {
                                      const newRole = e.target.value;
                                      setRoleChangeLoading(u.id);
                                      try {
                                        await updateUserRole(u.id, newRole);
                                        setAllUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
                                        addToast(`${u.firstName || u.email} promoted to ${newRole}`, 'success');
                                      } catch (err) {
                                        addToast('Failed to update role: ' + err.message, 'error');
                                      } finally {
                                        setRoleChangeLoading(null);
                                      }
                                    }}
                                    disabled={roleChangeLoading === u.id}
                                    className="bg-[#F9F9F7] border border-[#e2e2e4] rounded-xl px-3 py-2 text-xs font-bold text-[#1a1c1d] cursor-pointer focus:ring-1 focus:ring-[#826a11] outline-none disabled:opacity-50"
                                  >
                                    <option value="customer">Customer</option>
                                    <option value="confirmer">Confirmer</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AdminCard>
                )}
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-noto-serif text-[#1a1c1d]">{t('admin.messages.title')}</h1>
                  <p className="text-[#a69b91] mt-1 font-bold text-sm tracking-wide">{t('admin.messages.desc')}</p>
                </div>
                <div className="space-y-6">
                  {inquiries.length === 0 ? (
                    <AdminCard className="p-12 text-center">
                      <MessageSquare size={48} className="mx-auto text-[#e2e2e4] mb-4" strokeWidth={1} />
                      <p className="text-[#a69b91] text-sm">{t('admin.messages.empty')}</p>
                    </AdminCard>
                ) : (
                    inquiries.map((msg) => (
                      <AdminCard key={msg.id} className="p-8 hover:border-[#826a11]/30 transition-all">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#826a11]/5 border border-[#826a11]/10 flex items-center justify-center text-[#826a11]">
                              <User size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-noto-serif text-[#1a1c1d]">{msg.name}</h3>
                              <p className="text-sm text-[#a69b91] font-medium">{msg.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className={`${isRTL ? 'text-start' : 'text-end'}`}>
                               <p className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91]">{t('admin.messages.table.received')}</p>
                               <p className="text-xs text-[#1a1c1d] font-bold">{msg.sentAt?.toDate ? msg.sentAt.toDate().toLocaleDateString() : 'Just now'}</p>
                             </div>
                             <button 
                               onClick={() => handleDeleteEntry('messages', msg.id)}
                               className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors ms-4"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </div>
                        <div className="bg-[#fbfaf9] rounded-2xl p-6 border border-[#f0ebe1]">
                          <p className="text-[#5f5e5e] text-sm leading-relaxed italic">
                            "{msg.message}"
                          </p>
                        </div>
                      </AdminCard>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* TEAM TAB — Admin Only */}
            {activeTab === 'team' && userRole === 'admin' && (
              <motion.div
                key="team"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-8 pb-20"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-noto-serif text-[#1a1c1d]">{t('admin.team.title')}</h1>
                    <p className="text-[#a69b91] mt-1 font-bold text-sm tracking-wide">{t('admin.team.desc')}</p>
                  </div>
                  <button
                    onClick={async () => {
                      setUsersLoading(true);
                      const users = await fetchAllUsers();
                      setAllUsers(users);
                      setUsersLoading(false);
                    }}
                    className="px-6 py-2.5 bg-[#1a1c1d] text-white rounded-full text-xs uppercase tracking-widest font-bold hover:bg-[#826a11] transition-colors"
                  >
                    {t('admin.team.refresh')}
                  </button>
                </div>

                {usersLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-[#826a11] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : allUsers.filter(u => ['admin', 'manager', 'confirmer'].includes(u.role)).length === 0 ? (
                  <AdminCard className="p-12 text-center">
                    <Users size={48} className="text-[#e2e2e4] mx-auto mb-4" />
                    <h3 className="font-noto-serif text-xl text-[#1a1c1d] mb-2">{t('admin.team.empty_title')}</h3>
                    <p className="text-sm text-[#a69b91]">{t('admin.team.empty_desc')}</p>
                  </AdminCard>
                ) : (
                  <AdminCard>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#e2e2e4]">
                            <th className={`text-start px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'text-right' : ''}`}>{t('admin.team.table.user')}</th>
                            <th className={`text-start px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'text-right' : ''}`}>{t('admin.team.table.email')}</th>
                            <th className={`text-start px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'text-right' : ''}`}>{t('admin.team.table.joined')}</th>
                            <th className={`text-start px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] ${isRTL ? 'text-right' : ''}`}>{t('admin.team.table.role')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.filter(u => ['admin', 'manager', 'confirmer'].includes(u.role)).map(u => (
                            <tr key={u.id} className="border-b border-[#e2e2e4]/50 hover:bg-[#F9F9F7] transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-[#1a1c1d] flex items-center justify-center text-sm font-bold text-white uppercase">
                                    {(u.firstName?.[0] || u.email?.[0] || '?')}
                                  </div>
                                  <span className="font-bold text-sm text-[#1a1c1d]">{u.firstName ? `${u.firstName} ${u.lastName || ''}` : '—'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-[#5f5e5e]">{u.email || '—'}</td>
                              <td className="px-6 py-4 text-xs text-[#a69b91]">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                              <td className="px-6 py-4">
                                {u.id === currentUser?.uid ? (
                                  <span className="px-3 py-1.5 bg-[#826a11]/10 text-[#826a11] rounded-full text-[10px] font-bold uppercase tracking-widest">You ({u.role || 'customer'})</span>
                                ) : u.email?.toLowerCase() === 'adou4849@gmail.com' ? (
                                  <span className="px-3 py-1.5 bg-[#826a11] text-white rounded-full text-[10px] font-bold uppercase tracking-widest">Super Admin</span>
                                ) : (u.role === 'admin' && currentUser?.email?.toLowerCase() !== 'adou4849@gmail.com') ? (
                                  <span className="px-3 py-1.5 bg-[#1a1c1d]/10 text-[#1a1c1d] rounded-full text-[10px] font-bold uppercase tracking-widest">Admin</span>
                                ) : (
                                  <select
                                    value={u.role || 'customer'}
                                    onChange={async (e) => {
                                      const newRole = e.target.value;
                                      setRoleChangeLoading(u.id);
                                      try {
                                        await updateUserRole(u.id, newRole);
                                        setAllUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
                                        addToast(`${u.firstName || u.email} is now a ${newRole}`, 'success');
                                      } catch (err) {
                                        addToast('Failed to update role: ' + err.message, 'error');
                                      } finally {
                                        setRoleChangeLoading(null);
                                      }
                                    }}
                                    disabled={roleChangeLoading === u.id}
                                    className="bg-[#F9F9F7] border border-[#e2e2e4] rounded-xl px-3 py-2 text-xs font-bold text-[#1a1c1d] cursor-pointer focus:ring-1 focus:ring-[#826a11] outline-none disabled:opacity-50"
                                  >
                                    <option value="customer">Customer</option>
                                    <option value="confirmer">Confirmer</option>
                                    <option value="manager">Manager</option>
                                    {currentUser?.email?.toLowerCase() === 'adou4849@gmail.com' && (
                                      <option value="admin">Admin</option>
                                    )}
                                  </select>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AdminCard>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Discount Preview Modal */}
      <AnimatePresence>
        {showDiscountPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-[#1a1c1d]">Discount Preview</h3>
                    <p className="text-xs font-bold tracking-widest text-[#a69b91] uppercase">Applied: {pendingDiscount}% OFF</p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                    <Tag size={24} />
                  </div>
                </div>

                <div className="space-y-3">
                  {newProduct.sizes.map((size, idx) => {
                    const originalPrice = parseFloat(size.price) || 0;
                    const discountedPrice = Math.floor(originalPrice * (1 - pendingDiscount / 100));
                    return (
                      <div key={idx} className="p-4 rounded-2xl bg-[#f9f9fb] border border-[#e2e2e4] flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-[#a69b91] uppercase tracking-widest">{size.volume || 'Price'}</span>
                          <span className="text-xs text-[#5f5e5e] line-through decoration-red-500/50">{originalPrice.toLocaleString()} DZD</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-lg font-black text-[#1a1c1d]">{discountedPrice.toLocaleString()} DZD</span>
                          <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">SAVING {(originalPrice - discountedPrice).toLocaleString()} DZD</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDiscountPreview(false)}
                    className="flex-1 py-4 rounded-2xl text-xs font-bold tracking-widest uppercase text-[#a69b91] hover:bg-[#f9f9fb] transition-all"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      setShowDiscountPreview(false);
                      addToast("Discount previewed. Click 'Save Changes' to apply to store.", "info");
                    }}
                    className="flex-1 py-4 rounded-2xl bg-[#826a11] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#6b5710] shadow-lg shadow-[#826a11]/20 transition-all"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a1c1d]/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#e2e2e4]"
            >
              {/* Header */}
              <div className="p-8 border-b border-[#e2e2e4] flex justify-between items-center bg-[#fbfaf9]">
                <div>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h2 className="text-2xl font-noto-serif text-[#1a1c1d]">{t('admin.order_modal.order_id')} {selectedOrder.id}</h2>
                    <span className={`inline-flex px-3 py-1 text-[10px] uppercase tracking-widest font-black rounded-full ${
                      selectedOrder.status === 'Delivered' ? 'bg-[#e8f6ef] text-[#21804f]' :
                      selectedOrder.status === 'Processing' ? 'bg-amber-50 text-amber-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {t(`admin.dashboard.status.${(selectedOrder.status || 'processing').toLowerCase()}`, { defaultValue: selectedOrder.status })}
                    </span>
                  </div>
                  <p className="text-[#a69b91] text-xs font-bold tracking-widest uppercase mt-1">{t('admin.order_modal.placed_on')} {selectedOrder.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  {!isEditingOrder ? (
                    <>
                      {(selectedOrder.status === 'Pending' || selectedOrder.status === 'Processing') && (
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await updateOrder(selectedOrder.id, { status: 'Confirmed' });
                                setSelectedOrder({...selectedOrder, status: 'Confirmed'});
                                addToast("Order marked as Confirmed", "success");
                              } catch (e) {
                                addToast("Failed to confirm order", "error");
                              }
                            }}
                            className="px-6 py-2.5 bg-[#e8f6ef] text-[#21804f] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#d1ecd9] transition-all flex items-center gap-2"
                          >
                            <Check size={14} /> Confirm
                          </button>
                          
                        </div>
                      )}
                      {selectedOrder.status === 'Confirmed' && (
                        <button
                          onClick={() => {
                            setSelectedOrderIds([selectedOrder.id]);
                            setIsShippingModalOpen(true);
                            setSelectedShippingService('');
                            setSelectedOrder(null); // Close details modal to show shipping modal clearly
                          }}
                          className="px-6 py-2.5 bg-[#826a11] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#1a1c1d] transition-all flex items-center gap-2"
                        >
                          <Truck size={14} className="text-[#d4b560]" /> Send to Shipping
                        </button>
                      )}
                        <button 
                          onClick={() => {
                            setIsEditingOrder(true);
                            setEditedOrder(JSON.parse(JSON.stringify(selectedOrder)));
                          }}
                          className="px-6 py-2.5 bg-white border border-[#e2e2e4] text-[#1a1c1d] rounded-xl text-xs font-bold uppercase tracking-widest hover:border-[#826a11] hover:text-[#826a11] transition-all flex items-center gap-2"
                        >
                          <Edit2 size={14} /> {t('admin.order_modal.edit_order')}
                        </button>
                      
                      {selectedOrder.id.startsWith('INC-') && selectedOrder.phone && (
                        <button
                          onClick={() => {
                            const phone = selectedOrder.phone.replace(/\D/g, '');
                            const formattedPhone = phone.startsWith('0') ? '213' + phone.slice(1) : phone;
                            const message = `Bonjour ${selectedOrder.customer || 'Cher client'}, nous avons remarqué que vous avez laissé des articles dans votre panier chez L'Essence Pur. Souhaitez-vous de l'aide pour finaliser votre commande ?`;
                            window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="px-6 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#1ebd5e] transition-all flex items-center gap-2 shadow-lg shadow-[#25D366]/20"
                        >
                          <MessageSquare size={14} strokeWidth={2.5} /> WhatsApp Recover
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                       {selectedOrder.id.startsWith('INC-') && (
                         <>
                           <button 
                             onClick={() => {
                               setConfirmModal({
                                 isOpen: true,
                                 title: 'Delete Incomplete Order?',
                                 message: 'Are you sure you want to delete this incomplete order? This will remove all associated customer data and cart items.',
                                 type: 'danger',
                                 onConfirm: async () => {
                                   try {
                                     await deleteIncompleteOrder(selectedOrder.id);
                                     addToast('Incomplete order deleted', 'info');
                                     setSelectedOrder(null);
                                     setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                   } catch (err) {
                                     addToast('Failed to delete', 'error');
                                   }
                                 }
                               });
                             }}
                             className="px-6 py-2.5 bg-[#ba1a1a] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#931515] transition-all flex items-center gap-2"
                           >
                             <Trash2 size={14} /> {t('admin.order_modal.delete')}
                           </button>
                           <button 
                             onClick={async () => {
                               try {
                                 const newId = await convertIncompleteToOrder(selectedOrder.id, editedOrder);
                                 setSelectedOrder(null);
                                 setIsEditingOrder(false);
                                 addToast(`Converted to Order ${newId}`, "success");
                                 setActiveTab('orders');
                               } catch (err) {
                                 addToast("Conversion failed", "error");
                               }
                             }}
                             className="px-6 py-2.5 bg-[#21804f] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#1a663f] transition-all flex items-center gap-2"
                           >
                             <Check size={14} /> {t('admin.order_modal.mark_complete')}
                           </button>
                         </>
                       )}
                       <button 
                         onClick={() => setIsEditingOrder(false)}
                         className="px-6 py-2.5 bg-[#eeeef0] text-[#5f5e5e] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#e2e2e4] transition-all"
                       >
                         {t('admin.common.cancel')}
                       </button>
                       <button 
                         onClick={async () => {
                           try {
                             if (selectedOrder.id.startsWith('INC-')) {
                               await updateIncompleteOrder(selectedOrder.id, editedOrder);
                             } else {
                               await updateOrder(selectedOrder.id, editedOrder);
                             }
                             setSelectedOrder(editedOrder);
                             setIsEditingOrder(false);
                             addToast("Order updated successfully", "success");
                           } catch (err) {
                             addToast("Failed to update order", "error");
                           }
                         }}
                         className="px-6 py-2.5 bg-[#1a1c1d] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#826a11] transition-all shadow-lg shadow-[#1a1c1d]/10"
                       >
                         {t('admin.common.save')}
                       </button>
                     </div>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedOrder(null);
                      setIsEditingOrder(false);
                      setLiveTrackingStatus(null);
                    }}
                    className="w-12 h-12 bg-white border border-[#e2e2e4] rounded-2xl flex items-center justify-center text-[#a69b91] hover:text-[#1a1c1d] hover:border-[#1a1c1d] transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Col: Customer & Shipping */}
                  <div className="lg:col-span-1 space-y-8">
                    <div>
                      <SectionDivider label={t('admin.order_modal.customer_info')} icon={User} />
                      <div className="mt-4 p-5 rounded-3xl bg-[#f9f9fb] border border-[#e2e2e4] space-y-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91] mb-0.5">{t('admin.order_modal.full_name')}</p>
                          {!isEditingOrder ? (
                            <p className="text-sm font-bold text-[#1a1c1d]">{selectedOrder.customer}</p>
                          ) : (
                            <input 
                              type="text" 
                              value={editedOrder.customer}
                              onChange={(e) => setEditedOrder({...editedOrder, customer: e.target.value})}
                              className="w-full bg-white border border-[#e2e2e4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#826a11]"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91] mb-0.5">{t('admin.order_modal.email')}</p>
                          {!isEditingOrder ? (
                            <p className="text-sm font-medium text-[#5f5e5e]">{selectedOrder.email}</p>
                          ) : (
                            <input 
                              type="email" 
                              value={editedOrder.email}
                              onChange={(e) => setEditedOrder({...editedOrder, email: e.target.value})}
                              className="w-full bg-white border border-[#e2e2e4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#826a11]"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91] mb-0.5">{t('admin.order_modal.phone')}</p>
                          {!isEditingOrder ? (
                            <p className="text-sm font-medium text-[#5f5e5e]">{selectedOrder.shipping?.phone || 'N/A'}</p>
                          ) : (
                            <input 
                              type="text" 
                              value={editedOrder.shipping?.phone || ''}
                              onChange={(e) => setEditedOrder({
                                ...editedOrder, 
                                shipping: { ...editedOrder.shipping, phone: e.target.value }
                              })}
                              className="w-full bg-white border border-[#e2e2e4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#826a11]"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <SectionDivider label={t('admin.order_modal.shipping_address')} icon={Mountain} />
                      <div className="mt-4 p-5 rounded-3xl bg-[#f9f9fb] border border-[#e2e2e4] space-y-2">
                        {!isEditingOrder ? (
                          <p className="text-sm text-[#1a1c1d] font-medium leading-relaxed">
                            {selectedOrder.shipping?.address1}<br />
                            {selectedOrder.shipping?.address2 && <>{selectedOrder.shipping.address2}<br /></>}
                            {selectedOrder.shipping?.city}, {selectedOrder.shipping?.state} {selectedOrder.shipping?.zip}<br />
                            {selectedOrder.shipping?.country}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <input 
                              placeholder="Address Line 1"
                              value={editedOrder.shipping?.address1 || ''}
                              onChange={(e) => setEditedOrder({...editedOrder, shipping: {...editedOrder.shipping, address1: e.target.value}})}
                              className="w-full bg-white border border-[#e2e2e4] rounded-lg px-3 py-2 text-sm focus:outline-none"
                            />
                            <input 
                              placeholder="City"
                              value={editedOrder.shipping?.city || ''}
                              onChange={(e) => setEditedOrder({...editedOrder, shipping: {...editedOrder.shipping, city: e.target.value}})}
                              className="w-full bg-white border border-[#e2e2e4] rounded-lg px-3 py-2 text-sm focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <input 
                                placeholder={t('admin.dashboard.products.form.placeholders.santal')}
                                value={editedOrder.shipping?.state || ''}
                                onChange={(e) => setEditedOrder({...editedOrder, shipping: {...editedOrder.shipping, state: e.target.value}})}
                                className="flex-1 bg-white border border-[#e2e2e4] rounded-lg px-3 py-2 text-sm focus:outline-none"
                              />
                              <input 
                                placeholder="Zip"
                                value={editedOrder.shipping?.zip || ''}
                                onChange={(e) => setEditedOrder({...editedOrder, shipping: {...editedOrder.shipping, zip: e.target.value}})}
                                className="w-24 bg-white border border-[#e2e2e4] rounded-lg px-3 py-2 text-sm focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionDivider label="Payment" icon={DollarSign} />
                      <div className="mt-4 p-5 rounded-3xl bg-[#fcfbf9] border border-[#e2e2e4]">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase tracking-widest font-black text-[#826a11]">{selectedOrder.paymentMethod}</span>
                          <span className="text-lg font-noto-serif font-bold text-[#1a1c1d]">{selectedOrder.total}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Col: Items */}
                  <div className="lg:col-span-2">
                    <SectionDivider label="Order Items" icon={ShoppingBag} />
                    <div className="mt-4 border border-[#e2e2e4] rounded-[32px] overflow-hidden">
                      <table className="w-full text-start border-collapse">
                        <thead className="bg-[#fbfaf9]">
                          <tr className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91] border-b border-[#e2e2e4]">
                            <th className="px-6 py-4 text-start font-bold">Item</th>
                            <th className="px-6 py-4 text-center font-bold">Qty</th>
                            <th className="px-6 py-4 text-end font-bold">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e2e4]">
                          {selectedOrder.items?.map((item, idx) => (
                            <tr key={idx} className="hover:bg-[#f9f9fb] transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-[#eeeef0] rounded-xl overflow-hidden border border-[#e2e2e4] shrink-0">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-[#1a1c1d]">{item.title}</p>
                                    <p className="text-[10px] font-bold text-[#a69b91] uppercase tracking-widest">{item.volume}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center text-sm font-bold text-[#5f5e5e]">{item.quantity}</td>
                              <td className="px-6 py-4 text-end font-noto-serif font-bold text-[#1a1c1d]">
                                {item.price?.toLocaleString()} DZD
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-[#fcfbf9]">
                          <tr>
                            <td colSpan="2" className="px-6 py-3 text-end text-[10px] uppercase tracking-widest font-bold text-[#a69b91]">Subtotal</td>
                            <td className="px-6 py-3 text-end text-sm font-bold text-[#1a1c1d]">{selectedOrder.subtotal ? `${selectedOrder.subtotal.toLocaleString()} DZD` : '-'}</td>
                          </tr>
                          <tr>
                            <td colSpan="2" className="px-6 py-3 text-end text-[10px] uppercase tracking-widest font-bold text-[#a69b91]">Shipping {selectedOrder.shippingCost === 0 ? '(Free)' : ''}</td>
                            <td className="px-6 py-3 text-end text-sm font-bold text-[#1a1c1d]">{selectedOrder.shippingCost === 0 ? 'Free' : (selectedOrder.shippingCost ? `${selectedOrder.shippingCost.toLocaleString()} DZD` : '-')}</td>
                          </tr>
                          <tr className="bg-[#f4f2ec]">
                            <td colSpan="2" className="px-6 py-4 text-end text-[10px] uppercase tracking-widest font-black text-[#826a11]">Total</td>
                            <td className="px-6 py-4 text-end text-sm font-black text-[#1a1c1d]">{selectedOrder.total}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Shipping Discovery Block */}
                    {selectedOrder.status === 'Shipped' && selectedOrder.trackingNumber && (
                      <div className="mt-8">
                        <SectionDivider label={t('admin.dashboard.products.form.info_header')} icon={Package} />
                        <div className="mt-4 p-6 rounded-[32px] bg-[#f9f9fb] border border-[#e2e2e4]">
                           <div className="flex justify-between items-center mb-6 px-2">
                             <div>
                               <p className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91]">Carrier</p>
                               <p className="text-sm font-bold text-[#1a1c1d]">{selectedOrder.shippingService || 'N/A'}</p>
                             </div>
                             <div className="text-end">
                               <p className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91]">Tracking No.</p>
                               <p className="text-sm font-mono font-bold text-[#826a11]">{selectedOrder.trackingNumber}</p>
                             </div>
                           </div>
                           
                           {liveTrackingStatus ? (
                             <div className="mb-6 p-5 bg-white border border-[#e2e2e4] rounded-2xl flex items-center justify-between">
                               <div>
                                 <p className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91]">Current Status</p>
                                 <p className="text-sm font-bold text-[#1a1c1d] mt-1">{liveTrackingStatus}</p>
                               </div>
                               <div className="w-10 h-10 rounded-full bg-[#826a11]/10 flex items-center justify-center text-[#826a11]">
                                 <Check size={18} />
                               </div>
                             </div>
                           ) : (
                             <div className="mb-6 flex justify-center">
                               <button 
                                 onClick={async () => {
                                   setIsTracking(true);
                                   try {
                                     const pKey = Object.values(SHIPPING_PROVIDERS).find(p => p.title === selectedOrder.shippingService)?.key || savedShippingConfig?.provider;
                                     if (!pKey) throw new Error("Could not identify provider config.");
                                     
                                     const credentials = {
                                       token: savedShippingConfig?.apiToken || '',
                                       id: savedShippingConfig?.apiId || '',
                                       key: savedShippingConfig?.apiKey || '',
                                     };
                                     const result = await trackOrder(selectedOrder.trackingNumber, pKey, credentials);
                                     setLiveTrackingStatus(result.status);
                                     addToast('Tracking updated', 'success');
                                   } catch (err) {
                                     addToast(err.message, 'error');
                                   } finally {
                                     setIsTracking(false);
                                   }
                                 }}
                                 disabled={isTracking}
                                 className="px-8 py-3 bg-white border border-[#e2e2e4] text-[#1a1c1d] rounded-full text-[10px] font-bold tracking-widest uppercase hover:border-[#826a11] hover:text-[#826a11] transition-all flex items-center disabled:opacity-50"
                               >
                                 {isTracking ? 'Fetching Provider API...' : 'Fetch Live Status'}
                               </button>
                             </div>
                           )}

                           {(() => {
                             const pUrl = Object.values(SHIPPING_PROVIDERS).find(p => p.title === selectedOrder.shippingService)?.trackingUrl;
                             if (pUrl) {
                               return (
                                 <a 
                                   href={pUrl} 
                                   target="_blank" 
                                   rel="noreferrer"
                                   className="block w-full text-center py-4 bg-[#1a1c1d] text-white rounded-2xl text-[10px] font-bold tracking-widest uppercase hover:bg-[#826a11] transition-all"
                                 >
                                   Open Carrier Tracking Page
                                 </a>
                               );
                             }
                             return null;
                           })()}
                        </div>
                      </div>
                    )}

                    {/* Order Controls */}
                    <div className="mt-8 flex gap-4">
                       <div className="flex-1">
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-[#a69b91] mb-2">Update Status</label>
                          <div className="flex gap-2">
                             {['Processing', 'Shipped', 'Delivered'].map(status => (
                               <button
                                 key={status}
                                 onClick={async () => {
                                   try {
                                     const ordersCol = collection(db, 'orders');
                                     await setDoc(doc(db, 'orders', selectedOrder.id), { status }, { merge: true });
                                     setSelectedOrder({ ...selectedOrder, status });
                                     addToast(`Order status updated to ${status}`, 'success');
                                   } catch (err) {
                                     addToast('Failed to update status', 'error');
                                   }
                                 }}
                                 className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                   selectedOrder.status === status 
                                     ? 'bg-[#1a1c1d] text-white shadow-lg' 
                                     : 'bg-[#f9f9fb] text-[#a69b91] hover:bg-[#eeeef0]'
                                 }`}
                               >
                                 {status}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── SEND TO SHIPPING MODAL ─── */}
      <AnimatePresence>
        {isShippingModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setIsShippingModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[32px] border border-[#e2e2e4] shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-8 pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1a1c1d] flex items-center justify-center shadow-md">
                      <Truck size={18} className="text-[#d4b560]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-noto-serif text-[#1a1c1d]">Send to Shipping</h3>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#a69b91]">Dispatch Orders</p>
                    </div>
                  </div>
                  <button onClick={() => setIsShippingModalOpen(false)} className="w-8 h-8 rounded-full bg-[#f9f9fb] border border-[#e2e2e4] flex items-center justify-center hover:bg-[#eeeef0] transition-colors">
                    <X size={16} className="text-[#5f5e5e]" />
                  </button>
                </div>
                <p className="text-sm text-[#5f5e5e] mt-3">Select a shipping service to dispatch the {selectedOrderIds.length} selected order(s).</p>
              </div>

              {/* Order Summary */}
              <div className="px-8 pt-6">
                <div className="flex items-center justify-between p-4 bg-[#f9f9fb] rounded-2xl border border-[#e2e2e4]">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91]">Orders to Dispatch</p>
                    <p className="text-2xl font-noto-serif text-[#1a1c1d] mt-1">
                      {selectedOrderIds.length || 0}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91]">Total Value</p>
                    <p className="text-2xl font-noto-serif text-[#1a1c1d] mt-1">
                      {orders?.filter(o => selectedOrderIds.includes(o.id)).reduce((sum, o) => sum + (parseFloat(String(o.total || 0).replace(/[^0-9.-]+/g, '')) || 0), 0).toLocaleString()} DZD
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Selection */}
              <div className="px-8 pt-6">
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#a69b91] mb-3">Choose Service</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {/* Saved provider first (if configured) */}
                  {savedShippingConfig?.provider && getProvider(savedShippingConfig.provider) && (
                    <button
                      onClick={() => setSelectedShippingService(savedShippingConfig.provider)}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-start transition-all ${
                        selectedShippingService === savedShippingConfig.provider ? 'border-[#826a11] bg-[#fcfbf9]' : 'border-[#e2e2e4] hover:border-[#826a11]/50 hover:bg-[#fbfaf9]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedShippingService === savedShippingConfig.provider ? 'bg-[#826a11]/10' : 'bg-[#f9f9fb] border border-[#e2e2e4]'}`}>
                        <Truck size={18} className={selectedShippingService === savedShippingConfig.provider ? 'text-[#826a11]' : 'text-[#5f5e5e]'} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#1a1c1d]">{getProvider(savedShippingConfig.provider).title}</p>
                        <p className="text-[10px] text-[#a69b91] font-bold uppercase tracking-wider">Configured • Ready to dispatch</p>
                      </div>
                      {selectedShippingService === savedShippingConfig.provider && (
                        <div className="w-5 h-5 rounded-full bg-[#826a11] flex items-center justify-center">
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )}
                  {/* All other providers */}
                  {allProvidersFlat.filter(p => p.key !== savedShippingConfig?.provider).map((provider) => (
                    <button
                      key={provider.key}
                      onClick={() => setSelectedShippingService(provider.key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-start transition-all ${
                        selectedShippingService === provider.key ? 'border-[#826a11] bg-[#fcfbf9]' : 'border-[#e2e2e4] hover:border-[#826a11]/50 hover:bg-[#fbfaf9]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedShippingService === provider.key ? 'bg-[#826a11]/10' : 'bg-[#f9f9fb] border border-[#e2e2e4]'}`}>
                        <Truck size={14} className={selectedShippingService === provider.key ? 'text-[#826a11]' : 'text-[#5f5e5e]'} />
                      </div>
                      <p className="text-sm font-bold text-[#1a1c1d] flex-1">{provider.title}</p>
                      {selectedShippingService === provider.key && (
                        <div className="w-5 h-5 rounded-full bg-[#826a11] flex items-center justify-center">
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                  {/* Custom (if saved) */}
                  {savedShippingConfig?.provider === 'custom' && savedShippingConfig?.customName && (
                    <button
                      onClick={() => setSelectedShippingService('custom')}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-start transition-all ${
                        selectedShippingService === 'custom' ? 'border-[#826a11] bg-[#fcfbf9]' : 'border-[#e2e2e4] hover:border-[#826a11]/50 hover:bg-[#fbfaf9]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedShippingService === 'custom' ? 'bg-[#826a11]/10' : 'bg-[#f9f9fb] border border-[#e2e2e4]'}`}>
                        <Package size={14} className={selectedShippingService === 'custom' ? 'text-[#826a11]' : 'text-[#5f5e5e]'} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#1a1c1d]">{savedShippingConfig.customName}</p>
                        <p className="text-[10px] text-[#a69b91] font-bold uppercase tracking-wider">Custom Service</p>
                      </div>
                      {selectedShippingService === 'custom' && (
                        <div className="w-5 h-5 rounded-full bg-[#826a11] flex items-center justify-center">
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 flex justify-end gap-3">
                <button
                  onClick={() => setIsShippingModalOpen(false)}
                  className="px-6 py-2.5 bg-[#f9f9fb] text-[#1a1c1d] border border-[#e2e2e4] rounded-full text-xs font-bold tracking-wide hover:bg-[#eeeef0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!selectedShippingService) {
                      addToast('Please select a shipping service', 'error');
                      return;
                    }
                    const dispatchOrders = orders?.filter(o => selectedOrderIds.includes(o.id)) || [];
                    if (dispatchOrders.length === 0) {
                      addToast('No orders selected for dispatch', 'error');
                      return;
                    }
                    setIsSendingToShipping(true);
                    try {
                    const providerConfig = getProvider(selectedShippingService);
                    const serviceName = providerConfig ? providerConfig.title : (savedShippingConfig?.customName || 'Custom');
                    const credentials = {
                      token: savedShippingConfig?.apiToken || '',
                      id: savedShippingConfig?.apiId || '',
                      key: savedShippingConfig?.apiKey || '',
                    };
                    const storeOriginWilaya = savedShippingConfig?.originWilaya || 'Alger';

                    let successCount = 0;
                    let failCount = 0;
                    const log = [];

                    for (const order of dispatchOrders) {
                      try {
                        if (providerConfig) {
                          const result = await dispatchOrder(order, selectedShippingService, credentials, storeOriginWilaya);
                          await setDoc(doc(db, 'orders', order.id), {
                            status: 'Shipped',
                            shippingService: serviceName,
                            shippedAt: new Date().toISOString(),
                            trackingNumber: result.tracking || '',
                          }, { merge: true });
                          log.push({ id: order.id, status: 'success', tracking: result.tracking });
                        } else {
                          await setDoc(doc(db, 'orders', order.id), {
                            status: 'Shipped',
                            shippingService: serviceName,
                            shippedAt: new Date().toISOString(),
                          }, { merge: true });
                          log.push({ id: order.id, status: 'success', tracking: null });
                        }
                        successCount++;
                      } catch (err) {
                        console.error(`Failed to dispatch order ${order.id}:`, err);
                        log.push({ id: order.id, status: 'error', message: err.message });
                        failCount++;
                      }
                    }
                    setShippingDispatchLog(log);
                    if (failCount === 0) {
                      addToast(`✓ ${successCount} order(s) dispatched to ${serviceName}`, 'success');
                    } else {
                      addToast(`${successCount} sent, ${failCount} failed — check console for details`, 'error');
                    }
                    setIsShippingModalOpen(false);
                    } catch (err) {
                      console.error('Failed to send orders:', err);
                      addToast('Failed to send orders to shipping', 'error');
                    } finally {
                      setIsSendingToShipping(false);
                    }
                  }}
                  disabled={!selectedShippingService || isSendingToShipping}
                  className="px-8 py-2.5 bg-[#1a1c1d] border border-[#1a1c1d] text-white rounded-full text-xs font-bold tracking-wide hover:bg-[#826a11] hover:border-[#826a11] transition-all shadow-md hover:-translate-y-0.5 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingToShipping ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin me-2"></div> Sending...</>
                  ) : (
                    <><Truck size={14} className="me-2 text-[#d4b560]" strokeWidth={2.5} /> Send All Orders</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CUSTOM CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6 ${confirmModal.type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-[#1a1c1d] mb-3">{confirmModal.title}</h3>
                <p className="text-sm text-[#5f5e5e] leading-relaxed mb-8">
                  {confirmModal.message}
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmModal.onConfirm}
                    className={`w-full py-4 rounded-2xl text-sm font-bold tracking-wide transition-all shadow-lg hover:-translate-y-0.5 ${
                      confirmModal.type === 'danger' 
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-200' 
                        : 'bg-[#826a11] text-white hover:bg-[#6b580e] shadow-[#826a11]/20'
                    }`}
                  >
                    Confirm Deletion
                  </button>
                  <button 
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="w-full py-4 rounded-2xl text-sm font-bold text-[#5f5e5e] hover:bg-[#f9f9fb] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
