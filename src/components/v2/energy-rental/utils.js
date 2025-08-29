import React from 'react';
import intl from 'react-intl-universal';
import moment from 'moment';
import BigNumber from 'bignumber.js';

import { Config } from '../../../config';

export function getAnnouncementUrl(lang) {
  if (Config.nile) {
    if (lang && lang.includes('en')) {
      return 'https://justlendorg.zendesk.com/hc/en-us/articles/17080698112537';
    } else {
      return 'https://justlendorg.zendesk.com/hc/zh-cn/articles/17080698112537';
    }
  } else {
    if (lang && lang.includes('en')) {
      return 'https://support.justlend.org/hc/en-us/articles/32539144305305';
    } else {
      return 'https://support.justlend.org/hc/en-us/articles/32539144305305';
    }
  }
}

export function getSecurityDepositDetailsUrl(lang) {
  if (lang && lang.includes('en')) {
    return 'https://support.justlend.org/hc/en-us/articles/31228571004569-What-are-the-rules-for-rent-calculation';
  } else {
    return 'https://support.justlend.org/hc/en-us/articles/31228571004569-What-are-the-rules-for-rent-calculation';
  }
}

export function getRentalGuideUrl(lang) {
  if (lang && lang.includes('en')) {
    return 'https://docs.justlend.org/guides/energy-rental';
  } else {
    return 'https://docs.justlend.org/guides/energy-rental';
  }
}

export function getEnergyTipsLearnMoreUrl(lang) {
  if (lang && lang.includes('en')) {
    return 'https://support.justlend.org/hc/en-us/articles/18581604307737';
  } else {
    return 'https://support.justlend.org/hc/en-us/articles/18581604307737';
  }
}

export function getAboutEnergyRentUrl(lang) {
  if (lang && lang.includes('en')) {
    return 'https://support.justlend.org/hc/en-us/articles/31228571004569-What-are-the-rules-for-rent-calculation';
  } else {
    return 'https://support.justlend.org/hc/en-us/articles/31228571004569-What-are-the-rules-for-rent-calculation';
  }
}

function appendToDateString(string, newPart) {
  return string ? string + ' ' + newPart : newPart;
}

export function toDayHourMinString(seconds) {
  const days = Math.floor(seconds / 60 / 60 / 24);
  const hours = Math.floor((seconds / 60 / 60) % 24);
  const mins = Math.floor((seconds / 60) % 60);

  var result = '';

  if (days > 1) {
    result = appendToDateString(result, BigNumber(days).toString() + intl.get('energy_rental.date_format.days'));
  } else if (days > 0) {
    result = appendToDateString(result, BigNumber(days).toString() + intl.get('energy_rental.date_format.day'));
  }

  if (hours > 1) {
    result = appendToDateString(result, BigNumber(hours).toString() + intl.get('energy_rental.date_format.hours'));
  } else if (hours > 0) {
    result = appendToDateString(result, BigNumber(hours).toString() + intl.get('energy_rental.date_format.hour'));
  }

  if (mins > 1) {
    result = appendToDateString(result, BigNumber(mins).toString() + intl.get('energy_rental.date_format.mins'));
  } else if (mins > 0) {
    result = appendToDateString(result, BigNumber(mins).toString() + intl.get('energy_rental.date_format.min'));
  }

  return result ? result : '--';
}

export function dateAfterSecondsToISO(seconds) {
  return seconds && BigNumber(seconds).isNaN()
    ? '--'
    : moment(BigNumber(seconds).times(1000).plus(new Date().getTime()).toNumber()).format('YYYY-MM-DD HH:mm');
}

export function shouldShowShortRentalHint(seconds) {
  return BigNumber(seconds / 60 / 60).lte(3);
}

export const fullAddressDisplayDiv = (address, classNameStr) => {
  return (
    <div className={classNameStr}>
      <span>{address.slice(0, address.length - 6)}</span>
      <span className="second-part">{address.slice(address.length - 6, address.length)}</span>
    </div>
  );
};
