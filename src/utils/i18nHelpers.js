/**
 * Safely retrieves a localized string from a value that could be a string or an object.
 * @param {string|object} val - The value to resolve (e.g. { en: '...', fr: '...', ar: '...' } or a string).
 * @param {string} lang - The current language code (en, fr, ar).
 * @returns {string} The localized string or empty string.
 */
export const getLang = (val, lang = 'en') => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val[lang] || val['en'] || Object.values(val)[0] || '';
  }
  return '';
};
