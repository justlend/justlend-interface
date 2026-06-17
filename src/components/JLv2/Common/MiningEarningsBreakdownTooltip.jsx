import React, { useState } from 'react';
import { Tooltip } from 'antd';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { formatTokenAmount } from '../../../utils/formatters';

const renderTokenRow = tokens => {
  const filtered = (tokens || []).filter(t => t && t.amount != null && Number(t.amount) > 0);
  if (filtered.length === 0) return intl.get('v2.rewards.none');
  return filtered.map((t, i) => (
    <React.Fragment key={`${t.token}-${i}`}>
      {i > 0 && ' + '}
      {formatTokenAmount(t.amount, t.token)}
    </React.Fragment>
  ));
};

export const MiningEarningsBreakdownTooltip = ({
  claimableTokens,
  settlingTokens,
  settlementTime,
  globalSettlementStatus,
  placement = 'top',
  iconClassName = 'j-tooltip-icon j-info-icon ml-4'
}) => {
  const [mobile] = useState(isMobile(window.navigator).any);
  // Same reason as EarningsBreakdownTooltip: anchor the arrow to the trigger
  // when the icon hugs the right edge of its row.
  const effectivePlacement = mobile && placement === 'top' ? 'topRight' : placement;

  // V1 parity (utils/helper.jsx getTransferringSoonAndInFreezeAllMarkets):
  // when any token in any pool reports currRewardStatus === '2', the round
  // is closing and gainNew is unreliable everywhere — show "--" for the
  // amount and surface the settlement-time line so the user knows when
  // the round will finalize. Otherwise fall back to the per-token gainNew
  
  const showSettlingTime =
    !!settlementTime && (globalSettlementStatus || (settlingTokens && settlingTokens.length > 0));

  const content = (
    <div className="mining-earnings-breakdown">
      <div className="meb-section">
        <div className="meb-label">{intl.get('v2.rewards.waiting_rewards')}</div>
        <div className="meb-value">{renderTokenRow(claimableTokens)}</div>
      </div>
      <div className="meb-section">
        <div className="meb-label">{intl.get('v2.rewards.to_be_settled')}</div>
        <div className="meb-value">{globalSettlementStatus ? '--' : renderTokenRow(settlingTokens)}</div>
        {showSettlingTime && (
          <div className="meb-subtext">{intl.getHTML('v2.settlement_time', { date: settlementTime })}</div>
        )}
      </div>
      <div className="meb-footer">
        <div className="meb-footer-label">{intl.get('v2.reward_note')}</div>
        <div className="meb-footer-text">{intl.get('mining.sp_tip')}</div>
      </div>
    </div>
  );

  return (
    <Tooltip
      title={content}
      placement={effectivePlacement}
      trigger={mobile ? ['click'] : ['hover']}
      arrowPointAtCenter
      overlayClassName="j-tooltip-dropdown mining-earnings-breakdown-overlay"
    >
      <span className={iconClassName} onClick={e => e.stopPropagation()}></span>
    </Tooltip>
  );
};

export default MiningEarningsBreakdownTooltip;
