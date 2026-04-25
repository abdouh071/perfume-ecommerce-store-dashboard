import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './ToastContext';

import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const WishlistContext = createContext();

export function useWishlist() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }) {
  const { currentUser } = useAuth();
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const saved = localStorage.getItem('essence-wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse wishlist', e);
    }
    return [];
  });
  const { addToast } = useToast();
  const authSyncRef = useRef({ uid: null, isMerged: false });

  // Sync with Auth
  useEffect(() => {
    if (currentUser) {
      if (authSyncRef.current.uid !== currentUser.uid) {
        authSyncRef.current.uid = currentUser.uid;
        authSyncRef.current.isMerged = false; // Lock out DB writes
        
        getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
          authSyncRef.current.isMerged = true; // Unlock DB writes
          if (snap.exists() && snap.data().wishlist) {
            const remoteWishlist = snap.data().wishlist;
            setWishlistItems(currentLocalItems => {
              if (currentLocalItems.length === 0) return remoteWishlist;
              const merged = [...remoteWishlist];
              for (const localItem of currentLocalItems) {
                 if (!merged.find(p => p.id === localItem.id)) {
                     merged.push(localItem);
                 }
              }
              return merged;
            });
          }
        }).catch(err => {
          console.error("Failed to fetch remote wishlist", err);
          authSyncRef.current.isMerged = true;
        });
      }
    } else {
      if (authSyncRef.current.uid !== null) {
        authSyncRef.current.uid = null;
        authSyncRef.current.isMerged = false;
        setWishlistItems([]);
      }
    }
  }, [currentUser]);

  // Save to local storage AND Firebase on change
  useEffect(() => {
    localStorage.setItem('essence-wishlist', JSON.stringify(wishlistItems));
    if (currentUser && authSyncRef.current.uid === currentUser.uid && authSyncRef.current.isMerged) {
      setDoc(doc(db, 'users', currentUser.uid), { wishlist: wishlistItems }, { merge: true })
        .catch(err => console.error("Error saving wishlist to DB", err));
    }
  }, [wishlistItems, currentUser]);

  const addToWishlist = useCallback((product) => {
    setWishlistItems((current) => {
      const exists = current.find(p => p.id === product.id);
      if (exists) {
        addToast(`${product.title} is already in your wishlist`, 'info');
        return current;
      }
      addToast(`${product.title} added to wishlist`, 'success');
      return [...current, { ...product, addedAt: new Date().toISOString() }];
    });
  }, [addToast]);

  const removeFromWishlist = useCallback((productId) => {
    setWishlistItems((current) => {
      const item = current.find(p => p.id === productId);
      if (item) {
        addToast(`${item.title} removed from wishlist`, 'info');
      }
      return current.filter(p => p.id !== productId);
    });
  }, [addToast]);

  const toggleWishlist = useCallback((product) => {
    const exists = wishlistItems.find(p => p.id === product.id);
    if (exists) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  }, [wishlistItems, addToWishlist, removeFromWishlist]);

  const isInWishlist = useCallback((productId) => {
    if (!Array.isArray(wishlistItems)) return false;
    return wishlistItems.some(p => p && p.id === productId);
  }, [wishlistItems]);

  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
    addToast('Wishlist cleared', 'info');
  }, [addToast]);

  const value = {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    wishlistCount: wishlistItems.length,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}
