import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react';
import Stores from '../../../stores';
import { formatFiatValue, formatApyRate } from '../../../utils/formatters';
import { BigNumber } from '../../../utils/helper';
import { HistoricalChart } from './HistoricalChart';
import Config from '../../../config';

export const BorrowingAndChart = observer(props => {
  const { dashboardStore } = Stores;
  const [timeFrame, setTimeFrame] = useState('1D'); // '1D', '7D', '1M'
  const [riskValue, setRiskValue] = useState(0);
  const [riskList, setRiskList] = useState([]);
  const [rotatePointer, setRotatePointer] = useState(0);
  const { positionData, setHomeSearchparam, setMyMarketFold, flashingAnimation } = dashboardStore;

  useEffect(() => {
    const unit = 180 / 100;
    if (BigNumber(riskValue).gt(100)) {
      setRotatePointer('90deg');
    } else {
      setRotatePointer(-90 + unit * riskValue + 'deg');
    }
  }, [riskValue]);

  useEffect(() => {
    if (!positionData) return;
    const data = positionData.markets
      ? positionData.markets.map(market => {
          const risk = new BigNumber(market.health).times(100);
          return risk.toNumber();
        })
      : [];
    const list = data.filter(item => item >= 80);

    setRiskList(list);
    setRiskValue(data.length ? Math.max(...data) : 0);
  }, [positionData?.markets]);

  if (!positionData) {
    return <div className="borrowing-chart-card">{intl.get('jlv2.home.loading')}...</div>;
  }

  const riskColor = riskValue >= 80 ? ' red' : riskValue >= 60 && riskValue < 80 ? ' yellow' : '';
  const showV1Banner = !BigNumber(props.totalAssetsV1).lte(0) && positionData.borrowNew;

  return (
    <>
      <div className={'borrowing-chart-card' + (showV1Banner ? ' has-v1-banner' : '')}>
        <div className="borrowing-summary">
          <div className="summary-data summary-left">
            <div className="flex-center">
              <div>
                <div className="sd-title preblock c-3D2EB8 home-borrow-title">
                  {intl.get('jlv2.home.borrowed')}
                  <div className="highest-tag">
                    <div className={'highest-img' + riskColor}>
                      <div className="highest-pointer" style={{ 'transform': 'rotate(' + rotatePointer + ')' }}></div>
                    </div>
                    <div className="highest-indicator">
                      <div>{intl.get('jlv2.home.highest_risk')}</div>
                      <div className={riskColor}>{formatApyRate(riskValue, true)}</div>
                    </div>
                  </div>
                </div>
                <div
                  className="sd-value usd-item"
                  onClick={() => {
                    setHomeSearchparam('borrow');
                    setMyMarketFold(true);
                    flashingAnimation();
                  }}
                >
                  {formatFiatValue(positionData.totalBorrowUsd)}
                  <em className="sd-arrow"></em>
                </div>
              </div>
              {/* <div className="highest-tag">
                <div className={'highest-img' + riskColor}>
                  <div className="highest-pointer" style={{ 'transform': 'rotate(' + rotatePointer + ')' }}></div>
                </div>
                <div className="highest-indicator">
                  <div>{intl.get('jlv2.home.highest_risk')}</div>
                  <div className={riskColor}>{formatApyRate(riskValue, true)}</div>
                </div>
              </div> */}
            </div>
            <div className={'sd-subtitle ' + riskColor}>
              {intl.getHTML(
                riskList.length ? 'jlv2.home.high_risk_from_market' : 'jlv2.home.no_high_risk_from_market',
                {
                  amount: riskList.length || 0,
                  marketAmount: positionData.markets?.length || 0
                }
              )}
            </div>
            {!BigNumber(props.totalAssetsV1).lte(0) && positionData.borrowNew ? (
              <a className="banner-diff-btn" href={Config.portalLink + '?scroll=whatsnew'} target="_blank">
                {intl.get('jlv2.banner.diff')}
              </a>
            ) : (
              <div className="position-details borrow-details">
                <div className="detail-item">
                  <span className="label  preblock c-ED9938">
                    {intl.getHTML('jlv2.home.collateral_amount', { amount: positionData.collateralCount || 0 })}
                  </span>
                  <span
                    className="value usd-item"
                    onClick={() => {
                      setHomeSearchparam('borrow');
                      flashingAnimation();
                    }}
                  >
                    {formatFiatValue(positionData.totalCollateralUsd)}
                    <em className="sd-arrow sd-arrow-small"></em>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">{intl.get('jlv2.home.net_borrow_apy')}</span>
                  <span className="value">{formatApyRate(positionData.netBorrowRate)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="home-chart-section">
        <div className="home-chart-controls">
          {}
          <div className="active">{intl.get('jlv2.home.one_day')}</div>
          {/* <div onClick={() => setTimeFrame('1D')} className={timeFrame === '1D' ? 'active' : ''}>
            24h
          </div>
          <button onClick={() => setTimeFrame('7D')} className={timeFrame === '7D' ? 'active' : ''}>
            7D
          </button>
          <button onClick={() => setTimeFrame('1M')} className={timeFrame === '1M' ? 'active' : ''}>
            1M
          </button> */}
        </div>
        <HistoricalChart timeFrame={timeFrame} />
      </div>
    </>
  );
});
