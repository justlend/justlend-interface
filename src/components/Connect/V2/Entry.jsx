import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal, message } from 'antd';
import Config from '../../../config';
import '../../../assets/css/v2/connect-modal.scss';
import TronlinkImg from '../../../assets/images/connect/tronlink.svg';
import BinanceImg from '../../../assets/images/connect/binance.svg';
import OKXImg from '../../../assets/images/connect/okx.svg';
import WalletConnectImg from '../../../assets/images/connect/walletconnect.svg';
import LedgerImg from '../../../assets/images/connect/ledger.svg';
import TokenPocketImg from '../../../assets/images/connect/tokenpocket.svg';
import LoadingImg from '../../../assets/images/s11/loading.png';
import LoadingWhiteImg from '../../../assets/images/s11/white/loading.png';
import isMobile from 'ismobilejs';
import { checkShouldOpenTronLink, checkShouldOpenOkex, checkShouldOpenTokenPocket } from '../../../utils/deeplink';

@inject('network')
@inject('connect')
@inject('ledger')
@inject('lend')
@observer
class Entry extends React.Component {
  constructor(props) {
    super();
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      visible: true,
      loading: false,
      isConnectingLedger: false,
      isConnectingWallectConnect: false
    };
  }

  componentDidMount = () => {
    window.gtag('event', 'conwallet_popup', { 'event_category': 'conwallet', 'event_label': 'conwallet_popup' });
  };

  hideModal = () => {};

  loginWallet = async (e, type) => {
    this.props.network.setLoginModalStepV2(2);
    this.props.network.setConnectingWallet('tronlink');
    const checkResult = await checkShouldOpenTronLink();
    if (!checkResult) {
      try {
        await this.props.network.connectTronLink();
        await this.props.network.initWalletConnectionAndEvent();

        window.localStorage.setItem('tronlinkdisconnect', '');
        this.props.mountedActions && this.props.mountedActions();
      } catch (e) {
        this.props.unmountedActions && this.props.unmountedActions();
      }
    }
  };

  connectBinanceWallet = async () => {
    this.props.network.setLoginModalStepV2(2);
    this.props.network.setConnectingWallet('binance');
    if (window.isBinance) {
      try {
        await this.props.network.connectBinance();
        await this.props.network.initWalletConnectionAndEvent();

        window.localStorage.setItem('binancedisconnect', '');
        this.props.mountedActions && this.props.mountedActions();
      } catch (e) {
        this.props.unmountedActions && this.props.unmountedActions();
        console.log('Binance Wallet not found');
      }
    } else {
      console.log('Binance Wallet not found');
    }
  };

  connectOKXWallet = async () => {
    this.props.network.setLoginModalStepV2(2);
    this.props.network.setConnectingWallet('okx');
    checkShouldOpenOkex();
    if (window.okxwallet) {
      try {
        await this.props.network.connectOKX();
        await this.props.network.initWalletConnectionAndEvent();

        window.localStorage.setItem('okxdisconnect', '');
        this.props.mountedActions && this.props.mountedActions();
      } catch (e) {
        this.props.unmountedActions && this.props.unmountedActions();
        console.log('OKEX Wallet not found');
        // window.open('https://www.okx.com/', 'okx');
      }
    } else {
      console.log('OKEX Wallet not found');
      // window.open('https://www.okx.com/', 'okx');
    }
  };

  connectTokenPocketWallet = async () => {
    this.props.network.setLoginModalStepV2(2);
    this.props.network.setConnectingWallet('tokenpocket');
    checkShouldOpenTokenPocket();
    if (window.tokenpocket) {
      try {
        await this.props.network.connectTokenPocket();
        await this.props.network.initWalletConnectionAndEvent();

        window.localStorage.setItem('tokenpocketdisconnect', '');
        this.props.mountedActions && this.props.mountedActions();
      } catch (e) {
        this.props.unmountedActions && this.props.unmountedActions();
        console.log('TokenPocket Wallet not found');
        // window.open('https://www.tokenpocket.pro/', 'tokenpocket');
      }
    } else {
      console.log('TokenPocket Wallet not found');
      // window.open('https://www.tokenpocket.pro/', 'tokenpocket');
    }
  };

  loginWalletConnect = async () => {
    try {
      const { loading } = this.state;
      if (loading) {
        return;
      } else {
        this.setState({
          loading: true,
          isConnectingWallectConnect: true
        });
      }
      setTimeout(() => {
        this.setState({
          loading: false,
          isConnectingWallectConnect: false
        });
      }, 3000);

      await this.props.connect.init();
      await this.props.connect.connect(
        () => {
          this.props.network.setWalletType('walletconnect');
          window.localStorage.setItem('walletconnectdisconnect', '');
          this.props.mountedActions && this.props.mountedActions();
          this.setState({
            loading: false,
            isConnectingWallectConnect: false
          });
        },
        () => {
          this.props.unmountedActions && this.props.unmountedActions();
          this.setState({
            loading: false,
            isConnectingWallectConnect: false
          });
        }
      );
    } catch (error) {
      console.log('connect wc error: ', error);
      // const obj = error;
      // const infoBox = document.createElement('div');
      // infoBox.id = 'infoBox';

      // let content = '<h3>connect wc error</h3><ul>' + error;
      // for (let key in obj) {
      //   let value = Array.isArray(obj[key]) ? obj[key].join(', ') : obj[key];
      //   content += `<li><strong>${key}：</strong> ${value}</li>`;
      // }
      // // content += '</ul>';
      // content += '</ul>';
      // content += JSON.stringify(error);

      // infoBox.innerHTML = content;
      // document.body.appendChild(infoBox);
    }
  };

  loginLedger = async () => {
    const { loading } = this.state;
    if (loading) return;
    this.setState({
      loading: true,
      isConnectingLedger: true
    });

    setTimeout(() => {
      this.setState({
        loading: false,
        isConnectingLedger: false
      });
    }, 3000);

    await this.props.ledger.init();
    await this.props.ledger.connect(
      () => {
        this.props.network.setWalletType('ledger');
        this.props.network.setConnectedWallet('ledger');
        window.localStorage.setItem('ledgerdisconnect', '');
        this.props.mountedActions && this.props.mountedActions();
        window.localStorage.setItem('lastLoginInfo', 'ledger_' + Date.now());
      },
      () => {
        this.props.unmountedActions && this.props.unmountedActions();
        this.setState({
          loading: false,
          isConnectingLedger: false
        });
      }
    );
  };

  render() {
    const { loginModalVisible } = this.props;
    const { lang, loading, isConnectingLedger, isConnectingWallectConnect } = this.state;
    const { routeName } = this.props.network;
    const { theme } = routeName === 'StUSDT' ? { theme: '' } : this.props.lend;
    const mobile = isMobile(window.navigator).any;

    return (
      <Modal
        title={intl.get('navi.wallet_linkbtn')}
        maskClosable={false}
        visible={loginModalVisible}
        closable={true}
        onCancel={() => this.props.handleCancel()}
        footer={null}
        centered
        className={`connect-modal-v2 entry-modal-v2${theme === 'white' ? ' white' : ''}`}
      >
        <div className="connect-element-v2 entry-ele-v2">
          <div className="top-tip">
            {intl.get('wallet.use_justlend')}
            <a className="j-link" href={Config.userGuideUrl} target="userGuide">
              {intl.get('s11.user_guide')}
            </a>
          </div>
          <div className="entry-logos">
            <div
              className="entry-logo"
              onClick={e => {
                this.loginWallet(e, 1);
                window.gtag('event', 'conwallet_popup_clicktronlink', {
                  'event_category': 'conwallet',
                  'event_label': 'conwallet_popup_clicktronlink'
                });
              }}
            >
              <img src={TronlinkImg} alt="" className="link" />
              <span>TronLink</span>
            </div>
            <div
              className="entry-logo"
              onClick={e => {
                this.connectOKXWallet();
                window.gtag('event', 'conwallet_popup_clickokx', {
                  'event_category': 'conwallet',
                  'event_label': 'conwallet_popup_clickokx'
                });
              }}
            >
              <img src={OKXImg} alt="" className="link" />
              <span>OKX</span>
            </div>
            <div
              className="entry-logo"
              onClick={e => {
                this.connectTokenPocketWallet();
                window.gtag('event', 'conwallet_popup_clickTP', {
                  'event_category': 'conwallet',
                  'event_label': 'conwallet_popup_clickTP'
                });
              }}
            >
              <img src={TokenPocketImg} alt="" className="link" />
              <span>TokenPocket</span>
            </div>
            <div
              className={'entry-logo ' + (loading && isConnectingWallectConnect ? 'disabled' : '')}
              onClick={e => {
                this.loginWalletConnect();
                window.gtag('event', 'conwallet_popup_clickwalletconnect', {
                  'event_category': 'conwallet',
                  'event_label': 'conwallet_popup_clickwalletconnect'
                });
              }}
            >
              {loading && isConnectingWallectConnect ? (
                <img src={theme === 'white' ? LoadingWhiteImg : LoadingImg} alt="" className="is-loading" />
              ) : (
                <img src={WalletConnectImg} alt="" className="link" />
              )}
              <span>WalletConnect</span>
            </div>
            {mobile && (
              <div
                className="entry-logo"
                onClick={e => {
                  this.connectBinanceWallet();
                  window.gtag('event', 'conwallet_popup_clicktronlink', {
                    'event_category': 'conwallet',
                    'event_label': 'conwallet_popup_clicktronlink'
                  });
                }}
              >
                <img src={BinanceImg} alt="" className="link" />
                <span>Binance</span>
              </div>
            )}
            {!mobile && (
              <div
                className={'entry-logo ' + (loading && isConnectingLedger ? 'disabled' : '')}
                onClick={e => {
                  this.loginLedger();
                  window.gtag('event', 'conwallet_popup_clickledger', {
                    'event_category': 'conwallet',
                    'event_label': 'conwallet_popup_clickledger'
                  });
                }}
              >
                {loading && isConnectingLedger ? (
                  <img src={theme === 'white' ? LoadingWhiteImg : LoadingImg} alt="" className="is-loading" />
                ) : (
                  <img src={LedgerImg} alt="" />
                )}
                <span>Ledger</span>
              </div>
            )}
          </div>
          <div className={'bottom-tip' + (lang === 'en-US' ? ' en' : '')}>
            <span className="accept-tips">{intl.get('wallet.accept_tips')} </span>
            <div>
              <a className="j-link" href={`${Config.fileLink}JustLend_Terms_of_Use_en.pdf`} target="walletService">
                {intl.get('wallet.service')}
              </a>
              <a className="j-link" href={`${Config.fileLink}JustLend_Privacy_Policy_en.pdf`} target="walletPrivacy">
                {intl.get('wallet.privacy')}
              </a>
            </div>
          </div>
          <div className="bottom-doc">
            <div className="bd-title">{intl.get('s11.tips1')}</div>
            <div className="bd-links">
              <a className="jl-links" href={Config.readDocUrl} target="readDoc">
                {intl.get('s11.read_docs')}
              </a>
              <a className="jl-links" href={Config.contactUsUrl} target="contactUs">
                {intl.get('s11.contact_us')}
              </a>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default Entry;
