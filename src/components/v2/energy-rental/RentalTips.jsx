import React from 'react';
import intl from 'react-intl-universal';

import { inject, observer } from 'mobx-react';

import { getQueryObj, formatNumber } from '../../../utils/helper';

import { getRentalGuideUrl, getEnergyTipsLearnMoreUrl } from './utils';

import '../../../assets/css/v2/energy-rental/rental-tips.scss';

@inject('energyRental')
@observer
class RentalTips extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  render() {
    const { lang } = this.state;
    const { newOrderSecurityDeposit } = this.props.energyRental;

    return (
      <div className="rental-tips section-content-container">
        <div className="tips-bg"></div>

        <div className="section-header">
          <div className="title">{intl.get('energy_rental.tips.title')}</div>
          <a
            href={getRentalGuideUrl(lang)}
            target="_blank"
            rel="noreferrer"
            className="purple-link-btn hover"
            onClick={() => {
              window.gtag('event', 'energyrent_pro_tips_clickUserguide', {
                'event_category': 'energyrent',
                'event_label': 'energyrent_pro_tips_clickUserguide'
              });
            }}
          >
            {intl.get('energy_rental.tips.rental_guide_btn')}
          </a>
          <div className="section-divider"></div>
        </div>

        <div className="tips-container">
          <div className="tips-item">
            <span className="tips-content">
              {intl.get('energy_rental.tips.tips_1', {
                value: formatNumber(newOrderSecurityDeposit, 2)
              })}
            </span>
          </div>
          <div className="tips-item">
            <span className="tips-content">{intl.get('energy_rental.tips.tips_2')}</span>
          </div>
          <div className="tips-item">
            <span className="tips-content with-link">{intl.get('energy_rental.tips.tips_3')}</span>
            <a
              href={getEnergyTipsLearnMoreUrl(lang)}
              target="_blank"
              rel="noreferrer"
              className="purple-link-btn hover"
              onClick={() => {
                window.gtag('event', 'energyrent_pro_tips_clickGasdetails', {
                  'event_category': 'energyrent',
                  'event_label': 'energyrent_pro_tips_clickGasdetails'
                });
              }}
            >
              {intl.get('energy_rental.tips.learn_more_btn')}
            </a>
          </div>
          <div className="tips-item">
            <span className="tips-content">{intl.get('energy_rental.tips.tips_4')}</span>
          </div>
        </div>
      </div>
    );
  }
}
export default RentalTips;
