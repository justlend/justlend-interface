import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal } from 'antd';
import '../../../assets/css/connect-modal.scss';
import LoadingImg from '../../../assets/images/connect/loading.png';

@inject('network')
@inject('lend')
@observer
class Loading extends React.Component {
  constructor(props) {
    super();
    this.state = {
      visible: true
    };
  }

  hideModal = () => {};

  render() {
    const { loginModalVisible } = this.props;
    const { routeName } = this.props.network;
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
            <span>{intl.get('wallet.no_wallet')} </span>
            <a href="https://chrome.google.com/webstore/detail/tronlink%EF%BC%88%E6%B3%A2%E5%AE%9D%E9%92%B1%E5%8C%85%EF%BC%89/ibnejdfjmmkpcnlpebklmnkoeoihofec">
              {intl.get('wallet.click_to_get')}
              <em></em>
            </a>
          </div>
        </div>
      </Modal>
    );
  }
}

export default Loading;
