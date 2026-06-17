import BigNumber from 'bignumber.js';
import { observer } from 'mobx-react';
import React from 'react';
import Intl from 'react-intl-universal';
import Stores from '../../stores';
import { goToPage, formatNumber } from '../../utils/helper';

const StUSDTStakeTipButton = observer(({ type = 'old' }) => {
  const { stusdt } = Stores;
  const onClickStake = e => {
    e.stopPropagation();
    goToPage('stUSDT', type === 'old' ? '_blank' : '_self');
  };
  const { dashboardData } = stusdt;

  return (
    <div className="stake-tip usdt" onClick={onClickStake}>
      {Intl.getHTML('strx.energy_stake_slogan', {
        value: ' ' + formatNumber(dashboardData.apy * 100, 2, { miniText: 0.01 }) + '% '
      })}
    </div>
  );
});

export { StUSDTStakeTipButton };
