import React from 'react';
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
import ExceptionIcon from '../../../assets/images/liquidate/exception-icon.png';
import ExceptionWhiteIcon from '../../../assets/images/liquidate/white-theme/exception-icon.png';

const { Option } = Select;
@inject('lend')
@inject('system')
@inject('network')
@observer
class ExceptionModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      switchValue: !!window.localStorage.getItem('stableCoinsFirst'),
      getSelectValue: '',
      repaySelectValue: '',
      collateralTokenMap: {},
      borrowTokenMap: {},
      repayValue: '',
      errMsg: '',
      approving: false,
      hasApproved: false,
      maxRepayAmountLimit: '--'
    };
  }
  componentDidMount = () => {
    // this.listInit();
  };

  render() {
    const { mobile } = this.state;
    const { exceptionVisible, theme } = this.props.lend;

    return (
      <Modal
        title=""
        visible={exceptionVisible}
        closable={false}
        icon={null}
        onCancel={() => this.props.lend.setData({ exceptionVisible: false })}
        footer={null}
        width={mobile ? 'calc(100% - 40px)' : 400}
        centered
        className={`j-modal j-transaction-modal ${theme} short`}
        // getContainer={() => document.querySelector('.j-wrapper')}
      >
        <div className="trans-title">{intl.get('liquidate.liquidate_failed')}</div>
        <div className="trans-body center">
          <div className="trans-icon">
            <img src={theme === 'white' ? ExceptionWhiteIcon : ExceptionIcon} alt="" />
          </div>
          <div className="trans-tips">{intl.get('liquidate.liquidate_tip14')}</div>
          <button
            className="j-large-btn loading-close"
            onClick={() => {
              this.props.lend.setData({ exceptionVisible: false });
            }}
          >
            {intl.get('deposit.closed')}
          </button>
        </div>
      </Modal>
    );
  }
}

export default ExceptionModal;
