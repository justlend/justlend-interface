// src/components/JLv2/Market/MarketHeader.jsx
import React, { useMemo } from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Link } from 'react-router-dom';
import { Tooltip } from 'antd';
import Store from '../../../stores';
import {
  formatApyRate,
  formatCompactFiatValue,
  formatFiatValue,
  formatTokenAmount,
  isTrxToken
} from '../../../utils/formatters';
import { clickToToken20, formatNumber } from '../../../utils/helper';
import { getIconsJLv2 } from '../../../utils/constant';

const StatItem = ({ label, value, labelTooltipContent, valueTooltipContent, isMobile }) => (
  <div className="stat-item">
    <div className="label">
      {label}
      {labelTooltipContent && (
        <Tooltip
          trigger={isMobile ? ['click'] : ['hover']}
          overlayClassName="j-tooltip-dropdown"
          title={labelTooltipContent}
          placement={isMobile ? 'topLeft' : 'top'}
          arrowPointAtCenter
        >
          <span className="j-tooltip-icon j-info-icon ml-4"></span>
        </Tooltip>
      )}
    </div>
    {valueTooltipContent ? (
      <Tooltip
        trigger={isMobile ? ['click'] : ['hover']}
        overlayClassName="j-tooltip-dropdown"
        title={valueTooltipContent}
        placement="bottom"
        arrowPointAtCenter
      >
        <div className="value value-tooltip">{value}</div>
      </Tooltip>
    ) : (
      <div className="value">{value}</div>
    )}
  </div>
);

export const MarketHeader = observer(() => {
  const { marketV2: marketStore, dashboardStore } = Store;
  const { marketDetails } = marketStore;
  const isMobileDevice = useMemo(() => isMobile(window.navigator).any, []);

  if (!marketDetails) return null;

  const { collateralPrice, borrowPrice, collateralSymbol, borrowSymbol } = marketDetails;
  const price = collateralPrice / borrowPrice;

  return (
    <>
      <div className="return-back-element">
        <Link onClick={() => dashboardStore.setHomeSearchparam('borrow')} className="return-back" to="homeNew">
          {intl.get('jlv2.back_to_home')}
        </Link>
      </div>
      <div className="panel market-header">
        <div className="light-token">
          <div className={'light-token-left ' + marketDetails.borrowSymbol?.toLowerCase()}></div>
          <div className={'light-token-right ' + marketDetails.collateralSymbol?.toLowerCase()}></div>
        </div>
        <div className="header-content-left">
          {isMobileDevice ? (
            <div className="borrow-header-tokens">
              <div className="borrow-header-token">
                <div className="token-profile">
                  <div>
                    <img className="token-img" src={getIconsJLv2(marketDetails.borrowSymbol)} />
                    <div className="token-name">{marketDetails.borrowSymbol}</div>
                  </div>
                  <div>
                    <img className="token-img" src={getIconsJLv2(marketDetails?.collateralSymbol)} />
                    <div className="token-name">{marketDetails?.collateralSymbol}</div>
                  </div>
                </div>
                <div className="borrow-token-tag">
                  <div className="token-tag">~{intl.get('jlv2.market.borrowed_amount')}</div>
                  <div className="token-tag">~{intl.get('jlv2.market.collateral')}</div>
                </div>
              </div>

              <div className="borrow-market-name">
                <div className="market-title">
                  {marketDetails.marketName || '--'}
                  <span className="borrow-v2"></span>
                </div>
                <div className="tronscan-links">
                  <div
                    className="to-tronscan"
                    onClick={() =>
                      clickToToken20(marketDetails.borrowAddress, 'marketInfo', isTrxToken(marketDetails.borrowAddress))
                    }
                  >
                    {marketDetails.borrowSymbol} {intl.get('jlv2.market.symbol_token')}
                    <span className="to-tronscan-icon" to=""></span>
                  </div>
                  <div
                    className="to-tronscan"
                    onClick={() =>
                      clickToToken20(
                        marketDetails.collateralAddress,
                        'marketInfo',
                        isTrxToken(marketDetails.collateralAddress)
                      )
                    }
                  >
                    {marketDetails.collateralSymbol} {intl.get('jlv2.market.symbol_token')}
                    <span className="to-tronscan-icon" to=""></span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="borrow-header-tokens">
              <div className="borrow-header-token">
                <div>
                  <img className="token-img" src={getIconsJLv2(marketDetails.borrowSymbol)} />
                  <div className="token-name">{marketDetails.borrowSymbol}</div>
                </div>
                <div>
                  <img className="token-img" src={getIconsJLv2(marketDetails?.collateralSymbol)} />
                  <div className="token-name">{marketDetails?.collateralSymbol}</div>
                </div>
              </div>
              <div className="borrow-token-tag">
                <div className="token-tag">~{intl.get('jlv2.market.borrowed_amount')}</div>
                <div className="token-tag">~{intl.get('jlv2.market.collateral')}</div>
              </div>
              <div className="borrow-market-name">
                <div className="market-title">
                  {marketDetails.marketName || '--'}
                  <span className="borrow-v2"></span>
                </div>
                <div className="tronscan-links">
                  <div
                    className="to-tronscan"
                    onClick={() =>
                      clickToToken20(marketDetails.borrowAddress, 'marketInfo', isTrxToken(marketDetails.borrowAddress))
                    }
                  >
                    {marketDetails.borrowSymbol} {intl.get('jlv2.market.symbol_token')}
                    <span className="to-tronscan-icon" to=""></span>
                  </div>
                  <div
                    className="to-tronscan"
                    onClick={() =>
                      clickToToken20(
                        marketDetails.collateralAddress,
                        'marketInfo',
                        isTrxToken(marketDetails.collateralAddress)
                      )
                    }
                  >
                    {marketDetails.collateralSymbol} {intl.get('jlv2.market.symbol_token')}
                    <span className="to-tronscan-icon" to=""></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="stats-line">
            <StatItem
              label={intl.get('jlv2.market.borrow_apy1')}
              value={formatApyRate(marketDetails.borrowApy)}
              isMobile={isMobileDevice}
            />
            <StatItem
              label={intl.get('jlv2.market.market_size')}
              value={formatCompactFiatValue(marketDetails.marketSizeUSD)}
              valueTooltipContent={formatTokenAmount(marketDetails.marketSize, marketDetails.borrowSymbol)}
              isMobile={isMobileDevice}
            />
            <StatItem
              label={intl.get('jlv2.market.liquidity')}
              labelTooltipContent={intl.get('jlv2.market.tips1')}
              value={formatCompactFiatValue(marketDetails.liquidityUSD)}
              valueTooltipContent={formatTokenAmount(marketDetails.liquidity, marketDetails.borrowSymbol)}
              isMobile={isMobileDevice}
            />
            <StatItem
              label={intl.get('jlv2.market.current_utilization')}
              value={`${formatApyRate(marketDetails.currentUtilizationRate)} / ${formatApyRate(
                marketDetails.targetUtilizationRate
              )}`}
              isMobile={isMobileDevice}
            />
            <StatItem
              label={intl.get('jlv2.market.lltv')}
              value={formatApyRate(marketDetails.lltv)}
              labelTooltipContent={intl.get('jlv2.market.tips2')}
              isMobile={isMobileDevice}
            />
            <StatItem
              label={intl.get('jlv2.market.price')}
              value={`${collateralSymbol || '-'} / ${borrowSymbol || '-'} = ${formatTokenAmount(
                price || '-',
                '',
                0.000001
              )}`}
              valueTooltipContent={
                <div className="flex-center">
                  <div>{`${collateralSymbol || '-'}: ${formatFiatValue(collateralPrice)}`}</div>
                  {' 丨 '}
                  <div>{`${borrowSymbol || '-'}: ${formatFiatValue(borrowPrice)}`}</div>
                </div>
              }
              isMobile={isMobileDevice}
            />
          </div>
        </div>
      </div>
    </>
  );
});
