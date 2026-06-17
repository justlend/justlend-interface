import React from 'react';
import intl from 'react-intl-universal';

import classnames from 'classnames';
import { Link } from 'react-router-dom';

import { getQueryObj } from '../../../utils/helper';
import config from '../../../config';
import { getAnnouncementUrl } from './utils';

import '../../../assets/css/v2/energy-rental/energy-rental-page-header.scss';
const { feedbackUrl } = config;
class EnergyRentalPageHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  render() {
    const { wideLayout } = this.props;
    const { lang } = this.state;

    return (
      <div className={classnames('energy-rental-page-header', { 'wide-layout': wideLayout })}>
        <div className="energy-top flex jcsb">
          <div>
            <div className="page-title">
              <div className="title-text green-line">{intl.get('energy_rental.page_header.title')}</div>
            </div>

            <div className="j-announce">
              <span className="announce-icon"></span>
              <a
                className="announce-content"
                onClick={() => {
                  window.gtag('event', 'energyrent_pro_click_announce', {
                    'event_category': 'energyrent',
                    'event_label': 'energyrent_pro_click_announce'
                  });
                }}
                href={getAnnouncementUrl(lang)}
                target="announce"
                rel="noreferrer"
              >
                {intl.get('strx.stake_annoucement_2')}
              </a>
              <span className="announce-arrow-icon"></span>
            </div>
          </div>
          <div className="jl-feedback">
            <div className="feedback-link">
              <em className="feedback-icon"></em>
              <a className="jl-links purple-link-btn" href={feedbackUrl} target="feedback">
                {intl.get('liquidate.feedback')}
              </a>
            </div>
            <div className="feedback-title nowrap">
              <em className="feedback-title-icon"></em>
              {intl.get('application.des5')}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default EnergyRentalPageHeader;
