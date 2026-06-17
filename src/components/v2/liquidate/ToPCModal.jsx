import React from 'react';
import { Link } from 'react-router-dom';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Modal, Select, Tooltip, Input } from 'antd';
import { TooltipText } from '../strx/TooltipText';
import ToggleSwitch from '../../Widget/ToggleSwitch';
import Config from '../../../config';
import {
  formatNumber,
  BigNumber,
  emptyReactNodeNew,
  getJTokenLogo,
  getLiquidLogo,
  numberParser,
  toBigNumberNew
} from '../../../utils/helper';
import { tokenBalanceOf } from '../../../utils/blockchain';
import '../../../assets/css/v2/liquidate-modal.scss';
import ExceptionIcon from '../../../assets/images/liquidate/recomend-to-pc.png';
import ExceptionWhiteIcon from '../../../assets/images/liquidate/white-theme/recomend-to-pc.png';

const { Option } = Select;
@inject('lend')
@inject('system')
@inject('network')
@observer
class ToPCModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      visible: true
    };
  }
  componentDidMount = () => {
    // this.listInit();
  };

  render() {
    const { mobile, lang } = this.state;
    const { theme } = this.props.lend;
    const { routeName } = this.props.network;

    return (
      <Modal
        title=""
        visible={this.props.visible}
        closable={true}
        icon={null}
        onCancel={() => this.props.close()}
        footer={null}
        width={mobile ? 'calc(100% - 40px)' : 400}
        centered
        className={`j-modal j-transaction-modal topc-modal ${theme} short`}
        getContainer={() => document.querySelector('.j-wrapper') || document.querySelector('.jlv2-bg')}
      >
        <div className="trans-title">{intl.get('liquidate.risk.tip4')}</div>
        <div className="trans-body center">
          <div className="trans-icon">
            <img className="icon-80-80" src={theme === 'white' ? ExceptionWhiteIcon : ExceptionIcon} alt="" />
          </div>
          <div className="trans-tips">{intl.get('liquidate.risk.tip3')}</div>
          {/* <button
            className="j-large-btn loading-close"
            onClick={() => {
              this.setState({ visible: false });
            }}
          >
            {intl.get('liquidate.risk.continue')}
          </button> */}

          <Link to="/liquidate" className="j-large-btn loading-close block">
            <span>{intl.get('liquidate.liquidate_liquidation_list')}</span>
          </Link>
        </div>
      </Modal>
    );
  }
}

export default ToPCModal;
