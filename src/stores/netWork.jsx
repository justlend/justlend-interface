import { observable, reaction, action, makeObservable, computed } from 'mobx';
import {
  TronLinkAdapter,
  BinanceWalletAdapter,
  OkxWalletAdapter,
  TokenPocketAdapter
} from '@tronweb3/tronwallet-adapters';
import { EventEmitter } from 'eventemitter3';
import isMobile from 'ismobilejs';
import Config from '../config';
import { getBrowserInfo, getWalletTronWeb } from '../utils/helper';
import { tronObj } from '../utils/blockchain';
import { WALLET_TYPES, MAIN_NET_CHAIN_ID } from '../utils/constant';

const LOCAL_STORAGE_KEYS = {
  LAST_LOGIN: 'lastLoginInfo',
  LEDGER_SESSION: 'justlend:ledger',
  WC_SESSION: 'wc@2:client:0.3//session'
};

const isMobileDevice = isMobile(window.navigator).any;

export default class NetworkStore {
  @observable walletTronWeb = null;
  @observable defaultAccount = null;
  @observable isConnected = false;
  @observable finishedWalletInit = false;
  @observable isRightChain = null;
  @observable walletType = null;
  @observable connectingWallet = null;

  @observable loginModalVisible = false;
  @observable loginModalStep = 1;
  @observable loginModalVisibleV2 = false;
  @observable loginModalStepV2 = 1;

  @observable routeName = '';
  @observable currentAppName = '';
  @observable unInstalledWallet = null;
  @observable isTokenPocketNoAddress = false;

  rootStore = null;
  emitter = new EventEmitter();
  adapters = {};

  constructor(rootStore) {
    makeObservable(this);
    this.rootStore = rootStore;
    this.emitter = new EventEmitter();

    this._initializeAdapters();
    this._setupReactions();
  }

  // --- Computed Properties for derived state ---
  @computed get isLedgerConnected() {
    return this.isConnected && this.walletType === WALLET_TYPES.LEDGER;
  }

  @computed get isWalletConnectConnected() {
    return this.isConnected && this.walletType === WALLET_TYPES.WALLETCONNECT;
  }

  // --- Initialization ---
  async init() {
    const walletEnvAvailable = await this._waitForWalletEnvironment();
    if (!walletEnvAvailable) {
      console.warn('Wallet environment not found.');
      this.setFinishedWalletInit(true);
      return;
    }

    const serviceAvailable = await this.rootStore.app.checkServiceStatus();
    if (serviceAvailable) {
      await this._autoReconnect();
      this._setupGlobalEventListeners();
    } else {
      this.setFinishedWalletInit(true);
    }
  }

  _initializeAdapters() {
    try {
      this.adapters = {
        [WALLET_TYPES.TRONLINK]: new TronLinkAdapter(),
        [WALLET_TYPES.BINANCE]: new BinanceWalletAdapter(),
        [WALLET_TYPES.OKX]: new OkxWalletAdapter(),
        [WALLET_TYPES.TOKENPOCKET]: new TokenPocketAdapter()
      };
    } catch (error) {
      console.log('init wallet adapter error:', error);
    }
  }

  _setupReactions() {
    // This reaction triggers when the wallet type changes to verify the network.
    reaction(
      () => this.walletType,
      async currentWalletType => {
        if (currentWalletType !== WALLET_TYPES.TRONLINK || !this.isConnected) return;
        this.isRightChain = await this._isRightChain(currentWalletType);
      }
    );
  }

  // --- Public Connection Methods ---

  /**
   * Universal method to connect to any supported wallet.
   * @param {string} walletType - The type of wallet to connect to (e.g., 'tronlink').
   */
  @action
  async connect(walletType) {
    if (!walletType || !this.adapters[walletType]) {
      console.error(`Unsupported wallet type: ${walletType}`);
      this.setConnectingWallet(null);
      return;
    }

    this.setConnectingWallet(walletType);

    try {
      const adapter = this.adapters[walletType];
      await adapter.connect();
      this._setupAdapterEventListeners(adapter);
      await this._onSuccessfulConnection(walletType);

      window.gtag('event', 'conwallet_connected', {
        'event_category': walletType,
        'event_label': 'conwallet_connected'
      });
    } catch (error) {
      console.error(`${walletType} connection failed:`, error);
      // if wallet is installed, conncect it failed, keep login modal visible
      if (
        walletType === WALLET_TYPES.TOKENPOCKET &&
        (error?.name?.includes('WalletNotFoundError') || error?.name?.includes('WalletConnectionError'))
      ) {
        if (error?.message.includes('wallet must has at least one account')) {
          this.setOneData('isTokenPocketNoAddress', true);
        }
        return;
      }

      this._onFailedConnection();
      this.setConnectingWallet(null);
      throw error; // Re-throw for UI to handle
    } finally {
      // this.setConnectingWallet(null);
    }
  }

  closeConnect = () => {
    this.setOneData('isConnected', false);
    this.setOneData('defaultAccount', null);
    this.setOneData('walletTronWeb', null);
    window.defaultAccount = this.defaultAccount = false;
    tronObj.walletTronWeb = null;

    if (this.walletType === WALLET_TYPES.WALLETCONNECT) {
      this.rootStore.connect.disconnectWalletConnect();
    }
    Object.values(WALLET_TYPES).forEach(type => {
      window.localStorage.setItem(`${type}disconnect`, 'true');
    });
  };

  @action
  disconnect = () => {
    this.setOneData('isConnected', false);
    this.setOneData('defaultAccount', null);
    this.setOneData('walletTronWeb', null);
    tronObj.walletTronWeb = null;

    if (this.walletType === WALLET_TYPES.WALLETCONNECT) {
      this.rootStore.connect.disconnectWalletConnect();
    }

    // Set disconnect flags for all wallets and clear session data
    Object.values(WALLET_TYPES).forEach(type => {
      window.localStorage.setItem(`${type}disconnect`, 'true');
    });
    window.localStorage.removeItem(LOCAL_STORAGE_KEYS.LEDGER_SESSION);
    window.localStorage.setItem(LOCAL_STORAGE_KEYS.WC_SESSION, '[]');
    window.localStorage.removeItem(LOCAL_STORAGE_KEYS.LAST_LOGIN);

    if (this.walletType !== WALLET_TYPES.WALLETCONNECT) {
      window.location.reload();
    }
  };

  // --- Event Handling & Listeners ---

  _setupAdapterEventListeners(adapter) {
    const walletName = adapter.name.toLowerCase();
    adapter.on('connect', () => {
      console.log('adapter connect');
      this._onSuccessfulConnection(walletName);
    });
    adapter.on('disconnect', () => {
      console.log('adapter disconnect');
      this.disconnect();
    });
    adapter.on('accountsChanged', (address, preAddress) => {
      if (address && preAddress && (address !== preAddress || walletName === WALLET_TYPES.TOKENPOCKET)) {
        console.log('Account changed, reloading...');
        window.location.reload();
      }
    });
    adapter.on('chainChanged', async () => {
      if (!this.isConnected) return;
      window.location.reload();
      // production will reload if net changed, so stay same action
      // this.isRightChain = await this._isRightChain();
      // this.emitter.emit('chainChanged');
    });
  }

  _setupGlobalEventListeners() {
    // General listener for events from wallet extensions
    window.addEventListener('message', res => {
      if (res?.source !== window) return;
      if (res?.origin !== window.location.origin) return;

      const messageData = res?.data?.data?.data;
      if (!messageData) return;

      const isStorageDisconnected = window.localStorage.getItem(`${this.walletType}disconnect`);
      if (isStorageDisconnected) return;

      // OKX Wallet specific events
      if (this.walletType === WALLET_TYPES.OKX) {
        const { method, params } = messageData;
        if (method === 'clearCookie' || (method === 'wallet_unlockStateChanged' && params?.locked)) {
          this.disconnect();
        }
        if (method === 'wallet_accountsChanged' || method === 'walletChanged') {
          window.location.reload();
        }
      }
    });

    // binance accounts change
    if (window?.binancew3w?.tron) {
      window.binancew3w.tron.on('accountsChanged', () => {
        window.location.reload(true);
      });
    }
  }

  // --- Internal Logic & State Management ---

  connectWalletV2 = async () => {
    this.setLoginModalVisibilityV2(true);
  };

  async _autoReconnect() {
    if (!this.currentAppName) {
      const browserInfo = getBrowserInfo();
      if (browserInfo?.appName) {
        this.setCurrentAppName(browserInfo.appName);
      }
    }

    const lastLoginInfo = window.localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_LOGIN);
    if (!lastLoginInfo && !Config.allowAutoConnectInMobile.includes(this.currentAppName) && isMobileDevice) {
      this.setFinishedWalletInit(true);
      return;
    }

    const [lastWalletType] = lastLoginInfo?.split('_') || [];
    const isDisconnected =
      window.localStorage.getItem(`${lastWalletType}disconnect`) &&
      !Config.allowAutoConnectInMobile.includes(this.currentAppName) &&
      isMobileDevice;

    if (isDisconnected) {
      this.setFinishedWalletInit(true);
      return;
    }

    const adapter = this.adapters[lastWalletType];

    try {
      if (lastWalletType === WALLET_TYPES.LEDGER) {
        await this.rootStore.ledger.reconnect();
        await this._onSuccessfulConnection(WALLET_TYPES.LEDGER);
      } else if (lastWalletType === WALLET_TYPES.WALLETCONNECT) {
        await this.rootStore.connect.connect();
        await this._onSuccessfulConnection(WALLET_TYPES.WALLETCONNECT);
      } else if (adapter) {
        if (
          isMobileDevice ||
          (lastWalletType === WALLET_TYPES.TOKENPOCKET && window.tokenpocket?.tron?.tronWeb?.defaultAddress?.base58) ||
          lastWalletType === WALLET_TYPES.BINANCE
        ) {
          await adapter.connect();
        }

        if (adapter?.connected) {
          this._setupAdapterEventListeners(adapter);
          await this._onSuccessfulConnection(lastWalletType);
        }
      } else if (Config.allowAutoConnectInMobile.includes(this.currentAppName) && isMobileDevice) {
        // for imtoken auto connect
        await this._onSuccessfulConnection(this.currentAppName);
      }
    } catch (error) {
      console.error(`Auto-reconnect failed for ${lastWalletType}:`, error);
    } finally {
      this.setFinishedWalletInit(true);
    }
  }

  @action
  async _onSuccessfulConnection(walletType) {
    const address = this.initTronWeb(walletType);
    if (!address) return;

    this.setWalletType(walletType);
    this.setIsConnected(true);

    // Clean up UI and persist login
    this.setConnectingWallet(null);
    this.setLoginModalVisibility(false);
    this.setLoginModalVisibilityV2(false);
    window.localStorage.removeItem(`${walletType}disconnect`);
    window.localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_LOGIN, `${walletType}_${Date.now()}`);

    this.emitter.emit('connect');
    this.networkJudge();
  }

  @action
  _onFailedConnection() {
    this.setLoginModalStep(1);
    this.setLoginModalStepV2(1);
    this.setIsConnected(false);
    this.setDefaultAccount(null);
  }

  initTronWeb = walletType => {
    this.walletTronWeb = getWalletTronWeb(walletType);
    tronObj.walletTronWeb = this.walletTronWeb;

    const { trongrid } = Config;
    if (trongrid?.key && this.walletTronWeb.setHeader && this.walletTronWeb.fullNode.host === trongrid.host) {
      this.walletTronWeb.setHeader({ 'TRON-PRO-API-KEY': trongrid.key });
    }

    let address = this.adapters[walletType]?.address || this.walletTronWeb?.defaultAddress?.base58;
    if (walletType === WALLET_TYPES.WALLETCONNECT) {
      address = this.rootStore.connect.client?.address;
    }
    if (walletType === WALLET_TYPES.LEDGER) {
      address = this.rootStore.ledger.client?.address;
    }
    if (address) {
      this.setDefaultAccount(address);
    }

    this.rootStore.transaction.startMonitoring();

    return address;
  };

  networkJudge = async () => {
    try {
      this.isRightChain = await this._isRightChain();
      if (!this.isRightChain) {
        // Attempt to switch chain or show error modal
        this.changeChain();
      }
    } catch (e) {
      console.error('Network check failed:', e);
    }
  };

  // only tronlink need to check network
  _isRightChain = async (walletType = this.walletType) => {
    // if not tronlink, return true
    if (this.walletType !== WALLET_TYPES.TRONLINK) return 1;

    try {
      const isTestnetEnv = import.meta.env.VITE_ENV === 'test';
      const currentHost =
        window.tronOfTronLink?.tronWeb?.fullNode?.host ||
        window.tronLink?.tronWeb?.fullNode?.host ||
        window.tron?.tronWeb?.fullNode?.host;

      const isTestnetNode = currentHost === 'https://api.nileex.io' || currentHost === 'https://nile.trongrid.io';
      const isMainnetNode = currentHost === Config.trongrid.host;

      // Correct if environment matches the node type
      return (isTestnetEnv && isTestnetNode) || (!isTestnetEnv && isMainnetNode) ? 1 : 0;
    } catch (e) {
      console.log('isRightChain error: ', e);
      return false; // Default to false on error
    }
  };

  changeChain = async () => {
    // if not tronlink, return
    if (this.walletType !== WALLET_TYPES.TRONLINK) return;

    if (isMobileDevice) {
      this.rootStore.ui.showNetworkErrorModal();
      return;
    }

    const isTestnetEnv = import.meta.env.VITE_ENV === 'test';
    const targetChainId = isTestnetEnv ? Config.CHAIN_ID_NILE : MAIN_NET_CHAIN_ID; // Mainnet ID
    const targetChainName = isTestnetEnv ? 'Nile' : 'Mainnet';

    try {
      const adapter = this.adapters[this.walletType] || new TronLinkAdapter();
      await adapter.switchChain(targetChainId);
    } catch (error) {
      console.error(`Failed to switch to ${targetChainName}:`, error);
    }
  };

  _waitForWalletEnvironment(timeout = 3000) {
    const browserInfo = getBrowserInfo();
    const lastLoginInfo = window.localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_LOGIN);
    if (!lastLoginInfo && browserInfo?.appName !== WALLET_TYPES.IMTOKEN) {
      this.setFinishedWalletInit(true);
      return;
    }

    const [lastWalletType] = lastLoginInfo?.split('_') || [];
    return new Promise(resolve => {
      const check = () =>
        window.tronLink ||
        window.okxwallet ||
        window.tokenpocket ||
        window.tron ||
        window.isBinance ||
        window.binancew3w ||
        lastWalletType === WALLET_TYPES.LEDGER ||
        browserInfo.appName === WALLET_TYPES.IMTOKEN ||
        lastWalletType === WALLET_TYPES.WALLETCONNECT;
      if (check()) return resolve(true);

      const interval = setInterval(() => {
        if (check()) {
          clearInterval(interval);
          resolve(true);
        }
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        resolve(check());
      }, timeout);
    });
  }

  @action setLoginModalVisibility = visible => {
    if (visible) this.loginModalStep = 1;
    this.loginModalVisible = visible;
  };
  @action setLoginModalVisibilityV2 = visible => {
    if (visible) this.loginModalStepV2 = 1;
    this.loginModalVisibleV2 = visible;
  };
  @action setLoginModalStep = step => {
    this.loginModalStep = step;
  };
  @action setLoginModalStepV2 = step => {
    this.loginModalStepV2 = step;
  };
  @action setFinishedWalletInit = finished => {
    this.finishedWalletInit = finished;
    this.emitter.emit('finishedWalletInit');
  };
  @action setConnectingWallet = wallet => {
    this.connectingWallet = wallet;
  };
  @action setWalletType = type => {
    this.walletType = type;
  };
  @action setDefaultAccount = account => {
    this.defaultAccount = account;
    window.defaultAccount = account;
  };
  @action setIsConnected = connected => {
    this.isConnected = connected;
  };
  @action setRouteName = name => {
    this.routeName = name;
  };
  @action setCurrentAppName = name => {
    this.currentAppName = name;
  };

  @action setOneData = (key, value) => {
    this[key] = value;
  };

  on = (...args) => this.emitter.on(...args);
  off = (...args) => this.emitter.off(...args);
}
