import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { observable } from 'mobx';

export default class WalletConnectStore {
  @observable isWalletConnect = false;
  @observable chainId = null;
  @observable connector = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org', // Required
    qrcodeModal: QRCodeModal
  });

  constructor(rootStore) {
    this.rootStore = rootStore;
  }
  setAccount = account => {
    window.defaultAccount = account;
    this.rootStore.network.defaultAccount = account;

    this.rootStore.network.isConnected = true;
    this.isWalletConnect = true;
  };

  listenEvents = () => {
    // Subscribe to connection events
    this.connector.on('connect', (error, payload) => {
      if (error) {
        throw error;
      }
      // Get provided accounts and chainId
      const { accounts, chainId: c } = payload.params[0];
      this.setAccount(accounts[0]);
      this.chainId = c;
    });

    this.connector.on('session_update', (error, payload) => {
      if (error) {
        throw error;
      }

      // Get updated accounts and chainId
      const { accounts, chainId: c } = payload.params[0];
      this.setAccount(accounts[0]);
      this.chainId = c;
    });

    this.connector.on('disconnect', (error, payload) => {
      if (error) {
        throw error;
      }
      // Delete connector
      this.isWalletConnect = false;
      this.chainId = null;

      window.defaultAccount = '';
      this.rootStore.network.defaultAccount = '';
      this.rootStore.network.isConnected = false;
      this.rootStore.network.loginModalVisible = false;
    });
  };

  connect = async cb => {
    try {
      this.listenEvents();
      let { chainId: c, accounts } = await this.connector.connect();
      this.setAccount(accounts[0]);
      this.chainId = c;
      cb & cb();
    } catch (error) {
      console.log(` walletConnect.js --- error:`, error);
      this.connector = new WalletConnect({
        bridge: 'https://bridge.walletconnect.org', // Required
        qrcodeModal: QRCodeModal
      });
    }
  };
}
