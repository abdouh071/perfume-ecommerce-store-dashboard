import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { getAllReviews, updateReviewStatus, deleteReview } from '../../services/reviewService';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import { useTranslation } from 'react-i18next';

export default function ReviewsManager() {
  const { addToast } = useToast();
  const { i18n } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRTL, setIsRTL] = useState(i18n.language === 'ar' || i18n.language.startsWith('ar-'));

  useEffect(() => {
    setIsRTL(i18n.language === 'ar' || i18n.language.startsWith('ar-'));
  }, [i18n.language]);

  const loadReviews = async () => {
    setIsLoading(true);
    const data = await getAllReviews();
    setReviews(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateReviewStatus(id, status);
      addToast(`Review ${status} successfully.`, 'success');
      loadReviews();
    } catch (err) {
      addToast('Failed to update review status.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteReview(id);
      addToast('Review deleted.', 'success');
      loadReviews();
    } catch (err) {
      addToast('Failed to delete review.', 'error');
    }
  };

  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const approvedReviews = reviews.filter(r => r.status === 'approved');
  const rejectedReviews = reviews.filter(r => r.status === 'rejected');

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <Star key={idx} size={14} className={idx < rating ? 'text-[#826a11] fill-[#826a11]' : 'text-stone-300'} />
    ));
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <LoadingSpinner fullScreen={false} size="sm" showText={false} />
      </div>
    );
  }

  const renderReviewList = (list, type) => (
    <div className="space-y-4">
      {list.length === 0 ? (
        <div className="p-8 text-center text-stone-500 bg-white rounded-[24px] border border-[#e2e2e4]">
          No {type} reviews.
        </div>
      ) : (
        list.map(review => (
          <div key={review.id} className="bg-white p-6 rounded-[24px] border border-[#e2e2e4] shadow-sm flex flex-col gap-4">
            <div className={`flex justify-between items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#826a11] tracking-widest mb-1">{review.productName}</p>
                <h4 className="font-bold text-[#1a1c1d] flex items-center gap-2">
                  {review.title}
                  <div className="flex gap-1 ms-2">{renderStars(review.rating)}</div>
                </h4>
                <p className="text-sm text-stone-500 mt-2 font-medium">{review.body}</p>
                <div className="flex items-center gap-2 mt-4 text-xs font-bold text-stone-400">
                  <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[#1a1c1d]">{review.author?.[0]}</span>
                  {review.author} • {new Date(review.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {review.status !== 'approved' && (
                  <button 
                    onClick={() => handleUpdateStatus(review.id, 'approved')}
                    className="w-10 h-10 rounded-full border border-green-200 bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                    title="Approve"
                  >
                    <CheckCircle size={18} />
                  </button>
                )}
                {review.status !== 'rejected' && (
                  <button 
                    onClick={() => handleUpdateStatus(review.id, 'rejected')}
                    className="w-10 h-10 rounded-full border border-orange-200 bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition-colors"
                    title="Reject"
                  >
                    <XCircle size={18} />
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(review.id)}
                  className="w-10 h-10 rounded-full border border-red-200 bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className={`p-8 animate-fade-in ${isRTL ? 'text-end' : 'text-start'}`}>
      <div className={`flex justify-between items-center mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-noto-serif font-bold text-[#1a1c1d]">Customer Reviews</h2>
          <p className="text-sm text-[#5f5e5e] mt-1">Approve and manage social proof across your products.</p>
        </div>
      </div>

      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#1a1c1d]">Pending Approval</h3>
            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest">{pendingReviews.length}</span>
          </div>
          {renderReviewList(pendingReviews, 'pending')}
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#1a1c1d]">Approved (Live)</h3>
            <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest">{approvedReviews.length}</span>
          </div>
          {renderReviewList(approvedReviews, 'approved')}
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#1a1c1d]">Rejected</h3>
            <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest">{rejectedReviews.length}</span>
          </div>
          {renderReviewList(rejectedReviews, 'rejected')}
        </section>
      </div>
    </div>
  );
}
