import axios from 'axios';
import Config from '../../../config';

import { getExpiryDurationInMS } from '../../../utils/helper';

const { service } = Config;
const { messageApiHost, messageApiAccessToken, settingsService } = service;

const {
  setLanguagePath,
  setSignPath,
  getEmailOtpPath,
  verifyEmailOtpPath,
  getEmailBindInfoPath,
  getNotiSettingsPath,
  updateNotiSettingsPath
} = settingsService;

export const getWrapper = async (functionName, url, params) => {
  try {
    let { data } = await axios.get(url, { params: params });

    return {
      code: data?.code,
      data: data?.data
    };
  } catch (error) {
    console.error(`${functionName} error: ${error}`);

    return {
      code: -1
    };
  }
};

export const postWrapper = async (functionName, url, params) => {
  try {
    let { data } = await axios.post(url, params, {});

    return {
      code: data?.code,
      data: data?.data
    };
  } catch (error) {
    console.error(`${functionName} error: ${error}`);

    return {
      code: -1
    };
  }
};

export const setSettingsSignature = async (address, sign) =>
  postWrapper('setSettingsSignature', `${messageApiHost}${setSignPath}`, {
    // accessToken: messageApiAccessToken,
    address,
    expireTime: getExpiryDurationInMS(60 * 60),
    sign
  });

export const getNotiSettings = async address =>
  getWrapper('getNotiSettings', `${messageApiHost}${getNotiSettingsPath}`, {
    address
  });
export const updateNotiSettings = async (address, type, turnOn, sign) =>
  postWrapper('updateNotiSettings', `${messageApiHost}${updateNotiSettingsPath}`, {
    // accessToken: messageApiAccessToken,
    address,
    type,
    turnOn,
    sign
  });

export const getEmailBindInfo = async (address, sign) =>
  postWrapper('getEmailBindInfo', `${messageApiHost}${getEmailBindInfoPath}`, {
    // accessToken: messageApiAccessToken,
    address,
    sign
  });
export const getEmailOtp = async (address, email, action, lang, sign) =>
  postWrapper('getEmailOtp', `${messageApiHost}${getEmailOtpPath}`, {
    // accessToken: messageApiAccessToken,
    address,
    email,
    action,
    lang,
    sign
  });
export const verifyEmailOtp = async (address, email, code, action, sign) =>
  postWrapper('verifyEmailOtp', `${messageApiHost}${verifyEmailOtpPath}`, {
    // accessToken: messageApiAccessToken,
    address,
    email,
    code,
    action,
    sign
  });

export const setLanguage = async (address, lang, sign) =>
  postWrapper('setLanguage', `${messageApiHost}${setLanguagePath}`, {
    // accessToken: messageApiAccessToken,
    address: address,
    lang: lang,
    sign
  });
