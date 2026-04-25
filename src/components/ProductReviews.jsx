import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from './LoadingSpinner';
import { getApprovedReviews, addReview } from '../services/reviewService';
import { useToast } from '../context/ToastContext';

// Rate limit: 1 review per product per device per 24 hours
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const lsKey = (id) => `review_sent_${id}`;

function getCooldownRemaining(productId) {
  try {
    const ts = localStorage.getItem(lsKey(productId));
    if (!ts) return 0;
    return Math.max(0, COOLDOWN_MS - (Date.now() - parseInt(ts, 10)));
  } catch { return 0; }
}

function formatCountdown(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ProductReviews({ productId, productName }) {
  const { t, i18n } = useTranslation();
  const { addToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRTL, setIsRTL] = useState(i18n.language === 'ar');
  const [cooldownMs, setCooldownMs] = useState(0);
  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 236 : 276; // card width + gap
      carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const [formData, setFormData] = useState({
    author: '',
    rating: 5,
    title: '',
    body: ''
  });

  useEffect(() => {
    setIsRTL(i18n.language === 'ar');
  }, [i18n.language]);

  // Sync cooldown every minute
  useEffect(() => {
    if (!productId) return;
    const tick = () => setCooldownMs(getCooldownRemaining(productId));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [productId]);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      const data = await getApprovedReviews(productId);
      setReviews(data);
      setIsLoading(false);
    };
    if (productId) fetchReviews();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Re-check cooldown (guards against clock skew / localStorage race)
    const remaining = getCooldownRemaining(productId);
    if (remaining > 0) {
      addToast(`You can submit another review in ${formatCountdown(remaining)}.`, 'error');
      setShowForm(false);
      return;
    }

    if (!formData.author.trim() || !formData.title.trim() || !formData.body.trim()) {
      addToast('Please fill out all fields.', 'error');
      return;
    }
    if (formData.author.trim().length < 2) {
      addToast('Please enter your full name (at least 2 characters).', 'error');
      return;
    }
    if (formData.body.trim().length < 10) {
      addToast('Review body must be at least 10 characters.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newReviewId = await addReview({
        productId,
        productName: productName || 'Unknown',
        author: formData.author.trim(),
        rating: formData.rating,
        title: formData.title.trim(),
        body: formData.body.trim()
      });
      // Record submission timestamp to enforce cooldown
      localStorage.setItem(lsKey(productId), String(Date.now()));
      if (newReviewId) {
        localStorage.setItem(`review_id_${productId}`, newReviewId);
      }
      setCooldownMs(COOLDOWN_MS);
      addToast('Review submitted! It will be visible after approval.', 'success');
      setShowForm(false);
      setFormData({ author: '', rating: 5, title: '', body: '' });
    } catch (err) {
      addToast('Failed to submit review.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <span key={idx} className={`material-symbols-outlined text-[10px] md:text-xs ${idx < rating ? 'text-[#826a11]' : 'text-stone-300'}`} style={idx < rating ? { fontVariationSettings: "'FILL' 1" } : {}}>
        star
      </span>
    ));
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <section className={`mt-32 max-w-4xl mx-auto px-4 ${isRTL ? 'text-end' : 'text-start'}`}>
      <div className="text-center mb-16">
        <span className="text-secondary font-bold text-[10px] uppercase tracking-[0.5em] block mb-2">Social Proof</span>
        <h2 className="text-4xl font-headline tracking-tighter">Customer Reviews</h2>
        
        {reviews.length > 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center gap-2">
            <div className="flex gap-1">{renderStars(Math.round(avgRating))}</div>
            <p className="text-xl font-bold font-noto-serif">{avgRating} out of 5</p>
            <p className="text-sm text-stone-400">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
        ) : (
          <p className="mt-6 text-stone-400">No reviews yet for this fragrance.</p>
        )}
      </div>

      <div className="flex justify-center mb-12">
        {cooldownMs > 0 ? (
          <div className="flex flex-col items-center gap-2">
            <button
              disabled
              className="opacity-50 cursor-not-allowed bg-surface-container text-on-surface-variant px-8 py-3 rounded-full font-bold tracking-widest text-xs uppercase border border-outline-variant/30"
            >
              Review Submitted
            </button>
            <p className="text-xs text-on-surface-variant text-center">
              You can review this product again in{' '}
              <span className="font-bold text-secondary">{formatCountdown(cooldownMs)}</span>
            </p>
            {localStorage.getItem(`review_id_${productId}`) && !reviews.some(r => r.id === localStorage.getItem(`review_id_${productId}`)) && (
              <p className="text-[11px] text-stone-500 font-medium bg-secondary/5 px-4 py-2 flex items-center gap-2 rounded-lg mt-1 border border-secondary/10">
                <span className="material-symbols-outlined text-[14px] text-secondary">pending</span>
                Your review will appear after admin approval.
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowForm(!showForm)}
            className="brushed-metal-cta text-white px-8 py-3 rounded-full font-bold tracking-widest text-xs uppercase shadow-xl transition-all active:scale-95"
          >
            {showForm ? 'Cancel Review' : 'Write a Review'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-20 glass-card p-8 md:p-12 rounded-3xl border border-outline-variant/20 shadow-2xl animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#826a11] to-transparent opacity-50"></div>
          <h3 className="font-headline text-2xl mb-8">Write your review</h3>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest font-bold text-stone-400">Rating</label>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setFormData({...formData, rating: star})}
                    className="hover:scale-110 transition-transform focus:outline-none"
                  >
                    <span className={`material-symbols-outlined text-2xl md:text-3xl ${star <= formData.rating ? 'text-[#826a11]' : 'text-stone-300'}`} style={star <= formData.rating ? { fontVariationSettings: "'FILL' 1" } : {}}>
                      star
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest font-bold text-stone-400">Name</label>
                <input 
                  type="text"
                  required
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  className="bg-surface-container-low rounded-xl px-5 py-4 border-0 focus:ring-2 focus:ring-[#826a11]/40 outline-none w-full font-medium"
                  placeholder="John Doe"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest font-bold text-stone-400">Review Title</label>
                <input 
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="bg-surface-container-low rounded-xl px-5 py-4 border-0 focus:ring-2 focus:ring-[#826a11]/40 outline-none w-full font-medium"
                  placeholder="Smells amazing!"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest font-bold text-stone-400">Review Details</label>
              <textarea 
                required
                rows="4"
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                className="bg-surface-container-low rounded-xl px-5 py-4 border-0 focus:ring-2 focus:ring-[#826a11]/40 outline-none w-full resize-none font-medium"
                placeholder="Share your experience with this fragrance..."
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 bg-[#1a1c1d] text-white py-4 rounded-xl font-bold tracking-widest text-xs uppercase hover:bg-[#826a11] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner fullScreen={false} size="sm" showText={false} />
        </div>
      ) : (
        <div className="relative group">
          {reviews.length > 1 && (
            <>
              <button 
                type="button"
                onClick={() => scrollCarousel(isRTL ? 'right' : 'left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-[#1a1c1d] group/btn isolate"
              >
                <div className="absolute inset-0 backdrop-blur-[3px] rounded-full [filter:url(#review-glass-blur)] -z-[3]" />
                <div className="absolute inset-0 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-[2]" />
                <div className="absolute inset-0 rounded-full shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] group-hover/btn:shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.6),inset_-3px_-3px_3px_0_rgba(255,255,255,0.6)] transition-all duration-300 -z-[1]" />
                <span className="material-symbols-outlined text-2xl relative z-10">chevron_left</span>
              </button>
              <button 
                type="button"
                onClick={() => scrollCarousel(isRTL ? 'left' : 'right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-[#1a1c1d] group/btn isolate"
              >
                <div className="absolute inset-0 backdrop-blur-[3px] rounded-full [filter:url(#review-glass-blur)] -z-[3]" />
                <div className="absolute inset-0 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.15),0_0_12px_rgba(0,0,0,0.08)] -z-[2]" />
                <div className="absolute inset-0 rounded-full shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.45),inset_-3px_-3px_3px_0_rgba(255,255,255,0.45)] group-hover/btn:shadow-[inset_3px_3px_3px_0_rgba(255,255,255,0.6),inset_-3px_-3px_3px_0_rgba(255,255,255,0.6)] transition-all duration-300 -z-[1]" />
                <span className="material-symbols-outlined text-2xl relative z-10">chevron_right</span>
              </button>
            </>
          )}
          <div ref={carouselRef} className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 pt-2 px-2 -mx-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {reviews.map(review => (
            <div key={review.id} className="flex-none w-[220px] md:w-[260px] snap-start bg-[#fbf9f4]/80 backdrop-blur-lg p-4 rounded-xl border border-[#e8e4d9] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative group/card isolate">
              <div className="absolute top-4 right-4 mix-blend-multiply opacity-5 group-hover/card:opacity-10 transition-opacity z-0">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
              </div>
              <div className={`flex gap-0.5 mb-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                {renderStars(review.rating)}
              </div>
              <h4 className="font-bold text-sm mb-1 text-[#1a1c1d] relative z-10 line-clamp-1">{review.title}</h4>
              <p className="text-stone-500 text-[10px] leading-relaxed mb-3 font-medium relative z-10 line-clamp-3">{review.body}</p>
              
              <div className={`flex items-center gap-1.5 pt-3 border-t border-stone-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary uppercase text-[10px]">
                  {review.author?.[0]}
                </div>
                <div>
                  <p className="font-bold text-[10px] text-[#1a1c1d]">{review.author}</p>
                  <div className={`flex items-center gap-0.5 text-[8px] uppercase font-bold tracking-widest text-[#826a11] ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="material-symbols-outlined text-[9px]">verified</span>
                    Verified
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
      <svg style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg">  
        <filter id="review-glass-blur" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">  
          <feTurbulence type="fractalNoise" baseFrequency="0.003 0.007" numOctaves="1" result="turbulence" />  
          <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="200" xChannelSelector="R" yChannelSelector="G" />  
        </filter>  
      </svg>
    </section>
  );
}
