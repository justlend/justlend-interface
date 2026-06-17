import React, { useState } from 'react';
import { Tooltip } from 'antd';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { formatTokenAmount } from '../../../utils/formatters';

const resolveMiningTokens = (miningTokens, miningAmount, miningToken) => {
  if (Array.isArray(miningTokens) && miningTokens.length > 0) {
    return miningTokens.filter(t => t && t.amount != null && Number(t.amount) > 0);
  }
  if (miningAmount != null && Number(miningAmount) > 0) {
    return [{ amount: miningAmount, token: miningToken }];
  }
  return [];
};

export const EarningsBreakdownTooltip = ({
  baseAmount,
  baseToken,
  miningAmount,
  miningToken,
  miningTokens,
  items,
  placement = 'top',
  iconClassName = 'j-tooltip-icon j-info-icon ml-4'
}) => {
  const [mobile] = useState(isMobile(window.navigator).any);
  // On mobile the trigger sits on the right edge of its row; topRight anchors
  // the tooltip's right edge to the trigger so the arrow lines up with `?`
  // and the body extends left into the available space instead of clipping.
  const effectivePlacement = mobile && placement === 'top' ? 'topRight' : placement;

  const labelFor = kind =>
    intl.get(kind === 'mining' ? 'mining.breakdown.mining_label' : 'mining.breakdown.base_label');
  const orderedItems =
    Array.isArray(items) && items.length > 0
      ? items
      : [
          { amount: baseAmount, token: baseToken, kind: 'base' },
          ...resolveMiningTokens(miningTokens, miningAmount, miningToken).map(t => ({
            amount: t.amount,
            token: t.token,
            kind: 'mining'
          }))
        ];

  const content = (
    <div className="mining-breakdown-tooltip mining-breakdown-stacked">
      {orderedItems.map((it, i) => (
        <div className="mining-breakdown-line" key={`${it.token}-${it.kind}-${i}`}>
          {formatTokenAmount(it.amount, it.token)} ({labelFor(it.kind)})
        </div>
      ))}
    </div>
  );

  return (
    <Tooltip
      title={content}
      placement={effectivePlacement}
      trigger={mobile ? ['click'] : ['hover']}
      arrowPointAtCenter
      overlayClassName="j-tooltip-dropdown mining-breakdown-overlay"
    >
      <span className={iconClassName} onClick={e => e.stopPropagation()}></span>
    </Tooltip>
  );
};

export default EarningsBreakdownTooltip;
