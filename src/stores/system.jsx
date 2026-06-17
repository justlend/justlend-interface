// Libraries
import { observable, makeObservable, action, runInAction } from 'mobx';
import { message } from 'antd';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import Config from '../config';
import { utils as TronWebUtils } from 'tronweb';
import { WALLET_TYPES } from '../utils/constant';
import { triggerSmartContract, sendRawTransaction, MAX_UINT256, tronObj } from '../utils/blockchain';
import { addressToHex, BigNumber, setTransactionsData, getInjectedTronWeb } from '../utils/helper';

// TRC-20 tokens (USDT/USDC/USDJ) require allowance to be reset to 0 before
// setting a new non-zero allowance, otherwise approve() reverts on-chain.
// See EIP-20 approve race condition.
const NEEDS_APPROVE_RESET = new Set(['USDT', 'USDC', 'USDJ']);

export default class SystemStore {
  @observable transModalInfo = {
    visible: false,
    step: 1,
    title: '',
    obj: {},
    txId: '',
    callbacks: false,
    declined: false,
    transType: '' // deposit/withdraw/borrow/repay/approve/mortgage
  };

  @observable transactionStateV2 = {
    // Renamed to avoid conflict with V1
    isOpen: false,
    description: '',
    steps: [],
    finalStatus: null,
    successMessage: '',
    errorMessage: '',
    txId: '',
    isRejected: false
  };

  @observable broadcastError = false;
  @observable rejected = false;
  @observable mobile = isMobile(window.navigator).any;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  // --- v1 modal methods ---
  openTransModal = action(newInfo => {
    this.transModalInfo.visible = true;
    Object.assign(this.transModalInfo, newInfo);
  });

  hideTransModal = action(() => {
    const callbacks = this.transModalInfo.callbacks;
    this.transModalInfo = {
      visible: false,
      step: 1,
      title: '',
      obj: {},
      txId: '',
      callbacks: false
    };
    callbacks && this.executeCallback(callbacks, 0);
  });

  clearRejectError = action(() => {
    this.transModalInfo = {
      visible: false,
      step: 1,
      title: '',
      obj: {},
      txId: '',
      callbacks: false,
      declined: false,
      transType: ''
    };
  });

  // --- V2 Modal Control Actions ---
  openTransactionModalV2 = (description, steps) => {
    runInAction(() => {
      this.transactionStateV2 = {
        isOpen: true,
        description,
        steps,
        finalStatus: null,
        successMessage: '',
        errorMessage: '',
        txId: '',
        isRejected: false
      };
    });
  };
  updateStepStatusV2 = (stepName, status) => {
    const step = this.transactionStateV2.steps.find(s => s.name === stepName);
    if (step)
      runInAction(() => {
        step.status = status;
      }); // Use runInAction
  };
  setFinalStatusV2 = (status, message, txId, { isRejected = false, errorDesc = '', txnType } = {}) => {
    runInAction(() => {
      // Use runInAction
      this.transactionStateV2.finalStatus = status;
      this.transactionStateV2.txId = txId || '';
      if (status === 'success') {
        this.transactionStateV2.successMessage = message;
      } else {
        this.transactionStateV2.errorMessage = message;
        if (isRejected) {
          this.transactionStateV2.isRejected = true;
        }
        if (errorDesc) {
          this.transactionStateV2.errorDesc = errorDesc;
        }
        if (txnType) {
          this.transactionStateV2.txnType = txnType;
        }
      }
    });
  };
  closeTransactionModalV2 = () => {
    runInAction(() => {
      this.transactionStateV2.isOpen = false;
      this.transactionStateV2.txId = '';
      this.transactionStateV2.finalStatus = null;
      this.transactionStateV2.successMessage = '';
      this.transactionStateV2.errorMessage = '';
      this.transactionStateV2.isRejected = false;
    });
  };

  trigger = async (
    address,
    functionSelector,
    parameters = [],
    options = {},
    intlObj = {},
    callbacks = false,
    extension = false,
    loadingFlag = false
  ) => {
    try {
      if (this.rootStore.connect.client && this.rootStore.network.isConnected) {
        this.openTransModal({ ...intlObj, step: 4 });
      } else if (this.rootStore.network.isLedgerConnected) {
        this.openTransModal({ ...intlObj, step: 5 });
      } else {
        this.openTransModal({ ...intlObj, step: 1 });
      }
      const transaction = await triggerSmartContract(
        address,
        functionSelector,
        Object.assign({ feeLimit: Config.feeLimit }, options),
        parameters,
        addressToHex(window.defaultAccount),
        extension
      );
      let result;
      let signedTransaction;
      let isBinanceProcessed = false;
      if (
        this.rootStore.connect.client &&
        this.rootStore.network.isConnected &&
        this.rootStore.network.walletType === WALLET_TYPES.WALLETCONNECT
      ) {
        try {
          signedTransaction = await this.rootStore.connect.client.signTransaction(transaction.transaction);
        } catch (e) {
          if (e?.error?.message?.includes('No matching key')) {
            window.localStorage.setItem('wc@2:client:0.3//session', '[]');
            window.location.reload();
            return {};
          }
          if (e?.error?.code === -32000 || e?.message?.indexOf('Cancel') > -1) {
            this.openTransModal({ ...intlObj, step: 3, declined: true });
            return {};
          }
          console.error('Unhandled WalletConnect sign error', e);
        }
        if (!signedTransaction) {
          this.openTransModal({ ...intlObj, step: 3 });
          return {};
        }
      } else if (
        this.rootStore.ledger.client &&
        this.rootStore.network.isLedgerConnected &&
        this.rootStore.network.walletType === WALLET_TYPES.LEDGER
      ) {
        signedTransaction = await this.rootStore.ledger.client.signTransaction(transaction.transaction);
      } else if (window?.okxwallet?.tronLink?.ready && this.rootStore.network.walletType === 'okx') {
        signedTransaction = await window?.okxwallet?.tronLink.tronWeb.trx.sign(transaction.transaction);
      } else if (window?.tokenpocket?.tron?.tronWeb && this.rootStore.network.walletType === WALLET_TYPES.TOKENPOCKET) {
        signedTransaction = await window.tokenpocket.tron.tronWeb.trx.sign(transaction.transaction);
      } else if (window.defaultAccount && this.rootStore.network.walletType === WALLET_TYPES.BINANCE) {
        const adapter = this.rootStore.network.adapters[WALLET_TYPES.BINANCE];
        const broadcastResponse = await adapter.signAndSendTransaction(transaction.transaction);
        const broadcastOk = !!broadcastResponse?.transaction?.txID;
        result = { ...broadcastResponse, result: broadcastOk };
        isBinanceProcessed = true;
      } else if (window?.tronOfTronLink?.tronWeb?.ready) {
        signedTransaction = await window.tronOfTronLink.tronWeb.trx.sign(transaction.transaction);
      } else if (window?.tron?.tronWeb?.ready) {
        signedTransaction = await window.tron.tronWeb.trx.sign(transaction.transaction);
      } else if (window?.tronWeb?.ready) {
        signedTransaction = await window.tronWeb.trx.sign(transaction.transaction);
      } else {
        signedTransaction = await this.rootStore.network.adapters[WALLET_TYPES.TRONLINK].signTransaction(
          transaction.transaction
        );
      }

      const CONFIRMATION_TIMEOUT = 60 * 1000;
      if (!isBinanceProcessed) {
        result = await sendRawTransaction(signedTransaction);
      }
      if (result && result.result) {
        this.rootStore.transaction.addTransaction({ tx: result.transaction.txID, intlObj });
      }
      if (result && result.code && result.code === 'TRANSACTION_EXPIRATION_ERROR') {
        this.openTransModal({ ...intlObj, step: 9 });
        return {};
      }

      //if approve failed, show error modal
      if (intlObj.action === 'approve' && !result.result && result?.code) {
        this.openTransModal({ ...intlObj, step: 10 });
        return {};
      }

      if (!result || !result.transaction || !result.transaction.txID || result?.code?.indexOf('ERROR') > -1) {
        message.warning(intl.get('broadcast_failed'), 2);
        this.hideTransModal();
        this.broadcastError = true;
        return {};
      } else {
        this.broadcastError = false;
      }

      const txID = result.transaction.txID;
      if (loadingFlag) {
        this.openTransModal({ ...intlObj, step: 8, txId: txID });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Transaction confirmation timed out after 1 minute.')),
            CONFIRMATION_TIMEOUT
          )
        );

        const confirmation = await Promise.race([this.getTransactionInfoResult(intlObj, result), timeoutPromise]);

        if (confirmation && confirmation.success) {
          setTransactionsData(txID, intlObj);
        }
      } else {
        this.openTransModal({ ...intlObj, step: 2, txId: txID });
      }

      callbacks && this.executeCallback(callbacks);
      return result;
    } catch (error) {
      console.log('sign error: ', error);
      if (error?.message?.includes('timed out')) {
        console.warn('Transaction confirmation check timed out.');
        message.warning(intl.get('confirm_timeout'), 2);
        this.hideTransModal();
      }
      if (error?.message?.includes('Dapp not connected')) {
        message.warning(intl.get('index.acc_notconnected'), 2);
        this.hideTransModal();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      if (
        (error &&
          error.message &&
          (error.message.indexOf('denied by the user?') > -1 ||
            error.message == 'Confirmation declined by user' ||
            error.message.indexOf('User denied request signature') > -1)) || // for okx wallet sign denied
        error.message?.indexOf('User rejected the request') > -1 || // // for tp wallet sign denied
        String(error)?.indexOf('denied by the user?') > -1 ||
        error === 'Confirmation declined by user' ||
        String(error)?.indexOf('WalletSignTransactionError') > -1 ||
        error === 'Transaction canceled' || // for android okx
        error === 'cancle' || // for android tronlink
        error === 'cancel' || // for android tronlink
        error === 'Cancelled' || // for ios tokenpocket
        error?.code === 4001 // for android imtoken
      ) {
        this.openTransModal({ ...intlObj, step: 3, declined: true });
      }
      console.log(`trigger error`, error.message ? error.message : error);
      return {};
    }
  };

  triggerV2 = async (
    address,
    functionSelector,
    parameters = [],
    options = {},
    // V2 trigger takes description and step names from the calling store
    v2ModalInfo = { description: 'Transaction in progress', steps: [] },
    extension = false,
    revertCheck = true
  ) => {
    // Open the V2 modal immediately
    runInAction(() => {
      this.rejected = false;
      this.broadcastError = false;
    });
    this.openTransactionModalV2(v2ModalInfo.description, v2ModalInfo.steps);
    const currentStep = v2ModalInfo.steps.find(s => s.status === 'pending');
    const currentStepName = currentStep ? currentStep.name : 'Transaction';
    let isTriggerPassed = false; // check if trigger is passed

    try {
      const transaction = await triggerSmartContract(
        address,
        functionSelector,
        Object.assign({ feeLimit: Config.feeLimit }, options),
        parameters,
        addressToHex(window.defaultAccount),
        extension,
        revertCheck
      );

      isTriggerPassed = true;

      this.updateStepStatusV2(currentStepName, 'signing');
      let signedTransaction;
      if (
        this.rootStore.connect.client &&
        this.rootStore.network.isConnected &&
        this.rootStore.network.walletType === WALLET_TYPES.WALLETCONNECT
      ) {
        signedTransaction = await this.rootStore.connect.client.signTransaction(transaction.transaction);
      } else if (
        this.rootStore.ledger.client &&
        this.rootStore.network.isLedgerConnected &&
        this.rootStore.network.walletType === WALLET_TYPES.LEDGER
      ) {
        signedTransaction = await this.rootStore.ledger.client.signTransaction(transaction.transaction);
      } else if (window?.okxwallet?.tronLink?.ready && this.rootStore.network.walletType === 'okx') {
        signedTransaction = await window?.okxwallet?.tronLink.tronWeb.trx.sign(transaction.transaction);
      } else if (window?.tokenpocket?.tron?.tronWeb && this.rootStore.network.walletType === WALLET_TYPES.TOKENPOCKET) {
        signedTransaction = await window.tokenpocket.tron.tronWeb.trx.sign(transaction.transaction);
      } else if (window?.tronOfTronLink?.tronWeb?.ready) {
        signedTransaction = await window.tronOfTronLink.tronWeb.trx.sign(transaction.transaction);
      } else if (window?.tron?.tronWeb?.ready) {
        signedTransaction = await window.tron.tronWeb.trx.sign(transaction.transaction);
      } else if (window?.tronWeb?.ready) {
        signedTransaction = await window.tronWeb.trx.sign(transaction.transaction);
      } else if (window.defaultAccount && this.rootStore.network.walletType === WALLET_TYPES.BINANCE) {
        signedTransaction = await this.rootStore.network.adapters[WALLET_TYPES.BINANCE].signTransaction(
          transaction.transaction
        );
      } else {
        signedTransaction = await this.rootStore.network.adapters[WALLET_TYPES.TRONLINK].signTransaction(
          transaction.transaction
        );
      }

      const result = await sendRawTransaction(signedTransaction);

      if (!result || !result.transaction || !result.transaction.txID || result?.code?.indexOf('ERROR') > -1) {
        // if (this.mobile) {
        //   message.warning(intl.get('broadcast_failed'), 2);
        //   this.closeTransactionModalV2();
        //   return {};
        // } else {
        runInAction(() => {
          this.broadcastError = true;
        });
        throw new Error(result?.code || 'BROADCAST_ERROR');
        // }
      } else {
        runInAction(() => {
          this.broadcastError = false;
        });
      }

      return result;
    } catch (error) {
      console.error('triggerV2 error:', error);

      let errorMessage = intl.get('jlv2.transaction.review_error');
      if (error?.message?.includes('timed out')) {
        errorMessage = intl.get('jlv2.transaction.timeout');
        message.warning(intl.get('confirm_timeout'), 2);
        this.closeTransactionModalV2();
      }

      if (
        (error &&
          error.message &&
          (error.message.indexOf('denied by the user?') > -1 ||
            error.message == 'Confirmation declined by user' ||
            error.message.indexOf('User denied request signature') > -1)) || // for okx wallet sign denied
        error.message?.indexOf('User rejected the request') > -1 || // // for tp wallet sign denied
        String(error)?.indexOf('denied by the user?') > -1 ||
        error === 'Confirmation declined by user' ||
        String(error)?.indexOf('WalletSignTransactionError') > -1 ||
        error === 'Transaction canceled' || // for android okx
        error === 'cancle' || // for android tronlink
        error === 'cancel' || // for android tronlink
        error === 'Cancelled' || // for ios tokenpocket
        error?.code === 4001 // for android imtoken
      ) {
        errorMessage = intl.get('settings.bind_email_modal.wallet_rejected');
        runInAction(() => {
          this.rejected = true;
        });
        throw error;
        
      }

      if (error?.message?.includes('REVERT') || error?.includes('REVERT')) {
        if (v2ModalInfo?.txnType === 'liquidate' && !isTriggerPassed) {
          runInAction(() => {
            this.broadcastError = false;
          });
          throw new Error('liquidate trigger failed');
        } else {
          runInAction(() => {
            this.broadcastError = true;
          });
          throw error;
        }
      }

      // Handling cases where TronLink watch-only wallet signature fails on mobile
      if (error?.includes('Invalid transaction provided') || error?.message?.includes('Invalid transaction provided')) {
        this.closeTransactionModalV2();
      }

      // this.setFinalStatusV2('failed', errorMessage, '');
      throw error;
    }
  };

  getTransactionInfoResult = async (intlObj, result) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const MAX_ATTEMPTS = 20;
      const txID = result.transaction.txID;

      const interval = setInterval(async () => {
        attempts++;

        if (attempts > MAX_ATTEMPTS) {
          clearInterval(interval);
          console.warn(`Transaction ${txID} not found after ${MAX_ATTEMPTS} attempts.`);
          resolve({ success: false, message: 'Transaction confirmation timed out.' });
          return;
        }

        try {
          const transaction = await tronObj.tronWeb.trx.getUnconfirmedTransactionInfo(txID);

          if (transaction?.receipt) {
            clearInterval(interval);

            if (transaction.receipt.result?.toLowerCase() === 'success') {
              this.openTransModal({ ...intlObj, step: 82, txId: txID });
              resolve({ success: true, message: 'Transaction successful.' });
            } else {
              this.openTransModal({ ...intlObj, step: 83, txId: txID });
              resolve({ success: false, message: 'Transaction failed on-chain (REVERT).' });
            }
          }
        } catch (error) {
          console.error(`Error polling for transaction ${txID}:`, error);
          clearInterval(interval);
          reject(error);
        }
      }, 3000);
    });
  };

  view = async (address, functionSelector, parameters = [], isDappTronWeb = true) => {
    try {
      const result = await triggerSmartContract(address, functionSelector, { _isConstant: true }, parameters);
      return result && result.result ? result.constant_result : [];
    } catch (error) {
      console.log(`view error`, error.message ? error.message : error);
      return [];
    }
  };

  signMessage = async () => {
    try {
      let currentTimeStamp = new Date().getTime().toString();
      const tronWeb = getInjectedTronWeb(this.rootStore.network.walletType); // use injected tronweb to sign
      if (this.rootStore.currentAppName === 'imToken Wallet') {
        return false;
        // currentTimeStamp = tronWeb?.sha3(currentTimeStamp);
        // const result = await tronWeb.trx.sign(currentTimeStamp.slice(2));
        // return result;
      }
      const result = await tronWeb.trx.sign(currentTimeStamp);
      return result;
    } catch (error) {
      console.log(`signMessage error: ${error}`);
      return false;
    }
  };

  viewEnergy = async (address, functionSelector, parameters = [], isDappTronWeb = true) => {
    try {
      const result = await triggerSmartContract(address, functionSelector, { estimateEnergy: true }, parameters);
      return result && result.result ? result.constant_result : [];
    } catch (error) {
      console.log(`view error`, error.message ? error.message : error);
      return [];
    }
  };

  // Poll the chain until the given txID is confirmed. Returns true on success,
  // false on failure/timeout. Used to chain approve(0) -> approve(MAX) safely.
  waitForTxConfirmation = async (txID, maxAttempts = 20, intervalMs = 3000) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const info = await tronObj.tronWeb.trx.getUnconfirmedTransactionInfo(txID);
        if (info?.receipt) {
          return info.receipt.result?.toLowerCase() === 'success';
        }
      } catch (error) {
        console.error(`waitForTxConfirmation error for ${txID}:`, error);
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    return false;
  };

  // Approve wrapper that handles the TRC-20 USDT/USDC/USDJ approve race
  // condition: if the token requires a reset and currentAllowance > 0, first
  // issue approve(spender, 0), wait for confirmation, then approve(spender, MAX).
  safeApprove = async ({ contractAddress, spender, symbol, currentAllowance, intlObj, options = {} }) => {
    const needsReset =
      NEEDS_APPROVE_RESET.has(String(symbol || '').toUpperCase()) &&
      currentAllowance &&
      BigNumber(currentAllowance).gt(0);

    if (needsReset) {
      const resetResult = await this.trigger(
        contractAddress,
        'approve(address,uint256)',
        [
          { type: 'address', value: spender },
          { type: 'uint256', value: '0' }
        ],
        options,
        intlObj,
        false,
        false,
        true // loadingFlag: wait for on-chain confirmation before proceeding
      );

      if (!resetResult || !resetResult.transaction || !resetResult.transaction.txID) {
        return '';
      }

      const confirmed = await this.waitForTxConfirmation(resetResult.transaction.txID, 3, 1000);
      if (!confirmed) return '';
    }

    const result = await this.trigger(
      contractAddress,
      'approve(address,uint256)',
      [
        { type: 'address', value: spender },
        { type: 'uint256', value: MAX_UINT256 }
      ],
      options,
      intlObj
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  approveToken = async (popData, callbacks = false, options = {}) => {
    const intlObj = {
      action: 'approve',
      title: 'deposit.confirm_approve',
      transType: popData.transType,
      callbacks
    };
    const txID = await this.lendApprove(popData, intlObj, options);
    txID && this.hideTransModal();
    return txID;
  };

  lendApprove = async (token, intlObj, options = {}) => {
    return this.safeApprove({
      contractAddress: token.collateralAddress,
      spender: token.jtokenAddress,
      symbol: token.collateralSymbol,
      currentAllowance: token.currentAllowance,
      intlObj,
      options
    });
  };

  approveWstUSDTToken = async (popData, token, callbacks = false, options = {}, meta = {}) => {
    const intlObj = {
      action: 'approve',
      title: 'deposit.confirm_approve',
      transType: popData.transType,
      callbacks
    };
    const txID = await this.lendWstUSDTApprove(token, intlObj, options, meta);
    txID && this.hideTransModal();
    return txID;
  };

  lendWstUSDTApprove = async (token, intlObj, options, meta = {}) => {
    return this.safeApprove({
      contractAddress: token,
      spender: Config.SwapRouter,
      symbol: meta.symbol,
      currentAllowance: meta.currentAllowance,
      intlObj,
      options
    });
  };

  justMint = async (token, amount, intlObj) => {
    intlObj.callbacks = [['market/hideDAWPop']];
    let funcSelector = 'mint(uint256)';
    let parameters = [{ type: 'uint256', value: amount }];
    let options = {};
    if (token.collateralAddress === Config.zeroAddr) {
      funcSelector = 'mint()';
      parameters = [];
      options = { callValue: amount };
    }
    const result = await this.trigger(
      token.jtokenAddress,
      funcSelector,
      parameters,
      options,
      intlObj,
      [['user/getUserData'], ['user/getUserDataFromMarkets'], ['market/getMarketData']],
      false,
      true
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  justMintWstUSDT = async (token, amount, intlObj, options = {}) => {
    intlObj.callbacks = [['market/hideDAWPop']];
    let funcSelector = '';
    if (token === 'usdt') {
      funcSelector = 'usdtToJwstUSDT(uint256)';
    } else {
      funcSelector = 'stUSDTToJwstUSDT(uint256)';
    }
    let parameters = [{ type: 'uint256', value: amount }];
    const result = await this.trigger(
      Config.SwapRouter,
      funcSelector,
      parameters,
      options,
      intlObj,
      [['user/getUserData'], ['user/getUserDataFromMarkets'], ['market/getMarketData']],
      false,
      true
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  justMintValue = async (token, amount, intlObj) => {
    intlObj.callbacks = [['market/hideDAWPop']];
    let funcSelector = 'mint(uint256)';
    let parameters = [{ type: 'uint256', value: amount }];
    let options = { _isConstant: true };
    if (token.collateralAddress === Config.zeroAddr) {
      funcSelector = 'mint()';
      parameters = [];
      options = { callValue: amount, _isConstant: true };
    }
    const result = await this.triggerEnergy(token.jtokenAddress, funcSelector, parameters, options);

    return result && result.energy_used;
  };

  triggerEnergy = async (address, functionSelector, parameters = [], options = {}) => {
    try {
      const transaction = await triggerSmartContract(
        address,
        functionSelector,
        Object.assign({ feeLimit: Config.feeLimit }, options),
        parameters
      );

      return transaction;
    } catch (error) {
      console.log(`trigger error`, error.message ? error.message : error);
      return {};
    }
  };

  justRedeem = async (token, amount, intlObj, assetIsCToken = false, options = {}) => {
    intlObj.callbacks = [['market/hideDAWPop']];
    const method = assetIsCToken ? 'redeem(uint256)' : 'redeemUnderlying(uint256)';
    const result = await this.trigger(
      token.jtokenAddress,
      method,
      [{ type: 'uint256', value: amount }],
      options,
      intlObj,
      [['user/getUserData'], ['user/getUserDataFromMarkets'], ['market/getMarketData']],
      false,
      true
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  openMortgage = async (contractAddr, jTokens = '', intlObj, options = {}) => {
    intlObj.callbacks = [['lend/hideMortgageModal']];
    const result = await this.trigger(
      contractAddr,
      'enterMarket(address)',
      [{ type: 'address', value: jTokens }],
      options,
      intlObj,
      [['user/getUserData'], ['user/getUserDataFromMarkets'], ['market/getMarketData']]
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  lockMortgage = async (contractAddr, jTokens = '', intlObj, options = {}) => {
    intlObj.callbacks = [['lend/hideMortgageModal']];
    const result = await this.trigger(
      contractAddr,
      'exitMarket(address)',
      [{ type: 'address', value: jTokens }],
      options,
      intlObj,
      [['user/getUserData'], ['user/getUserDataFromMarkets'], ['market/getMarketData']]
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  borrow = async (token, amount, intlObj, options = {}) => {
    intlObj.callbacks = [['lend/hideBorrowModal']];
    let funcSelector = 'borrow(uint256)';
    let parameters = [{ type: 'uint256', value: amount }];
    const result = await this.trigger(
      token.jtokenAddress,
      funcSelector,
      parameters,
      options,
      intlObj,
      [['user/getUserData'], ['user/getUserDataFromMarkets'], ['market/getMarketData']],
      false,
      true
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  repayBorrow = async (token, amount, intlObj, trxAmount = 0, isClear = false, options = {}) => {
    intlObj.callbacks = [['lend/hideBorrowModal']];
    let funcSelector = 'repayBorrow(uint256)';
    let parameters = [{ type: 'uint256', value: amount }];
    if (token.collateralAddress === Config.zeroAddr) {
      // funcSelector = 'repayBorrow()';
      // parameters = [];
      options = { callValue: isClear ? trxAmount : amount };
    }
    const result = await this.trigger(
      token.jtokenAddress,
      funcSelector,
      parameters,
      options,
      intlObj,
      [['user/getUserData'], ['user/getUserDataFromMarkets'], ['market/getMarketData']],
      false,
      true
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  repayBorrowWstUSDT = async (token, amount, intlObj, trxAmount = 0, isClear = false, options = {}) => {
    intlObj.callbacks = [['lend/hideBorrowModal']];
    let funcSelector = '';
    if (token === 'usdt') {
      funcSelector = 'repayByUSDT(uint256)';
    } else {
      funcSelector = 'repayByStUSDT(uint256)';
    }
    let parameters = [{ type: 'uint256', value: amount }];
    const result = await this.trigger(
      Config.SwapRouter,
      funcSelector,
      parameters,
      options,
      intlObj,
      [['user/getUserData'], ['user/getUserDataFromMarkets'], ['market/getMarketData']],
      false,
      true
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  repayBorrowValue = async (token, intlObj, trxAmount = 0) => {
    intlObj.callbacks = [['lend/hideBorrowModal']];
    let funcSelector = 'repayBorrow(uint256)';
    let parameters = [{ type: 'uint256', value: '0x0' }];
    let options = { callValue: trxAmount, _isConstant: true };
    const result = await this.triggerEnergy(token.jtokenAddress, funcSelector, parameters, options);
    return result && result.energy_used;
  };

  // swap
  voteDeposit = async (token, intlObj, feeLimit = false) => {
    intlObj.callbacks = [['vote/hideExchangeVotePop']];
    let funcSelector = 'deposit(uint256)';
    let parameters = [{ type: 'uint256', value: token.amount }];
    let options = {};
    if (token.collateralAddress === Config.zeroAddr) {
      funcSelector = 'mint()';
      parameters = [];
      options = { callValue: token.amount };
    }
    if (feeLimit) options = { ...options, ...{ feeLimit } };
    const result = await this.trigger(token.jtokenAddress, funcSelector, parameters, options, intlObj, [
      ['vote/getVoteList'],
      ['vote/getBalanceForVote'],
      ['vote/getOldWjstBalanceForVote']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  // withdraw
  voteWithdraw = async (token, intlObj, options = {}) => {
    intlObj.callbacks = [['vote/hideWithdrawPop']];
    let funcSelector = 'withdraw(uint256)';
    let parameters = [{ type: 'uint256', value: token.amount }];
    if (token.collateralAddress === Config.zeroAddr && Object.keys(options).length === 0) {
      funcSelector = 'mint()';
      parameters = [];
      options = { callValue: token.amount };
    }
    const result = await this.trigger(token.jtokenAddress, funcSelector, parameters, options, intlObj, [
      ['vote/getVoteList'],
      ['vote/getBalanceForVote'],
      ['vote/getOldWjstBalanceForVote']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  // vote
  castVote = async (token, intlObj) => {
    intlObj.callbacks = [['vote/hideVoteForPop']];
    let funcSelector = 'castVote(uint256,uint256,uint8)';
    let parameters = [
      {
        type: 'uint256',
        value: token.proposalId
      },
      {
        type: 'uint256',
        value: token.totalVotes
        // value: token.votes
      },
      {
        type: 'uint8',
        value: token.support ? '1' : '0'
      }
    ];
    let options = {};
    const result = await this.trigger(token.contractAddr, funcSelector, parameters, options, intlObj, [
      ['vote/getBalanceForVote'],
      ['vote/getOldWjstBalanceForVote'],
      ['vote/getUserDetail', token.proposalId],
      ['vote/getVoteDetail', token.proposalId]
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  // withdraw
  withdrawVotes = async (token, intlObj, options = {}) => {
    intlObj.callbacks = [['vote/hideVoteForPop']];
    let funcSelector = 'withdrawVotes(uint256)';
    let parameters = [
      {
        type: 'uint256',
        value: token.proposalId
      }
    ];
    const result = await this.trigger(token.contractAddr, funcSelector, parameters, options, intlObj, [
      ['vote/getBalanceForVote'],
      ['vote/getOldWjstBalanceForVote'],
      ['vote/getUserDetail', token.proposalId],
      ['vote/getUserVote', token.proposalId],
      ['vote/getUserWithdrawInfo']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  lockTo = async token => {
    let funcSelector = 'lockTo(address,uint256)';
    let parameters = [
      {
        type: 'address',
        value: token.userAddr
      },
      {
        type: 'uint256',
        value: token.proposalId
      }
    ];
    let options = {};
    const result = await this.view(token.contractAddr, funcSelector, parameters, options, [
      ['user/getUserData'],
      ['market/getMarketData']
    ]);
    if (result.length) {
      const data = BigNumber(result[0], 16);
      return data;
    }
  };

  getBalance = async (address, tokens) => {
    const result = await this.view(Config.contract.poly, 'getBalance(address,address[])', [
      { type: 'address', value: address },
      { type: 'address[]', value: tokens }
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  getVoteInfo = async (contractAddr, userAddr, jstAddr, wjstAddr) => {
    let funcSelector = 'getVoteInfo(address,address,address)';
    let parameters = [
      {
        type: 'address',
        value: userAddr
      },
      {
        type: 'address',
        value: jstAddr
      },
      {
        type: 'address',
        value: wjstAddr
      }
    ];
    let options = {};
    let result = await this.view(contractAddr, funcSelector, parameters, options, []);

    let jstBalance = new BigNumber(0);
    let surplusVotes = new BigNumber(0);
    let totalVote = new BigNumber(0);
    let castVote = new BigNumber(0);
    let success = false;

    if (result.length) {
      const data = result[0];
      let dataIndex = 0;
      const DATA_LEN = 64;
      jstBalance = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      surplusVotes = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      totalVote = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      castVote = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      success = true;
    }
    return {
      jstBalance,
      surplusVotes,
      totalVote,
      castVote,
      success
    };
  };

  setData = (obj = {}) => {
    const self = this;
    Object.keys(obj).map(key => {
      self[key] = obj[key];
    });
  };

  executeCallback = (args = [], timeout = 5000) => {
    args.map(arg => {
      let method = arg.shift();
      // Edge case: Skip executing this here so it's only called after an error (via lookForCleanCallBack)
      // If the callback is to execute a getter function is better to wait as sometimes the new value is not uopdated instantly when the tx is confirmed
      setTimeout(() => {
        method = method.split('/');
        if (method[0] === 'system') {
          this[method[1]](...arg);
        } else {
          let object = null;
          switch (method[0]) {
            case 'network':
              object = this.rootStore.network;
              break;
            case 'lend':
              object = this.rootStore.lend;
              break;
            case 'market':
              object = this.rootStore.market;
              break;
            case 'vote':
              object = this.rootStore.vote;
              break;
            case 'user':
              object = this.rootStore.user;
              break;
            default:
              break;
          }
          object && object[method[1]](...arg);
        }
      }, timeout);
    });
  };

  yamApprove = async (token, intlObj, options = {}) => {
    if (token.symbol === 'TRX') {
      return '';
    }

    return this.safeApprove({
      contractAddress: token.token,
      spender: token.pool,
      symbol: token.symbol,
      currentAllowance: token.currentAllowance,
      intlObj,
      options
    });
  };

  yamDeposit = async (token, amount, intlObj, feeLimit) => {
    let funcSelector = 'stake(uint256)';
    let parameters = [{ type: 'uint256', value: amount }];
    let options = {};
    if (token.symbol === 'TRX') {
      funcSelector = 'stake()';
      parameters = [];
      options = { callValue: amount };
    } else if (token.vote === 'sunoldVote') {
      funcSelector = 'stake(uint256,address)';
      parameters = [
        { type: 'uint256', value: amount },
        { type: 'address', value: token.voteAddr }
      ];
    }
    options = { ...options, ...{ feeLimit } };

    const result = await this.trigger(token.pool, funcSelector, parameters, options, intlObj);
    return result && result.transaction ? result.transaction.txID : '';
  };

  yamReward = async (token, intlObj, options = {}) => {
    const result = await this.trigger(token.pool, 'getReward()', [], options, intlObj);
    return result && result.transaction ? result.transaction.txID : '';
  };

  yamWithdraw = async (token, amount, intlObj, options = {}) => {
    const result = await this.trigger(
      token.pool,
      'withdrawAndGetReward(uint256)',
      [{ type: 'uint256', value: amount }],
      options,
      intlObj
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  getMultiReward = async (
    parametersV2,
    intlObj,
    feeLimit = false,
    contractAddress = Config.merkleDistributor,
    funcSelector = 'multiClaim((uint256,uint256,uint256,bytes32[])[])' 
  ) => {
    const isArrayAmount = funcSelector.includes('uint256[],bytes32');
    const amountType = isArrayAmount ? 'uint256[]' : 'uint256';

    const funcAbi = [
      {
        'inputs': [
          {
            'components': [
              {
                'internalType': 'uint256',
                'name': 'merkleIndex',
                'type': 'uint256'
              },
              {
                'internalType': 'uint256',
                'name': 'index',
                'type': 'uint256'
              },
              {
                'internalType': amountType,
                'name': 'amount',
                'type': amountType
              },
              {
                'internalType': 'bytes32[]',
                'name': 'merkleProof',
                'type': 'bytes32[]'
              }
            ],
            'internalType': isArrayAmount
              ? 'struct MultiMerkleDistributor.Basic[]'
              : 'struct MerkleDistributor.Basic[]',
            'name': 'basic',
            'type': 'tuple[]'
          }
        ],
        'name': 'multiClaim',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      }
    ];
    const rawParameter = TronWebUtils.abi.encodeParamsV2ByABI(funcAbi[0], parametersV2);

    let options = { shieldedParameter: rawParameter };
    if (feeLimit) options = { shieldedParameter: rawParameter, feeLimit };

    const result = await this.trigger(contractAddress, funcSelector, [], options, intlObj, false, 300);

    return result && result.transaction ? result.transaction.txID : '';
  };

  getAllowanceMultiReward = async (parametersV2, intlObj, feeLimit = false) => {
    const funcAbi = [
      {
        'inputs': [
          {
            'components': [
              {
                'internalType': 'uint256',
                'name': 'merkleIndex',
                'type': 'uint256'
              },
              {
                'internalType': 'uint256',
                'name': 'index',
                'type': 'uint256'
              },
              {
                'internalType': 'uint256',
                'name': 'amount',
                'type': 'uint256'
              },
              {
                'internalType': 'bytes32[]',
                'name': 'merkleProof',
                'type': 'bytes32[]'
              }
            ],
            'internalType': 'struct MerkleDistributor.Basic[]',
            'name': 'basic',
            'type': 'tuple[]'
          }
        ],
        'name': 'multiClaim',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      }
    ];
    const rawParameter = TronWebUtils.abi.encodeParamsV2ByABI(funcAbi[0], parametersV2);
    let options = { shieldedParameter: rawParameter };
    if (feeLimit) options = { shieldedParameter: rawParameter, feeLimit };
    const functionSelector = 'multiClaim((uint256,uint256,uint256,bytes32[])[])';

    const result = await this.trigger(
      Config.sTRX.merkleDistributor,
      functionSelector,
      [],
      options,
      intlObj,
      false,
      300
    );

    return result && result.transaction ? result.transaction.txID : '';
  };

  getRentInfo = async (address, resourceType, receiverAddress = '') => {
    const result = await this.view(Config.contract.marketProxyContract, 'getRentInfo(address,address,uint256)', [
      { type: 'address', value: address },
      { type: 'address', value: receiverAddress || address },
      { type: 'uint256', value: resourceType }
    ]);

    let securityDeposit = BigNumber(0);
    let index = BigNumber(0);
    let success = false;

    if (result.length) {
      const data = result[0];
      let dataIndex = 0;
      const DATA_LEN = 64;
      securityDeposit = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      index = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      success = true;
    }
    return {
      securityDeposit,
      index,
      success
    };
  };

  getUsageChargeRatio = async () => {
    try {
      const result = await this.view(Config.contract.marketProxyContract, 'usageChargeRatio()', []);
      const DATA_LEN = 64;

      if (result.length) {
        const data = result[0];
        const DATA_LEN = 64;
        const res = new BigNumber(data.substr(0, DATA_LEN), 16);
        return {
          success: true,
          data: res?.div(1e18)
        };
      }
    } catch (error) {
      console.log(`getusageChargeRatio: ${error}`);
      return {
        success: false
      };
    }
  };

  getStrxDepositEnergyReqired = async (amount, intlObj) => {
    let funcSelector = 'deposit()';
    let parameters = [];
    let options = { callValue: amount, _isConstant: true };
    const result = await this.triggerEnergy(
      Config.contract.sTRXProxyContract,
      funcSelector,
      parameters,
      options,
      intlObj,
      [['user/getUserData'], ['user/getUserDataFromMarkets'], ['market/getMarketData']]
    );
    return result && result.energy_used;
  };

  strxDeposit = async (amount, intlObj, feeLimit) => {
    let funcSelector = 'deposit()';
    let parameters = [];
    let options = { callValue: amount };
    if (feeLimit) options = { callValue: amount, feeLimit };
    const result = await this.trigger(Config.contract.sTRXProxyContract, funcSelector, parameters, options, intlObj, [
      ['user/getUserData'],
      ['user/getUserDataFromMarkets'],
      ['market/getMarketData']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  strWithdraw = async (amount, intlObj, options = {}) => {
    let funcSelector = 'withdraw(uint256)';
    let parameters = [{ type: 'uint256', value: amount }];

    const result = await this.trigger(
      Config.contract.sTRXProxyContract,
      funcSelector,
      parameters,
      options,
      intlObj,
      []
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  claimAll = async (intlObj, options = {}) => {
    let funcSelector = 'claimAll()';
    let parameters = [];

    const result = await this.trigger(
      Config.contract.sTRXProxyContract,
      funcSelector,
      parameters,
      options,
      intlObj,
      []
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  totalDelegatedOfType = async (resourceType = 1) => {
    const result = await this.view(Config.contract.marketProxyContract, 'totalDelegatedOfType(uint256)', [
      { type: 'uint256', value: resourceType }
    ]);

    let amount = BigNumber(0);
    let success = false;

    if (result.length) {
      const data = result[0];
      let dataIndex = 0;
      const DATA_LEN = 64;
      amount = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      success = true;
    }

    return {
      amount,
      success
    };
  };

  totalFrozenOfType = async (resourceType = 1) => {
    const result = await this.view(Config.contract.marketProxyContract, 'totalFrozenOfType(uint256)', [
      { type: 'uint256', value: resourceType }
    ]);

    let amount = BigNumber(0);
    let success = false;

    if (result.length) {
      const data = result[0];
      let dataIndex = 0;
      const DATA_LEN = 64;
      amount = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      success = true;
    }

    return {
      amount,
      success
    };
  };

  getRentalsInfo = async (address, resourceType = 1, receiverAddress = '') => {
    const result = await this.view(Config.contract.marketProxyContract, 'rentals(address,address,uint256)', [
      { type: 'address', value: address },
      { type: 'address', value: receiverAddress || address },
      { type: 'uint256', value: resourceType }
    ]);

    let rentBalance = BigNumber(0);
    // let securityDeposit = BigNumber(0);
    // let index = BigNumber(0);
    let success = false;

    if (result.length) {
      const data = result[0];
      let dataIndex = 0;
      const DATA_LEN = 64;
      rentBalance = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      // securityDeposit = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      // index = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      success = true;
    }
    return {
      rentBalance,
      // securityDeposit,
      // index,
      success
    };
  };

  rentResource = async (address, stakeAmount, resourceType = 1, rentAmount, intlObj, feeLimit) => {
    let funcSelector = 'rentResource(address,uint256,uint256)';
    let parameters = [
      { type: 'address', value: address },
      { type: 'uint256', value: stakeAmount },
      { type: 'uint256', value: resourceType }
    ];

    let options = { callValue: rentAmount };
    if (feeLimit) options = { callValue: rentAmount, feeLimit };

    const result = await this.trigger(Config.contract.marketProxyContract, funcSelector, parameters, options, intlObj, [
      // ['user/getUserData']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  rentResourceWithLoadingFlag = async (address, stakeAmount, resourceType = 1, rentAmount, intlObj) => {
    let funcSelector = 'rentResource(address,uint256,uint256)';
    let parameters = [
      { type: 'address', value: address },
      { type: 'uint256', value: stakeAmount },
      { type: 'uint256', value: resourceType }
    ];

    let options = { callValue: rentAmount };

    const result = await this.trigger(
      Config.contract.marketProxyContract,
      funcSelector,
      parameters,
      options,
      intlObj,
      [
        // ['user/getUserData']
      ],
      false,
      true
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  returnResource = async (address, stakeAmount, resourceType = 1, feeLimit, intlObj, endOrderType) => {
    let funcSelector = 'returnResource(address,uint256,uint256)';
    if (endOrderType === 'receiver') {
      funcSelector = 'returnResourceByReceiver(address,uint256,uint256)';
    }
    let parameters = [
      { type: 'address', value: address },
      { type: 'uint256', value: stakeAmount },
      { type: 'uint256', value: resourceType }
    ];

    let options = { feeLimit };
    const result = await this.trigger(
      Config.contract.marketProxyContract,
      funcSelector,
      parameters,
      options,
      intlObj,
      [
        // ['user/getUserData']
      ],
      false,
      true
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  liquidateThreshold = async () => {
    let funcSelector = 'liquidateThreshold()';
    let parameters = [];
    let options = {};
    let intlObj = {};
    const result = await this.view(Config.contract.marketProxyContract, funcSelector, parameters, options, intlObj, [
      // ['user/getUserData']
    ]);
    let amount = BigNumber(0);
    let success = false;

    if (result.length) {
      const data = result[0];
      let dataIndex = 0;
      const DATA_LEN = 64;
      amount = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      success = true;
    }
    return {
      amount,
      success
    };
  };

  feeRatio = async () => {
    let funcSelector = 'feeRatio()';
    let parameters = [];
    let options = {};
    let intlObj = {};
    const result = await this.view(Config.contract.marketProxyContract, funcSelector, parameters, options, intlObj, [
      // ['user/getUserData']
    ]);
    let amount = BigNumber(0);
    let success = false;

    if (result.length) {
      const data = result[0];
      let dataIndex = 0;
      const DATA_LEN = 64;
      amount = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      success = true;
    }
    return {
      amount,
      success
    };
  };

  minFee = async () => {
    let funcSelector = 'minFee()';
    let parameters = [];
    let options = {};
    let intlObj = {};
    const result = await this.view(Config.contract.marketProxyContract, funcSelector, parameters, options, intlObj, [
      // ['user/getUserData']
    ]);
    let amount = BigNumber(0);
    let success = false;

    if (result.length) {
      const data = result[0];
      let dataIndex = 0;
      const DATA_LEN = 64;
      amount = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      success = true;
    }
    return {
      amount,
      success
    };
  };

  rentPaused = async (resourceType = 1) => {
    let funcSelector = 'rentPaused(uint256)';
    let parameters = [{ type: 'uint256', value: resourceType }];
    let options = {};
    let intlObj = {};
    const result = await this.view(Config.contract.marketProxyContract, funcSelector, parameters, options, intlObj, [
      // ['user/getUserData']
    ]);
    let amount = BigNumber(0);
    let success = false;

    if (result.length) {
      const data = result[0];
      let dataIndex = 0;
      const DATA_LEN = 64;
      amount = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      success = true;
    }
    return {
      amount,
      success
    };
  };

  rentalRate = async (borrow, total) => {
    if (BigNumber(borrow).isNaN() || BigNumber(total).isNaN()) {
      return {
        amount: BigNumber(0),
        success: false
      };
    }

    let funcSelector = 'getRentalRate(uint256,uint256)';
    let parameters = [
      { type: 'uint256', value: borrow },
      { type: 'uint256', value: total }
    ];
    let options = {};
    let intlObj = {};
    const result = await this.view(
      Config.contract.energyRateModelContract,
      funcSelector,
      parameters,
      options,
      intlObj,
      [
        // ['user/getUserData']
      ]
    );
    let amount = BigNumber(0);
    let success = false;

    if (result.length) {
      const data = result[0];
      let dataIndex = 0;
      const DATA_LEN = 64;
      amount = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      success = true;
    }
    return {
      amount,
      success
    };
  };

  returnResourceQuery = async (address, stakeAmount, resourceType = 1, intlObj) => {
    let funcSelector = 'returnResource(address,uint256,uint256)';
    let parameters = [
      { type: 'address', value: address },
      { type: 'uint256', value: stakeAmount },
      { type: 'uint256', value: resourceType }
    ];
    let options = {};
    const result = await this.view(Config.contract.marketProxyContract, funcSelector, parameters, options, intlObj, []);
    let amount = BigNumber(0);
    let success = false;

    if (result.length) {
      const data = result[0];
      let dataIndex = 0;
      const DATA_LEN = 64;
      amount = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      success = true;
    }
    return {
      amount,
      success
    };
  };

  maxRentableOfType = async () => {
    let funcSelector = 'maxRentableOfType(uint256)';
    let parameters = [{ type: 'uint256', value: 1 }];
    let options = {};
    let intlObj = {};
    const result = await this.view(Config.contract.marketProxyContract, funcSelector, parameters, options, intlObj, [
      // ['user/getUserData']
    ]);
    let amount = BigNumber(0);
    let success = false;

    if (result.length) {
      const data = result[0];
      let dataIndex = 0;
      const DATA_LEN = 64;
      amount = new BigNumber(data?.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      success = true;
    }
    return {
      amount,
      success
    };
  };

  getFeeLimitCommon = async (contractAddress, funcSelector, parameters, options = {}) => {
    const SUN_PRECISION = 1e6;
    const DEFAULT_FEE_LIMIT = Config.feeLimit;
    const FEE_LIMIT_BUFFER = 1.5;
    try {
      const { energyFee, getEnergyFee } = this.rootStore.strx;
      const { vaultDetails } = this.rootStore.vaultStore;
      const { marketDetails } = this.rootStore.marketV2;
      const { energyFeeRate: energyFeeRateFromVault } = vaultDetails;
      const { energyFeeRate: energyFeeRateFromMarket } = marketDetails;
      const currentEnergyFee = energyFee || energyFeeRateFromVault || energyFeeRateFromMarket || (await getEnergyFee());

      if (!currentEnergyFee || new BigNumber(currentEnergyFee).isNaN()) {
        console.warn('Could not retrieve energy fee. Falling back to default fee limit.');
        return DEFAULT_FEE_LIMIT;
      }

      const result = await this.triggerEnergy(contractAddress, funcSelector, parameters, {
        ...{ _isConstant: true },
        ...options
      });

      const estimatedEnergy = result ? result.energy_used : null;

      if (estimatedEnergy === null || new BigNumber(estimatedEnergy).isNaN()) {
        console.warn('Could not estimate energy usage. Falling back to default fee limit.');
        return DEFAULT_FEE_LIMIT;
      }

      const feeInSun = new BigNumber(estimatedEnergy).times(currentEnergyFee).div(SUN_PRECISION);

      const calculatedFeeLimit = feeInSun
        .integerValue(BigNumber.ROUND_DOWN)
        .times(FEE_LIMIT_BUFFER)
        .times(Config.trxPrecision);

      if (calculatedFeeLimit.gt(DEFAULT_FEE_LIMIT)) {
        return calculatedFeeLimit.toNumber();
      }

      return DEFAULT_FEE_LIMIT;
    } catch (error) {
      console.error('Failed to calculate fee limit due to an error:', error);
      return DEFAULT_FEE_LIMIT;
    }
  };

  getReturnRentFeeLimit = async (address, stakeAmount, resourceType = 1, endOrderType) => {
    let funcSelector = 'returnResource(address,uint256,uint256)';
    if (endOrderType === 'receiver') {
      funcSelector = 'returnResourceByReceiver(address,uint256,uint256)';
    }
    let parameters = [
      { type: 'address', value: address },
      { type: 'uint256', value: stakeAmount },
      { type: 'uint256', value: resourceType }
    ];
    let options = { _isConstant: true };
    const result = await this.triggerEnergy(Config.contract.marketProxyContract, funcSelector, parameters, options);
    return result && result.energy_used;
  };

  getRentFeeLimit = async (address, stakeAmount, resourceType = 1, rentAmount) => {
    let funcSelector = 'rentResource(address,uint256,uint256)';
    let parameters = [
      { type: 'address', value: address },
      { type: 'uint256', value: stakeAmount },
      { type: 'uint256', value: resourceType }
    ];
    let options = { _isConstant: true, callValue: rentAmount };
    const result = await this.triggerEnergy(Config.contract.marketProxyContract, funcSelector, parameters, options);
    return result && result.energy_used;
  };

  stakeUSDT = async (stakeAmount, intlObj) => {
    let funcSelector = 'submit(uint256)';
    let parameters = [{ type: 'uint256', value: stakeAmount }];
    let options = {};

    const result = await this.trigger(Config.minterProxy, funcSelector, parameters, options, intlObj, []);

    return result && result.transaction ? result.transaction.txID : '';
  };

  unstakeUSDT = async (stakeAmount, intlObj) => {
    let funcSelector = 'requestWithdrawal(uint256)';
    let parameters = [{ type: 'uint256', value: stakeAmount }];
    let options = {};

    const result = await this.trigger(Config.UnstUSDTProxy, funcSelector, parameters, options, intlObj, []);

    return result && result.transaction ? result.transaction.txID : '';
  };

  claim = async (requestIdArr, intlObj, feeLimit) => {
    let funcSelector = 'claimWithdrawals(uint256[])';
    let parameters = [{ type: 'uint256[]', value: requestIdArr }];
    let options = { feeLimit };

    const result = await this.trigger(Config.UnstUSDTProxy, funcSelector, parameters, options, intlObj, []);

    return result && result.transaction ? result.transaction.txID : '';
  };

  getClaimEnergyUsed = async (requestIdArr, intlObj) => {
    let funcSelector = 'claimWithdrawals(uint256[])';
    let parameters = [{ type: 'uint256[]', value: requestIdArr }];
    let options = { _isConstant: true };

    const result = await this.triggerEnergy(Config.UnstUSDTProxy, funcSelector, parameters, options);

    return result && result.energy_used;
  };

  liquidateBorrow = async (triggerContract, borrower, jTokenCollateral, repayAmount, intlObj, options = {}) => {
    const methodSignature = 'liquidateBorrow(address,uint256,address)';
    const parameters = [
      { type: 'address', value: borrower },
      { type: 'uint256', value: repayAmount },
      { type: 'address', value: jTokenCollateral }
    ];

    return await this.executeLiquidate(triggerContract, methodSignature, parameters, options, intlObj, true);
  };

  liquidateBorrowJtrx = async (triggerContract, borrower, jTokenCollateral, trxAmount, intlObj, options = {}) => {
    const methodSignature = 'liquidateBorrow(address,address)';
    const parameters = [
      { type: 'address', value: borrower },
      { type: 'address', value: jTokenCollateral }
    ];

    return await this.executeLiquidate(
      triggerContract,
      methodSignature,
      parameters,
      { ...{ callValue: trxAmount }, ...options },
      intlObj,
      true,
      'jtrx'
    );
  };

  executeLiquidate = async (triggerContract, methodSignature, parameters, options, intlObj, isConstant, type) => {
    const callOptions = { _isConstant: isConstant, ...options };
    const r = await this.triggerEnergy(triggerContract, methodSignature, parameters, callOptions);

    if (type === 'jtrx') {
      if (Object.keys(r).length <= 0 || (r.result && r.result.message)) {
        return -1;
      }
    } else {
      if (Object.keys(r).length <= 0 || BigNumber(r?.constant_result[0]).toNumber() !== 0) {
        return -1;
      }
    }

    const result = await this.trigger(
      triggerContract,
      methodSignature,
      parameters,
      options,
      intlObj,
      false,
      false,
      true
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  _getRentalRate = async (amount, resourceType = 1) => {
    try {
      const result = await this.view(Config.contract.marketProxyContract, '_rentalRate(uint256,uint256)', [
        { type: 'uint256', value: amount },
        { type: 'uint256', value: resourceType }
      ]);
      if (result.length) {
        const data = result[0];
        const DATA_LEN = 64;
        const res = new BigNumber(data.substr(0, DATA_LEN), 16);

        return {
          success: true,
          data: res
        };
      }
    } catch (error) {
      console.log(`_getRentalRate: ${error}`);
      return {
        success: false
      };
    }
  };

  _getStableRate = async (resourceType = 1) => {
    try {
      const result = await this.view(Config.contract.marketProxyContract, '_stableRate(uint256)', [
        { type: 'uint256', value: resourceType }
      ]);

      if (result.length) {
        const data = result[0];
        const DATA_LEN = 64;
        const res = new BigNumber(data.substr(0, DATA_LEN), 16);
        return {
          success: true,
          data: res
        };
      }
    } catch (error) {
      console.log(`_getStableRate: ${error}`);
      return {
        success: false
      };
    }
  };
}
