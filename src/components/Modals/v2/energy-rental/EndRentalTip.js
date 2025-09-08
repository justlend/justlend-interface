import React from 'react';
import { Link } from 'react-router-dom';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Modal } from 'antd';
import EndRetalImg from '../../../../assets/images/v2/end-rental-tip-icon.png';
import EndRetalWhiteImg from '../../../../assets/images/v2/white-theme/end-rental-tip-icon.png';

@inject('lend')
@inject('network')
@inject('energyRental')
@observer
class EndRentalTip extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  componentDidMount = () => {
    // document.body.style.overflow = 'hidden';
  };

  componentWillUnmount() {
    // document.body.style.overflow = 'auto';
  }

  close = () => {
    this.props.energyRental.setData({ endRentalTipShow: false });
  };

  render() {
    const { theme } = this.props.lend;
    const { endRentalTipShow } = this.props.energyRental;
    const { lang } = this.state;

    return (
      <Modal
        visible={endRentalTipShow}
        title={intl.get('s7.confirm_to_end')}
        width={400}
        centered
        footer={null}
        className={'j-modal header-border j-end-rent-modal'}
        closable={false}
        // onCancel={() => hideTotalCollateralPop()}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <img
          className="collateral-limit-img end-rental-img"
          src={theme === 'white' ? EndRetalWhiteImg : EndRetalImg}
          alt=""
        />
        <div className={'collateral-limit' + (lang === 'zh-CN' ? ' tac' : '')}>{intl.getHTML('s7.tips1')}</div>
        <div className="end-rental-address">{this.props.endRentalInfo?.renter}</div>
        <div className="end-rental-btns">
          <button className="j-btn j-supply" onClick={() => this.close()}>
            {intl.get('stUSDT_btn_cancel')}
          </button>
          <button
            className="j-btn j-rent-renew"
            onClick={() => {
              this.close();
              this.props.endRetalFn();
            }}
          >
            {intl.get('s7.confirm_to_end')}
          </button>
        </div>
      </Modal>
    );
  }
}

export default EndRentalTip;
