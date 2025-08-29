// Libraries
import { observable, transaction } from 'mobx';
import intl from 'react-intl-universal';
import Config from '../config';
import BigNumber from 'bignumber.js';
import { formatNumber, getQueryObj, getTrxBalance } from '../utils/helper';
import {
  getBalanceStUsdtInfo,
  tronObj,
  getAmountLimit,
  getFeeRate,
  getMintPaused,
  getPaused
} from '../utils/blockchain';
import { getStUsdtDashboard, getStUsdtUserAccount, getStUsdtRebaseCharts, getRiojCheck } from '../utils/backend';

const tronWeb = tronObj.tronWeb;
const defaultIntervalSeconds = 300000;
export default class StUsdtStore {
  @observable balanceInfo = {};
  @observable dashboardData = {};
  @observable userData = {};
  @observable rebaseHistoryData = {};
  @observable rebaseChartsData = {};
  @observable minStakeAmount = '--';
  @observable minUnstakeAmount = '--';
  @observable pendingInfo = {};
  @observable claimableInfo = {};
  @observable multiRewardData = [];
  @observable totalReward = '--';
  @observable choosedTotalReward = '--';
  @observable defaultValue = [];
  @observable collapse = true;
  @observable feeRate = '';
  @observable qa = '';
  @observable topBarShow = true;
  @observable mintPaused = 0;
  @observable paused = 0;
  @observable noService = false; // IP check
  @observable riojBalance = false; // have balance

  constructor(rootStore) {
    this.rootStore = rootStore;
    this.lang = getQueryObj()?.lang || window.localStorage.getItem('lang') || 'en-US';
    window.localStorage.setItem('lang', this.lang);
    window.addEventListener('storage', () => {
      const theme = window.localStorage.getItem('theme') || '';
      const lang = window.localStorage.getItem('lang') || 'en-US';
      this.theme = theme;
      this.lang = lang;
    });
  }

  setData = (obj = {}, target = false) => {
    const self = this;
    Object.keys(obj).map(key => {
      if (target) {
        self[target][key] = obj[key];
      } else {
        self[key] = obj[key];
      }
    });
  };

  setVariablesInterval = async () => {
    if (!this.backendInterval) {
      this.backendInterval = setInterval(async () => {
        await this.getDashboardData();
        // await this.getRebaseHistoryData();
        await this.getRebaseChartsData();
        await this.getFeeRate();
        await this.getMintPaused();
        await this.getPaused();
        await this.rootStore.lend.getLatestBlockInfo();
        if (this.rootStore.network.isConnected) {
          await this.getUserData();
          await this.getTokenBalanceInfo(
            this.rootStore.network.defaultAccount,
            [Config['usdt'].token, Config['stusdt'].token],
            [Config.minterProxy, Config.UnstUSDTProxy]
          );
        }
      }, defaultIntervalSeconds);
    }
  };

  clearVariablesInterval = () => {
    clearInterval(this.backendInterval);
    this.backendInterval = null;
  };

  getTokenBalanceInfo = async (accountAddress, tokens, jtokens) => {
    if (!accountAddress) return;

    const balanceInfo = await getBalanceStUsdtInfo(accountAddress, tokens, jtokens, this.balanceInfo);
    this.balanceInfo = { ...balanceInfo };
    return balanceInfo;
  };

  getDashboardData = async () => {
    try {
      const res = await getStUsdtDashboard();
      if (res.success) {
        this.setData({ dashboardData: res.data });
      }
      return null;
    } catch (err) {
      console.log('getDashboardData', err);
    }
  };

  getUserData = async () => {
    try {
      if (!this.rootStore.network.isConnected) return;
      let res = null;
      res = await getStUsdtUserAccount(this.rootStore.network.defaultAccount);
      if (res.success) {
        this.setData({
          userData: res.data
        });
        this.getClaimInfo(res.data);
      } else {
        this.setData({
          userData: {},
          pendingInfo: {},
          claimableInfo: {}
        });
      }
    } catch (err) {
      console.log('getUserData', err);
    }
  };

  getClaimInfo = userData => {
    if (userData?.withdraw && userData?.withdraw.length > 0) {
      let pendingAmounts = 0;
      let pendingIndex = 0;
      let pendingItem = [];
      let pendingTimeStamp = 0;
      let claimableAmounts = 0;
      let claimableIndex = 0;
      let claimableItem = [];
      userData.withdraw.map(item => {
        // status: 1-pending ; 2-claimable
        if (item.status == 1) {
          pendingIndex++;
          pendingAmounts = BigNumber(pendingAmounts).plus(item.amount);
          pendingItem.push(item);
          if (item.timestamp > pendingTimeStamp) {
            pendingTimeStamp = item.timestamp;
          }
        } else if (item.status == 2) {
          claimableIndex++;
          claimableAmounts = BigNumber(claimableAmounts).plus(item.amount);
          claimableItem.push(item);
        }
      });
      let pendingInfo = { pendingAmounts, pendingIndex, pendingItem, pendingTimeStamp };
      let claimableInfo = { claimableAmounts, claimableIndex, claimableItem };
      this.pendingInfo = { ...pendingInfo };
      this.claimableInfo = { ...claimableInfo };
    } else {
      this.setData({
        pendingInfo: {},
        claimableInfo: {}
      });
    }
  };

  // getRebaseHistoryData = async () => {
  //   try {
  //     const res = await getRebaseHistory();
  //     if (res.success) {
  //       this.setData({ rebaseHistoryData: res.data });
  //     }
  //     return null;
  //   } catch (err) {
  //     console.log('getRebaseHistoryData', err);
  //   }
  // };

  getRebaseChartsData = async () => {
    try {
      const res = await getStUsdtRebaseCharts();
      if (res.success) {
        this.setData({ rebaseChartsData: res.data });
      }
      return null;
    } catch (err) {
      console.log('getRebaseChartsData', err);
    }
  };

  getAmountLimit = async () => {
    try {
      const res = await getAmountLimit();
      if (res.success) {
        this.setData({
          minStakeAmount: BigNumber(BigNumber(res.minStakeAmount).div(Config['usdt'].precision)._toFixed(0, 1)).eq(
            BigNumber(res.minStakeAmount).div(Config['usdt'].precision)
          )
            ? BigNumber(res.minStakeAmount).div(Config['usdt'].precision)
            : BigNumber(BigNumber(res.minStakeAmount).div(Config['usdt'].precision)._toFixed(0, 1)).plus(1),
          minUnstakeAmount: BigNumber(
            BigNumber(res.minUnstakeAmount).div(Config['stusdt'].precision)._toFixed(0, 1)
          ).eq(BigNumber(res.minUnstakeAmount).div(Config['stusdt'].precision))
            ? BigNumber(res.minUnstakeAmount).div(Config['stusdt'].precision)
            : BigNumber(BigNumber(res.minUnstakeAmount).div(Config['stusdt'].precision)._toFixed(0, 1)).plus(1)
        });
      }
    } catch (err) {
      console.log('getAmountLimit', err);
    }
  };

  getFeeRate = async () => {
    try {
      const res = await getFeeRate();
      if (res.success) {
        this.setData({
          feeRate: BigNumber(res.feeRate).div(1e18).toString()
        });
      }
    } catch (err) {
      console.log('getFeeRate', err);
    }
  };

  getMintPaused = async () => {
    try {
      const res = await getMintPaused();
      if (res.success) {
        this.setData({
          mintPaused: BigNumber(res.mintPaused).toString()
        });
      }
    } catch (err) {
      console.log('getMintPaused', err);
    }
  };

  getPaused = async () => {
    try {
      const res = await getPaused();
      if (res.success) {
        this.setData({
          paused: BigNumber(res.paused).toString()
        });
      }
    } catch (err) {
      console.log('getPaused', err);
    }
  };

  getMultiReward = async () => {
    try {
      let multiRewardData = {};
      this.claimableInfo.claimableItem
        .sort((a, b) => {
          return a.timestamp - b.timestamp;
        })
        .map(item => {
          multiRewardData[item.requestId] = item;
        });
      // const multiRewardData = res.data;
      this.collapseInit(multiRewardData);
      this.filterReward(Object.keys(multiRewardData), multiRewardData, true);
    } catch (err) {
      console.log('getMultiReward', err);
    }
  };

  collapseInit = (multiRewardData = this.multiRewardData) => {
    if (Object.keys(multiRewardData).length > 3) {
      this.collapse = false;
    } else {
      this.collapse = true;
    }
  };

  filterReward = (dataArr, multiRewardData = this.multiRewardData, isInit = false) => {
    let totalReward = 0;
    let choosedTotalReward = 0;
    let defaultValue = [];

    // dataArr = !dataArr ? Object.keys(multiRewardData).reverse() : dataArr.reverse();
    dataArr = !dataArr ? Object.keys(multiRewardData) : dataArr;

    if (dataArr?.length > 0) {
      dataArr.map((item, index) => {
        if (dataArr.length > Config.usdtRewardNum && isInit) {
          if (index < Config.usdtRewardNum) {
            defaultValue.push(item);
            choosedTotalReward = BigNumber(choosedTotalReward).plus(BigNumber(multiRewardData[item]?.amount));
          }
        } else {
          defaultValue.push(item);
          choosedTotalReward = BigNumber(choosedTotalReward).plus(BigNumber(multiRewardData[item]?.amount));
        }
      });
    }

    let totalDataArr = Object.keys(multiRewardData);
    if (totalDataArr?.length > 0) {
      totalDataArr.map(item => {
        totalReward = BigNumber(totalReward).plus(BigNumber(multiRewardData[item]?.amount));
      });
    }

    this.setData({ multiRewardData, defaultValue, choosedTotalReward, totalReward });
  };

  getEnergyFee = async () => {
    let energyFee = null;
    let energyFeeArr = await tronWeb.trx.getChainParameters();

    energyFeeArr.map(item => {
      if (item.key === 'getEnergyFee') {
        energyFee = item.value;
      }
    });

    this.setData({ energyFee });
    return energyFee;
  };

  getRiojCheck = async () => {
    try {
      const res = await getRiojCheck();
      this.setData({ noService: !res.success });
    } catch (err) {
      console.log('getRiojCheck', err);
    }
  };

  getRiojBalance = async () => {
    try {
      const data = await this.getTokenBalanceInfo(
        this.rootStore.network.defaultAccount,
        [Config['stusdt'].token, Config['wstusdt'].token],
        [Config.wstUSDTProxy, Config.UnstUSDTProxy]
      );

      if (
        (!BigNumber(data?.[Config['stusdt']?.token]?.balance).isNaN() &&
          BigNumber(data[Config['stusdt']?.token]?.balance).gt(0)) ||
        (!BigNumber(data?.[Config['wstusdt']?.token]?.balance).isNaN() &&
          BigNumber(data[Config['wstusdt']?.token]?.balance).gt(0))
      ) {
        this.setData({
          riojBalance: true
        });
      } else {
        this.setData({
          riojBalance: false
        });
      }
    } catch (err) {
      console.log('getRiojBalance', err);
    }
  };
}
