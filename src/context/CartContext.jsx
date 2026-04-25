import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './ToastContext';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const CartContext = createContext();

const DEFAULT_STORE_SETTINGS = {
  freeShippingThreshold: 250,
  // Store Identity
  storeName: "L'Essence",
  // Hero Section
  heroImages: [],
  heroSubtitle: '',
  heroHeadline: '',
  heroHeadlineAccent: '',
  heroHeadlineSuffix: '',
  heroDescription: '',
  heroPrimaryButtonText: 'Shop Now',
  heroSecondaryButtonText: 'The Collection',
  // Featured Products (array of product IDs)
  featuredProductIds: [],
  // Boutique Favorites (array of product IDs)
  boutiqueFavoriteIds: [],
  // Curated Categories
  curatedCategories: [
    { name: 'Women', slug: 'women', image: '' },
    { name: 'Men', slug: 'men', image: '' },
    { name: 'Unisex', slug: 'unisex', image: '' },
    { name: 'Luxury', slug: 'luxury', image: '' },
  ],
};

import { useAuth } from './AuthContext';

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { currentUser } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('essence-cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Failed to initialize cart from localStorage', e);
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStoreSettingsLoading, setIsStoreSettingsLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState(DEFAULT_STORE_SETTINGS);
  const { addToast } = useToast();
  const authSyncRef = useRef({ uid: null, isMerged: false });

  // Sync cart with Firebase Auth
  useEffect(() => {
    if (currentUser) {
      if (authSyncRef.current.uid !== currentUser.uid) {
        authSyncRef.current.uid = currentUser.uid;
        authSyncRef.current.isMerged = false; // Lock Firebase saves during transition
        
        getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
          authSyncRef.current.isMerged = true; // Unlock
          if (snap.exists() && snap.data().cart) {
            const remoteCart = snap.data().cart;
            setItems(currentLocalItems => {
              if (currentLocalItems.length === 0) return remoteCart;
              
              // Merge logic
              const merged = [...remoteCart];
              for (const localItem of currentLocalItems) {
                  const existing = merged.find(p => p.id === localItem.id && p.volume === localItem.volume);
                  if (existing) {
                     existing.quantity = Math.max(existing.quantity, localItem.quantity);
                  } else {
                     merged.push(localItem);
                  }
              }
              return merged;
            });
          }
        }).catch(err => {
          console.error("Failed to fetch remote cart", err);
          authSyncRef.current.isMerged = true;
        });
      }
    } else {
      // When logged out, clear the local cart to prevent data leak, and reset auth lock
      if (authSyncRef.current.uid !== null) {
        authSyncRef.current.uid = null;
        authSyncRef.current.isMerged = false;
        setItems([]);
      }
    }
  }, [currentUser]);

  // Load and listen to store settings from DB
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'store');
    
    // Setup real-time listener
    const unsubscribe = onSnapshot(settingsRef, async (docSnap) => {
      if (docSnap.exists()) {
        setStoreSettings({ ...DEFAULT_STORE_SETTINGS, ...docSnap.data() });
      } else {
        // Auto-seed if it doesn't exist
        try {
          await setDoc(settingsRef, DEFAULT_STORE_SETTINGS);
        } catch (e) {
          console.error("Failed to seed default store settings:", e);
        }
      }
      setIsStoreSettingsLoading(false);
    }, (error) => {
      console.error("Error listening to store settings:", error);
      setIsStoreSettingsLoading(false);
    });

    return () => { try { unsubscribe(); } catch(e) { /* suppress Firestore teardown */ } };
  }, []);

  const updateStoreSettings = useCallback(async (newSettings) => {
    const updated = { ...storeSettings, ...newSettings };
    // Optimistic UI update
    setStoreSettings(updated);
    addToast('Saving store settings...', 'info');
    
    try {
      const settingsRef = doc(db, 'settings', 'store');
      await setDoc(settingsRef, updated, { merge: true });
      addToast('Store settings updated in database', 'success');
    } catch (e) {
      console.error("Failed to update store settings in DB:", e);
      addToast('Error saving settings', 'error');
    }
  }, [storeSettings, addToast]);

  // Save to local storage AND Firebase on change
  useEffect(() => {
    localStorage.setItem('essence-cart', JSON.stringify(items));
    if (currentUser && authSyncRef.current.uid === currentUser.uid && authSyncRef.current.isMerged) {
      setDoc(doc(db, 'users', currentUser.uid), { cart: items }, { merge: true })
        .catch(err => console.error("Error saving cart to Firebase", err));
    }
  }, [items, currentUser]);

  const addItem = useCallback((product) => {
    setItems((currentItems) => {
      const existing = currentItems.find(p => p.id === product.id && p.volume === product.volume);
      if (existing) {
        return currentItems.map(p => 
          p.id === product.id && p.volume === product.volume 
            ? { ...p, quantity: p.quantity + 1 } 
            : p
        );
      }
      return [{ ...product, quantity: 1 }, ...currentItems];
    });
    addToast(`${product.title} added to your bag`, 'success');
    setIsCartOpen(true);
  }, [addToast]);

  const removeItem = useCallback((id, volume) => {
    setItems((currentItems) => {
      const item = currentItems.find(p => p.id === id && p.volume === volume);
      if (item) {
        addToast(`${item.title} removed from bag`, 'info');
      }
      return currentItems.filter(p => !(p.id === id && p.volume === volume));
    });
  }, [addToast]);

  const incrementQuantity = (id, volume) => {
    setItems((currentItems) => currentItems.map(p => 
      p.id === id && p.volume === volume 
        ? { ...p, quantity: p.quantity + 1 } 
        : p
    ));
  };

  const decrementQuantity = (id, volume) => {
    setItems((currentItems) => {
      const existing = currentItems.find(p => p.id === id && p.volume === volume);
      if (existing && existing.quantity === 1) {
        return currentItems.filter(p => !(p.id === id && p.volume === volume));
      }
      return currentItems.map(p => 
        p.id === id && p.volume === volume 
          ? { ...p, quantity: p.quantity - 1 } 
          : p
      );
    });
  };

  const clearCart = useCallback(() => {
    setItems([]);
    addToast('Cart cleared', 'info');
  }, [addToast]);

  const subtotal = items.reduce((total, p) => total + p.price * p.quantity, 0);
  const itemCount = items.reduce((total, p) => total + p.quantity, 0);

  const value = {
    items,
    isCartOpen,
    setIsCartOpen,
    addItem,
    removeItem,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    subtotal,
    itemCount,
    storeSettings,
    isStoreSettingsLoading,
    updateStoreSettings
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
