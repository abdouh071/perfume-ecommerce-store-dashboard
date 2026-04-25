import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation, Trans } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import emailjs from '@emailjs/browser';

const ContactUs = () => {
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Save to Firestore
      await addDoc(collection(db, 'messages'), {
        ...formData,
        sentAt: serverTimestamp(),
        status: 'new'
      });

      // 2. Send Email Notification
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey) {
        await emailjs.send(
          serviceId,
          templateId,
          {
            from_name: formData.name,
            from_email: formData.email,
            to_email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@lessence.dz',
            message: formData.message,
            subject: `New Message from ${formData.name}`
          },
          publicKey
        );
      }

      addToast(t('contact_us.success_msg'), 'success');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Contact error:', err);
      // Show the real error message to help the user debug
      addToast(err.text || err.message || t('contact_us.error_msg'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <Navbar />
      <SEO 
        title={t('nav.contact')}
        description={t('contact_us.form_desc')}
      />
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="text-center mb-24 relative">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-zinc-200/20 dark:bg-zinc-800/20 rounded-full blur-[100px] pointer-events-none" />
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-label text-xs tracking-[0.3em] uppercase text-yellow-700 dark:text-yellow-500 mb-6"
        >
          {t('contact_us.subtitle')}
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-headline text-5xl md:text-7xl tracking-tight text-neutral-800 dark:text-neutral-100 font-light leading-none mb-8"
        >
          <Trans i18nKey="contact_us.title" components={{ 0: <span className="italic" /> }} />
        </motion.h1>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
        
        {/* Left Side: Photo */}
        <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full h-full relative rounded-[2.5rem] overflow-hidden min-h-[500px] shadow-xl group hidden lg:block"
        >
           <img 
              alt="Algiers Architecture" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              src="/assets/images/image_2.webp" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
           <div className="absolute bottom-8 left-8 right-8 text-white">
             <h3 className="font-headline text-3xl mb-2 drop-shadow-md">{t('contact_us.photo_title')}</h3>
             <p className="font-label text-xs tracking-widest uppercase drop-shadow-sm opacity-90">{t('contact_us.photo_subtitle')}</p>
           </div>
        </motion.div>

        {/* Right Side: Form & Address */}
        <div className="flex flex-col gap-10">
          
          {/* Boutique Address Card (No Photo) */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 p-10 md:p-12 rounded-[2.5rem] shadow-xl text-center md:text-start flex flex-col md:flex-row items-center md:items-start justify-between gap-6"
          >
            <div>
              <h3 className="font-headline text-3xl text-zinc-900 dark:text-white mb-2">{t('contact_us.boutique_title')}</h3>
              <p className="font-label text-xs tracking-[0.2em] uppercase text-yellow-700 dark:text-yellow-500 font-semibold mb-6">{t('contact_us.boutique_location')}</p>
              <p className="text-zinc-800 dark:text-zinc-200 text-sm font-light mb-2">{t('contact_us.address_line1')}</p>
              <p className="text-zinc-800 dark:text-zinc-200 text-sm font-light">{t('contact_us.address_line2')}</p>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <a href="tel:+21321000000" className="inline-flex justify-center bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-8 py-3 rounded-full font-label text-xs tracking-widest uppercase hover:scale-105 transition-transform whitespace-nowrap">
                {t('contact_us.call_btn')}
              </a>
              <a href="mailto:contact@lessence.dz" className="inline-flex justify-center border border-zinc-900/20 dark:border-white/20 text-zinc-900 dark:text-white px-8 py-3 rounded-full font-label text-xs tracking-widest uppercase hover:bg-zinc-900/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap">
                {t('contact_us.email_btn')}
              </a>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.section 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative w-full p-10 md:p-12 bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-xl flex-1 flex flex-col"
          >
            <h2 className="font-headline text-3xl md:text-4xl text-zinc-900 dark:text-zinc-50 font-light mb-4">{t('contact_us.form_title')}</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8 leading-relaxed font-light">
              {t('contact_us.form_desc')}
            </p>

            <form className="space-y-6 flex-1 flex flex-col" onSubmit={handleSubmit}>
              <div>
                <label className="block font-label text-xs tracking-widest uppercase text-zinc-500 dark:text-zinc-400 mb-2">{t('contact_us.name_label')}</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full bg-white/10 dark:bg-zinc-900/10 border-b border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-white px-0 py-3 text-zinc-900 dark:text-white outline-none transition-colors rounded-none placeholder-zinc-400"
                  placeholder={t('contact_us.name_placeholder')}
                />
              </div>
              <div>
                <label className="block font-label text-xs tracking-widest uppercase text-zinc-500 dark:text-zinc-400 mb-2">{t('contact_us.email_label')}</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full bg-white/10 dark:bg-zinc-900/10 border-b border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-white px-0 py-3 text-zinc-900 dark:text-white outline-none transition-colors rounded-none placeholder-zinc-400"
                  placeholder={t('contact_us.email_placeholder')}
                />
              </div>
              <div className="flex-1">
                <label className="block font-label text-xs tracking-widest uppercase text-zinc-500 dark:text-zinc-400 mb-2">{t('contact_us.message_label')}</label>
                <textarea 
                  rows="4"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full bg-white/10 dark:bg-zinc-900/10 border-b border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-white px-0 py-3 text-zinc-900 dark:text-white outline-none transition-colors rounded-none resize-none placeholder-zinc-400 h-full min-h-[100px]"
                  placeholder={t('contact_us.message_placeholder')}
                ></textarea>
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-8 py-4 rounded-full font-label text-sm tracking-widest uppercase hover:scale-[1.02] transition-transform duration-300 mt-6 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t('contact_us.submit_btn')
                )}
              </button>
            </form>
          </motion.section>

        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactUs;
