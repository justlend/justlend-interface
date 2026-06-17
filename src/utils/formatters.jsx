// src/utils/formatters.js
import { BigNumber } from './helper';
import Config from '../config/v2config';

const { tokens } = Config;
const { WTRX: WTRXAddress } = tokens;

export function calculateValue(input) {
  const one = new BigNumber(1);
  const ten = new BigNumber(10);

  const denominator = ten.pow(input);

  const result = one.dividedBy(denominator);

  return result;
}

export function toSafeBigNumber(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return BigNumber(NaN);
  }
  const strValue = String(value);
  return strValue === '--' ? BigNumber(NaN) : BigNumber(strValue);
}

export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * format fiat currency value to compact format (k, m)
 * @param {string|number} value - original number
 * @returns {string} - formated number (eg: "$405.72m")
 */
export const formatCompactFiatValue = (value, symbol = '$') => {
  if (value === null || value === undefined || value === '-') return `${symbol}-`.trim();
  const rawNum = Number(value);

  if (isNaN(rawNum)) {
    return `${symbol}0`;
  }

  if (rawNum === 0) {
    return `${symbol}0`;
  }

  if (rawNum > 0 && rawNum < 0.01) {
    return `${symbol}<0.01`;
  }

  const num = new BigNumber(value);

  const tiers = [
    { value: new BigNumber(1e12), suffix: 'T' }, // Trillion
    { value: new BigNumber(1e9), suffix: 'B' }, // Billion
    { value: new BigNumber(1e6), suffix: 'M' }, // Million
    { value: new BigNumber(1e3), suffix: 'K' } // Thousand
  ];

  const absNum = num.abs();
  for (const tier of tiers) {
    if (absNum.gte(tier.value)) {
      const dividedValue = num.dividedBy(tier.value);
      const flooredValue = dividedValue.dp(2, BigNumber.ROUND_DOWN);

      return `${symbol}${flooredValue.toFormat()}${tier.suffix}`;
    }
  }

  const flooredBaseValue = num.dp(2, BigNumber.ROUND_DOWN);

  return `${symbol}${flooredBaseValue.toFormat()}`;
};

/**
 * @param {string} string
 * @returns {string} safe string
 */
const escapeRegExp = string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const highlightText = (text, highlight) => {
  const trimmedHighlight = highlight.trim();
  if (!trimmedHighlight || !text) {
    return text;
  }
  const escapedHighlight = escapeRegExp(trimmedHighlight);
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');

  // Split the text using the regex.
  // Because the regex has a capture group `(...)`,
  // the resulting array will be:
  // [non-match, match, non-match, match, ...]
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="highlight-v2">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

export const formatApyRate = (value, isPercent = false) => {
  if (value === null || value === undefined || value === '-') return '-%';
  const num = Number(value);
  if (isNaN(num)) return '0%';

  let percentage = new BigNumber(value);
  if (!isPercent) percentage = percentage.times(100);

  if (percentage.gt(0) && percentage.lt(0.01)) {
    return '<0.01%';
  }

  const truncatedBN = truncateBigNumber(percentage, 2);
  const safeNumber = truncatedBN.toNumber();

  return `${safeNumber.toLocaleString('en-US', {
    maximumFractionDigits: 2
  })}%`;
};

export const formatDecimalNumber = (value, decimals = 2, isPercent = false) => {
  if (value === null || value === undefined || value === '-') return '-';
  let numBN;
  try {
    numBN = new BigNumber(value);
    if (!numBN.isFinite()) throw new Error('Invalid number');
  } catch (error) {
    console.error('Invalid input value for formatFiatValue:', value);
    return '-';
  }
  if (!isPercent) numBN = numBN.times(100);

  if (numBN.gt(0) && numBN.lt(BigNumber(1).div(10 ** decimals))) {
    return `<${BigNumber(1).div(10 ** decimals).toString()}`;
  }

  const truncatedBN = truncateBigNumber(numBN, decimals);
  const safeNumber = truncatedBN.toNumber();

  return `${safeNumber.toLocaleString('en-US', {
    maximumFractionDigits: decimals
  })}%`;
};

const truncateBigNumber = (num, decimals) => {
  const safeDecimals = Math.max(0, Math.floor(decimals));
  // Use BigNumber's internal truncation mode
  return new BigNumber(num).decimalPlaces(safeDecimals, BigNumber.ROUND_DOWN);
};

export const formatTokenAmount = (value, symbol = '', minLimit = 0.01) => {
  if (value === null || value === undefined || value === '-') return `- ${symbol}`.trim();
  let numBN;
  try {
    numBN = new BigNumber(value);
    if (!numBN.isFinite()) throw new Error('Invalid number');
  } catch (error) {
    console.error('Invalid input value for formatTokenAmount:', value);
    return `0 ${symbol}`.trim(); // Return '0' for invalid inputs
  }

  if (numBN.isZero()) {
    return `0 ${symbol}`.trim();
  }
  if (numBN.abs().gt(0) && numBN.abs().lt(minLimit)) {
    return `<${minLimit} ${symbol}`.trim();
  }

  const integerPartBN = numBN.integerValue(BigNumber.ROUND_DOWN);
  const integerPartString = integerPartBN.abs().toString();
  const integerDigits = integerPartBN.isZero() ? 0 : integerPartString.length;

  let decimalPlaces = 0;

  if (integerDigits >= 6) {
    // Integer >= 6 digits, no decimals displayed
    decimalPlaces = 0;
  } else {
    // Integer < 6 digits, total 6 significant digits (min 2 decimals, max 6 decimals)
    decimalPlaces = 6 - integerDigits;
    decimalPlaces = Math.max(2, decimalPlaces); // Ensure at least 2 decimals conceptually
    decimalPlaces = Math.min(6, decimalPlaces); // Ensure at most 6 decimals
  }

  // Truncate using BigNumber to maintain precision
  const truncatedBN = truncateBigNumber(numBN, decimalPlaces);

  // Use BigNumber's `toFormat`. This function correctly handles thousand separators
  // and does *not* add unnecessary trailing zeros if the number has fewer decimals
  // than specified after truncation.
  const formattedNumber = truncatedBN.toFormat({
    groupSeparator: ',', // Thousand separator
    groupSize: 3, // Grouping for thousand separator
    decimalSeparator: '.' // Decimal separator
    // We don't need to specify fractionGroupSeparator or fractionGroupSize
    // We also don't need to specify minimumFractionDigits if we want trailing zeros removed
  });

  // Ensure if decimalPlaces was 0, no decimal point remains (e.g., "123." becomes "123")
  // `toFormat` usually handles this, but as a safeguard:
  const finalFormatted =
    decimalPlaces === 0 && formattedNumber.includes('.') ? formattedNumber.split('.')[0] : formattedNumber;

  return `${finalFormatted} ${symbol}`.trim(); // Add symbol
};

export const formatFiatValue = (value, currencySymbol = '$') => {
  if (value === null || value === undefined || value === '-') return `${currencySymbol}-`;
  let numBN;
  try {
    numBN = new BigNumber(value);
    if (!numBN.isFinite()) throw new Error('Invalid number');
  } catch (error) {
    console.error('Invalid input value for formatFiatValue:', value);
    return `${currencySymbol}0`;
  }

  if (numBN.isZero()) {
    return `${currencySymbol}0`;
  }
  if (numBN.abs().gt(0) && numBN.abs().lt(0.01)) {
    return `${currencySymbol}<0.01`;
  }

  const integerPartBN = numBN.integerValue(BigNumber.ROUND_DOWN);
  const integerPartString = integerPartBN.abs().toString();
  const integerDigits = integerPartBN.isZero() ? 0 : integerPartString.length;
  let decimalPlaces = 0;

  if (integerDigits >= 6) {
    decimalPlaces = 0; //
  } else {
    // Max 4 decimals for fiat
    decimalPlaces = 6 - integerDigits;
    decimalPlaces = Math.max(2, decimalPlaces); //
    decimalPlaces = Math.min(4, decimalPlaces); // Max 4 decimals
  }

  // Truncate first
  const truncatedBN = truncateBigNumber(numBN, decimalPlaces);

  // Format using toFormat
  const formattedNumber = truncatedBN.toFormat({
    groupSeparator: ',', //
    groupSize: 3,
    decimalSeparator: '.'
  });

  const finalFormatted =
    decimalPlaces === 0 && formattedNumber.includes('.') ? formattedNumber.split('.')[0] : formattedNumber;

  return `${currencySymbol}${finalFormatted}`; // Add currency symbol
};

export const stripTrailingZeros = value => {
  if (value === null || value === undefined || value === '') return '';

  try {
    const bnValue = new BigNumber(value);
    return bnValue.toString();
  } catch (error) {
    console.error('BigNumber conversion failed in stripTrailingZeros:', error);
    let strValue = String(value);
    if (strValue.includes('.')) {
      strValue = strValue.replace(/0+$/, '');
      if (strValue.endsWith('.')) {
        strValue = strValue.slice(0, -1);
      }
    }
    return strValue;
  }
};

// format WTRX to TRX
export const formatTokenSymbol = (address, symbol) => {
  return address === WTRXAddress ? 'TRX' : symbol;
};

// format WTRX to TRX
export const formatVaultName = name => {
  if (!name) return '';

  const regex = /(w)(trx)/gi;
  const newName = name.replace(regex, (match, p1, p2) => {
    const isUppercase = p1 === p1.toUpperCase();

    const firstLetterOfP2 = p2.charAt(0);
    const restOfP2 = p2.slice(1);

    if (isUppercase) {
      return firstLetterOfP2.toUpperCase() + restOfP2;
    } else {
      return firstLetterOfP2.toLowerCase() + restOfP2;
    }
  });

  return newName;
};

// check if token is TRX
export const isTrxToken = address => {
  return address === WTRXAddress;
};

export const getXAxisInterval = (totalCount, mobile) => {
  const baseCount = mobile ? 10 : 15;
  const interval = mobile ? 5 : 10;

  if (totalCount <= baseCount) return 0;
  return Math.ceil(new BigNumber(totalCount).minus(baseCount).div(interval).toNumber());
};


export const formatChartValue = (value, currencySymbol = '$', decimal = 4) => {
  if (value === null || value === undefined || value === '-') return `${currencySymbol}-`;
  let numBN;
  try {
    numBN = new BigNumber(value);
    if (!numBN.isFinite()) throw new Error('Invalid number');
  } catch (error) {
    console.error('Invalid input value for formatChartValue:', value);
    return `${currencySymbol}0`;
  }

  if (numBN.isZero()) {
    return `${currencySymbol}0`;
  }
  if (numBN.abs().gt(0) && numBN.abs().lt(BigNumber(1).div(10).pow(decimal))) {
    return `${currencySymbol}<${BigNumber(1).div(10).pow(decimal).toString()}`;
  }

  // Truncate first
  const truncatedBN = truncateBigNumber(numBN, decimal);

  // Format using toFormat
  const formattedNumber = truncatedBN.toFormat({
    groupSeparator: ',', //
    groupSize: 3,
    decimalSeparator: '.'
  });

  const finalFormatted =
    decimal === 0 && formattedNumber.includes('.') ? formattedNumber.split('.')[0] : formattedNumber;

  return `${currencySymbol}${finalFormatted}`; // Add currency symbol
};