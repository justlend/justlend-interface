import crypto from 'crypto';
import _ from 'lodash';
import TronWeb from 'tronweb';
import { postFinanceStat } from './backend';

export const getCommonParams = (address, headers) => {
  const nonce = randomNumber();
  const SECRET_ID = 'AE68A487AA919CAE';
  const SECRET_KEY = 'FMD5MW11TIIMYFSWDXVGQDUD9XR7GVV9XR29J';
  address = accountToHex(address);
  headers.nonce = nonce;
  headers.secretId = SECRET_ID;
  headers.address = address;
  const method = 'POST';
  const signStr = getSignature(SECRET_KEY, method, headers.DeviceID, '/api/stat/action', headers);
  console.log('signature: ', signStr);
  const signature = signStr;
  return {
    nonce,
    secretId: SECRET_ID,
    signature
  };
};

const getHeaderParams = () => {
  const params = {
    System: 'chrome',
    Version: '1.0.0',
    DeviceID: '1:1:1:1',
    Lang: '1',
    channel: 'official',
    packageName: 'justlend',
    ts: new Date().getTime(),
    chain: 'MainChain'
  };
  return params;
};

const randomNumber = () => {
  return Math.floor(Math.random() * 10000);
};

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

export const financeStat = async (address, data) => {
  try {
    address = accountToHex(address);
    const headers = getHeaderParams();
    const params = getCommonParams(address, headers);
    params.address = address;
    data.address = address;
    const options = {
      headers,
      params
    };
    await postFinanceStat(data, options);
  } catch (error) {
    return {
      success: false
    };
  }
};
