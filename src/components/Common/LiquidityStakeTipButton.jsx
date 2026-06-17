import BigNumber from 'bignumber.js';
import { observer } from 'mobx-react';
import React, { useEffect } from 'react';
import Intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import Stores from '../../stores';
import { goToPage, formatNumber } from '../../utils/helper';

const LiquidityStakeTipButton = observer(({ type = 'old' }) => {
  const { lend, strx } = Stores;

  useEffect(() => {
    strx.getMarketData();
  }, []);

  const onClickStake = e => {
    e.stopPropagation();
    goToPage('strx', type === 'old' ? '_blank' : '_self');
    window.gtag('event', 'PC_home_market_strx', { 'event_category': 'sTRX', 'event_label': 'home_market_strx' });
  };

  const isWhite = lend.theme === 'white';
  const { marketData } = strx;

  return isNaN(marketData.avgApy * 100) ? null : lend.serviceInnerStatus === 'disabled' ? (
    <Tooltip
      title={Intl.get('season.can_not_connect')}
      overlayClassName={'j-tooltip-dropdown season ' + (isWhite ? 'white' : '')}
      placement="bottomRight"
    >
      <div
        className={'stake-tip season'}
        onClick={e => {
          e.stopPropagation();
          lend.setNoServiceModalAllVisible(true);
        }}
      >
        {Intl.getHTML('strx.energy_stake_slogan', {
          value: ' ' + formatNumber(marketData.avgApy * 100, 2, { miniText: 0.01 }) + '% '
        })}
      </div>
    </Tooltip>
  ) : (
    <div className={'stake-tip'} onClick={onClickStake}>
      {Intl.getHTML('strx.energy_stake_slogan', {
        value: ' ' + formatNumber(marketData.avgApy * 100, 2, { miniText: 0.01 }) + '% '
      })}
    </div>
  );
});

export { LiquidityStakeTipButton };
