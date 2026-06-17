// src/stores/JLv2/VaultStore.js
import { makeAutoObservable, runInAction } from 'mobx';
import { getVaultInfo, getVaultApyHistory, getVaultMyPosition, getVaultAllocation } from '../../service/V2backend.js';
import { getTrxBalanceQuick, getTRC20Balance, maxDeposit } from '../../utils/blockchain';
import { getAllowance } from '../../service/V2QueryService';
import { BigNumber, toFixedUp } from '../../utils/helper';
import { stripTrailingZeros, formatTokenSymbol, formatVaultName } from '../../utils/formatters';
import Config from '../../config/v2config';
import intl from 'react-intl-universal';
const {
  tokens,
  defaultReserveFee,
  defaultAddedFeeBuffer,
  additionalCallBackTime,
  additionalCallBackTimeForVault,
  trxDecimal,
  trc20Decimal
} = Config;
const { WTRX: WTRXAddress } = tokens;

const getSafeDecimals = (decimalsValue, fallback = 0) => {
  const parsed = Number(decimalsValue);
  if (Number.isInteger(parsed) && parsed >= 0) return parsed;
  const fallbackParsed = Number(fallback);
  return Number.isInteger(fallbackParsed) && fallbackParsed >= 0 ? fallbackParsed : 0;
};

export default class VaultStore {
  // --- Observables (State) ---
  vaultDetails = {};
  myPosition = { depositAmount: '0', depositUsd: '0' };
  historicalData = [];
  marketAllocations = [];
  remainSupplyCap = null;
  walletBalance = '-';

  isLoading = true;
  vaultAddressError = false;
  activeActionTab = 'supply'; // 'supply' or 'withdraw'
  inputAmount = '';
  inputError = '';
  hasWarning = false;
  estimatedFee = '-';
  showFeeSuggestion = false;
  maxDepositTimer = null;
  feeEstimationTimer = null;
  estimatedDailyEarnings = '0';
  availableAmount = '-';
  withdrawWithShares = false;

  isActionInProgress = false;
  currentActionName = '';
  currentFinalTxId = '';

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  // --- Computed ---
  get sortedMarketAllocations() {
    if (!this.marketAllocations) return [];
    return this.marketAllocations.slice().sort((a, b) => {
      return parseFloat(b.percent) - parseFloat(a.percent);
    });
  }

  get isInputAmountValid() {
    const amount = new BigNumber(this.inputAmount);
    if (amount.isNaN() || amount.lte(0)) return false;
    return !this.inputError;
  }

  getDataInterval = (vaultAddress, userAddress) => {
    let timer = setInterval(() => {
      this.fetchAllVaultData(vaultAddress, userAddress, false);
      this.rootStore.dashboardStore?.bumpMiningRefresh?.();
    }, 60000);
    return timer;
  };

  // --- Actions ---
  fetchAllVaultData = async (vaultAddress, userAddress, needLoading = true) => {
    if (needLoading) {
      this.isLoading = true;
      runInAction(() => {
        this.activeActionTab = 'supply';
        this.inputAmount = '';
        this.inputError = '';
        this.vaultAddressError = false;
        this.showFeeSuggestion = false;
        this.estimatedFee = '-';
        this.hasWarning = false;
        this.myPosition = { depositAmount: '0', depositUsd: '0' };
        this.walletBalance = '-';
        this.availableAmount = '-';
        this.withdrawWithShares = false;
      });
    }
    try {
      const publicPromises = [
        getVaultInfo(vaultAddress),
        getVaultAllocation({ address: vaultAddress }),
        getVaultApyHistory(vaultAddress)
      ];

      let userSpecificPromises = [];
      if (userAddress) {
        userSpecificPromises.push(getVaultMyPosition(vaultAddress, userAddress));
      }

      const [detailsResult, allocationResult, historyResult] = await Promise.all(publicPromises);
      // invalid vaultAddress error
      if (detailsResult?.code === 202 || detailsResult?.code === '202') {
        this.vaultAddressError = true;
        throw new Error('Failed to fetch vault details');
      }
      if (!detailsResult?.data) {
        throw new Error('Failed to fetch vault details');
      }
      const vaultDetails = detailsResult.data;

      if (vaultDetails) {
        if (vaultDetails.asset === WTRXAddress) {
          vaultDetails.assetSymbol = 'TRX';
        }
        vaultDetails.name = formatVaultName(vaultDetails.name);
        vaultDetails.desc = formatVaultName(vaultDetails.desc);
      }

      if (userAddress && vaultDetails) {
        if (vaultDetails.asset === WTRXAddress) {
          userSpecificPromises.push(getTrxBalanceQuick(userAddress));
        } else if (vaultDetails.asset) {
          userSpecificPromises.push(getTRC20Balance(vaultDetails.asset, userAddress));
        } else {
          
          userSpecificPromises.push(Promise.resolve({ success: false }));
        }

        const [positionResult, balanceResult] = await Promise.all(userSpecificPromises);

        runInAction(() => {
          this.myPosition = positionResult?.data || {};
          this.availableAmount = BigNumber.min(
            positionResult?.data?.depositAmount || 0,
            vaultDetails?.liquidity || 0
          ).toString();

          if (balanceResult?.success) {
            const defaultDecimals = vaultDetails.asset === WTRXAddress ? trxDecimal : trc20Decimal;
            const assetDecimals = getSafeDecimals(vaultDetails.assetDecimal, defaultDecimals);
            let balance = BigNumber(balanceResult.value).div(new BigNumber(10).pow(assetDecimals));
            if (vaultDetails.asset === WTRXAddress) {
              balance = balanceResult.balance;
            }
            this.walletBalance = balance.toString();
          }
        });
      }

      runInAction(() => {
        this.vaultDetails = vaultDetails;
        this.vaultAddressError = false;
        this.marketAllocations =
          allocationResult?.data?.list?.map(item => {
            item.borrowToken.symbol = formatTokenSymbol(item.borrowToken.address, item.borrowToken.symbol);
            item.collateralToken.symbol = formatTokenSymbol(item.collateralToken.address, item.collateralToken.symbol);
            return item;
          }) || [];
        this.remainSupplyCap = allocationResult?.data?.remainSupplyCap;
        this.historicalData = historyResult?.data || {};
      });
    } catch (error) {
      console.error('Failed to fetch vault data', error);
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });

      const energyFeeRate = await this.rootStore.lend.getEnergyFee();
      runInAction(() => {
        if (this.vaultDetails) {
          this.vaultDetails.energyFeeRate = energyFeeRate;
        }
      });
    }
  };

  setActionTab = tab => {
    if (this.isLoading) return; // loading skeleton
    this.activeActionTab = tab;
    this.inputAmount = '';
    this.inputError = '';
    this.showFeeSuggestion = false;
    this.estimatedFee = '-';
    this.hasWarning = false;
    this.withdrawWithShares = false;
  };

  setInputAmount = (amount, _options = {}) => {
    const { fromMaxClick = false } = _options;
    if (!fromMaxClick) this.withdrawWithShares = false;
    let cleanAmount = String(amount);
    if (cleanAmount.startsWith('0') && cleanAmount.length > 1) {
      if (cleanAmount[1] !== '.') {
        cleanAmount = '0';
      }
    }
    cleanAmount = cleanAmount.replace(/[^0-9.]/g, '');
    const decimalParts = cleanAmount.split('.');
    if (decimalParts.length > 2) {
      cleanAmount = `${decimalParts[0]}.${decimalParts.slice(1).join('')}`;
    }
    const assetDecimal = this.vaultDetails?.assetDecimal;
    if (decimalParts.length === 2) {
      const integerPart = decimalParts[0];
      let decimalPart = decimalParts[1];
      if (decimalPart.length > assetDecimal) {
        decimalPart = decimalPart.slice(0, assetDecimal);
        cleanAmount = `${integerPart}.${decimalPart}`;
      }
    }
    this.inputAmount = cleanAmount;

    let amountBN;
    try {
      amountBN = new BigNumber(cleanAmount);
      if (cleanAmount === '' || cleanAmount === '.' || amountBN.isNaN() || !amountBN.isFinite()) {
        amountBN = new BigNumber(0);
      }
    } catch {
      amountBN = new BigNumber(0);
    }

    const supplyApy = new BigNumber(this.vaultDetails?.apy || 0);

    let dailyEarnings = new BigNumber(0);
    if (amountBN.gt(0) && supplyApy.gt(0)) {
      dailyEarnings = amountBN.times(supplyApy).div(365);
    }

    runInAction(() => {
      this.estimatedDailyEarnings = dailyEarnings;
    });

    clearTimeout(this.feeEstimationTimer);
    clearTimeout(this.maxDepositTimer);
    this.inputError = '';
    this.hasWarning = false;
    if (new BigNumber(cleanAmount).plus(this.estimatedFee).lte(this.walletBalance)) {
      runInAction(() => {
        this.showFeeSuggestion = false;
      });
    } else {
      runInAction(() => {
        this.showFeeSuggestion = true;
      });
    }

    const walletBalanceBN = new BigNumber(this.walletBalance);
    const availableAmountBN = new BigNumber(this.availableAmount || '0');

    if (this.activeActionTab === 'supply') {
      if (amountBN.gt(walletBalanceBN)) {
        this.inputError = intl.get('jlv2.error.insufficient_wallet');
      } else if (amountBN.gt(this.remainSupplyCap)) {
        this.inputError = intl.get('jlv2.error.more_than_market');
      }
    }
    if (this.activeActionTab === 'withdraw') {
      if (amountBN.gt(availableAmountBN)) {
        this.withdrawWithShares = false;
        if (availableAmountBN.eq(this.vaultDetails?.liquidity)) {
          this.inputError = intl.get('jlv2.error.insufficient_liquidity');
        } else {
          this.inputError = intl.get('jlv2.error.exceed_supply_amount');
        }
      }
      if (
        BigNumber(this.availableAmount).eq(this.myPosition?.depositAmount) &&
        amountBN.eq(new BigNumber(this.myPosition?.depositAmount)) &&
        amountBN.gt(0)
      ) {
        // this.withdrawAll = true;
        this.hasWarning = false;
      } else if (
        BigNumber(this.availableAmount).eq(this.vaultDetails?.liquidity) &&
        amountBN.eq(new BigNumber(this.vaultDetails?.liquidity))
      ) {
        this.hasWarning = true;
        this.withdrawWithShares = false;
      }
    }

    if (this.vaultDetails?.asset === WTRXAddress && amountBN.gt(0) && !this.inputError) {
      this.feeEstimationTimer = setTimeout(() => {
        this.estimateSupplyFee(cleanAmount).then(() => {
          const reserveFee = this.estimatedFee;
          if (amountBN.gt(walletBalanceBN.minus(reserveFee))) {
            runInAction(() => {
              this.showFeeSuggestion = true;
            });
          } else {
            runInAction(() => {
              this.showFeeSuggestion = false;
            });
          }
        });
      }, 300);
    } else {
      runInAction(() => {
        this.estimatedFee = '-';
      });
    }
  };

  setReservedFee = () => {
    runInAction(() => {
      const remainAmount = new BigNumber(this.walletBalance).minus(this.estimatedFee || defaultReserveFee);
      if (remainAmount.lte(0)) {
        this.inputAmount = 0;
      } else {
        this.inputAmount = remainAmount;
      }
      this.showFeeSuggestion = false;
    });
  };

  estimateSupplyFee = async amountToEstimate => {
    const amountBN = new BigNumber(amountToEstimate);
    if (amountBN.isNaN() || amountBN.lte(0)) {
      runInAction(() => {
        this.estimatedFee = '-';
      });
      return;
    }
    try {
      const energy = await this.rootStore.systemV2.estimateSupplyTrxGas(
        this.vaultDetails.address,
        amountToEstimate,
        this.vaultDetails.assetDecimal
      );
      const energyFeeRate = this.vaultDetails.energyFeeRate || (await this.rootStore.lend.getEnergyFee());

      const feeInSun = new BigNumber(energy).times(energyFeeRate);
      const feeInTrx = feeInSun.div(1e6).plus(defaultAddedFeeBuffer);
      const feeInTrxBN = toFixedUp(feeInTrx, 6);

      runInAction(() => {
        this.estimatedFee = feeInTrx.gt(0) ? feeInTrxBN.toString() : defaultReserveFee;
      });
    } catch (e) {
      console.error('Failed to estimate fee:', e);
    }
  };

  handleMaxClick = async () => {
    const { depositAmount } = this.myPosition || {};
    if (this.activeActionTab === 'withdraw') {
      if (BigNumber(this.availableAmount).eq(depositAmount)) {
        this.withdrawWithShares = true;
      } else {
        this.withdrawWithShares = false;
      }
      const cleanMaxWithdraw = stripTrailingZeros(this.availableAmount || '0');
      this.setInputAmount(cleanMaxWithdraw, { fromMaxClick: true });
      return;
    }
    if (this.vaultDetails?.asset === WTRXAddress) {
      const walletBalanceBN = new BigNumber(this.walletBalance);
      let maxAmount = walletBalanceBN;
      let reserveFee = defaultReserveFee;
      if (walletBalanceBN.gt(0)) {
        await this.estimateSupplyFee(walletBalanceBN.toString());
        const estimatedTrx = this.estimatedFee;
        reserveFee = estimatedTrx && !isNaN(estimatedTrx) ? estimatedTrx : reserveFee;
        console.log('Estimated reserve fee for max withdraw:', reserveFee);
      }
      // maxAmount = walletBalanceBN.minus(reserveFee);
      if (maxAmount.lt(0)) {
        maxAmount = new BigNumber(0);
      }
      runInAction(() => {
        this.showFeeSuggestion = walletBalanceBN.gt(0);
      });

      const cleanMaxSupply = stripTrailingZeros(maxAmount);
      this.setInputAmount(cleanMaxSupply, { fromMaxClick: true });
    } else {
      this.setInputAmount(this.walletBalance);
    }
  };

  executeSupply = async () => {
    window.gtag('event', 'PC_vault_detail_supply', { 'event_category': 'PC_V2', 'event_label': 'vault_detail_supply' });

    if (this.isActionInProgress) return;
    if (!this.vaultDetails || !this.isInputAmountValid) return;

    runInAction(() => {
      this.isActionInProgress = true;
    });

    const {
      systemV2: protocolService,
      network: networkStore,
      transactionV2: transactionStore,
      system: systemStore
    } = this.rootStore;
    const userAddress = networkStore.defaultAccount;
    const { address: vaultAddress, asset: assetAddress, assetDecimal = 6, assetSymbol } = this.vaultDetails;
    const amountInChain = new BigNumber(this.inputAmount).times(10 ** assetDecimal);

    let finalTxId = '';
    let steps = [];
    try {
      if (assetAddress === WTRXAddress) {
        steps.push({
          name: intl.get('jlv2.transaction.supply') + ' TRX',
          status: 'pending',
          amount: this.inputAmount,
          token: assetSymbol,
          action: v2ModalInfo => protocolService.depositTrxToVault(vaultAddress, this.inputAmount, v2ModalInfo)
        });
      } else {
        const allowance = await getAllowance(assetAddress, userAddress, vaultAddress);
        if (allowance.lt(amountInChain)) {
          steps.push({
            name: intl.get('jlv2.transaction.approve'),
            status: 'pending',
            amount: 'Unlimit',
            token: assetSymbol,
            action: v2ModalInfo => protocolService.approve(assetAddress, vaultAddress, v2ModalInfo),
            type: 'approve'
          });
        }
        steps.push({
          name: intl.get('jlv2.transaction.supply'),
          status: 'pending',
          amount: this.inputAmount,
          token: assetSymbol,
          action: v2ModalInfo =>
            protocolService.depositToVault(vaultAddress, this.inputAmount, assetDecimal, v2ModalInfo)
        });
      }

      systemStore.openTransactionModalV2('', steps);

      window.gtag('event', 'PC_vault_supply_pop', { 'event_category': 'PC_V2', 'event_label': 'vault_supply_pop' });

      // const callbacks = this.rootStore.systemV2._getVaultCallbacks(vaultAddress, userAddress);

      for (const step of steps) {
        const v2ModalInfo = {
          description: `${intl.get('jlv2.transaction.current_action', { action: step.name })}`,
          steps: systemStore.transactionStateV2.steps
        };
        this.currentActionName = step.name;
        
        const result = await step.action(v2ModalInfo);
        finalTxId = result.transaction.txID;
        this.currentFinalTxId = finalTxId;

        systemStore.updateStepStatusV2(step.name, 'waiting');
        await transactionStore.awaitTxConfirmation(finalTxId);

        if (step.type === 'approve') {
          const newAllowance = await getAllowance(assetAddress, userAddress, vaultAddress);

          if (newAllowance.lt(amountInChain)) {
            systemStore.updateStepStatusV2(step.name, 'failed');
            throw new Error(intl.get('v2.vote.approve_tip'));
          }
        }

        systemStore.updateStepStatusV2(step.name, 'success');
      }

      let modalTitle = `${this.inputAmount} ${assetSymbol}${intl.get('jlv2.transaction.tips7')}`;
      if (steps.length > 1) {
        modalTitle = intl.get('jlv2.transaction.successul');
      }
      systemStore.setFinalStatusV2('success', modalTitle, finalTxId);

      window.gtag('event', 'PC_vault_supply_success', {
        'event_category': 'PC_V2',
        'event_label': 'vault_supply_success'
      });

      const bumpMining = () => this.rootStore.dashboardStore?.bumpMiningRefresh?.();
      this.fetchAllVaultData(vaultAddress, userAddress, false);
      bumpMining();
      setTimeout(() => {
        this.fetchAllVaultData(vaultAddress, userAddress, false);
        bumpMining();
      }, additionalCallBackTime);
      setTimeout(() => {
        this.fetchAllVaultData(vaultAddress, userAddress, false);
        bumpMining();
      }, additionalCallBackTimeForVault);
      runInAction(() => {
        this.inputAmount = '';
      });
    } catch (error) {
      console.error('Vault supply failed:', error);
      if (systemStore.transactionStateV2.finalStatus !== 'failed') {
        let errorMessage = JSON.stringify(error);
        let errorTitle = intl.get('jlv2.transaction.failed_on_chain');
        let isRejected = false;
        const insufficientAllowanceMsg = intl.get('v2.vote.approve_tip');

        if (error?.message === insufficientAllowanceMsg) {
          errorTitle = insufficientAllowanceMsg;
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
        systemStore.setFinalStatusV2('failed', errorTitle, this.currentFinalTxId, { isRejected });
      }
    } finally {
      runInAction(() => {
        this.isActionInProgress = false;
      });
    }
  };

  executeWithdraw = async () => {
    window.gtag('event', 'PC_vault_detail_withdraw', {
      'event_category': 'PC_V2',
      'event_label': 'vault_detail_withdraw'
    });

    if (this.isActionInProgress) return;
    if (!this.vaultDetails || !this.isInputAmountValid) return;

    runInAction(() => {
      this.isActionInProgress = true;
    });

    const {
      systemV2: protocolService,
      network: networkStore,
      transactionV2: transactionStore,
      system: systemStore
    } = this.rootStore;
    const userAddress = networkStore.defaultAccount;
    const { address: vaultAddress, assetDecimal = 6, assetSymbol, asset: assetAddress } = this.vaultDetails;
    const { shareAmount } = this.myPosition || {};
    const shareDecimals = assetDecimal;

    let finalTxId = '';
    let steps = [];

    try {
      if (assetAddress === WTRXAddress) {
        steps.push({
          name: intl.get('jlv2.record.withdraw') + ' TRX',
          status: 'pending',
          amount: this.inputAmount,
          token: assetSymbol,
          action: v2ModalInfo =>
            protocolService.redeemTrxFromVault(
              vaultAddress,
              this.inputAmount,
              shareDecimals,
              v2ModalInfo,
              this.withdrawWithShares ? shareAmount : ''
            )
        });
      } else {
        steps.push({
          name: intl.get('jlv2.record.withdraw'),
          status: 'pending',
          amount: this.inputAmount,
          token: assetSymbol,
          action: v2ModalInfo =>
            protocolService.redeemFromVault(
              vaultAddress,
              this.inputAmount,
              shareDecimals,
              v2ModalInfo,
              this.withdrawWithShares ? shareAmount : ''
            )
        });
      }

      systemStore.openTransactionModalV2('', steps);

      window.gtag('event', 'PC_vault_withdraw_pop', { 'event_category': 'PC_V2', 'event_label': 'vault_withdraw_pop' });

      // const callbacks = this.rootStore.systemV2._getVaultCallbacks(vaultAddress, userAddress);

      for (const step of steps) {
        
        const v2ModalInfo = {
          description: `${intl.get('jlv2.transaction.current_action', { action: step.name })}`,
          steps: systemStore.transactionStateV2.steps
        };
        this.currentActionName = step.name;
        
        const result = await step.action(v2ModalInfo);
        finalTxId = result.transaction.txID;
        this.currentFinalTxId = finalTxId;

        systemStore.updateStepStatusV2(step.name, 'waiting');

        await transactionStore.awaitTxConfirmation(finalTxId);

        systemStore.updateStepStatusV2(step.name, 'success');
      }

      let modalTitle = `${this.inputAmount} ${assetSymbol}${intl.get('jlv2.transaction.tips8')}`;
      if (this.withdrawWithShares) modalTitle = intl.get('jlv2.transaction.tips8_l');
      if (steps.length > 1) {
        modalTitle = intl.get('jlv2.transaction.successul');
      }
      systemStore.setFinalStatusV2('success', modalTitle, finalTxId);

      window.gtag('event', 'PC_vault_withdraw_success', {
        'event_category': 'PC_V2',
        'event_label': 'vault_withdraw_success'
      });

      const bumpMining = () => this.rootStore.dashboardStore?.bumpMiningRefresh?.();
      this.fetchAllVaultData(vaultAddress, userAddress, false);
      bumpMining();
      setTimeout(() => {
        this.fetchAllVaultData(vaultAddress, userAddress, false);
        bumpMining();
      }, additionalCallBackTime);
      setTimeout(() => {
        this.fetchAllVaultData(vaultAddress, userAddress, false);
        bumpMining();
      }, additionalCallBackTimeForVault);
      runInAction(() => {
        this.inputAmount = '';
        this.withdrawWithShares = false;
      });
    } catch (error) {
      console.error('Vault withdraw failed:', error);
      if (systemStore.transactionStateV2.finalStatus !== 'failed') {
        let errorMessage = JSON.stringify(error);
        let errorTitle = intl.get('jlv2.transaction.failed_on_chain');
        let isRejected = false;
        if (error?.message?.includes('timed out')) {
          errorTitle = intl.get('jlv2.transaction.timeout');
          this.currentFinalTxId = '';
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
          const lang = window.localStorage.getItem('lang') || intl.options.currentLocale;
          errorTitle = `${lang === 'en-US' ? '' : this.currentActionName}${intl.get('jlv2.transaction.tips4')}`;
          this.currentFinalTxId = '';
        }
        systemStore.setFinalStatusV2('failed', errorTitle, this.currentFinalTxId, { isRejected });
      }
    } finally {
      runInAction(() => {
        this.isActionInProgress = false;
      });
    }
  };
}
