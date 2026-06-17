import React, { useState } from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import BigNumber from 'bignumber.js';
import { Tooltip } from 'antd';
import Store from '../../../stores';
import { formatApyRate, formatTokenAmount, formatFiatValue, formatCompactFiatValue } from '../../../utils/formatters';
import { useVaultMiningApy } from '../../../utils/hooks/useMining';
import ApyBreakdownTooltip from '../Common/ApyBreakdownTooltip';

const StatItem = ({
  label,
  value,
  labelTooltipContent,
  valueTooltipContent,
  fire,
  mobileLabelTooltipPosition,
  extraValueNode
}) => (
  <div className="stat-item">
    <div className="label">
      {label}
      {labelTooltipContent && (
        <Tooltip
          trigger={isMobile(window.navigator).any ? ['click'] : ['hover']}
          overlayClassName="j-tooltip-dropdown"
          title={labelTooltipContent}
          placement={mobileLabelTooltipPosition || 'top'}
          arrowPointAtCenter
        >
          <span className="j-tooltip-icon j-info-icon ml-4"></span>
        </Tooltip>
      )}
    </div>
    {valueTooltipContent ? (
      <Tooltip
        trigger={isMobile(window.navigator).any ? ['click'] : ['hover']}
        overlayClassName="j-tooltip-dropdown"
        title={valueTooltipContent}
        placement="bottom"
        arrowPointAtCenter
      >
        <div className="value value-tooltip">
          {value}
          {extraValueNode}
        </div>
      </Tooltip>
    ) : (
      <div className="value">
        {value}
        {fire && <span className="fire-v2"></span>}
        {extraValueNode}
      </div>
    )}
  </div>
);

export const VaultOverviewStat = observer(() => {
  const { vaultStore } = Store;
  const { vaultDetails } = vaultStore;
  const [mobile] = useState(isMobile(window.navigator).any);
  const { enabled: miningEnabled, baseApy, miningApy, miningRate } = useVaultMiningApy(vaultDetails.address);
  const displaySupplyApy = miningEnabled
    ? new BigNumber(vaultDetails.apy || 0).plus(miningApy?.total || 0).toString()
    : vaultDetails.apy;

  return (
    <div className="stats-line">
      <StatItem
        label={
          <>
            {intl.get('jlv2.vault.supply_apy1')}
            {miningEnabled && (
              <ApyBreakdownTooltip baseApy={baseApy} miningApy={miningApy} iconClassName="fire-v2-small" />
            )}
          </>
        }
        value={formatApyRate(displaySupplyApy)}
        // labelTooltipContent={intl.get('jlv2.vault.tips1')}
        fire={!miningEnabled && vaultDetails?.tags?.includes('fire')}
        mobileLabelTooltipPosition={mobile ? 'topLeft' : null}
      />

      <StatItem
        label={intl.get('jlv2.vault.total_supply1')}
        value={formatCompactFiatValue(vaultDetails.tvlInUsd)}
        valueTooltipContent={formatTokenAmount(vaultDetails.tvl, vaultDetails.assetSymbol)}
      />

      <StatItem
        label={intl.get('jlv2.vault.interest_income')}
        value={formatFiatValue(vaultDetails.interestInUsd)}
        labelTooltipContent={intl.get('jlv2.vault.tips2')}
        valueTooltipContent={formatTokenAmount(vaultDetails.interest, vaultDetails.assetSymbol)}
        mobileLabelTooltipPosition={mobile ? 'topLeft' : null}
      />

      <StatItem
        label={intl.get('jlv2.home.liquidity')}
        value={formatCompactFiatValue(vaultDetails.liquidityInUsd)}
        labelTooltipContent={intl.get('jlv2.vault.tips3')}
        valueTooltipContent={formatTokenAmount(vaultDetails.liquidity, vaultDetails.assetSymbol)}
        mobileLabelTooltipPosition={mobile ? 'topRight' : null}
      />

      {miningEnabled && miningRate && (Number(miningRate.usdd) > 0 || Number(miningRate.trx) > 0) && (
        <StatItem
          label={intl.get('mining.rate.title')}
          value={
            <>
              {Number(miningRate.usdd) > 0 && formatTokenAmount(miningRate.usdd, 'USDD')}
              {Number(miningRate.usdd) > 0 && Number(miningRate.trx) > 0 && ' + '}
              {Number(miningRate.trx) > 0 && formatTokenAmount(miningRate.trx, 'TRX')}
            </>
          }
        />
      )}
    </div>
  );
});
