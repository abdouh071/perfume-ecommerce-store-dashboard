import React, { createContext, useContext, useState, useEffect } from 'react';

import { collection, onSnapshot, setDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const productsCol = collection(db, 'products');
    
    const unsubscribe = onSnapshot(productsCol, (snapshot) => {
      try {
        const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productList);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch products from Firebase.");
        console.error("Firebase fetch error:", err);
        setLoading(false);
      }
    }, (err) => {
      console.error("Firebase Products listener error:", err);
      setError(err.message || "Failed to listen to products");
      setLoading(false);
    });

    return () => { try { unsubscribe(); } catch(e) { /* suppress Firestore teardown */ } };
  }, []);

  const addProduct = async (productData) => {
    try {
      const productsCol = collection(db, 'products');
      const finalProduct = {
        // Defaults for storefront compatibility
        description: '',
        notes: [],
        fragranceFamily: 'Oriental',
        category: 'unisex',
        featured: false,
        boutique: false,
        volume: '50ml',
        inventory: 100,
        image: '',
        isActive: true, // Default to true
        // Overlay with whatever the caller provides
        ...productData,
        // Always generate a unique ID
        id: `prod_${Date.now()}`
      };
      await setDoc(doc(db, 'products', finalProduct.id), finalProduct);
      return finalProduct.id;
    } catch (err) {
      console.error("Error adding product:", err);
      throw err;
    }
  };

  const updateProduct = async (id, updates) => {
    try {
      if (!id) throw new Error("Product ID is required for update");
      await setDoc(doc(db, 'products', id), updates, { merge: true });
    } catch (err) {
      console.error("Error updating product:", err);
      throw err;
    }
  };

  return (
    <ProductContext.Provider value={{ products, loading, error, addProduct, updateProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
