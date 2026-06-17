import React from 'react';
import { Component } from 'react';
import { Tabs } from 'antd';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import BigNumber from 'bignumber.js';

import { formatNumber, getQueryObj } from '../../../utils/helper';
import { Config } from '../../../config';

import '../../../assets/css/v2/energy-rental/rental-market-data.scss';

import { RentalPriceModel } from './RentalPriceModel';
import EnergyPoolData from './EnergyPoolData';
import RentalExplanation from './RentalExplanation';
import { getAboutEnergyRentUrl } from './utils';

const { TabPane } = Tabs;
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
      lang: getQueryObj()?.lang || window.localStorage.getItem('lang') || intl.options.currentLocale,
      energyData: {
        historyData: [],
        latestData: [],
        userScaleData: {}
      }
    };
  }

  async componentDidMount() {
    const data = await this.props.energyRental.getMarketHistoryData({});
    this.setState({ energyData: data });
  }

  changeTab = key => {
    this.props.lend.setData({ poolDataTab: key });
  };

  render() {
    const { lang, energyData } = this.state;
    const { poolDataTab } = this.props.lend;
    const { data, energyRental } = this.props;

    const estimatedTransactionCount = BigNumber(100000).idiv(Config.estimatedEnergyPerTx);

    return (
      <div className="rental-market-data section-content-container visible">
        <div className="price-and-chart">
          <div className="price-title">{intl.get('energy_rental.market_data.current_energy_price')}</div>
          <div className="section-divider"></div>
          <div className="price-content flex-center">
            <div className="price-info">
              <div className="price">
                <span className="value">{formatNumber(data.trx1wEnergy * 100, 0, { miniText: '0.001' })}</span>
                <span className="suffix">sun/{intl.get('strx.energy_day2')}</span>
              </div>
              <div className="price-hint">
                {intl.get('energy_rental.market_data.energy_price_hint', {
                  trxValue: formatNumber(BigNumber(data.trx1wEnergy).times(10), 3, { miniText: '0.001' }),
                  stakingValue: formatNumber(
                    BigNumber(BigNumber(100000).div(data.energyStakePerTrx))._toFixed(0, 0),
                    0,
                    {
                      miniText: '0.1'
                    }
                  )
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
                  window.gtag('event', 'energyrent_pro_marketData_clickrent', {
                    'event_category': 'energyrent',
                    'event_label': 'energyrent_pro_marketData_clickrent'
                  });
                }}
              >
                {intl.get('energy_rental.rent_and_return_of_deposit')}
              </a>
            </div>
            <div className="chart-wrap">
              <RentalPriceModel
                dataList={data.model}
                voteApy={data.voteApy}
                totalApy={data.totalApy}
              ></RentalPriceModel>
            </div>
          </div>
        </div>
        <div className="energy-data-container" id="energy-data-container">
          <EnergyPoolData data={energyData} apy={energyRental?.marketData?.avgApy6h} />
          {/* <Tabs
            className={'j-energy-data-tabs' + (lang === 'en-US' ? ' j-tab-en' : '')}
            activeKey={poolDataTab}
            centered
            type="card"
            onChange={this.changeTab}
          >
            <TabPane tab={intl.get('energy_rental.energy_pool_data')} key="1">
              <EnergyPoolData data={energyData} />
            </TabPane>
            <TabPane tab={intl.get('energy_rental.rent_and_return_of_deposit')} key="2">
              <RentalExplanation />
            </TabPane>
          </Tabs> */}
        </div>
      </div>
    );
  }
}

export default RentalMarketData;
