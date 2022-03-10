import React from 'react';
import { observable } from 'mobx';
import { notification } from 'antd';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import Config from '../config';
import { tronscanTX } from '../utils/helper';
import Tip from '../components/Tip';
import { getTimeNow } from '../utils/backend';
import { getTrxBalance, getTransactionInfo, tronObj } from '../utils/blockchain';
export default class NetworkStore {
  @observable tronWeb = false;
  @observable defaultAccount = null;
  @observable isConnected = null;
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

  constructor(rootStore) {
    this.rootStore = rootStore;
  }

  getDescription = (type, item, text) => {
    // console.log('description type: ', type);
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
        <span>{tronscanTX(intl.get('view_on_tronscan'), tx)}</span>
        {type === 3 ? (
          <Tip tip={intl.getHTML('toast.faild_reason')} left>
            <span className={'trans-btn-tip ' + className}>{text}</span>
          </Tip>
        ) : (
          <span className={'trans-btn-tip ' + className}>{text}</span>
        )}
      </div>
    );
  };

  checkPendingTransactions = () => {
    let data = window.localStorage.getItem(window.defaultAccount) || '[]';
    const transactions = JSON.parse(data);

    transactions.map(item => {
      const { tx, status, showPending } = item;
      if (Number(status) === 1) {
        if (showPending) {
          this.logTransactionPending(item);
        }
        item.checkCnt++;
        getTransactionInfo(tx)
          .then(r => {
            if (r) {
              if (r && r.ret && r.ret[0].contractRet === 'SUCCESS') {
                this.logTransactionConfirmed(item);
              } else if (r && r.ret && r.ret[0].contractRet && r.ret[0].contractRet != 'SUCCESS') {
                this.logTransactionFailed(item);
              } else {
                if (item.checkCnt != undefined && item.checkCnt < 30) {
                  setTimeout(this.checkPendingTransactions, 3000);
                } else {
                  this.logTransactionFailed(item, true);
                }
              }
            }
          })
          .catch(ex => {
            // setTimeout(this.checkPendingTransactions, 5000);
            console.error(ex);
          });
      }
      return false;
    });
  };

  logTransactionPending = item => {
    item.showPending = false;
    const { tx, intlObj } = item;
    notification.open({
      key: tx,
      message: intl.get(intlObj.title, intlObj.obj),
      description: this.getDescription(1, item, intl.get('trans_status.pending'))
    });
    this.saveTransactions(item);
  };

  logTransactionConfirmed = item => {
    item.status = 2;
    const { tx, intlObj } = item;
    notification.open({
      key: tx,
      message: intl.get(intlObj && intlObj.title4 ? intlObj.title4 : intlObj.title, intlObj.obj),
      description: this.getDescription(2, item, intl.get('trans_status.confirmed'))
    });
    this.saveTransactions(item);
    if (intlObj.needCallAgain && intlObj.needCallAgain === 'getVoteDetail') {
      this.rootStore.lend.getVoteDetail(intlObj.obj.token);
    }

  };

  logTransactionFailed = (item, needDelete = false) => {
    item.status = 3;
    const { tx, intlObj } = item;
    notification.open({
      key: tx,
      message: intl.get(intlObj && intlObj.title3 ? intlObj.title3 : intlObj.title, intlObj.obj),
      description: this.getDescription(3, item, intl.get('trans_status.failed')),
      duration: 30
    });
    this.saveTransactions(item, needDelete);

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

  getCountTime = async () => {
    if (this.btcstStart) {
      return;
    }
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

  checkLogin = () => {
    if (!this.tronWeb || !this.tronWeb.defaultAddress.base58) {
      return false;
    }
    if (!this.defaultAccount) {
      return false;
    }
    return true;
  };

  initTronWeb = (tronWeb, cb) => {
    if (process.env.REACT_APP_ENV === 'test' || process.env.REACT_APP_ENV === 'qaTest') {
      tronWeb.setFullNode(Config.chain.fullHost);
      tronWeb.setSolidityNode(Config.chain.fullHost);
    }
    const { trongrid } = Config;
    const self = this;
    if (trongrid && tronWeb.setHeader && tronWeb.fullNode.host === trongrid.host) {
      tronWeb.setHeader({ 'TRON-PRO-API-KEY': trongrid.key });
    }
    tronObj.tronWeb = this.tronWeb = tronWeb;
    this.defaultAccount = this.tronWeb.defaultAddress.base58;
    window.defaultAccount = this.defaultAccount;
    this.isConnected = true;
    cb && cb();
    this.setVariablesInterval();
  };

  closeConnect = () => {
    this.tronWeb = false;
    window.defaultAccount = this.defaultAccount = false;
  };

  handleTronWallet = async (tron, cb, pop, cbn = false) => {
    if (!tron) {
      this.closeConnect();
      cbn && cbn();
      console.log('no wallet installed');
      return;
    }
    if (tron && tron.defaultAddress && tron.defaultAddress.base58) {
      this.initTronWeb(tron, cb);
      // cb && cb();
      return;
    }
    const tronLink = tron;
    if (tronLink.ready) {
      // Access the decentralized web!
      const tronWeb = tronLink.tronWeb;
      tronWeb && this.initTronWeb(tronWeb, cb);
      this.loginModalVisible = false;
    } else {
      if (pop) {
        const res = await tronLink.request({ method: 'tron_requestAccounts' });
        // console.log(res);
        if (res.code === 200) {
          const tronWeb = tronLink.tronWeb;
          tronWeb && this.initTronWeb(tronWeb, cb);
          this.loginModalVisible = false;
          return;
        }
        this.rootStore.network.setData({ loginModalStep: 1 });
        this.closeConnect();
        console.log('Please install TronLink-Extension!');
      }
    }
  };

  initTronLinkWallet = (cb = false, cbn = false, pop = true) => {
    try {
      const self = this;

      const tronlinkPromise = new Promise(reslove => {
        if (window.tronLink) {
          window.tronLink.gg = 'gg';
          return reslove(window.tronLink);
        } else {
          window.addEventListener(
            'tronLink#initialized',
            async () => {
              return reslove(window.tronLink || tronObj.tronWeb);
            },
            {
              once: true
            }
          );

          setTimeout(() => {
            if (window.tronLink) {
              return reslove(window.tronLink);
            }
          }, 3000);
        }
      });

      const appPromise = new Promise(resolve => {
        let timeCount = 0;
        // const self = this;
        const tmpTimer1 = setInterval(() => {
          timeCount++;
          if (timeCount > 8) {
            // self.isConnected = false;
            cbn && cbn();
            clearInterval(tmpTimer1);
            return resolve(false);
          }
          if (window.tronLink) {
            clearInterval(tmpTimer1);
            if (window.tronLink.ready) {
              return resolve(window.tronLink);
            }
          } else if (window.tronWeb && window.tronWeb.defaultAddress && window.tronWeb.defaultAddress.base58) {
            clearInterval(tmpTimer1);
            return resolve(window.tronWeb);
          }
        }, 1000);
      });

      Promise.race([tronlinkPromise, appPromise]).then(tron => {
        // console.log(tron);
        self.handleTronWallet(tron, cb, pop, cbn);
      });
    } catch (e) {
      console.log(e);
    }
  };

  connectWallet = async () => {
    this.setData({
      loginModalVisible: true,
      loginModalStep: 1
    });
  };

  listenTronLink = () => {
    window.addEventListener('message', res => {
      if (res.data.message && res.data.message.action == 'accountsChanged') {
        return window.location.reload();
      }
      if (res.data.message && res.data.message.action == 'setAccount') {
        if (window.tronWeb && !window.tronLink && res.data.message.data.address !== this.defaultAccount) {
          return window.location.reload();
        }
      }
      if (res.data.message && res.data.message.action == 'setNode') {
        window.location.reload();
        return;
      }
      // disconnectWebsite
      if (res.data.message && res.data.message.action == 'disconnectWeb') {
        console.log(res.data, res.data.message, 'tronlink message');

        window.location.reload();
        return;
      }
      // connectWebsite
      if (res.data.message && res.data.message.action == 'connectWeb') {
        console.log(res.data, res.data.message, 'tronlink message');

        window.location.reload();
      }
    });
  };

  changeMenuWidth = () => {
    this.setData({
      menuFlag: !this.menuFlag
    });
  };
}
