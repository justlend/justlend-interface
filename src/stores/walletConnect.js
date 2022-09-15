import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { observable } from 'mobx';

export default class WalletConnectStore {
  @observable accounts = [];
  @observable chainId = '';
  @observable connector = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org', // Required
    qrcodeModal: QRCodeModal
  });

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  listenEvents = () => {
    // Subscribe to connection events
    this.connector.on('connect', (error, payload) => {
      if (error) {
        throw error;
      }

      // Get provided accounts and chainId
      const { accounts: a, chainId: c } = payload.params[0];
      this.accounts = a;
      this.chainId = c;
    });

    this.connector.on('session_update', (error, payload) => {
      if (error) {
        throw error;
      }

      // Get updated accounts and chainId
      const { accounts: a, chainId: c } = payload.params[0];
      this.accounts = a;
      this.chainId = c;
    });

    this.connector.on('disconnect', (error, payload) => {
      if (error) {
        throw error;
      }

      // Delete connector
      this.accounts = [];
      this.chainId = '';
    });
  };

  connect = async cb => {
    console.log(` walletConnect.js --- connector:`, this.connector);

    try {
      this.listenEvents();
      let a = await this.connector.connect();
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
