import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

const REVIEWS_COLLECTION = 'reviews';

// Fetch approved reviews for a specific product
export const getApprovedReviews = async (productId) => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('productId', '==', productId),
      where('status', '==', 'approved')
    );
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return results.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
};

// Fetch all reviews for admin dashboard
export const getAllReviews = async () => {
  try {
    const q = query(collection(db, REVIEWS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    return [];
  }
};

// Add a new review (defaults to pending)
export const addReview = async (reviewData) => {
  try {
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      ...reviewData,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
};

// Admin: Update review status (approve, reject)
export const updateReviewStatus = async (reviewId, newStatus) => {
  try {
    await updateDoc(doc(db, REVIEWS_COLLECTION, reviewId), {
      status: newStatus
    });
    return true;
  } catch (error) {
    console.error("Error updating review status:", error);
    throw error;
  }
};

// Admin: Delete review
export const deleteReview = async (reviewId) => {
  try {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
    return true;
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};
