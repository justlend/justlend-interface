import React from 'react';
import { inject, observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import intl from 'react-intl-universal';
import { Modal, Checkbox } from 'antd';
import { BigNumber, formatNumber, formatTime } from '../../../utils/helper';
import isMobile from 'ismobilejs';
import { LinkButton } from '../../Common/LinkButton';

@inject('network')
@inject('lend')
@inject('strx')
@observer
class LimitedBenefitsModal extends React.Component {
  constructor(props) {
    super();
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any,
      isEngeryOfferShow: true
    };
  }

  componentDidMount() {
    this.props.strx.getMarketData();
  }

  onChange = e => {
    if (e.target.checked) {
      this.setState({
        isEngeryOfferShow: false
      });
      window.gtag('event', 'subsidy_modalOff', { 'event_category': 'PC_V1.5', 'event_label': 'subsidy_modalOff' });
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
    window.gtag('event', 'subsidy_gotoEnergy', { 'event_category': 'PC_V1.5', 'event_label': 'subsidy_gotoEnergy' });
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
    window.gtag('event', 'subsidy_closeSubsidyModal', {
      'event_category': 'PC_V1.5',
      'event_label': 'subsidy_closeSubsidyModal'
    });
  };

  getAnnouncementUrl = () => {
    const { lang } = this.state;

    const announcementUrl =
      lang && lang.includes('en')
        ? 'https://support.justlend.org/hc/en-us/articles/19326031593497'
        : 'https://support.justlend.org/hc/zh-cn/articles/19326031593497';
    return announcementUrl;
  };

  render() {
    const { engeryOfferModalVisible, marketData } = this.props.strx;

    const { mobile, lang } = this.state;
    let { theme } = this.props.lend;
    const isWhite = theme === 'white';
    const announcementUrl = this.getAnnouncementUrl();

    return (
      <Modal
        title={null}
        footer={null}
        className={`energy-offer-modal limited-benefits-modal ${
          lang === 'en-US' ? ' en' : lang === 'zh-TC' ? ' tc' : ''
        } ${isWhite ? ' white' : ''}`}
        visible={engeryOfferModalVisible}
        centered
        width={mobile ? 375 : 750}
        height={mobile ? 444 : 800}
        closable={false}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
      >
        <div className="energy-rental">
          <div>
            <span className="benefits-main-title">{intl.get('strx.energy_rent_get_allowance')}</span>{' '}
          </div>
          <div className={'benefits-subtitle' + (lang === 'en-US' ? ' en' : '')}>
            {intl.getHTML('strx.energy_rent_get_percent')}
          </div>
        </div>
        <div className="each-transaction">{intl.getHTML('strx.energy_rent_per_10w', { value: '100,000' })}</div>
        <div className="gas-off-before">
          <span className="least-text">
            {intl.getHTML('strx.energy_least_value', {
              value: BigNumber(marketData.trx1wEnergy).minus(marketData.jst2trx1wEnergy).times(10).gt(0.001)
                ? formatNumber(BigNumber(marketData.trx1wEnergy).minus(marketData.jst2trx1wEnergy).times(10), 3, {
                    miniText: '0.001'
                  })
                : 0
            })}
          </span>
        </div>

        <Link to="/energyRental" className="go-rent" onClick={this.goToEnergy}>
          {intl.get('strx.energy_offer_text6')}
        </Link>
        <div className="gas-off-rule">
          <LinkButton
            href={announcementUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              window.gtag('event', 'subsidy_rulesLink', {
                'event_category': 'PC_V1.5',
                'event_label': 'subsidy_rulesLink'
              });
            }}
          >
            {intl.get('strx.energy_offer_text5')}
          </LinkButton>
        </div>
        <div className="gas-off-checkbox">
          <Checkbox className="j-checkbox green" onChange={this.onChange}>
            {intl.get('strx.energy_offer_text7')}
          </Checkbox>
        </div>
        <div className="close" onClick={this.goClose}></div>
      </Modal>
    );
  }
}

export default LimitedBenefitsModal;
