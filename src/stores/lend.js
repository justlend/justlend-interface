// Libraries
import { action, observable, makeAutoObservable } from 'mobx';
import Config from '../config';
import BigNumber from 'bignumber.js';
import { getQueryObj, calculateCurrentBlock } from '../utils/helper';
import {
  tokenBalanceOf,
  getLatestBlockInfo,
  getBalanceStUsdtInfo,
  tronObj,
  getAmountLimit,
  getMintPaused,
  getPaused
} from '../utils/blockchain';
import { getBaseInfo, getLiquidateInfo, getBetaInfo, updateBetaInfo, getApplicationInfo } from '../utils/backend';

const tronWeb = tronObj.tronWeb;
const defaultIntervalSeconds = 60000;

export default class LendStore {
  @observable openMint = true;
  @observable openDualMint = true;
  // for home nav start...
  @observable pagination = {
    pageNo: 1,
    orderBy: 'liquidity',
    desc: true,
    pageSize: 10
  };
  @observable totalCollateralShow = false;
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
  @observable wstUSDTbalanceInfo = {};
  @observable energyFee = null;
  @observable theme = window.localStorage.getItem('theme') || 'black';
  @observable lang = 'en-US';
  @observable collapse = true;
  @observable minStakeAmount = '--';
  @observable mintPaused = 0;
  @observable paused = 0;
  @observable openCollateralShow = false;
  @observable serviceInnerStatus = 'normal';
  @observable noServiceModalAllVisible = false;
  @observable hideEnergyPriceAdjustModal = true;
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
  @observable fullNodeError = false;

  constructor(rootStore) {
    this.rootStore = rootStore;
    this.lang = getQueryObj()?.lang || window.localStorage.getItem('lang') || 'en-US';

    makeAutoObservable(this);

    //window.localStorage.setItem('lang', this.lang);
    window.addEventListener('storage', () => {
      const theme = window.localStorage.getItem('theme') || 'black';
      const lang = window.localStorage.getItem('lang') || 'en-US';
      this.theme = theme;
      this.lang = lang;
    });
  }

  @action
  setOpenMint(visible) {
    this.openMint = visible;
  }

  @action
  setOpenDualMint(visible) {
    this.openDualMint = visible;
  }

  @action
  setApplocationTipShow(visible) {
    this.applocationTipShow = visible;
  }

  @action
  setPre(pre) {
    this.pre = pre;
  }

  @action
  setLang(lang) {
    this.lang = lang;
  }

  @action
  setOpenCollateralShow(visible) {
    this.openCollateralShow = visible;
  }

  @action
  setLiquidateShow(visible) {
    this.liquidateShow = visible;
  }

  @action
  setCollapse(visible) {
    this.collapse = visible;
  }

  @action
  setShowGif(visible) {
    this.showGif = visible;
  }

  @action
  setBetaModalVisible(visible) {
    this.betaModalVisible = visible;
  }

  @action
  setStUSDTModalShow(visible) {
    this.stUSDTModalShow = visible;
  }

  @action
  setActiveKey(key) {
    this.activeKey = key;
  }

  @action
  setHideEnergyPriceAdjustModal(visible) {
    this.hideEnergyPriceAdjustModal = visible;
  }

  @action
  setNoServiceModalAllVisible(visible) {
    this.noServiceModalAllVisible = visible;
  }

  @action
  setServiceInnerStatus(status) {
    this.serviceInnerStatus = status;
  }

  @action
  setWstUSDTbalanceInfo(data) {
    this.wstUSDTbalanceInfo = data;
  }

  @action
  setBorrowModalInfo(data) {
    this.borrowModalInfo = data;
  }

  @action
  setMortgageModalInfo(data) {
    this.mortgageModalInfo = data;
  }

  @action
  setPaused(data) {
    this.paused = data;
  }

  @action
  setTotalCollateralShow(data) {
    this.totalCollateralShow = data;
  }

  @action
  setEnergyFee(data) {
    this.energyFee = data;
  }

  @action
  setTheme(data) {
    this.theme = data;
  }

  @action
  setMinStakeAmount(data) {
    this.minStakeAmount = data;
  }

  @action
  setMintPaused(data) {
    this.mintPaused = data;
  }

  @action
  setMinRiskValue(data) {
    this.minRiskValue = data;
  }

  @action
  setMaxRiskValue(data) {
    this.maxRiskValue = data;
  }

  @action
  setExceptionVisible(data) {
    this.exceptionVisible = data;
  }

  @action
  setLiquidateInfo(data) {
    this.liquidateInfo = data;
  }

  @action
  setLiquidateOriginalInfo(data) {
    this.liquidateOriginalInfo = data;
  }

  @action
  setData(name, value) {
    this[name] = value;
  }

  setVariablesInterval = async () => {
    const { market, user, network } = this.rootStore;
    if (!this.interval) {
      await this.getLatestBlockInfo();
      this.interval = setInterval(async () => {
        await this.getMintPaused();
        await this.getPaused();
        await this.getLatestBlockInfo();
        await market.getMintInfo();
      }, defaultIntervalSeconds);
    }

    if (!this.backendInterval) {
      this.backendInterval = setInterval(async () => {
        await market.getMarketData();
        await user.getUserData();
        await user.getUserDataFromMarkets();
        await market.getDashboardData();

        if (network.isConnected) {
          await market.getTokenBalanceInfo();
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

  getLatestBlockInfo = async () => {
    const res = await getLatestBlockInfo();
    if (!res.success) {
      if (this.latestBlockInfo !== null) {
        return;
      }
      if (!!window.localStorage.getItem('latestBlockInfo')) {
        this.setData('latestBlockInfo', JSON.parse(window.localStorage.getItem('latestBlockInfo')));
        return;
      }
      return;
    }

    this.setData('latestBlockInfo', {
      number: res.number,
      timestamp: res.timestamp
    });
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
      this.setOpenMint(false);
    } else {
      this.setOpenMint(true);
    }

    if (BigNumber(currentTime).gte(Config.dualMiningStartTime)) {
      this.setOpenDualMint(true);
    } else {
      this.setOpenDualMint(false);
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
      const currentBlock = await calculateCurrentBlock(this.latestBlockInfo);
      if (currentBlock !== null) {
        this.setData('nowBlock', currentBlock);
        window.nowBlock = currentBlock;
        return currentBlock;
      }
    } catch (err) {
      console.log('Failed to update current block: ', err);
    }
  };

  showBorrowModal = (item, type) => {
    this.setBorrowModalInfo({ visible: true, jtokenAddress: item.jtokenAddress, type });
  };

  hideBorrowModal = () => {
    this.setBorrowModalInfo({ visible: false, jtokenAddress: '', type: '1' });
  };

  hideMortgageModal = () => {
    this.setMortgageModalInfo({ visible: false, jtokenAddress: '', type: 1 });
  };

  hideTotalCollateralPop = () => {
    this.setTotalCollateralShow(false);
  };

  collateralValid = symbol => {
    const { totalCollateral } = this.rootStore.user;
    if (totalCollateral.length >= Config.maxTotalCollateral && !totalCollateral.includes(symbol)) {
      this.setTotalCollateralShow(true);
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

    this.setEnergyFee(energyFee);
    return energyFee;
  };

  changeTheme = () => {
    const theme = this.theme === 'white' ? 'black' : 'white';
    this.setTheme(theme);
    window.localStorage.setItem('theme', theme);
  };

  collapseInit = (multiRewardData = this.multiRewardData) => {
    if (Object.keys(multiRewardData).length > 3) {
      this.setData('collapse', false);
    } else {
      this.setData('collapse', true);
    }
  };

  getAmountLimit = async () => {
    try {
      const res = await getAmountLimit();
      if (res.success) {
        this.setMinStakeAmount(
          BigNumber(BigNumber(res.minStakeAmount).div(Config['usdt'].precision)._toFixed(0, 1)).eq(
            BigNumber(res.minStakeAmount).div(Config['usdt'].precision)
          )
            ? BigNumber(res.minStakeAmount).div(Config['usdt'].precision)
            : BigNumber(BigNumber(res.minStakeAmount).div(Config['usdt'].precision)._toFixed(0, 1)).plus(1)
        );
      }
    } catch (err) {
      console.log('getAmountLimit', err);
    }
  };

  getWstUSDTBalanceInfo = async (accountAddress, tokens, jtokens) => {
    if (!this.rootStore.network.isConnected) return;

    const balanceInfo = await getBalanceStUsdtInfo(accountAddress, tokens, jtokens, this.rootStore.market.balanceInfo);
    let wstUSDTbalanceInfo = { ...balanceInfo };
    this.setWstUSDTbalanceInfo(wstUSDTbalanceInfo);
  };

  getMintPaused = async () => {
    try {
      const res = await getMintPaused();
      if (res.success) {
        this.setMintPaused(BigNumber(res.mintPaused).toString());
      }
    } catch (err) {
      console.log('getMintPaused', err);
    }
  };

  getPaused = async () => {
    try {
      const res = await getPaused();
      if (res.success) {
        this.setPaused(BigNumber(res.paused).toString());
      }
    } catch (err) {
      console.log('getPaused', err);
    }
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

        this.setLiquidateInfo({
          ...result,
          accounts: account
        });
        this.setLiquidateOriginalInfo({ ...result });

        const { accounts, jtokens } = result;
        let promiseFunc = [];

        for (const items of accounts) {
          if (items.borrowTokenList.length) {
            for (const item of items.borrowTokenList) {
              const balanceRes = this.getBalance(item.tokenAddress, jtokens['j' + item.symbol], item.symbol);
              promiseFunc.push(balanceRes);
            }
          }
        }

        await Promise.allSettled(promiseFunc);
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

      if (betaInfo?.length > 0) {
        let betaMap = {
          '1': 'rent',
          '2': 'liquidate',
          '3': 'settings'
        };

        this.setData('showAccountBeta', false);
        this.setData('hasSettingsBetaAuthority', false);
        this.setData('hasLiquidateBetaAuthority', false);
        this.setData('hasEnergyBetaAuthority', false);
        this.setData('betaModalVisible', false);

        await Promise.all(
          betaInfo.map(async item => {
            // whether user can see the beta icon
            let betaObj = this.applicationMap[betaMap[item.type]];

            if ([1, 2].includes(item.status) && betaObj?.phase === 1 && betaObj?.switchOn) {
              this.setData('showAccountBeta', true);
            }

            // whether user has the authority to see liquidate page
            if (item.type === 3 && [1, 2].includes(item.status)) {
              this.setData('hasSettingsBetaAuthority', true);
            }

            // whether user has the authority to see liquidate page
            if (item.type === 2 && [1, 2].includes(item.status)) {
              this.setData('hasLiquidateBetaAuthority', true);
            }

            // whether user has the authority to see new energy rent page
            if (item.type === 1 && [1, 2].includes(item.status)) {
              this.setData('hasEnergyBetaAuthority', true);
            }
            // beta modal show or hide
            if ([1, 3].includes(item.status)) {
              this.setData('betaModalVisible', true);
              updateBetaInfo({
                // 'accessToken': 'tronsmart',
                accessToken: await this.rootStore.settings.encryptSignInfo('lend'),
                address,
                listType: item.type,
                status: item.status + 1
              });
            }
          })
        );
      }

      this.setData('betaInfo', betaInfo);

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
        this.setData('totalRCLength', 1);
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
          this.setData('totalRCLength', result.data.filter(item => item.switchOn && item.phase === 1)?.length);
          if (this.totalRCLength > 3) this.setData('totalRCLength', 3); // for prevent test env backend length err
        }
      }

      if (
        (applicationMap['rent']?.switchOn && applicationMap['rent']?.phase === 1) ||
        (applicationMap['liquidate']?.switchOn && applicationMap['liquidate']?.phase === 1) ||
        (applicationMap['settings']?.switchOn && applicationMap['settings']?.phase === 1)
      ) {
        applicationMap['canApply'] = true;
      } else {
        applicationMap['canApply'] = false;
      }

      this.setData('applicationMap', applicationMap);
    } catch (err) {
      console.log('getBetaInfo', err);
    }
  };

  getFullNodeInfo = async () => {
    try {
      const res = await getBaseInfo();
      if (res.success) {
        const timestamp = res.timestamp;
        const serverTimeStamp = res.serverTimeStamp;

        if (serverTimeStamp - timestamp > 30 * 1000) {
          this.setData('fullNodeError', true);
        } else {
          this.setData('fullNodeError', false);
        }
      }
    } catch (err) {
      console.log('get fullnode info error', err);
    }
  };
}
