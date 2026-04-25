import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [incompleteOrders, setIncompleteOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ordersCol = collection(db, 'orders');
    
    const unsubscribe = onSnapshot(ordersCol, (snapshot) => {
      try {
        const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort by timestamp descending
        orderList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setOrders(orderList);
      } catch (err) {
        setError("Failed to fetch orders.");
        console.error("Firebase fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      setError("Failed to listen to orders.");
      console.error(err);
      setLoading(false);
    });
    
    // Incomplete Orders Listener
    const incompleteCol = collection(db, 'incomplete_orders');
    const unsubscribeIncomplete = onSnapshot(incompleteCol, (snapshot) => {
      try {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setIncompleteOrders(list);
      } catch (err) {
        console.error("Error parsing incomplete orders:", err);
      }
    }, (err) => {
      console.warn("Failed to listen to incomplete orders (possibly permission denied):", err);
    });

    return () => {
      try { unsubscribe(); } catch(e) { /* suppress Firestore teardown errors */ }
      try { unsubscribeIncomplete(); } catch(e) { /* suppress Firestore teardown errors */ }
    };
  }, []);

  const addOrder = async (orderData) => {
    try {
      const shortId = 'LE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const finalOrder = {
        ...orderData,
        id: shortId,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString()
      };
      await setDoc(doc(db, 'orders', shortId), finalOrder);
      return shortId;
    } catch (err) {
      console.error("Error adding order:", err);
      throw err;
    }
  };

  const updateOrder = async (orderId, data) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, data);
    } catch (err) {
      console.error("Error updating order:", err);
      throw err;
    }
  };

  const updateIncompleteOrder = async (orderId, data) => {
    try {
      const orderRef = doc(db, 'incomplete_orders', orderId);
      await updateDoc(orderRef, data);
    } catch (err) {
      console.error("Error updating incomplete order:", err);
      throw err;
    }
  };

  const saveIncompleteOrder = async (orderId, data) => {
    try {
      await setDoc(doc(db, 'incomplete_orders', orderId), {
        ...data,
        id: orderId,
        timestamp: Date.now(),
        lastUpdated: new Date().toLocaleString()
      }, { merge: true });
    } catch (err) {
      console.error("Error saving incomplete order:", err);
    }
  };

  const deleteIncompleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, 'incomplete_orders', orderId));
    } catch (err) {
      console.error("Error deleting incomplete order:", err);
    }
  };

  const convertIncompleteToOrder = async (incompleteOrderId, orderData) => {
    try {
      const shortId = 'LE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const finalOrder = {
        ...orderData,
        id: shortId,
        status: 'Pending',
        timestamp: Date.now(),
        date: new Date().toLocaleDateString()
      };
      await setDoc(doc(db, 'orders', shortId), finalOrder);
      await deleteDoc(doc(db, 'incomplete_orders', incompleteOrderId));
      return shortId;
    } catch (err) {
      console.error("Error converting incomplete order:", err);
      throw err;
    }
  };

  return (
    <OrderContext.Provider value={{ 
      orders, 
      incompleteOrders, 
      loading, 
      error, 
      addOrder, 
      updateOrder,
      updateIncompleteOrder,
      saveIncompleteOrder, 
      deleteIncompleteOrder,
      convertIncompleteToOrder
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrderContext);
}
