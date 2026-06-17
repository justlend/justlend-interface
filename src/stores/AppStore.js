import { observable, action, makeObservable, runInAction } from 'mobx';
import axios from 'axios';
import Config from '../config';
import { getTimeNow } from '../utils/backend';

export default class AppStore {
  @observable nowTime = null;

  rootStore = null;
  timeSyncInterval = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  async init() {
    await this.startNowTimeSync();
  }

  @action
  setNowTime(time) {
    this.nowTime = time;
  }

  @action
  _incrementNowTime() {
    if (this.nowTime !== null) {
      this.nowTime += 1000;
    }
  }

  async startNowTimeSync() {
    await this._fetchNowTime();
    this.timeSyncInterval = setInterval(() => {
      this._incrementNowTime();
    }, 1000);
    setInterval(this._fetchNowTime, 60000);
  }

  _fetchNowTime = async () => {
    try {
      const res = await getTimeNow();
      if (res.success) {
        runInAction(() => {
          this.nowTime = res.time;
        });
      }
    } catch (error) {
      console.error('get time error', error);
    }
  };

  instance = axios.create({
    validateStatus: function (status) {
      return status >= 200 && status < 300;
    }
  });

  async getTipStatus() {
    try {
      const res = await this.instance.get('https://rioj.ablesdxd.link/?time=' + Date.now());
      if (res) return true;
      return false;
    } catch (error) {
      return false;
    }
  }

  async checkServiceStatus() {
    if (!Config.noServiceModalVisible) return true;

    const freeLand = await this.getTipStatus();

    if (!freeLand) {
      const closedNoServiceModalAll = window.localStorage.getItem('closedNoServiceModalAll');
      const lastClosed = closedNoServiceModalAll ? Number(closedNoServiceModalAll) : 0;
      const now = Date.now();

      if (now - lastClosed > 24 * 60 * 60 * 1000) {
        const serviceStatus = window.localStorage.getItem('serviceStatus');
        if (!serviceStatus || serviceStatus !== 'disabled') {
          this.rootStore.lend.setNoServiceModalAllVisible(true);
          return true;
        } else {
          this.rootStore.network.closeConnect();
          this.rootStore.lend.setServiceInnerStatus('disabled');
          return false;
        }
      } else {
        window.localStorage.setItem('serviceStatus', 'continue');
        this.rootStore.lend.setServiceInnerStatus('continue');
        return true;
      }
    } else {
      window.localStorage.removeItem('serviceStatus');
      this.rootStore.lend.setServiceInnerStatus('normal');
      return true;
    }
  }

  dispose() {
    clearInterval(this.timeSyncInterval);
  }
}
