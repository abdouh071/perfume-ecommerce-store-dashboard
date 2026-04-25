import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { addToast } = useToast();
  const { t } = useTranslation();

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    addToast('Successfully joined The Circle!', 'success');
    e.target.reset();
  };

  return (
    <footer className="bg-surface/50 border-t border-on-surface/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12 md:gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col items-center md:items-start gap-4">
            <Link to="/" className="text-2xl font-headline font-bold text-on-surface">L'Essence</Link>
            <p className="text-on-surface-variant text-sm font-body max-w-xs text-center md:text-start">
              {t('footer.tagline', "Curating the world's most exquisite fragrances since 2024.")}
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-2">{t('nav.shop')}</h4>
            <Link to="/shop" className="text-on-surface-variant hover:text-secondary transition-all text-sm font-body">{t('footer.all_products')}</Link>
            <Link to="/shop?category=women" className="text-on-surface-variant hover:text-secondary transition-all text-sm font-body">{t('nav.women')}</Link>
            <Link to="/shop?category=men" className="text-on-surface-variant hover:text-secondary transition-all text-sm font-body">{t('nav.men')}</Link>
            <Link to="/shop?category=unisex" className="text-on-surface-variant hover:text-secondary transition-all text-sm font-body">{t('nav.unisex')}</Link>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-2">{t('footer.company')}</h4>
            <Link to="/about" className="text-on-surface-variant hover:text-secondary transition-all text-sm font-body">{t('nav.about')}</Link>
            <Link to="/contact" className="text-on-surface-variant hover:text-secondary transition-all text-sm font-body">{t('nav.contact')}</Link>
            <Link to="/track-order" className="text-on-surface-variant hover:text-secondary transition-all text-sm font-body">Track Order</Link>
            <a href="#" className="text-on-surface-variant hover:text-secondary transition-all text-sm font-body">{t('footer.careers')}</a>
          </div>
          
          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-2">{t('footer.legal')}</h4>
            <a href="#" className="text-on-surface-variant hover:text-secondary transition-all text-sm font-body">{t('footer.privacy')}</a>
            <a href="#" className="text-on-surface-variant hover:text-secondary transition-all text-sm font-body">{t('footer.terms')}</a>
            <a href="#" className="text-on-surface-variant hover:text-secondary transition-all text-sm font-body">{t('footer.shipping_policy')}</a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-on-surface/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-on-surface-variant text-xs font-body">
            © 2024 L'Essence Boutique. {t('footer.rights')}
          </p>
          
          {/* Social Icons */}
          <div className="flex gap-4">
            <a href="#" className="w-8 h-8 rounded-full border border-on-surface/10 flex items-center justify-center text-on-surface hover:bg-secondary hover:text-on-secondary transition-all">
              <span className="material-symbols-outlined text-base">brand_awareness</span>
            </a>
            <a href="#" className="w-8 h-8 rounded-full border border-on-surface/10 flex items-center justify-center text-on-surface hover:bg-secondary hover:text-on-secondary transition-all">
              <span className="material-symbols-outlined text-base">groups</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
