import { observable, action, makeObservable } from 'mobx';
import { getAppMetadata, getSdkError } from '@walletconnect/utils';
import Config from '../config';
import { WalletConnectAdapter } from '@tronweb3/tronwallet-adapter-walletconnect';
import { DEFAULT_APP_METADATA, DEFAULT_LOGGER, DEFAULT_RELAY_URL, DEFAULT_PROJECT_ID } from '../utils/WCconstant';
import { WALLET_TYPES } from '../utils/constant';

const generateSignChallenge = () => {
  try {
    if (window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(32);
      window.crypto.getRandomValues(bytes);
      const nonce = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      return `wc_sign_nonce:${nonce}`;
    }
  } catch (e) {
    // Fall through to non-crypto fallback below.
  }
  const fallbackNonce = `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  return `wc_sign_nonce:${fallbackNonce}`;
};

export default class ConnectStore {
  @observable client = null;
  @observable session = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeObservable(this);

    this.client = new WalletConnectAdapter({
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

    this.client.on('disconnect', this.onDisconnect);
  }

  @action
  setSession(session) {
    this.session = session;
  }

  connect = async () => {
    try {
      if (!this.client) {
        throw new Error('WalletConnect client is not initialized.');
      }
      await this.client.connect();
      // @ts-ignore
      const session = this.client?._wallet?._session;
      if (session) {
        this.setSession(session);
      } else {
        throw new Error('WalletConnect session not established.');
      }

      this.onConnected(this.client.address);

      window.gtag('event', 'conwallet_connected_walletcon_name', {
        event_category: 'walletconnect',
        event_label: this.client.name
      });
      window.gtag('event', 'conwallet_connected_walletcon_url', {
        'event_category': 'walletconnect',
        'event_label': this.client.url
      });
      window.gtag('event', 'conwallet_connected_walletcon_address', {
        'event_category': 'walletconnect',
        'event_label': this.client.address
      });
    } catch (error) {
      console.log('WalletConnect connection failed:', error);
      this.rootStore.network.setLoginModalStepV2(1);
      // throw error;
    } finally {
      this.rootStore.network.setConnectingWallet(null);
    }
  };

  onDisconnect = () => {
    console.log('WalletConnect disconnected event received. Cleaning up state.');
    this.clearConnectionState();
    // window.location.reload();
  };

  onConnected = address => {
    this.clearConnectionState(false);

    const { network, ui, transaction } = this.rootStore;
    network.setLoginModalVisibility(false);
    network.setLoginModalVisibilityV2(false);
    network.setDefaultAccount(address);
    network.setIsConnected(true);
    network.setWalletType(WALLET_TYPES.WALLETCONNECT);
    window.defaultAccount = address;
    window.localStorage.setItem('lastLoginInfo', `${WALLET_TYPES.WALLETCONNECT}_${Date.now()}`);
    transaction.startMonitoring();
    network.emitter.emit('connect');
  };

  signMessage = async message => {
    if (!this.client) throw new Error('WalletConnect client is not connected.');
    try {
      if (!message) message = generateSignChallenge();
      return await this.client.signMessage(message);
    } catch (error) {
      console.error(`signMessage error:`, error);
      return false;
    }
  };

  @action
  async disconnectWalletConnect() {
    console.log('Attempting to disconnect WalletConnect session...');
    try {
      // @ts-ignore
      const nativeClient = this.client?._wallet?.client;
      // @ts-ignore
      const sessionTopic = this.client?._wallet?._session?.topic;

      if (nativeClient && sessionTopic) {
        await nativeClient.disconnect({
          topic: sessionTopic,
          reason: getSdkError('USER_DISCONNECTED')
        });
      } else {
        console.warn('Native client or session topic not found.');
      }
    } catch (error) {
      console.error('Failed to send disconnect request:', error);
    } finally {
      this.clearConnectionState();
      window.location.reload();
    }
  }

  @action
  clearConnectionState(clearDatabase = true) {
    if (this.rootStore.network.defaultAccount === null && this.client === null) return;

    if (clearDatabase) {
      window.indexedDB?.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB');
    }

    console.log('Clearing WalletConnect connection state...');
    window.defaultAccount = null;

    this.setSession(null);

    const { network, transaction } = this.rootStore;
    network.setDefaultAccount(null);
    network.setWalletType(null);
    network.setIsConnected(false);

    Object.keys(window.localStorage)
      .filter(key => key.startsWith('wc@2') || key.includes('walletconnect'))
      .forEach(key => window.localStorage.removeItem(key));

    transaction.stopMonitoring();
    network.emitter.emit('disconnect');
  }
}
