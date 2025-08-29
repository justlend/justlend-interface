import { observable, reaction, action, makeObservable } from 'mobx';
import Config from '../config';
import { BigNumber, getBrowserInfo, getWalletTronWeb } from '../utils/helper';
import { tronObj } from '../utils/blockchain';
import { TronLinkAdapter, OkxWalletAdapter } from '@tronweb3/tronwallet-adapters';
import { BinanceWalletAdapter } from '@tronweb3/tronwallet-adapters';
import { EventEmitter } from 'eventemitter3';
import isMobile from 'ismobilejs';
import { message } from 'antd';
import { TronWeb } from 'tronweb';

export default class NetworkStore {
  @observable walletTronWeb = null;
  @observable defaultAccount = null;
  @observable isConnected = null;
  @observable initConnection = null;
  @observable finishedWalletInit = false;
  @observable routeName = '';
  @observable loginModalVisible = false;
  @observable loginModalStep = 1;
  @observable start = null;
  @observable isMainNetwork = null;
  @observable isRightChain = null;
  @observable isWalletConnected = null; // WalletConnect Connect Status
  @observable loginModalVisibleV2 = false;
  @observable loginModalStepV2 = 1;

  @observable tronLinkAdapter = null;
  @observable binanceAdapter = null;
  @observable OkxWalletAdapter = null;
  @observable isLedgerConnected = false;
  @observable switchChainName = '';
  @observable currentAppName = '';
  @observable okxConnected = false;
  @observable tpConnected = false;
  @observable binanceConnected = false;
  @observable connectedWallet = 'tronlink';
  @observable walletType = null;
  @observable connectingWallet = null;

  constructor(rootStore) {
    this.rootStore = rootStore;
    this.emitter = new EventEmitter();

    makeObservable(this);

    this.reactionDisposer = reaction(
      () => this.walletType,
      async () => {
        let isMainNetwork = await this.isMainnet();
        this.isRightChain = await this._isRightChain(this.walletType);
        if (isMainNetwork !== this.isRightChain) {
          isMainNetwork = await this.isMainnet();
        } else {
          this.setMainNetwork(isMainNetwork);
        }
      }
    );
  }

  async init() {
    await this._waitForWalletEnvironment();

    const serviceAvailable = await this.rootStore.app.checkServiceStatus();
    if (serviceAvailable) {
      this.initWalletConnectionAndEvent();
    }
  }

  @action
  setLoginModalVisibility(visible) {
    this.loginModalVisible = visible;
    if (visible) {
      this.loginModalStep = 1;
    }
  }

  @action
  setLoginModalVisibilityV2(visible) {
    this.loginModalVisibleV2 = visible;
    if (visible) {
      this.loginModalStepV2 = 1;
    }
  }

  @action
  setLoginModalStep(step) {
    this.loginModalStep = step;
  }

  @action
  setLoginModalStepV2(step) {
    this.loginModalStepV2 = step;
  }

  @action
  setMainNetwork(isMain) {
    this.isMainNetwork = isMain;
  }

  @action
  setSwitchChainName(name) {
    this.switchChainName = name;
  }

  @action
  setCurrentAppName(name) {
    this.currentAppName = name;
  }

  @action
  setConnectingWallet(wallet) {
    this.connectingWallet = wallet;
  }

  @action
  setWalletType(type) {
    this.walletType = type;
  }

  @action
  setConnectedWallet(wallet) {
    this.connectedWallet = wallet;
  }

  @action
  setRouteName(name) {
    this.routeName = name;
  }

  @action
  setDefaultAccount(account) {
    this.defaultAccount = account;
    window.defaultAccount = account;
  }

  @action
  setIsConnected(connected) {
    this.isConnected = connected;
    if (connected) {
      this.finishedWalletInit = true;
    }
  }

  @action
  setIsLedgerConnected(connected) {
    this.isLedgerConnected = connected;
    if (connected) {
      this.finishedWalletInit = true;
    }
  }

  @action
  setIsWalletConnected(connected) {
    this.isWalletConnected = connected;
    if (connected) {
      this.finishedWalletInit = true;
    }
  }

  @action
  setInitConnection(connection) {
    this.initConnection = connection;
  }

  _waitForWalletEnvironment(timeout = 5000) {
    return new Promise(resolve => {
      if (window.tronLink || window.okxwallet || window.tokenpocket || window.tron) {
        return resolve(true);
      }
      const interval = setInterval(() => {
        if (window.tronLink || window.okxwallet || window.tokenpocket || window.tron) {
          clearInterval(interval);
          resolve(true);
        }
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        console.warn('Wallet environment not detected after timeout.');
        resolve(false);
      }, timeout);
    });
  }

  initTronWeb = async (walletType = 'tronlink') => {
    const lastLoginInfo = window.localStorage.getItem('lastLoginInfo');
    let lastLoginWallet = '';
    const infos = lastLoginInfo?.split('_');
    if (infos) {
      lastLoginWallet = infos[0];
    }
    this.walletType = walletType || lastLoginWallet || 'tronlink';
    this.connectedWallet = walletType;
    const isStorageDisconnected = window.localStorage.getItem(this.walletType + 'disconnect');
    if (isStorageDisconnected) {
      this.rootStore.transaction.startMonitoring();
      return;
    }
    var walletTronWeb;
    if (walletType === 'binance' || walletType === 'okx') {
      walletTronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });
    } else {
      walletTronWeb = getWalletTronWeb(walletType);
    }
    //walletType === 'binance' ? new TronWeb({ fullHost: 'https://api.trongrid.io' }) : getWalletTronWeb(walletType);

    //TODO pc isn't worked, but mobile is worked, fullhost is reset, so that can't check current network
    // if (
    //   import.meta.env.VITE_ENV === 'test' ||
    //   import.meta.env.VITE_ENV === 'qaTest' ||
    //   import.meta.env.VITE_ENV === 'nile'
    // ) {
    //   walletTronWeb.setFullNode(Config.chain.fullHost);
    //   walletTronWeb.setSolidityNode(Config.chain.fullHost);
    // }

    const { trongrid } = Config;
    if (trongrid && walletTronWeb.setHeader && walletTronWeb.fullNode.host === trongrid.host) {
      walletTronWeb.setHeader({ 'TRON-PRO-API-KEY': trongrid.key });
    }

    tronObj.walletTronWeb = this.walletTronWeb = walletTronWeb;
    if (walletType === 'binance' && this.binanceAdapter) {
      this.setDefaultAccount(this.binanceAdapter.address);
      window.defaultAccount = this.binanceAdapter.address;
      this.setIsConnected(true);
    } else if (walletType === 'okx' && this.OkxWalletAdapter) {
      let currentAddress =
        this.OkxWalletAdapter?.address ||
        this.OkxWalletAdapter?.tronWeb.defaultAddress?.base58 ||
        this.walletTronWeb.defaultAddress.base58;
      this.setDefaultAccount(currentAddress);
      window.defaultAccount = currentAddress;
      this.setIsConnected(true);
    } else if (this.walletTronWeb.defaultAddress.base58) {
      this.setDefaultAccount(this.walletTronWeb.defaultAddress.base58);
      this.setIsConnected(true);
      window.defaultAccount = this.walletTronWeb.defaultAddress.base58;
    }

    window.gtag('event', 'loading', { 'event_category': 'connect', 'event_label': 'yes', 'value': 'yes' });
    this.rootStore.transaction.startMonitoring();
  };

  closeConnect = () => {
    this.isConnected = false;
    this.initConnection = false;
    this.walletTronWeb = false;
    window.defaultAccount = this.defaultAccount = false;
    tronObj.walletTronWeb = null;
    if (this.connectedWallet === 'walletconnect') {
      this.rootStore.connect.disconnectWalletConnect();
    }
  };

  disconnect = () => {
    this.closeConnect();
    window.localStorage.setItem('tokenpocketdisconnect', true);
    window.localStorage.setItem('okxdisconnect', true);
    window.localStorage.setItem('binancedisconnect', true);
    window.localStorage.setItem('tronlinkdisconnect', true);
    window.localStorage.setItem('walletconnectdisconnect', true);
    window.localStorage.removeItem('justlend:ledger');
    window.localStorage.setItem('wc@2:client:0.3//session', '[]');
    window.location.reload(true);
  };

  checkLedger = async () => {
    this.rootStore.ledger.listenLogEvent();

    if (window.localStorage.getItem('justlend:ledger')) {
      await this.rootStore.ledger.reconnect();
      window.localStorage.setItem('lastLoginInfo', 'ledger_' + Date.now());
      return true;
    }
    return false;
  };

  connectWallet = async () => {
    this.setLoginModalVisibility(true);
  };

  isMainnet = async () => {
    try {
      let res = await this.walletTronWeb?.trx?.getBlock(0);
      if (Config.chain.fullHost === 'https://api.trongrid.io' && res?.blockID) {
        if (res.blockID === Config.blockId) return 1; // online & mainnet
        return 0; // online & not mainnet
      } else {
        return -1; // not online
      }
    } catch (e) {
      console.log('isMainnet: ', e);
    }
  };

  _isRightChain = async (walletType = this.walletType) => {
    try {
      if (
        this.tronLinkAdapter?.readyState === 'Found' ||
        window?.okxwallet?.tronLink?.ready ||
        window?.tron?.tronWeb?.ready
      ) {
        let walletTronWeb = getWalletTronWeb(walletType);
        const { trongrid } = Config;

        if (
          (import.meta.env.VITE_ENV === 'test' ||
            import.meta.env.VITE_ENV === 'qaTest' ||
            import.meta.env.VITE_ENV === 'nile') &&
          walletTronWeb?.fullNode?.host === trongrid.host
        ) {
          return 0;
        } else if (
          import.meta.env.VITE_ENV !== 'test' &&
          import.meta.env.VITE_ENV !== 'qaTest' &&
          import.meta.env.VITE_ENV !== 'nile' &&
          (walletTronWeb?.fullNode?.host === 'https://api.nileex.io' ||
            walletTronWeb?.fullNode?.host === 'https://nile.trongrid.io')
        ) {
          return 0;
        }
        return 1;
      }
    } catch (e) {
      console.log('isRightChain: ', e);
    }
  };

  changeChain = async () => {
    const mobile = isMobile(window.navigator).any;
    try {
      const mobile = isMobile(window.navigator).any;
      const isStorageDisconnected = window.localStorage.getItem(this.walletType + 'disconnect');
      if (isStorageDisconnected) return;
      let tronLinkAdapter = window.tronOfTronLink || this.tronLinkAdapter || new TronLinkAdapter();
      if (
        tronLinkAdapter?.readyState === 'Found' ||
        window?.okxwallet?.tronLink?.ready ||
        window?.tron?.tronWeb?.ready
      ) {
        const walletTronWeb = getWalletTronWeb();
        const { trongrid } = Config;
        if (
          (import.meta.env.VITE_ENV === 'test' ||
            import.meta.env.VITE_ENV === 'qaTest' ||
            import.meta.env.VITE_ENV === 'nile') &&
          walletTronWeb.fullNode.host === trongrid.host
        ) {
          if (mobile) {
            this.rootStore.ui.showNetworkErrorModal();
            return;
          }
          try {
            if (window.tronOfTronLink) {
              await window.tronOfTronLink.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xcd8690dc' }]
              });
            } else {
              await tronLinkAdapter.switchChain('0xcd8690dc');
            }
          } catch (error) {
            this.setSwitchChainName('Nile');
          }
        } else if (
          import.meta.env.VITE_ENV !== 'test' &&
          import.meta.env.VITE_ENV !== 'qaTest' &&
          import.meta.env.VITE_ENV !== 'nile' &&
          (walletTronWeb?.fullNode?.host === 'https://api.nileex.io' ||
            walletTronWeb?.fullNode?.host === 'https://nile.trongrid.io')
        ) {
          if (mobile) {
            this.rootStore.ui.showNetworkErrorModal();
            return;
          }
          try {
            if (window.tronOfTronLink) {
              await window.tronOfTronLink.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x2b6653dc' }]
              });
            } else {
              await tronLinkAdapter.switchChain('0x2b6653dc');
            }
          } catch (error) {
            this.setSwitchChainName('Mainnet');
          }
        }
      } else if (!tronLinkAdapter && this.connectedWallet === 'tronlink') {
        this.rootStore.ui.showNetworkErrorModal();
        return;
      }
    } catch (e) {
      console.log('isMainnet: ', e);
    }
  };

  connectWalletV2 = async () => {
    this.setLoginModalVisibilityV2(true);
  };

  async initWalletConnectionAndEvent() {
    try {
      if (!this.currentAppName) {
        const browserInfo = getBrowserInfo();
        if (browserInfo?.appName) {
          this.setCurrentAppName(browserInfo.appName);
        }
      }
      const { allowAutoConnectInMobile } = Config;
      if (allowAutoConnectInMobile.includes(this.currentAppName) && isMobile(window.navigator).any) {
        if (window?.tronWeb || window?.tron || window?.tronLink) {
          window.gtag('event', 'login', { 'event_category': this.currentAppName, 'event_label': 'login' });
          this.walletType = this.currentAppName;
          this.connectedWallet = this.currentAppName;
          await this.initTronWeb();
          this.networkJudge();
          this.emitter.emit('connect');
          return;
        }
        this.walletFinishInitFn();
        return;
      }

      const lastLoginInfo = window.localStorage.getItem('lastLoginInfo');

      let lastLoginWallet = '';
      const infos = lastLoginInfo?.split('_');
      if (infos) lastLoginWallet = infos[0];

      this.setInitConnection(true);
      let tronLinkAdapterConnected = false;
      if (!window?.tronOfTronLink && window?.tron && !window.tron?.isTokenPocket) {
        let adapter = (this.tronLinkAdapter = new TronLinkAdapter());
        // console.log('initWalletConnectionAndEvent adapter: ', adapter);
        // for okx wallet mobile
        if (window?.okxwallet?.tronLink) {
          this.setWalletType('okx');
          this.setConnectedWallet('okx');
          adapter = this.OkxWalletAdapter = new OkxWalletAdapter();
        } else {
          tronLinkAdapterConnected = adapter.connected && (!lastLoginWallet || lastLoginWallet === 'tronlink');
        }
        this.listenTronLineEvent(adapter);
      } else if (window?.binancew3w?.tron) {
        // binance accounts change
        window.binancew3w.tron.on('accountsChanged', () => {
          window.location.reload(true);
        });
      } else {
        this.listenTronLinkEvent();
      }

      if (!lastLoginWallet || lastLoginWallet === 'tronlink') {
        if (tronLinkAdapterConnected || window?.tronOfTronLink?.tronWeb) {
          if ((tronLinkAdapterConnected && window?.tron) || window?.tronOfTronLink?.tronWeb) {
            window.gtag('event', 'login', { 'event_category': 'PC_V1.5', 'event_label': 'login' });
            window.gtag('event', 'conwallet_connected', {
              'event_category': 'tronlink',
              'event_label': 'conwallet_connected'
            });
            this.setWalletType('tronlink');
            this.setConnectedWallet('tronlink');
            await this.initTronWeb();
            this.networkJudge();
            this.emitter.emit('connect');
            return;
          }
          this.walletFinishInitFn();
          return;
        }
      } else if (lastLoginWallet === 'okx' || lastLoginInfo.indexOf('okx') > -1) {
        const isStorageDisconnected = window.localStorage.getItem('okxdisconnect');
        if (
          window?.okxwallet?.tronLink?.ready ||
          window?.okxwallet?.tronWeb?.defaultAddress?.base58 ||
          window?.okxwallet?.tronLink?.tronWeb?.defaultAddress?.base58 ||
          (!isStorageDisconnected && isMobile(window.navigator).any)
        ) {
          this.OkxWalletAdapter = new OkxWalletAdapter();
          await this.OkxWalletAdapter.connect();
          this.walletType = 'okx';
          this.connectedWallet = 'okx';
          await this.initTronWeb('okx');
          this.emitter.emit('connect');
          this.okxConnected = true;
          window.gtag('event', 'conwallet_connected', {
            'event_category': 'okx',
            'event_label': 'conwallet_connected'
          });
          return;
        }
        this.walletFinishInitFn();
        return;
      } else if (lastLoginWallet === 'tokenpocket') {
        if (window.tokenpocket?.tron?.tronWeb) {
          this.walletType = 'tokenpocket';
          this.connectedWallet = 'tokenpocket';
          // await this.initTronWeb(window.okxwallet.tronLink.tronWeb, { isOKX: true });
          await this.initTronWeb('tokenpocket');
          this.emitter.emit('connect');
          this.tpConnected = true;
          window.gtag('event', 'conwallet_connected', {
            'event_category': 'TokenPocket',
            'event_label': 'conwallet_connected'
          });
          return;
        }
        this.walletFinishInitFn();
        return;
      } else if (lastLoginWallet === 'binance') {
        if (window.binancew3w.tron) {
          const adapter = new BinanceWalletAdapter();
          this.binanceAdapter = adapter;
          // connect to BinanceWallet
          await adapter.connect();
          this.walletType = 'binance';
          this.connectedWallet = 'binance';
          // await this.initTronWeb(window.okxwallet.tronLink.tronWeb, { isOKX: true });
          await this.initTronWeb('binance');
          this.emitter.emit('connect');
          this.binanceConnected = true;
          window.gtag('event', 'conwallet_connected', {
            'event_category': 'binance',
            'event_label': 'conwallet_connected'
          });
          return;
        }
        this.walletFinishInitFn();
        return;
      }

      let connected = lastLoginWallet === 'walletconnect';
      if (connected) {
        await this.rootStore.connect.init();
        await this.rootStore.connect.connect();
        this.walletType = 'walletconnect';
        this.connectedWallet = 'walletconnect';
        this.emitter.emit('connect');
        window.gtag('event', 'conwallet_connected', {
          'event_category': 'walletconnect',
          'event_label': 'conwallet_connected'
        });
        return;
      }
      connected = await this.checkLedger();
      if (connected) {
        this.walletType = 'ledger';
        this.connectedWallet = 'ledger';
        this.emitter.emit('connect');
        window.gtag('event', 'conwallet_connected', {
          'event_category': 'ledger',
          'event_label': 'conwallet_connected'
        });
      }
      this.walletFinishInitFn();
      this.finishedWalletInit = true;
      this.emitter.emit('finishedWalletInit');
    } catch (error) {
      console.log('initWalletConnectionAndEvent error: ', error);
    }
  }

  walletFinishInitFn() {
    this.finishedWalletInit = true;
    this.emitter.emit('finishedWalletInit');
  }

  listenTronLink = () => {
    const attachListeners = () => {
      if (window?.tron?.on) {
        console.log('🔗 TronLink detected, binding listeners...');
        window.tron.on('accountsChanged', accounts => {
          console.log('accountsChanged:', accounts);
          window.location.reload(true);
        });
        window.tron.on('chainChanged', connectInfo => {
          console.log('chainChanged:', connectInfo);
          window.location.reload(true);
        });
        window.tron.on('connect', connect => {
          console.log('connect:', connect);
        });
        window.tron.on('disconnect', disconnect => {
          console.log('disconnect:', disconnect);
        });
        return true;
      }
      return false;
    };

    if (!attachListeners()) {
      console.log('TronLink not found, start polling...');

      const timer = setInterval(() => {
        if (attachListeners()) {
          clearInterval(timer);
        }
      }, 200);

      setTimeout(() => {
        clearInterval(timer);
        console.warn('TronLink not detected after timeout.');
      }, 60000);
    }
  };

  listenTronLinkEvent() {
    window.addEventListener('message', res => {
      const isStorageDisconnected = window.localStorage.getItem(this.connectedWallet + 'disconnect');
      if (
        this.walletType !== 'tokenpocket' &&
        res?.data?.data?.data?.method === 'metamask_chainChanged' &&
        res?.data?.data?.data?.params?.chainId === '0x2b6653dc'
      ) {
        return false;
      }
      if (!isStorageDisconnected) {
        if (this.walletType === 'tokenpocket' && res?.data?.data?.data) {
          const tpData = res.data.data.data;
          if (tpData?.method === 'metamask_accountsChanged' && tpData?.params?.length === 0) {
            window.localStorage.setItem('tokenpocketdisconnect', true);
            window.location.reload();
          } else if (
            tpData?.method === 'metamask_accountsChanged' &&
            tpData?.params?.length === 1 &&
            tpData?.params[0] !== this.defaultAccount
          ) {
            window.location.reload();
          }
        }
        if (this.walletType === 'okx' && res?.data?.data?.data) {
          const okxData = res?.data?.data?.data;
          // console.log('okxData: ', okxData)
          if (
            okxData?.method === 'clearCookie' ||
            (okxData?.method === 'wallet_unlockStateChanged' && okxData?.params?.auto === false)
          ) {
            window.localStorage.setItem('okxdisconnect', true);
            window.location.reload();
          }
          if (okxData?.method === 'wallet_accountsChanged' || okxData?.method === 'rpcModeChanged') {
            this.connectOKX();
            window.location.reload();
          }
        }
        if (this.connectedWallet === 'tronlink') {
          this.listenTronLink();
        }
      }
    });

    // for okx wallet pc
    this.OkxWalletAdapter?.on('accountsChanged', currentAccount => {
      console.log('OkxWallet accountsChanged: ', currentAccount);
      this.connectOKX();
      window.location.reload();
    });
  }

  listenTronLineEvent(adapter) {
    window.addEventListener('message', res => {
      if (res?.data?.data?.data?.method === 'clearCookie') {
        window.location.reload();
      }
    });
    const onConnect = async () => {
      if (this.isWalletConnected || this.isLedgerConnected) {
        window.location.reload();
        return;
      }
      window.localStorage.removeItem('justlend:ledger');
      window.localStorage.removeItem('wc@2:client:0.3//session');
      await this.initTronWeb(this.walletType);
      this.loginModalVisible = false;
      if (this.okxConnected) this.setLoginModalVisibilityV2(false);
      this.emitter.emit('connect');
    };
    adapter.on('readyStateChanged', () => {
      if (adapter.readyState === 'Found' && !adapter.connected) {
        window.gtag('event', 'loading', { 'event_category': 'connect', 'event_label': 'no', 'value': 'no' });
        window.gtag('event', 'not_login', { 'event_category': 'PC_V1.5', 'event_label': 'not_login' });
      }
    });

    adapter.on('connect', () => {
      onConnect();
    });
    adapter.on('disconnect', () => {
      console.log('TronLink disconnect: ');
      window.localStorage.removeItem('justlend:ledger');
      window.localStorage.removeItem('wc@2:client:0.3//session');
      window.location.reload();
    });

    adapter.on('accountsChanged', (address, preAddress) => {
      console.log('******', address, 'address', preAddress, 'preAddress');
      if (address && preAddress && address !== preAddress) {
        onConnect();
        this.emitter.emit('accountsChanged');
      }
    });
    adapter.on('chainChanged', async () => {
      if (!this.isConnected) {
        return;
      }
      this.isMainNetwork = await this.isMainnet();
      this.isRightChain = await this._isRightChain();
      this.emitter.emit('chainChanged');
    });
  }

  networkJudge = async () => {
    try {
      let isRightChain = await this._isRightChain(this.walletType);
      if (isRightChain === 0) {
        this.changeChain();
        return;
      }
      this.isMainNetwork = await this.isMainnet();
      if (this.isMainNetwork === 0) {
        this.rootStore.ui.showNetworkErrorModal();
        return;
      }
    } catch (e) {
      console.log('network error: ', e);
    }
  };

  connectBinance = async () => {
    try {
      const adapter = new BinanceWalletAdapter();
      this.binanceAdapter = adapter;
      // connect to BinanceWallet
      await adapter.connect();
      window.localStorage.removeItem('binancedisconnect');
      await this.initTronWeb('binance');
      this.binanceConnected = true;
      this.loginModalVisible = false;
      this.loginModalVisibleV2 = false;
      window.localStorage.setItem('lastLoginInfo', 'binance_' + Date.now());
    } catch (e) {
      console.error('Binance Connect Error: ', e);
      this.setLoginModalStep(1);
      this.setLoginModalStepV2(1);
      this.closeConnect();
      throw e;
    }
  };

  connectTronLink = async () => {
    try {
      if (window?.tokenpocket) {
        if (window.tronOfTronLink?.tronWeb?.defaultAddress?.base58) {
          window.localStorage.removeItem('tronlinkdisconnect');
          this.initTronWeb();
          this.networkJudge();
          this.loginModalVisible = false;
          this.setLoginModalVisibilityV2(false);
          window.localStorage.setItem('lastLoginInfo', 'tronlink_' + Date.now());
          // window.location.reload(); // update tronOfTronlink
        } else {
          if (!window.tronOfTronLink) {
            if (window.tron?.isTronLink && !window.tron?.tronWeb) {
              window.tronOfTronLink = window.tron;
            } else {
              var url = window.tron?.tronWeb?.fullNode.host;
              if (url.includes('trongrid.io') || url.includes('tronstack.io') || url.includes('nileex.io')) {
                window.tronOfTronLink = window.tron;
              }
            }
          }
          const result = await window.tronOfTronLink.request({ method: 'eth_requestAccounts' });
          if (result?.length > 0) {
            window.localStorage.removeItem('tronlinkdisconnect');
            // this.initTronWeb();
            // this.networkJudge();
            this.loginModalVisible = false;
            this.loginModalVisibleV2 = false;
            window.localStorage.setItem('lastLoginInfo', 'tronlink_' + Date.now());
            window.location.reload(); // update tronOfTronlink
          }
        }
      } else if (!window?.tron) {
        if (!isMobile(window.navigator).any) {
          const searchTronTimes = window.localStorage.getItem('searchTronTimes');
          if (BigNumber(searchTronTimes).gte(5) || !window?.tronOfTronLink) {
            console.log('TronLink Wallet not found');
          } else {
            window.location.reload(true);
          }
        }
      } else {
        const adapter = new TronLinkAdapter({
          openUrlWhenWalletNotFound: false,
          openTronLinkAppOnMobile: false,
          checkTimeout: 10 * 1000
        });
        await adapter.connect();
        window.localStorage.removeItem('tronlinkdisconnect');
        await this.initTronWeb();
        this.networkJudge();
        this.loginModalVisible = false;
        this.loginModalVisibleV2 = false;
        window.localStorage.setItem('lastLoginInfo', 'tronlink_' + Date.now());
      }
    } catch (e) {
      console.error('Connect Error: ', e);

      if (!isMobile(window.navigator).any) {
        const searchTronTimes = window.localStorage.getItem('searchTronTimes');
        if (BigNumber(searchTronTimes).gte(5) || !window?.tronOfTronLink) {
          console.log('TronLink Wallet not found');
        } else {
          window.location.reload(true);
        }
        throw e;
      }
    }
  };

  connectOKX = async () => {
    try {
      const adapter = new OkxWalletAdapter();
      this.OkxWalletAdapter = adapter;
      await adapter.connect();
      window.localStorage.removeItem('okxdisconnect');
      this.loginModalVisible = false;
      this.loginModalVisibleV2 = false;

      this.initTronWeb('okx');
      this.okxConnected = true;
      window.localStorage.setItem('lastLoginInfo', 'okx_' + Date.now());
    } catch (e) {
      console.error('okx Connect Error: ', e);
      this.setLoginModalStep(1);
      this.setLoginModalStepV2(1);
      this.closeConnect();
      throw e;
    }
  };

  connectTokenPocket = async () => {
    try {
      const provider = window.tokenpocket.tron;
      // const provider = window.tron;
      const result = await provider.request({ method: 'tron_requestAccounts' });
      if (window?.tokenpocket?.tron?.tronWeb?.defaultAddress?.base58 || result?.code === 200) {
        window.localStorage.removeItem('tokenpocketdisconnect');
        // console.log('tp connected: ', provider.tron);
        this.loginModalVisible = false;
        this.loginModalVisibleV2 = false;

        this.initTronWeb('tokenpocket');
        this.tpConnected = true;
        window.localStorage.setItem('lastLoginInfo', 'tokenpocket_' + Date.now());
      }
    } catch (e) {
      console.error('tokenpocket Connect Error: ', e);
      this.setLoginModalStep(1);
      this.setLoginModalStepV2(1);
      this.closeConnect();
      throw e;
    }
  };

  on(...args) {
    this.emitter.on(...args);
  }
  off(...args) {
    this.emitter.off(...args);
  }
}
