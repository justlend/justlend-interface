import React from 'react';
import { inject, observer } from 'mobx-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import { Tooltip } from 'antd';
import NetValue from './NetValue';
import Config from '../../../config';
import { BigNumber, renderPercent } from '../../../utils/helper';
import { gradient } from '../../../utils/calcColor';
import Triangle from '../../../assets/images/Triangle.svg';
import Dashboard from './Dashboard';

@inject('network')
@inject('lend')
@observer
class RiskValue extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      riskVisible: window.localStorage.getItem('riskVisible') || 'true'
    };
  }

  componentDidMount() {}

  // value at risk
  getRiskValue = () => {
    // return 0.8; // for test
    // const { borrowLimit, totalBorrowUsdForUSDD } = this.props.lend;
    // let acc_risk = BigNumber(totalBorrowUsdForUSDD).div(borrowLimit).div(2)._toFixed(4);
    const { risk } = this.props.lend;
    let acc_risk = risk;
    if (BigNumber(this.props.lend.borrowLimit).eq(0)) {
      acc_risk = 0;
    }
    let res = Number(acc_risk) - 0.25;
    if (res > 0.25) {
      res = 0.25;
    } else if (res < -0.25) {
      res = -0.25;
    }

    return res;
  };

  showLoginModal = e => {
    this.props.network.connectWalletV2();
  };

  render() {
    let riskTip = '';
    const { isConnected } = this.props.network;
    let { riskVisible } = this.state;

    const {
      risk, // for test
      userDepositDataSource: supplyList,
      userLendDataSource: borrowingList,
      balanceInfo,
      trxPrice,
      theme
    } = this.props.lend;

    const isWhite = theme === 'white';

    // let risk = 0.8; // for test

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
      // Have a deposit, no loan, todo, need test
      // if (supplyList?.length > 0 && (!borrowingList || borrowingList.length === 0)) {

      //   riskTip = intl.get('v2.no_supply_has_token_risk');
      // }
    } else if (accRisk.lt(35)) {
      color = 'green';
      riskText = intl.get('index.acc_lowrisk');
    } else if (accRisk.lt(60)) {
      color = 'green';
      riskText = intl.get('index.acc_mediumrisk');
    } else if (accRisk.lt(80)) {
      color = 'blue';
      riskText = intl.get('index.acc_highrisk');
      // if (Object.keys(recommandToken)?.length > 0) {
      //   riskTip = intl.getHTML('v2.middle_risk_has_token', { symbol: recommandToken.tokenSymbol });
      // }
    } else if (accRisk.gte(80)) {
      color = 'red';
      riskText = intl.get('index.acc_veryhighrisk');
      // if (Object.keys(recommandToken)?.length > 0) {
      //   riskTip = intl.getHTML('v2.high_risk_has_token', { symbol: recommandToken.tokenSymbol });
      // } else {
      //   riskTip = intl.get('v2.high_risk_no_token');
      // }
      riskTip = intl.get('v2.high_risk_no_token');

      if (BigNumber(riskVisible).gt(0)) {
        const currentTime = Date.now();
        if (BigNumber(currentTime).gt(riskVisible)) {
          // riskVisible = currentTime;
          window.localStorage.setItem('riskVisible', currentTime);
        }
      } else {
        // riskVisible = 'true';
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
      // let riskVal = this.getRiskValue();
      const { risk } = this.props.lend;
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

      // let riskVal = this.getRiskValue();
      const { risk } = this.props.lend;
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
        // console.log(colors, colorStops[1].color, colorStops[2].color, currentIndex)
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
      const { risk } = this.props.lend;
      let riskVal = risk;
      let currentNumber = BigNumber(riskVal).times(100);
      if (currentNumber.lt(0)) return 0;
      return currentNumber.toNumber();
    };

    const closeRiskWarningTip = () => {
      this.setState({ riskVisible: 'false' });
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
          {/* <div className="flexSTA"> */}
          {/* <div className="account-gauge flexSTA">
            <Tooltip
              overlayClassName="j-tooltip-dropdown"
              title={intl.get('v2.risk_tip')}
              placement="bottom"
              arrowPointAtCenter
              align={{
                offset: [0, -40]
              }}
            > */}
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
                          {/* {supplyList?.length > 0 || borrowingList?.length > 0
                            ? BigNumber(this.props.lend.borrowLimit).eq(0)
                              ? '0'
                              : BigNumber(accRisk).eq(0)
                              ? '0'
                              : renderPercent(accRisk, {
                                  needPerSymbol: false
                                })
                            : '--'} */}
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
                  this.props.lend.serviceInnerStatus === 'disabled' ? (
                    <Tooltip
                      title={intl.get('season.can_not_connect')}
                      overlayClassName={'j-tooltip-dropdown season ' + (isWhite ? 'white' : '')}
                      arrowPointAtCenter
                      // placement={isMobile(window.navigator).any ? 'bottomLeft' : 'bottom'}
                      placement={'bottom'}
                    >
                      <div
                        className="canvas-text season"
                        onClick={() => {
                          this.props.lend.setData({ noServiceModalAllVisible: true });
                        }}
                      >
                        <p className="not-connect">{intl.get('index.acc_notconnected')}</p>
                      </div>
                    </Tooltip>
                  ) : (
                    <div
                      className="canvas-text"
                      onClick={e => {
                        this.showLoginModal(e);
                      }}
                    >
                      <p className="not-connect">{intl.get('index.acc_notconnected')}</p>
                    </div>
                  )
                ) : (
                  <></>
                )}
              </div>

              <NetValue />
            </div>
            {/* </Tooltip> */}

            {/* <NetValue /> */}
          </div>
          {riskTip && riskVisible && riskVisible === 'true'
            ? (supplyList?.length > 0 || borrowingList?.length > 0) && (
                <div className="risk-warning-tip">
                  <Tooltip
                    overlayClassName="j-tooltip-dropdown"
                    // title={intl.getHTML('depositapy_tip')}
                    title={riskTip}
                    placement="top"
                    arrowPointAtCenter
                  >
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
  }
}

export default RiskValue;
