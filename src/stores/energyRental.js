// Libraries
import BigNumber from 'bignumber.js';
import { debounce } from 'lodash';
import { observable, toJS } from 'mobx';
import Config from '../config';
import {
  getAllowanceMultiReward,
  getSTrxDashboard,
  getSTrxStakeAccount,
  getStrxRentAllOrderList,
  getReturnRentInfo
} from '../utils/backend';
import { tronObj } from '../utils/blockchain';
import { formatNumber, getTrxBalance } from '../utils/helper';

const tronWeb = tronObj.tronWeb;

const defaultIntervalSeconds = 60000;
const modalDataIntervalSeconds = 60000;

export default class EnergyRentalStore {
  @observable dashboardData = null;

  // Add order
  @observable newOrderEnergyAmount = '--';
  @observable newOrderTrxAmount = '--';
  @observable newOrderSafeValue = 0;
  @observable newOrderDuration = '--';
  @observable newOrderRate = '--';
  @observable newOrderPrepayment = '--';
  @observable newOrderSecurityDeposit = '--';
  @observable newOrderTrxSavedVsBurning = '--';
  @observable newOrderTrxSavedVsStaking = '--';

  // Add order (For confirm modal)
  @observable submittedNewOrderReceiver = '--';
  @observable submittedNewOrderEnergyAmount = '--';
  @observable submittedNewOrderTrxAmount = '--';
  @observable submittedNewOrderDuration = '--';
  @observable submittedNewOrderPrepayment = '--';

  // Renew order
  @observable renewOrderReceiver = '--';
  @observable renewOrderExistingEnergyAmount = '--';
  @observable renewOrderExistingTrxAmount = '--';
  @observable renewOrderSafeValue = 0;
  @observable renewOrderExistingSecurityDeposit = '--';
  @observable renewOrderExistingRemainingSeconds = '--';
  @observable renewOrderExistingRate = '--';
  @observable renewOrderEnergyAmount = '--';
  @observable renewOrderTrxAmount = '--';
  @observable renewOrderDuration = '--';
  @observable renewOrderRate = '--';
  @observable renewOrderPrepayment = '--';
  @observable renewOrderSecurityDeposit = '--';

  // Saved renew order info
  @observable renewOrderSavedInfoEnergyAmountSwitch = true;
  @observable renewOrderSavedInfoEnergyAmountInputValue = '';
  @observable renewOrderSavedInfoEnergyAmountValue = Config.energyRental.newOrderDefaultEnergyValue;
  @observable renewOrderSavedInfoDurationSwitch = true;
  @observable renewOrderSavedInfoDurationInputValue = '';
  @observable renewOrderSavedInfoDurationIsDayUnitBoolean = true;
  @observable renewOrderSavedInfoDurationValueInSeconds = 0;

  // Common
  @observable liquidateThreshold = '--';
  @observable feeRatio = '--';
  @observable minFee = '--';
  @observable totalDelegatedOfType = '--';
  @observable totalFrozenOfType = '--';
  @observable maxRentableOfType = '--';

  @observable returnResourceEnergy = '--';
  @observable energyFee = null;
  @observable returnResourceVisible = false;
  @observable rentPaused = false;
  @observable rentPausedVisible = false;

  @observable backendInterval = null;
  @observable modalDataInterval = null;
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
  @observable kink = 101;
  @observable engeryOfferModalVisible = false;
  @observable multiRewardData = [];
  @observable totalReward = '--';
  @observable choosedTotalReward = '--';
  @observable defaultValue = [];
  @observable collapse = true;
  @observable orderList = {};
  @observable orderListIsLoading = true;
  @observable orderListTotalCount = -1;
  @observable miniReceiverTotal = -1;
  @observable isGettingMiniOrderList = true;
  @observable miniOrderList = null;
  @observable miniReceiverOrdersList = null;
  @observable miniOrderListOrderBy = 0;
  @observable receiverOrdersList = {};
  @observable receiverTotal = -1;

  @observable addOrderModalVisible = false;
  @observable isAddOrderModalApprovingTrans = false;
  @observable addOrderModalIsRenew = false;
  @observable addOrderModalStep = 1;
  @observable endOrderModalVisible = false;
  @observable endOrderModalInfo = {
    canRentSeconds: '--',
    delegateTrxAmount: '--',
    energyAmount: '--',
    receiver: '--',
    renter: '--',
    startTimestamp: '--'
  };

  @observable returnRentInfo = {
    securityDeposit: '--',
    rentRemain: '--',
    unrecoveredEnergyAmount: '--',
    dailyRent: '--',
    rentAmount: '--'
  };

  @observable firstVisitModalVisible = false;

  @observable endRentalTipShow = false;
  @observable dealNoteShow = false;
  @observable dealNoteCheckValue = false;
  @observable endOrderType = '';

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
  }

  setVariablesInterval = async () => {
    if (!this.backendInterval) {
      this.backendInterval = setInterval(async () => {
        this.getMarketData();
        this.getCommonRentInfos();
        if (this.rootStore.network.isConnected) {
          this.getUserData();
          this.getUserTrxBalance();
          this.getMiniOrderList();
        }
      }, defaultIntervalSeconds);
    }
    if (!this.modalDataInterval) {
      this.modalDataInterval = setInterval(async () => {
        if (this.addOrderModalVisible) {
          if (this.addOrderModalIsRenew) {
            await this.getExistingRentalOrderInfo();
            await this.updateRenewOrderInfo();
          }
        }
        if (this.endOrderModalVisible) {
          this.getReturnRentInfo();
        }
      }, modalDataIntervalSeconds);
    }
  };

  clearVariablesInterval = () => {
    clearInterval(this.backendInterval);
    this.backendInterval = null;
    clearInterval(this.modalDataInterval);
    this.modalDataInterval = null;
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

  resetExistingOrderInfo = () => {
    this.setData({
      renewOrderReceiver: '--',
      renewOrderExistingEnergyAmount: '--',
      renewOrderExistingTrxAmount: '--',
      renewOrderExistingSecurityDeposit: '--',
      renewOrderExistingRate: '--'
    });
  };
  resetRenewOrderInfo = () => {
    this.setData({
      renewOrderEnergyAmount: '--',
      renewOrderTrxAmount: '--',
      renewOrderDuration: '--',
      renewOrderRate: '--',
      renewOrderPrepayment: '--',
      renewOrderSecurityDeposit: '--'
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
        const kink = res.data && res.data.kink ? BigNumber(res.data.kink).div(10000000000000000) : 101;

        this.setData({
          marketData: {
            ...res.data,
            trx1wEnergy,
            jst1wEnergy,
            jst2trx1wEnergy
          },
          energyHold: BigNumber(data.energyLimit).minus(data.energyUsed),
          kink
        });

        // this.updateNewOrderInfo();
      }
    } catch (err) {
      console.log('getUserData', err);
    }
  }, 300);

  getUserTrxBalance = async () => {
    this.trxBalance = await getTrxBalance(this.rootStore.network.defaultAccount);
  };

  getCommonRentInfos = async () => {
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

    const maxRentableOfTypeInfo = await this.rootStore.system.maxRentableOfType();
    if (maxRentableOfTypeInfo.success) {
      let maxRentableOfType = BigNumber(maxRentableOfTypeInfo.amount).div(Config.trxPrecision);
      this.setData({ maxRentableOfType });
    }

    // this.updateNewOrderInfo();

    if (this.addOrderModalVisible && this.addOrderModalIsRenew) {
      this.updateRenewOrderInfo();
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
              BigNumber(parseInt(multiRewardData[item]?.amount)).div(Config.tokenDefaultPrecision)
            );
          }
        } else {
          defaultValue.push(item);
          choosedTotalReward = BigNumber(choosedTotalReward).plus(
            BigNumber(parseInt(multiRewardData[item]?.amount)).div(Config.tokenDefaultPrecision)
          );
        }
      });
    }

    let totalDataArr = Object.keys(multiRewardData);
    if (totalDataArr?.length > 0) {
      totalDataArr.map(item => {
        totalReward = BigNumber(totalReward).plus(
          BigNumber(parseInt(multiRewardData[item]?.amount)).div(Config.tokenDefaultPrecision)
        );
      });
    }

    this.setData({ multiRewardData, defaultValue, choosedTotalReward, totalReward });
  };

  getReturnRentInfo = async (
    renter = this.endOrderModalInfo.renter,
    receiver = this.endOrderModalInfo.receiver,
    rentType = 1
  ) => {
    try {
      this.returnRentInfo = {
        dailyRent: '--',
        rentAmount: '--',
        rentRemain: '--',
        securityDeposit: '--',
        unrecoveredEnergyAmount: '--'
      };

      const res = await getReturnRentInfo(renter, receiver, rentType);
      if (res.success) {
        this.returnRentInfo = {
          ...res.data
          // unrecoveredEnergyAmount: BigNumber(res.data.unrecoveredEnergyAmount).plus(10000)
        };
      }
      return null;
    } catch (err) {
      console.log('getReturnRentInfo', err);
    }
  };

  getStrxRentAllOrderList = async ({
    rentType = 1,
    orderBy = 0,
    page = 0,
    pageSize = 10,
    isLoadMore = false,
    type = 'all'
  }) => {
    try {
      if (!this.rootStore.network.isConnected) {
        this.setData({
          orderList: { orders: [], total: 0 },
          orderListIsLoading: false
        });
        return;
      }
      this.setData({ orderListIsLoading: true });
      const { defaultAccount } = this.rootStore.network;
      const { orderList: oldOrderList, receiverOrdersList: oldReceiverOrdersList } = this;
      let params = { rentType, orderBy, page, pageSize };
      if (type === 'receiver') {
        params = { ...params, receiver: defaultAccount };
      } else if (type === 'renter') {
        params = { ...params, renter: defaultAccount };
      } else {
        params = { ...params, renter: defaultAccount, receiver: defaultAccount };
      }

      const { data } = await getStrxRentAllOrderList({
        ...params
      });
      if (type === 'renter') {
        const { orders, total } = data;
        this.setData({
          orderList: { orders: isLoadMore ? [...toJS(oldOrderList?.orders), ...orders] : orders, total },
          orderListIsLoading: false
        });
      } else if (type === 'receiver') {
        const { receiverOrders, receiverTotal } = data;
        this.setData({
          receiverOrdersList: {
            receiverOrders: isLoadMore
              ? [...toJS(oldReceiverOrdersList?.receiverOrders), ...receiverOrders]
              : receiverOrders,
            receiverTotal
          },
          orderListIsLoading: false
        });
      } else {
        const { orders, total, receiverOrders, receiverTotal } = data;
        this.setData({
          orderList: { orders: isLoadMore ? [...toJS(oldOrderList?.orders), ...orders] : orders, total },
          receiverOrdersList: {
            receiverOrders: isLoadMore
              ? [...toJS(oldReceiverOrdersList?.receiverOrders), ...receiverOrders]
              : receiverOrders,
            receiverTotal
          },
          orderListIsLoading: false
        });
      }

      return data;
    } catch (err) {
      console.log('getStrxRentAllOrderList', err);
    }
  };

  getMiniOrderList = async (orderBy = this.miniOrderListOrderBy) => {
    try {
      if (!this.rootStore.network.isConnected) {
      }
      const { defaultAccount } = this.rootStore.network;

      this.setData({
        miniOrderListOrderBy: orderBy
      });

      const response = await getStrxRentAllOrderList({
        renter: defaultAccount,
        receiver: defaultAccount,
        rentType: 1,
        orderBy,
        page: 0,
        pageSize: 5
      });

      // response.data.orders = response.data.orders.map(item => {
      //   return {
      //     ...item,
      //     canRentSeconds: 6 * 60
      //   };
      // });
      const datas = response.data;

      if (this.miniOrderListOrderBy === orderBy) {
        this.setData({
          miniOrderList: datas.orders,
          orderListTotalCount: datas.total,
          isGettingMiniOrderList: false,
          miniReceiverOrdersList: datas.receiverOrders,
          miniReceiverTotal: datas.receiverTotal
        });
      }
    } catch (err) {
      this.setData({
        isGettingMiniOrderList: false
      });
      console.log('getMiniOrderList', err);
    }
  };

  getRenterReceiverRentBalance = async receiver => {
    const { defaultAccount } = this.rootStore.network;

    const rentalsInfo = await this.rootStore.system.getRentalsInfo(defaultAccount, 1, receiver);

    if (rentalsInfo.success) {
      return BigNumber(rentalsInfo.rentBalance).div(Config.trxPrecision);
    } else {
      return -1;
    }
  };

  getMarketRentalRate = async (amount = 0) => {
    return await this.rootStore.system.rentalRate(
      BigNumber(this.totalFrozenOfType).times(Config.trxPrecision).toString(),
      BigNumber(this.totalDelegatedOfType)
        .times(Config.trxPrecision)
        .plus(BigNumber(amount).times(Config.trxPrecision))
        .toString()
    );
  };

  rentalRate = async (
    amount = this.stakeAmount,
    totalFrozenOfType = BigNumber(this.totalFrozenOfType).times(Config.trxPrecision).toString(),
    totalDelegatedOfType = BigNumber(this.totalDelegatedOfType).times(Config.trxPrecision).toString()
  ) => {
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

  updateNewOrderInfo = async (
    energyAmount = this.newOrderEnergyAmount,
    durationValueInSeconds = this.newOrderDuration
  ) => {
    const { defaultAccount } = this.rootStore.network;

    const trxAmount = BigNumber(energyAmount).div(this.marketData.energyStakePerTrx)._toFixed(0, 0);
    const rateInfo = await this.getMarketRentalRate(trxAmount);

    if (rateInfo.success) {
      let rate = BigNumber(rateInfo.amount).div(Config.tokenDefaultPrecision);

      let fee = Math.max(this.minFee, BigNumber(trxAmount).times(this.feeRatio));

      let totalPrepayment = BigNumber(
        BigNumber(trxAmount)
          .times(rate)
          .times(BigNumber(durationValueInSeconds).plus(86400).plus(this.liquidateThreshold))
      ).plus(fee);

      let halfDayRent = BigNumber(trxAmount).times(rate).times(BigNumber(43200).plus(this.liquidateThreshold));
      let securityDeposit = BigNumber(halfDayRent).plus(fee).eq(0) ? 0 : BigNumber(halfDayRent).plus(fee);

      let trxSavedVsBurning = BigNumber(energyAmount)
        .div(this.marketData.energyBurnPerTrx)
        .minus(totalPrepayment)
        .plus(securityDeposit);
      let trxSavedVsStaking = BigNumber(energyAmount).div(this.marketData.energyStakePerTrx);

      this.setData({
        newOrderTrxAmount: trxAmount,
        newOrderPrepayment: totalPrepayment,
        newOrderSecurityDeposit: securityDeposit,
        newOrderTrxSavedVsBurning: trxSavedVsBurning,
        newOrderTrxSavedVsStaking: trxSavedVsStaking
      });

      // Calculate safe value
      console.log('trxAmount: ' + trxAmount);
      console.log('totalPrepayment: ' + totalPrepayment);

      const energyUsed = await this.rootStore.system.getRentFeeLimit(
        defaultAccount || 'TVNevinkBb9JytBHhK2ZMsnWX5sWqJu9fx',
        BigNumber(trxAmount).times(Config.trxPrecision)._toFixed(0, 1),
        1,
        BigNumber(totalPrepayment).times(Config.trxPrecision)._toFixed(0, 1)
      );
      const eFee = this.energyFee || (await this.getEnergyFee());
      const safeValue = BigNumber(BigNumber(energyUsed).times(eFee).div(1e6).times(0.1)._toFixed(0, 1))
        .plus(2)
        .toNumber();

      console.log('renewOrderSafeValue: ' + safeValue);
      this.setData({
        newOrderSafeValue: safeValue
      });
    }

    this.setData({
      newOrderEnergyAmount: energyAmount,
      newOrderDuration: durationValueInSeconds
    });
  };

  getExistingRentalOrderInfo = async (
    receiver = this.renewOrderReceiver,
    updateEnergyAmount,
    updateDurationValueInSeconds,
    updateEnabledAddEnergy
  ) => {
    if (this.renewOrderReceiver !== receiver) {
      this.resetExistingOrderInfo();
    }

    const { defaultAccount } = this.rootStore.network;

    this.setData({
      renewOrderReceiver: receiver
    });

    const rentInfo = await this.rootStore.system.getRentInfo(defaultAccount, 1, receiver);
    const rentalsInfo = await this.rootStore.system.getRentalsInfo(defaultAccount, 1, receiver);
    const rateInfo = await this.getMarketRentalRate(0);

    if (rentInfo.success && rentalsInfo.success && rateInfo.success && this.marketData) {
      if (this.renewOrderReceiver === receiver) {
        let rate = BigNumber(rateInfo.amount).div(Config.tokenDefaultPrecision);
        let securityDeposit = BigNumber(rentInfo.securityDeposit).div(Config.trxPrecision);
        let rentBalance = BigNumber(rentalsInfo.rentBalance).div(Config.trxPrecision);
        let energyAmount = BigNumber(rentBalance).times(this.marketData.energyStakePerTrx);

        let currentFee = Math.max(this.minFee, BigNumber(rentBalance).times(this.feeRatio));
        let currentRentMoney = BigNumber(rentBalance).times(rate).times(BigNumber(86400).plus(this.liquidateThreshold));
        let currentRentDaysLeft = BigNumber(BigNumber(securityDeposit).minus(currentFee).minus(currentRentMoney))
          .div(BigNumber(rentBalance).times(rate))
          .times(1000);
        let currentRentDaysLeftSecs = currentRentDaysLeft.gt(0) ? currentRentDaysLeft.div(1000) : 0;

        this.setData({
          renewOrderExistingEnergyAmount: energyAmount,
          renewOrderExistingTrxAmount: rentBalance,
          renewOrderExistingSecurityDeposit: securityDeposit,
          renewOrderExistingRemainingSeconds: currentRentDaysLeftSecs,
          renewOrderExistingRate: rate
        });

        if (
          this.addOrderModalVisible &&
          this.addOrderModalIsRenew &&
          this.addOrderModalStep == 2 &&
          !BigNumber(updateEnergyAmount).isNaN() &&
          !BigNumber(updateDurationValueInSeconds).isNaN()
        ) {
          this.updateRenewOrderInfo(updateEnergyAmount, updateDurationValueInSeconds, updateEnabledAddEnergy);
        }
      }
    }
  };

  updateRenewOrderInfo = async (
    energyAmount = this.renewOrderEnergyAmount,
    durationValueInSeconds = this.renewOrderDuration,
    enabledAddEnergy = true
  ) => {
    enabledAddEnergy = enabledAddEnergy && !BigNumber(this.renewOrderExistingRemainingSeconds).eq(0);

    if (BigNumber(energyAmount).isNaN() || !enabledAddEnergy) {
      energyAmount = 0;
    }
    if (BigNumber(durationValueInSeconds).isNaN()) {
      durationValueInSeconds = 0;
    }

    const trxAmount = enabledAddEnergy
      ? BigNumber(energyAmount).div(this.marketData.energyStakePerTrx)._toFixed(0, 0)
      : BigNumber(0);
    const totalTrxAmount = BigNumber(trxAmount).plus(this.renewOrderExistingTrxAmount);

    const rateInfo = await this.getMarketRentalRate(trxAmount);

    if (rateInfo.success) {
      let rate = BigNumber(rateInfo.amount).div(Config.tokenDefaultPrecision);

      let fee = Math.max(this.minFee, BigNumber(totalTrxAmount).times(this.feeRatio));

      let totalPrepayment = BigNumber(
        BigNumber(totalTrxAmount)
          .times(rate)
          .times(
            BigNumber(this.renewOrderExistingRemainingSeconds)
              .plus(durationValueInSeconds)
              .plus(86400)
              .plus(this.liquidateThreshold)
          )
      )
        .plus(fee)
        .minus(this.renewOrderExistingSecurityDeposit);

      let halfDayRent = BigNumber(totalTrxAmount).times(rate).times(BigNumber(43200).plus(this.liquidateThreshold));
      let securityDeposit = BigNumber(halfDayRent).plus(fee).minus(this.renewOrderExistingSecurityDeposit).lte(0)
        ? 0
        : BigNumber(halfDayRent).plus(fee).minus(this.renewOrderExistingSecurityDeposit);

      this.setData({
        renewOrderTrxAmount: trxAmount,
        renewOrderPrepayment: totalPrepayment,
        renewOrderSecurityDeposit: securityDeposit
      });

      // Calculate safe value
      const { defaultAccount } = this.rootStore.network;
      const energyUsed = await this.rootStore.system.getRentFeeLimit(
        defaultAccount || 'TVNevinkBb9JytBHhK2ZMsnWX5sWqJu9fx',
        BigNumber(trxAmount).times(Config.trxPrecision)._toFixed(0, 1),
        1,
        BigNumber(totalPrepayment).times(Config.trxPrecision)._toFixed(0, 1)
      );
      const eFee = this.energyFee || (await this.getEnergyFee());
      const safeValue = BigNumber(BigNumber(energyUsed).times(eFee).div(1e6).times(0.1)._toFixed(0, 1))
        .plus(2)
        .toNumber();

      this.setData({
        renewOrderSafeValue: safeValue
      });
    }

    this.setData({
      renewOrderEnergyAmount: energyAmount,
      renewOrderDuration: durationValueInSeconds
    });
  };

  isNeedShowDealTip = () => {
    let dealNoteTimeString = window.localStorage.getItem('dealNoteTimeString');

    if (dealNoteTimeString) {
      let nowTimeString = new Date().getTime();
      let limitTimeString = 30 * 24 * 60 * 60 * 1000;

      if (nowTimeString - dealNoteTimeString > limitTimeString) {
        this.setData({ dealNoteCheckValue: true });
        return true;
      } else {
        this.setData({ dealNoteCheckValue: false });
        return false;
      }
    } else {
      this.setData({ dealNoteCheckValue: true });
      return true;
    }
  };
}
