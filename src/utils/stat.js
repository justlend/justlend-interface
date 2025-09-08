import crypto from 'crypto';
import _ from 'lodash';
import TronWeb from 'tronweb';

export const accountToHex = address => {
  if (address.match(/^T/)) {
    return TronWeb.address.toHex(address).toUpperCase();
  }
  return address;
};

export const getSignature = (secretKey, method = 'POST', deviceId, path, params = {}) => {
  const spliceStr = `${method}${deviceId}${path}?${makeQueryString(params)}`;
  return hmacSHA1(secretKey, spliceStr);
};

export const hmacSHA1 = (secretKey, text) => {
  const sha1Text = crypto.createHmac('sha1', secretKey).update(text, 'utf8').digest('base64');
  return sha1Text;
};

export const makeQueryString = params => {
  const pickObject = _.pick(params, [
    'Lang',
    'System',
    'Version',
    'address',
    'chain',
    'channel',
    'nonce',
    'secretId',
    'ts'
  ]);
  const keys = Object.keys(pickObject);
  const sortKeys = keys.sort();
  const paramsArr = [];

  for (const key of sortKeys) {
    paramsArr.push(`${key}=${params[key]}`);
  }
  return paramsArr.join('&');
};
