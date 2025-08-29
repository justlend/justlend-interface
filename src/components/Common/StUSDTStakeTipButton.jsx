import BigNumber from 'bignumber.js';
import { inject, observer } from 'mobx-react';
import React from 'react';
import Intl from 'react-intl-universal';
import { goToPage, formatNumber } from '../../utils/helper';

@inject('stusdt')
@observer
class StUSDTStakeTipButton extends React.Component {
  componentDidMount() {
    this.props.stusdt.getDashboardData();
  }
  onClickStake = e => {
    e.stopPropagation();
    goToPage('stUSDT', this.props.type === 'old' ? '_blank' : '_self');
    // gtag('event', 'PC_home_market_strx', { 'event_category': 'sTRX', 'event_label': 'home_market_strx' });
  };
  render() {
    const { dashboardData } = this.props.stusdt;
    return isNaN(dashboardData?.apy * 100) || BigNumber(dashboardData?.apy).eq(0) ? null : (
      <div className="stake-tip usdt" onClick={this.onClickStake}>
        {Intl.getHTML('strx.energy_stake_slogan', {
          value: ' ' + formatNumber(dashboardData.apy * 100, 2, { miniText: 0.01 }) + '% '
        })}
      </div>
    );
  }
}

export { StUSDTStakeTipButton };
