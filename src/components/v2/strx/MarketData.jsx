import React from 'react';
import { inject, observer } from 'mobx-react';
import { Component } from 'react';
import intl from 'react-intl-universal';
import '../../../assets/css/v2/liquidity-stake-share/market-data.scss';
import '../../../assets/css/v2/theme.scss';
import { formatNumber, isMobile } from '../../../utils/helper';
import { MarketChart } from './MarketChart';
import BigNumber from 'bignumber.js';

@inject('network')
@inject('lend')
@inject('system')
@inject('pool')
@inject('strx')
@observer
class MarketData extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile().any,
      reverseRate: window.sessionStorage.getItem('reverse_rate') ? true : false
    };
  }

  onReverseRate = () => {
    const { reverseRate } = this.state;
    this.setState({
      reverseRate: !reverseRate
    });

    !reverseRate
      ? window.sessionStorage.setItem('reverse_rate', true)
      : window.sessionStorage.removeItem('reverse_rate');

    window.gtag('event', 'PC_stake_reverse_rate', { 'event_category': 'sTRX', 'event_label': 'stake_reverse_rate' });
  };

  renderStakeMarket() {
    const { data } = this.props;
    const { reverseRate } = this.state;
    return (
      <div className="data-wrap color-primary">
        <div className="summary">
          <span className="title">{intl.get('strx.stake_data_total_staked')}</span>
          <div className="value">
            <span className="num">{formatNumber(data.totalDeposits, 0, { miniText: '1' })}</span>
            <span className="postfix">TRX</span>
          </div>
        </div>
        <div className="divider-h"></div>
        <div className="info-wrap">
          <div className="info-item">
            <span className="title color-light">{intl.get('strx.stake_data_stakers')}</span>
            <span className="value">{formatNumber(data.depositsHeadCounts, false)}</span>
          </div>
          <div className="info-item">
            <span className="title color-light">{intl.get('strx.stake_data_ratio')}</span>
            <span className="value exchange">
              {!reverseRate ? (
                <span>1 TRX = {formatNumber(data.sTrx1Trx, 6)} sTRX</span>
              ) : (
                <span>1 sTRX = {formatNumber(data.trx1sTrx, 6)} TRX</span>
              )}
              <span className="icon" onClick={this.onReverseRate}></span>
            </span>
          </div>

          <div className="info-item">
            <span className="title color-light">{intl.get('strx.stake_data_strx_supply')}</span>
            <span className="value">{formatNumber(data.totalSupply, 0, { miniText: '1' })}</span>
          </div>
        </div>
      </div>
    );
  }
  renderEnergy() {
    const { data } = this.props;
    const { maxRentableOfType } = this.props.strx;

    return (
      <div className="data-wrap color-primary energy-data">
        <div className="summary">
          <span className="title">{intl.get('strx.energy_rent_energy_price')}</span>
          <div className="value">
            <span className="num">{formatNumber(data.trx1wEnergy * 100, 0, { miniText: '0.001' })}</span>
            <span className="postfix">sun/{intl.get('strx.energy_day2')}</span>
          </div>
          <div className="sumary-tip color-light">{intl.get('strx.energy_rent_price')}</div>
          {/* <div className="subsidy-data">
            <p>
              {intl.get('strx.energy_subsidy_data_percentage')}
              {BigNumber(data.jst2trx1wEnergy).div(data.trx1wEnergy).gt(1) ? (
                <strong className="yellow">
                  {formatNumber(BigNumber(data.jst2trx1wEnergy).div(data.trx1wEnergy).times(100), 2, {
                    miniText: 0.01
                  }) + '%'}
                </strong>
              ) : (
                <strong>
                  {formatNumber(BigNumber(data.jst2trx1wEnergy).div(data.trx1wEnergy).times(100), 2, {
                    miniText: 0.01
                  }) + '%'}
                </strong>
              )}
            </p>
            <p>
              {intl.get('strx.energy_subsidy_data_price')}
              {BigNumber(data.jst2trx1wEnergy).div(data.trx1wEnergy).gt(1) ? (
                <strong className="yellow">
                  0 sun/
                  {intl.get('strx.energy_day2')}
                </strong>
              ) : (
                <strong>
                  {formatNumber(BigNumber(data.trx1wEnergy).minus(data.jst2trx1wEnergy).times(100), 0, {
                    miniText: '0.001'
                  })}{' '}
                  sun/
                  {intl.get('strx.energy_day2')}
                </strong>
              )}
            </p>
          </div> */}
        </div>
        <div className="divider-h"></div>
        <div className="info-wrap">
          <div className="info-item">
            <div className="title">{intl.get('strx.energy_total_resource')}</div>
            <div className="value">
              <span className="num">
                {formatNumber(
                  BigNumber(data.totalUnfreezableEnergy).plus(data.totalDelegatedEnergy).times(data.energyStakePerTrx),
                  0
                )}
              </span>
              <span className="postfix">{intl.get('strx.energy_energy')}</span>
            </div>
          </div>
          <div className="info-item">
            <div className="title">{intl.get('strx.energy_available_rental')}</div>
            <div className="value">
              <span className="num">{formatNumber(BigNumber(data.energyStakePerTrx).times(maxRentableOfType), 0)}</span>
              <span className="postfix">{intl.get('strx.energy_energy')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  render() {
    const { lang } = this.props.lend;
    const { data, type } = this.props;
    const isStake = type === 'stake';
    if (isStake) {
      return (
        <div className={`market-data stake ${lang}`}>
          <div className="section-title color-primary">
            <span className={`${type} decoration`}></span>
            <span>{intl.get('strx.stake_data_modal_data')}</span>
          </div>
          <div className="market-data-section stake">{this.renderStakeMarket()}</div>
        </div>
      );
    }
    return (
      <div className={`market-data ${lang}`}>
        <div className="section-title color-primary">
          <span className={`${type} decoration`}></span>
          <span>{intl.get('strx.energy_market_data')}</span>
        </div>
        <div className="market-data-section column">
          {this.renderEnergy()}
          <div className="divider-v"></div>
          <div className={`chart-wrap ${isStake ? 'stake' : 'energy'}`}>
            <div className="title-wrap">
              <span className="title color-primary">
                {isStake ? intl.get('strx.stake_data_staking_apy_modal') : intl.get('strx.energy_rent_price_model')}
              </span>
              <span className="desc color-light">
                <span className="desc">{intl.get('strx.stake_data_energy_renting_apy')}</span>
                <span className="y desc">
                  {isStake
                    ? 'Y: APY (%)'
                    : `Y: ${intl.get('strx.energy_rent_energy_price')} (sun/${intl.get('strx.energy_day2')})`}
                </span>
              </span>
            </div>

            <MarketChart
              dataList={data.model}
              voteApy={data.voteApy}
              type={type}
              totalApy={data.totalApy}
            ></MarketChart>
          </div>
        </div>
      </div>
    );
  }
}

export { MarketData };
