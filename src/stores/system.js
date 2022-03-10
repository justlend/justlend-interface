// Libraries
import { observable } from 'mobx';
import Config from '../config';

import { triggerSmartContract, sign, sendRawTransaction, MAX_UINT256 } from '../utils/blockchain';
import { BigNumber, setTransactionsData } from '../utils/helper';

export default class SystemStore {
  @observable transModalInfo = {
    visible: false,
    step: 1,
    title: '',
    obj: {},
    txId: '',
    callbacks: false 
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

  trigger = async (address, functionSelector, parameters = [], options = {}, intlObj = {}, callbacks = false) => {
    try {
      // console.log(callbacks);
      this.openTransModal({ ...intlObj, step: 1 });
      const transaction = await triggerSmartContract(
        address,
        functionSelector,
        Object.assign({ feeLimit: Config.feeLimit }, options),
        parameters
      );

      const signedTransaction = await sign(transaction);
      const result = await sendRawTransaction(signedTransaction);
      this.openTransModal({ ...intlObj, step: 2, txId: result.transaction.txID });
      if (result && result.result) {
        setTransactionsData(result.transaction.txID, intlObj);
      }

      callbacks && this.executeCallback(callbacks);
      return result;
    } catch (error) {
      if (error && error.message == 'Confirmation declined by user') {
        this.openTransModal({ ...intlObj, step: 3 });
      }
      console.log(`trigger error ${address} - ${functionSelector}`, error.message ? error.message : error);
      return {};
    }
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

  approveToken = async (popData, callbacks = false) => {
    //     [['lend/hideAuthorizePop']]
    // const { DAWPop } = this.rootStore.lend;
    // const { popData } = DAWPop;

    const intlObj = {
      action: 'approve',
      // title: 'deposit.approve',
      title: 'deposit.confirm_approve',
      // title1: '',
      // obj: {
      //   value: popData.collateralSymbol || ''
      // },
      callbacks
    };
    const txID = await this.lendApprove(popData, intlObj);
    txID && this.hideTransModal();
    return txID;
  };

  lendApprove = async (token, intlObj) => {
    // intlObj.callbacks = [['lend/hideAuthorizePop']];
    const result = await this.trigger(
      token.collateralAddress,
      'approve(address,uint256)',
      [
        { type: 'address', value: token.jtokenAddress },
        { type: 'uint256', value: MAX_UINT256 }
      ],
      {},
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
    const result = await this.trigger(token.jtokenAddress, funcSelector, parameters, options, intlObj, [
      ['lend/getUserData'],
      ['lend/getMarketData']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  justRedeem = async (token, amount, intlObj, assetIsCToken = false) => {
    intlObj.callbacks = [['lend/hideDAWPop']];
    const method = assetIsCToken ? 'redeem(uint256)' : 'redeemUnderlying(uint256)';
    const result = await this.trigger(token.jtokenAddress, method, [{ type: 'uint256', value: amount }], {}, intlObj, [
      ['lend/getUserData'],
      ['lend/getMarketData']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  openMortgage = async (contractAddr, jTokens = '', intlObj) => {
    intlObj.callbacks = [['lend/hideMortgageModal']];
    const result = await this.trigger(
      contractAddr,
      'enterMarket(address)',
      [{ type: 'address', value: jTokens }],
      {},
      intlObj,
      [['lend/getUserData'], ['lend/getMarketData']]
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  lockMortgage = async (contractAddr, jTokens = '', intlObj) => {
    intlObj.callbacks = [['lend/hideMortgageModal']];
    const result = await this.trigger(
      contractAddr,
      'exitMarket(address)',
      [{ type: 'address', value: jTokens }],
      {},
      intlObj,
      [['lend/getUserData'], ['lend/getMarketData']]
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  borrow = async (token, amount, intlObj) => {
    intlObj.callbacks = [['lend/hideBorrowModal']];
    let funcSelector = 'borrow(uint256)';
    let parameters = [{ type: 'uint256', value: amount }];
    let options = {};
    const result = await this.trigger(token.jtokenAddress, funcSelector, parameters, options, intlObj, [
      ['lend/getUserData'],
      ['lend/getMarketData']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  repayBorrow = async (token, amount, intlObj, trxAmount = 0, isClear = false) => {
    intlObj.callbacks = [['lend/hideBorrowModal']];
    let funcSelector = 'repayBorrow(uint256)';
    let parameters = [{ type: 'uint256', value: amount }];
    let options = {};
    if (token.collateralAddress === Config.zeroAddr) {
      // funcSelector = 'repayBorrow()';
      // parameters = [];
      options = { callValue: isClear ? trxAmount : amount };
    }
    const result = await this.trigger(token.jtokenAddress, funcSelector, parameters, options, intlObj, [
      ['lend/getUserData'],
      ['lend/getMarketData']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  
  voteDeposit = async (token, intlObj) => {
    intlObj.callbacks = [['lend/hideExchangeVotePop']];
    let funcSelector = 'deposit(uint256)';
    let parameters = [{ type: 'uint256', value: token.amount }];
    let options = {};
    if (token.collateralAddress === Config.zeroAddr) {
      funcSelector = 'mint()';
      parameters = [];
      options = { callValue: token.amount };
    }
    const result = await this.trigger(token.jtokenAddress, funcSelector, parameters, options, intlObj, [
      ['lend/getVoteList'],
      ['lend/getBalanceForVote']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  voteWithdraw = async (token, intlObj) => {
    intlObj.callbacks = [['lend/hideWithdrawPop']];
    let funcSelector = 'withdraw(uint256)';
    let parameters = [{ type: 'uint256', value: token.amount }];
    let options = {};
    if (token.collateralAddress === Config.zeroAddr) {
      funcSelector = 'mint()';
      parameters = [];
      options = { callValue: token.amount };
    }
    const result = await this.trigger(token.jtokenAddress, funcSelector, parameters, options, intlObj, [
      ['lend/getVoteList'],
      ['lend/getBalanceForVote']
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  castVote = async (token, intlObj) => {
    intlObj.callbacks = [['lend/hideVoteForPop']];
    let funcSelector = 'castVote(uint256,uint256,bool)';
    let parameters = [
      {
        type: 'uint256',
        value: token.proposalId
      },
      {
        type: 'uint256',
        value: token.votes
      },
      {
        type: 'bool',
        value: token.support
      }
    ];
    let options = {};
    const result = await this.trigger(token.contractAddr, funcSelector, parameters, options, intlObj, [
      ['lend/getBalanceForVote'],
      ['lend/getUserDetail', token.proposalId],
      ['lend/getVoteDetail', token.proposalId]
    ]);
    return result && result.transaction ? result.transaction.txID : '';
  };

  withdrawVotes = async (token, intlObj) => {
    intlObj.callbacks = [['lend/hideVoteForPop']];
    let funcSelector = 'withdrawVotes(uint256)';
    let parameters = [
      {
        type: 'uint256',
        value: token.proposalId
      }
    ];
    let options = {};
    const result = await this.trigger(token.contractAddr, funcSelector, parameters, options, intlObj, [
      ['lend/getBalanceForVote'],
      ['lend/getUserDetail', token.proposalId],
      ['lend/getUserVote', token.proposalId]
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
      jstBalance = new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      surplusVotes = new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      totalVote = new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      castVote = new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
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

  yamApprove = async (token, intlObj) => {
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
      {},
      intlObj
    );
    return result && result.transaction ? result.transaction.txID : '';
  };

  yamDeposit = async (token, amount, intlObj) => {
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

    const result = await this.trigger(token.pool, funcSelector, parameters, options, intlObj);
    return result && result.transaction ? result.transaction.txID : '';
  };

  yamReward = async (token, intlObj) => {
    const result = await this.trigger(token.pool, 'getReward()', [], {}, intlObj);
    return result && result.transaction ? result.transaction.txID : '';
  };

  yamWithdraw = async (token, amount, intlObj) => {
    const result = await this.trigger(
      token.pool,
      'withdrawAndGetReward(uint256)',
      [{ type: 'uint256', value: amount }],
      {},
      intlObj
    );
    return result && result.transaction ? result.transaction.txID : '';
  };
}
