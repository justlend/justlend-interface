import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Modal } from 'antd';
import Config from '../../../config';
import '../../../assets/css/connect-modal.scss';
import LoadingImg from '../../../assets/images/connect/loading.png';

@inject('network')
@inject('lend')
@observer
class Loading extends React.Component {
  constructor(props) {
    super();
    this.state = {
      visible: true,
      mobile: isMobile(window.navigator).any,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  hideModal = () => {};

  render() {
    const { lang, mobile } = this.state;
    const { loginModalVisible } = this.props;
    const { routeName, connectingWallet } = this.props.network;
    const { theme } = routeName === 'StUSDT' ? { theme: '' } : this.props.lend;

    return (
      <Modal
        title={intl.get('navi.wallet_linkbtn')}
        maskClosable={false}
        visible={true}
        closable={true}
        onCancel={() => this.props.handleCancel()}
        footer={null}
        centered
        className={`connect-modal-v2 loading-modal-v2${theme === 'white' ? ' white' : ''}`}
      >
        <div className="connect-element-v2">
          <img src={LoadingImg} alt="" className="loading" />
          <p className="title">{intl.get('account_modal.connecting')}</p>
          <p className="desc">{intl.get('account_modal.confirm')}</p>
          <div className="tips">
            <span>{intl.get('s11.connect_trouble')} </span>
            {!(mobile && lang === 'en-US') && (
              <a target="helpDocument" href={Config.userGuideUrl}>
                {intl.get('s11.help_doc')}
                <em></em>
              </a>
            )}
          </div>
          <div className="tips tips1">
            <span>
              {connectingWallet === 'tronlink'
                ? intl.get('wallet.no_wallet')
                : connectingWallet === 'okx'
                ? intl.getHTML('s11.no_wallet', { token: 'OKX' })
                : connectingWallet === 'tokenpocket'
                ? intl.getHTML('s11.no_wallet', { token: 'TokenPocket' })
                : connectingWallet === 'binance'
                ? intl.getHTML('s11.no_wallet', { token: 'Binance' })
                : ''}{' '}
            </span>

            <a
              target="clickToGet"
              href={
                connectingWallet === 'tronlink'
                  ? Config.tronlinkWalletUrl
                  : connectingWallet === 'okx'
                  ? Config.okxWalletUrl
                  : connectingWallet === 'binance'
                  ? Config.binanceWalletUrl
                  : connectingWallet === 'tokenpocket' && Config.tokenPocketWalletUrl
              }
            >
              {connectingWallet === 'tronlink'
                ? intl.get('wallet.click_to_get')
                : connectingWallet === 'okx'
                ? intl.get('wallet.click_to_get_okx')
                : connectingWallet === 'tokenpocket'
                ? intl.get('wallet.click_to_get_wallet', { token: 'TokenPocket' })
                : connectingWallet === 'binance'
                ? intl.get('wallet.click_to_get_wallet', { token: 'Binance' })
                : ''}
              <em></em>
            </a>
          </div>
          {mobile && lang === 'en-US' && (
            <div className="tips tips2">
              <a className="" target="helpDocument" href={Config.userGuideUrl}>
                {intl.get('s11.help_doc')}
                <em></em>
              </a>
            </div>
          )}
        </div>
      </Modal>
    );
  }
}

export default Loading;
