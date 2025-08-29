import { observable, makeObservable } from 'mobx';
import { LedgerAdapter, openSelectAccountModal, openVerifyAddressModal } from '@tronweb3/tronwallet-adapter-ledger';

export default class LedgerStore {
  @observable client = null;
  constructor(rootStore) {
    this.rootStore = rootStore;

    makeObservable(this);
  }

  init = async () => {
    const client = new LedgerAdapter({
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
    this.client = client;
    this.rootStore.network.setLoginModalVisibilityV2(false);
  };

  reconnect = async () => {
    const localLoginData = window.localStorage.getItem('justlend:ledger');
    if (!localLoginData) return;
    try {
      var { address, path, index } = JSON.parse(localLoginData);
      if (!address) {
        window.localStorage.removeItem('justlend:ledger');
        return;
      }
    } catch (e) {
      window.localStorage.removeItem('justlend:ledger');
      return;
    }
    const client = new LedgerAdapter({
      accountNumber: 1,
      beforeConnect: () => {},
      selectAccount: async ({ accounts, ledgerUtils }) => {
        return { address, path, index };
      }
    });

    // connect would throw invalid channel error if many tabs refresh simultaneously
    do {
      try {
        await client.connect();
        break;
      } catch (e) {
        console.log(e, e.message);
        if (!e.message.includes('Invalid channel.')) return;
        await new Promise(r => setTimeout(r, 2000));
      }
    } while (true);
    this.client = client;
    this.onConnected(address);
    this.rootStore.network.setWalletType('ledger');
    this.rootStore.network.setConnectedWallet('ledger');
    window.localStorage.setItem('ledgerdisconnect', '');
  };

  connect = async () => {
    try {
      await this.client.connect();
      this.onConnected(this.client.address);
    } catch (e) {
      console.log(e);
      throw e;
    } finally {
      // close modal in case it was open
      this.rootStore.ui.setWsModalVisibility(false);
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

  onConnected = async address => {
    this.rootStore.network.setLoginModalVisibility(false);
    this.rootStore.network.setLoginModalVisibilityV2(false);
    this.rootStore.ui.setWsModalVisibility(false);
    this.rootStore.network.setDefaultAccount(address);
    this.rootStore.network.setIsConnected(true);
    this.rootStore.network.setIsLedgerConnected(true);
    this.rootStore.ui.setWsFailureModal(false);
    this.rootStore.network.setWalletType('ledger');
    this.rootStore.network.setConnectedWallet('ledger');
    window.localStorage.setItem('ledgerdisconnect', '');
    window.defaultAccount = address;
    this.rootStore.transaction.startMonitoring();
    this.rootStore.network.emitter.emit('connect');
    window.localStorage.setItem('lastLoginInfo', 'ledger_' + Date.now());
  };

  listenLogEvent = () => {
    window.addEventListener('storage', data => {
      if (data.key === 'justlend:ledger') {
        if (!data.newValue !== data.oldValue) {
          window.location.reload(); // reload to refresh whole page
        }
      }
    });
  };

  disconnect = async () => {
    if (!this.client) return;
    await this.client.disconnect();
    this.rootStore.network.setIsConnected(false);
    this.rootStore.network.setIsLedgerConnected(false);
    window.localStorage.removeItem('justlend:ledger');
  };
}
