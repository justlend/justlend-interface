import React from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import Store from '../../../stores';
import { formatTokenAmount, formatFiatValue, formatApyRate } from '../../../utils/formatters';
import { BigNumber } from '../../../utils/helper';

export const MyMarketPosition = observer(() => {
  const { marketV2: marketStore, network, dashboardStore } = Store;
  const { isConnected } = network;
  const { myPosition, marketDetails, setActionTab } = marketStore;

  if (!isConnected || !myPosition) return null;

  const handleToAction = action => {
    setActionTab(action);

    if (isMobile(window.navigator).any) {
      const actionBox = document.getElementById('marketAction');
      if (actionBox) {
        const elementRect = actionBox.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();
        const distance = elementRect.top - bodyRect.top;

        window.scrollTo({
          top: distance - 100,
          left: 0,
          behavior: 'smooth'
        });
      }
    }
  };

  const riskCheck = risk => {
    const riskValue = BigNumber(risk).times(100);
    let riskText = intl.get('jlv2.market.minimal');
    let color = 'low';
    if (BigNumber(riskValue).eq(0)) {
      color = 'low';
      riskText = intl.get('jlv2.market.minimal');
      // } else if (riskValue.lt(35)) {
      //   color = 'low';
      //   riskText = intl.get('jlv2.market.minimal');
    } else if (riskValue.lt(60)) {
      color = 'low';
      riskText = intl.get('jlv2.market.minimal');
    } else if (riskValue.lt(80)) {
      color = 'medium';
      riskText = intl.get('jlv2.market.moderate');
    } else if (riskValue.gte(80)) {
      color = 'high';
      riskText = intl.get('jlv2.market.high');
    }
    return { riskText, color };
  };

  return (
    <div className="my-market-position-panel panel-v2">
      <div className="panel-title">
        {intl.get('jlv2.market.my_postion')}{' '}
        {marketDetails?.collateralSymbol && marketDetails?.borrowSymbol ? (
          <span className="panel-subtitle">
            {intl.get('jlv2.market.in_market_name')}
            {}
            {marketDetails?.marketName}
          </span>
        ) : null}
      </div>
      <div className="position-section">
        <div className="position-item">
          <div className="label">{intl.get('jlv2.market.borrowing1')}</div>
          <div className="amount-token">{formatTokenAmount(myPosition.borrowAmount, myPosition.borrowSymbol)}</div>
          <div className="amount-usd">≈ {formatFiatValue(myPosition.borrowUsd)}</div>
        </div>
        <div className="position-item">
          <div className="label">{intl.get('jlv2.market.collateraling1')}</div>
          <div className="amount-token">
            {formatTokenAmount(myPosition.collateralAmount, myPosition.collateralSymbol)}
          </div>
          <div className="amount-usd">≈ {formatFiatValue(myPosition.collateralUsd)}</div>
        </div>
      </div>
      <div className="item-btns">
        <div
          className="item-btn btn-v2 btn-repay"
          onClick={() => {
            dashboardStore.flashingEnd();
            handleToAction('repay_redeem');
            dashboardStore.flashingAnimation();
          }}
        >
          {intl.get('jlv2.market.repay')}
        </div>
        <div className="item-line"></div>
        <div
          className="item-btn btn-v2 btn-repay"
          onClick={() => {
            dashboardStore.flashingEnd();
            handleToAction('repay_redeem');
            dashboardStore.flashingAnimation();
          }}
        >
          {intl.get('jlv2.market.redeem')}
        </div>
      </div>
      {isMobile(window.navigator).any ? (
        <div className="sub-detals">
          <div className="sd-column">
            <div>
              <div className="sd-title">{intl.get('jlv2.market.borrow_apy')}</div>
              <div className="sd-value">{formatApyRate(myPosition.borrowApy)}</div>
            </div>
            <div>
              <div className="sd-title">{intl.get('jlv2.market.daily_interest1')}</div>
              <div className="sd-value">{formatTokenAmount(myPosition.dailyInterest, myPosition.borrowSymbol)}</div>
            </div>
          </div>
          <div className="sd-column">
            <div>
              <div className="sd-title">{intl.get('jlv2.market.ltv_lltv')}</div>
              <div className="sd-value">
                {formatApyRate(myPosition.ltv)} / {formatApyRate(myPosition.lltv)}
              </div>
            </div>
            <div>
              <div className="sd-title">{intl.get('jlv2.market.risk_level1')}</div>
              <div className={`sd-value risk-value ${riskCheck(myPosition.risk).color}`}>
                {formatApyRate(myPosition.risk)?.replace('%', '')} {riskCheck(myPosition.risk).riskText}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="sub-detals">
          <div>
            <div className="sd-title">{intl.get('jlv2.market.borrow_apy')}</div>
            <div className="sd-value">{formatApyRate(myPosition.borrowApy)}</div>
          </div>
          <div>
            <div className="sd-title">{intl.get('jlv2.market.daily_interest1')}</div>
            <div className="sd-value">{formatTokenAmount(myPosition.dailyInterest, myPosition.borrowSymbol)}</div>
          </div>
          <div>
            <div className="sd-title">{intl.get('jlv2.market.ltv_lltv')}</div>
            <div className="sd-value">
              {formatApyRate(myPosition.ltv)} / {formatApyRate(myPosition.lltv)}
            </div>
          </div>
          <div>
            <div className="sd-title">{intl.get('jlv2.market.risk_level1')}</div>
            <div className={`sd-value risk-value ${riskCheck(myPosition.risk).color}`}>
              {formatApyRate(myPosition.risk)?.replace('%', '')} {riskCheck(myPosition.risk).riskText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
