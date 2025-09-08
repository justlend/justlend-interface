import React from 'react';
import { observable } from 'mobx';
import { notification } from 'antd';
import intl from 'react-intl-universal';
import axios from 'axios';
import TronWeb from 'tronweb';
import Config from '../config';
import { getWalletTronWeb, tronscanTX } from '../utils/helper';
import Tip from '../components/Tip';
import { getTimeNow, getRentWhiteList } from '../utils/backend';
import { getTransactionInfo, tronObj } from '../utils/blockchain';
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapters';
import { AdapterState } from '@tronweb3/tronwallet-abstract-adapter';
import { EventEmitter } from 'eventemitter3';
export default class NetworkStore {
  @observable walletTronWeb = null;
  @observable defaultAccount = null;
  @observable isConnected = null;
  @observable initConnection = null;
  @observable finishedWalletInit = false;
  @observable routeName = '';
  @observable lang = '';
  @observable loginModalVisible = false;
  @observable loginModalStep = 1;
  @observable menuFlag = true;
  @observable start = null;
  @observable nowTime = null;
  @observable multyStart = true;
  @observable multyRealStart = true;
  @observable btcstStart = null;
  @observable isMainNetwork = null;
  @observable isRightChain = null;
  @observable accountSlideDown = true;
  @observable isDepositShowMore = false;
  @observable isLendShowMore = false;
  @observable rewardModalShow = false;
  @observable userSupplyModalShow = false;
  @observable userBorrowModalShow = false;
  @observable client = null; //WalletConnect Client
  @observable session = null; //WalletConnect Session
  @observable isWalletConnected = null; // WalletConnect Connect Status
  @observable wsModalVisible = false; // WalletConnect Modal
  @observable wsFailureModal = false; // WalletConnect Failure Modal
  @observable wsURI = ''; // WalletConnect URI
  @observable wsSRC = ''; // WalletConnect QR Image SRC
  @observable loginModalVisibleV2 = false;
  @observable loginModalStepV2 = 1;
  @observable networkErrorModalVisible = false;
  @observable rewardVisible = false;
  @observable allowanceVisible = false;
  @observable miningRewardVisible = false;

  @observable tronLinkAdapter = null;
  @observable isLedgerConnected = false;
  @observable showTabsBar = true;
  @observable isShowMoreV2 = false;
  @observable switchChainName = '';
  @observable newRentVisible = false;
  @observable browserType = 1;
  @observable okxConnected = false;

  constructor(rootStore) {
    this.rootStore = rootStore;
    this.emitter = new EventEmitter();

    const closedNoServiceModalAll = window.localStorage.getItem('closedNoServiceModalAll');
    const lastClosed = closedNoServiceModalAll ? Number(closedNoServiceModalAll) : 0;
    const now = Date.now();
    if (Config.noServiceModalVisible) {
      this.getTipStatus().then(res => {
        if (res) {
          if (now - lastClosed > 24 * 60 * 60 * 1000) {
            const serviceStatus = window.localStorage.getItem('serviceStatus');
            if (!serviceStatus || serviceStatus !== 'disabled') {
              this.rootStore.lend.setData({
                noServiceModalAllVisible: res
              });
            } else {
              this.closeConnect();
              this.rootStore.lend.setData({
                serviceInnerStatus: 'disabled'
              });
            }
          } else {
            window.localStorage.setItem('serviceStatus', 'continue');
            this.rootStore.lend.setData({ serviceInnerStatus: 'continue' });
            setTimeout(() => {
              this.initWalletConnectionAndEvent();
            }, 500);
          }
        } else {
          window.localStorage.setItem('serviceStatus', 'normal');
          this.rootStore.lend.setData({ serviceInnerStatus: 'normal' });
          setTimeout(() => {
            this.initWalletConnectionAndEvent();
          }, 500);
        }
      });
    } else {
      window.localStorage.removeItem('serviceStatus');
      // this.rootStore.lend.setData({ serviceInnerStatus: 'normal' });
      setTimeout(() => {
        this.initWalletConnectionAndEvent();
      }, 500);
    }
  }

  instance = axios.create({
    validateStatus: function (status) {
      return status >= 200 && status < 300; // default
    }
  });

  getTipStatus = async () => {
    try {
      await this.instance.get('https://rioj.ablesdxd.link/?time=' + Date.now());
    } catch (error) {
      if (error.code) {
        return true;
      }
    }
  };

  getDescription = (type, item, text) => {
    const { tx, title, status } = item;
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
    }
    return (
      <div className={'trans-notify'}>
        <span className="hover">{tronscanTX(intl.get('view_on_tronscan'), tx, true)}</span>
        <span className={'trans-btn-tip ' + className}>{text}</span>
        {/* {type === 3 ? (
          <Tip tip={intl.getHTML('toast.faild_reason')} left>
            <span className={'trans-btn-tip ' + className}>{text}</span>
          </Tip>
        ) : (
          <span className={'trans-btn-tip ' + className}>{text}</span>
        )} */}
      </div>
    );
  };

  checkPendingTransactions = async () => {
    let data = window.localStorage.getItem(window.defaultAccount) || '[]';
    const transactions = JSON.parse(data);

    const pendingTransactions = [];

    for (const item of transactions) {
      const { tx, status, showPending } = item;

      if (Number(status) === 1) {
        if (showPending) {
          this.logTransactionPending(item);
        }
        item.checkCnt++;

        const r = await getTransactionInfo(tx);
        if (r && r.ret && r.ret[0].contractRet === 'SUCCESS') {
          this.logTransactionConfirmed(item);
          continue;
        } else if (r && r.ret && r.ret[0].contractRet !== 'SUCCESS') {
          this.logTransactionFailed(item);
          continue;
        } else if (item.checkCnt < 300) {
          pendingTransactions.push(item);
        } else {
          this.logTransactionFailed(item, true);
        }
      }
    }

    window.localStorage.setItem(window.defaultAccount, JSON.stringify(pendingTransactions));
  };

  logTransactionPending = item => {
    item.showPending = false;
    const { tx, intlObj } = item;
    if (intlObj?.title && intlObj?.obj) {
      notification.open({
        key: tx,
        message: intlObj.title && intlObj.obj ? intl.get(intlObj.title, intlObj.obj) : '',
        description: this.getDescription(1, item, intl.get('trans_status.pending'))
      });
      this.saveTransactions(item);
    }
  };

  logTransactionConfirmed = item => {
    item.status = 2;
    const { tx, intlObj } = item;
    if (intlObj?.title || intlObj?.title4) {
      notification.open({
        key: tx,
        message: intl.get(intlObj && intlObj.title4 ? intlObj.title4 : intlObj.title, intlObj.obj),
        description: this.getDescription(2, item, intl.get('trans_status.confirmed'))
      });
      this.saveTransactions(item);
    }
    if (intlObj.needCallAgain && intlObj.needCallAgain === 'getVoteDetail') {
      this.rootStore.lend.getVoteDetail(intlObj.obj.token);
    }
  };

  logTransactionFailed = (item, needDelete = false) => {
    item.status = 3;
    const { tx, intlObj } = item;
    if (intlObj?.title || intlObj?.title3) {
      notification.open({
        key: tx,
        message: intl.get(intlObj && intlObj.title3 ? intlObj.title3 : intlObj.title, intlObj.obj),
        description: this.getDescription(3, item, intl.get('trans_status.failed')),
        duration: 30
      });
      this.saveTransactions(item, needDelete);
    }
  };

  saveTransactions = (record, needDelete) => {
    const { tx, status } = record;
    let data = window.localStorage.getItem(window.defaultAccount) || '[]';
    let dataArr = JSON.parse(data);
    let pos = 'true';
    dataArr.map((item, index) => {
      if (item.tx === tx) {
        pos = index;
      }
    });
    if (pos === 'true') {
      return;
    }
    dataArr[pos] = record;
    window.localStorage.setItem(window.defaultAccount, JSON.stringify(dataArr));
  };

  setVariablesInterval = () => {
    if (!this.interval) {
      this.interval = setInterval(async () => {
        try {
          this.checkPendingTransactions();
        } catch (err) {
          console.log('interval error:' + err);
        }
      }, 3000);
    }
  };

  setData = (obj = {}) => {
    const self = this;
    Object.keys(obj).map(key => {
      self[key] = obj[key];
    });
  };

  getNowTime = async () => {
    try {
      let { multyRealStart, multyStart, btcstStart } = this;
      const res = await getTimeNow();
      if (res.success) {
        const nowTime = res.time;
        this.setData({ nowTime });
        window.multyRealStart = multyRealStart;
        window.multyStart = multyStart;

        // btcst start
        if (nowTime < Config.startTime1) {
          btcstStart = false;
        } else if (nowTime >= Config.startTime1) {
          btcstStart = true;
        }
        this.setData({ btcstStart });
        window.btcstStart = btcstStart;
        if (btcstStart) return;
      }
      setTimeout(() => {
        this.getNowTime();
      }, 3000);
    } catch (error) {
      console.log('get time error', error);
      setTimeout(() => {
        this.getNowTime();
      }, 3000);
    }
  };

  getNewRentVisible = async () => {
    this.setData({ newRentVisible: false });
    if (Config.rentOnlyWhiteList) {
      if (!this.defaultAccount) return;
      const { success, data } = await getRentWhiteList(this.defaultAccount);
      if (success && data) this.setData({ newRentVisible: true });
    } else {
      this.setData({ newRentVisible: true });
    }
  };

  getCountTime = async () => {
    let { btcstStart } = this;
    if (btcstStart) return;
    if (this.nowTime === null) {
      await this.getNowTime();
    } else {
      this.setData({
        nowTime: this.nowTime + 1000
      });

      let { nowTime, multyRealStart, multyStart } = this;

      // btcst start
      if (nowTime < Config.startTime1) {
        btcstStart = false;
      } else if (nowTime >= Config.startTime1) {
        btcstStart = true;
      }
      this.setData({ btcstStart });
      window.btcstStart = btcstStart;
      window.multyRealStart = multyRealStart;
      window.multyStart = multyStart;
    }
    setTimeout(async () => {
      this.getCountTime();
    }, 1000);
  };

  initTronWeb = async (tronWeb, { isOKX = false } = {}) => {
    const walletTronWeb = tronWeb
      ? tronWeb
      : window?.playWrightTronWebParam
      ? new TronWeb(window?.playWrightTronWebParam)
      : getWalletTronWeb();
    if (
      process.env.REACT_APP_ENV === 'test' ||
      process.env.REACT_APP_ENV === 'qaTest' ||
      process.env.REACT_APP_ENV === 'nile'
    ) {
      walletTronWeb.setFullNode(Config.chain.fullHost);
      walletTronWeb.setSolidityNode(Config.chain.fullHost);
    }
    const { trongrid } = Config;
    if (trongrid && walletTronWeb.setHeader && walletTronWeb.fullNode.host === trongrid.host) {
      walletTronWeb.setHeader({ 'TRON-PRO-API-KEY': trongrid.key });
    }
    tronObj.walletTronWeb = this.walletTronWeb = walletTronWeb;
    window.defaultAccount = this.defaultAccount = this.walletTronWeb.defaultAddress.base58;

    if (window?.playWrightTronWebParam || window?.okxwallet?.tronLink?.ready) {
      this.emitter.emit('connect');
    }

    this.isConnected = true;
    window.gtag('event', 'loading', { 'event_category': 'connect', 'event_label': 'yes', 'value': 'yes' });
    this.isMainNetwork = await this.isMainnet();
    this.isRightChain = await this._isRightChain(isOKX);
    // console.log('chain result: ', this.isRightChain)
    this.setVariablesInterval();
  };

  closeConnect = () => {
    this.isConnected = false;
    this.initConnection = false;
    this.walletTronWeb = false;
    window.defaultAccount = this.defaultAccount = false;
    tronObj.walletTronWeb = null;
  };

  checkWalletConnect = async () => {
    // console.log(window.localStorage['wc@2:client:0.3//session']);
    if (
      !window.localStorage['wc@2:client:0.3//session'] ||
      window.localStorage['wc@2:client:0.3//session'] === '[]' ||
      this.walletTronWeb
    ) {
      const _this = this;
      const request = window.indexedDB.open('WALLET_CONNECT_V2_INDEXED_DB');
      request.onsuccess = async event => {
        const db = event.target.result;
        const cursorGetData = async (db, storeName) => {
          try {
            let store = db.transaction(storeName, 'readwrite').objectStore(storeName);
            let cursorRequest = store.openCursor();
            cursorRequest.onsuccess = async e => {
              let cursor = e.target.result;
              if (cursor) {
                if (cursor.key !== 'wc@2:client:0.3:session') {
                  cursor.continue();
                } else if (cursor.value !== '[]') {
                  await _this.rootStore.connect.init();
                  await _this.rootStore.connect.connect();
                }
              }
            };
          } catch (error) {
            window.indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB');
            return false;
          }
        };
        cursorGetData(db, 'keyvaluestorage');
      };
    } else {
      await this.rootStore.connect.init();
      await this.rootStore.connect.connect();
      return true;
    }
  };

  checkLedger = async () => {
    this.rootStore.ledger.listenLogEvent();
    if (window.localStorage.getItem('justlend:ledger')) {
      await this.rootStore.ledger.reconnect();
      return true;
    }
    return false;
  };

  connectWallet = async () => {
    this.setData({
      loginModalVisible: true,
      loginModalStep: 1
    });
  };

  changeMenuWidth = () => {
    this.setData({
      menuFlag: !this.menuFlag
    });
  };

  isMainnet = async () => {
    try {
      let res = await this.walletTronWeb.trx.getBlock(0);
      if (Config.chain.fullHost === 'https://api.trongrid.io' && res.blockID) {
        if (res.blockID === Config.blockId) return 1; // online & mainnet
        return 0; // online & not mainnet
      } else {
        return -1; // not online
      }
    } catch (e) {
      console.log('isMainnet: ', e);
    }
  };

  _isRightChain = async isOKX => {
    // console.log('isOKX: ', isOKX);
    try {
      if (this.tronLinkAdapter.readyState === 'Found' || window?.okxwallet?.tronLink?.ready) {
        let walletTronWeb = getWalletTronWeb();
        if (window?.okxwallet?.tronLink?.ready && isOKX) {
          walletTronWeb = getWalletTronWeb(window?.okxwallet?.tronLink.tronWeb);
          return 1;
        }
        const { trongrid } = Config;
        if (
          (process.env.REACT_APP_ENV === 'test' ||
            process.env.REACT_APP_ENV === 'qaTest' ||
            process.env.REACT_APP_ENV === 'nile') &&
          walletTronWeb &&
          walletTronWeb.fullNode.host === trongrid.host
        ) {
          return 0;
        } else if (
          process.env.REACT_APP_ENV !== 'test' &&
          process.env.REACT_APP_ENV !== 'qaTest' &&
          process.env.REACT_APP_ENV !== 'nile' &&
          walletTronWeb &&
          walletTronWeb.fullNode.host === 'https://api.nileex.io'
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
    try {
      if (this.tronLinkAdapter.readyState === 'Found') {
        const walletTronWeb = getWalletTronWeb();

        const { trongrid } = Config;
        if (
          (process.env.REACT_APP_ENV === 'test' ||
            process.env.REACT_APP_ENV === 'qaTest' ||
            process.env.REACT_APP_ENV === 'nile') &&
          walletTronWeb.fullNode.host === trongrid.host
        ) {
          try {
            await this.tronLinkAdapter.switchChain('0xcd8690dc');
          } catch (error) {
            this.setData({
              'switchChainName': 'Nile'
            });
          }
        } else if (
          process.env.REACT_APP_ENV !== 'test' &&
          process.env.REACT_APP_ENV !== 'qaTest' &&
          process.env.REACT_APP_ENV !== 'nile' &&
          walletTronWeb.fullNode.host === 'https://api.nileex.io'
        ) {
          try {
            await this.tronLinkAdapter.switchChain('0x2b6653dc');
          } catch (error) {
            this.setData({
              'switchChainName': 'Mainnet'
            });
          }
        }
      }
    } catch (e) {
      console.log('isMainnet: ', e);
    }
  };

  connectWalletV2 = async () => {
    this.setData({
      loginModalVisibleV2: true,
      loginModalStepV2: 1
    });
  };

  showNetworkErrorModal = () => {
    this.setData({
      networkErrorModalVisible: true
    });
  };
  closeNetworkErrorModal = () => {
    this.setData({
      networkErrorModalVisible: false
    });
  };

  async initWalletConnectionAndEvent() {
    this.initConnection = true;
    const adapter = (this.tronLinkAdapter = new TronLinkAdapter());
    this.listenTronLineEvent();
    const lastLoginInfo = window.localStorage.getItem('lastLoginInfo');
    let lastLoginWallet = '';
    let lastLoginTime = '';
    const infos = lastLoginInfo?.split('_');
    if (infos) {
      lastLoginWallet = infos[0];
      lastLoginTime = infos[1];
    }
    const adapterConnected = adapter.connected && (!lastLoginWallet || lastLoginWallet === 'tronlink');

    const okxConnected = window?.okxwallet?.tronLink?.ready && lastLoginWallet === 'okx';
    if (adapterConnected) {
      console.log('initWalletConnection, connected: ', adapter.connected);
      window.gtag('event', 'login', { 'event_category': 'PC_V1.5', 'event_label': 'login' });
      window.gtag('event', 'conwallet_connected', {
        'event_category': 'tronlink',
        'event_label': 'conwallet_connected'
      });
      await this.initTronWeb();
      this.emitter.emit('connect');
      return;
    } else if (okxConnected) {
      await this.initTronWeb(window.okxwallet.tronLink.tronWeb, { isOKX: true });
      this.emitter.emit('connect');
      this.okxConnected = true;
      return;
    }
    let connected = await this.checkWalletConnect();
    if (connected) {
      this.emitter.emit('connect');
      window.gtag('event', 'conwallet_connected', {
        'event_category': 'walletconnect',
        'event_label': 'conwallet_connected'
      });
      return;
    }
    connected = await this.checkLedger();
    if (connected) {
      this.emitter.emit('connect');
      window.gtag('event', 'conwallet_connected', { 'event_category': 'ledger', 'event_label': 'conwallet_connected' });
    }
    this.finishedWalletInit = true;
    this.emitter.emit('finishedWalletInit');
  }

  listenTronLineEvent() {
    const adapter = this.tronLinkAdapter;
    const onConnect = async () => {
      const lastLoginInfo = window.localStorage.getItem('lastLoginInfo');
      let lastLoginWallet = '';
      let lastLoginTime = '';
      const infos = lastLoginInfo?.split('_');
      if (infos) {
        lastLoginWallet = infos[0];
        lastLoginTime = infos[1];
      }
      const okxConnected = window?.okxwallet?.tronLink?.ready && lastLoginWallet === 'okx';
      if (okxConnected) return;
      if (this.isWalletConnected || this.isLedgerConnected) {
        window.location.reload();
        return;
      }
      window.localStorage.removeItem('justlend:ledger');
      window.localStorage.removeItem('wc@2:client:0.3//session');
      await this.initTronWeb();
      this.loginModalVisible = false;
      this.loginModalVisibleV2 = false;
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

  connectTronLink = async () => {
    try {
      if (!window?.playWrightTronWebParam) {
        const adapter = new TronLinkAdapter({
          openUrlWhenWalletNotFound: false,
          openTronLinkAppOnMobile: false,
          checkTimeout: 10 * 1000
        });
        await adapter.connect();
      }
      this.initTronWeb();
      this.loginModalVisible = false;
      this.loginModalVisibleV2 = false;
      window.localStorage.setItem('lastLoginInfo', 'tronlink_' + Date.now());
    } catch (e) {
      console.error('Connect Error: ', e);
      this.rootStore.network.setData({ loginModalStep: 1, loginModalStepV2: 1 });
      this.closeConnect();
      throw e;
    }
  };

  connectOKX = async () => {
    try {
      const provider = window.okxwallet;
      const result = await provider.tronLink.request({ method: 'tron_requestAccounts' });
      if (result?.code === 200) {
        console.log('okx connected: ', provider.tronLink);
        this.loginModalVisible = false;
        this.loginModalVisibleV2 = false;

        this.initTronWeb(provider.tronLink.tronWeb, { isOKX: true });
        this.okxConnected = true;
        window.localStorage.setItem('lastLoginInfo', 'okx_' + Date.now());
      }
    } catch (e) {
      console.error('okx Connect Error: ', e);
      this.rootStore.network.setData({ loginModalStep: 1, loginModalStepV2: 1 });
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
