import TronWeb from 'tronweb';
import Config from '../config';
import { getBaseInfo } from './backend';

import { BigNumber, openTransModal, setTransactionsData, randomSleep, myLocal } from './helper';

const chain = Config.chain;

const DATA_LEN = 64;
export const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
const privateKey = chain.privateKey;

const mainchain = new TronWeb({
  fullHost: chain.fullHost,
  privateKey
});

const { trongrid } = Config;

if (trongrid && mainchain.setHeader && mainchain.fullNode.host === trongrid.host) {
  mainchain.setHeader({ 'TRON-PRO-API-KEY': trongrid.key });
}

export const tronObj = {
  tronWeb: null
};

export const triggerSmartContract = async (address, functionSelector, options = {}, parameters = []) => {
  try {
    // const tronWeb = window.tronWeb;
    const tronWeb = tronObj.tronWeb;
    console.log(tronWeb, 'trontron');
    if (!tronWeb) return;
    const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
      address,
      functionSelector,
      Object.assign({ feeLimit: Config.feeLimit }, options),
      parameters
    );

    if (!transaction.result || !transaction.result.result) {
      throw new Error('Unknown trigger error: ' + JSON.stringify(transaction.transaction));
    }
    return transaction;
  } catch (error) {
    throw new Error(error);
  }
};

export const sign = async transaction => {
  try {
    // const tronWeb = window.tronWeb;
    const tronWeb = tronObj.tronWeb;
    if (!tronWeb) return;
    const signedTransaction = await tronWeb.trx.sign(transaction.transaction);
    return signedTransaction;
  } catch (error) {
    console.log(error, 'signerr');
    throw new Error(error);
  }
};

export const sendRawTransaction = async signedTransaction => {
  try {
    // const tronWeb = window.tronWeb;
    const tronWeb = tronObj.tronWeb;
    if (!tronWeb) return;
    const result = await tronWeb.trx.sendRawTransaction(signedTransaction);
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

export const trigger = async (address, functionSelector, parameters = [], options = {}, intlObj = {}) => {
  try {
    openTransModal(intlObj, { step: 1 });
    // const tronWeb = window.tronWeb;
    const tronWeb = tronObj.tronWeb;
    if (!tronWeb) return;
    const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
      address,
      functionSelector,
      Object.assign({ feeLimit: Config.feeLimit }, options),
      parameters
    );
    if (!transaction.result || !transaction.result.result) {
      throw new Error('Unknown trigger error: ' + JSON.stringify(transaction.transaction));
    }

    const signedTransaction = await tronWeb.trx.sign(transaction.transaction);
    const result = await tronWeb.trx.sendRawTransaction(signedTransaction);
    openTransModal(intlObj, { step: 2, txId: result.transaction.txID });
    if (result && result.result) {
      setTransactionsData(result.transaction.txID, intlObj);
    }
    return result;
  } catch (error) {
    if (error == 'Confirmation declined by user') {
      openTransModal(intlObj, { step: 3 });
    }
    console.log(`trigger error ${address} - ${functionSelector}`, error.message ? error.message : error);
    return {};
  }
};

export const view = async (address, functionSelector, parameters = [], isDappTronWeb = true) => {
  try {
    let tronWeb = mainchain;
    if (!isDappTronWeb && tronObj.tronWeb && tronObj.tronWeb.defaultAddress && tronObj.tronWeb.defaultAddress.base58) {
      tronWeb = tronObj.tronWeb;
    }
    const result = await tronWeb.transactionBuilder.triggerSmartContract(
      address,
      functionSelector,
      { _isConstant: true },
      parameters
    );
    return result && result.result ? result.constant_result : [];
  } catch (error) {
    console.log(`view error ${address} - ${functionSelector}`, error.message ? error.message : error);
    return [];
  }
};

export const getTrxBalance = async (address, isDappTronWeb = false) => {
  try {
    let tronWeb = mainchain;
    if (!isDappTronWeb && tronObj.tronWeb && tronObj.tronWeb.defaultAddress && tronObj.tronWeb.defaultAddress.base58) {
      tronWeb = tronObj.tronWeb;
    }
    const balance = await tronWeb.trx.getBalance(address);
    return {
      balance: BigNumber(balance).div(Config.defaultPrecision),
      success: true
    };
  } catch (err) {
    console.log(`getPairBalance: ${err}`, address);
    return {
      balance: BigNumber(0),
      success: false
    };
  }
};

export const tokenBalanceOf = async (token, userAddress) => {
  // console.log(token, userAddress);
  const result = await view(Config.contract.poly, 'getBalanceAndApprove2(address,address[],address[])', [
    { type: 'address', value: userAddress },
    { type: 'address[]', value: [token.collateralAddress || token.token] },
    { type: 'address[]', value: [token.jtokenAddress || token.pool] }
  ]);
  let balance = new BigNumber(0);
  let allowance = new BigNumber(0);
  let success = false;
  if (result.length) {
    const data = result[0];
    let dataIndex = 2;
    balance = new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16).div(token.precision);
    allowance = new BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
    success = true;
  }

  return {
    balance,
    allowance,
    success
  };
};

export const getTransactionInfo = tx => {
  const tronWeb = mainchain;
  return new Promise((resolve, reject) => {
    tronWeb.trx.getConfirmedTransaction(tx, (e, r) => {
      if (!e) {
        resolve(r);
      } else {
        reject(e, null);
      }
    });
  });
};

export const getLatestBlockInfo = async () => {
  try {
    const tronWeb = mainchain;
    const res = await tronWeb.trx.getCurrentBlock();
    if (res && res.block_header) {
      return {
        success: true,
        number: res.block_header.raw_data.number,
        timestamp: res.block_header.raw_data.timestamp
      };
    }
    return {
      success: false
    };
  } catch (err) {
    console.log('getLatestBlockInfo: ', err);
    return await getBaseInfo();
  }
};

export const getBalance = async (address, tokens) => {
  // console.log('params of getbalance: ', address, tokens);
  const result = await view(Config.contract.poly, 'getBalance(address,address[])', [
    { type: 'address', value: address },
    { type: 'address[]', value: tokens }
  ]);
  // console.log('getBalanceeeeeee result', result);
  return result && result.transaction ? result.transaction.txID : '';
};

export const getBalanceInfo = async (userAddress = window.defaultAccount, tokens = [], jtokens = [], balanceInfo) => {
  if (tokens.length === 0 || jtokens.length === 0) return {};
  jtokens.map(_ => {
    if (!balanceInfo[_]) {
      balanceInfo[_] = {};
    }
  });
  try {
    const _getBalanceInfo = async (_tokens, _jtokens) => {
      await randomSleep();
      const result = await view(Config.contract.poly, 'getBalanceAndApprove2(address,address[],address[])', [
        { type: 'address', value: userAddress },
        { type: 'address[]', value: _tokens },
        { type: 'address[]', value: _jtokens }
      ]);

      if (result.length) {
        const data = result[0];
        let dataIndex = 2;

        _jtokens.forEach(t => {
          balanceInfo[t].balance = BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
          balanceInfo[t].allowance = BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
        });
        return true;
      }
    };

    const maxBalanceLength = Config.maxBalanceLength;
    let promiseFunc = [];
    for (let i = 0; ; i++) {
      const _maxTokens = tokens.slice(i * maxBalanceLength, (i + 1) * maxBalanceLength);
      const _maxJtokens = jtokens.slice(i * maxBalanceLength, (i + 1) * maxBalanceLength);
      if (_maxTokens.length) {
        promiseFunc.push(_getBalanceInfo(_maxTokens, _maxJtokens));
      } else {
        break;
      }
    }

    await Promise.all(promiseFunc);
    return balanceInfo;
  } catch (err) {
    console.log('getBalanceInfo:', err);
    return balanceInfo;
  }
};

export const getTRC20Balance = async (tokenAddress, userAddress) => {
  // console.log('params of getbalance: ', userAddress, tokenAddress);
  const result = await view(tokenAddress, 'balanceOf(address)', [{ type: 'address', value: userAddress }]);
  let value = BigNumber(0);
  let success = false;

  if (result.length) {
    value = new BigNumber(result[0].slice(0, DATA_LEN), 16);
    success = true;
  }

  return {
    value,
    success
  };
};

export const getCash = async contractAddr => {
  const result = await view(contractAddr, 'getCash()', []);
  let balance = BigNumber(0);
  let success = false;

  if (result.length) {
    balance = new BigNumber(result[0].slice(0, DATA_LEN), 16);
    success = true;
  }
  return {
    balance,
    success
  };
};

export const yamApprove = async (token, intlObj) => {
  if (token.symbol === 'TRX') {
    return '';
  }

  const result = await trigger(
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

export const yamDeposit = async (token, amount, intlObj) => {
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

  const result = await trigger(token.pool, funcSelector, parameters, options, intlObj);
  return result && result.transaction ? result.transaction.txID : '';
};

export const yamReward = async (token, intlObj) => {
  const result = await trigger(token.pool, 'getReward()', [], {}, intlObj);
  return result && result.transaction ? result.transaction.txID : '';
};

export const yamWithdraw = async (token, amount, intlObj) => {
  const result = await trigger(
    token.pool,
    'withdrawAndGetReward(uint256)',
    [{ type: 'uint256', value: amount }],
    {},
    intlObj
  );
  return result && result.transaction ? result.transaction.txID : '';
};

export const getPoolsInfo = async (userAddress, pools) => {
  const _getPoolsInfo = async (_userAddress, _pools, _count) => {
    if (_count > Config.maxQueryTimes) {
      return { success: false };
    }

    await randomSleep();
    // const result = await view(Config.contract.poly2, 'getInfoAll2(address,address[])', [
    const result = await view(Config.contract.poly2, 'getInfoAll3(address,address[])', [
      { type: 'address', value: _userAddress },
      { type: 'address[]', value: _pools }
    ]);
    let data = [];
    let success = false;

    if (result.length) {
      // const names = ['totalLock', 'staked', 'claimed', 'trxAmount', 'tokenAmount'];
      const names = ['totalLock', 'staked', 'trxAmount', 'tokenAmount'];
      // const types = ['uint256[]', 'uint256[]', 'uint256[]', 'uint256[]', 'uint256[]'];
      const types = ['uint256[]', 'uint256[]', 'uint256[]', 'uint256[]'];
      data = mainchain.utils.abi.decodeParams(names, types, `0x${result[0]}`);

      success = true;

      return { data, success };
    } else {
      return await _getPoolsInfo(_userAddress, _pools, _count + 1);
    }
  };

  let success = true;
  let data = {
    totalLock: [],
    staked: [],
    // claimed: [],
    trxAmount: [],
    tokenAmount: []
  };
  const maxQueryLength = Config.maxQueryLength;
  let promiseFunc = [];
  for (let i = 0; ; i++) {
    const _maxPools = pools.slice(i * maxQueryLength, (i + 1) * maxQueryLength);
    if (_maxPools.length) {
      promiseFunc.push(_getPoolsInfo(userAddress, _maxPools, 0));
    } else {
      break;
    }
  }

  const res = await Promise.all(promiseFunc);
  res.map(r => {
    if (!r.success) {
      success = false;
      return;
    }

    data.totalLock = [...data.totalLock, ...r.data.totalLock];
    // data.claimed = [...data.claimed, ...r.data.claimed];
    data.staked = [...data.staked, ...r.data.staked];
    data.tokenAmount = [...data.tokenAmount, ...r.data.tokenAmount];
    data.trxAmount = [...data.trxAmount, ...r.data.trxAmount];
  });

  // console.log(data, pools);

  return { data, success };
};

export const getRewardsNew = async (poolData, address) => {
  const idArr = Object.keys(poolData);
  let promiseFunc = [];
  for (let i = 0; i < idArr.length; i++) {
    getClaimed(poolData[idArr[i]], address, poolData);
  }
  await Promise.all(promiseFunc);
};

export const getClaimed = async (token, userAddress, poolData) => {
  const { pool, precision, id, tokenPrecision } = token;
  const { defaultPrecision } = Config;
  const address = pool;
  const result = await view(address, 'earned(address)', [{ type: 'address', value: userAddress }]);
  let success = false,
    tokenClaimed = BigNumber(0),
    trxClaimed = BigNumber(0);
  const obj = [];
  if (result.length) {
    const data = result[0];
    let dataIndex = 2;
    let len = result[0].length / 64;
    if (len == 6) {
      obj[0] = TronWeb.address.fromHex('41' + data.substr(dataIndex++ * DATA_LEN, DATA_LEN).slice(24));
      obj[1] = BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      obj[2] = TronWeb.address.fromHex('41' + data.substr(dataIndex++ * DATA_LEN, DATA_LEN).slice(24));
      obj[3] = BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      if (obj[0] == Config.defaultAddress) {
        trxClaimed = obj[1].div(defaultPrecision);
        tokenClaimed = obj[3].div(tokenPrecision);
      } else {
        trxClaimed = obj[3].div(defaultPrecision);
        tokenClaimed = obj[1].div(tokenPrecision);
      }
      // console.log(obj[1].toString(), obj[3].toString())
    } else if (len == 4) {
      obj[0] = TronWeb.address.fromHex('41' + data.substr(dataIndex++ * DATA_LEN, DATA_LEN).slice(24));
      obj[1] = BigNumber(data.substr(dataIndex++ * DATA_LEN, DATA_LEN), 16);
      if (obj[0] == Config.defaultAddress) {
        trxClaimed = obj[1].div(defaultPrecision);
      } else if (poolData[id].lp === 'JST') {
        tokenClaimed = obj[1].div(tokenPrecision);
        // console.log(tokenClaimed.toString(), obj);
      }
    }
    success = true;
  }
  if (success) {
    Object.assign(poolData[id], {
      tokenClaimed,
      trxClaimed
    });
  }
};

export const loadContracts = async (contractAddress, type) => {
  abiObj[type] = await mainchain.contract(contractAddress).at(address);
};
