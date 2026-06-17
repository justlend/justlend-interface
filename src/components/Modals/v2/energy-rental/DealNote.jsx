import React from 'react';
import { Link } from 'react-router-dom';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Modal, Checkbox } from 'antd';
import DealNoteImg from '../../../../assets/images/v2/deal-note-icon.png';

@inject('lend')
@inject('network')
@inject('energyRental')
@observer
class DealNote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  componentDidMount = () => {};

  componentWillUnmount() {
    // document.body.style.overflow = 'auto';
  }

  close = () => {
    this.props.energyRental.setData({ dealNoteShow: false, addOrderModalVisible: false });
  };

  onCheckAllChange = dealNoteCheckValue => {
    this.props.energyRental.setData({ dealNoteCheckValue });
  };

  render() {
    const { theme } = this.props.lend;
    const { dealNoteShow, dealNoteCheckValue } = this.props.energyRental;
    const { lang } = this.state;

    return (
      <Modal
        visible={dealNoteShow}
        title={intl.get('s7.note1')}
        width={400}
        centered
        footer={null}
        className={'j-modal header-border j-deal-note-modal'}
        closable={false}
        // onCancel={() => hideTotalCollateralPop()}
        getContainer={() => document.querySelector('.j-deal-note-modal-appender')}
      >
        <img className="collateral-limit-img deal-note-img" src={DealNoteImg} alt="" />
        <div className={'collateral-limit collateral-limit-note' + (lang === 'zh-CN' ? ' tac' : '')}>
          {intl.get('s7.note')}
        </div>
        <div className="deal-note-desc">
          <div className="note-row">{intl.get('s7.note_desc1')}</div>
          <div className="note-row">{intl.get('s7.note_desc2')}</div>
          <div className="note-row">{intl.get('s7.note_desc3')}</div>
        </div>
        <div className="limit-thirty-days">
          <Checkbox
            className="j-deal-note-check j-checkbox"
            onChange={e => this.onCheckAllChange(e.target.checked)}
            checked={dealNoteCheckValue}
          >
            {intl.get('s7.not_show_one_month')}
          </Checkbox>
        </div>
        <div className="end-rental-btns">
          <button className="j-btn j-supply" onClick={() => this.close()}>
            {intl.get('stUSDT_btn_cancel')}
          </button>
          <button
            className="j-btn j-rent-renew"
            onClick={async () => {
              if (dealNoteCheckValue) {
                window.localStorage.setItem('dealNoteTimeString', new Date().getTime());
              } else {
                window.localStorage.setItem('dealNoteTimeString', '');
              }
              // await this.props.callback();
              this.props.energyRental.setData({ dealNoteShow: false });
            }}
          >
            {intl.get('s7.continue')}
          </button>
        </div>
      </Modal>
    );
  }
}

export default DealNote;
