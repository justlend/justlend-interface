import bigNumber from 'bignumber.js';
export const toBigNumber = function (value) {
  if (typeof value === 'string') {
    value = value.replace(/,/g, '');
  }
  return new bigNumber(value);
};

export const toFixedDown = (num, decimals = 4) => {
  const d = toBigNumber(10).pow(decimals);
  return toBigNumber(num).times(d).integerValue(toBigNumber.ROUND_DOWN).div(d).toFixed(decimals);
};