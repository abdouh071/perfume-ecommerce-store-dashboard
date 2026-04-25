import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
const Home = lazy(() => import('./pages/Home'));
const AllProducts = lazy(() => import('./pages/AllProducts'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
// AdminDashboard is lazy-loaded — its 210KB bundle is never sent to regular customers
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import CartDrawer from './components/CartDrawer';
import ScrollToTop from './components/ScrollToTop';
import RequireAdmin from './components/RequireAdmin';
import { ProductProvider } from './context/ProductContext';
import { OrderProvider } from './context/OrderContext';
import { AuthProvider } from './context/AuthContext';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from './components/LoadingSpinner';

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
  >
    {children}
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/shop" element={<PageTransition><AllProducts /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductDetails /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
        <Route path="/wishlist" element={<PageTransition><Wishlist /></PageTransition>} />
        <Route path="/track-order" element={<PageTransition><TrackOrder /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactUs /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutUs /></PageTransition>} />
        <Route path="/admin" element={
          <RequireAdmin>
            <Suspense fallback={<LoadingSpinner />}>
              <AdminDashboard />
            </Suspense>
          </RequireAdmin>
        } />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const { i18n } = useTranslation();

  // Sync <html lang> and <html dir> whenever the language changes.
  useEffect(() => {
    const lang = i18n.language || 'en';
    const isRTL = lang === 'ar' || lang.startsWith('ar-');
    document.documentElement.lang = lang.split('-')[0];
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <WishlistProvider>
            <ProductProvider>
              <OrderProvider>
                <Router>
                  <ScrollToTop />
                  <CartDrawer />
                  <Suspense fallback={<LoadingSpinner />}>
                    <AnimatedRoutes />
                  </Suspense>
                </Router>
              </OrderProvider>
            </ProductProvider>
          </WishlistProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

