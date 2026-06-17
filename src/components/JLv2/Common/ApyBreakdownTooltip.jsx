import React, { useState } from 'react';
import { Tooltip } from 'antd';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { formatApyRate } from '../../../utils/formatters';

const normalize = miningApy => {
  if (miningApy == null) return { usdd: 0, trx: 0, total: 0 };
  if (typeof miningApy === 'number') {
    const v = Number(miningApy) || 0;
    return { usdd: v, trx: 0, total: v };
  }
  const usdd = Number(miningApy.usdd) || 0;
  const trx = Number(miningApy.trx) || 0;
  const total = Number.isFinite(Number(miningApy.total)) ? Number(miningApy.total) : usdd + trx;
  return { usdd, trx, total };
};

export const ApyBreakdownTooltip = ({
  baseApy = 0,
  miningApy = 0,
  placement = 'top',
  iconClassName = 'j-tooltip-icon j-info-icon ml-4'
}) => {
  const [mobile] = useState(isMobile(window.navigator).any);

  const mining = normalize(miningApy);
  const total = (Number(baseApy) || 0) + mining.total;
  const hasDual = mining.trx > 0;

  const content = (
    <div className="mining-breakdown-tooltip">
      <div className="mining-breakdown-row">
        <span className="label">{intl.get('mining.breakdown.base_apy')}</span>
        <span className="value">{formatApyRate(baseApy)}</span>
      </div>
      {hasDual ? (
        <>
          <div className="mining-breakdown-row">
            <span className="label">{intl.get('mining.breakdown.mining_apy')} (USDD)</span>
            <span className="value">{formatApyRate(mining.usdd)}</span>
          </div>
          <div className="mining-breakdown-row">
            <span className="label">{intl.get('mining.breakdown.mining_apy')} (TRX)</span>
            <span className="value">{formatApyRate(mining.trx)}</span>
          </div>
        </>
      ) : (
        <div className="mining-breakdown-row">
          <span className="label">{intl.get('mining.breakdown.mining_apy')}</span>
          <span className="value">{formatApyRate(mining.total)}</span>
        </div>
      )}
      <div className="mining-breakdown-row total">
        <span className="label">{intl.get('mining.breakdown.total_apy')}</span>
        <span className="value">{formatApyRate(total)}</span>
      </div>
    </div>
  );

  return (
    <Tooltip
      title={content}
      placement={placement}
      trigger={mobile ? ['click'] : ['hover']}
      arrowPointAtCenter
      overlayClassName="j-tooltip-dropdown"
    >
      <span className={iconClassName} onClick={e => e.stopPropagation()}></span>
    </Tooltip>
  );
};

export default ApyBreakdownTooltip;
