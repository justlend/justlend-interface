import React from 'react';
import { inject, observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import intl from 'react-intl-universal';
import { Modal, Checkbox } from 'antd';
import Config from '../../../config';
import { BigNumber, formatNumber, formatTime } from '../../../utils/helper';
import CloseIcon from '../../../assets/images/v2/account/white-close.svg';
import CloseIconWhite from '../../../assets/images/v2/white-theme/modal-close.svg';
import defaultDonutIcon from '../../../assets/images/v2/account/donut-default.svg';
import isMobile from 'ismobilejs';
import { LinkButton } from '../../Common/LinkButton';

@inject('network')
@inject('lend')
@inject('strx')
@observer
class EnergyOfferModal extends React.Component {
  constructor(props) {
    super();
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      isEngeryOfferShow: true
    };
  }

  onChange = e => {
    if (e.target.checked) {
      this.setState({
        isEngeryOfferShow: false
      });
      window.gtag('event', 'gasOff_modalOff', { 'event_category': 'PC_V1.5', 'event_label': 'gasOff_modalOff' });
    } else {
      this.setState({
        isEngeryOfferShow: true
      });
    }
  };

  goToEnergy = () => {
    const now = Date.now();
    window.localStorage.setItem('closedDuration', now);
    if (!this.state.isEngeryOfferShow) {
      window.localStorage.setItem('isEngeryOfferShow', 'no');
    }
    this.props.strx.setData({
      engeryOfferModalVisible: false
    });
    window.gtag('event', 'gasOff_gotoEnergy', { 'event_category': 'PC_V1.5', 'event_label': 'gasOff_gotoEnergy' });
  };

  goClose = () => {
    const now = Date.now();
    window.localStorage.setItem('closedDuration', now);
    if (!this.state.isEngeryOfferShow) {
      window.localStorage.setItem('isEngeryOfferShow', 'no');
    }
    this.props.strx.setData({
      engeryOfferModalVisible: false
    });
    window.gtag('event', 'gasOff_closeGasOffModal', {
      'event_category': 'PC_V1.5',
      'event_label': 'gasOff_closeGasOffModal'
    });
  };

  getAnnouncementUrl = () => {
    const { lang } = this.state;

    const announcementUrl =
      lang && lang.includes('en')
        ? 'https://justlendorg.zendesk.com/hc/en-us/articles/18496749460377'
        : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/18496749460377';
    return announcementUrl;
  };

  render() {
    const { engeryOfferModalVisible } = this.props.strx;
    const { mobile } = this.state;
    let { theme } = this.props.lend;
    const isWhite = theme === 'white';
    const announcementUrl = this.getAnnouncementUrl();

    return (
      <Modal
        title={null}
        footer={null}
        className={`energy-offer-modal${isWhite ? ' white' : ''}`}
        visible={engeryOfferModalVisible}
        centered
        width={mobile ? 336 : 400}
        height={mobile ? 594 : 601}
        closable={false}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
      >
        <div className="limited-offer-button">
          <span>{intl.get('strx.energy_offer_text1')}</span>
        </div>
        <div className="energy-rental">
          {intl.get('strx.energy_offer_text2')} {intl.get('strx.energy_offer_text3')}
        </div>
        <div className="each-transaction">{intl.get('strx.energy_offer_text12')}</div>
        <div className="gas-off-before">
          <span className="gas-off-text">
            8.3K {intl.get('strx.energy_offer_text13')} <em>(≈3.6 TRX)</em>
          </span>
        </div>
        <div className="gas-off-after">
          <span className="gas-off-text">
            83K {intl.get('strx.energy_offer_text13')} (≈36 TRX)
            <span className="gas-off-line"></span>
          </span>
        </div>
        {/*<div className="spend-less-gas">{intl.get('strx.energy_offer_text4')}</div>*/}
        <div className="gas-off-rule">
          <LinkButton
            href={announcementUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              window.gtag('event', 'gasOff_rulesLink', {
                'event_category': 'PC_V1.5',
                'event_label': 'gasOff_rulesLink'
              });
            }}
          >
            {intl.get('strx.energy_offer_text5')}
          </LinkButton>
        </div>
        <Link to="/energyRental" className="go-rent" onClick={this.goToEnergy}>
          {intl.get('strx.energy_offer_text6')}
          <div className="gas-off-tip">{intl.getHTML('strx.energy_offer_text11')}</div>
        </Link>
        <div className="gas-off-checkbox">
          <Checkbox className="j-checkbox" onChange={this.onChange}>
            {intl.get('strx.energy_offer_text7')}
          </Checkbox>
        </div>
        <div className="close" onClick={this.goClose}></div>
      </Modal>
    );
  }
}

export default EnergyOfferModal;
