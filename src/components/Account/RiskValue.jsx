import React, { useState } from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import NetValue from './NetValue';
import Config from '../../config';
import Stores from '../../stores';
import { BigNumber, renderPercent } from '../../utils/helper';
import { gradient } from '../../utils/calcColor';
import Dashboard from './Dashboard';

const RiskValue = observer(({ isLoading }) => {
  const { network, user, market, lend } = Stores;

  const [riskVisible, setRiskVisible] = useState(window.localStorage.getItem('riskVisible') || 'true');

  const showLoginModal = e => {
    network.connectWalletV2();
  };

  let riskTip = '';
  const { isConnected } = network;
  const { theme } = lend;
  const { trxPrice, balanceInfo } = market;
  const { risk, userDepositDataSource: supplyList, userLendDataSource: borrowingList } = user;
  const isWhite = theme === 'white';

  const recommendStr = window.localStorage.getItem('recommandToken');
  let recommandToken = {};
  if (recommendStr) recommandToken = JSON.parse(recommendStr);

  const userBalanceInfo = Object.values(balanceInfo);
  const userBalanceUsdMoreThan10 = {};

  if (userBalanceInfo?.length > 0) {
    userBalanceInfo.map(item => {
      let balanceUsd = BigNumber(
        item?.balanceForTrx
          ?.div(Config.tokenDefaultPrecision)
          .div(Config.defaultPrecision)
          .times(trxPrice)
          .div(Config.tokenDefaultPrecision)
      );
      if (item?.tokenAddress === Config.usdd.token) {
        balanceUsd = item?.balance?.div(Config.tokenDefaultPrecision);
      }
      if (balanceUsd?.gt(10)) {
        userBalanceUsdMoreThan10[item.tokenAddress] = {
          balanceUsd
        };
        if (Object.keys(recommandToken)?.length === 0 || balanceUsd?.gt(recommandToken?.balanceUsd)) {
          recommandToken = {
            tokenSymbol: item.tokenSymbol,
            balanceUsd
          };
          window.localStorage.setItem('recommandToken', JSON.stringify(recommandToken));
        }
      }
    });
    if (Object.keys(userBalanceUsdMoreThan10).length === 0) {
      recommandToken = {};
      window.localStorage.removeItem('recommandToken');
    }
  } else {
    recommandToken = {};
    window.localStorage.removeItem('recommandToken');
  }

  let accRisk = BigNumber(risk).isNaN() ? BigNumber(0) : BigNumber(risk).times(100);
  let riskText = intl.get('index.acc_lowrisk');
  let color = 'green';
  if (BigNumber(accRisk).eq(0)) {
    color = 'green';
    riskText = intl.get('index.acc_lowrisk');
  } else if (accRisk.lt(35)) {
    color = 'green';
    riskText = intl.get('index.acc_lowrisk');
  } else if (accRisk.lt(60)) {
    color = 'green';
    riskText = intl.get('index.acc_mediumrisk');
  } else if (accRisk.lt(80)) {
    color = 'blue';
    riskText = intl.get('index.acc_highrisk');
  } else if (accRisk.gte(80)) {
    color = 'red';
    riskText = intl.get('index.acc_veryhighrisk');

    riskTip = intl.get('v2.high_risk_no_token');

    if (BigNumber(riskVisible).gt(0)) {
      const currentTime = Date.now();
      if (BigNumber(currentTime).gt(riskVisible)) {
        window.localStorage.setItem('riskVisible', currentTime);
      }
    } else {
      window.localStorage.setItem('riskVisible', 'true');
    }
  }

  let greenColor = theme === 'white' ? '#18C19F' : '#8FF7E2';
  let blueColor = theme === 'white' ? '#6B9BFF' : '#A0C4FF';
  let redColor = '#FF5266';
  const colorStops = [
    {
      offset: 0, // green start
      color: greenColor
    },
    {
      offset: 0.35, // green linear
      color: greenColor
    },
    {
      offset: 0.55, // to blue
      color: blueColor
    },
    {
      offset: 0.68, // to purple
      color: '#A99FFF'
    },
    {
      offset: 0.8, // to red
      color: redColor
    },
    {
      offset: 1, // red end
      color: redColor
    }
  ];

  const angleAxis = {
    show: false,
    max: (100 * 3) / 2,
    type: 'value',
    startAngle: 210,
    splitLine: {
      show: false
    }
  };

  const angleRange = 240;

  const calcAngle = () => {
    let riskVal = risk;
    if (BigNumber(riskVal).lt(0)) riskVal = 0;
    if (BigNumber(riskVal).gt(1)) riskVal = 1;
    return riskVal * angleRange - 30;
  };

  const calcColor = () => {
    let greenColor = theme === 'white' ? '#6EDEC7' : '#8FF6E2';
    let blueColor = theme === 'white' ? '#59C3FF' : '#9ADBFF';
    let purpleColor = theme === 'white' ? '#7D6FFF' : '#A99FFF';
    let redColor = '#FF5592';

    const colorStops = [
      {
        offset: 0, // green start
        color: greenColor
      },
      {
        offset: 0.35, // green linear
        color: greenColor
      },
      {
        offset: 0.55, // to blue
        color: blueColor
      },
      {
        offset: 0.68, // to purple
        color: purpleColor
      },
      {
        offset: 0.8, // to red
        color: redColor
      },
      {
        offset: 1, // red end
        color: redColor
      }
    ];

    let riskVal = risk;
    if (BigNumber(riskVal).gte(colorStops[4].offset)) return colorStops[5].color;
    if (BigNumber(riskVal).lte(colorStops[1].offset)) return colorStops[0].color;
    // green => blue
    if (BigNumber(riskVal).lt(colorStops[2].offset) && BigNumber(riskVal).gte(colorStops[1].offset)) {
      const colors = gradient(
        colorStops[1].color,
        colorStops[2].color,
        (colorStops[2].offset - colorStops[1].offset) * 100
      );
      const currentIndex = BigNumber(riskVal).minus(colorStops[1].offset).times(100).toFixed(0, 1);
      return colors[currentIndex];
    }
    // blue => purple
    if (BigNumber(riskVal).lt(colorStops[3].offset) && BigNumber(riskVal).gte(colorStops[2].offset)) {
      const colors = gradient(
        colorStops[2].color,
        colorStops[3].color,
        (colorStops[3].offset - colorStops[2].offset) * 100
      );
      const currentIndex = BigNumber(riskVal).minus(colorStops[2].offset).times(100).toFixed(0, 1);
      return colors[currentIndex];
    }
    // purple => red
    if (BigNumber(riskVal).lt(colorStops[4].offset) && BigNumber(riskVal).gte(colorStops[3].offset)) {
      const colors = gradient(
        colorStops[3].color,
        colorStops[4].color,
        (colorStops[4].offset - colorStops[3].offset) * 100
      );
      const currentIndex = BigNumber(riskVal).minus(colorStops[3].offset).times(100).toFixed(0, 1);
      return colors[currentIndex];
    }
  };

  const getNumber = () => {
    const { risk } = user;
    let riskVal = risk;
    let currentNumber = BigNumber(riskVal).times(100);
    if (currentNumber.lt(0)) return 0;
    return currentNumber.toNumber();
  };

  const closeRiskWarningTip = () => {
    setRiskVisible('false');
    window.localStorage.setItem('riskVisible', 'false');
    let accRisk = BigNumber(risk).isNaN() ? BigNumber(0) : BigNumber(risk).times(100);
    if (accRisk.gte(80)) {
      const currentTime = Date.now();
      const futureTime = currentTime + 30 * 24 * 60 * 60 * 1000;

      window.localStorage.setItem('riskVisible', futureTime);
    }
  };

  return (
    <>
      <section className="rist-value">
        <div>
          <div className="account-gauge">
            <div>
              <Tooltip
                overlayClassName={!!isConnected ? 'j-tooltip-dropdown' : 'j-tooltip-dropdown-disconnect'}
                title={intl.getHTML('v2.risk_tip')}
                placement="bottom"
                arrowPointAtCenter
                align={{
                  offset: [0, -40]
                }}
              >
                <Dashboard num={getNumber()} colorStops={colorStops} angleAxis={angleAxis} isWhite={isWhite} />
                <div
                  className="account-dashboard-pointer"
                  style={{
                    transform: `rotate(${calcAngle()}deg)`,
                    background: `${calcColor()}`
                  }}
                ></div>
                {!!isConnected && (
                  <div className="canvas-text">
                    <div className={color}>
                      <p className="black">
                        {BigNumber(risk).isNaN()
                          ? '--'
                          : renderPercent(accRisk, {
                              needPerSymbol: false
                            })}
                      </p>
                      <p className="fz20">{riskText}</p>
                    </div>
                  </div>
                )}
              </Tooltip>
              {!isConnected ? (
                lend.serviceInnerStatus === 'disabled' ? (
                  <Tooltip
                    title={intl.get('season.can_not_connect')}
                    overlayClassName={'j-tooltip-dropdown season ' + (isWhite ? 'white' : '')}
                    arrowPointAtCenter
                    placement={'bottom'}
                  >
                    <div
                      className="canvas-text season"
                      onClick={() => {
                        lend.setNoServiceModalAllVisible(true);
                      }}
                    >
                      <p className="not-connect">{intl.get('index.acc_notconnected')}</p>
                    </div>
                  </Tooltip>
                ) : (
                  <div className="canvas-text" onClick={showLoginModal}>
                    <p className="not-connect">{intl.get('index.acc_notconnected')}</p>
                  </div>
                )
              ) : null}
            </div>

            <NetValue />
          </div>
        </div>
        {riskTip && riskVisible && riskVisible === 'true'
          ? (supplyList?.length > 0 || borrowingList?.length > 0) && (
              <div className="risk-warning-tip">
                <Tooltip overlayClassName="j-tooltip-dropdown" title={riskTip} placement="top" arrowPointAtCenter>
                  <span className="text ellipsis">{riskTip}</span>
                </Tooltip>

                <span className="close" onClick={() => closeRiskWarningTip()}></span>
              </div>
            )
          : isConnected
          ? (supplyList?.length > 0 || borrowingList?.length > 0) && <div className="risk-warning-tip-line"></div>
          : ''}
      </section>
    </>
  );
});

export default RiskValue;
