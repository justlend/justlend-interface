import BigNumber from 'bignumber.js';
import { inject, observer } from 'mobx-react';
import React from 'react';
import Intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import { goToPage, formatNumber } from '../../utils/helper';

@inject('strx')
@inject('lend')
@observer
class LiquidityStakeTipButton extends React.Component {
  componentDidMount() {
    this.props.strx.getMarketData();
  }
  onClickStake = e => {
    e.stopPropagation();
    goToPage('strx', this.props.type === 'old' ? '_blank' : '_self');
    window.gtag('event', 'PC_home_market_strx', { 'event_category': 'sTRX', 'event_label': 'home_market_strx' });
  };
  render() {
    const { theme } = this.props.lend;
    const isWhite = theme === 'white';
    const { marketData } = this.props.strx;
    return isNaN(marketData.avgApy * 100) ? null : this.props.lend.serviceInnerStatus === 'disabled' ? (
      <Tooltip
        title={Intl.get('season.can_not_connect')}
        overlayClassName={'j-tooltip-dropdown season ' + (isWhite ? 'white' : '')}
        placement="bottomRight"
      >
        <div
          className={'stake-tip season'}
          onClick={e => {
            e.stopPropagation();
            this.props.lend.setData({ noServiceModalAllVisible: true });
          }}
        >
          {Intl.getHTML('strx.energy_stake_slogan', {
            value: ' ' + formatNumber(marketData.avgApy * 100, 2, { miniText: 0.01 }) + '% '
          })}
        </div>
      </Tooltip>
    ) : (
      <div className={'stake-tip'} onClick={this.onClickStake}>
        {Intl.getHTML('strx.energy_stake_slogan', {
          value: ' ' + formatNumber(marketData.avgApy * 100, 2, { miniText: 0.01 }) + '% '
        })}
      </div>
    );
  }
}

export { LiquidityStakeTipButton };
