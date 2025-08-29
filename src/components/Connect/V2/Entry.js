import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal } from 'antd';
import Config from '../../../config';
import '../../../assets/css/v2/connect-modal.scss';
import TronlinkImg from '../../../assets/images/connect/tronlink.svg';
import OKXImg from '../../../assets/images/connect/okx.svg';
import WalletConnectImg from '../../../assets/images/connect/walletconnect.svg';
import LedgerImg from '../../../assets/images/connect/ledger.svg';
import LoadingImg from '../../../assets/images/connect/loading.png';
import isMobile from 'ismobilejs';
import { checkShouldOpenTronLink } from '../../../utils/deeplink';

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
    this.props.network.setData({ loginModalStepV2: 2 });
    checkShouldOpenTronLink();
    try {
      await this.props.network.connectTronLink();
      this.props.mountedActions && this.props.mountedActions();
    } catch (e) {
      this.props.unmountedActions && this.props.unmountedActions();
    }
  };

  connectOKXWallet = async () => {
    if (window.okxwallet) {
      this.props.network.setData({ loginModalStepV2: 2 });
      try {
        await this.props.network.connectOKX();
        this.props.mountedActions && this.props.mountedActions();
      } catch (e) {
        this.props.unmountedActions && this.props.unmountedActions();
      }
    } else {
      console.log('OKEX Wallet not found');
      window.open('https://www.okx.com/', 'okx');
    }
  };

  loginWalletConnect = async () => {
    const { loading } = this.state;
    if (loading) {
      return;
    } else {
      this.setState({
        loading: true,
        isConnectingWallectConnect: true
      });
    }
    await this.props.connect.init();
    await this.props.connect.connect(
      () => {
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
  };

  loginLedger = async () => {
    const { loading } = this.state;
    if (loading) return;
    this.setState({
      loading: true,
      isConnectingLedger: true
    });
    await this.props.ledger.init();
    await this.props.ledger.connect(
      () => {
        this.props.mountedActions && this.props.mountedActions();
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
          <div className="top-tip">{intl.get('wallet.use_justlend')}</div>
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
                window.gtag('event', 'conwallet_popup_clicktronlink', {
                  'event_category': 'conwallet',
                  'event_label': 'conwallet_popup_clicktronlink'
                });
              }}
            >
              <img src={OKXImg} alt="" className="link" />
              <span>OKX</span>
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
              <img src={WalletConnectImg} alt="" className="link" />
              <span>WalletConnect</span>
              {loading && isConnectingWallectConnect ? <img src={LoadingImg} alt="" className="loading" /> : null}
            </div>
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
                <img src={LedgerImg} alt="" />
                <span>Ledger</span>
                {loading && isConnectingLedger ? <img src={LoadingImg} alt="" className="loading" /> : null}
              </div>
            )}
          </div>
          <div className="bottom-tip">
            <span>{intl.get('wallet.accept_tips')} </span>
            <a className="hover" href={`${Config.fileLink}JustLend_Terms_of_Use_en.pdf`} target="walletService">
              {intl.get('wallet.service')}
              <em></em>
            </a>
            <a className="hover" href={`${Config.fileLink}JustLend_Privacy_Policy_en.pdf`} target="walletPrivacy">
              {intl.get('wallet.privacy')}
              <em></em>
            </a>
          </div>
        </div>
      </Modal>
    );
  }
}

export default Entry;
