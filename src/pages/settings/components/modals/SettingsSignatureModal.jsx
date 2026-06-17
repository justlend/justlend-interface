import React from 'react';

import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Modal } from 'antd';
import { saveSignInfoToLocalStorage } from '../../utils/helper';

import '../../../../assets/css/settings-modal.scss';

@inject('lend')
@inject('system')
@inject('ledger')
@inject('connect')
@inject('network')
@inject('settings')
@observer
class SettingsSignatureModal extends React.Component {
  constructor() {
    super();
    this.state = {
      mobile: isMobile(window.navigator).any,
      isSigning: false,
      signError: ''
    };
  }

  close = () => {
    this.props.settings.setData({
      settingsSignatureModalVisible: false
    });
  };

  onClickSignNow = async () => {
    const {
      defaultAccount,
      isLedgerConnected,
      isWalletConnectConnected: isWalletConnected,
      walletType: connectedWallet,
      currentAppName
    } = this.props.network;
    const { isSigning } = this.state;

    if (isSigning) {
      return;
    }

    this.setState({
      isSigning: true,
      signError: ''
    });

    const signResult = isLedgerConnected
      ? await this.props.ledger.signMessage()
      : isWalletConnected
      ? await this.props.connect.signMessage()
      : await this.props.system.signMessage();

    if (signResult) {
      const code = await this.props.settings.setSettingsSignature(defaultAccount);

      if (code === 0 || code === 10) {
        saveSignInfoToLocalStorage(Date.now(), signResult, defaultAccount);

        this.close();
      } else {
        saveSignInfoToLocalStorage('', '', '');

        this.setState({
          isSigning: false,
          signError: intl.get('settings.bind_email_modal.server_error')
        });
      }
    } else if (connectedWallet === 'binance' || currentAppName === 'imToken Wallet') {
      saveSignInfoToLocalStorage('', '', '');

      this.setState({
        isSigning: false,
        signError: currentAppName === 'imToken Wallet' ? intl.get('not_support_im') : intl.get('not_support')
      });
    } else {
      saveSignInfoToLocalStorage('', '', '');

      this.setState({
        isSigning: false,
        signError: intl.get('settings.signature_modal.wallet_rejected')
      });
    }
  };

  render() {
    window.gtag('event', 'portfolio_setting_riskAlert_sign', {
      'event_category': 'portfolio',
      'event_label': 'portfolio_setting_riskAlert_sign'
    });
    const { mobile, isSigning, signError } = this.state;
    const { theme } = this.props.lend;
    const { currentAppName } = this.props.network;

    const { settingsSignatureModalVisible } = this.props.settings;

    return (
      <Modal
        title={intl.get('settings.signature_modal.modal_title')}
        visible={settingsSignatureModalVisible}
        maskClosable={false}
        closable={true}
        destroyOnClose={true}
        icon={null}
        onCancel={() => this.close()}
        footer={null}
        width={mobile ? 'calc(100% - 40px)' : 400}
        centered
        className={`j-modal header-border ${theme} settings-modal`}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="settings-modal-content settings-signature-modal-content">
          <div className="content-icon"></div>
          <div className="content-title">{intl.get('settings.signature_modal.please_sign_msg')}</div>

          {isSigning ? (
            <button className="action-btn sign-btn is-signing">
              {intl.get('settings.signature_modal.sign_in_your_wallet_msg')}
              <span className="siging-icon"></span>
            </button>
          ) : (
            <button
              className="action-btn sign-btn"
              onClick={() => {
                this.onClickSignNow();
              }}
              disabled={currentAppName === 'imToken Wallet'}
            >
              {intl.get('settings.signature_modal.sign_btn')}
            </button>
          )}

          {(signError || currentAppName === 'imToken Wallet') && (
            <div className="j-error-tip wallet-reject">
              <span className="j-error-img"></span>
              <div>{currentAppName === 'imToken Wallet' ? intl.get('not_support_im') : signError}</div>
            </div>
          )}
        </div>
      </Modal>
    );
  }
}

export default SettingsSignatureModal;
