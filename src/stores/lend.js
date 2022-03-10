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
  getTransferringSoonAndInFreeze,
  getNetAPY
} from '../utils/helper';
import { tokenBalanceOf, getLatestBlockInfo, getBalanceInfo } from '../utils/blockchain';
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
  getDefiTVL
} from '../utils/backend';

import { initPoolData } from '../utils/constant';
const { voteDetailFilePath } = Config;

const defaultIntervalSeconds = 60000;
export default class PoolStore {
  // for home nav start...
  @observable pagination = {
    pageNo: 1,
    orderBy: 'liquidity',
    desc: true,
    pageSize: 10
  };
  @observable userDataSource = null;
  @observable userDepositDataSource = null;
  @observable userLendDataSource = null;
  @observable totalCollateral = [];
  @observable totalCollateralShow = false;
  @observable userList = {};
  @observable marketDataSource = [];
  @observable marketList = {};
  @observable priceList = {};
  @observable trxPrice = '';
  @observable netAPY = '';
  @observable DAWPop = {
    show: false,
    activeKey: '2',
    popData: {}
  };

  @observable borrowLimit = '--';
  @observable totalBorrowUsd = '--';
  @observable mortgageModalInfo = {
    visible: false,
    type: 1, // 1 open, 2 close
    jtokenAddress: ''
  };
  @observable borrowModalInfo = {
    visible: false,
    type: 1,
    jtokenAddress: ''
  };
  @observable latestBlockInfo = null;

  @observable nowBlock = 0;

  @observable interval = null; // 
  @observable backendInterval = null;

  @observable balanceInfo = {};
  @observable voteSourceList = [{}];
  @observable voteSourceData = null;
  @observable voteInfo = null;
  @observable voteForPop = false;
  @observable redeemFromVotePop = false;
  @observable exchangeVotePop = false;
  @observable authorizePop = false;
  @observable withdrawPop = false;
  @observable voteDetailData = null;
  @observable lockNum = BigNumber(0);
  @observable addVote = null;

  @observable openedModalFromSun = false;
  @observable marketDataSuccess = false;
  @observable tokenDataSuccess = false;
  @observable assetList = {};
  @observable usertronbullishData = null;
  @observable userCurrencyData = {};
  @observable transferringSoon = '--';
  @observable inFreeze = '--';

  @observable dashboardData = null;
  @observable defiTVL = null;

  @observable isUserSunOldEmpty = true;

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  setVariablesInterval = async () => {
    if (!this.interval) {
      await this.getLatestBlockInfo();
      this.interval = setInterval(async () => {
        await this.getLatestBlockInfo();
        await this.getMintInfo();
      }, defaultIntervalSeconds);
    }

    if (!this.backendInterval) {
      this.backendInterval = setInterval(async () => {
        await this.getMarketData();
        await this.getUserData();
        await this.getDashboardData();
        await this.getDefiTVL();
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
    marketDataSource.map(item => {
      tokens.push(item.collateralAddress);
      jtokens.push(item.jtokenAddress);
    });
    const balanceInfo = await getBalanceInfo(window.defaultAccount, tokens, jtokens, this.balanceInfo);
    this.balanceInfo = { ...balanceInfo };
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
        const totalTrx = totalOrigin.times(assetPrice).div(Config.tokenDefaultPrecision).div(Config.defaultPrecision);
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
        const gotSun = BigNumber(item.account_sunGainOld).div(Config.tokenDefaultPrecision); // 
        const toBeGotSun = totalSun.minus(gotSun); // 
        let totalAPYNEW = BigNumber(0); // 

        const poolBull = poolBullAll[jtokenAddress] || {};
        if (poolBull['JSTNEW']) {
          // jst lp mining apy
          totalAPYNEW = totalAPYNEW.plus(poolBull['JSTNEW']);
        }
        obj[jtokenAddress] = {
          apy: BigNumber(item.sunAPYInfo).times(100),
          totalSun,
          gotSun,
          toBeGotSun,
          totalAPYNEW: totalAPYNEW.times(100)
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
        // console.log(JSON.parse(window.localStorage.getItem('latestBlockInfo')), 'window');
        this.latestBlockInfo = JSON.parse(window.localStorage.getItem('latestBlockInfo'));
        return;
      }
      return;
    }
    this.latestBlockInfo = {
      number: res.number,
      timestamp: res.timestamp
    };
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
      res = await getUserData({ addr: this.rootStore.network.defaultAccount });
      await this.getCurrentBlock();

      if (res === null || !res.success) return;
      this.trxPrice = BigNumber(res.data.trxPrice);
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
        const { gainOldAll, gainNewAll, price } = getGainNewAndOld(
          this.assetList,
          this.usertronbullishData,
          item.symbol
        ); // depositData -> this.assetList
        item.gainOld = gainOldAll;
        item.gainNew = gainNewAll;
        item.price = price;
        item.totalGain = BigNumber(gainOldAll).plus(gainNewAll).times(price);
        currencyData[index] = { ...item };
        currencyData[index].key = index;
      });
      currencyData = currencyData.filter(item => {
        return BigNumber(item.gainOld).plus(item.gainNew).gt(0);
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
      const { transferringSoon, inFreeze } = getTransferringSoonAndInFreeze(currencyData);
      this.transferringSoon = transferringSoon;
      this.inFreeze = inFreeze;
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
      this.borrowLimit = getBorrowLimit(this.trxPrice, data);
      data = await this.filterEth(data);
      data.map((item, index) => {
        const { collateralAddress, account_entered, jtokenAddress, collateralFactor } = item;
        item.key = jtokenAddress;
        item.account_entered = BigNumber(collateralFactor).eq(0) ? 2 : Number(account_entered);
        item.precision = getPrecision(item.collateralDecimal); // done
        item.depositApy = getDepositApy(item); // done
        item.exchangeRate = getExchangeRate(item); // done
        item.earned = getEarned(item); // done
        item.deposited = getDeposit(item); // done
        item.deposited_usd = getDepositUsd(item, this.trxPrice); // done
        item.lendApy = getLendApy(item); // done 
        item.borrowBalanceNew = getBorrowBalanceNew(item);
        item.borrowBalanceNewUsd = getBorrowBalanceNewUsd(item, this.trxPrice);
        item.interest = getInterest(item);
        item.interestUsd = getInterestOrEarnedUsd(item, this.trxPrice);
        item.earnedUsd = getInterestOrEarnedUsd(item, this.trxPrice, true);

        item.per = getBorrowPercent(item, this.trxPrice, this.borrowLimit);

        // item.balance = getBalance(this.balanceInfo);
        obj[item.jtokenAddress] = { ...item };
      });

      this.userDataSource = [...data];
      this.userList = obj;
      let lendData = data.filter(item => BigNumber(item.account_borrowBalance).gt(0));
      let depositData = data.filter(item => BigNumber(item.account_depositJtoken).gt(0));

      this.netAPY = getNetAPY(depositData, lendData, this.assetList);
      this.totalBorrowUsd = getTotalLendUsd(lendData);

      this.userLendDataSource = [...lendData];
      this.userDepositDataSource = [...depositData];

      this.userDataSource.map(item => {
        if (
          item.collateralSymbol.toLowerCase() === 'sunold' &&
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
    // console.log(block, list);
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

  getUserDetail = async proposalId => {
    let block = await this.getCurrentBlock();
    const address = this.rootStore.network.defaultAccount || Config.defaultAddress;
    let res = await getUserDetail(address, block);
    if (res.success) {
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
    } catch (error) {
      console.log('getvoteDetail: ', error);
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
      // console.log("lockNum:", lockNum);
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

  getDefiTVL = async () => {
    try {
      const res = await getDefiTVL();
      if (res.success) {
        this.setData({ defiTVL: res.data });
      }
      return null;
    } catch (err) {
      console.log('getDefiTVL', err);
    }
  };

  getVoteDetailFile = async proposalId => {
    try {
      return await import(`../locales/${voteDetailFilePath}/vote-detail-${proposalId}`);
    } catch (error) {
      // console.log('import file failed, proposalId: ', proposalId, error);
      return null;
    }
  };

  hideTotalCollateralPop = () => {
    this.setData({ totalCollateralShow: false });
  };

  collateralValid = symbol => {
    if (this.totalCollateral.length >= 10 && !this.totalCollateral.includes(symbol)) {
      this.setData({ totalCollateralShow: true });
      return false;
    }
    return true;
  };
}
