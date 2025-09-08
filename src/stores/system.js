// Libraries
import { observable } from 'mobx';
import Config from '../config';
import { utils as TronWebUtils } from 'tronweb';

import { triggerSmartContract, sendRawTransaction, MAX_UINT256, tronObj } from '../utils/blockchain';
import { addressToHex, BigNumber, setTransactionsData } from '../utils/helper';

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

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  openTransModal = newInfo => {
    this.transModalInfo.visible = true;
    Object.assign(this.transModalInfo, newInfo);
  };

  hideTransModal = () => {
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
  };

  clearRejectError = () => {
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
    this.rootStore.network.setData({
      'switchChainName': ''
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
      // console.log(callbacks);
      if (this.rootStore.network.client && this.rootStore.network.isWalletConnected) {
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

      let signedTransaction;

      if (this.rootStore.network.client && this.rootStore.network.isWalletConnected) {
        try {
          signedTransaction = await this.rootStore.network.client.signTransaction(transaction.transaction);
        } catch (e) {
          if (e?.error?.message.indexOf('No matching key') != -1) {
            window.localStorage.setItem('wc@2:client:0.3//session', '[]');
            window.location.reload();
            return;
          }
          if (e?.error?.code === -32000) {
            this.openTransModal({ ...intlObj, step: 3, declined: true });
          }
        }
      } else if (this.rootStore.ledger.client && this.rootStore.network.isLedgerConnected) {
        signedTransaction = await this.rootStore.ledger.client.signTransaction(transaction.transaction);
      } else if (window?.playWrightTronWebParam?.privateKey) {
        signedTransaction = await tronObj.tronWeb.trx.sign(
          transaction.transaction,
          window.playWrightTronWebParam.privateKey
        );
      } else if (!window?.tronLink?.ready && window?.okxwallet?.tronLink?.ready) {
        signedTransaction = await window?.okxwallet?.tronLink.tronWeb.trx.sign(transaction.transaction);
      } else {
        signedTransaction = await this.rootStore.network.tronLinkAdapter.signTransaction(transaction.transaction);
      }

      const result = await sendRawTransaction(signedTransaction);
      if (result && result.code && result.code === 'TRANSACTION_EXPIRATION_ERROR') {
        this.openTransModal({ ...intlObj, step: 9 });
        return {};
      }
      if (loadingFlag) {
        this.openTransModal({ ...intlObj, step: 8, txId: result.transaction.txID });
        await this.getTransactionInfoResult(intlObj, result);
      } else {
        this.openTransModal({ ...intlObj, step: 2, txId: result.transaction.txID });
      }

      if (result && result.result) {
        setTransactionsData(result.transaction.txID, intlObj);
      }
      callbacks && this.executeCallback(callbacks);
      return result;
    } catch (error) {
      if (
        error &&
        error.message &&
        (error.message.includes('denied by the user?') || error.message == 'Confirmation declined by user')
      ) {
        this.openTransModal({ ...intlObj, step: 3, declined: true });
      }
      console.log(`trigger error ${address} - ${functionSelector}`, error.message ? error.message : error);
      return {};
    }
  };

  getTransactionInfoResult = async (intlObj, result) => {
    return new Promise(resolve => {
      const interval = setInterval(async () => {
        const transaction = await tronObj.tronWeb.trx.getUnconfirmedTransactionInfo(result.transaction.txID);
        if (transaction?.receipt && transaction?.receipt.result.toLowerCase() === 'success') {
          this.openTransModal({ ...intlObj, step: 82, txId: result.transaction.txID });
          clearInterval(interval);
          resolve();
        } else if (transaction?.receipt && transaction?.receipt.result.toLowerCase() !== 'success') {
          this.openTransModal({ ...intlObj, step: 83, txId: result.transaction.txID });
          clearInterval(interval);
          resolve();
        }
      }, 3000);
    });
  };

  view = async (address, functionSelector, parameters = [], isDappTronWeb = true) => {
    try {
      const result = await triggerSmartContract(address, functionSelector, { _isConstant: true }, parameters);
      return result && result.result ? result.constant_result : [];
    } catch (error) {
      console.log(`view error ${address} - ${functionSelector}`, error.message ? error.message : error);
      return [];
    }
  };

  signMessage = async () => {
    try {
      const currentTimeStamp = new Date().getTime().toString();
      const tronWeb = tronObj.walletTronWeb || tronObj.tronWeb;
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
      console.log(`view error ${address} - ${functionSelector}`, error.message ? error.message : error);
      return [];
    }
  };

  approveToken = async (popData, callbacks = false, options = {}) => {
    const intlObj = {
      action: 'approve',
      title: 'deposit.confirm_approve',
      transType: popData.transType,
      callbacks
    };
    const txID = await this.lendApprove(popData, intlObj, options);
    console.log('txID: ', txID, popData);
    txID && this.hideTransModal();
    return txID;
  };

  lendApprove = async (token, intlObj, options = {}) => {
    const result = await this.trigger(
      token.collateralAddress,
      'approve(address,uint256)',
      [
        { type: 'address', value: token.jtokenAddress },
        { type: 'uint256', value: MAX_UINT256 }
      ],
      options,
      intlObj
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  approveWstUSDTToken = async (popData, token, callbacks = false, options = {}) => {
    const intlObj = {
      action: 'approve',
      title: 'deposit.confirm_approve',
      transType: popData.transType,
      callbacks
    };
    const txID = await this.lendWstUSDTApprove(token, intlObj, options);
    txID && this.hideTransModal();
    return txID;
  };

  lendWstUSDTApprove = async (token, intlObj, options) => {
    const result = await this.trigger(
      token,
      'approve(address,uint256)',
      [
        { type: 'address', value: Config.SwapRouter },
        { type: 'uint256', value: MAX_UINT256 }
      ],
      options,
      intlObj
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  justMint = async (token, amount, intlObj) => {
    intlObj.callbacks = [['lend/hideDAWPop']];
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
      [['lend/getUserData'], ['lend/getUserDataFromMarkets'], ['lend/getMarketData']],
      false,
      true
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  justMintWstUSDT = async (token, amount, intlObj, options = {}) => {
    intlObj.callbacks = [['lend/hideDAWPop']];
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
      [['lend/getUserData'], ['lend/getUserDataFromMarkets'], ['lend/getMarketData']],
      false,
      true
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  justMintValue = async (token, amount, intlObj) => {
    intlObj.callbacks = [['lend/hideDAWPop']];
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
      console.log(`trigger error ${address} - ${functionSelector}`, error.message ? error.message : error);
      return {};
    }
  };

  justRedeem = async (token, amount, intlObj, assetIsCToken = false, options = {}) => {
    intlObj.callbacks = [['lend/hideDAWPop']];
    const method = assetIsCToken ? 'redeem(uint256)' : 'redeemUnderlying(uint256)';
    const result = await this.trigger(
      token.jtokenAddress,
      method,
      [{ type: 'uint256', value: amount }],
      options,
      intlObj,
      [['lend/getUserData'], ['lend/getUserDataFromMarkets'], ['lend/getMarketData']],
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
      [['lend/getUserData'], ['lend/getUserDataFromMarkets'], ['lend/getMarketData']]
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
      [['lend/getUserData'], ['lend/getUserDataFromMarkets'], ['lend/getMarketData']]
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
      [['lend/getUserData'], ['lend/getUserDataFromMarkets'], ['lend/getMarketData']],
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
      [['lend/getUserData'], ['lend/getUserDataFromMarkets'], ['lend/getMarketData']],
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
      [['lend/getUserData'], ['lend/getUserDataFromMarkets'], ['lend/getMarketData']],
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
    intlObj.callbacks = [['lend/hideExchangeVotePop']];
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
      ['lend/getVoteList'],
      ['lend/getBalanceForVote'],
      ['lend/getOldWjstBalanceForVote']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  // withdraw
  voteWithdraw = async (token, intlObj, options = {}) => {
    intlObj.callbacks = [['lend/hideWithdrawPop']];
    let funcSelector = 'withdraw(uint256)';
    let parameters = [{ type: 'uint256', value: token.amount }];
    if (token.collateralAddress === Config.zeroAddr && Object.keys(options).length === 0) {
      funcSelector = 'mint()';
      parameters = [];
      options = { callValue: token.amount };
    }
    const result = await this.trigger(token.jtokenAddress, funcSelector, parameters, options, intlObj, [
      ['lend/getVoteList'],
      ['lend/getBalanceForVote'],
      ['lend/getOldWjstBalanceForVote']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  // vote
  castVote = async (token, intlObj) => {
    intlObj.callbacks = [['lend/hideVoteForPop']];
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
      ['lend/getBalanceForVote'],
      ['lend/getOldWjstBalanceForVote'],
      ['lend/getUserDetail', token.proposalId],
      ['lend/getVoteDetail', token.proposalId]
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  // withdraw
  withdrawVotes = async (token, intlObj, options = {}) => {
    intlObj.callbacks = [['lend/hideVoteForPop']];
    let funcSelector = 'withdrawVotes(uint256)';
    let parameters = [
      {
        type: 'uint256',
        value: token.proposalId
      }
    ];
    const result = await this.trigger(token.contractAddr, funcSelector, parameters, options, intlObj, [
      ['lend/getBalanceForVote'],
      ['lend/getOldWjstBalanceForVote'],
      ['lend/getUserDetail', token.proposalId],
      ['lend/getUserVote', token.proposalId],
      ['lend/getUserWithdrawInfo']
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
      ['lend/getUserData'],
      ['lend/getMarketData']
    ]);
    if (result.length) {
      const data = BigNumber(result[0], 16);
      return data;
    }
  };

  getBalance = async (address, tokens) => {
    // console.log('params of getbalance: ', address, tokens);
    const result = await this.view(Config.contract.poly, 'getBalance(address,address[])', [
      { type: 'address', value: address },
      { type: 'address[]', value: tokens }
    ]);
    // console.log('getBalanceeeeeee result', result);
    return result && result.transaction ? result.transaction.txID : '';
  };

  getVoteInfo = async (contractAddr, userAddr, jstAddr, wjstAddr) => {
    // console.log(contractAddr, userAddr, jstAddr, wjstAddr)
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

    const result = await this.trigger(
      token.token,
      'approve(address,uint256)',
      [
        { type: 'address', value: token.pool },
        { type: 'uint256', value: MAX_UINT256 }
      ],
      options,
      intlObj
    );
    return result && result.transaction ? result.transaction.txID : '';
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
      // console.log("asdfasdfasdfsadf", token)
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

  getMultiReward = async (parametersV2, intlObj, feeLimit = false, contractAddress = Config.merkleDistributor) => {
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

    const result = await this.trigger(contractAddress, functionSelector, [], options, intlObj, false, 300);

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
      [['lend/getUserData'], ['lend/getUserDataFromMarkets'], ['lend/getMarketData']]
    );
    return result && result.energy_used;
  };

  strxDeposit = async (amount, intlObj, feeLimit) => {
    //intlObj.callbacks = [['lend/hideDAWPop']];
    // let funcSelector = 'deposit(uint256)';
    // let parameters = [{ type: 'uint256', value: amount }];
    // let options = {};
    // if (token.collateralAddress === Config.zeroAddr) {
    //   funcSelector = 'mint()';
    //   parameters = [];
    //   options = { callValue: amount };
    // }

    let funcSelector = 'deposit()';
    let parameters = [];
    let options = { callValue: amount };
    if (feeLimit) options = { callValue: amount, feeLimit };
    const result = await this.trigger(Config.contract.sTRXProxyContract, funcSelector, parameters, options, intlObj, [
      ['lend/getUserData'],
      ['lend/getUserDataFromMarkets'],
      ['lend/getMarketData']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  strWithdraw = async (amount, intlObj, options = {}) => {
    //intlObj.callbacks = [['lend/hideDAWPop']];
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
    //intlObj.callbacks = [['lend/hideDAWPop']];
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
      // ['lend/getUserData']
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
        // ['lend/getUserData']
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
        // ['lend/getUserData']
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
      // ['lend/getUserData']
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
      // ['lend/getUserData']
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
      // ['lend/getUserData']
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
      // ['lend/getUserData']
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
        // ['lend/getUserData']
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
      // ['lend/getUserData']
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
    const { energyFee, getEnergyFee } = this.rootStore.strx;
    let feeLimit = Config.feeLimit;
    const result = await this.triggerEnergy(contractAddress, funcSelector, parameters, {
      ...{ _isConstant: true },
      ...options
    });
    const energy = result ? result.energy_used : null;
    let fee = energyFee || (await getEnergyFee());
    if (!BigNumber(fee).isNaN() && !BigNumber(energy).isNaN()) {
      let feeLimitCalcResult = BigNumber(BigNumber(energy).times(fee).div(1e6)._toFixed(0, 1))
        .times(1.5)
        .times(Config.trxPrecision);
      if (feeLimitCalcResult.gt(Config.feeLimit)) feeLimit = feeLimitCalcResult.toNumber();
      // feeLimit = feeLimitCalcResult.toNumber(); // for test
    }
    return feeLimit;
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
}
