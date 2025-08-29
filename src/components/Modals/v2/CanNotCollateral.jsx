import React from 'react';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Modal } from 'antd';
import Config from '../../../config';
import TransCancelledIcon from '../../../assets/images/v2/fail.png';
import TransCancelledIcon1 from '../../../assets/images/v2/white-theme/fail.png';

@inject('lend')
@observer
class CanNotCollateral extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  render() {
    const { openCollateralShow, theme } = this.props.lend;
    const { lang } = this.state;

    return (
      <Modal
        visible={openCollateralShow}
        title={intl.get('collateral_tip_title')}
        width={400}
        centered
        footer={null}
        className={'j-modal header-border collateral-limit-modal'}
        onCancel={() => this.props.lend.setOpenCollateralShow(false)}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <img
          className="collateral-limit-img"
          src={theme === 'white' ? TransCancelledIcon1 : TransCancelledIcon}
          alt=""
        />
        <div className={'collateral-limit' + (lang === 'zh-CN' ? ' tac' : '')}>{intl.getHTML('v2.tip33')}</div>
        <button className="j-large-btn j-supply" onClick={() => this.props.lend.setOpenCollateralShow(false)}>
          {intl.get('collateral_ok')}
        </button>
      </Modal>
    );
  }
}

export default CanNotCollateral;
