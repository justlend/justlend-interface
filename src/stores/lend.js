// Libraries
import { observable, transaction } from 'mobx';
import intl from 'react-intl-universal';
import Config from '../config';
import BigNumber from 'bignumber.js';
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
  getParameterByName,
  getInterestOrEarnedUsd,
  reTry,
  getGainNewAndOld,
  getGainNewAndOldForMarkets,
  getTransferringSoonAndInFreeze,
  getTransferringSoonAndInFreezeAllMarkets,
  getNetAPY,
  getTotalLendUsdForUSDD,
  getUserGain,
  getBorrowableUsd,
  getSuppliedOverview,
  getTotalBorrowingUsd,
  getQueryObj,
  getTotalMintStatus
} from '../utils/helper';
import {
  tokenBalanceOf,
  getLatestBlockInfo,
  getBalanceInfo,
  getBalanceStUsdtInfo,
  tronObj,
  getAmountLimit,
  getMintPaused,
  getPaused
} from '../utils/blockchain';
import {
  getMarketData,
  getUserData,
  getVoteList,
  getUserDetail,
  getMintInfo,
  getTronbullish,
  getTronBull,
  getTimeNow,
  getMarketDashboardData,
  getMultiReward,
  getRiojCheck,
  getLiquidateInfo,
  getBetaInfo,
  updateBetaInfo,
  getApplicationInfo
} from '../utils/backend';
import { getKeyThenIncreaseKey } from 'antd/lib/message';

const { voteDetailFilePath, chain, jtrxAddress } = Config;

const tronWeb = tronObj.tronWeb;

const defaultIntervalSeconds = 60000;
export default class PoolStore {
  @observable openMint = true;
  // for home nav start...
  @observable pagination = {
    pageNo: 1,
    orderBy: 'liquidity',
    desc: true,
    pageSize: 10
  };
  // @observable userData = {
  //   totalCount: 0,
  //   list: [],
  //   data: {}
  // };
  @observable userDataSource = null;
  @observable userDepositDataSource = null;
  @observable userLendDataSource = null;
  @observable totalCollateral = [];
  @observable totalCollateralShow = false;
  @observable userList = {};
  @observable marketDataSource = [];
  @observable marketDataDefaultSource = [];
  @observable marketList = {};
  @observable priceList = {};
  @observable trxPrice = '';
  @observable netAPY = '';
  @observable risk = '--';
  @observable totalBorrowValueInTrx = '';
  @observable totalCollateralValueInTrx = '';

  @observable DAWPop = {
    show: false,
    activeKey: '2',
    popData: {}
  };

  @observable borrowLimit = '--';
  @observable totalBorrowUsd = '--';
  @observable totalSupplyUsd = '--';
  @observable mortgageRate = '--';
  @observable totalBorrowingRate = '--';
  @observable totalRestBorrowableUsd = '--';
  @observable mortgageModalInfo = {
    visible: false,
    type: 1, // 1 open, 2 close
    jtokenAddress: ''
  };
  @observable borrowModalInfo = {
    visible: false,
    type: 1, // 1 borrow, 2 repay
    jtokenAddress: ''
  };
  @observable latestBlockInfo = null;

  @observable nowBlock = 0;

  @observable interval = null;
  @observable backendInterval = null;

  @observable balanceInfo = {};
  @observable voteSourceList = [];
  @observable voteSourceData = null;
  @observable voteInfo = null;
  @observable oldVoteInfo = null;
  @observable voteForPop = false;
  @observable voteForPopIsFor = true;
  @observable voteForPopProposalId = null;
  @observable redeemFromVotePop = false;
  @observable redeemFromVotePopProposalId = null;
  @observable exchangeVotePop = false;
  @observable authorizePop = false;
  @observable withdrawPop = false;
  @observable voteDetailData = null;
  @observable lockNum = BigNumber(0);
  @observable addVote = null;
  @observable votedList = null;

  @observable openedModalFromSun = false;
  @observable marketDataSuccess = false;
  @observable tokenDataSuccess = false;
  @observable assetList = {};
  @observable usertronbullishData = null;
  @observable userCurrencyData = {};
  @observable transferringSoon = '--';
  @observable inFreeze = '--';
  @observable transferringSoonNum = '--';
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
  @observable wstUSDTbalanceInfo = {};

  /**
   * @type {{ markets: }}
   */
  @observable dashboardData = null;

  @observable isUserSunOldEmpty = true;

  @observable userCanRedeemVoteList = [];
  @observable userVotingVote = [];
  @observable userCanRedeemVoteNum = null;
  @observable userVotingVoteNum = null;
  @observable voteDetailModalVisible = false;
  @observable voteOldWithdrawModalVisible = false;
  @observable depositAndMortgageLength = '--';
  @observable justMortgageData = null;
  @observable userDepositAndJustMortgateDataSource = null;
  @observable userBorrowingAndRestBorrowableDataSource = null;
  @observable energyFee = null;
  @observable isShowRecommendToken = '';
  @observable isShowUSDDUpdateAd = '';
  @observable theme = window.localStorage.getItem('theme') || 'black';
  @observable lang = 'en-US';
  @observable globalSettlementStatus = false;
  @observable globalSettlementStatusForLastRound = false;
  @observable openCollateralShow = false;
  @observable swapJstToVoteModalVisible = false;
  @observable multiRewardData = [];
  @observable totalReward = '--';
  @observable totalRewardUSDDOLD = '--';
  @observable totalRewardUSDDNEW = '--';
  @observable choosedTotalReward = '--';
  @observable defaultValue = [];
  @observable collapse = true;

  @observable interestRateGraphIndex = -1;
  @observable depositDetailGraphIndex = -1;
  @observable borrowDetailGraphIndex = -1;

  @observable minStakeAmount = '--';
  @observable mintPaused = 0;
  @observable paused = 0;
  @observable noServiceModalAllVisible = false;
  @observable hideEnergyPriceAdjustModal = true;
  @observable serviceInnerStatus = 'normal';
  @observable continueWhileDisabled = false;

  @observable noService = false; // IP check
  @observable riojBalance = false; // have balance
  @observable stUSDTModalShow = false;

  @observable liquidateShow = false;
  @observable liquidateInfo = {
    accounts: [],
    jtokens: {},
    updateTime: new Date().getTime()
  };
  @observable liquidateOriginalInfo = {
    accounts: [],
    jtokens: {},
    updateTime: new Date().getTime()
  };
  @observable minRiskValue = '';
  @observable maxRiskValue = '';
  @observable exceptionVisible = false;
  @observable balanceMap = {};
  @observable betaModalVisible = false;
  @observable hasLiquidateBetaAuthority = false;
  @observable hasEnergyBetaAuthority = false;
  @observable hasSettingsBetaAuthority = false;
  @observable showAccountBeta = false;
  @observable betaInfo = [];
  @observable showGif = false;
  @observable applocationTipShow = false;
  @observable applicationMap = {
    'rent': {},
    'liquidate': {}
  };
  @observable pre = '';
  @observable activeKey = '';

  @observable totalRCLength = null;

  // @observable disclaimerShow = false;
  // @observable isDisclaimerStoraged = true;

  constructor(rootStore) {
    this.rootStore = rootStore;
    this.lang = getQueryObj()?.lang || window.localStorage.getItem('lang') || 'en-US';

    //window.localStorage.setItem('lang', this.lang);
    window.addEventListener('storage', () => {
      const theme = window.localStorage.getItem('theme') || 'black';
      const lang = window.localStorage.getItem('lang') || 'en-US';
      this.theme = theme;
      this.lang = lang;
    });
  }

  getRecomendToken = () => {
    const addr = this.rootStore.network.defaultAccount;
    if (!addr) {
      this.setData({ isShowRecommendToken: '', isShowUSDDUpdateAd: '' });
    } else {
      this.setData({
        isShowRecommendToken: window.localStorage.getItem('isShowRecommendToken_' + addr),
        isShowUSDDUpdateAd: window.localStorage.getItem('isShowUSDDUpdateAd_' + addr)
      });
    }
  };
  setVariablesInterval = async () => {
    if (!this.interval) {
      await this.getLatestBlockInfo();
      this.interval = setInterval(async () => {
        await this.getMintPaused();
        await this.getPaused();
        await this.getLatestBlockInfo();
        await this.getMintInfo();
      }, defaultIntervalSeconds);
    }

    if (!this.backendInterval) {
      this.backendInterval = setInterval(async () => {
        await this.getMarketData();
        await this.getUserData();
        await this.getUserDataFromMarkets();
        await this.getDashboardData();
        if (this.rootStore.network.isConnected) {
          await this.getTokenBalanceInfo();
        }
      }, defaultIntervalSeconds);
    }
  };

  clearVariablesInterval = () => {
    clearInterval(this.interval);
    clearInterval(this.backendInterval);
    this.interval = null;
    this.backendInterval = null;
  };

  filterEth = async (data = []) => {
    try {
      const res = await getTimeNow();
      if (res.success) {
        const start = res.time;
        if (data && start < Config.ethStartTime) {
          data = data.filter(item => item.collateralSymbol != 'ETH');
        }
        return data;
      }
    } catch (error) {
      console.log('get time error', error);
    }
  };

  getTokenBalanceInfo = async () => {
    if (!this.rootStore.network.isConnected) return;
    const { marketDataSource } = this;
    const jtokens = [];
    const tokens = [];
    const prices = [];
    const tokenSymbols = [];
    marketDataSource.map(item => {
      tokens.push(item.collateralAddress);
      jtokens.push(item.jtokenAddress);
      prices.push(item.assetPrice);
      tokenSymbols.push(item.collateralSymbol);
    });
    const balanceInfo = await getBalanceInfo(
      window.defaultAccount,
      tokens,
      jtokens,
      this.balanceInfo,
      prices,
      tokenSymbols
    );
    this.balanceInfo = { ...balanceInfo };
    // console.log(balanceInfo, 303);
    this.tokenDataSuccess = true;
    this.openWithdrawModal();
  };

  setMartketData = async (data = []) => {
    try {
      let obj = {};
      data = await this.filterEth(data);
      data.map(item => {
        item.key = item.jtokenAddress;
        item.balance = '--';
        item.precision = getPrecision(item.collateralDecimal); // done
        item.assetPrice = this.priceList[item.collateralAddress];
        item.depositApy = getDepositApy(item); // BigNumber(item.supplyratePerblock).div(Config.tokenDefaultPrecision).times(Config.blockPerYear);
        item.lendApy = getLendApy(item); //BigNumber(item.borrowratePerblock).div(Config.tokenDefaultPrecision).times(Config.blockPerYear);
        obj[item.jtokenAddress] = item;
      });
      this.marketDataSource = [...data];
      this.marketDataDefaultSource = [...data];
      this.marketList = obj;
    } catch (err) {
      console.log('addJtokenValue:', err);
    }
  };

  getMarketData = async () => {
    try {
      const res = await getMarketData();
      if (!res.success) {
        return;
      }
      let marketData = res.data;
      this.priceList = marketData.assetPrice;
      this.trxPrice = marketData.trxPrice;
      this.setMartketData(marketData.jtokenList || []);

      this.marketDataSuccess = true;
      this.openWithdrawModal();
    } catch (err) {
      console.log('getMarketData', err);
    }
  };

  getMintInfo = async () => {
    try {
      const { userList, marketList } = this;
      const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
      const addr = this.rootStore.network.defaultAccount;
      const res = await getMintInfo(addr);
      if (!res.success) {
        return;
      }
      const { assetList } = res.data;
      if (!this.trxPrice) {
        await this.getMarketData();
      }
      const params = assetList.map(item => {
        const assetPrice = BigNumber(item.assetPrice);
        const totalOrigin = BigNumber(item.totalCash)
          .plus(BigNumber(item.totalBorrow))
          .minus(BigNumber(item.totalReserve));
        // const totalTrx = totalOrigin.times(assetPrice).div(Config.tokenDefaultPrecision).div(Config.defaultPrecision); // 6 + 18
        const totalTrx = totalOrigin
          .times(assetPrice)
          .div(Config.defaultPrecision)
          .div(
            BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
              ? Config.oraclePricePrecision
              : Config.tokenDefaultPrecision
          );
        const totalUSD = totalTrx.times(this.trxPrice).div(Config.tokenDefaultPrecision);
        return { pool: item.jtokenAddress, tvl: BigNumber(totalUSD)._toFixed(2) };
      });
      const tvl = params.map(item => item.tvl).join(',');
      const pool = params.map(item => item.pool).join(',');
      const resNew = await getTronBull(pool, tvl);
      const poolBullAll = resNew.data || {};

      let obj = {};
      assetList.map(item => {
        const jtokenAddress = item.jtokenAddress;
        const totalSun = BigNumber(item.account_sunGainNew).div(Config.tokenDefaultPrecision);
        const gotSun = BigNumber(item.account_sunGainOld).div(Config.tokenDefaultPrecision);
        const toBeGotSun = totalSun.minus(gotSun);
        let totalAPYNEW = BigNumber(0);
        let totalAPYNEWUSDD = BigNumber(0); // USDD APY

        const poolBull = poolBullAll[jtokenAddress] || {};
        // Object.keys(poolBull).map(key => {
        //   totalAPYNEW = totalAPYNEW.plus(poolBull[key]);
        // });
        // console.log('key',totalAPYNEW.toString());
        if (poolBull['JSTNEW']) {
          // jst lp mining apy
          totalAPYNEW = totalAPYNEW.plus(poolBull['JSTNEW']);
        }
        if (poolBull['USDDNEW']) {
          totalAPYNEWUSDD = totalAPYNEWUSDD.plus(poolBull['USDDNEW']);
        }

        obj[jtokenAddress] = {
          // apy: BigNumber(item.sunAPYInfo).times(100),
          // totalSun,
          // gotSun,
          // toBeGotSun,
          totalAPYNEW: totalAPYNEW.times(100),
          totalAPYNEWUSDD: totalAPYNEWUSDD.times(100)
        };
      });
      this.assetList = obj;
    } catch (err) {
      console.log('getMintInfo', err);
    }
  };

  getLatestBlockInfo = async () => {
    const res = await getLatestBlockInfo();
    if (!res.success) {
      if (this.latestBlockInfo !== null) {
        return;
      }
      if (!!window.localStorage.getItem('latestBlockInfo')) {
        this.latestBlockInfo = JSON.parse(window.localStorage.getItem('latestBlockInfo'));
        return;
      }
      return;
    }
    this.latestBlockInfo = {
      number: res.number,
      timestamp: res.timestamp
    };
    let currentTime = res?.timestamp;
    if (!currentTime) {
      const date = new Date();
      const timestamp = date.getTime() + date.getTimezoneOffset() * 60000 + 8 * 60 * 60000;
      currentTime = timestamp;
    }
    if (
      BigNumber(currentTime).gte(Config.usddV1MiningEndTime) &&
      BigNumber(currentTime).lt(Config.usddV2MiningStartTime)
    ) {
      this.openMint = false;
    } else {
      this.openMint = true;
    }
    window.localStorage.setItem(
      'latestBlockInfo',
      JSON.stringify({
        number: res.number,
        timestamp: res.timestamp
      })
    );
  };

  getCurrentBlock = async () => {
    try {
      if (this.latestBlockInfo === null) {
        await this.getLatestBlockInfo();
      }
      const { number = 0, timestamp = 0 } = this.latestBlockInfo || {};
      try {
        const res = await getTimeNow();
        if (res.success) {
          const nowTime = res.time;
          this.nowBlock = nowTime - timestamp <= 0 ? number : Math.floor((nowTime - timestamp) / 3000) + Number(number);
          window.nowBlock = this.nowBlock;
          return this.nowBlock;
        }
      } catch (err) {
        console.log('get time error', err);
      }
    } catch (err) {
      console.log('getCurrentBlock: ', err);
    }
  };

  getUserData = async () => {
    try {
      if (!this.rootStore.network.isConnected) return;
      let res = null;
      res = await getUserData({ addr: this.rootStore.network.defaultAccount, ver: 'v2' });
      await this.getCurrentBlock();

      if (res === null || !res.success) return;
      this.trxPrice = BigNumber(res.data.trxPrice);
      let riskVal = res.data.risk;
      if (BigNumber(riskVal).lt(0)) riskVal = 0;
      if (BigNumber(riskVal).gt(1)) riskVal = 1;
      this.risk = BigNumber(riskVal);
      // this.netWorth = BigNumber(res.data.netWorth).div(Config.tokenDefaultPrecision);
      this.netWorth = BigNumber(res.data.netWorth);
      this.totalBorrowValueInTrx = BigNumber(res.data.total_borrow_value_in_trx);
      this.totalCollateralValueInTrx = BigNumber(res.data.total_collateral_value_in_trx);
      // this.netAPY = res.data.netAPY;
      this.setUserData(res.data.assetList || []);

      const addr = this.rootStore.network.defaultAccount;
      // console.log('res.data.assetList',res.data.assetList);
      let UserTronbullish = null;
      const params = Config.yieldersAddsun.map(item => {
        return item.pool;
      });

      const pool = params.join(',');
      UserTronbullish = await getTronbullish(pool, addr);
      if (UserTronbullish === null || !UserTronbullish.success) return;
      this.usertronbullishData = UserTronbullish.data;
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
        } = getGainNewAndOld(this.assetList, this.usertronbullishData, item.symbol); // depositData -> this.assetList
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
      currencyData.sort((a, b) => {
        if (BigNumber(b.totalGain).minus(a.totalGain).gt(0)) {
          return 1;
        }
        if (BigNumber(b.totalGain).minus(a.totalGain).lt(0)) {
          return -1;
        }
        return 0;
      });
      this.userCurrencyData = [...currencyData];
      // console.log('594 currencyData: ', currencyData)
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
        USDDMiningStatus,
        USDDLastEndTime,
        USDDCurrEndTime,
        currPhase
      } = getTransferringSoonAndInFreeze(currencyData);
      this.transferringSoon = transferringSoon;
      this.inFreeze = inFreeze;
      this.otherGainLastAll = otherGainLastAll;
      this.otherGainNewAll = otherGainNewAll;
      this.USDDGainLastAll = USDDGainLastAll;
      this.USDDGainNewAll = USDDGainNewAll;
      this.otherMiningStatus = otherMiningStatus;
      this.otherLastEndTime = otherLastEndTime;
      this.otherCurrEndTime = otherCurrEndTime;
      // this.USDDMiningStatus = USDDMiningStatus;
      this.USDDLastEndTime = USDDLastEndTime;
      this.USDDCurrEndTime = USDDCurrEndTime;
      // this.currPhase = currPhase;

      this.USDDMiningStatus =
        UserTronbullish?.data &&
        UserTronbullish.data[Config.usddJtoken] &&
        UserTronbullish.data[Config.usddJtoken]?.USDDNEW?.miningStatus;
      this.currPhase =
        UserTronbullish?.data &&
        UserTronbullish.data[Config.usddJtoken] &&
        UserTronbullish.data[Config.usddJtoken]?.USDDNEW?.currPhase;
      // console.log('this.currPhase: ', this.currPhase);
    } catch (err) {
      console.log('getUserData', err);
    }
  };

  getUserDataFromMarkets = async () => {
    try {
      if (!this.rootStore.network.isConnected) return;
      let res = null;
      res = await getUserData({ addr: this.rootStore.network.defaultAccount, ver: 'v2' });
      await this.getCurrentBlock();

      if (res === null || !res.success) return;
      this.trxPrice = BigNumber(res.data.trxPrice);
      let riskVal = res.data.risk;
      if (BigNumber(riskVal).lt(0)) riskVal = 0;
      if (BigNumber(riskVal).gt(1)) riskVal = 1;
      this.risk = BigNumber(riskVal);
      // this.netWorth = BigNumber(res.data.netWorth).div(Config.tokenDefaultPrecision);
      this.netWorth = BigNumber(res.data.netWorth);
      this.totalBorrowValueInTrx = BigNumber(res.data.total_borrow_value_in_trx);
      this.totalCollateralValueInTrx = BigNumber(res.data.total_collateral_value_in_trx);
      // this.netAPY = res.data.netAPY;
      this.setUserData(res.data.assetList || []);

      const addr = this.rootStore.network.defaultAccount;
      // console.log('res.data.assetList',res.data.assetList);
      let UserTronbullish = null;
      const params = Config.yieldersAddsun.map(item => {
        return item.pool;
      });

      const pool = params.join(',');
      UserTronbullish = await getTronbullish(pool, addr);
      if (UserTronbullish === null || !UserTronbullish.success) return;
      this.usertronbullishData = UserTronbullish.data;

      // console.log('tronbull data: ', this.usertronbullishData);

      let currencyData = Config.currency;
      currencyData.map((item, index) => {
        const { gainLastAll, gainNewAll, price, tokenInfo } = getGainNewAndOldForMarkets(
          this.assetList,
          this.usertronbullishData,
          item.symbol
        ); // depositData -> this.assetList
        // console.log('668 lend price: ', price.toString())
        // console.log('669 lend token: ', item)
        item.gainLast = gainLastAll;
        item.gainNew = gainNewAll;
        item.price = price;
        item.tokenInfo = tokenInfo;
        item.totalGain = BigNumber(gainLastAll).plus(gainNewAll).times(price);

        currencyData[index] = { ...item };
        currencyData[index].key = index;
      });
      // console.log('679 currencyData: ', currencyData);
      currencyData = currencyData.filter(item => {
        const tokenInfo = Object.values(item.tokenInfo);
        const tokenGainLastAllList = tokenInfo.filter(item => item.tokenGainLastAll.gt(0));
        // return BigNumber(item.gainLast).plus(item.gainNew).gt(0);
        // return BigNumber(item.gainLast).plus(item.gainNew).gt(0) && tokenGainLastAllList?.length > 0;
        return BigNumber(item.gainLast).plus(item.gainNew).gt(0) || tokenGainLastAllList?.length > 0;
      });

      // console.log('688 currencyData: ', currencyData);

      currencyData.sort((a, b) => {
        if (BigNumber(b.totalGain).minus(a.totalGain).gt(0)) {
          return 1;
        }
        if (BigNumber(b.totalGain).minus(a.totalGain).lt(0)) {
          return -1;
        }
        return 0;
      });
      this.userCurrencyData = [...currencyData];
      // console.log('697 lend store currencyData: ', currencyData, currencyData[0].price.toString())
      const {
        transferringSoon,
        inFreeze,
        transferringSoonNum,
        inFreezeNum,
        allMiningInfo,
        globalSettlementStatus,
        globalSettlementStatusForLastRound
      } = getTransferringSoonAndInFreezeAllMarkets(currencyData);
      this.transferringSoon = transferringSoon;
      this.inFreeze = inFreeze;
      this.allMiningInfo = allMiningInfo;
      this.globalSettlementStatus = globalSettlementStatus;
      this.globalSettlementStatusForLastRound = globalSettlementStatusForLastRound;
      this.transferringSoonNum = transferringSoonNum;
      this.inFreezeNum = inFreezeNum;
    } catch (err) {
      console.log('getUserData', err);
    }
  };

  setUserData = async (data = []) => {
    try {
      this.totalCollateral = [];
      data.map(item => {
        if (item.account_entered === 1) {
          this.totalCollateral.push(item.collateralSymbol);
        }
      });

      let obj = {};
      // this.borrowLimit = getBorrowLimit(this.trxPrice, data);
      data = await this.filterEth(data);
      const addr = this.rootStore.network.defaultAccount;
      let UserTronbullish = null;
      const params = Config.yieldersAddsun.map(item => {
        return item.pool;
      });

      const pool = params.join(',');
      UserTronbullish = await getTronbullish(pool, addr);
      if (UserTronbullish === null || !UserTronbullish.success) return;
      this.usertronbullishData = UserTronbullish.data;

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
      this.borrowLimit = getBorrowLimit(this.trxPrice, data, trxAssetPrice);

      data.map((item, index) => {
        const { account_entered, jtokenAddress, collateralFactor } = item;
        item.key = jtokenAddress;
        item.account_entered = BigNumber(collateralFactor).eq(0) ? 2 : Number(account_entered);
        item.depositAndMortgage =
          BigNumber(item.account_depositJtoken).gt(0) && BigNumber(item.account_entered).eq(1) ? true : false;
        item.justMortgage =
          !BigNumber(item.account_depositJtoken).gt(0) && BigNumber(item.account_entered).eq(1) ? true : false;
        item.precision = getPrecision(item.collateralDecimal); // done
        item.depositApy = getDepositApy(item); // done
        item.exchangeRate = getExchangeRate(item); // done
        item.earned = getEarned(item); // done
        item.deposited = getDeposit(item); // done
        item.deposited_usd = getDepositUsd(item, this.trxPrice, trxAssetPrice); // done
        item.borrowableUsd = getBorrowableUsd(item);
        item.lendApy = getLendApy(item); // done borrow apy
        item.borrowBalanceNew = getBorrowBalanceNew(item);
        item.borrowBalanceNewUsd = getBorrowBalanceNewUsd(item, this.trxPrice, trxAssetPrice);
        item.interest = getInterest(item);
        item.interestUsd = getInterestOrEarnedUsd(item, this.trxPrice, false, trxAssetPrice);
        item.earnedUsd = getInterestOrEarnedUsd(item, this.trxPrice, true, trxAssetPrice);
        const { rewardUSD, rewardToken } = getUserGain(jtokenAddress, this.usertronbullishData);
        item.rewardUSD = rewardUSD;
        item.rewardToken = rewardToken;
        item.per = getBorrowPercent(item, this.trxPrice, this.borrowLimit);
        obj[item.jtokenAddress] = { ...item };
      });

      this.userDataSource = [...data];
      this.userList = obj;
      let lendData = data.filter(item => BigNumber(item.account_borrowBalance).gt(0));
      let depositData = data.filter(item => BigNumber(item.account_depositJtoken).gt(0));
      let depositAndMortgageData = data.filter(item => item.depositAndMortgage === true);
      this.depositAndMortgageLength = depositAndMortgageData.length;
      this.justMortgageData = data.filter(item => item.justMortgage === true);
      this.netAPY = getNetAPY(depositData, lendData, this.assetList);
      this.totalBorrowUsd = getTotalLendUsd(lendData);
      this.totalBorrowUsdForUSDD = getTotalLendUsdForUSDD(lendData);
      // let getSuppliedOverviewRes = getSuppliedOverview(depositAndMortgageData);
      let getSuppliedOverviewRes = getSuppliedOverview(depositData);
      this.totalSupplyUsd = getSuppliedOverviewRes.totalSupplyUsd;
      this.mortgageRate = getSuppliedOverviewRes.mortgageRate;
      this.totalBorrowableUsd = getSuppliedOverviewRes.totalBorrowableUsd;
      this.totalBorrowingUsd = getTotalBorrowingUsd(lendData);

      // console.log(this.totalBorrowUsdForUSDD.toString(), this.totalBorrowableUsd.toString());

      this.totalBorrowingRate = BigNumber(this.totalBorrowingUsd).div(this.totalBorrowableUsd).times(100);
      this.totalRestBorrowableUsd =
        this.depositAndMortgageLength > 0 ? BigNumber(this.totalBorrowableUsd).minus(this.totalBorrowingUsd) : '--';

      this.userLendDataSource = [...lendData];
      if (this.totalRestBorrowableUsd === '--') {
        this.userBorrowingAndRestBorrowableDataSource = [...lendData];
      } else {
        this.userBorrowingAndRestBorrowableDataSource = [
          ...lendData,
          {
            collateralSymbol: intl.get('v2.borrow_balance'),
            borrowBalanceNewUsd: this.totalRestBorrowableUsd
          }
        ];
      }
      this.userDepositDataSource = [...depositData];
      this.userDepositAndJustMortgateDataSource = [...depositData, ...this.justMortgageData];
      this.userDataSource.map(item => {
        if (
          item?.collateralSymbol?.toLowerCase() === 'sunold' &&
          (BigNumber(item.deposited_usd).gt(0) || BigNumber(item.borrowBalanceNewUsd).gt(0))
        ) {
          this.isUserSunOldEmpty = false;
        }
      });
    } catch (err) {
      console.log('addUserValue error:', err);
    }
  };

  getPramFromSun = () => {
    const type = getParameterByName('type');
    const tokenFromSun = getParameterByName('tokenAddress');
    if (tokenFromSun && type === 'withdraw') {
      this.setData({
        DAWPop: {
          show: true,
          activeKey: '2',
          popData: this.userList[tokenFromSun] || this.marketList[tokenFromSun]
        },
        openedModalFromSun: true
      });
    }
  };

  getVoteBalanceOf = async token => {
    const address = this.rootStore.network.defaultAccount || Config.defaultAddress;
    try {
      const { balance, allowance, success } = await tokenBalanceOf(token, address);
      if (success) {
        return allowance;
      }
    } catch (error) {
      console.log(`getTokenBalance error`, error);
    }
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

  setList = (obj = {}, target, key) => {
    // console.log(obj, target, key, this[target][key]);
    // Object.keys(obj).map(_ => {
    //   this[target][key][_] = obj[_];
    // })
    Object.assign(this[target][key], obj);
  };

  showBorrowModal = (item, type) => {
    this.setData({ borrowModalInfo: { visible: true, jtokenAddress: item.jtokenAddress, type } });
  };

  hideBorrowModal = () => {
    this.setData({ borrowModalInfo: { visible: false, jtokenAddress: '', type: '1' } });
  };

  hideMortgageModal = () => {
    this.setData({ mortgageModalInfo: { visible: false, jtokenAddress: '', type: 1 } });
  };

  hideVoteForPop = () => {
    this.setData({ voteForPop: false });
  };

  hideExchangeVotePop = () => {
    this.setData({ exchangeVotePop: false });
  };

  hideAuthorizePop = () => {
    this.setData({ authorizePop: false });
  };

  hideWithdrawPop = () => {
    this.setData({ withdrawPop: false });
  };

  hideDAWPop = () => {
    this.setData({
      DAWPop: {
        show: false,
        activeKey: '2',
        popData: null
      }
    });
  };

  getVoteList = async () => {
    let block = await this.getCurrentBlock();
    let list = await getVoteList(block);
    let voteList = list.proposalList;
    let obj = {},
      arr = [];
    await Promise.all(
      voteList.map(async (item, index) => {
        if (item.state === 0) {
          item.intl = intl.get('trans_status.pending');
        } else if (item.state === 1 || item.state === -1) {
          item.intl = intl.get('vote.status_active');
        } else if (item.state === 2) {
          item.intl = intl.get('vote.status_canceld');
        } else if (item.state === 3) {
          //Defeated
          item.intl = intl.get('vote.status_failed');
        } else if (item.state === 4) {
          //Succeeded
          item.intl = intl.get('vote.status_passed');
        } else if (item.state === 5) {
          //Queued
          item.intl = intl.get('vote.status_passed');
          item.exIntl = intl.get('vote.status_queued');
        } else if (item.state === 6) {
          //Expired
          item.intl = intl.get('vote.status_passed');
          item.exIntl = intl.get('vote.status_expired');
        } else if (item.state === 7) {
          //Executed
          item.intl = intl.get('vote.status_passed');
          item.exIntl = intl.get('vote.status_executed');
        }

        let voteDetailFile = await this.getVoteDetailFile(item.proposalId);
        if (voteDetailFile) {
          if (item.state === -1 || !item.title || !item.content) {
            item.title = voteDetailFile.default.title;
            item.content = voteDetailFile.default.content;
          }
          obj[item.proposalId] = item;
          arr.push(item);
        } else {
          if (item.state !== -1 && item.title && item.content) {
            obj[item.proposalId] = item;
            arr.push(item);
          }
        }
      })
    );

    for (let proposalId in obj) {
      if (obj[proposalId].state === -1) {
        obj[proposalId].state = 1;
      }
    }

    arr.sort((item1, item2) => {
      return item2.proposalId - item1.proposalId;
    });

    this.setData({
      voteSourceList: arr,
      voteSourceData: obj
    });
    let res = {
      arr,
      obj
    };
    return res;
  };

  getBalanceForVote = async () => {
    const defaultAccount = this.rootStore.network.defaultAccount || Config.defaultAddress;
    let voteInfo = await this.rootStore.system.getVoteInfo(
      Config.contract.poly,
      defaultAccount,
      Config.contract.JST,
      Config.contract.WJSTAddress
    );
    this.setData({
      voteInfo
    });
    // console.log(voteInfo);
  };

  getOldWjstBalanceForVote = async () => {
    const defaultAccount = this.rootStore.network.defaultAccount || Config.defaultAddress;
    let oldVoteInfo = await this.rootStore.system.getVoteInfo(
      Config.contract.poly,
      defaultAccount,
      Config.contract.JST,
      Config.contract.oldWJSTAddress
    );
    // console.log('oldVoteInfo: ', oldVoteInfo);
    this.setData({
      oldVoteInfo
    });
  };

  getUserDetail = async proposalId => {
    let block = await this.getCurrentBlock();
    const address = this.rootStore.network.defaultAccount || Config.defaultAddress;
    let res = await getUserDetail(address, block);
    if (res.success) {
      const votedList = [];
      for (let item of res.data.statusList) {
        if (BigNumber(item.forVotes).gt(0) || BigNumber(item.againstVotes).gt(0)) {
          votedList.push(item.proposalId);
        }
      }
      this.setData({
        votedList
      });
      let voteDetail = res.data.statusList.filter(item => Number(item.proposalId) === Number(proposalId))[0];
      if (voteDetail && BigNumber(voteDetail.forVotes).gt(0)) {
        this.setData({
          addVote: 'yes'
        });
      } else if (BigNumber(voteDetail && voteDetail.againstVotes).gt(0)) {
        this.setData({
          addVote: 'no'
        });
      } else {
        this.setData({
          addVote: null
        });
      }
    } else {
      return null;
    }
  };

  getVoteDetail = async proposalId => {
    try {
      let res = await this.getVoteList();
      this.setData({
        voteDetailData: res.obj[proposalId]
      });

      this.getUserDetail(proposalId);
      this.getUserVote(proposalId);
      this.getBalanceForVote();
      this.getOldWjstBalanceForVote();
    } catch (error) {
      console.log('getvoteDetail: ', error);
    }
  };

  getUserWithdrawInfo = async () => {
    let block = await this.getCurrentBlock();
    // const address = this.rootStore.network.defaultAccount || Config.defaultAddress;
    const address = this.rootStore.network.defaultAccount || window.defaultAccount;
    let res = await getUserDetail(address, block);
    if (res.success) {
      // eslint-disable-next-line no-unused-expressions
      res.data?.statusList &&
        res.data?.statusList?.length > 0 &&
        res.data?.statusList.map(item => {
          const { againstVotes, abstainVotes, forVotes } = item;
          item.allVotes = new BigNumber(againstVotes)
            .plus(abstainVotes)
            .plus(forVotes)
            .div(Config.tokenDefaultPrecision)
            .toString();
        });
      this.userCanRedeemVoteList = res.data?.statusList.filter(item => item.state !== 2 && item.canWithdraw);

      this.userCanRedeemVoteNum = this.userCanRedeemVoteList.reduce(
        (sum, e) => BigNumber(sum).plus(BigNumber(e.allVotes || 0)),
        0
      );

      this.userVotingVote = res.data?.statusList.filter(item => item.state !== 2 && !item.canWithdraw);

      this.userVotingVoteNum = this.userVotingVote.reduce(
        (sum, e) => BigNumber(sum).plus(BigNumber(e.allVotes || 0)),
        0
      );
    } else {
      return null;
    }
  };

  getUserVote = async proposalId => {
    const { defaultAccount } = this.rootStore.network;
    const voteDetailData = this.voteDetailData;
    if (voteDetailData) {
      // 1: active 2: pending
      let vote = {
        userAddr: defaultAccount,
        proposalId,
        contractAddr: Config.contract.WJSTAddress
      };
      let lockNum = await this.rootStore.system.lockTo(vote);
      this.setData({
        lockNum
      });
    }
  };

  openWithdrawModal = () => {
    if (this.openedModalFromSun) return;
    if (this.tokenDataSuccess && this.marketDataSuccess) {
      this.getPramFromSun();
    }
  };

  getDashboardData = async () => {
    try {
      const res = await getMarketDashboardData();
      if (res.success) {
        this.setData({ dashboardData: res.data });
      }
      return null;
    } catch (err) {
      console.log('getDashboardData', err);
    }
  };

  getVoteDetailFile = async proposalId => {
    try {
      return require(`../locales/${voteDetailFilePath}/vote-detail-${proposalId}`);
    } catch (error) {
      console.log('import file failed, proposalId: ', proposalId, error);
      return null;
    }
  };

  hideTotalCollateralPop = () => {
    this.setData({ totalCollateralShow: false });
  };

  collateralValid = symbol => {
    if (this.totalCollateral.length >= Config.maxTotalCollateral && !this.totalCollateral.includes(symbol)) {
      this.setData({ totalCollateralShow: true });
      return false;
    }
    return true;
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

  changeTheme = () => {
    const theme = this.theme === 'white' ? 'black' : 'white';
    this.setData({ theme });
    window.localStorage.setItem('theme', theme);
  };

  getMultiReward = async () => {
    try {
      const res = await getMultiReward(this.rootStore.network.defaultAccount);
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
    let totalRewardUSDDOLD = 0;
    let totalRewardUSDDNEW = 0;
    let choosedTotalReward = 0;
    let defaultValue = [];
    let usddNewChecked = false;

    dataArr = !dataArr ? Object.keys(multiRewardData).reverse() : dataArr.reverse();

    if (dataArr?.length > 0) {
      dataArr.map((item, index) => {
        if (index === 0 && multiRewardData[item]?.tokenAddress === Config.usdd.token) usddNewChecked = true;
        if (
          (usddNewChecked && multiRewardData[item]?.tokenAddress === Config.usdd.token) ||
          (!usddNewChecked && multiRewardData[item]?.tokenAddress !== Config.usdd.token)
        ) {
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
        }
      });
    }

    let totalDataArr = Object.keys(multiRewardData);
    if (totalDataArr?.length > 0) {
      totalDataArr.map(item => {
        totalReward = BigNumber(totalReward).plus(
          BigNumber(parseInt(multiRewardData[item]?.amount)).div(Config.tokenDefaultPrecision)
        );
        if (multiRewardData[item]?.tokenAddress === Config?.usdd?.token) {
          totalRewardUSDDNEW = BigNumber(totalRewardUSDDNEW).plus(
            BigNumber(parseInt(multiRewardData[item]?.amount)).div(Config.tokenDefaultPrecision)
          );
        } else {
          totalRewardUSDDOLD = BigNumber(totalRewardUSDDOLD).plus(
            BigNumber(parseInt(multiRewardData[item]?.amount)).div(Config.tokenDefaultPrecision)
          );
        }
      });
    }

    this.setData({
      multiRewardData,
      defaultValue,
      choosedTotalReward,
      totalReward,
      totalRewardUSDDNEW,
      totalRewardUSDDOLD
    });

    return usddNewChecked;
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
            : BigNumber(BigNumber(res.minStakeAmount).div(Config['usdt'].precision)._toFixed(0, 1)).plus(1)
        });
      }
    } catch (err) {
      console.log('getAmountLimit', err);
    }
  };

  getWstUSDTBalanceInfo = async (accountAddress, tokens, jtokens) => {
    if (!this.rootStore.network.isConnected) return;

    const balanceInfo = await getBalanceStUsdtInfo(accountAddress, tokens, jtokens, this.balanceInfo);

    // console.log('balanceInfo: ', balanceInfo);
    // console.log(
    //   balanceInfo[Config['usdt'].token]?.allowance.toString(),
    //   balanceInfo[Config['stusdt'].token]?.allowance.toString(),
    //   balanceInfo[Config['wstusdt'].token]?.allowance.toString()
    // );
    this.setData({
      wstUSDTbalanceInfo: { ...balanceInfo }
    });
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

  getRiojCheck = async () => {
    try {
      const res = await getRiojCheck();
      this.setData({ noService: !res.success });
      // this.setData({ noService: !!res.success }); // for test
    } catch (err) {
      console.log('getRiojCheck', err);
    }
  };

  getRiojBalance = async () => {
    try {
      const data = await this.getTokenBalanceInfoNew(
        this.rootStore.network.defaultAccount,
        [Config['stusdt'].token, Config['wstusdt'].token, Config.jwstusdtJtoken],
        [Config.wstUSDTProxy, Config.UnstUSDTProxy, Config.UnstUSDTProxy]
      );

      if (
        (!BigNumber(data?.[Config['stusdt']?.token]?.balance).isNaN() &&
          BigNumber(data[Config['stusdt']?.token]?.balance).gt(0)) ||
        (!BigNumber(data?.[Config['wstusdt']?.token]?.balance).isNaN() &&
          BigNumber(data[Config['wstusdt']?.token]?.balance).gt(0)) ||
        (!BigNumber(data?.[Config.jwstusdtJtoken]?.balance).isNaN() &&
          BigNumber(data[Config.jwstusdtJtoken]?.balance).gt(0))
      ) {
        this.setData({
          riojBalance: true
          // riojBalance: false //for test
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

  getContinueDisabledStatus = async () => {
    try {
      let mintStatus = getTotalMintStatus(this);
      let isNodata =
        BigNumber(this.totalReward).lte(0) &&
        (!this.userLendDataSource || this.userLendDataSource.length === 0) &&
        (!this.userDepositDataSource || this.userDepositDataSource.length === 0);
      if (isNodata) mintStatus = false;

      let mainTokenStatus = false;
      if (
        BigNumber(this.balanceInfo[Config['usdd'].jtokenAddress]?.balance).gt(0) ||
        BigNumber(this.balanceInfo[Config['usdt'].jtokenAddress]?.balance).gt(0) ||
        BigNumber(this.balanceInfo[Config['tusd'].jtokenAddress]?.balance).gt(0) ||
        BigNumber(this.balanceInfo[Config['usdc'].jtokenAddress]?.balance).gt(0) ||
        BigNumber(this.balanceInfo[Config['jst'].jtokenAddress]?.balance).gt(0) ||
        BigNumber(this.balanceInfo[Config['strx'].jtokenAddress]?.balance).gt(0)
      ) {
        mainTokenStatus = true;
      }

      let anyJTokenStatus = true;
      if (this.userDepositDataSource.length <= 0) anyJTokenStatus = false;

      let colleteralStatus = false;
      if (this.userDataSource?.length > 0) colleteralStatus = true;

      // console.log(mintStatus, mainTokenStatus, anyJTokenStatus, 1292, colleteralStatus);
      if (
        !(mintStatus || mainTokenStatus || anyJTokenStatus || colleteralStatus) &&
        this.serviceInnerStatus === 'continue'
      ) {
        this.continueWhileDisabled = true;
      } else {
        this.continueWhileDisabled = false;
      }
    } catch (err) {
      console.log('getContinueDisabledStatus', err);
    }
  };

  getTokenBalanceInfoNew = async (accountAddress, tokens, jtokens) => {
    if (!accountAddress) return;

    const balanceInfo = await getBalanceStUsdtInfo(accountAddress, tokens, jtokens, this.balanceInfo);
    this.balanceInfo = { ...balanceInfo };
    return balanceInfo;
  };

  getLiquidateInfo = async () => {
    try {
      const res = await getLiquidateInfo();
      let result = res.data;
      if (res.success) {
        let account = result.accounts;
        const { minRiskValue, maxRiskValue } = this;

        if (!BigNumber(minRiskValue).isNaN() || !BigNumber(maxRiskValue).isNaN()) {
          let minValue = minRiskValue;
          let maxValue = maxRiskValue;
          if (BigNumber(minRiskValue).isNaN()) {
            minValue = 95;
          }

          account = account.filter(item => {
            if (BigNumber(maxValue).isNaN()) {
              return BigNumber(BigNumber(item.risk).times(100)).gte(minValue);
            }

            return (
              BigNumber(BigNumber(item.risk).times(100)).gte(minValue) &&
              BigNumber(BigNumber(item.risk).times(100)).lte(maxValue)
            );
          });
        }

        this.setData({
          liquidateInfo: {
            ...result,
            accounts: account
          },
          liquidateOriginalInfo: { ...result }
        });

        const { accounts, jtokens } = result;
        let promiseFunc = [];

        for (const items of accounts) {
          if (items.borrowTokenList.length) {
            for (const item of items.borrowTokenList) {
              // if (!this.balanceMap[item.symbol]) {

              const balanceRes = this.getBalance(item.tokenAddress, jtokens['j' + item.symbol], item.symbol);
              promiseFunc.push(balanceRes);
              // }
            }
          }
        }

        await Promise.all(promiseFunc);
      }
    } catch (err) {
      console.log('getLiquidateInfo', err);
    }
  };

  getBalance = async (tokenAddress, jtokenAddress, tokenSymbol) => {
    const balanceInfo = await tokenBalanceOf(
      {
        token: tokenAddress,
        jtokenAddress,
        precision: Config[('' + tokenSymbol).toLocaleLowerCase()]?.precision
      },
      this.rootStore.network.defaultAccount
    );
    // console.log('params: ', tokenAddress, jtokenAddress, Config[('' + tokenSymbol).toLocaleLowerCase()]?.precision);
    // console.log('balanceInfo: ', balanceInfo, tokenSymbol);

    this.balanceMap[tokenSymbol] = balanceInfo;
  };

  getBetaInfo = async address => {
    try {
      if (!address) return;

      const result = await getBetaInfo(address);
      let betaInfo = [];

      if (!result?.success || !result?.data) {
        betaInfo = [
          { type: 1, status: 2 },
          { type: 2, status: 4 },
          { type: 3, status: 4 }
        ];
      }

      // sort
      result?.data?.map(item => {
        if (item.status === 1) {
          betaInfo.unshift(item);
        } else {
          betaInfo.push(item);
        }
      });

      // betaInfo = [
      //   { type: 1, status: 3 },
      //   { type: 2, status: 2 },
      //   { type: 3, status: 2 }
      // ];

      if (betaInfo?.length > 0) {
        let betaMap = {
          '1': 'rent',
          '2': 'liquidate',
          '3': 'settings'
        };

        this.showAccountBeta = false;
        this.hasSettingsBetaAuthority = false;
        this.hasLiquidateBetaAuthority = false;
        this.hasEnergyBetaAuthority = false;
        this.betaModalVisible = false;

        betaInfo.map(async item => {
          // whether user can see the beta icon
          let betaObj = this.applicationMap[betaMap[item.type]];

          if ([1, 2].includes(item.status) && betaObj.phase === 1 && betaObj.switchOn) {
            this.showAccountBeta = true;
          }

          // whether user has the authority to see liquidate page
          if (item.type === 3 && [1, 2].includes(item.status)) {
            this.hasSettingsBetaAuthority = true;
          }

          // whether user has the authority to see liquidate page
          if (item.type === 2 && [1, 2].includes(item.status)) {
            this.hasLiquidateBetaAuthority = true;
          }

          // whether user has the authority to see new energy rent page
          if (item.type === 1 && [1, 2].includes(item.status)) {
            this.hasEnergyBetaAuthority = true;
          }
          // beta modal show or hide
          if ([1, 3].includes(item.status)) {
            this.betaModalVisible = true;
            updateBetaInfo({
              // 'accessToken': 'tronsmart',
              accessToken: await this.rootStore.settings.encryptSignInfo('lend'),
              address,
              listType: item.type,
              status: item.status + 1
            });
          }
        });
      }

      this.betaInfo = betaInfo;

      return betaInfo;
    } catch (err) {
      console.log('getBetaInfo', err);
    }
  };

  getApplicationInfo = async () => {
    try {
      const result = await getApplicationInfo();
      let applicationMap = {};

      if (!result?.success || !result?.data) {
        applicationMap = {
          'rent': {
            'phase': 2,
            'switchOn': true,
            'switchType': 1
          },
          'liquidate': {
            'phase': 1,
            'switchOn': true,
            'switchType': 2
          },
          'settings': {
            'phase': 2,
            'switchOn': true,
            'switchType': 3
          }
        };
        this.totalRCLength = 1;
      }

      if (result?.success) {
        if (result?.data?.length) {
          result?.data.map(item => {
            if (item.switchType === 1) {
              applicationMap['rent'] = item;
            } else if (item.switchType === 2) {
              applicationMap['liquidate'] = item;
            } else if (item.switchType === 3) {
              applicationMap['settings'] = item;
            }
          });
          this.totalRCLength = result.data.filter(item => item.switchOn && item.phase === 1)?.length;
          if (this.totalRCLength > 3) this.totalRCLength = 3; // for prevent test env backend length err
        }
      }
      // applicationMap = {
      //   'rent': {
      //     'phase': 2,
      //     'switchOn': true,
      //     'switchType': 1
      //   },
      //   'liquidate': {
      //     'phase': 2,
      //     'switchOn': true,
      //     'switchType': 2
      //   },
      //   'settings': {
      //     'phase': 1,
      //     'switchOn': true,
      //     'switchType': 3
      //   }
      // };

      if (
        (applicationMap['rent']?.switchOn && applicationMap['rent']?.phase === 1) ||
        (applicationMap['liquidate']?.switchOn && applicationMap['liquidate']?.phase === 1) ||
        (applicationMap['settings']?.switchOn && applicationMap['settings']?.phase === 1)
      ) {
        applicationMap['canApply'] = true;
      } else {
        applicationMap['canApply'] = false;
      }

      this.applicationMap = applicationMap;
    } catch (err) {
      console.log('getBetaInfo', err);
    }
  };
}
