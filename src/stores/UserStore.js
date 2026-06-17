import { observable, action, makeObservable } from 'mobx';
import intl from 'react-intl-universal';
import BigNumber from 'bignumber.js';
import Config from '../config';
import {
  getDepositApy,
  getLendApy,
  getPrecision,
  getExchangeRate,
  getDeposit,
  getEarned,
  getDepositUsd,
  getBorrowBalanceNew,
  getBorrowBalanceNewUsd,
  getInterest,
  getBorrowLimit,
  getBorrowPercent,
  getTotalLendUsd,
  getInterestOrEarnedUsd,
  getGainNewAndOld,
  getGainNewAndOldForMarkets,
  getTransferringSoonAndInFreeze,
  getTransferringSoonAndInFreezeAllMarkets,
  getNetAPY,
  getTotalLendUsdForUSDD,
  getUserGain,
  getBorrowableUsd,
  getSuppliedOverview,
  getTotalBorrowingUsd
} from '../utils/helper';
import { getMarketData, getUserData, getTronbullish, getMultiReward } from '../utils/backend';

export default class UserStore {
  @observable isShowRecommendToken = '';
  @observable isShowUSDDUpdateAd = '';
  @observable risk = '--';
  @observable userList = {};
  @observable totalBorrowValueInTrx = '';
  @observable totalCollateralValueInTrx = '';
  @observable userDataSource = null;
  @observable userDepositDataSource = null;
  @observable userLendDataSource = null;
  @observable totalCollateral = [];
  @observable netAPY = '';
  @observable borrowLimit = '--';
  @observable totalBorrowUsd = '--';
  @observable totalSupplyUsd = '--';
  @observable mortgageRate = '--';
  @observable totalBorrowingRate = '--';
  @observable totalRestBorrowableUsd = '--';
  @observable totalBorrowUsdForUSDD = '--';
  @observable usertronbullishData = null;
  @observable userCurrencyData = {};
  @observable inFreeze = '--';
  @observable transferringSoonNum = '--';
  @observable transferringSoon = '--';
  @observable inFreezeNum = '--';
  @observable allMiningInfo = {};
  @observable otherGainLastAll = '--';
  @observable otherGainNewAll = '--';
  @observable USDDGainLastAll = '--';
  @observable USDDGainNewAll = '--';
  @observable otherMiningStatus = '--';
  @observable otherLastEndTime = '--';
  @observable otherCurrEndTime = '--';
  @observable USDDMiningStatus = '--';
  @observable USDDLastEndTime = '--';
  @observable USDDCurrEndTime = '--';
  @observable currPhase = '--';
  @observable isUserSunOldEmpty = true;
  @observable depositAndMortgageLength = '--';
  @observable justMortgageData = null;
  @observable userDepositAndJustMortgateDataSource = null;
  @observable userBorrowingAndRestBorrowableDataSource = null;
  @observable globalSettlementStatus = false;
  @observable globalSettlementStatusForLastRound = false;
  @observable totalBorrowableUsd = null;
  @observable totalBorrowingUsd = null;
  @observable multiRewardData = [];
  @observable totalReward = '--';
  @observable totalRewardUSDDOLD = '--';
  @observable totalRewardUSDDNEW = '--';
  @observable choosedTotalReward = '--';
  @observable defaultValue = [];
  @observable choosedRewardInfo = {}; 
  @observable transferringSoonBreakdown = {}; 
  rootStore = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  @action
  setTotalBorrowingUsd(data) {
    this.totalBorrowingUsd = data;
  }

  @action
  setTotalBorrowableUsd(data) {
    this.totalBorrowableUsd = data;
  }

  @action
  setDepositAndMortgageLength(length) {
    this.depositAndMortgageLength = length;
  }
  @action
  setUserDepositAndJustMortgateDataSource(data) {
    this.userDepositAndJustMortgateDataSource = data;
  }

  @action
  setUserBorrowingAndRestBorrowableDataSource(data) {
    this.userBorrowingAndRestBorrowableDataSource = data;
  }

  @action
  setJustMortgageData(data) {
    this.justMortgageData = data;
  }

  @action
  setMortgageRate(data) {
    this.mortgageRate = data;
  }

  @action
  setTotalBorrowingRate(data) {
    this.totalBorrowingRate = data;
  }

  @action
  setTotalRestBorrowableUsd(data) {
    this.totalRestBorrowableUsd = data;
  }

  @action
  setIsUserSunOldEmpty(data) {
    this.isUserSunOldEmpty = data;
  }

  @action
  setNetAPY(apy) {
    this.netAPY = apy;
  }

  @action
  setTotalSupplyUsd(data) {
    this.totalSupplyUsd = data;
  }

  @action
  setTotalBorrowUsd(data) {
    this.totalBorrowUsd = data;
  }
  @action
  setBorrowLimit(data) {
    this.borrowLimit = data;
  }

  @action
  setUserDepositDataSource(data) {
    this.userDepositDataSource = data;
  }

  @action
  setTotalBorrowUsdForUSDD(data) {
    this.totalBorrowUsdForUSDD = data;
  }
  @action
  setUserLendDataSource(data) {
    this.userLendDataSource = data;
  }

  @action
  setRecommendToken(data) {
    this.isShowRecommendToken = data;
  }

  @action
  setUSDDUpdateAd(data) {
    this.isShowUSDDUpdateAd = data;
  }

  @action
  setUserDataSource(data) {
    this.userDataSource = data;
  }

  @action
  setUserList(data) {
    this.userList = data;
  }
  @action
  setTransferringSoon(data) {
    this.transferringSoon = data;
  }

  @action
  setMultiRewardData(data) {
    this.multiRewardData = data;
  }

  @action
  setDefaultValue(data) {
    this.defaultValue = data;
  }

  @action
  setChoosedTotalReward(data) {
    this.choosedTotalReward = data;
  }

  @action
  setTotalReward(data) {
    this.totalReward = data;
  }

  @action
  setTotalRewardUSDDNEW(data) {
    this.totalRewardUSDDNEW = data;
  }

  @action
  setTotalRewardUSDDOLD(data) {
    this.totalRewardUSDDOLD = data;
  }

  @action
  setData(name, value) {
    this[name] = value;
  }

  getRecomendToken = () => {
    const addr = this.rootStore.network.defaultAccount;
    if (!addr) {
      this.setRecommendToken('');
      this.setUSDDUpdateAd('');
    } else {
      this.setRecommendToken(window.localStorage.getItem('isShowRecommendToken_' + addr));
      this.setUSDDUpdateAd(window.localStorage.getItem('isShowUSDDUpdateAd_' + addr));
    }
  };

  getUserData = async () => {
    const { network, market, lend } = this.rootStore;
    try {
      if (!network.isConnected) return;
      let res = null;
      res = await getUserData({ addr: network.defaultAccount, ver: 'v2' });
      await lend.getCurrentBlock();

      if (res === null || !res.success) return;

      market.setTrxPrice(res.data.trxPrice);

      let riskVal = res.data.risk;
      if (BigNumber(riskVal).lt(0)) riskVal = 0;
      if (BigNumber(riskVal).gt(1)) riskVal = 1;
      this.setData('risk', BigNumber(riskVal));
      this.setData('totalBorrowValueInTrx', BigNumber(res.data.total_borrow_value_in_trx));
      this.setData('totalCollateralValueInTrx', BigNumber(res.data.total_collateral_value_in_trx));

      const addr = network.defaultAccount;
      let UserTronbullish = null;

      const params = Config.yieldersAddsun.map(item => {
        return item.pool;
      });

      const pool = params.join(',');
      UserTronbullish = await getTronbullish(pool, addr);
      if (UserTronbullish === null || !UserTronbullish.success) return;
      this.setData('usertronbullishData', UserTronbullish.data);
      this.setUserData(res.data.assetList || []); 
      let currencyData = Config.currency;
      currencyData.map((item, index) => {
        const {
          gainLastAll,
          gainNewAll,
          price,
          otherGainLastAll,
          otherGainNewAll,
          otherMiningStatus,
          otherLastEndTime,
          otherCurrEndTime,
          USDDGainLastAll,
          USDDGainNewAll,
          USDDMiningStatus,
          USDDLastEndTime,
          USDDCurrEndTime,
          currPhase
        } = getGainNewAndOld(market.assetList, this.usertronbullishData, item.symbol); // depositData -> market.assetList
        item.gainLast = gainLastAll;
        item.gainNew = gainNewAll;
        item.otherGainLastAll = otherGainLastAll;
        item.otherGainNewAll = otherGainNewAll;
        item.USDDGainLastAll = USDDGainLastAll;
        item.USDDGainNewAll = USDDGainNewAll;
        item.otherMiningStatus = otherMiningStatus;
        item.otherCurrEndTime = otherCurrEndTime;
        item.otherLastEndTime = otherLastEndTime;
        item.USDDMiningStatus = USDDMiningStatus;
        item.USDDLastEndTime = USDDLastEndTime;
        item.USDDCurrEndTime = USDDCurrEndTime;
        item.currPhase = currPhase;
        item.price = price;
        item.totalGain = BigNumber(gainLastAll).plus(gainNewAll).times(price);

        currencyData[index] = { ...item };
        currencyData[index].key = index;
      });
      currencyData = currencyData.filter(item => {
        return BigNumber(item.gainLast).plus(item.gainNew).plus(item.otherGainLastAll).plus(item.USDDGainLastAll).gt(0);
      });
      currencyData.slice().sort((a, b) => {
        if (BigNumber(b.totalGain).minus(a.totalGain).gt(0)) {
          return 1;
        }
        if (BigNumber(b.totalGain).minus(a.totalGain).lt(0)) {
          return -1;
        }
        return 0;
      });
      this.setData('userCurrencyData', currencyData);

      const {
        transferringSoon,
        inFreeze,
        otherGainLastAll,
        otherGainNewAll,
        USDDGainLastAll,
        USDDGainNewAll,
        otherMiningStatus,
        otherLastEndTime,
        otherCurrEndTime,
        USDDLastEndTime,
        USDDCurrEndTime
      } = getTransferringSoonAndInFreeze(currencyData);
      this.setTransferringSoon(transferringSoon);
      this.setData('inFreeze', inFreeze);
      this.setData('otherGainLastAll', otherGainLastAll);
      this.setData('otherGainNewAll', otherGainNewAll);
      this.setData('USDDGainLastAll', USDDGainLastAll);
      this.setData('USDDGainNewAll', USDDGainNewAll);
      this.setData('otherMiningStatus', otherMiningStatus);
      this.setData('otherLastEndTime', otherLastEndTime);
      this.setData('otherCurrEndTime', otherCurrEndTime);
      this.setData('USDDLastEndTime', USDDLastEndTime);
      this.setData('USDDCurrEndTime', USDDCurrEndTime);

      this.setData(
        'USDDMiningStatus',
        UserTronbullish?.data &&
          UserTronbullish.data[Config.usddJtoken] &&
          UserTronbullish.data[Config.usddJtoken]?.USDDNEW?.miningStatus
      );
      this.setData(
        'currPhase',
        UserTronbullish?.data &&
          UserTronbullish.data[Config.usddJtoken] &&
          UserTronbullish.data[Config.usddJtoken]?.USDDNEW?.currPhase
      );
    } catch (err) {
      console.log('getUserData', err);
    }
  };

  getUserDataFromMarkets = async () => {
    const { network, market, lend } = this.rootStore;

    try {
      if (!network.isConnected) return;
      let res = null;
      res = await getUserData({ addr: network.defaultAccount, ver: 'v2' });
      await lend.getCurrentBlock();

      if (res === null || !res.success) return;
      market.setTrxPrice(BigNumber(res.data.trxPrice));
      let riskVal = res.data.risk;
      if (BigNumber(riskVal).lt(0)) riskVal = 0;
      if (BigNumber(riskVal).gt(1)) riskVal = 1;
      this.setData('risk', BigNumber(riskVal));
      this.setData('totalBorrowValueInTrx', BigNumber(res.data.total_borrow_value_in_trx));
      this.setData('totalCollateralValueInTrx', BigNumber(res.data.total_collateral_value_in_trx));

      const addr = network.defaultAccount;
      let UserTronbullish = null;
      const params = Config.yieldersAddsun.map(item => {
        return item.pool;
      });

      const pool = params.join(',');
      UserTronbullish = await getTronbullish(pool, addr);
      if (UserTronbullish === null || !UserTronbullish.success) return;
      this.setData('usertronbullishData', UserTronbullish.data);
      this.setUserData(res.data.assetList || []); 

      let currencyData = Config.currency;
      currencyData.map((item, index) => {
        const { gainLastAll, gainNewAll, price, tokenInfo } = getGainNewAndOldForMarkets(
          market.assetList,
          this.usertronbullishData,
          item.symbol
        ); // depositData -> market.assetList

        item.gainLast = gainLastAll;
        item.gainNew = gainNewAll;
        item.price = price;
        item.tokenInfo = tokenInfo;
        item.totalGain = BigNumber(gainLastAll).plus(gainNewAll).times(price);

        currencyData[index] = { ...item };
        currencyData[index].key = index;
      });

      currencyData = currencyData.filter(item => {
        const tokenInfo = Object.values(item.tokenInfo);
        const tokenGainLastAllList = tokenInfo.filter(item => item.tokenGainLastAll.gt(0));
        return BigNumber(item.gainLast).plus(item.gainNew).gt(0) || tokenGainLastAllList?.length > 0;
      });

      currencyData.slice().sort((a, b) => {
        if (BigNumber(b.totalGain).minus(a.totalGain).gt(0)) {
          return 1;
        }
        if (BigNumber(b.totalGain).minus(a.totalGain).lt(0)) {
          return -1;
        }
        return 0;
      });
      this.setData('userCurrencyData', currencyData);
      const {
        transferringSoon,
        inFreeze,
        transferringSoonNum,
        inFreezeNum,
        allMiningInfo,
        globalSettlementStatus,
        globalSettlementStatusForLastRound,
        transferringSoonBreakdown,
        inFreezeBreakdown
      } = getTransferringSoonAndInFreezeAllMarkets(currencyData);
      this.setTransferringSoon(transferringSoon);
      this.setData('inFreeze', inFreeze);
      this.setData('transferringSoonNum', transferringSoonNum);
      this.setData('inFreezeNum', inFreezeNum);
      this.setData('allMiningInfo', allMiningInfo);
      this.setData('globalSettlementStatus', globalSettlementStatus);
      this.setData('globalSettlementStatusForLastRound', globalSettlementStatusForLastRound);
      this.setData('transferringSoonBreakdown', transferringSoonBreakdown);
      this.setData('inFreezeBreakdown', inFreezeBreakdown);
    } catch (err) {
      console.log('getUserData', err);
    }
  };

  setUserData = async (data = []) => {
    try {
      const { market } = this.rootStore;
      this.setData('totalCollateral', []);
      data.map(item => {
        if (item.account_entered === 1) {
          this.totalCollateral.push(item.collateralSymbol);
        }
      });

      let obj = {};
      // const addr = this.rootStore.network.defaultAccount;
      // let UserTronbullish = null;
      // const params = Config.yieldersAddsun.map(item => {
      //   return item.pool;
      // });

      // const pool = params.join(',');
      // UserTronbullish = await getTronbullish(pool, addr);
      // if (UserTronbullish === null || !UserTronbullish.success) return;
      // this.setData('usertronbullishData', UserTronbullish.data);
      // console.log(UserTronbullish.data);

      const trxInfo = data.find(item => item.jtokenAddress === Config.jtrxAddress);
      let trxAssetPrice = '';
      if (trxInfo) trxAssetPrice = trxInfo?.assetPrice;
      if (!trxAssetPrice) {
        const res = await getMarketData();
        if (!res.success) {
          return;
        }
        const { assetPrice } = res.data;
        trxAssetPrice = assetPrice[Config.defaultAddress];
      }
      let borrowLimit = getBorrowLimit(market.trxPrice, data, trxAssetPrice);
      this.setBorrowLimit(borrowLimit);

      data.map((item, index) => {
        const { account_entered, jtokenAddress, collateralFactor } = item;
        item.key = jtokenAddress;
        // item.account_entered = BigNumber(collateralFactor).eq(0) ? 2 : Number(account_entered);
        item.account_entered = Number(account_entered);
        item.collateralFactor = Number(collateralFactor);
        item.depositAndMortgage =
          BigNumber(item.account_depositJtoken).gt(0) && BigNumber(item.account_entered).eq(1) ? true : false;
        item.justMortgage =
          !BigNumber(item.account_depositJtoken).gt(0) && BigNumber(item.account_entered).eq(1) ? true : false;
        item.precision = getPrecision(item.collateralDecimal);
        item.depositApy = getDepositApy(item);
        item.exchangeRate = getExchangeRate(item);
        item.earned = getEarned(item);
        item.deposited = getDeposit(item);
        item.deposited_usd = getDepositUsd(item, market.trxPrice, trxAssetPrice);
        item.borrowableUsd = getBorrowableUsd(item);
        item.lendApy = getLendApy(item); // done borrow apy
        item.borrowBalanceNew = getBorrowBalanceNew(item);
        item.borrowBalanceNewUsd = getBorrowBalanceNewUsd(item, market.trxPrice, trxAssetPrice);
        item.interest = getInterest(item);
        item.interestUsd = getInterestOrEarnedUsd(item, market.trxPrice, false, trxAssetPrice);
        item.earnedUsd = getInterestOrEarnedUsd(item, market.trxPrice, true, trxAssetPrice);
        const { rewardUSD, rewardToken } = getUserGain(jtokenAddress, this.usertronbullishData);
        item.rewardUSD = rewardUSD;
        item.rewardToken = rewardToken;
        item.per = getBorrowPercent(item, market.trxPrice, borrowLimit);
        obj[item.jtokenAddress] = { ...item };
      });

      let userDataSource = [...data];
      this.setUserDataSource(userDataSource);
      this.setUserList(obj);
      let lendData = data.filter(item => BigNumber(item.account_borrowBalance).gt(0));
      let depositData = data.filter(item => BigNumber(item.account_depositJtoken).gt(0));
      let depositAndMortgageData = data.filter(item => item.depositAndMortgage === true);
      this.setDepositAndMortgageLength(depositAndMortgageData.length);
      let justMortgageData = data.filter(item => item.justMortgage === true);
      this.setJustMortgageData(justMortgageData);
      let netAPY = getNetAPY(depositData, lendData, market.assetList);
      this.setNetAPY(netAPY);
      let totalBorrowUsd = getTotalLendUsd(lendData);
      this.setTotalBorrowUsd(totalBorrowUsd);
      let totalBorrowUsdForUSDD = getTotalLendUsdForUSDD(lendData);
      this.setTotalBorrowUsdForUSDD(totalBorrowUsdForUSDD);
      let getSuppliedOverviewRes = getSuppliedOverview(depositData);
      this.setTotalSupplyUsd(getSuppliedOverviewRes.totalSupplyUsd);
      this.setMortgageRate(getSuppliedOverviewRes.mortgageRate);
      this.setTotalBorrowableUsd(getSuppliedOverviewRes.totalBorrowableUsd);
      let totalBorrowingUsd = getTotalBorrowingUsd(lendData);
      this.setTotalBorrowingUsd(totalBorrowingUsd);

      let totalBorrowingRate = BigNumber(totalBorrowingUsd).div(this.totalBorrowableUsd).times(100);
      this.setTotalBorrowingRate(totalBorrowingRate);
      let totalRestBorrowableUsd =
        this.depositAndMortgageLength > 0 ? BigNumber(this.totalBorrowableUsd).minus(totalBorrowingUsd) : '--';
      this.setTotalRestBorrowableUsd(totalRestBorrowableUsd);
      let userLendDataSource = [...lendData];
      this.setUserLendDataSource(userLendDataSource);
      if (totalRestBorrowableUsd === '--') {
        let userBorrowingAndRestBorrowableDataSource = [...lendData];
        this.setUserBorrowingAndRestBorrowableDataSource(userBorrowingAndRestBorrowableDataSource);
      } else {
        let userBorrowingAndRestBorrowableDataSource = [
          ...lendData,
          {
            collateralSymbol: intl.get('v2.borrow_balance'),
            borrowBalanceNewUsd: totalRestBorrowableUsd
          }
        ];
        this.setUserBorrowingAndRestBorrowableDataSource(userBorrowingAndRestBorrowableDataSource);
      }
      this.setUserDepositDataSource([...depositData]);
      let userDepositAndJustMortgateDataSource = [...depositData, ...this.justMortgageData];
      this.setUserDepositAndJustMortgateDataSource(userDepositAndJustMortgateDataSource);
      userDataSource.map(item => {
        if (
          item?.collateralSymbol?.toLowerCase() === 'sunold' &&
          (BigNumber(item.deposited_usd).gt(0) || BigNumber(item.borrowBalanceNewUsd).gt(0))
        ) {
          this.setIsUserSunOldEmpty(false);
        }
      });
    } catch (err) {
      console.log('addUserValue error:', err);
    }
  };

  @action
  filterReward = (dataArr, multiRewardData = this.multiRewardData) => {
    let totalReward = new BigNumber(0);
    let totalRewardUSDDOLD = new BigNumber(0);
    let totalRewardUSDDNEW = new BigNumber(0);
    let choosedTotalReward = new BigNumber(0);
    let choosedRewardInfo = {};

    let defaultValue = [];
    let usddNewChecked = false;

    const toArray = val => {
      if (val === null || val === undefined) return [];
      return Array.isArray(val) ? val : [val];
    };

    const processItem = (key, isSelected) => {
      const itemData = multiRewardData[key];
      if (!itemData) return { totalVal: BigNumber(0), hasUsdd: false };

      const tokens = toArray(itemData.tokenAddress);
      const amounts = toArray(itemData.amount);
      const symbols = toArray(itemData.tokenSymbol);
      let prices = toArray(itemData.prices);

      let itemTotalVal = new BigNumber(0);
      let hasUsdd = false;

      tokens.forEach((tokenAddr, i) => {
        const amountStr = amounts[i] || 0;

        const priceVal = prices[i] !== undefined ? prices[i] : '1';
        const price = new BigNumber(priceVal);

        let symbol = symbols[i];
        if (!symbol) {
          if (tokenAddr === Config.usdd.token) {
            symbol = 'USDD';
          } else {
            symbol = 'USDDOLD';
          }
        }

        let precision = Config.tokenDefaultPrecision;
        if (symbol === 'TRX') {
          precision = Config.trxPrecision;
        }

        
        const amountBN = new BigNumber(amountStr).div(precision);
        const val = amountBN.times(price);

        itemTotalVal = itemTotalVal.plus(val);

        if (tokenAddr === Config.usdd.token) {
          hasUsdd = true;
          totalRewardUSDDNEW = totalRewardUSDDNEW.plus(val);
        } else if (symbol !== 'TRX') {
          if (symbol === 'USDDOLD') {
            totalRewardUSDDOLD = totalRewardUSDDOLD.plus(val);
          }
        }

        if (isSelected) {
          if (!choosedRewardInfo[symbol]) {
            choosedRewardInfo[symbol] = new BigNumber(0);
          }
          choosedRewardInfo[symbol] = choosedRewardInfo[symbol].plus(amountBN);
        }
      });

      return { totalVal: itemTotalVal, hasUsdd };
    };

    let processKeys = !dataArr ? Object.keys(multiRewardData).reverse() : dataArr.reverse();

    if (processKeys?.length > 0) {
      processKeys.map((item, index) => {
        const { hasUsdd } = processItem(item, false);
        if (index === 0 && hasUsdd) {
          usddNewChecked = true;
        }
        // const shouldSelect = usddNewChecked ? hasUsdd : !hasUsdd;

        // if (shouldSelect) {
        //   if (defaultValue.length < Config.rewardNum) {
        defaultValue.push(item);
        const res = processItem(item, true);
        choosedTotalReward = choosedTotalReward.plus(res.totalVal);
        //   }
        // }
      });
    }

    Object.keys(multiRewardData).forEach(item => {
      const { totalVal } = processItem(item, false);
      totalReward = totalReward.plus(totalVal);
    });

    this.setMultiRewardData(multiRewardData);
    this.setDefaultValue(defaultValue);
    this.setChoosedTotalReward(choosedTotalReward);
    this.setData('choosedRewardInfo', choosedRewardInfo);
    this.setTotalReward(totalReward);
    this.setTotalRewardUSDDNEW(totalRewardUSDDNEW);
    this.setTotalRewardUSDDOLD(totalRewardUSDDOLD);

    return usddNewChecked;
  };

  getMultiReward = async () => {
    try {
      const res = await getMultiReward(this.rootStore.network.defaultAccount);
      if (res.success) {
        const multiRewardData = res.data;
        this.rootStore.lend.collapseInit(multiRewardData);
        this.filterReward(Object.keys(multiRewardData), multiRewardData);
      }
      return null;
    } catch (err) {
      console.log('getMultiReward', err);
    }
  };
}
