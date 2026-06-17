import { observable, action, makeObservable } from 'mobx';
import BigNumber from 'bignumber.js';
import Config from '../config';
import { cloneDeep } from 'lodash';
import { getDepositApy, getLendApy, getPrecision, getTotalMintStatus, getParameterByName } from '../utils/helper';
import { getBalanceInfo, getBalanceStUsdtInfo } from '../utils/blockchain';
import { getMarketData, getMintInfo, getTronBull, getMarketDashboardData, getRiojCheck } from '../utils/backend';

export default class MarketStore {
  @observable disabledDataSuccess = false;
  @observable isUSDJDisabled = false;
  @observable isUSDDOLDDisabled = false;
  @observable tokens = [];
  @observable jtokens = [];
  @observable prices = [];
  @observable tokenSymbols = [];
  @observable marketDataSource = [];
  @observable marketDataDefaultSource = [];
  @observable marketList = {};
  @observable marketDataSuccess = false;
  @observable priceList = {};
  @observable trxPrice = '';
  @observable balanceInfo = {};
  @observable assetList = {};
  @observable interestRateGraphIndex = -1;
  @observable depositDetailGraphIndex = -1;
  @observable borrowDetailGraphIndex = -1;
  @observable dashboardData = null;
  @observable continueWhileDisabled = false;
  @observable noService = false; // IP check
  @observable riojBalance = false; // have balance
  @observable openedModalFromSun = false;
  @observable tokenDataSuccess = false;
  @observable DAWPop = {
    show: false,
    activeKey: '2',
    popData: {}
  };

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  @action
  setRiojBalance(data) {
    this.riojBalance = data;
  }

  @action
  setMarketDataSource(data) {
    this.marketDataSource = data;
  }

  @action
  setBalanceInfo(data) {
    this.balanceInfo = data;
  }

  @action
  setBorrowDetailGraphIndex(data) {
    this.borrowDetailGraphIndex = data;
  }

  @action
  setDepositDetailGraphIndex(data) {
    this.depositDetailGraphIndex = data;
  }

  @action
  setInterestRateGraphIndex(data) {
    this.interestRateGraphIndex = data;
  }

  @action
  setNoService(data) {
    this.noService = data;
  }

  @action
  setMarketDataDefaultSource(data) {
    this.marketDataDefaultSource = data;
  }

  @action
  setDashboardData(data) {
    this.dashboardData = data;
  }

  @action
  setTrxPrice(data) {
    this.trxPrice = data;
  }

  @action
  setDAWPop(data) {
    this.DAWPop = data;
  }

  @action
  setData(name, value) {
    this[name] = value;
  }

  hideDAWPop = () => {
    this.setDAWPop({
      show: false,
      activeKey: '2',
      popData: null
    });
  };

  getDiasbledMarket = () => {
    const { marketDataSource } = this;
    const jtokens = [];
    const tokens = [];
    const prices = [];
    const tokenSymbols = [];
    const usdjAddress = Object.keys(Config.tokens).find(addr => Config.tokens[addr].tokenSymbol === 'USDJ');
    const usddoldAddress = Object.keys(Config.tokens).find(addr => Config.tokens[addr].tokenSymbol === 'USDDOLD');
    let isUSDJDisabled = false;
    let isUSDDOLDDisabled = false;

    marketDataSource.forEach(item => {
      tokens.push(item.collateralAddress);
      jtokens.push(item.jtokenAddress);
      prices.push(item.assetPrice);
      tokenSymbols.push(item.collateralSymbol);

      if (item.collateralAddress === usdjAddress && item.mintPaused === 1 && item.borrowPaused === 1) {
        isUSDJDisabled = true;
      }

      if (item.collateralAddress === usddoldAddress && item.mintPaused === 1 && item.borrowPaused === 1) {
        isUSDDOLDDisabled = true;
      }
    });

    this.setData('isUSDJDisabled', isUSDJDisabled);
    this.setData('isUSDDOLDDisabled', isUSDDOLDDisabled);
    this.setData('disabledDataSuccess', true);
    this.setData('tokens', tokens);
    this.setData('jtokens', jtokens);
    this.setData('prices', prices);
    this.setData('tokenSymbols', tokenSymbols);
  };

  getPramFromSun = () => {
    const { user } = this.rootStore;
    const type = getParameterByName('type');
    const tokenFromSun = getParameterByName('tokenAddress');

    if (tokenFromSun && type === 'withdraw') {
      this.setDAWPop({
        show: true,
        activeKey: '2',
        popData: user.userList[tokenFromSun] || this.marketList[tokenFromSun]
      });
      this.setData('openedModalFromSun', true);
    }
  };

  openWithdrawModal = () => {
    if (this.openedModalFromSun) return;
    if (this.tokenDataSuccess && this.marketDataSuccess) {
      this.getPramFromSun();
    }
  };

  setMartketData = async (data = []) => {
    try {
      let obj = {};
      data.forEach(item => {
        item.key = item.jtokenAddress;
        item.balance = '--';
        item.precision = getPrecision(item.collateralDecimal);
        item.assetPrice = this.priceList[item.collateralAddress];
        item.depositApy = getDepositApy(item);
        item.lendApy = getLendApy(item);
        obj[item.jtokenAddress] = item;
      });

      this.setMarketDataSource([...data]);
      this.setMarketDataDefaultSource([...data]);
      this.setData('marketList', obj);

      this.getDiasbledMarket();
      this.setData('marketDataSuccess', true);
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
      this.setData('priceList', marketData.assetPrice);
      this.setTrxPrice(marketData.trxPrice);
      this.setMartketData(marketData.jtokenList || []);
      this.openWithdrawModal();
    } catch (err) {
      console.log('getMarketData', err);
    }
  };

  getMintInfo = async () => {
    try {
      const { userList } = this.rootStore.user;
      const { jtrxAddress } = Config;
      const { marketList } = this;
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
        let totalAPYNEW = BigNumber(0);
        let totalAPYNEWUSDD = BigNumber(0); // USDD APY
        let totalAPYNEWTRX = BigNumber(0); // TRX APY

        const poolBull = poolBullAll[jtokenAddress] || {};

        if (poolBull['JSTNEW']) {
          totalAPYNEW = totalAPYNEW.plus(poolBull['JSTNEW']);
        }
        if (poolBull['USDDNEW']) {
          totalAPYNEWUSDD = totalAPYNEWUSDD.plus(poolBull['USDDNEW']);
        }
        if (poolBull['TRXNEW']) {
          totalAPYNEWTRX = totalAPYNEWTRX.plus(poolBull['TRXNEW']);
        }

        obj[jtokenAddress] = {
          totalAPYNEW: totalAPYNEW.times(100),
          totalAPYNEWUSDD: totalAPYNEWUSDD.times(100),
          totalAPYNEWTRX: totalAPYNEWTRX.times(100)
        };
      });
      this.setData('assetList', obj);
    } catch (err) {
      console.log('getMintInfo', err);
    }
  };

  getTokenBalanceInfo = async () => {
    if (!this.rootStore.network.isConnected) return;
    const { tokens, jtokens, balanceInfo: marketBalanceInfo, prices, tokenSymbols } = this;
    const balanceInfo = await getBalanceInfo(
      window.defaultAccount,
      tokens,
      jtokens,
      cloneDeep(marketBalanceInfo),
      prices,
      tokenSymbols
    );
    this.setBalanceInfo(balanceInfo);
    this.setData('tokenDataSuccess', true);
    this.openWithdrawModal();
  };

  getContinueDisabledStatus = async () => {
    const { userLendDataSource, userDepositDataSource, userDataSource, totalReward } = this.rootStore.user;
    try {
      let mintStatus = getTotalMintStatus(this.rootStore.user);
      let isNodata =
        BigNumber(totalReward).lte(0) &&
        (!userLendDataSource || userLendDataSource.length === 0) &&
        (!userDepositDataSource || userDepositDataSource.length === 0);
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
      if (userDepositDataSource.length <= 0) anyJTokenStatus = false;

      let colleteralStatus = false;
      if (userDataSource?.length > 0) colleteralStatus = true;

      if (
        !(mintStatus || mainTokenStatus || anyJTokenStatus || colleteralStatus) &&
        this.rootStore.lend.serviceInnerStatus === 'continue'
      ) {
        this.setData('continueWhileDisabled', true);
      } else {
        this.setData('continueWhileDisabled', false);
      }
    } catch (err) {
      console.log('getContinueDisabledStatus', err);
    }
  };

  getTokenBalanceInfoNew = async (accountAddress, tokens, jtokens) => {
    if (!accountAddress) return;

    const balanceInfo = await getBalanceStUsdtInfo(accountAddress, tokens, jtokens, cloneDeep(this.balanceInfo));
    return balanceInfo;
  };

  getDashboardData = async () => {
    try {
      const res = await getMarketDashboardData();
      if (res.success) {
        this.setDashboardData(res.data);
      }
      return null;
    } catch (err) {
      console.log('getDashboardData', err);
    }
  };

  getRiojCheck = async () => {
    try {
      const res = await getRiojCheck();
      this.setNoService(!res.success);
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
        this.setRiojBalance(true);
      } else {
        this.setRiojBalance(false);
      }
    } catch (err) {
      console.log('getRiojBalance', err);
    }
  };
}
