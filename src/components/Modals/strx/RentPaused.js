import React from 'react';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import { tronscanTX } from '../../../utils/helper';
import { Modal, Tabs, Input, Button, Progress, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import '../../../assets/css/v2/modal.scss';
import '../../../assets/css/v2/strx-modal.scss';
import TransCancelledIcon from '../../../assets/images/v2/fail.png';
import TransCancelledIcon1 from '../../../assets/images/v2/white-theme/fail.png';
import { BigNumber, formatNumber, renderPercent } from '../../../utils/helper';
import Config from '../../../config';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@inject('strx')
@observer
class RentPaused extends React.Component {
  constructor() {
    super();
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      approving: false
    };
  }

  componentDidMount() {}

  close = () => {
    this.props.strx.setData({ rentPausedVisible: false });
  };

  render() {
    const { theme } = this.props.lend;
    const { rentPausedVisible } = this.props.strx;

    return (
      <Modal
        title={intl.get('collateral_tip_title')}
        visible={rentPausedVisible}
        closable={false}
        icon={null}
        // onCancel={() => this.close()}
        footer={null}
        width={400}
        centered
        className={`j-modal j-rent-paused-modal  header-border ${theme} `}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="rent-paused">
          <img className="rp-icon" src={theme === 'white' ? TransCancelledIcon1 : TransCancelledIcon} alt="" />
          <div className="rp-des">{intl.getHTML('strx.energy_under_upgrading')}</div>
          <button className="j-large-btn j-supply rent-now" onClick={() => this.close()}>
            {intl.get('got_it')}
          </button>
        </div>
      </Modal>
    );
  }
}

export default RentPaused;
