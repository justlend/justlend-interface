import intl from 'react-intl-universal';
import find from 'lodash/find';
import { SUPPORT_LOCALES } from './helper';

export const initI18n = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let currentLocale = urlParams.get('lang');

  if (!currentLocale) {
    currentLocale = window.localStorage.getItem('lang');
  }

  if (!currentLocale) {
    currentLocale = window.navigator.language;
  }

  if (!find(SUPPORT_LOCALES, { value: currentLocale })) {
    currentLocale = 'en-US';
  }
  window.localStorage.setItem('lang', currentLocale);

  let localeData;
  try {
    localeData = (await import(`../locales/${currentLocale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load ${currentLocale}, falling back to en-US.`, error);
    currentLocale = 'en-US';
    window.localStorage.setItem('lang', currentLocale);
    localeData = (await import('../locales/en-US.json')).default;
  }

  intl.init({
    currentLocale,
    locales: { [currentLocale]: localeData }
  });

  return currentLocale;
};
