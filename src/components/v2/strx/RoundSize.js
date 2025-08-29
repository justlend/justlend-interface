import React from 'react';
import { inject, observer } from 'mobx-react';
import { Modal } from 'antd';
import intl from 'react-intl-universal';
import '../../../assets/css/v2/modal.scss';
import TransCancelledIcon from '../../../assets/images/v2/fail.png';
import TransCancelledIcon1 from '../../../assets/images/v2/white-theme/fail.png';

@inject('network')
@inject('lend')
@inject('system')
@observer
class RoundSize extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {}

  close = () => {
    this.props.closeRoundSize();
  };

  render() {
    const { theme } = this.props.lend;

    return (
      <Modal
        title=""
        visible={this.props.visible}
        closable={true}
        icon={null}
        onCancel={() => this.props.setRoundModalVisible(false)}
        footer={null}
        width={400}
        centered
        className={`j-modal j-transaction-modal short ${theme}`}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="trans-title">{intl.get('strx.stake_round_size_note')}</div>
        <div className="trans-body center">
          <div className="trans-icon">
            <img src={theme === 'white' ? TransCancelledIcon1 : TransCancelledIcon} alt="" />
          </div>
          <div className="trans-tips">{intl.get('strx.stake_round_size_content')}</div>
          <div className="j-large-btn j-supply" onClick={() => this.props.setRoundModalVisible(false)}>
            {intl.get('strx.stake_round_size_btn')}
          </div>
        </div>
      </Modal>
    );
  }
}

export default RoundSize;
