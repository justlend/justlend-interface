import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal } from 'antd';
import '../../../assets/css/connect-modal.scss';
import FailureImg from '../../../assets/images/connect/failure.svg';

@inject('network')
@inject('connect')
@inject('lend')
@observer
class Failure extends React.Component {
  constructor(props) {
    super();
    this.state = {
      visible: true
    };
  }

  hideModal = () => {
    this.props.network.setData({ wsFailureModal: false });
  };

  loginWalletConnect = async () => {
    await this.props.connect.init();
    await this.props.connect.connect(
      () => {
        this.props.mountedActions && this.props.mountedActions();
      },
      () => {
        this.props.unmountedActions && this.props.unmountedActions();
      }
    );
  };

  render() {
    const { wsFailureModal } = this.props.network;
    const { routeName } = this.props.network;
    const { theme } = routeName === 'StUSDT' ? { theme: '' } : this.props.lend;

    return (
      <Modal
        title={intl.get('navi.wallet_linkbtn')}
        maskClosable={false}
        visible={true}
        closable={true}
        onCancel={() => this.hideModal()}
        footer={null}
        centered
        className={`connect-modal-v2 failure-modal-v2${theme === 'white' ? ' white' : ''}`}
      >
        <div className="connect-element">
          <img src={FailureImg} alt="" />
          <p className="title">{intl.get('wallet.declined')}</p>
          <p className="desc">{intl.get('wallet.declined_desc')}</p>
          <div
            className="reconnect"
            onClick={e => {
              this.loginWalletConnect();
            }}
          >
            {intl.get('wallet.reconnect')}
          </div>
        </div>
      </Modal>
    );
  }
}

export default Failure;
