import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { useTranslation } from 'react-i18next';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast(t('cart.enter_email'), 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addToast(t('cart.valid_email'), 'error');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Save to Firestore
      await addDoc(collection(db, 'subscribers'), {
        email: email.toLowerCase().trim(),
        subscribedAt: serverTimestamp(),
        source: 'newsletter',
        status: 'active'
      });

      // 2. Clear early (UX improvement)
      const subscriberEmail = email;
      setEmail('');

      // 3. Send Email Notification (EmailJS)
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey) {
        await emailjs.send(
          serviceId,
          templateId,
          {
            to_email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@lessence.dz',
            from_name: 'L\'Essence Boutique',
            user_email: subscriberEmail,
            message: `New subscription joined The Circle: ${subscriberEmail}`,
            subject: 'New Newsletter Subscriber!'
          },
          publicKey
        );
      }

      addToast(t('cart.subscribe_success'), 'success');
    } catch (err) {
      console.error('Newsletter error:', err);
      addToast(err.text || err.message || 'Something went wrong. Please try again later.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="newsletter-section" className="py-24 px-8">
      <div className="max-w-5xl mx-auto bg-tertiary-fixed rounded-[3rem] p-12 md:p-20 relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-tertiary-container/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <h2 className="text-4xl font-headline text-on-tertiary-fixed mb-6">{t('footer.newsletter')}</h2>
        <p className="text-on-tertiary-fixed-variant max-w-md mb-10">{t('footer.newsletter_desc')}</p>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 w-full max-w-md relative z-10">
          <input 
            className="flex-1 bg-white/50 backdrop-blur-xl border-0 rounded-full px-8 py-4 text-on-surface focus:ring-2 focus:ring-secondary/50 placeholder:text-on-surface-variant/50 outline-none" 
            placeholder={t('cart.email_placeholder')}
            type="email"
            required
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button 
            className="bg-secondary text-on-secondary px-8 py-4 rounded-full font-bold hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group min-w-[140px]" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {t('cart.subscribe')}
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">east</span>
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
