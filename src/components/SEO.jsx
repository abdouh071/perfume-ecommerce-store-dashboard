import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

/**
 * SEO Component to handle dynamic meta tags for social sharing
 * @param {string} title - Page title
 * @param {string} description - Meta description
 * @param {string} image - Preview image URL
 * @param {string} url - Current page URL
 * @param {string} type - OG type (website, product)
 * @param {string} price - Price for product meta tags
 * @param {string} currency - Currency for product meta tags
 */
const SEO = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  price,
  currency = 'DZD'
}) => {
  const { i18n } = useTranslation();
  
  const siteName = "L'Essence Pur";
  const defaultTitle = "L'Essence Pur | Luxury Fragrances";
  const defaultDescription = "Curating the world's most exquisite fragrances from heritage houses and modern artisans.";
  const defaultImage = "https://lessence-perfumes.web.app/og-main.jpg"; // Fallback main image
  const defaultUrl = window.location.origin;

  const seoTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoImage = image || defaultImage;
  const seoUrl = url ? `${defaultUrl}${url}` : window.location.href;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="title" content={seoTitle} />
      <meta name="description" content={seoDescription} />
      <meta name="language" content={i18n.language} />

      {/* Open Graph / Facebook / Instagram */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={seoUrl} />
      <meta property="twitter:title" content={seoTitle} />
      <meta property="twitter:description" content={seoDescription} />
      <meta property="twitter:image" content={seoImage} />

      {/* Product Specific (for WhatsApp/FB rich previews) */}
      {type === 'product' && (
        <>
          <meta property="og:price:amount" content={price} />
          <meta property="og:price:currency" content={currency} />
          <meta property="product:price:amount" content={price} />
          <meta property="product:price:currency" content={currency} />
          <meta name="revisit-after" content="1 days" />
        </>
      )}

      {i18n.language === 'ar' && (
        <link rel="alternate" hrefLang="ar" href={seoUrl} />
      )}

      {/* Structured Data (JSON-LD) for Google Rich Snippets */}
      {type === 'product' && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": title,
            "image": seoImage,
            "description": seoDescription,
            "brand": {
              "@type": "Brand",
              "name": siteName
            },
            "offers": {
              "@type": "Offer",
              "url": seoUrl,
              "priceCurrency": currency,
              "price": price,
              "availability": "https://schema.org/InStock",
              "itemCondition": "https://schema.org/NewCondition"
            }
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
