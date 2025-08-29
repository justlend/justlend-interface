// src/utils/formatters.js
import { BigNumber } from './helper';

export function toSafeBigNumber(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return BigNumber(NaN);
  }
  const strValue = String(value);
  return strValue === '--' ? BigNumber(NaN) : BigNumber(strValue);
}

export function formatDate(dateObj, format) {
  if (!(dateObj instanceof Date)) {
    throw new Error('Invalid input: a Date object is required.');
  }

  var date = {
    'M+': dateObj.getMonth() + 1,
    'd+': dateObj.getDate() < 10 ? `0${dateObj.getDate()}` : dateObj.getDate(),
    'h+': dateObj.getHours() < 10 ? `0${dateObj.getHours()}` : dateObj.getHours(),
    'm+': dateObj.getMinutes() < 10 ? `0${dateObj.getMinutes()}` : dateObj.getMinutes(),
    's+': dateObj.getSeconds() < 10 ? `0${dateObj.getSeconds()}` : dateObj.getSeconds(),
    'q+': Math.floor((dateObj.getMonth() + 3) / 3),
    'S+': dateObj.getMilliseconds()
  };
  if (/(y+)/i.test(format)) {
    format = format.replace(RegExp.$1, (dateObj.getFullYear() + '')?.substr(4 - RegExp.$1.length));
  }
  for (var k in date) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? date[k] : ('00' + date[k])?.substr(('' + date[k]).length)
      );
    }
  }
  return format;
}
