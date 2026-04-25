import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <section id="about-section" className="pt-12 pb-32 md:pt-20 bg-surface">
      <div className="max-w-5xl mx-auto px-8 text-center">
        <span className="text-tertiary uppercase tracking-[0.4em] text-xs font-bold mb-8 block">{t('philosophy.title')}</span>
        <h2 className="text-4xl md:text-5xl font-headline leading-relaxed mb-10">
          {t('philosophy.text_1')} <span className="italic">{t('philosophy.text_2')}</span> {t('philosophy.text_3')}
        </h2>
        <div className="w-24 h-px bg-outline-variant mx-auto mb-10"></div>
        <p className="font-body text-on-surface-variant max-w-2xl mx-auto text-lg leading-loose">
          {t('philosophy.description')}
        </p>
      </div>
    </section>
  );
}
