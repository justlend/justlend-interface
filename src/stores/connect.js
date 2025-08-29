import { observable, reaction, action, makeObservable } from 'mobx';
import { getAppMetadata, getSdkError } from '@walletconnect/utils';
import Config from '../config';
import { WalletConnectAdapter } from '@tronweb3/tronwallet-adapter-walletconnect';

import { DEFAULT_APP_METADATA, DEFAULT_LOGGER, DEFAULT_RELAY_URL, DEFAULT_PROJECT_ID } from '../utils/WCconstant';

export default class ConnectStore {
  @observable client = null; //WalletConnect Client
  @observable session = null; //WalletConnect Session

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);
  }

  init = async () => {
    // await this.checkConnectedSessions();
    const client = new WalletConnectAdapter({
      network: Config.network,
      options: {
        logger: DEFAULT_LOGGER,
        relayUrl: DEFAULT_RELAY_URL,
        projectId: DEFAULT_PROJECT_ID,
        metadata: getAppMetadata() || DEFAULT_APP_METADATA
      },
      web3ModalConfig: {
        themeVariables: {
          '--w3m-z-index': 99999999
        }
      }
    });
    this.setClient(client);
  };

  @action
  setClient(client) {
    this.client = client;
  }

  @action
  setSession(session) {
    this.session = session;
  }

  connect = async () => {
    try {
      this.clearConnectionState(false);
      await this.init();
      if (!this.client) {
        throw new Error('WalletConnect client failed to re-initialize.');
      }
      await this.client.connect();
      if (this.client?._wallet?._session) {
        console.log('Session object found at: this.client._wallet.session');
        this.setSession(this.client._wallet._session);
      }

      this.client.on('disconnect', this.onDisconnect);
      window.gtag('event', 'conwallet_connected_walletcon_name', {
        'event_category': 'walletconnect',
        'event_label': this.client.name
      });
      window.gtag('event', 'conwallet_connected_walletcon_url', {
        'event_category': 'walletconnect',
        'event_label': this.client.url
      });
      window.gtag('event', 'conwallet_connected_walletcon_address', {
        'event_category': 'walletconnect',
        'event_label': this.client.address
      });
      this.onConnected(this.client.address);
      this.rootStore.network.setWalletType('walletconnect');
      this.rootStore.network.setConnectedWallet('walletconnect');
      window.localStorage.setItem('walletconnectdisconnect', '');
      // Update known pairings after session is connected.
      //setPairings(client.pairing.getAll({ active: true }));
    } catch (e) {
      if (e?.error?.code === 5002) {
        this.rootStore.ui.setWsFailureModal(true);
      }
      throw e;
    } finally {
      // close modal in case it was open
      this.rootStore.ui.setWsFailureModal(false);
    }
  };

  onDisconnect = () => {
    console.log('WalletConnect disconnected. Cleaning up state.');
    this.clearConnectionState();
    window.location.reload();
  };
  onConnected = async address => {
    this.rootStore.network.setLoginModalVisibility(false);
    this.rootStore.network.setLoginModalVisibilityV2(false);
    this.rootStore.ui.setWsModalVisibility(false);
    this.rootStore.network.setDefaultAccount(address);
    this.rootStore.network.setIsConnected(true);
    this.rootStore.network.setIsWalletConnected(true);
    this.rootStore.ui.setWsFailureModal(false);
    window.defaultAccount = this.rootStore.network.defaultAccount;
    window.localStorage.setItem('lastLoginInfo', 'walletconnect_' + Date.now());
    this.rootStore.transaction.startMonitoring();
    this.rootStore.network.emitter.emit('connect');
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

  disconnect = async () => {
    this.clearConnectionState();
  };

  @action
  async disconnectWalletConnect() {
    console.log('Attempting to disconnect using native WalletConnect client...');
    const nativeClient = this.client?._wallet?.client;
    const sessionTopic = this.client?._wallet?._session?.topic;

    try {
      if (nativeClient && sessionTopic) {
        this.clearConnectionState();
        await nativeClient.disconnect({
          topic: sessionTopic,
          reason: getSdkError('USER_DISCONNECTED')
        });
        console.log('Native disconnect request sent successfully.');
      } else {
        this.clearConnectionState();
        console.warn('Native client or topic not found, could not send disconnect message to wallet.');
      }
    } catch (error) {
      this.clearConnectionState();
      console.error('Failed to send disconnect request:', error);
    } finally {
      this.clearConnectionState();
      window.location.reload();
    }
  }

  @action
  clearConnectionState(clearDatabase = true) {
    window.defaultAccount = null;

    this.setClient(null);
    this.setSession(undefined);
    this.rootStore.network.setDefaultAccount(null);
    this.rootStore.network.setWalletType(null);
    this.rootStore.network.setConnectedWallet(null);
    this.rootStore.network.setIsConnected(false);
    this.rootStore.network.setIsWalletConnected(false);

    // window.localStorage.removeItem('lastLoginInfo');
    // window.localStorage.removeItem('wc@2:client:0.3//session'); // WalletConnect v2  session key
    Object.keys(window.localStorage)
      .filter(key => key.startsWith('wc@2') || key === 'lastLoginInfo' || key === 'walletconnect')
      .forEach(key => window.localStorage.removeItem(key));

    if (clearDatabase) {
      window.indexedDB && window.indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB');
    }

    this.rootStore.transaction.stopMonitoring();
    this.rootStore.network.emitter.emit('disconnect');
  }
}
