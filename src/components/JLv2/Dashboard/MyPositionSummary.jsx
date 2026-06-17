import React from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import Stores from '../../../stores';
import { formatFiatValue } from '../../../utils/formatters';
import { BigNumber } from 'tronweb';
import Config from '../../../config';
import { useUserPositionMining } from '../../../utils/hooks/useMining';
import EarningsBreakdownTooltip from '../Common/EarningsBreakdownTooltip';

export const MyPositionSummary = observer(props => {
  const { dashboardStore } = Stores;
  const { positionData, setHomeSearchparam, flashingAnimation } = dashboardStore;
  const { dailyEarnings } = useUserPositionMining();
  const miningTokens = [];
  if (dailyEarnings?.mining) {
    if (Number(dailyEarnings.mining.usdd) > 0) miningTokens.push({ amount: dailyEarnings.mining.usdd, token: 'USDD' });
    if (Number(dailyEarnings.mining.trx) > 0) miningTokens.push({ amount: dailyEarnings.mining.trx, token: 'TRX' });
  }
  // Render the daily-earnings tooltip whenever there is at least one mining
  // token to show; the tooltip otherwise duplicates the base value already
  // rendered next to it.
  const showMiningTooltip = miningTokens.length > 0;

  if (!positionData) {
    return <div className="summary-card">{intl.get('jlv2.home.loading')}...</div>; // Or a skeleton loader
  }

  const totalDailyEarnings = BigNumber(positionData.dailyRevenue || 0)
    .plus(dailyEarnings?.mining?.amountUsd || 0)
    .toString();

  return (
    <div className="summary-card my-position-summary summary-data">
      <div className="sd-title preblock">{intl.get('jlv2.home.supplied')}</div>
      <div
        className="sd-value usd-item"
        onClick={() => {
          setHomeSearchparam('supply');
          flashingAnimation();
        }}
      >
        {formatFiatValue(positionData.totalSupplyUsd)}
        <em className="sd-arrow"></em>
      </div>
      <div className="sd-subtitle">
        {intl.getHTML('jlv2.home.in_which_vault', { amount: positionData.vaults?.length || 0 })}
      </div>
      {!BigNumber(props.totalAssetsV1).lte(0) && positionData.vaultNew ? (
        <a className="banner-diff-btn" href={Config.portalLink + '?scroll=whatsnew'} target="_blank">
          {intl.get('jlv2.banner.diff')}
        </a>
      ) : (
        <div className="position-details">
          <div className="detail-item">
            <span className="label">{intl.get('jlv2.home.daily_earning')}</span>
            <span className="value">
              {formatFiatValue(totalDailyEarnings)}
              {showMiningTooltip && (
                <EarningsBreakdownTooltip
                  baseAmount={dailyEarnings?.base?.amount}
                  baseToken={dailyEarnings?.base?.token}
                  miningTokens={miningTokens}
                />
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
