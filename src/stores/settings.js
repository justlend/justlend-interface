import { observable } from 'mobx';
import NodeRSA from 'node-rsa';
import Config from '../config';
import { BigNumber } from '../utils/helper';
import {
  setSettingsSignature,
  getNotiSettings,
  updateNotiSettings,
  getEmailBindInfo,
  getEmailOtp,
  verifyEmailOtp,
  setLanguage
} from '../pages/settings/utils/backend';
import { getSignInfoFromLocalStorage } from '../pages/settings/utils/helper';

const { service } = Config;
const { messageApiToken, lendApiToken } = service;

export default class SettingsStore {
  @observable bindedEmail = '--';
  @observable languagePreference = '';

  @observable snbRiskAlertOn = null;
  @observable rentalRiskAlertOn = null;
  @observable cdpRiskAlertOn = null;
  @observable walletHaveCdpPosition = null;

  @observable settingsSignatureModalVisible = false;

  @observable bindEmailModalVisible = false;
  @observable bindEmailModalIsChangingEmail = false;
  @observable bindEmailModalStep = 1;
  @observable bindEmailModalSavedOtp = '';
  // 1: email and otp input step
  // 2: wallet signing step
  // 3: verify existing email step
  // 4: bind succeed
  // 5: bind failed

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  setData = (obj = {}) => {
    const self = this;
    Object.keys(obj).map(key => {
      self[key] = obj[key];
    });
  };

  encryptSignInfo = async type => {
    await this.rootStore.lend.getLatestBlockInfo();

    const lastSignInfo = await getSignInfoFromLocalStorage();
    const signData = {
      address: this.rootStore.network.defaultAccount,
      blockTimeStamp: this.rootStore.lend.latestBlockInfo.timestamp,
      signature:
        lastSignInfo && lastSignInfo.addr === this.rootStore.network.defaultAccount
          ? lastSignInfo.signResult || '_'
          : '_',
      t: BigNumber(Math.random()).times(1000).toFixed(0, 1)
    };

    const key = new NodeRSA(type === 'lend' ? lendApiToken : messageApiToken, 'pkcs8-public');

    key.setOptions({ encryptionScheme: 'pkcs1' });
    return key.encrypt(signData, 'base64', 'utf-8');
  };

  setSettingsSignature = async address => {
    try {
      const { code, data } = await setSettingsSignature(address, await this.encryptSignInfo());

      return code;
    } catch (error) {
      console.log('setSettingsSignature failed', error);
    }
  };

  getNotiSettings = async address => {
    try {
      const { code, data } = await getNotiSettings(address);

      if (data) {
        this.setData({
          snbRiskAlertOn: data.depositBorrowRisk,
          rentalRiskAlertOn: data.rentRisk,
          cdpRiskAlertOn: data.cdpCollateralRisk,
          walletHaveCdpPosition: data.isCdpOpen
        });
      } else {
        this.setData({
          snbRiskAlertOn: false,
          rentalRiskAlertOn: false,
          cdpRiskAlertOn: false,
          walletHaveCdpPosition: false
        });
      }

      return code;
    } catch (error) {
      console.log('getNotiSettings failed', error);
    }
  };

  updateNotiSettings = async (address, type, turnOn) => {
    try {
      const { code, data } = await updateNotiSettings(address, type, turnOn, await this.encryptSignInfo());

      if (code === 0) {
        this.setData({
          snbRiskAlertOn: data.depositBorrowRisk,
          rentalRiskAlertOn: data.rentRisk,
          cdpRiskAlertOn: data.cdpCollateralRisk,
          walletHaveCdpPosition: data.isCdpOpen
        });
      }

      return code;
    } catch (error) {
      console.log('updateNotiSettings failed', error);
    }
  };

  getEmailBindInfo = async address => {
    try {
      const { code, data } = await getEmailBindInfo(address, await this.encryptSignInfo());

      if (code === 0) {
        if (data.status >= 3 && data.email) {
          this.setData({
            bindedEmail: data.email
          });
        } else {
          this.setData({
            bindedEmail: ''
          });
        }

        if (data.language) {
          this.setData({
            languagePreference: data.language
          });

          // If current lang is not backend returned preferred language, update lang and reload page
          if (this.rootStore.lend.lang.toUpperCase() != data.language.toUpperCase()) {
            this.rootStore.lend.setData({ lang: data.language });
            window.localStorage.setItem('lang', data.language);

            setTimeout(() => {
              let search = window.location.search;
              let params = new URLSearchParams(search);
              let paramName = 'lang';
              let paramValue = data.language;
              if (params.has(paramName)) {
                params.set(paramName, paramValue);
              } else {
                params.append(paramName, paramValue);
              }
              search = params.toString();
              window.location.search = search;
            }, 200);
          }
        } else {
          this.setData({
            languagePreference: ''
          });
        }
      } else {
        console.log('getEmailBindInfo failed');

        this.setData({
          bindedEmail: '',
          languagePreference: ''
        });
      }

      return code;
    } catch (error) {
      console.log('getEmailBindInfo failed', error);
    }
  };

  getEmailOtp = async (address, email, action, lang) => {
    try {
      const { code, data } = await getEmailOtp(address, email, action, lang, await this.encryptSignInfo());

      return code;
    } catch (error) {
      console.log('getEmailOtp failed', error);
    }
  };

  verifyEmailOtp = async (address, email, otp, action) => {
    try {
      const { code, data } = await verifyEmailOtp(address, email, otp, action, await this.encryptSignInfo());

      return code;
    } catch (error) {
      console.log('verifyEmailOtp failed', error);
    }
  };

  setLanguage = async (address, lang) => {
    try {
      // console.log(await this.encryptSignInfo(), '******');
      const { code, data } = await setLanguage(address, lang, await this.encryptSignInfo());

      return code;
    } catch (error) {
      console.log('setLanguage failed', error);
    }
  };
}
