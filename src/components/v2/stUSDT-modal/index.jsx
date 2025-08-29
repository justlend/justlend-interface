import React from 'react';
import { Modal } from 'antd';
import './style.scss';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';

const mobile = isMobile(window.navigator).any;

@inject('lend')
@observer
export class StUSDTModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      checked: false
    };
  }
  componentDidMount() {}
  onClick = () => {
    const lang = window.localStorage.getItem('lang') || intl.options.currentLocale;
    window.location.href = `https://stusdt.io/?lang=${lang}#/stUsdt`;
  };

  onCancel = () => {
    this.props.lend.setStUSDTModalShow(false);
  };

  render() {
    const { stUSDTModalShow, theme } = this.props.lend;

    const dark = theme !== 'white';

    return (
      <Modal
        closable={false}
        width={mobile ? 'calc(100vw - 40px)' : '460px'}
        visible={stUSDTModalShow}
        wrapClassName={`stUSDT-modal${dark ? ' dark' : ''}`}
        footer={null}
        zIndex={99999}
      >
        <div className="content">
          <div className="icon"></div>
          {/* <div className="line"></div> */}
          <p className="text">{intl.get('stUSDT_left_desc')}</p>

          <div className="btn-wrap">
            <div onClick={this.onCancel} className="btn cancel">
              {intl.get('stUSDT_btn_cancel')}
            </div>
            <div onClick={this.onClick} className="btn">
              {intl.get('stUSDT_btn_confirm')}
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}
