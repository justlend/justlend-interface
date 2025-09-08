import { getAppMetadata } from '@walletconnect/utils';
import Config from '../config';
import { WalletConnectAdapter } from '@tronweb3/tronwallet-adapter-walletconnect';

import { DEFAULT_APP_METADATA, DEFAULT_LOGGER, DEFAULT_RELAY_URL, DEFAULT_PROJECT_ID } from '../utils/WCconstant';

export default class ConnectStore {
  constructor(rootStore) {
    this.rootStore = rootStore;
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
    this.rootStore.network.setData({ client });
  };

  connect = async () => {
    try {
      await this.rootStore.network.client.connect();
      this.rootStore.network.client.on('disconnect', this.onDisconnect);
      window.gtag('event', 'conwallet_connected_walletcon_name', {
        'event_category': 'walletconnect',
        'event_label': this.rootStore.network.client.name
      });
      window.gtag('event', 'conwallet_connected_walletcon_url', {
        'event_category': 'walletconnect',
        'event_label': this.rootStore.network.client.url
      });
      window.gtag('event', 'conwallet_connected_walletcon_address', {
        'event_category': 'walletconnect',
        'event_label': this.rootStore.network.client.address
      });
      this.onConnected(this.rootStore.network.client.address);
      // Update known pairings after session is connected.
      //setPairings(client.pairing.getAll({ active: true }));
    } catch (e) {
      if (e?.error?.code === 5002) {
        this.rootStore.network.setData({ wsFailureModal: true });
      }
      throw e;
    } finally {
      // close modal in case it was open
      this.rootStore.network.setData({ wsModalVisible: false });
    }
  };

  onDisconnect = () => {
    window.localStorage.setItem('wc@2:client:0.3//session', '[]');
    window.location.reload();
  };
  onConnected = async address => {
    this.rootStore.network.setData({
      loginModalVisible: false,
      loginModalVisibleV2: false,
      wsModalVisible: false,
      defaultAccount: address,
      isConnected: true,
      isWalletConnected: true,
      wsFailureModal: false
    });
    //setChains(allNamespaceChains);
    window.defaultAccount = this.rootStore.network.defaultAccount;
    this.rootStore.network.setVariablesInterval();
    this.rootStore.network.emitter.emit('connect');
    //setAccounts(allNamespaceAccounts);
    //await getAccountBalances(allNamespaceAccounts);
  };

  signMessage = async () => {
    try {
      const currentTimeStamp = new Date().getTime().toString();
      const result = await this.rootStore.network.client.signMessage(currentTimeStamp);
      return result;
    } catch (error) {
      console.log(`signMessage error: ${error}`);
      return false;
    }
  };

  disconnect = async () => {
    if (!this.rootStore.network.client) return;
    await this.rootStore.network.client.disconnect();
    this.rootStore.network.client.off('disconnect', this.onDisconnect);
    this.reset();
    window.localStorage.setItem('wc@2:client:0.3//session', '[]');
  };

  reset = () => {
    this.rootStore.network.setData({ session: undefined, isConnected: null, isWalletConnected: null });
  };
}
