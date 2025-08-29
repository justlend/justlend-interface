import intl from 'react-intl-universal';
import find from 'lodash/find';
import { SUPPORT_LOCALES } from './helper';

export const initI18n = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let currentLocale = urlParams.get('lang') || window.localStorage.getItem('lang') || 'en-US';

  if (!find(SUPPORT_LOCALES, { value: currentLocale })) {
    currentLocale = 'en-US';
  }
  window.localStorage.setItem('lang', currentLocale);

  let localeData;
  try {
    localeData = (await import(`../locales/${currentLocale}.json`)).default;
  } catch (error) {
    console.error('Failed to load locale data, falling back to en-US.', error);
    localeData = (await import('../locales/en-US.json')).default;
    currentLocale = 'en-US';
  }

  return intl.init({
    currentLocale,
    locales: { [currentLocale]: localeData }
  });
};
