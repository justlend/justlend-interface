import React from 'react';
import { Link } from 'react-router-dom';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import isMobile from 'ismobilejs';
import { Modal, Tooltip } from 'antd';
import Config from '../../../config';
import LightImg from '../../../assets/images/v2/app-light.png';
import '../../../assets/css/v2/disclaimer.scss';
import { getBrowserInfo } from '../../../utils/helper';

@inject('lend')
@inject('network')
@observer
class Disclaimer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      checked: false
    };
  }

  componentDidMount = () => {
    // document.body.style.overflow = 'hidden';
  };

  componentWillUnmount() {
    // document.body.style.overflow = 'auto';
  }

  close = () => {
    const { lang } = this.state;

    this.props.lend.setData({ disclaimerShow: false });

    if (this.props.network.routeName !== 'liquidate') {
      const href = window.location.origin + `/liquidate?disclaimer=no&lang=${lang}`;
      window.location.href = href;
    }
  };

  agree = () => {
    const { defaultAccount } = this.props.network;
    const { lang } = this.state;

    const browserInfo = getBrowserInfo();
    window.localStorage.setItem(
      defaultAccount + (browserInfo.browser !== 'Unknown' ? browserInfo.browser : browserInfo.appName),
      true
    );
    this.props.lend.setData({ isDisclaimerStoraged: true });
    this.setState({ checked: !this.state.checked });
    this.close();
    if (this.props.network.routeName !== 'liquidate') {
      const href = window.location.origin + `/liquidate?disclaimer=pass&lang=${lang}`;
      window.location.href = href;
    }
  };

  check = () => {
    this.setState({ checked: !this.state.checked });
  };

  render() {
    const { theme, disclaimerShow, pre } = this.props.lend;
    const { defaultAccount } = this.props.network;
    const { lang, mobile, checked } = this.state;

    return (
      <Modal
        visible={disclaimerShow}
        title={''}
        width={mobile ? 345 : 500}
        centered
        footer={null}
        className={'j-modal j-application-tip-modal j-disclaimer-modal' + (theme === 'white' ? ' white' : '')}
        closable={true}
        onCancel={() => {
          this.close();
        }}
        getContainer={() => document.querySelector('.j-wrapper')}
      >
        <img className="app-light" src={LightImg} />
        <div className="app-des">{intl.get('disclaimer.agree2')}</div>
        <div className="disclaimer-content">
          <div className="disclaimer-scroll-content">
            <div className="disclaimer-title">{intl.get('disclaimer.terms1')}</div>
            <div className="disclaimer-desc ">
              <div className="scroll-bar">
                <ul>
                  <li>{intl.get('disclaimer.terms2')}</li>
                  <li>{intl.get('disclaimer.terms3')}</li>
                  <li>{intl.get('disclaimer.terms4')}</li>
                  <li>{intl.get('disclaimer.terms5')}</li>
                  <li>{intl.get('disclaimer.terms6')}</li>
                  <li>{intl.get('disclaimer.terms7')}</li>
                </ul>
              </div>
              <div className="linear"></div>
            </div>
          </div>
          <div className="disclaimer-agree" onClick={this.check}>
            <div className={'disclaimer-checkbox' + (checked ? ' checked' : '')}></div>
            <div className="disclaimer-read">{intl.get('disclaimer.have_read')}</div>
          </div>
          <div className="disclaimer-btns">
            <button className="j-btn j-supply" onClick={this.close}>
              {intl.get('disclaimer.decline')}
            </button>
            {checked ? (
              <button className="j-btn j-rent-renew" onClick={this.agree}>
                {intl.get('disclaimer.accept')}
              </button>
            ) : (
              <Tooltip
                title={intl.getHTML('disclaimer.have_read_tip')}
                placement={mobile ? 'topLeft' : 'top'}
                arrowPointAtCenter
                overlayClassName="j-tooltip-dropdown j-disclaimer"
              >
                <button className="j-btn j-rent-renew disabled">{intl.get('disclaimer.accept')}</button>
              </Tooltip>
            )}
          </div>
        </div>
      </Modal>
    );
  }
}

export default Disclaimer;
