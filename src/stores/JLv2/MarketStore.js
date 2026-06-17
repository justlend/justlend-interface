// src/stores/MarketStore.js
import { makeAutoObservable, action, runInAction } from 'mobx';
import intl from 'react-intl-universal';
import {
  getMarketInfo,
  getMarketMyPosition,
  getMarketBorrowHistory,
  getMarketVaultList
} from '../../service/V2backend';
import { getTRC20Balance, getTrxBalanceQuick } from '../../utils/blockchain';
import { getAllowance } from '../../service/V2QueryService';
import { BigNumber, toFixedUp, setLimit } from '../../utils/helper';
import { stripTrailingZeros, formatTokenSymbol, formatVaultName, calculateValue } from '../../utils/formatters';
import Config from '../../config/v2config';
const {
  tokens,
  defaultReserveFee,
  defaultAddedFeeBuffer,
  callValueRate,
  trxDecimal,
  trc20Decimal,
  trxPrecision,
  trc20Precision,
  additionalCallBackTime
} = Config;
const { WTRX: WTRXAddress } = tokens;

const getNumbValue = value => {
  try {
    const bn = BigNumber(value ?? 0);
    return bn.isFinite() ? bn : BigNumber(0);
  } catch {
    return BigNumber(0);
  }
};

const getSafeDecimals = (decimalsValue, fallback = 0) => {
  const parsed = Number(decimalsValue);
  if (Number.isInteger(parsed) && parsed >= 0) return parsed;
  const fallbackParsed = Number(fallback);
  return Number.isInteger(fallbackParsed) && fallbackParsed >= 0 ? fallbackParsed : 0;
};

export default class MarketStore {
  // --- Observables (State) ---
  marketDetails = {};
  myPosition = null;
  walletBalances = {
    loanToken: '-',
    collateralToken: '-'
  };
  fundingVaults = [];

  isLoading = true;
  marketIdError = false;
  isActionInProgress = false;
  activeActionTab = 'borrow_collateral';
  borrowInputAmount = '';
  collateralInputAmount = '';
  repayInputAmount = '';
  redeemInputAmount = '';
  estimatedDailyInterest = '0';
  borrowWarningMsg = '';
  redeemWarningMsg = '';
  estimatedFeeForCollateral = '-';
  estimatedFeeForRepay = '-';
  showFeeSuggestionForCollateral = false;
  showFeeSuggestionForRepay = false;
  feeEstimationTimer = null;
  safePercent = '0';

  borrowInputError = '';
  collateralInputError = '';
  repayInputError = '';
  redeemInputError = '';

  marketHistoricalData = {};
  chartLoading = false;
  availableToBorrow = '-';

  currentActionName = '';
  currentFinalTxId = '';

  repayWithShares = false;
  repaySharesAmount = '';

  redeemAllCollateral = false;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  safeBN = (value, fallback = null) => {
    try {
      const bn = new BigNumber(value);
      return bn.isNaN() || !bn.isFinite() ? fallback : bn;
    } catch {
      return fallback;
    }
  };

  hasValidPricing = () => {
    const { borrowPrice, collateralPrice } = this.marketDetails || {};
    const { lltv } = this.myPosition || {};
    const bp = this.safeBN(borrowPrice);
    const cp = this.safeBN(collateralPrice);
    const l = this.safeBN(lltv);
    return bp !== null && cp !== null && l !== null && l.gt(0) && bp.gt(0);
  };

  get actionButtonText() {
    if (this.activeActionTab === 'borrow_collateral') {
      const hasBorrow = BigNumber(this.borrowInputAmount).gt(0);
      const hasCollateral = BigNumber(this.collateralInputAmount).gt(0);
      const isBorrowAvailable = BigNumber(this.availableToBorrow).gt(0);

      if (!isBorrowAvailable && hasCollateral) return intl.get('jlv2.transaction.collateralize');
      if (hasBorrow && hasCollateral)
        return intl.get('jlv2.transaction.borrow') + ' & ' + intl.get('jlv2.transaction.collateralize');
      if (hasBorrow) return intl.get('jlv2.transaction.borrow');
      if (hasCollateral) return intl.get('jlv2.transaction.collateralize');
    } else {
      // repay_redeem tab
      const hasRepay = BigNumber(this.repayInputAmount).gt(0);
      const hasRedeem = BigNumber(this.redeemInputAmount).gt(0);

      if (hasRepay && hasRedeem)
        return intl.get('jlv2.transaction.repay') + ' & ' + intl.get('jlv2.transaction.redeem');
      if (hasRepay) return intl.get('jlv2.transaction.repay');
      if (hasRedeem) return intl.get('jlv2.transaction.redeem');
    }
    return intl.get('jlv2.market.enter_amount');
  }

  get borrowInputUsdValue() {
    if (!this.marketDetails?.borrowPrice) return '-';
    const price = getNumbValue(this.marketDetails?.borrowPrice);
    const amount = getNumbValue(this.borrowInputAmount);
    return price.times(amount);
  }

  get collateralInputUsdValue() {
    if (!this.marketDetails?.collateralPrice) return '-';
    const price = getNumbValue(this.marketDetails?.collateralPrice);
    const amount = getNumbValue(this.collateralInputAmount);
    return price.times(amount);
  }

  get repayInputUsdValue() {
    if (!this.marketDetails?.borrowPrice) return '-';
    const price = getNumbValue(this.marketDetails?.borrowPrice);
    const amount = getNumbValue(this.repayInputAmount);
    return price.times(amount);
  }

  get withdrawInputUsdValue() {
    if (!this.marketDetails?.collateralPrice) return '-';
    const price = getNumbValue(this.marketDetails?.collateralPrice);
    const amount = getNumbValue(this.redeemInputAmount);
    return price.times(amount);
  }

  get userBorrowMaxAmount() {
    if (!this.hasValidPricing()) return BigNumber(0);
    const { lltv, borrowUsd, collateralUsd } = this.myPosition || {};
    const { borrowPrice, collateralPrice, borrowDecimal } = this.marketDetails;
    const totalCollateralUsd = new BigNumber(this.collateralInputAmount || 0)
      .times(collateralPrice)
      .plus(collateralUsd);
    let maxAmount = new BigNumber('0.9999').times(lltv).times(totalCollateralUsd).minus(borrowUsd).div(borrowPrice);
    if (!maxAmount.gt(0)) maxAmount = BigNumber(0);
    return maxAmount;
  }

  get userRedeemMaxAmount() {
    if (!this.hasValidPricing()) return BigNumber(0);
    const { lltv, borrowUsd, collateralUsd, collateralAmount } = this.myPosition || {};
    const { borrowPrice, collateralPrice } = this.marketDetails || {};
    if (!collateralUsd || !collateralAmount) return BigNumber(0);

    const totalBorrowUsd = new BigNumber(borrowUsd).minus(
      new BigNumber(this.repayInputAmount || 0).times(borrowPrice || 0)
    );
    const minCollateralUsd = totalBorrowUsd.div(new BigNumber('0.9999').times(lltv));
    let maxRedeemableUsd = new BigNumber(collateralUsd).minus(minCollateralUsd);
    let maxRedeemableAmount = maxRedeemableUsd.div(collateralPrice);
    const currentCollateralAmount = new BigNumber(collateralAmount || 0);
    if (maxRedeemableAmount.gt(currentCollateralAmount)) {
      maxRedeemableAmount = currentCollateralAmount;
    }
    if (maxRedeemableAmount.lt(0)) {
      maxRedeemableAmount = new BigNumber(0);
    }
    return maxRedeemableAmount;
  }

  get borrowLimitUSD() {
    if (!this.hasValidPricing()) return BigNumber(0);
    const { collateralUsd, lltv } = this.myPosition || {};
    const price = getNumbValue(this.marketDetails?.collateralPrice);
    if (price.lte(0)) return BigNumber(collateralUsd || 0).times(lltv);
    const isCollateral = this.activeActionTab === 'borrow_collateral';
    if (isCollateral) {
      const amount = BigNumber(this.collateralInputAmount || 0);
      return price.times(amount).plus(collateralUsd).times(lltv);
    } else {
      const amount = BigNumber(this.redeemInputAmount || 0);
      let borrowLimit = BigNumber(collateralUsd).minus(price.times(amount)).times(lltv);
      if (borrowLimit.lt(0)) borrowLimit = BigNumber(0);
      if (this.redeemAllCollateral) borrowLimit = BigNumber(0);
      return borrowLimit;
    }
  }

  getDataInterval = (marketId, userAddress) => {
    let timer = setInterval(() => {
      this.fetchAllMarketData(marketId, userAddress, false);
      this.rootStore.dashboardStore?.bumpMiningRefresh?.();
    }, 60000);
    return timer;
  };

  // --- Actions ---
  fetchAllMarketData = async (marketId, userAddress, needLoading = true) => {
    if (needLoading) {
      this.isLoading = true;
      runInAction(() => {
        this.activeActionTab = 'borrow_collateral';
        this.borrowInputAmount = '';
        this.collateralInputAmount = '';
        this.repayInputAmount = '';
        this.redeemInputAmount = '';
        this.borrowInputError = '';
        this.collateralInputError = '';
        this.repayInputError = '';
        this.redeemInputError = '';
        this.marketIdError = false;
        this.repayWithShares = false;
        this.repaySharesAmount = '';

        this.estimatedFeeForCollateral = '-';
        this.estimatedFeeForRepay = '-';
        this.showFeeSuggestionForCollateral = false;
        this.showFeeSuggestionForRepay = false;
        this.borrowWarningMsg = '';
        this.redeemWarningMsg = '';
        this.estimatedDailyInterest = '0';

        this.myPosition = null;
        this.walletBalances = { loanToken: '-', collateralToken: '-' };
        this.availableToBorrow = '-';
        this.isActionInProgress = false;
        this.currentFinalTxId = '';
      });
    }
    try {
      const detailsResult = await getMarketInfo(marketId);
      // invalid marketId error
      if (detailsResult?.code === 202 || detailsResult?.code === '202') {
        this.marketIdError = true;
        throw new Error('Market details not found');
      }

      if (!detailsResult?.data) throw new Error('Market details not found');

      const marketDetails = detailsResult?.data;

      const fundingVaultsResult = await getMarketVaultList(marketId);

      if (marketDetails.collateralAddress === WTRXAddress) {
        marketDetails.collateralSymbol = 'TRX';
      }
      if (marketDetails.borrowAddress === WTRXAddress) {
        marketDetails.borrowSymbol = 'TRX';
      }
      marketDetails.marketId = marketId;
      marketDetails.marketName = formatVaultName(marketDetails.marketName)?.replace('/', ' / ');
      marketDetails.oracle = marketDetails.oracleAddress;
      marketDetails.irm = marketDetails.interestModeAddress;

      runInAction(() => {
        this.marketIdError = false;
        this.marketDetails = marketDetails;
        this.fundingVaults = (fundingVaultsResult?.data || []).map(vault => ({
          ...vault,
          vaultName: formatVaultName(vault.vaultName),
          assetTokenSymbol: formatVaultName(vault.assetTokenSymbol)
        }));
        this.availableToBorrow = marketDetails?.liquidity || '-';
      });

      if (userAddress) {
        const [positionResult] = await Promise.all([getMarketMyPosition(marketId, userAddress)]);

        let collateralBalancePromise;
        let loanBalancePromise;

        if (marketDetails.collateralAddress === WTRXAddress) {
          collateralBalancePromise = getTrxBalanceQuick(userAddress);
        } else {
          collateralBalancePromise = getTRC20Balance(marketDetails.collateralAddress, userAddress);
        }
        if (marketDetails.borrowAddress === WTRXAddress) {
          loanBalancePromise = getTrxBalanceQuick(userAddress);
        } else {
          loanBalancePromise = getTRC20Balance(marketDetails.borrowAddress, userAddress);
        }

        const [collateralBalanceResult, loanBalanceResult] = await Promise.all([
          collateralBalancePromise,
          loanBalancePromise
        ]);

        if (positionResult?.data) {
          positionResult.data.borrowSymbol = formatTokenSymbol(
            positionResult.data.borrowAddress,
            positionResult.data.borrowSymbol
          );
          positionResult.data.collateralSymbol = formatTokenSymbol(
            positionResult.data.collateralAddress,
            positionResult.data.collateralSymbol
          );
          const emptyInput =
            this.borrowInputAmount === '' &&
            this.collateralInputAmount === '' &&
            this.repayInputAmount === '' &&
            this.redeemInputAmount === '';
          if (needLoading || emptyInput) {
            const { risk } = positionResult.data;
            if (!risk || risk === '-') {
              runInAction(() => {
                this.safePercent = '-';
              });
            } else {
              let safePercent = BigNumber(risk).times(100);
              safePercent = setLimit(safePercent);
              if (BigNumber(safePercent).lt(0)) safePercent = BigNumber(0);

              runInAction(() => {
                this.safePercent = safePercent;
              });
            }
          }
        }

        runInAction(() => {
          this.myPosition = positionResult?.data;
          if (collateralBalanceResult?.success) {
            const defaultDecimals = marketDetails.collateralAddress === WTRXAddress ? trxDecimal : trc20Decimal;
            const decimals = getSafeDecimals(marketDetails.collateralDecimal, defaultDecimals);
            let balance;
            if (marketDetails.collateralAddress === WTRXAddress) {
              balance = collateralBalanceResult.balance;
            } else {
              balance = new BigNumber(collateralBalanceResult.value).div(new BigNumber(10).pow(decimals));
            }
            this.walletBalances.collateralToken = balance?.toString() || '-';
          }
          if (loanBalanceResult?.success) {
            const defaultDecimals = marketDetails.borrowAddress === WTRXAddress ? trxDecimal : trc20Decimal;
            const decimals = getSafeDecimals(marketDetails.borrowDecimal, defaultDecimals);
            let balance;
            if (marketDetails.borrowAddress === WTRXAddress) {
              balance = loanBalanceResult.balance;
            } else {
              balance = new BigNumber(loanBalanceResult.value).div(new BigNumber(10).pow(decimals));
            }
            this.walletBalances.loanToken = balance?.toString() || '-';
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch market data', error);
    } finally {
      runInAction(() => {
        this.isLoading = false;
        if (needLoading) {
          this.chartLoading = true;
        }
      });

      try {
        const energyFeeRate = await this.rootStore.lend.getEnergyFee();
        const historyResult = await getMarketBorrowHistory(marketId);
        runInAction(() => {
          this.chartLoading = false;
          this.marketDetails.energyFeeRate = energyFeeRate;
          this.marketHistoricalData = historyResult?.data || {};
        });
      } catch (error) {
        this.chartLoading = false;
      }
    }
  };

  setActionTab = tab => {
    this.activeActionTab = tab;
    this.borrowInputAmount = '';
    this.collateralInputAmount = '';
    this.repayInputAmount = '';
    this.redeemInputAmount = '';
    this.borrowInputError = '';
    this.collateralInputError = '';
    this.repayInputError = '';
    this.redeemInputError = '';
    this.repayWithShares = false;
    this.repaySharesAmount = '';
    this.currentFinalTxId = '';

    this.estimatedFeeForCollateral = '-';
    this.estimatedFeeForRepay = '-';
    this.showFeeSuggestionForCollateral = false;
    this.showFeeSuggestionForRepay = false;
    this.borrowWarningMsg = '';
    this.redeemWarningMsg = '';
    this.estimatedDailyInterest = '0';

    const { risk } = this.myPosition || {};
    if (!risk || risk === '-') {
      runInAction(() => {
        this.safePercent = '-';
      });
    } else {
      let safePercent = BigNumber(risk).times(100);
      safePercent = setLimit(safePercent);
      if (BigNumber(safePercent).lt(0)) safePercent = BigNumber(0);

      runInAction(() => {
        this.safePercent = safePercent;
      });
    }
  };

  cleanInput = (amount, type) => {
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
    let borrowDecimal =
      this.marketDetails?.borrowDecimal ||
      (this.marketDetails?.borrowAddress === WTRXAddress ? trxDecimal : trc20Decimal);
    if (type === 'collateral') {
      borrowDecimal =
        this.marketDetails?.collateralDecimal ||
        (this.marketDetails?.collateralAddress === WTRXAddress ? trxDecimal : trc20Decimal);
    }
    if (decimalParts.length === 2) {
      const integerPart = decimalParts[0];
      let decimalPart = decimalParts[1];
      if (decimalPart.length > borrowDecimal) {
        decimalPart = decimalPart.slice(0, borrowDecimal);
        cleanAmount = `${integerPart}.${decimalPart}`;
      }
    }
    return cleanAmount;
  };

  bnInput = cleanAmount => {
    let amountBN;
    try {
      amountBN = new BigNumber(cleanAmount);
      if (cleanAmount === '' || cleanAmount === '.' || amountBN.isNaN() || !amountBN.isFinite()) {
        amountBN = new BigNumber(0);
      }
    } catch {
      amountBN = new BigNumber(0);
    }
    return amountBN;
  };

  
  @action
  setBorrowInput = (amount, _options = {}) => {
    this.borrowInputAmount = this.cleanInput(amount);
    const amountBN = this.bnInput(this.borrowInputAmount);

    const borrowApy = new BigNumber(this.marketDetails?.borrowApy || 0);
    let dailyInterest = new BigNumber(0);
    if (amountBN.gt(0) && borrowApy.gt(0)) {
      dailyInterest = amountBN.times(borrowApy).div(365);
    }
    this.estimatedDailyInterest = dailyInterest;

    this.borrowInputError = '';
    this.borrowWarningMsg = '';

    if (!this.hasValidPricing()) {
      this.safePercent = '-';
      return;
    }

    const { lltv, borrowUsd, collateralUsd, borrowAmount } = this.myPosition || {};
    const { borrowPrice, collateralPrice } = this.marketDetails;
    let tempA = amountBN.times(borrowPrice).plus(borrowUsd || 0);
    let tempB = BigNumber(collateralUsd || 0);
    if (BigNumber(this.collateralInputAmount).gt(0)) {
      tempB = tempB.plus(new BigNumber(this.collateralInputAmount).times(collateralPrice || 0));
    }
    let safePercent = '0';
    if (tempB.lte(0) && tempA.gt(0)) {
      safePercent = BigNumber(100);
    } else {
      if (tempB.lte(0)) {
        tempB = BigNumber(1);
      }
      safePercent = tempA.div(tempB).div(lltv).times(100);
      safePercent = setLimit(safePercent);
      if (BigNumber(safePercent).lt(0)) safePercent = BigNumber(0);
    }

    this.safePercent = safePercent;

    const availableToBorrowBN = new BigNumber(this.availableToBorrow || 0);
    const minBorrowBN = new BigNumber(this.marketDetails?.minLoanValue || 0);

    if (amountBN.gt(availableToBorrowBN)) {
      this.borrowInputError = intl.get('jlv2.error.exceeded_max_borrow_limit');
    } else if (BigNumber(safePercent).gt(99.99) && (amountBN.gt(0) || BigNumber(this.collateralInputAmount).gt(0))) {
      this.borrowInputError = intl.get('jlv2.error.exceeded_borrow_limit');
    } else if (amountBN.plus(borrowAmount).lt(minBorrowBN) && amountBN.gt(0)) {
      this.borrowInputError = intl.getHTML('jlv2.error.borrow_at_least', {
        amount: minBorrowBN,
        token: this.marketDetails?.borrowSymbol
      });
    }
    if (!BigNumber(this.collateralInputAmount).gt(0) && !BigNumber(this.borrowInputAmount).gt(0)) {
      this.borrowInputError = '';
      this.collateralInputError = '';
    }
    if (this.borrowInputError) this.borrowWarningMsg = '';
  };

  
  @action
  setCollateralInput = (amount, _options = {}) => {
    this.collateralInputAmount = this.cleanInput(amount, 'collateral');
    const walletBalanceBN = new BigNumber(this.walletBalances.collateralToken);
    const amountBN = this.bnInput(this.collateralInputAmount);
    const { fromMaxClick = false } = _options;
    clearTimeout(this.feeEstimationTimer);
    this.collateralInputError = '';
    this.borrowWarningMsg = '';
    if (
      BigNumber(amountBN).gt(0) &&
      BigNumber(amountBN).plus(this.estimatedFeeForCollateral).gt(this.walletBalances.collateralToken)
    ) {
      this.showFeeSuggestionForCollateral = true;
    } else {
      this.showFeeSuggestionForCollateral = false;
    }

    if (!this.hasValidPricing()) {
      this.safePercent = '-';
      // Still check wallet balance even without valid pricing
      const walletBalance = this.walletBalances.collateralToken || '-';
      if (amountBN.gt(walletBalance)) {
        this.collateralInputError = intl.get('jlv2.error.insufficient_wallet');
        this.showFeeSuggestionForCollateral = false;
      }
      return;
    }

    const { lltv, borrowUsd, collateralUsd, borrowAmount } = this.myPosition || {};
    const { borrowPrice, collateralPrice } = this.marketDetails;
    let tempA = BigNumber(borrowUsd || 0);
    let tempB = amountBN.times(collateralPrice).plus(collateralUsd || 0);
    if (BigNumber(this.borrowInputAmount).gt(0)) {
      tempA = tempA.plus(new BigNumber(this.borrowInputAmount).times(borrowPrice || 0));
    }
    let safePercent = '0';
    if (tempB.lte(0) && tempA.gt(0)) {
      safePercent = BigNumber(100);
    } else {
      if (tempB.lte(0)) {
        tempB = BigNumber(1);
      }
      safePercent = tempA.div(tempB).div(lltv).times(100);
      safePercent = setLimit(safePercent);
      if (BigNumber(safePercent).lt(0)) safePercent = BigNumber(0);
    }

    this.safePercent = safePercent;

    const availableToBorrowBN = new BigNumber(this.availableToBorrow || 0);
    const minBorrowBN = new BigNumber(this.marketDetails?.minLoanValue || 0);
    const borrowInputAmountBN = BigNumber(this.borrowInputAmount || 0);

    if (BigNumber(safePercent).gt(99.99) && (amountBN.gt(0) || borrowInputAmountBN.gt(0))) {
      this.borrowInputError = intl.get('jlv2.error.exceeded_borrow_limit');
      this.borrowWarningMsg = '';
    } else if (borrowInputAmountBN.plus(borrowAmount).lt(minBorrowBN) && borrowInputAmountBN.gt(0)) {
      this.borrowInputError = intl.getHTML('jlv2.error.borrow_at_least', {
        amount: minBorrowBN,
        token: this.marketDetails?.borrowSymbol
      });
    } else {
      if (availableToBorrowBN.gte(borrowInputAmountBN) && borrowInputAmountBN.plus(borrowAmount).gte(minBorrowBN)) {
        this.borrowInputError = '';
      }
    }

    const walletBalance = this.walletBalances.collateralToken || '-';
    if (amountBN.gt(walletBalance)) {
      this.collateralInputError = intl.get('jlv2.error.insufficient_wallet');
      this.showFeeSuggestionForCollateral = false;
    }

    if (!BigNumber(this.collateralInputAmount).gt(0) && !BigNumber(this.borrowInputAmount).gt(0)) {
      this.borrowInputError = '';
      this.collateralInputError = '';
    }

    if (this.marketDetails?.collateralAddress === WTRXAddress && amountBN.gt(0) && !this.collateralInputError) {
      this.feeEstimationTimer = setTimeout(() => {
        this.estimateCollateralFee(this.collateralInputAmount).then(() => {
          const reserveFee = this.estimatedFeeForCollateral;
          if (amountBN.gt(walletBalanceBN.minus(reserveFee))) {
            this.showFeeSuggestionForCollateral = true;
          } else {
            this.showFeeSuggestionForCollateral = false;
          }
        });
      }, 300);
    } else {
      this.estimatedFeeForCollateral = '-';
    }
  };

  setCollateralReservedFee = () => {
    runInAction(() => {
      const remainAmount = new BigNumber(this.walletBalances.collateralToken).minus(this.estimatedFeeForCollateral);
      if (remainAmount.lte(0)) {
        // this.collateralInputError = intl.get('jlv2.error.insufficient_wallet');
        this.collateralInputAmount = 0;
      } else {
        this.collateralInputAmount = remainAmount;
      }
      this.showFeeSuggestionForCollateral = false;
    });
  };

  
  @action
  setRepayInput = (amount, _options = {}) => {
    const { fromMaxClick = false } = _options;
    if (!fromMaxClick) this.repayWithShares = false;
    this.repayInputAmount = this.cleanInput(amount);
    const amountBN = this.bnInput(this.repayInputAmount);
    const walletBalanceBN = new BigNumber(this.walletBalances.loanToken);

    clearTimeout(this.feeEstimationTimer);
    this.repayInputError = '';
    if (
      BigNumber(amountBN).gt(0) &&
      BigNumber(amountBN).plus(this.estimatedFeeForRepay).gt(this.walletBalances.loanToken)
    ) {
      this.showFeeSuggestionForRepay = true;
    } else {
      this.showFeeSuggestionForRepay = false;
    }

    if (!this.hasValidPricing()) {
      this.safePercent = '-';
      // Still check wallet and borrow amount limits
      const walletBalance = this.walletBalances.loanToken || '-';
      const { borrowAmount } = this.myPosition || {};
      if (amountBN.gt(walletBalance)) {
        this.repayInputError = intl.get('jlv2.error.insufficient_wallet');
      } else if (amountBN.gt(borrowAmount) && !fromMaxClick) {
        this.repayInputError = intl.get('jlv2.error.exceed_borrow_amount');
      }
      if (this.repayInputError) this.showFeeSuggestionForRepay = false;
      return;
    }

    const { lltv, borrowUsd, collateralUsd, borrowShares, borrowAmount } = this.myPosition || {};
    const { borrowPrice, collateralPrice, borrowDecimal, totalBorrowShares, totalBorrowAssets } = this.marketDetails;
    let tempA = BigNumber(borrowUsd || 0).minus(amountBN.times(borrowPrice || 0));
    let tempB = BigNumber(collateralUsd || 0);
    if (BigNumber(this.redeemInputAmount).gt(0)) {
      tempB = tempB.minus(new BigNumber(this.redeemInputAmount).times(collateralPrice || 0));
    }
    let safePercent = '0';
    if (tempB.lte(0) && tempA.gt(0)) {
      safePercent = BigNumber(100);
    } else {
      if (tempB.lte(0)) {
        tempB = BigNumber(1);
      }
      safePercent = tempA.div(tempB).div(lltv).times(100);
      safePercent = setLimit(safePercent);
      if (BigNumber(safePercent).lt(0)) safePercent = BigNumber(0);
    }

    this.safePercent = safePercent;

    const walletBalance = this.walletBalances.loanToken || '-';
    let estimateAmount = toFixedUp(
      BigNumber(totalBorrowAssets).times(borrowShares).div(totalBorrowShares).times(callValueRate),
      borrowDecimal
    );

    if (BigNumber(safePercent).gt(99.99) && (amountBN.gt(0) || BigNumber(this.redeemInputAmount).gt(0))) {
      this.redeemInputError = intl.get('jlv2.error.risk_high2');
      this.redeemWarningMsg = '';
    } else if (this.redeemInputError === intl.get('jlv2.error.risk_high2')) {
      this.redeemInputError = '';
    }

    if (!BigNumber(estimateAmount).gt(0)) estimateAmount = 0;
    const minBorrowBN = new BigNumber(this.marketDetails?.minLoanValue || 0);
    if (amountBN.gt(walletBalance)) {
      this.repayInputError = intl.get('jlv2.error.insufficient_wallet');
    } else if (amountBN.gt(borrowAmount) && !fromMaxClick) {
      this.repayInputError = intl.get('jlv2.error.exceed_borrow_amount');
    } else if (
      amountBN.gt(0) &&
      BigNumber(borrowAmount).gte(amountBN) &&
      BigNumber(borrowAmount).minus(amountBN).lt(minBorrowBN)
    ) {
      if (fromMaxClick) {
        this.repayInputError = intl.get('jlv2.error.repay_insufficient_for_full');
      } else {
        this.repayInputError = intl.get('jlv2.error.repay_in_full', { amount: minBorrowBN.toString() });
      }
    }

    if (!BigNumber(this.redeemInputAmount).gt(0) && !BigNumber(this.repayInputAmount).gt(0)) {
      this.redeemInputError = '';
      this.repayInputError = '';
    }

    if (this.repayInputError) this.showFeeSuggestionForRepay = false;

    if (this.marketDetails?.borrowAddress === WTRXAddress && amountBN.gt(0) && !this.repayInputError) {
      this.feeEstimationTimer = setTimeout(() => {
        if (fromMaxClick) {
          this.estimateRepayFee(this.repayInputAmount, estimateAmount).then(() => {
            const multiplier = BigNumber(callValueRate).minus(1);
            let callValueFee = toFixedUp(BigNumber(this.repayInputAmount).times(multiplier), trxDecimal);
            let reserveFee = this.estimatedFeeForRepay;
            reserveFee = toFixedUp(BigNumber(reserveFee).plus(callValueFee), trxDecimal);
            if (amountBN.gt(walletBalanceBN.minus(reserveFee))) {
              this.showFeeSuggestionForRepay = true;
            } else {
              this.showFeeSuggestionForRepay = false;
            }
          });
        } else {
          this.estimateRepayFee(this.repayInputAmount).then(() => {
            const reserveFee = this.estimatedFeeForRepay;
            if (amountBN.gt(walletBalanceBN.minus(reserveFee))) {
              this.showFeeSuggestionForRepay = true;
            } else {
              this.showFeeSuggestionForRepay = false;
            }
          });
        }
      }, 300);
    } else {
      this.estimatedFeeForRepay = '-';
    }
  };

  setRepayReservedFee = () => {
    runInAction(() => {
      const remainAmount = BigNumber(this.walletBalances.loanToken).minus(this.estimatedFeeForRepay);
      if (remainAmount.lte(0)) {
        // this.repayInputError = intl.get('jlv2.error.insufficient_wallet');
        this.repayInputAmount = 0;
      } else {
        this.repayInputAmount = remainAmount;
      }
      this.showFeeSuggestionForRepay = false;
    });
  };

  @action
  setRedeemInput = (amount, _options = {}) => {
    this.redeemInputAmount = this.cleanInput(amount, 'collateral');
    const amountBN = this.bnInput(this.redeemInputAmount);
    this.redeemInputError = '';

    const { collateralAmount } = this.myPosition || {};
    const currentCollateralAmount = new BigNumber(collateralAmount || 0);
    if (amountBN.gte(currentCollateralAmount)) {
      this.redeemAllCollateral = true;
    } else {
      this.redeemAllCollateral = false;
    }

    if (!this.hasValidPricing()) {
      this.safePercent = '-';
      // Still check collateral amount limit
      if (amountBN.gt(collateralAmount)) {
        this.redeemInputError = intl.get('jlv2.error.more_than_collateral');
      }
      if (!BigNumber(this.redeemInputAmount).gt(0) && !BigNumber(this.repayInputAmount).gt(0)) {
        this.redeemInputError = '';
        this.repayInputError = '';
      }
      if (this.redeemInputError) this.redeemWarningMsg = '';
      return;
    }

    const { lltv, borrowUsd, collateralUsd } = this.myPosition || {};
    const { borrowPrice, collateralPrice } = this.marketDetails;
    let tempA = BigNumber(borrowUsd || 0);
    let tempB = BigNumber(collateralUsd || 0).minus(amountBN.times(collateralPrice || 0));
    if (BigNumber(this.repayInputAmount).gt(0)) {
      tempA = tempA.minus(new BigNumber(this.repayInputAmount).times(borrowPrice || 0));
    }

    let safePercent = '0';
    if (tempB.lte(0) && tempA.gt(0)) {
      safePercent = BigNumber(100);
    } else if (tempA.eq(0)) {
      safePercent = BigNumber(0);
    } else {
      if (tempB.lt(0)) {
        safePercent = BigNumber(100);
      } else {
        safePercent = tempA.div(tempB).div(lltv).times(100);
        safePercent = setLimit(safePercent);
      }
      if (BigNumber(safePercent).lt(0)) safePercent = BigNumber(0);
    }

    this.safePercent = safePercent;

    if (amountBN.gt(collateralAmount)) {
      this.redeemInputError = intl.get('jlv2.error.more_than_collateral');
    } else if (BigNumber(safePercent).gt(99.99) && (amountBN.gt(0) || BigNumber(this.repayInputAmount).gt(0))) {
      this.redeemInputError = intl.get('jlv2.error.risk_high2');
    }
    if (!BigNumber(this.redeemInputAmount).gt(0) && !BigNumber(this.repayInputAmount).gt(0)) {
      this.redeemInputError = '';
      this.repayInputError = '';
    }
    if (this.redeemInputError) this.redeemWarningMsg = '';
  };

  estimateCollateralFee = async amountToEstimate => {
    const amountBN = new BigNumber(amountToEstimate);
    if (amountBN.isNaN() || amountBN.lte(0)) {
      runInAction(() => {
        this.estimatedFeeForCollateral = '-';
      });
      return;
    }
    try {
      const energy = await this.rootStore.systemV2.estimateCollateralTrxGas(this.marketDetails, amountToEstimate);
      const energyFeeRate = this.marketDetails.energyFeeRate || (await this.rootStore.lend.getEnergyFee());

      const feeInSun = new BigNumber(energy).times(energyFeeRate);
      const feeInTrx = feeInSun.div(1e6).plus(defaultAddedFeeBuffer);
      const feeInTrxBN = toFixedUp(feeInTrx, trxDecimal);

      runInAction(() => {
        this.estimatedFeeForCollateral = feeInTrx.gt(0) ? feeInTrxBN.toString() : defaultReserveFee;
      });
    } catch (e) {
      this.estimatedFeeForCollateral = defaultReserveFee;
      console.error('Failed to estimate fee:', e);
    }
  };

  estimateRepayFee = async (amountToEstimate, shares = '') => {
    const amountBN = new BigNumber(amountToEstimate);
    if (amountBN.isNaN() || amountBN.lte(0)) {
      runInAction(() => {
        this.estimatedFeeForRepay = '-';
      });
      return;
    }
    try {
      const energy = await this.rootStore.systemV2.estimateRepayTrxGas(this.marketDetails, amountToEstimate, shares);
      const energyFeeRate = this.marketDetails.energyFeeRate || (await this.rootStore.lend.getEnergyFee());

      const feeInSun = new BigNumber(energy).times(energyFeeRate);
      const feeInTrx = feeInSun.div(1e6).plus(defaultAddedFeeBuffer);
      const feeInTrxBN = toFixedUp(feeInTrx, trxDecimal);

      runInAction(() => {
        this.estimatedFeeForRepay = feeInTrx.gt(0) ? feeInTrxBN.toString() : defaultReserveFee;
      });
    } catch (e) {
      this.estimatedFeeForRepay = defaultReserveFee;
      console.error('Failed to estimate fee:', e);
    }
  };

  
  handleBorrowMaxClick = () => {
    if (!this.hasValidPricing()) {
      this.setBorrowInput(0);
      this.borrowWarningMsg = intl.get('jlv2.error.risk_high1');
      return;
    }
    const { lltv, borrowUsd, collateralUsd } = this.myPosition || {};
    const { borrowPrice, collateralPrice } = this.marketDetails;
    const totalCollateralUsd = new BigNumber(this.collateralInputAmount || 0)
      .times(collateralPrice)
      .plus(collateralUsd);
    const safeAmount = new BigNumber('0.8').times(lltv).times(totalCollateralUsd).minus(borrowUsd).div(borrowPrice);

    if (safeAmount.lt(0)) {
      this.setBorrowInput(0);
      this.borrowWarningMsg = intl.get('jlv2.error.risk_high1');
    } else {
      this.setBorrowInput(safeAmount);
    }
  };

  handleCollateralMaxClick = async () => {
    this.setCollateralInput(this.walletBalances.collateralToken, { fromMaxClick: true });
  };

  handleRepayMaxClick = async () => {
    const { borrowShares, borrowAmount } = this.myPosition || {};
    const { borrowDecimal, totalBorrowShares, totalBorrowAssets } = this.marketDetails;
    const walletBalanceBN = new BigNumber(this.walletBalances.loanToken || 0);
    let maxAmount = walletBalanceBN;
    this.repayWithShares = false;
    // Repay amount = totalBorrowAssets * userShares / totalBorrowShares * 1.01
    const estimateAmount = toFixedUp(
      BigNumber(totalBorrowAssets).times(borrowShares).div(totalBorrowShares).times(callValueRate),
      borrowDecimal
    );
    runInAction(() => {
      this.repaySharesAmount = estimateAmount;
    });
    const minAmount = calculateValue(borrowDecimal);

    if (!BigNumber(estimateAmount).gt(0)) {
      maxAmount = new BigNumber(0);
    } else if (BigNumber(estimateAmount).lt(walletBalanceBN)) {
      maxAmount = BigNumber(estimateAmount);
      this.repayWithShares = true;
    } else if (maxAmount.lt(minAmount)) {
      maxAmount = new BigNumber(0);
    } else if (BigNumber(borrowAmount).lt(walletBalanceBN)) {
      maxAmount = new BigNumber(borrowAmount);
    }
    const cleanMaxSupply = stripTrailingZeros(maxAmount);
    this.setRepayInput(cleanMaxSupply, { fromMaxClick: true });
  };

  
  handleRedeemMaxClick = () => {
    if (!this.hasValidPricing()) return;
    const { lltv, borrowUsd, collateralUsd, collateralAmount } = this.myPosition || {};
    const { borrowPrice, collateralPrice, collateralDecimal } = this.marketDetails || {};
    if (!borrowUsd || !collateralUsd || !collateralAmount) return;

    const totalBorrowUsd = new BigNumber(borrowUsd).minus(
      new BigNumber(this.repayInputAmount || 0).times(borrowPrice || 0)
    );
    const minCollateralUsd = totalBorrowUsd.div(new BigNumber('0.8').times(lltv));
    let maxRedeemableUsd = new BigNumber(collateralUsd).minus(minCollateralUsd);
    let maxRedeemableAmount = maxRedeemableUsd.div(collateralPrice);
    const currentCollateralAmount = new BigNumber(collateralAmount || 0);
    if (maxRedeemableAmount.gt(currentCollateralAmount)) {
      maxRedeemableAmount = currentCollateralAmount;
    }
    const minAmount = calculateValue(collateralDecimal);
    if (maxRedeemableAmount.lt(minAmount)) {
      maxRedeemableAmount = new BigNumber(0);
    }
    this.setRedeemInput(maxRedeemableAmount);
  };

  // Unified execute action based on active tab
  executeAction = async () => {
    if (this.isActionInProgress) return;

    try {
      runInAction(() => {
        this.isActionInProgress = true;
        this.borrowInputError = '';
        this.collateralInputError = '';
        this.repayInputError = '';
        this.redeemInputError = '';
        this.currentFinalTxId = '';
      });
      if (this.activeActionTab === 'borrow_collateral') {
        await this.executeBorrowAndCollateral();
      } else {
        await this.executeRepayAndRedeem();
      }
    } catch (error) {
      console.error('Unhandled error in executeAction:', error);
    } finally {
      runInAction(() => {
        this.isActionInProgress = false;
      });
    }
  };

  executeBorrowAndCollateral = async () => {
    const {
      system: systemStore,
      systemV2: protocolService,
      network: networkStore,
      transactionV2: transactionStore
    } = this.rootStore;
    const userAddress = networkStore.defaultAccount;

    let steps = [];
    let finalTxId = '';

    try {
      const hasCollateral = BigNumber(this.collateralInputAmount).gt(0);
      const hasBorrow = BigNumber(this.borrowInputAmount).gt(0) && BigNumber(this.availableToBorrow).gt(0);

      if (hasCollateral && !hasBorrow) {
        window.gtag('event', 'PC_market_detail_collateral', {
          'event_category': 'PC_V2',
          'event_label': 'market_detail_collateral'
        });
      } else if (!hasCollateral && hasBorrow) {
        window.gtag('event', 'PC_market_detail_borrow', {
          'event_category': 'PC_V2',
          'event_label': 'market_detail_borrow'
        });
      } else if (hasCollateral && hasBorrow) {
        window.gtag('event', 'PC_market_detail_bc', { 'event_category': 'PC_V2', 'event_label': 'market_detail_bc' });
      }

      const { collateralAddress, collateralDecimal } = this.marketDetails;

      let collateralAmountChain = new BigNumber(0);

      if (hasCollateral && collateralAddress !== WTRXAddress) {
        collateralAmountChain = new BigNumber(this.collateralInputAmount).times(10 ** collateralDecimal);
        const allowance = await getAllowance(collateralAddress, userAddress, Config.contracts.MoolahProxy);

        if (allowance.lt(collateralAmountChain)) {
          steps.push({
            name: intl.get('jlv2.transaction.approve'),
            status: 'pending',
            amount: 'Unlimit',
            token: this.marketDetails.collateralSymbol,
            action: v2ModalInfo =>
              protocolService.approve(collateralAddress, Config.contracts.MoolahProxy, v2ModalInfo),
            type: 'approve'
          });
        }
      }

      if (hasCollateral) {
        steps.push({
          name: intl.get('jlv2.transaction.collateralize'),
          amount: this.collateralInputAmount,
          token: this.marketDetails.collateralSymbol,
          status: 'pending',
          action:
            collateralAddress === WTRXAddress
              ? v2ModalInfo =>
                  protocolService.supplyTrxAsCollateral(this.marketDetails, this.collateralInputAmount, v2ModalInfo)
              : v2ModalInfo =>
                  protocolService.supplyCollateral(
                    this.marketDetails,
                    this.collateralInputAmount,
                    collateralDecimal,
                    v2ModalInfo
                  )
        });
      }

      if (hasBorrow) {
        const loanDecimals = this.marketDetails?.borrowDecimal;
        steps.push({
          name: intl.get('jlv2.transaction.borrow'),
          amount: this.borrowInputAmount,
          token: this.marketDetails.borrowSymbol,
          status: 'pending',
          action:
            this.marketDetails.borrowAddress === WTRXAddress
              ? v2ModalInfo => protocolService.borrowTrx(this.marketDetails, this.borrowInputAmount, v2ModalInfo)
              : v2ModalInfo =>
                  protocolService.borrow(this.marketDetails, this.borrowInputAmount, loanDecimals, v2ModalInfo)
        });
      }

      if (steps.length === 0) return;

      // systemStore.openTransactionModalV2(`${intl.get('jlv2.transaction.tips3', { number: steps.length })}`, steps);
      systemStore.openTransactionModalV2('', steps);

      if (hasCollateral && !hasBorrow) {
        window.gtag('event', 'PC_market_collateral_pop', {
          'event_category': 'PC_V2',
          'event_label': 'market_collateral_pop'
        });
      } else if (!hasCollateral && hasBorrow) {
        window.gtag('event', 'PC_market_borrow_pop', { 'event_category': 'PC_V2', 'event_label': 'market_borrow_pop' });
      } else if (hasCollateral && hasBorrow) {
        window.gtag('event', 'PC_market_bc_pop', { 'event_category': 'PC_V2', 'event_label': 'market_bc_pop' });
      }

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
          const newAllowance = await getAllowance(collateralAddress, userAddress, Config.contracts.MoolahProxy);

          if (newAllowance.lt(collateralAmountChain)) {
            systemStore.updateStepStatusV2(step.name, 'failed');
            throw new Error(intl.get('v2.vote.approve_tip'));
          }
        }

        systemStore.updateStepStatusV2(step.name, 'success');
      }

      let modalTitle = intl.get('jlv2.transaction.successul');
      if (steps.length === 1 && hasBorrow && !hasCollateral) {
        modalTitle = `${this.borrowInputAmount} ${this.marketDetails.borrowSymbol} ${intl.get(
          'jlv2.transaction.borrowed'
        )}`;
      } else if (steps.length === 1 && hasCollateral && !hasBorrow) {
        const assetSymbol = this.marketDetails?.collateralSymbol || 'TOKEN';
        modalTitle = `${this.collateralInputAmount} ${assetSymbol} ${intl.get('jlv2.transaction.collateralized')}`;
      }
      systemStore.setFinalStatusV2('success', modalTitle, finalTxId);

      if (hasCollateral && !hasBorrow) {
        window.gtag('event', 'PC_market_collateral_success', {
          'event_category': 'PC_V2',
          'event_label': 'market_collateral_success'
        });
      } else if (!hasCollateral && hasBorrow) {
        window.gtag('event', 'PC_market_borrow_success', {
          'event_category': 'PC_V2',
          'event_label': 'market_borrow_success'
        });
      } else if (hasCollateral && hasBorrow) {
        window.gtag('event', 'PC_market_bc_success', { 'event_category': 'PC_V2', 'event_label': 'market_bc_success' });
      }

      runInAction(() => {
        this.collateralInputAmount = '';
        this.borrowInputAmount = '';
        this.showFeeSuggestionForCollateral = false;
        this.borrowWarningMsg = '';
      });
      const bumpMining = () => this.rootStore.dashboardStore?.bumpMiningRefresh?.();
      this.fetchAllMarketData(this.marketDetails.marketId, userAddress, false);
      bumpMining();
      setTimeout(() => {
        this.fetchAllMarketData(this.marketDetails.marketId, userAddress, false);
        bumpMining();
      }, additionalCallBackTime);
    } catch (error) {
      console.error('Borrow/Collateral sequence failed:', error);
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
          this.currentFinalTxId = '';
          const lang = window.localStorage.getItem('lang') || intl.options.currentLocale;
          errorTitle = `${lang === 'en-US' ? '' : this.currentActionName}${intl.get('jlv2.transaction.tips4')}`;
        }
        if (
          this.rootStore.system.transactionStateV2.steps?.length > 1 &&
          this.currentActionName === intl.get('jlv2.transaction.borrow')
        ) {
          this.collateralInputAmount = '';
          const bumpMining = () => this.rootStore.dashboardStore?.bumpMiningRefresh?.();
          this.fetchAllMarketData(this.marketDetails.marketId, userAddress, false);
          bumpMining();
          setTimeout(() => {
            this.fetchAllMarketData(this.marketDetails.marketId, userAddress, false);
            bumpMining();
          }, additionalCallBackTime);
        }
        systemStore.setFinalStatusV2('failed', errorTitle, this.currentFinalTxId, { isRejected });
      }
    }
  };

  executeRepayAndRedeem = async () => {
    const {
      system: systemStore,
      systemV2: protocolService,
      network: networkStore,
      transactionV2: transactionStore
    } = this.rootStore;
    const userAddress = networkStore.defaultAccount;

    let steps = [];
    let finalTxId = '';

    try {
      const hasRepay = BigNumber(this.repayInputAmount).gt(0);
      const hasRedeem = BigNumber(this.redeemInputAmount).gt(0);

      if (hasRepay && !hasRedeem) {
        window.gtag('event', 'PC_market_detail_repay', {
          'event_category': 'PC_V2',
          'event_label': 'market_detail_repay'
        });
      } else if (!hasRepay && hasRedeem) {
        window.gtag('event', 'PC_market_detail_redeem', {
          'event_category': 'PC_V2',
          'event_label': 'market_detail_redeem'
        });
      } else if (hasRepay && hasRedeem) {
        window.gtag('event', 'PC_market_detail_rr', { 'event_category': 'PC_V2', 'event_label': 'market_detail_rr' });
      }

      const { borrowAddress, borrowDecimal } = this.marketDetails;
      const { borrowShares, borrowAmount } = this.myPosition || {};

      let repayAmountChain = new BigNumber(0);

      if (hasRepay && borrowAddress !== Config.tokens.WTRX) {
        repayAmountChain = new BigNumber(this.repayInputAmount).times(10 ** borrowDecimal);
        const allowance = await getAllowance(borrowAddress, userAddress, Config.contracts.MoolahProxy);
        if (allowance.lt(repayAmountChain)) {
          steps.push({
            name: intl.get('jlv2.transaction.approve'),
            status: 'pending',
            amount: 'Unlimit',
            token: this.marketDetails.borrowSymbol,
            action: v2ModalInfo => protocolService.approve(borrowAddress, Config.contracts.MoolahProxy, v2ModalInfo),
            type: 'approve'
          });
        }
      }

      if (hasRepay) {
        let infactAmount = this.repayInputAmount;
        if (BigNumber(infactAmount).gt(borrowAmount)) infactAmount = borrowAmount;
        steps.push({
          name: intl.get('jlv2.transaction.repay'),
          amount: this.repayInputAmount,
          token: this.marketDetails.borrowSymbol,
          status: 'pending',
          action:
            borrowAddress === Config.tokens.WTRX
              ? v2ModalInfo =>
                  protocolService.repayWithTrx(
                    this.marketDetails,
                    this.repayInputAmount,
                    v2ModalInfo,
                    // this.repayWithShares ? toFixedUp(BigNumber(borrowShares).times(trc20Precision), 0) : '',
                    this.repayWithShares ? borrowShares : '',
                    this.repayWithShares
                      ? toFixedUp(BigNumber(this.repaySharesAmount).times(10 ** borrowDecimal), 0)
                      : ''
                  )
              : v2ModalInfo =>
                  protocolService.repay(
                    this.marketDetails,
                    this.repayInputAmount,
                    borrowDecimal,
                    v2ModalInfo,
                    // this.repayWithShares ? toFixedUp(BigNumber(borrowShares).times(trc20Precision), 0) : '',
                    this.repayWithShares ? borrowShares : ''
                  )
        });
      }

      if (hasRedeem) {
        steps.push({
          name: intl.get('jlv2.transaction.redeem'),
          amount: this.redeemInputAmount,
          token: this.marketDetails.collateralSymbol,
          status: 'pending',
          action:
            this.marketDetails.collateralAddress === Config.tokens.WTRX
              ? v2ModalInfo =>
                  protocolService.withdrawTrxCollateral(this.marketDetails, this.redeemInputAmount, v2ModalInfo)
              : v2ModalInfo =>
                  protocolService.withdrawCollateral(
                    this.marketDetails,
                    this.redeemInputAmount,
                    this.marketDetails.collateralDecimal,
                    v2ModalInfo
                  )
        });
      }

      if (steps.length === 0) return;

      // systemStore.openTransactionModalV2(`${intl.get('jlv2.transaction.tips3', { number: steps.length })}`, steps);
      systemStore.openTransactionModalV2('', steps);

      if (hasRepay && !hasRedeem) {
        window.gtag('event', 'PC_market_repay_pop', { 'event_category': 'PC_V2', 'event_label': 'market_repay_pop' });
      } else if (!hasRepay && hasRedeem) {
        window.gtag('event', 'PC_market_redeem_pop', { 'event_category': 'PC_V2', 'event_label': 'market_redeem_pop' });
      } else if (hasRepay && hasRedeem) {
        window.gtag('event', 'PC_market_rr_pop', { 'event_category': 'PC_V2', 'event_label': 'market_rr_pop' });
      }

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
          const newAllowance = await getAllowance(borrowAddress, userAddress, Config.contracts.MoolahProxy);

          if (newAllowance.lt(repayAmountChain)) {
            systemStore.updateStepStatusV2(step.name, 'failed');
            throw new Error(intl.get('v2.vote.approve_tip'));
          }
        }

        systemStore.updateStepStatusV2(step.name, 'success');
      }

      let modalTitle = intl.get('jlv2.transaction.successul');
      if (steps.length === 1 && hasRepay && !hasRedeem) {
        modalTitle = `${this.repayInputAmount} ${this.marketDetails.borrowSymbol} ${intl.get(
          'jlv2.transaction.repaid'
        )}`;
        if (this.repayWithShares) modalTitle = intl.get('jlv2.transaction.repaid');
      } else if (steps.length === 1 && hasRedeem && !hasRepay) {
        const assetSymbol = this.marketDetails?.collateralSymbol || 'TOKEN';
        modalTitle = `${this.redeemInputAmount} ${assetSymbol} ${intl.get('jlv2.transaction.redeemed')}`;
      }
      systemStore.setFinalStatusV2('success', modalTitle, finalTxId);

      if (hasRepay && !hasRedeem) {
        window.gtag('event', 'PC_market_repay_success', {
          'event_category': 'PC_V2',
          'event_label': 'market_repay_success'
        });
      } else if (!hasRepay && hasRedeem) {
        window.gtag('event', 'PC_market_redeem_success', {
          'event_category': 'PC_V2',
          'event_label': 'market_redeem_success'
        });
      } else if (hasRepay && hasRedeem) {
        window.gtag('event', 'PC_market_rr_success', { 'event_category': 'PC_V2', 'event_label': 'market_rr_success' });
      }

      runInAction(() => {
        this.repayInputAmount = '';
        this.redeemInputAmount = '';
        this.redeemWarningMsg = '';
        this.repayWithShares = false;
        this.showFeeSuggestionForRepay = false;
        this.redeemAllCollateral = false;
      });
      const bumpMining = () => this.rootStore.dashboardStore?.bumpMiningRefresh?.();
      this.fetchAllMarketData(this.marketDetails.marketId, userAddress, false);
      bumpMining();
      setTimeout(() => {
        this.fetchAllMarketData(this.marketDetails.marketId, userAddress, false);
        bumpMining();
      }, additionalCallBackTime);
    } catch (error) {
      console.error('Repay/Redeem sequence failed:', error);
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
          this.currentFinalTxId = '';
          const lang = window.localStorage.getItem('lang') || intl.options.currentLocale;
          errorTitle = `${lang === 'en-US' ? '' : this.currentActionName}${intl.get('jlv2.transaction.tips4')}`;
        }
        if (
          this.rootStore.system.transactionStateV2.steps?.length > 1 &&
          this.currentActionName === intl.get('jlv2.transaction.redeem')
        ) {
          this.repayInputAmount = '';
          this.repayWithShares = false;
          this.redeemAllCollateral = false;
          const bumpMining = () => this.rootStore.dashboardStore?.bumpMiningRefresh?.();
          this.fetchAllMarketData(this.marketDetails.marketId, userAddress, false);
          bumpMining();
          setTimeout(() => {
            this.fetchAllMarketData(this.marketDetails.marketId, userAddress, false);
            bumpMining();
          }, additionalCallBackTime);
        }
        systemStore.setFinalStatusV2('failed', errorTitle, this.currentFinalTxId, { isRejected });
      }
    }
  };
}
