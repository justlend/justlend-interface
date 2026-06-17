import { observable, makeObservable } from 'mobx';
import { BigNumber, secureRandom128 } from '../utils/helper';
import { encryptData } from '../utils/crypto';
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

    makeObservable(this);
  }

  setData = (obj = {}) => {
    const self = this;
    Object.keys(obj).map(key => {
      self[key] = obj[key];
    });
  };

  encryptSignInfo = async (type = 'message') => {
    await this.rootStore.lend.getLatestBlockInfo();

    const lastSignInfo = await getSignInfoFromLocalStorage();
    const signData = {
      address: this.rootStore.network.defaultAccount,
      blockTimeStamp: this.rootStore.lend.latestBlockInfo.timestamp,
      signature:
        lastSignInfo && lastSignInfo.addr === this.rootStore.network.defaultAccount
          ? lastSignInfo.signResult || '_'
          : '_',
      t: BigNumber(secureRandom128()).times(1000).toFixed(0, 1)
    };

    const env = import.meta.env.VITE_ENV;
    // console.log('env', env);
    const encryptedData = encryptData(
      type,
      env === 'test' ? 'dev' : env === 'backendPro' ? 'pro' : 'prod',
      JSON.stringify(signData)
    );
    return encryptedData;
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
