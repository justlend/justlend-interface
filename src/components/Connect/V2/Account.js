import React from 'react';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal, Tooltip } from 'antd';
import '../../../assets/css/connect-modal.scss';
import WalletConnectImg from '../../../assets/images/connect/walletconnect.svg';
import TronlinkImg from '../../../assets/images/connect/tronlink.svg';
import OKXImg from '../../../assets/images/connect/okx.svg';
import LedgerImg from '../../../assets/images/connect/ledger.svg';
import BetaNewIcon from '../../../assets/images/v2/beta-new-icon.png';
import BetaNewWhiteIcon from '../../../assets/images/v2/white-theme/beta-new-icon.png';
import IMIcon from '../../../assets/images/header/im_Symble_Rounded.svg';

@inject('network')
@inject('connect')
@inject('ledger')
@inject('lend')
@observer
class Account extends React.Component {
  constructor(props) {
    super();
    this.state = {
      visible: true,
      tooltipVisible: false,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      betaMap: {
        '1': 'rent',
        '2': 'liquidate',
        '3': 'settings'
      }
    };
  }

  componentDidMount = () => {
    const { showAccountBeta, applicationMap } = this.props.lend;
    const showAccountBetaFlag = showAccountBeta && applicationMap?.canApply;
    if (showAccountBetaFlag) {
      window.gtag('event', 'betatest_address_popup', {
        'event_category': 'betatest',
        'event_label': 'betatest_address_popup'
      });
    }
  };

  disconnectWalletConnect = async () => {
    await this.props.connect.disconnect();
    this.props.handleCancelAccount();
    window.location.reload();
  };

  disconnectLedger = async () => {
    await this.props.ledger.disconnect();
    this.props.handleCancelAccount();
    window.location.reload();
  };

  onMouseEnter = () => {
    this.setState({
      tooltipVisible: true
    });
  };

  onMouseLeave = () => {
    this.setState({
      tooltipVisible: false
    });
  };

  betaListender = () => {
    const { betaMap } = this.state;
    const { theme, betaModalVisible, betaInfo, applicationMap } = this.props.lend;

    return betaInfo?.map((item, index) => {
      return [1, 2].includes(item.status)
        ? applicationMap[betaMap[item.type]]?.switchOn && applicationMap[betaMap[item.type]]?.phase === 1 && (
            <div key={index}>
              <div className="flex aic">
                <span className="bl-main">
                  {item.type === 1
                    ? intl.get('beta.rental')
                    : item.type === 2
                    ? intl.get('beta.liquidate')
                    : intl.get('settings.application_beta_title')}
                </span>
                {item.status === 1 && (
                  <img className="bl-img" src={theme === 'white' ? BetaNewWhiteIcon : BetaNewIcon} />
                )}
              </div>
              {item.type === 1 ? (
                <Link
                  className="jl-links"
                  to="/energyRental"
                  onClick={() => {
                    window.gtag('event', 'betatest_address_popup_explore', {
                      'event_category': 'betatest',
                      'event_label': 'betatest_address_popup_explore'
                    });
                    this.props.handleCancelAccount();
                  }}
                >
                  {intl.get('beta.forward')}
                </Link>
              ) : item.type === 2 ? (
                <Link
                  className="jl-links"
                  to="/liquidate"
                  onClick={() => {
                    window.gtag('event', 'betatest_address_popup_explore', {
                      'event_category': 'betatest',
                      'event_label': 'betatest_address_popup_explore'
                    });
                    this.props.handleCancelAccount();
                  }}
                >
                  {intl.get('beta.forward')}
                </Link>
              ) : (
                <Link
                  className="jl-links"
                  to="/settings"
                  onClick={() => {
                    window.gtag('event', 'betatest_address_popup_explore', {
                      'event_category': 'betatest',
                      'event_label': 'betatest_address_popup_explore'
                    });
                    this.props.handleCancelAccount();
                  }}
                >
                  {intl.get('beta.forward')}
                </Link>
              )}
            </div>
          )
        : null;
    });
  };

  exploreFirst = () => {
    this.props.lend.setData({ applocationTipShow: true, pre: '' });
    this.props.handleCancelAccount();
  };

  render() {
    const { accountModal } = this.props;
    const { tooltipVisible, lang, betaMap } = this.state;
    const { routeName, browserType } = this.props.network;
    const { defaultAccount, isWalletConnected, isLedgerConnected, okxConnected } = this.props.network;
    const { theme } = routeName === 'StUSDT' ? { theme: '' } : this.props.lend;
    const { showAccountBeta, applicationMap, totalRCLength, betaInfo } = this.props.lend;
    const showAccountBetaFlag = applicationMap?.canApply ? showAccountBeta : false;
    const isWhite = theme === 'white';

    const RCItems = betaInfo?.filter(
      item =>
        [1, 2].includes(item.status) &&
        applicationMap[betaMap[item.type]]?.switchOn &&
        applicationMap[betaMap[item.type]]?.phase === 1
    );

    const currentRCLength = RCItems?.length;

    return (
      <Modal
        title={intl.get('navi.wallet_linkbtn')}
        maskClosable={false}
        visible={true}
        closable={true}
        onCancel={() => this.props.handleCancelAccount()}
        footer={null}
        centered
        className={`connect-modal-v2 account-modal-v2${theme === 'white' ? ' white' : ''}`}
      >
        <div className="connect-element-v2">
          <img
            src={
              okxConnected
                ? OKXImg
                : isWalletConnected
                ? WalletConnectImg
                : isLedgerConnected
                ? LedgerImg
                : browserType === 1
                ? TronlinkImg
                : IMIcon
            }
            alt=""
          />
          <p className="desc">
            {intl.get('account_modal.connect_wallet', {
              value: okxConnected
                ? 'OKX'
                : isWalletConnected
                ? 'WalletConnect'
                : isLedgerConnected
                ? 'Ledger'
                : 'TronLink'
            })}
          </p>

          <div
            // className={'account-info-v2' + (showAccountBetaFlag ? ' beta-info' : '')}
            className={'account-info-v2'}
            onMouseEnter={this.onMouseEnter}
            onMouseLeave={this.onMouseLeave}
          >
            <span className="flex aic jcc">
              {defaultAccount}{' '}
              <em
                className={'j-icons copy'}
                onClick={e => {
                  copyToClipboard(e, '', 'copyAccount');
                }}
                title={defaultAccount}
                id="copyAccount"
              ></em>
            </span>
          </div>

          {isWalletConnected ? (
            <div className="disconnect" onClick={this.disconnectWalletConnect}>
              <span>
                {intl.get('account_modal.disconnect')}
                <em></em>
              </span>
            </div>
          ) : null}
          {isLedgerConnected && (
            <div className="disconnect" onClick={this.disconnectLedger}>
              <span>
                {intl.get('account_modal.disconnect')}
                <em></em>
              </span>
            </div>
          )}
        </div>
      </Modal>
    );
  }
}

export default Account;

export const copyToClipboard = (e, disBottom = '5px', p = false) => {
  let value = '';
  if (p) {
    value = document.getElementById(p).title;
  } else {
    value = e.target.title;
  }
  value = value.replace(/,/g, '');

  var aux = document.createElement('input');
  aux.setAttribute('value', value.valueOf());

  document.body.appendChild(aux);
  aux.select();
  document.execCommand('copy');
  document.body.removeChild(aux);
  const div = document.createElement('div');
  const content = '<em></em>' + intl.get('account_modal.copied');
  div.innerHTML = content;
  div.className = 'copied-v2';
  document.getElementsByClassName('account-modal-v2')[0].appendChild(div);
  const parent = document.getElementsByClassName('account-modal-v2')[0];
  setTimeout(() => parent.removeChild(div), 2000);
};
