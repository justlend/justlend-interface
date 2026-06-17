// src/components/JLv2/Vault/MarketAllocationList.jsx
import React, { useState } from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import isMobile from 'ismobilejs';
import { useHistory } from 'react-router-dom';
import Store from '../../../stores';
import { formatTokenAmount, formatFiatValue, formatApyRate, formatCompactFiatValue } from '../../../utils/formatters';
import { emptyReactNodeNew } from '../../../utils/helper';
import { getIconsJLv2 } from '../../../utils/constant';

export const MarketAllocationList = observer(() => {
  const { vaultStore } = Store;
  const [mobile] = useState(isMobile(window.navigator).any);
  const history = useHistory();

  const allocations = vaultStore.sortedMarketAllocations;

  return (
    <div className="funding-list panel-v2">
      <div className="panel-title vault-list">{intl.get('jlv2.vault.vault_allocation')}</div>
      <div className="mobile-list-wrap">
        <div className="list-header">
          <div className="col-vault">
            {intl.get('jlv2.vault.market_cb')}
            <Tooltip
              title={intl.get('jlv2.vault.market_cb_tooltip')}
              placement="top"
              trigger={mobile ? ['click'] : ['hover']}
              arrowPointAtCenter
              overlayClassName='j-tooltip-dropdown'
            >
              <span className="j-tooltip-icon j-info-icon ml-4"></span>
            </Tooltip>
          </div>
          <div className="col-creator">
            {intl.get('jlv2.vault.allocation')}
            <Tooltip
              trigger={mobile ? ['click'] : ['hover']}
              overlayClassName="j-tooltip-dropdown"
              title={intl.get('jlv2.vault.tips4')}
              placement="top"
              arrowPointAtCenter
            >
              <span className="j-tooltip-icon j-info-icon ml-4"></span>
            </Tooltip>
          </div>
          <div className="col-allocation-percent">
            {intl.get('jlv2.vault.allocation_percent')}
            <Tooltip
              title={intl.get('jlv2.vault.allocation_tip')}
              placement="top"
              trigger={mobile ? ['click'] : ['hover']}
              arrowPointAtCenter
              overlayClassName='j-tooltip-dropdown'
            >
              <span className="j-tooltip-icon j-info-icon ml-4"></span>
            </Tooltip>
          </div>
          <div className="col-allocation-usd fdr">
            {intl.get('jlv2.vault.supply_cap')}
            <Tooltip
              trigger={mobile ? ['click'] : ['hover']}
              overlayClassName="j-tooltip-dropdown"
              title={intl.get('jlv2.vault.tips5')}
              placement={mobile ? "topLeft" : "top"}
              arrowPointAtCenter
            >
              <span className="j-tooltip-icon j-info-icon ml-4"></span>
            </Tooltip>
          </div>
        </div>
        <div className="list-body">
          {allocations.length
            ? allocations.map(item => {
                const { marketId, collateralToken, allocation, borrowToken, supplyCap, noMoreAllocation } = item;
                return (
                  <div className="list-row" key={marketId} onClick={() => history.push(`/marketV2?id=${marketId}`)}>
                    <div className="col-vault">
                      <div className="col-image">
                        <img src={getIconsJLv2(collateralToken?.symbol)} alt={collateralToken?.symbol} />
                        <img src={getIconsJLv2(borrowToken?.symbol)} alt={borrowToken?.symbol} />
                      </div>
                      <div className="col-tokens">
                        <span>{collateralToken?.symbol}</span>
                        <span> / {borrowToken?.symbol}</span>
                      </div>
                      {
                        noMoreAllocation && (
                          <Tooltip
                            trigger={mobile ? ['click'] : ['hover']}
                            overlayClassName="j-tooltip-dropdown"
                            title={intl.get('jlv2.vault.no_more_allocation')}
                            placement="top"
                            arrowPointAtCenter
                          >
                            <span className='tip-icon' />
                          </Tooltip>
                        )
                      }
                    </div>
                    <div className="col-creator col-db-row-start">
                      {formatCompactFiatValue(allocation.amountInUsd)}
                      <span className="allocation-token">
                        {formatCompactFiatValue(allocation?.amount, '')} {borrowToken?.symbol}
                      </span>
                    </div>
                    <div className="col-allocation-percent">{formatApyRate(allocation?.percentage, true)}</div>
                    <div className="col-allocation-usd">
                      {formatCompactFiatValue(supplyCap?.amountInUsd)}
                      <span className="allocation-token">
                        {formatCompactFiatValue(supplyCap?.amount, '')} {borrowToken?.symbol}
                      </span>
                    </div>
                  </div>
                );
              })
            : emptyReactNodeNew()}
        </div>
      </div>
    </div>
  );
});
