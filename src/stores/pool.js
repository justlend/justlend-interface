// Libraries
import React from 'react';
import { observable } from 'mobx';
import { notification } from 'antd';
import isMobile from 'ismobilejs';

import { ACCOUNT_TRONLINK, BigNumber, tronscanTX, cutMiddle, voteFormat, formatNumber } from '../utils/helper';
import {
  tokenBalanceOf,
  loadContracts,
  getPoolsInfo,
  getClaimed,
  getInfoVote,
  getAPY,
  getRewardsNew
} from '../utils/blockchain';
import { getTokenPrice, getVoteRankList, getTotalVoted, getTronBull, getTronbullish } from '../utils/backend';
import { initPoolData, calcMineInfo, initVoteList, getStatus, initVoteData, VOTE_STATUS } from '../utils/constant';
import Config from '../config';

const defaultIntervalSeconds = 60000;
export default class PoolStore {
  @observable tronWeb = false;
  @observable poolData = initPoolData();
  @observable totalTrxStake = '--';
  @observable totalUSDTStake = '--';
  @observable sowDays = '--';
  @observable userMinedSunOld = '--';
  // @observable mineInfo = getMineInfo();
  @observable migrateRef = React.createRef();
  @observable migrateVisible = false;
  @observable pDataId = false;
  @observable hideHomeBanner = window.localStorage.getItem(Config.hideHomeBanner);

  @observable tronBull = null;
  @observable tronbullish = null;
  @observable tokenPrices = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    this.interval = null;
    this.defaultIntervalSec = 60000;
    this.backendPass = 0;
    this.backendPing = 10;
  }

  setData = (obj = {}) => {
    const self = this;
    Object.keys(obj).map(key => {
      self[key] = obj[key];
    });
  };

  setVariablesInterval = async () => {
    if (!this.interval) {
      this.interval = setInterval(async () => {
        await this.getPoolData();
      }, defaultIntervalSeconds);
    }
  };

  clearVariablesInterval = () => {
    clearInterval(this.interval);
    this.interval = null;
  };

  showMigrateModal = pDataId => {
    this.migrateRef.current.init(pDataId);
    this.setData({
      migrateVisible: true,
      pDataId: pDataId || false
    });
  };

  closeMigrateModal = () => {
    this.props.pool.setData({
      migrateVisible: false,
      pDataId: false
    });
  };

  hideBanner = () => {
    window.localStorage.setItem(Config.hideHomeBanner, true);

    this.setData({
      hideHomeBanner: true
    });
  };

  getTronbullish = async () => {
    try {
      const addr = this.rootStore.network.defaultAccount;
      if (addr) {
        const { activeSwaps, contract } = Config;
        const activeSwapsAll = activeSwaps;
        const params = activeSwapsAll.map(item => {
          return contract[item].pool;
        });
        const pool = params.join(',');
        const res = await getTronbullish(pool, addr);
        if (!res.success) return;
        this.tronbullish = res.data || {};
      }
    } catch (err) {
      console.log(err);
    }
  };

  getTronBull = async () => {
    try {
      const { poolData } = this;
      const { activeSwaps, contract } = Config;
      const activeSwapsAll = activeSwaps;
      const params = activeSwapsAll.map(item => {
        return { pool: contract[item].pool, tvl: BigNumber(poolData[item].totalUSD)._toFixed(2) };
      });
      const pool = params.map(item => item.pool).join(',');
      const tvl = params.map(item => item.tvl).join(',');
      const res = await getTronBull(pool, tvl, 'lp');
      if (!res.success) return;
      this.tronBull = res.data || {};
    } catch (err) {
      console.log(err);
    }
  };

  getPoolData = async () => {
    try {
      const address = this.rootStore.network.defaultAccount || Config.defaultAddress;
      const poolData = this.poolData;
      const poolIds = Object.keys(poolData);
      const _poolAddresses = [];
      const _poolIds = [];
      poolIds.map(async id => {
        if (poolData[id].pool) {
          _poolIds.push(id);
          _poolAddresses.push(poolData[id].pool);
        }
      });
      const getPoolsInfoPromise = getPoolsInfo(address, _poolAddresses);
      const tokenPriceResPromise = getTokenPrice();

      const res = await getPoolsInfoPromise;
      const tokenPriceRes = await tokenPriceResPromise;
      let totalTrxStake = BigNumber(0);
      const { priceBTT, priceTRX, priceWIN, priceNFT, priceJST } = tokenPriceRes;
      const tokenPrices = {
        wbtt: priceBTT,
        trx: priceTRX,
        win: priceWIN,
        nft: priceNFT,
        jst: priceJST
      };
      this.tokenPrices = tokenPrices;

      if (!res.success) {
        return;
      }

      const { totalLock, claimed, staked, trxAmount, tokenAmount } = res.data;

      _poolIds.map(async (id, index) => {
        const { precision, tokenPrecision, lp } = poolData[id];

        const _total = BigNumber(totalLock[index]._hex).div(precision);
        // const _claimed = BigNumber(claimed[index]._hex).div(Config.sunoldPrecision);
        const _staked = BigNumber(staked[index]._hex).div(precision);
        const _trxAmount = BigNumber(trxAmount[index]._hex).div(Config.trxPrecision);
        const _tokenAmount = BigNumber(tokenAmount[index]._hex).div(tokenPrecision);

        let _totalUSD = '--';

        totalTrxStake = totalTrxStake.plus(_trxAmount.times(2));

        if (tokenPriceRes.success) {
          _totalUSD = _trxAmount.times(2).times(priceTRX);
        }
        if (address !== Config.defaultAddress) {
          Object.assign(this.poolData[id], {
            staked: _staked
          });
        }

        Object.assign(this.poolData[id], {
          total: _total,
          trxAmount: _trxAmount,
          tokenAmount: _tokenAmount,
          totalUSD: _totalUSD
        });
      });

      if (tokenPriceRes.success) {
        this.totalTrxStake = totalTrxStake;
        this.totalUSDTStake = priceTRX.times(totalTrxStake);
      }
      await getRewardsNew(this.poolData, address);
      await this.getTronBull();
    } catch (error) {
      console.error(`getPoolData error: ${error}`);
    }
  };

  loadContracts = async () => {
    try {
      await loadContracts(Config.contract.poolPoly, 'poly');
    } catch (error) {
      setTimeout(this.loadContracts, 2000);
    }
  };

  getTotalVoted = async key => {
    try {
      let res = await getTotalVoted(Config.voteList[key].pool);
      let precision = Config.voteList[key].precision;
      let _totalVoted = BigNumber(0);
      if (BigNumber(res.data).gt(0)) {
        _totalVoted = BigNumber(res.data).div(precision);
      }
      Object.assign(this.allowanceData[key], {
        totalVoted: _totalVoted
      });
    } catch (error) {
      console.log('getTotalVoted failed', error);
    }
  };

  getTokenBalanceOf = async token => {
    const poolData = this.poolData;
    const address = this.rootStore.network.defaultAccount || Config.defaultAddress;
    try {
      const { balance, allowance, success } = await tokenBalanceOf(token, address);
      if (success) {
        poolData[token.id].tokenBalance = balance;
        poolData[token.id].tokenAllowance = allowance;
      }
    } catch (error) {
      console.log(`getTokenBalance error`, error);
    }
  };
}
