// src/stores/TransactionStore.js
import { makeAutoObservable, runInAction } from 'mobx';
import { tronObj } from '../../utils/blockchain'; 
import intl from 'react-intl-universal';

const POLLING_INTERVAL = 3000; 
const MAX_ATTEMPTS = 20; 

export default class TransactionStore {
  
  pendingTransactions = new Map();

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  
  addTransaction = txInfo => {
    const { tx, callbacks, intlObj } = txInfo;
    if (!tx) return;

    console.log(`[TransactionStore] 开始轮询交易: ${tx}`);
    
    this.pendingTransactions.set(tx, {
      txID: tx,
      intlObj, 
      callbacks,
      attempts: 0,
      intervalId: setInterval(() => this._pollTransaction(tx), POLLING_INTERVAL)
    });
  };

  
  _pollTransaction = async txID => {
    const tx = this.pendingTransactions.get(txID);
    if (!tx) return;

    tx.attempts++;

    if (tx.attempts > MAX_ATTEMPTS) {
      console.warn(`[TransactionStore] 交易轮询超时: ${txID}`);
      this._clearTransaction(txID, 'timeout');
      
      this.rootStore.system.setFinalStatusV2('failed', intl.get('jlv2.transaction.timeout'), txID);
      return;
    }

    try {
      
      const transactionInfo = await tronObj.tronWeb.trx.getUnconfirmedTransactionInfo(txID);

      if (transactionInfo?.receipt?.result?.toLowerCase() === 'success') {
        console.log(`[TransactionStore] 交易成功确认: ${txID}`);
        this._executeCallbacks(tx.callbacks); 
        this._clearTransaction(txID, 'success');
        
        
      } else if (transactionInfo?.receipt) {
        
        console.error(`[TransactionStore] 交易链上失败 (REVERT): ${txID}`);
        this._clearTransaction(txID, 'failed');
        
        this.rootStore.system.setFinalStatusV2(
          'failed',
          tx.intlObj?.failMessage || intl.get('jlv2.transaction.failed_on_chain'),
          txID
        );
      }
      
    } catch (error) {
      console.error(`[TransactionStore] 轮询交易 ${txID} 时出错:`, error);
      this._clearTransaction(txID, 'error');
      
      this.rootStore.system.setFinalStatusV2('failed', intl.get('jlv2.transaction.query_failed'), txID);
    }
  };

  
  _clearTransaction = (txID, status) => {
    const tx = this.pendingTransactions.get(txID);
    if (tx) {
      clearInterval(tx.intervalId);
      this.pendingTransactions.delete(txID);
      console.log(`[TransactionStore] 清理交易: ${txID}, 状态: ${status}`);
    }
  };

  
  _executeCallbacks = callbacks => {
    if (!callbacks || callbacks.length === 0) return;

    console.log('[TransactionStore] 执行回调:', callbacks);
    callbacks.forEach(arg => {
      if (!Array.isArray(arg) || arg.length < 2) {
        console.error('[TransactionStore] 无效的回调格式:', arg);
        return;
      }
      const [storeName, methodName, ...params] = arg;
      
      const storeInstance = this.rootStore[storeName];
      if (storeInstance && typeof storeInstance[methodName] === 'function') {
        
        setTimeout(() => {
          try {
            console.log(`[TransactionStore] 调用回调: ${storeName}.${methodName}(${params.join(', ')})`);
            storeInstance[methodName](...params);
          } catch (e) {
            console.error(`[TransactionStore] 执行回调 ${storeName}.${methodName} 时出错:`, e);
          }
        }, 1000); 
      } else {
        console.error(`[TransactionStore] 找不到回调方法: ${storeName}.${methodName}`);
      }
    });
  };

  awaitTxConfirmation = txID => {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const intervalId = setInterval(async () => {
        attempts++;

        
        if (attempts > MAX_ATTEMPTS) {
          clearInterval(intervalId);
          console.warn(`[TransactionStore] awaitTxConfirmation 超时: ${txID}`);
          reject(new Error('Transaction confirmation timed out.')); 
          return;
        }

        try {
          const transactionInfo = await tronObj.tronWeb.trx.getUnconfirmedTransactionInfo(txID);

          if (transactionInfo?.receipt?.result?.toLowerCase() === 'success') {
            clearInterval(intervalId);
            console.log(`[TransactionStore] awaitTxConfirmation 成功: ${txID}`);
            resolve(true); 
          } else if (transactionInfo?.receipt) {
            clearInterval(intervalId);
            console.error(`[TransactionStore] awaitTxConfirmation 失败 (REVERT): ${txID}`);
            reject(new Error('Transaction failed on-chain (REVERT).')); 
          }
          
        } catch (error) {
          clearInterval(intervalId);
          console.error(`[TransactionStore] awaitTxConfirmation 轮询出错: ${txID}`, error);
          reject(error); 
        }
      }, POLLING_INTERVAL);
    });
  };
}
