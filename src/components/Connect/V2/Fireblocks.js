import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal } from 'antd';
import '../../../assets/css/connect-modal.scss';
import FireblocksImg from '../../../assets/images/connect/fireblocks.svg';

@inject('network')
@inject('lend')
@observer
class Fireblocks extends React.Component {
  constructor(props) {
    super();
    this.state = {
      visible: true
    };
  }

  hideModal = () => {
    this.props.network.setData({ wsModalVisible: false });
  };

  render() {
    const { visible } = this.state;
    const { wsURI, wsSRC } = this.props.network;
    const { routeName } = this.props.network;
    const { theme } = routeName === 'StUSDT' ? { theme: '' } : this.props.lend;

    return (
      <Modal
        title={intl.get('navi.wallet_linkbtn')}
        maskClosable={false}
        visible={visible}
        closable={true}
        onCancel={() => this.hideModal()}
        footer={null}
        centered
        className={`connect-modal-v2 fireblocks-modal-v2${theme === 'white' ? ' white' : ''}`}
      >
        <div className="connect-element fireblocks-ele-v2">
          <p>{intl.get('wallet.walletconnect')}</p>
          <div className="top-tip">
            {/* <img src={FireblocksImg} alt="" />
            <span>{intl.get('wallet.fireblocks')}</span> */}
          </div>
          <div className="fireblocks-code">
            <img src={wsSRC} alt="" />
          </div>
          <div className="bottom-tip">
            {intl.get('wallet.webpage')}
            <span
              title={wsURI}
              id="copyWS"
              onClick={e => {
                copyToClipboard(e, '', 'copyWS');
              }}
              className="hover"
            >
              {intl.get('wallet.clipboard')}
              <em></em>
            </span>
          </div>
        </div>
      </Modal>
    );
  }
}

export default Fireblocks;

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
  document.getElementsByClassName('fireblocks-ele-v2')[0].appendChild(div);
  const parent = document.getElementsByClassName('fireblocks-ele-v2')[0];
  setTimeout(() => parent.removeChild(div), 1000);
};
