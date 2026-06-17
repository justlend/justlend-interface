import { makeAutoObservable, runInAction } from 'mobx';
import intl from 'react-intl-universal';

import { getPendingLiquidations, getLiquidationRecords, getLiquidationTokens } from '../../service/V2backend';
import { getBalanceNew, getTrxBalanceQuick } from '../../utils/blockchain';
import { getAllowance, getMarketParams } from '../../service/V2QueryService';
import { BigNumber, toFixedUp } from '../../utils/helper';
import Config from '../../config/v2config';

const { tokens, additionalCallBackTime, defaultAddedFeeBuffer, defaultReserveFee, trxDecimal } = Config;
const { WTRX: WTRXAddress } = tokens;

export default class LiquidationStore {
  activeTab = 'pending'; // 'pending' 'public' 'bot'
  updateTime = 0;
  pendingLiquidationList = null;
  publicLiquidationList = null;
  botLiquidationList = null;
  listCount = 0;
  debtTokens = [];
  collateralTokens = [];
  isFiltered = false;
  filters = {
    debtTokens: [],
    collateralTokens: [],
    minRiskLevel: '',
    maxRiskLevel: ''
  };
  sortKey = '';
  estimatedFee = '';
  sort = 'asc';
  currentPage = 1;
  pageSize = 20;
  listLoading = false;
  moreLoading = false;
  liquidationDetail = {};
  liquidationBoxVisible = false;
  inputAmount = '';
  marketParams = null;
  tokenBalance = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  getDataInterval = () => {
    let timer = setInterval(() => {
      this.getInfo(this.activeTab);
      this.fetchSearchTokens();
    }, 60000);
    return timer;
  };

  fetchSearchTokens = async () => {
    try {
      const res = await getLiquidationTokens();
      if (res.success) {
        runInAction(() => {
          this.debtTokens = res.data.loanSymbols?.map(symbol => ({ label: symbol, value: symbol })) || [];
          this.collateralTokens = res.data.collateralSymbols?.map(symbol => ({ label: symbol, value: symbol })) || [];
        });
      }
    } catch (error) {
      console.log('fetchSearchTokens', error);
      this.debtTokens = [];
      this.collateralTokens = [];
    }
  };

  fetchMarketParams = async marketId => {
    try {
      const data = await getMarketParams(marketId);
      runInAction(() => {
        this.marketParams = data;
      });
    } catch (error) {
      console.log('fetchMarketParams', error);
      this.marketParams = null;
    }
  };

  getPendingLiquidationInfo = async (needLoading = true) => {
    this.currentPage === 1 ? (this.listLoading = needLoading) : (this.moreLoading = true);
    try {
      const newParams = {
        page: 1,
        pageSize: this.currentPage * 10
      };
      const { debtTokens, collateralTokens, minRiskLevel, maxRiskLevel } = this.filters;

      if (this.sortKey && this.sort) {
        newParams.sort = this.sortKey;
        newParams.order = this.sort;
      }

      if (debtTokens?.length > 0) {
        newParams.debt = debtTokens;
        window.sessionStorage.setItem('liquidation_debtTokens', JSON.stringify(debtTokens));
      } else {
        window.sessionStorage.removeItem('liquidation_debtTokens');
      }

      if (collateralTokens?.length > 0) {
        newParams.collateral = collateralTokens;
        window.sessionStorage.setItem('liquidation_collateralTokens', JSON.stringify(collateralTokens));
      }else {
        window.sessionStorage.removeItem('liquidation_collateralTokens');
      }

      if (minRiskLevel) {
        newParams.minRiskLevel = minRiskLevel;
      }
      if (maxRiskLevel) {
        newParams.maxRiskLevel = maxRiskLevel;
      }

      const res = await getPendingLiquidations(newParams);
      if (res?.success) {
        runInAction(() => {
          const list = res.data?.list || [];
          this.pendingLiquidationList = list;
          this.listCount = res.data?.totalCount || 0;
          this.updateTime = res.data?.updateTime;
        });
      }
    } catch (error) {
      console.error('Failed to fetch pending data', error);
      this.pendingLiquidationList = [];
      this.listCount = 0;
      // this.updateTime = data.data?.updateTime;
    } finally {
      runInAction(() => {
        this.currentPage === 1 ? (this.listLoading = false) : (this.moreLoading = false);
      });
    }
  };

  getPublicLiquidationInfo = async () => {
    this.currentPage === 1 ? (this.listLoading = true) : (this.moreLoading = true);
    try {
      const result = await getLiquidationRecords({
        type: 'public',
        debt: '',
        collateral: '',
        page: this.currentPage,
        pageSize: this.pageSize
      });
      console.log(result, 'result');
      if (result.success) {
        this.publicLiquidationList = result?.data?.list;
      }
    } catch (error) {
      console.error('Failed to fetch public data', error);
    } finally {
      runInAction(() => {
        this.currentPage === 1 ? (this.listLoading = false) : (this.moreLoading = false);
      });
    }
  };

  getBotLiquidationInfo = async () => {
    this.currentPage === 1 ? (this.listLoading = true) : (this.moreLoading = true);
    try {
      const result = await getLiquidationRecords({
        type: 'bot',
        debt: '',
        collateral: '',
        page: this.currentPage,
        pageSize: this.pageSize
      });

      if (result.success) {
        this.botLiquidationList = result?.data?.list;
      }
    } catch (error) {
      console.error('Failed to fetch bot data', error);
    } finally {
      runInAction(() => {
        this.currentPage === 1 ? (this.listLoading = false) : (this.moreLoading = false);
      });
    }
  };

  getInfo = (type = 'all') => {
    if (type === 'all') {
      this.getPendingLiquidationInfo();
      this.getPublicLiquidationInfo();
      this.getBotLiquidationInfo();
    } else if (type === 'pending') {
      this.getPendingLiquidationInfo();
    } else if (type === 'public') {
      this.getPublicLiquidationInfo();
    } else if (type === 'bot') {
      this.getBotLiquidationInfo();
    }
  };

  setActiveTab = tab => {
    this.activeTab = tab;
    this.clearSearch();
  };

  setInputAmount = amount => {
    this.inputAmount = amount;
  };

  setLiquidationBoxVisible = visible => {
    this.liquidationBoxVisible = visible;
  }

  clearSearch = (isFetch = true) => {
    this.currentPage = 1;
    this.filters = {
      debtTokens: [],
      collateralTokens: [],
      minRiskLevel: '',
      maxRiskLevel: ''
    };
    this.sortKey = '';
    this.sort = 'asc';

    if (isFetch) {
      this.getInfo(this.activeTab);
    }
  };

  setFilters = (filterType, value, isFetchNow = true) => {
    this.filters[filterType] = value;

    if (isFetchNow) {
      this.currentPage = 1;
      this.isFiltered = true;
      this.getInfo(this.activeTab);
    }
  };

  handleSort = key => {
    if (this.sortKey !== key) {
      // init when click new tab
      this.setSortKey(key);
      this.setSort('asc');
    } else {
      // click the same tab
      if (this.sort === 'asc') {
        this.setSort('desc');
      } else if (this.sort === 'desc') {
        this.setSort('');
      } else if (this.sort === '') {
        this.setSort('asc');
      }
    }
    this.getInfo(this.activeTab);
  };

  setSortKey = sortKey => {
    this.sortKey = sortKey;
  };

  setSort = sort => {
    this.sort = sort;
  };

  setLiquidationDetail = data => {
    this.liquidationDetail = data;
  };

  handleLoadMore = () => {
    if (this.moreLoading) return;
    const page = this.currentPage + 1;
    this.setPage(page);
  };

  setPage = page => {
    this.currentPage = page;
    this.getInfo(this.activeTab);
  };

  getTokenBalance = async (tokenAddress, decimal) => {
    if (this.rootStore.network.defaultAccount) {
      const userAddress = this.rootStore.network.defaultAccount;
      runInAction(() => {
        this.tokenBalance = null;
      })
      try {
        const balanceInfo = await getBalanceNew(userAddress, [tokenAddress]);

        runInAction(() => {
          this.tokenBalance = balanceInfo[tokenAddress]?.div(BigNumber(10).pow(decimal)) || null;
        })
      } catch (error) {
        console.error('Failed to fetch user balance', error);
      }
    }
  }

  estimateLiquidateFee = async (amountToEstimate) => {
    const amountBN = new BigNumber(amountToEstimate);
    if (amountBN.isNaN() || amountBN.lte(0)) {
      runInAction(() => {
        this.estimatedFee = '';
      });
      return;
    }
    try {
      const energy = await this.rootStore.systemV2.estimateLiquidateTrxGas(
        amountToEstimate,
      );
      const energyFeeRate = await this.rootStore.lend.getEnergyFee();

      const feeInSun = new BigNumber(energy).times(energyFeeRate);
      const feeInTrx = feeInSun.div(1e6).plus(defaultAddedFeeBuffer);
      const feeInTrxBN = toFixedUp(feeInTrx, trxDecimal);
      const result = feeInTrx.gt(0) ? feeInTrxBN.toString() : defaultReserveFee;

      runInAction(() => {
        this.estimatedFee = result;
      });
      return result;
    } catch (e) {
      this.estimatedFee = defaultReserveFee;
      console.error('Failed to estimate fee:', e);
      return defaultReserveFee;
    }
  };

  
  getLoanTokenAmount = async (seizedAssets, repaidShares) => {
    const { systemV2: protocolService } = this.rootStore;
    const { collateralDecimal, borrowDecimal, marketId } = this.liquidationDetail;
    const loanTokenAesult = await protocolService.getLoanTokenAmountNeed(marketId, seizedAssets, repaidShares, collateralDecimal);

    if (loanTokenAesult && loanTokenAesult[0]) {
      const amountNeed = new BigNumber(loanTokenAesult[0], 16).div(BigNumber(10).pow(borrowDecimal));
      return amountNeed;
    }
  }

  executeLiquidate = async (amountToLiquidate, seizedAssets, repaidShares) => {
    const {
      systemV2: protocolService,
      network: networkStore,
      transactionV2: transactionStore,
      system: systemStore
    } = this.rootStore;
    const userAddress = networkStore.defaultAccount;
    const {
      borrowAddress,
      borrowSymbol,
      borrowDecimal,
      collateralDecimal,
      userAddress: borrowerAddress,
      marketId,
    } = this.liquidationDetail;

    const approveBuffer = 1.1; 
    const amount = amountToLiquidate;
    const amountInChain = new BigNumber(amount).times(10 ** borrowDecimal).times(approveBuffer);

    let finalTxId = '';
    let steps = [];
    try {
      const allowance = await getAllowance(borrowAddress, userAddress, Config.contracts.PublicLiquidatorProxy);

      if (allowance.lt(amountInChain)) {
        steps.push({
          name: intl.get('jlv2.transaction.approve'),
          status: 'pending',
          amount: 'Unlimit',
          token: borrowSymbol,
          action: v2ModalInfo => protocolService.approve(borrowAddress, Config.contracts.PublicLiquidatorProxy, v2ModalInfo),
          type: 'approve'
        });
      }

      steps.push({
        name: intl.get('jlv2.transaction.liquidation'),
        status: 'pending',
        amount: amount,
        token: borrowSymbol,
        action: v2ModalInfo =>
          protocolService.liquidate(
            marketId,
            borrowerAddress,
            seizedAssets,
            repaidShares,
            collateralDecimal,
            v2ModalInfo
          )
      });

      systemStore.openTransactionModalV2('', steps);

      for (const step of steps) {
        const v2ModalInfo = {
          description: `${intl.get('jlv2.transaction.current_action', { action: step.name })}`,
          steps: systemStore.transactionStateV2.steps,
          txnType: 'liquidate',
        };
        this.currentActionName = step.name;
        
        const result = await step.action(v2ModalInfo);
        finalTxId = result.transaction.txID;
        this.currentFinalTxId = finalTxId;

        systemStore.updateStepStatusV2(step.name, 'waiting');
        await transactionStore.awaitTxConfirmation(finalTxId);

        if (step.type === 'approve') {
          const newAllowance = await getAllowance(borrowAddress, userAddress, Config.contracts.PublicLiquidatorProxy);

          if (newAllowance.lt(amountInChain)) {
            systemStore.updateStepStatusV2(step.name, 'failed');
            throw new Error(intl.get('v2.vote.approve_tip'));
          }
        }

        systemStore.updateStepStatusV2(step.name, 'success');
      }

      let modalTitle = intl.get('jlv2.transaction.liquidation_success');
      systemStore.setFinalStatusV2('success', modalTitle, finalTxId);

      this.getPendingLiquidationInfo(false);
      setTimeout(() => {
        this.getPendingLiquidationInfo(false);
      }, additionalCallBackTime);
      runInAction(() => {
        this.inputAmount = '';
        this.liquidationDetail = {};
        this.liquidationBoxVisible = false;
      });
    } catch (error) {
      console.error('liquidate failed:', error);
      if (systemStore.transactionStateV2.finalStatus !== 'failed') {
        let errorMessage = JSON.stringify(error);
        let errorTitle = intl.get('jlv2.transaction.failed_on_chain');
        let isRejected = false;
        let errorDesc = '';
        const insufficientAllowanceMsg = intl.get('v2.vote.approve_tip');

        if (error?.message === insufficientAllowanceMsg) {
          errorTitle = insufficientAllowanceMsg;
          const minApprove = BigNumber(amount).times(approveBuffer).decimalPlaces(borrowDecimal, BigNumber.ROUND_UP).toString();
          errorDesc = intl.get('jlv2.transaction.liquidation_approve_error', { amount: minApprove, token: borrowSymbol });
          isRejected = false;
          this.currentFinalTxId = '';
        } else if (error?.message?.includes('timed out')) {
          errorTitle = intl.get('jlv2.transaction.timeout');
        } else if (
          errorMessage.includes('denied') ||
          errorMessage.includes('declined') ||
          errorMessage.includes('cancel') ||
          errorMessage.includes('cancle') ||
          errorMessage.includes('rejected') ||
          error?.code === 4001 ||
          systemStore.rejected
        ) {
          isRejected = true;
          this.currentFinalTxId = '';
          const lang = window.localStorage.getItem('lang') || intl.options.currentLocale;
          errorTitle = `${lang === 'en-US' ? '' : this.currentActionName}${intl.get('jlv2.transaction.tips4')}`;
        }

        let txnType = 'liquidate';

        if (error?.message?.includes('liquidate trigger failed')) {
          txnType = 'liquidateTrigger';
          errorTitle = intl.get('jlv2.transaction.liquidation_error');
          errorDesc = intl.get('jlv2.transaction.liquidation_trigger_error');
        }

        systemStore.setFinalStatusV2('failed', errorTitle, this.currentFinalTxId, { isRejected, errorDesc, txnType });
      }
    }
  };
}
