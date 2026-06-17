import { observable, makeObservable, action } from 'mobx';
import { LedgerAdapter, openSelectAccountModal, openVerifyAddressModal } from '@tronweb3/tronwallet-adapter-ledger';
import { WALLET_TYPES } from '../utils/constant';

export default class LedgerStore {
  @observable client = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  @action
  connectNewDevice = async (onSuccess, onFailure) => {
    this.rootStore.network.setConnectingWallet(WALLET_TYPES.LEDGER);

    try {
      const adapter = new LedgerAdapter({
        accountNumber: 4,
        selectAccount: async ({ accounts, ledgerUtils: wallet }) => {
          const account = await openSelectAccountModal({ accounts, getAccounts: wallet.getAccounts });
          const closeVerifyAddressModal = openVerifyAddressModal(account.address);
          await wallet.getAddress(account.index, true);
          closeVerifyAddressModal();
          window.localStorage.setItem('justlend:ledger', JSON.stringify(account));
          return account;
        }
      });
      this.client = adapter;

      await this.client.connect();
      this.onConnected(this.client.address);

      onSuccess?.();
    } catch (e) {
      console.error('Ledger connection failed:', e);
      onFailure?.();
      throw e;
    } finally {
      this.rootStore.network.setConnectingWallet(null);
    }
  };

  @action
  reconnect = async () => {
    const localLoginData = window.localStorage.getItem('justlend:ledger');
    if (!localLoginData) return;

    let accountInfo;
    try {
      accountInfo = JSON.parse(localLoginData);
      var { address, path, index } = accountInfo;
      if (!accountInfo.address) {
        window.localStorage.removeItem('justlend:ledger');
        return;
      }
    } catch (e) {
      window.localStorage.removeItem('justlend:ledger');
      return;
    }

    let adapter;
    if (!this.client || this.client.address !== accountInfo.address) {
      adapter = new LedgerAdapter({
        accountNumber: 1,
        beforeConnect: () => {},
        selectAccount: async ({ accounts, ledgerUtils }) => {
          return { address, path, index };
        }
      });
    }

    try {
      // retry "Invalid channel"
      let retries = 3;
      while (retries > 0) {
        try {
          await adapter.connect();
          break;
        } catch (e) {
          if (!e.message.includes('Invalid channel.')) {
            throw e;
          }
          console.warn(`Ledger "Invalid channel", retrying... (${3 - retries + 1})`);
          retries--;
          if (retries === 0) throw e;
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      this.client = adapter;
      this.onConnected(this.client.address);
    } catch (error) {
      console.error('Ledger reconnect failed:', error);
      window.localStorage.removeItem('justlend:ledger');
    }
  };

  onConnected = address => {
    const { network, ui, transaction } = this.rootStore;
    network.setLoginModalVisibility(false);
    network.setLoginModalVisibilityV2(false);
    network.setDefaultAccount(address);
    network.setIsConnected(true);
    network.setWalletType(WALLET_TYPES.LEDGER);
    network._onSuccessfulConnection(WALLET_TYPES.LEDGER);
    window.defaultAccount = address;
    window.localStorage.setItem('lastLoginInfo', `${WALLET_TYPES.LEDGER}_${Date.now()}`);
    transaction.startMonitoring();
    network.emitter.emit('connect');
  };

  listenLogEvent = () => {
    window.addEventListener('storage', data => {
      if (data.key === 'justlend:ledger') {
        if (data.newValue === null && data.oldValue !== null) {
          console.log('Ledger session cleared in another tab. Disconnecting.');
          this.rootStore.network.disconnect();
        }
      }
    });
  };

  disconnect = async () => {
    if (!this.client) return;
    try {
      await this.client.disconnect();
    } catch (error) {
      console.error('Error during Ledger disconnect:', error);
    } finally {
      this.client = null;
    }
  };

  signMessage = async () => {
    try {
      const currentTimeStamp = new Date().getTime().toString();
      const result = await this.client.signMessage(currentTimeStamp);
      return result;
    } catch (error) {
      console.log(`signMessage error: ${error}`);
      return false;
    }
  };
}
