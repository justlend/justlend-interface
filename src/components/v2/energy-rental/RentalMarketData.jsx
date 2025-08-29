import React from 'react';
import { Component } from 'react';

import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import BigNumber from 'bignumber.js';

import { formatNumber, getQueryObj } from '../../../utils/helper';
import { Config } from '../../../config';

import '../../../assets/css/v2/energy-rental/rental-market-data.scss';

import { RentalPriceModel } from './RentalPriceModel';

import { getAboutEnergyRentUrl } from './utils';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@inject('energyRental')
@observer
class RentalMarketData extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale
    };
  }

  render() {
    const { lang } = this.state;
    const { data, utilizationRate } = this.props;
    const { maxRentableOfType } = this.props.energyRental;

    const estimatedTransactionCount = BigNumber(100000).idiv(Config.estimatedEnergyPerTx);

    return (
      <div className="rental-market-data section-content-container visible">
        <div className="price-and-chart">
          <div className="price-info">
            <div className="title">{intl.get('energy_rental.market_data.current_energy_price')}</div>
            <div className="price">
              <span className="value">{formatNumber(data.trx1wEnergy * 100, 0, { miniText: '0.001' })}</span>
              <span className="suffix">sun/{intl.get('strx.energy_day2')}</span>
            </div>
            <div className="price-hint">
              {intl.get('energy_rental.market_data.energy_price_hint', {
                trxValue: formatNumber(BigNumber(data.trx1wEnergy).times(10), 3, { miniText: '0.001' }),
                stakingValue: formatNumber(BigNumber(BigNumber(100000).div(data.energyStakePerTrx))._toFixed(0, 0), 0, {
                  miniText: '0.1'
                })
              })}
            </div>
            <div className="estimated-transaction-count-hint">
              {intl.get('energy_rental.tilde') + ' '}
              {intl.get(
                estimatedTransactionCount > 1
                  ? 'energy_rental.form.amount_field.estimated_transaction_count_hint_plural'
                  : 'energy_rental.form.amount_field.estimated_transaction_count_hint',
                {
                  value: estimatedTransactionCount
                }
              )}
            </div>
            <a
              href={getAboutEnergyRentUrl(lang)}
              target="_blank"
              rel="noreferrer"
              className="purple-link-btn hover"
              onClick={() => {
                window.gtag('event', 'click', {
                  'event_category': 'energyrent',
                  'event_label': 'energyrent_pro_marketData_clickrent'
                });
              }}
            >
              {intl.get('energy_rental.market_data.about_rental_price_btn')}
            </a>
          </div>
          <div className="chart-wrap">
            <RentalPriceModel dataList={data.model} voteApy={data.voteApy} totalApy={data.totalApy}></RentalPriceModel>
          </div>
        </div>

        <div className="market-stat">
          <div className="stat">
            <span className="grey-dot"></span>
            <div className="stat-title">{intl.get('energy_rental.market_data.available_energy_title')}</div>
            <div className="stat-value">
              {formatNumber(BigNumber(data.energyStakePerTrx).times(maxRentableOfType), 0)}
            </div>
          </div>
          <div className="stat">
            <span className="grey-dot"></span>
            <div className="stat-title">{intl.get('energy_rental.market_data.utilization_title')}</div>
            <div className="stat-value">
              {data.model ? formatNumber(utilizationRate, 2, { round: true }) + '%' : '--'}
            </div>
          </div>
          <div className="stat">
            <span className="grey-dot"></span>
            <div className="stat-title">{intl.get('energy_rental.market_data.renting_addresses_title')}</div>
            <div className="stat-value">{formatNumber(BigNumber(data.energyRentHeadCount), 0)}</div>
          </div>
        </div>
      </div>
    );
  }
}

export default RentalMarketData;
