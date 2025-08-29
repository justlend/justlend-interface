import { observable, action, makeObservable, runInAction } from 'mobx';
import { notification } from 'antd';
import intl from 'react-intl-universal';
import { getTransactionInfo } from '../utils/blockchain';
import { tronscanTX } from '../utils/helper';

export default class TransactionStore {
  @observable pendingTransactions = [];

  intervalId = null;
  rootStore = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  @action
  startMonitoring() {
    if (this.intervalId) return;
    console.log('Transaction monitoring started.');
    this._loadTransactionsFromStorage();
    this.intervalId = setInterval(this.checkPendingTransactions, 4000);
  }

  @action
  stopMonitoring() {
    if (this.intervalId) {
      console.log('Transaction monitoring stopped.');
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.pendingTransactions = [];
    }
  }

  @action
  addTransaction(txRecord) {
    const newRecord = {
      checkCnt: 0,
      showPending: true,
      status: 1,
      ...txRecord
    };

    this.pendingTransactions.push(newRecord);
    this._saveTransactionsToStorage();
    this.logTransactionPending(newRecord);
  }

  _loadTransactionsFromStorage = () => {
    const account = this.rootStore.network.defaultAccount;
    if (!account) return;

    const data = window.localStorage.getItem(account) || '[]';
    try {
      const transactions = JSON.parse(data);
      runInAction(() => {
        this.pendingTransactions = transactions.filter(tx => tx.status === 1);
      });
    } catch (e) {
      console.error('Failed to parse transactions from localStorage', e);
      runInAction(() => {
        this.pendingTransactions = [];
      });
    }
  };

  _saveTransactionsToStorage = () => {
    const account = this.rootStore.network.defaultAccount;
    if (!account) return;
    const transactionsToSave = this.pendingTransactions.filter(tx => tx.status === 1);
    window.localStorage.setItem(account, JSON.stringify(transactionsToSave));
  };

  checkPendingTransactions = async () => {
    if (this.pendingTransactions.length === 0) return;

    const transactionsToCheck = [...this.pendingTransactions];
    let hasChanged = false;

    for (const item of transactionsToCheck) {
      try {
        item.checkCnt = (item.checkCnt || 0) + 1;

        const r = await getTransactionInfo(item.tx);

        if (r && r.ret && r.ret[0].contractRet === 'SUCCESS') {
          this.logTransactionConfirmed(item);
          hasChanged = true;
        } else if (r && r.ret && r.ret[0].contractRet !== 'SUCCESS') {
          this.logTransactionFailed(item);
          hasChanged = true;
        } else if (item.checkCnt > 300) {
          this.logTransactionFailed(item, true);
          hasChanged = true;
        }
      } catch (e) {
        console.error(`Error checking transaction ${item.tx}:`, e);
      }
    }

    if (hasChanged) {
      this._saveTransactionsToStorage();
    }
  };

  logTransactionPending = item => {
    const { tx, intlObj } = item;
    if (intlObj?.title && intlObj?.obj) {
      notification.open({
        key: tx,
        message: intl.get(intlObj.title, intlObj.obj),
        description: this._getDescription(1, item, intl.get('trans_status.pending'))
      });
    }
  };

  logTransactionConfirmed = item => {
    item.status = 2;
    this.pendingTransactions = this.pendingTransactions.filter(tx => tx.tx !== item.tx);

    const { tx, intlObj } = item;
    if (intlObj?.title || intlObj?.title4) {
      notification.open({
        key: tx,
        message: intl.get(intlObj.title4 || intlObj.title, intlObj.obj),
        description: this._getDescription(2, item, intl.get('trans_status.confirmed'))
      });
    }
    if (intlObj.needCallAgain === 'getVoteDetail') {
      this.rootStore.vote.getVoteDetail(intlObj.obj.token);
    }
  };

  logTransactionFailed = (item, isTimeout = false) => {
    item.status = 3;

    this.pendingTransactions = this.pendingTransactions.filter(tx => tx.tx !== item.tx);

    const { tx, intlObj } = item;
    if (intlObj?.title || intlObj?.title3) {
      notification.open({
        key: tx,
        message: intl.get(intlObj.title3 || intlObj.title, intlObj.obj),
        description: this._getDescription(3, item, intl.get('trans_status.failed')),
        duration: 30
      });
    }
  };

  _getDescription = (type, item, text) => {
    const { tx } = item;
    let className = '';
    switch (type) {
      case 1:
        className = 'trans-pending';
        break;
      case 2:
        className = 'trans-confirmed';
        break;
      case 3:
        className = 'trans-failed';
        break;
      default:
        break;
    }
    return (
      <div className={'trans-notify'}>
        <span className="hover">{tronscanTX(intl.get('view_on_tronscan'), tx, true)}</span>
        <span className={'trans-btn-tip ' + className}>{text}</span>
      </div>
    );
  };
}
