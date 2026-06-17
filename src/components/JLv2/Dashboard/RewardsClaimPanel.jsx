import React, { useCallback, useState } from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import BigNumber from 'bignumber.js';
import { Tooltip } from 'antd';
import isMobile from 'ismobilejs';
import Stores from '../../../stores';
import {
  hasClaimableRewards,
  useMiningRewards,
  useAccruingMining,
  useUserPositionMining
} from '../../../utils/hooks/useMining';
import { formatFiatValue, formatApyRate } from '../../../utils/formatters';
import MiningPeriodsModal from '../../Modals/JLv2/MiningPeriods';
import MiningEarningsBreakdownTooltip from '../Common/MiningEarningsBreakdownTooltip';

export const RewardsClaimPanel = observer(() => {
  const { network, dashboardStore } = Stores;
  const { positionData, positionLoading } = dashboardStore;
  const { rewards, totalUsd, loading } = useMiningRewards();
  const {
    accruingUsd,
    settlingUsd,
    settlingTokens,
    settlementTime,
    globalSettlementStatus,
    loading: accruingLoading
  } = useAccruingMining();
  const { dailyEarnings, loading: userMiningLoading } = useUserPositionMining();
  const miningLoading = loading || accruingLoading || userMiningLoading;
  const [periodsVisible, setPeriodsVisible] = useState(false);

  const openPeriods = useCallback(() => {
    window.gtag?.('event', 'PC_mining_rewards_open', {
      event_category: 'PC_V2',
      event_label: 'mining_rewards_open'
    });
    setPeriodsVisible(true);
  }, []);

  const closePeriods = useCallback(() => setPeriodsVisible(false), []);

  // Show the panel whenever the user has any mining state that warrants
  // attention, regardless of whether they currently hold a position:
  //   1) accruing — current round still gaining (gainNew > 0, tronbullish)
  //   2) settling — previous round paused, waiting for merkle (gainLast,
  //      miningStatus === 2, tronbullish)
  //   3) claimable — merkle published, rewards unclaimed (airdrop API)
  // No longer fall back to a "user is in a mining-eligible vault" hint:
  // the spec is the three signals above, derived from tronbullish + airdrop
  // rather than /index/position miningApy.
  const hasRewards = !loading && hasClaimableRewards(rewards);
  const isAccruing = BigNumber(accruingUsd || 0).gt(0);
  const isSettling = BigNumber(settlingUsd || 0).gt(0);
  const showAccruingValue = !hasRewards && isAccruing;
  const showSettlingValue = !hasRewards && !isAccruing && isSettling;
  const showMiningRewards = hasRewards || isAccruing || isSettling;
  const showNetSupplyApy = !!positionData && !positionData.vaultNew;
  // Net supply APY = (daily base + daily mining USD) × 365 / total supply USD,
  // i.e. annualize the same daily-earnings figure rendered in My Positions
  // instead of summing /index/position's netEarnApy and the mining APY pieces
  // separately. This keeps the displayed APY consistent with what the user
  // sees on the daily-earnings line.
  const totalSupplyUsdBn = new BigNumber(positionData?.totalSupplyUsd || 0);
  const totalDailyUsdBn = new BigNumber(positionData?.dailyRevenue || 0).plus(dailyEarnings?.mining?.amountUsd || 0);
  const totalNetSupplyApy = totalSupplyUsdBn.gt(0) ? totalDailyUsdBn.times(365).div(totalSupplyUsdBn).toString() : '0';
  
  // + tronbullish gainLast (only when miningStatus === 2, i.e. truly settling)
  // + tronbullish gainNew (currently accruing). The CTA below the value still
  // depends on whether any portion is claim-ready.
  const combinedRewardsUsd = BigNumber(totalUsd || 0)
    .plus(accruingUsd || 0)
    .plus(settlingUsd || 0)
    .toNumber();

  if (!network?.isConnected) {
    return null;
  }

  if (!showMiningRewards && !showNetSupplyApy) {
    return null;
  }

  return (
    <>
      <div className="mining-rewards-col summary-data">
        {showMiningRewards && (
          <div className="mining-rewards-card">
            <div className="mrc-title">
              {intl.get('mining.rewards.title')}
              <MiningEarningsBreakdownTooltip
                claimableTokens={rewards}
                settlingTokens={settlingTokens}
                settlementTime={settlementTime}
                globalSettlementStatus={globalSettlementStatus}
              />
            </div>
            {miningLoading ? (
              <>
                <div className="mrc-value">--</div>
                <div className="mrc-claim mrc-claim-disabled">--</div>
              </>
            ) : hasRewards ? (
              <>
                <div className="mrc-value" title={formatFiatValue(combinedRewardsUsd)}>
                  {formatFiatValue(combinedRewardsUsd)}
                </div>
                <div className="mrc-claim" onClick={openPeriods}>
                  {intl.get('mining.rewards.claim')}
                  <em className="sd-arrow"></em>
                </div>
              </>
            ) : (
              <>
                <div
                  className="mrc-value"
                  title={showAccruingValue || showSettlingValue ? formatFiatValue(combinedRewardsUsd) : undefined}
                >
                  {showAccruingValue || showSettlingValue ? formatFiatValue(combinedRewardsUsd) : '--'}
                </div>
                <Tooltip
                  title={intl.get('mining.rewards.empty_tip')}
                  placement="top"
                  trigger={isMobile(window.navigator).any ? ['click'] : ['hover']}
                  arrowPointAtCenter
                  overlayClassName="j-tooltip-dropdown"
                >
                  <div className="mrc-claim mrc-claim-disabled">
                    {showSettlingValue ? intl.get('mining.rewards.settle') : intl.get('mining.rewards.accrue')}
                  </div>
                </Tooltip>
              </>
            )}
          </div>
        )}
        {showNetSupplyApy && (
          <div className="position-details">
            <div className="detail-item">
              <span className="label">{intl.get('jlv2.home.net_supply_apy')}</span>
              <span className="value">
                {positionLoading || userMiningLoading || !totalSupplyUsdBn.gt(0)
                  ? '--'
                  : formatApyRate(totalNetSupplyApy)}
              </span>
            </div>
          </div>
        )}
      </div>
      <MiningPeriodsModal visible={periodsVisible} onClose={closePeriods} />
    </>
  );
});

export default RewardsClaimPanel;
