// Libraries
import BigNumber from 'bignumber.js';
import { TronWeb } from 'tronweb';
import { debounce } from 'lodash';
import { observable, makeObservable } from 'mobx';
import Config from '../config';
import { getAllowanceMultiReward, getSTrxDashboard, getSTrxStakeAccount, getReturnRentInfo } from '../utils/backend';
import { formatNumber, getTrxBalance } from '../utils/helper';

const { chain } = Config;
const privateKey = chain.privateKey;

const mainchain = new TronWeb({
  fullHost: chain.fullHost,
  privateKey
});

const tronObj = {
  tronWeb: mainchain,
  walletTronWeb: null
};

const tronWeb = tronObj.tronWeb;

const defaultIntervalSeconds = 60000;
export default class StrxStore {
  // for home nav start...
  @observable pagination = {
    pageNo: 1,
    orderBy: 'liquidity',
    desc: true,
    pageSize: 10
  };
  @observable userDataSource = null;

  /**
   * @type {{ markets: }}
   */
  @observable dashboardData = null;

  @observable rentBalance = 0;
  @observable securityDeposit = '--';
  @observable rentLeft = '--';
  @observable liquidateThreshold = '--';
  @observable feeRatio = '--';
  @observable minFee = '--';
  @observable totalDelegatedOfType = '--';
  @observable totalFrozenOfType = '--';
  @observable rate = '--';
  @observable basicRate = '--';
  @observable maxRentableOfType = '--';
  @observable returnResourceEnergy = '--';
  @observable stakeAmount = '--';
  @observable energyFee = null;
  @observable returnResourceVisible = false;
  @observable rentPaused = false;
  @observable rentPausedVisible = false;

  @observable backendInterval = null;
  @observable trxBalance = null;
  @observable strxBalance = null;
  @observable userData = {
    accountCanClaimAmount: 0,
    accountEnergyIndex: '--',
    accountEnergyLastBlockTimestamp: '--',
    accountEnergyLastBlocknum: '--',
    accountIncome: 0,
    accountRentEnergyAmount: '--',
    accountSupply: 0,
    accountWithDrawAmount: 0,
    roundDetails: [],
    rewardMap: {
      gainNew: '--'
    }
  };
  @observable marketData = {
    trxPrice: '--',
    exchangeRate: '--',
    totalApy: '--',
    voteApy: '--',
    totalSupply: '--',
    totalUnfreezable: '--',
    unfreezeDelayDays: '--',
    energyStakePerTrx: '--',
    jstAmountRewardRentPerTrx: '--',
    jstPrice: '--'
  };
  @observable engeryOfferModalVisible = false;
  @observable multiRewardData = [];
  @observable totalReward = '--';
  @observable choosedTotalReward = '--';
  @observable defaultValue = [];
  @observable collapse = true;
  @observable energyHold = '--';
  @observable energyDependingValue = 1000000;

  @observable returnRentInfo = {
    securityDeposit: '--',
    rentRemain: '--',
    unrecoveredEnergyAmount: '--',
    dailyRent: '--',
    rentAmount: '--'
  };

  constructor(rootStore) {
    this.rootStore = rootStore;
    const closedDuration = window.localStorage.getItem('closedDuration');
    const isEngeryOfferShow = window.localStorage.getItem('isEngeryOfferShow') === 'no';
    const lastClosed = closedDuration ? Number(closedDuration) : 0;
    const now = Date.now();
    if (now - lastClosed > 24 * 60 * 60 * 1000 && !isEngeryOfferShow) {
      //if (now - lastClosed > 5 * 60 * 1000 && !isEngeryOfferShow) {
      //window.localStorage.setItem('closedDuration', now);
      window.gtag('event', 'subsidy_showModal', { 'event_category': 'PC_V1.5', 'event_label': 'subsidy_showModal' });
      this.setData({
        engeryOfferModalVisible: true
      });
    }

    makeObservable(this);
  }

  setVariablesInterval = async () => {
    if (!this.backendInterval) {
      this.backendInterval = setInterval(async () => {
        this.getMarketData();
        this.getNotAccountRentInfos();
        if (this.rootStore.network.isConnected) {
          this.getUserData();
          this.getUserTrxBalance();
          this.getAccountRentInfos();
          this.getReturnRentInfo();
        }
      }, defaultIntervalSeconds);
    }
  };

  clearVariablesInterval = () => {
    clearInterval(this.backendInterval);
    this.backendInterval = null;
  };

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

  getUserData = async () => {
    try {
      if (!this.rootStore.network.isConnected) return;
      let res = null;
      res = await getSTrxStakeAccount(this.rootStore.network.defaultAccount);
      if (res.success) {
        this.setData({
          userData: res.data
        });
      } else {
        this.setData({
          userData: {
            accountCanClaimAmount: 0,
            accountEnergyIndex: '--',
            accountEnergyLastBlockTimestamp: '--',
            accountEnergyLastBlocknum: '--',
            accountIncome: 0,
            accountRentEnergyAmount: '--',
            accountSupply: 0,
            accountWithDrawAmount: 0,
            roundDetails: [],
            rewardMap: {
              gainNew: '--'
            }
          }
        });
      }
    } catch (err) {
      console.log('getUserData', err);
    }
  };

  getMarketData = debounce(async () => {
    try {
      let res = null;
      res = await getSTrxDashboard();
      if (res.success) {
        const data = res.data;
        try {
          data.sTrx1Trx = formatNumber(BigNumber(1e18).div(data.exchangeRate), 6);
          data.trx1sTrx = formatNumber(BigNumber(data.exchangeRate).div(1e18), 6);
        } catch (e) {
          console.error(e);
        }
        const currentItem = res.data.model?.find(item => item.current) || {};
        const trx1wEnergy = currentItem.trx1wEnergy || '--';
        const jst1wEnergy = BigNumber(10000).div(res.data.energyStakePerTrx).times(res.data.jstAmountRewardRentPerTrx);
        const jst2trx1wEnergy = BigNumber(10000)
          .div(res.data.energyStakePerTrx)
          .times(res.data.jstAmountRewardRentPerTrx)
          .times(res.data.jstPrice)
          .div(res.data.trxPrice);

        this.setData({
          marketData: {
            ...res.data,
            trx1wEnergy,
            jst1wEnergy,
            jst2trx1wEnergy
          },
          energyHold: BigNumber(data.energyLimit).minus(data.energyUsed)
        });
      }
    } catch (err) {
      console.log('getUserData', err);
    }
  }, 300);

  getUserTrxBalance = async () => {
    this.trxBalance = await getTrxBalance(this.rootStore.network.defaultAccount);
  };

  getAccountRentInfos = async () => {
    const { defaultAccount } = this.rootStore.network;

    const rentInfo = await this.rootStore.system.getRentInfo(defaultAccount, 1);
    if (rentInfo.success) {
      this.setData({ securityDeposit: BigNumber(rentInfo.securityDeposit).div(Config.trxPrecision) });
    }

    const rentalsInfo = await this.rootStore.system.getRentalsInfo(defaultAccount, 1);
    if (rentalsInfo.success) {
      this.setData({
        rentBalance: BigNumber(rentalsInfo.rentBalance).div(Config.trxPrecision)
      });

      if (BigNumber(rentalsInfo.rentBalance).gt(0)) {
        const returnResourceQueryInfo = await this.rootStore.system.returnResourceQuery(
          defaultAccount,
          BigNumber(rentalsInfo.rentBalance).toString()
        );

        if (rentalsInfo.success) {
          this.setData({
            returnResourceEnergy: BigNumber(returnResourceQueryInfo.amount).div(Config.trxPrecision)
          });
        }
      }
    }
  };

  getNotAccountRentInfos = async () => {
    const rentPausedInfo = await this.rootStore.system.rentPaused();
    if (rentPausedInfo.success) {
      this.setData({ rentPaused: BigNumber(rentPausedInfo.amount).eq(0) ? false : true });
    }

    const liquidateInfo = await this.rootStore.system.liquidateThreshold();
    if (liquidateInfo.success) {
      this.setData({ liquidateThreshold: liquidateInfo.amount });
    }

    const feeRatioInfo = await this.rootStore.system.feeRatio();
    if (feeRatioInfo.success) {
      this.setData({ feeRatio: BigNumber(feeRatioInfo.amount).div(Config.tokenDefaultPrecision) });
    }

    const minFeeInfo = await this.rootStore.system.minFee();
    if (minFeeInfo.success) {
      this.setData({ minFee: BigNumber(minFeeInfo.amount).div(Config.trxPrecision) });
    }

    const totalDelegatedOfTypeInfo = await this.rootStore.system.totalDelegatedOfType();
    if (totalDelegatedOfTypeInfo.success) {
      this.setData({ totalDelegatedOfType: BigNumber(totalDelegatedOfTypeInfo.amount).div(Config.trxPrecision) });
    }

    const totalFrozenOfTypeInfo = await this.rootStore.system.totalFrozenOfType();
    if (totalFrozenOfTypeInfo.success) {
      this.setData({ totalFrozenOfType: BigNumber(totalFrozenOfTypeInfo.amount).div(Config.trxPrecision) });
    }

    await this.rentalRate(
      this.stakeAmount,
      BigNumber(totalFrozenOfTypeInfo.amount).toString(),
      BigNumber(totalDelegatedOfTypeInfo.amount).toString()
    );

    const maxRentableOfTypeInfo = await this.rootStore.system.maxRentableOfType();
    if (maxRentableOfTypeInfo.success) {
      let maxRentableOfType = BigNumber(maxRentableOfTypeInfo.amount).div(Config.trxPrecision);
      this.setData({ maxRentableOfType });
    }
  };

  rentalRate = async (
    amount = this.stakeAmount,
    totalFrozenOfType = BigNumber(this.totalFrozenOfType).times(Config.trxPrecision).toString(),
    totalDelegatedOfType = BigNumber(this.totalDelegatedOfType).times(Config.trxPrecision).toString()
  ) => {
    if (amount === '--') {
      amount = BigNumber(
        BigNumber(this.rentBalance).gt(0)
          ? Config.energyRental.renewOrderDefaultEnergyValue
          : Config.energyRental.newOrderDefaultEnergyValue
      )
        .div(this.marketData.energyStakePerTrx)
        ._toFixed(0, 0);
    }

    const basicRateInfo = await this.rootStore.system.rentalRate(totalFrozenOfType, totalDelegatedOfType);
    if (basicRateInfo.success) {
      let basicRate = BigNumber(basicRateInfo.amount).div(Config.tokenDefaultPrecision);
      this.setData({ basicRate });
    }

    const rateInfo = await this.rootStore.system.rentalRate(
      totalFrozenOfType,
      BigNumber(totalDelegatedOfType).plus(BigNumber(amount).times(Config.trxPrecision)).toString()
    );
    if (rateInfo.success) {
      let rate = BigNumber(rateInfo.amount).div(Config.tokenDefaultPrecision);
      this.setData({ rate });
    }
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

  getMultiReward = async () => {
    try {
      const res = await getAllowanceMultiReward(this.rootStore.network.defaultAccount);
      if (res.success) {
        const multiRewardData = res.data;
        this.collapseInit(multiRewardData);
        this.filterReward(Object.keys(multiRewardData), multiRewardData);
      }
      return null;
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

  filterReward = (dataArr, multiRewardData = this.multiRewardData) => {
    let totalReward = 0;
    let choosedTotalReward = 0;
    let defaultValue = [];

    dataArr = !dataArr ? Object.keys(multiRewardData).reverse() : dataArr.reverse();

    if (dataArr?.length > 0) {
      dataArr.map((item, index) => {
        if (dataArr.length > Config.rewardNum) {
          if (index < Config.rewardNum) {
            defaultValue.push(item);
            choosedTotalReward = BigNumber(choosedTotalReward).plus(
              BigNumber(multiRewardData[item]?.amount || 0).div(Config.tokenDefaultPrecision)
            );
          }
        } else {
          defaultValue.push(item);
          choosedTotalReward = BigNumber(choosedTotalReward).plus(
            BigNumber(multiRewardData[item]?.amount || 0).div(Config.tokenDefaultPrecision)
          );
        }
      });
    }

    let totalDataArr = Object.keys(multiRewardData);
    if (totalDataArr?.length > 0) {
      totalDataArr.map(item => {
        totalReward = BigNumber(totalReward).plus(
          BigNumber(multiRewardData[item]?.amount || 0).div(Config.tokenDefaultPrecision)
        );
      });
    }

    this.setData({ multiRewardData, defaultValue, choosedTotalReward, totalReward });
  };

  getReturnRentInfo = async (rentType = 1) => {
    const { defaultAccount } = this.rootStore.network;

    try {
      const res = await getReturnRentInfo(defaultAccount, defaultAccount, rentType);
      if (res.success) {
        this.returnRentInfo = {
          ...res.data
        };
      }
      return null;
    } catch (err) {
      console.log('getReturnRentInfo', err);
    }
  };
}
