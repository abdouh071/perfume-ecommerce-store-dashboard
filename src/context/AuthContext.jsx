import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Creates an account with email and password
  async function signup(email, password, firstName, lastName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update Firebase Auth Profile
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });

    // Create user document in Firestore
    const userDoc = {
      uid: user.uid,
      email: user.email,
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
      role: 'customer'
    };
    await setDoc(doc(db, 'users', user.uid), userDoc);
    setUserProfile(userDoc);

    return userCredential;
  }

  // Logs in with email and password
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logs in or signs up with Google
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user exists in Firestore
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Split display name for first/last
      const nameParts = (user.displayName || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const userDoc = {
        uid: user.uid,
        email: user.email,
        firstName,
        lastName,
        createdAt: new Date().toISOString(),
        role: 'customer'
      };
      await setDoc(docRef, userDoc);
      setUserProfile(userDoc);
    } else {
      setUserProfile(docSnap.data());
    }

    return userCredential;
  }

  // Updates user shipping info
  async function updateUserShipping(shippingData) {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      await setDoc(docRef, { shipping: shippingData }, { merge: true });
      setUserProfile(prev => ({ ...prev, shipping: shippingData }));
    } catch (err) {
      console.error("Error updating shipping details:", err);
      throw err;
    }
  }

  // Updates another user's role (admin only)
  async function updateUserRole(targetUid, newRole) {
    if (!currentUser || userProfile?.role !== 'admin') {
      throw new Error('Only admins can change roles');
    }
    const validRoles = ['admin', 'manager', 'confirmer', 'customer'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role');
    }
    try {
      const docRef = doc(db, 'users', targetUid);
      const targetDoc = await getDoc(docRef);
      if (!targetDoc.exists()) throw new Error('User not found');
      
      const targetData = targetDoc.data();
      const isSuperAdmin = currentUser.email?.toLowerCase() === 'adou4849@gmail.com';
      
      if (targetData.email?.toLowerCase() === 'adou4849@gmail.com') {
        throw new Error('Cannot change super admin role');
      }

      if (targetData.role === 'admin' && !isSuperAdmin) {
        throw new Error('Only the super admin can modify an admin role');
      }

      if (newRole === 'admin' && !isSuperAdmin) {
        throw new Error('Only the super admin can grant the admin role');
      }
      
      await updateDoc(docRef, { role: newRole });
    } catch (err) {
      console.error('Error updating user role:', err);
      throw err;
    }
  }

  // Fetches all users from Firestore (admin, manager, confirmer)
  async function fetchAllUsers() {
    if (!currentUser || !['admin', 'manager', 'confirmer'].includes(userProfile?.role)) return [];
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Error fetching all users:', err);
      return [];
    }
  }

  // Logs out
  function logout() {
    return signOut(auth);
  }

  // Sends password reset email
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Fetches user profile from Firestore
  async function fetchUserProfile(uid) {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        let data = docSnap.data();
        if (data.email === 'adou4849@gmail.com' && data.role !== 'admin') {
          data.role = 'admin';
          await updateDoc(docRef, { role: 'admin' });
        }
        setUserProfile(data);
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
    }
  }

  // Listener for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => { try { unsubscribe(); } catch(e) { /* suppress teardown */ } };
  }, []);

  const value = {
    currentUser,
    userProfile,
    login,
    loginWithGoogle,
    updateUserShipping,
    updateUserRole,
    fetchAllUsers,
    signup,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
