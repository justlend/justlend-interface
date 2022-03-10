import React, { useEffect, useRef } from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { formatNumber, BigNumber, getPercent, renderPercent } from '../utils/helper';
import Config from '../config';
import { Tooltip } from 'antd';
import '../assets/css/circle.scss';
import Triangle from '../assets/images/Triangle.svg';
@inject('network')
@inject('lend')
@observer
class Account extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      angle: -0.25,
      hoverStatus: false
    };
  }

  canvasText = () => {
    let accRisk = BigNumber(this.props.lend.totalBorrowUsd).div(this.props.lend.borrowLimit).times(100);
    let riskText = intl.get('index.acc_lowrisk');
    let color = 'green';
    if (accRisk.lt(35)) {
      color = 'green';
      riskText = intl.get('index.acc_lowrisk');
    } else if (accRisk.lt(60)) {
      color = 'blue';
      riskText = intl.get('index.acc_mediumrisk');
    } else if (accRisk.lt(80)) {
      color = 'purple';
      riskText = intl.get('index.acc_highrisk');
    } else if (accRisk.gte(80)) {
      color = 'red';
      riskText = intl.get('index.acc_veryhighrisk');
    }
    return (
      <div className={color}>
        <p className="black">
          {renderPercent(getPercent(this.props.lend.totalBorrowUsd, this.props.lend.borrowLimit), {
            needPerSymbol: false
          })}
        </p>
        <p className="fz20">{riskText}</p>
      </div>
    );
  };

  componentDidMount = () => { };

  showLoginModal = e => {
    this.props.network.connectWallet();
  };

  getRiskValue = () => {
    const { borrowLimit, totalBorrowUsd } = this.props.lend;
    let acc_risk = formatNumber(BigNumber(totalBorrowUsd).div(borrowLimit).div(2), 4);
    let res = Number(acc_risk) - 0.25;
    if (res > 0.25) {
      res = 0.25;
    } else if (res < -0.25) {
      res = -0.25;
    }
    return res;
  };

  canvasHover = () => {
    let netAPY = BigNumber(this.props.lend.netAPY).times(100);
    return (
      <>
        <p className="fz20 with-color">{intl.get('index.acc_apy')}</p>
        <p className="black with-color">
          {netAPY.eq(0)
            ? 0
            : netAPY.gt(0)
              ? netAPY.gt(0.01)
                ? formatNumber(netAPY, 2, { cutZero: false, per: true })
                : 0.01
              : netAPY.lt(0) && netAPY.lt(-0.01)
                ? formatNumber(netAPY, 2, { cutZero: false, per: true })
                : -0.01}
          %
        </p>
      </>
    );
  };

  getTotalDeposit = () => {
    const { userDepositDataSource } = this.props.lend;
    let totalDeposit = BigNumber(0);
    if (userDepositDataSource && userDepositDataSource.length > 0) {
      userDepositDataSource.map((item, index) => {
        totalDeposit = totalDeposit.plus(item.deposited_usd);
      });
      let res = formatNumber(totalDeposit, 8, {
        cutZero: false,
        miniText: '0.00000001',
        miniTextValue: 0,
        round: true,
        needDolar: true
      });
      return (
        <>
          <span className="fs24 fw500 c-0F134F">
            {totalDeposit !== '--' && !BigNumber(totalDeposit).eq(0)
              ? res.split('.')[0] + (res.split('.')[1] && res.split('.')[1].length > 0 ? '.' : '')
              : totalDeposit === '--' && '--'}
          </span>
          <span className="fs14 c-0F134F">{totalDeposit !== '--' && res.split('.')[1]}</span>
        </>
      );
    } else if (userDepositDataSource) {
      return (
        <>
          <span className="fs24 fw500 c-0F134F">{'$0'}</span>
          {/* <span className="fs14 c-0F134F">{'01'}</span> */}
        </>
      );
    } else {
      return (
        <>
          <span className="fs24 fw500 c-0F134F">{'--'}</span>
          {/* <span className="fs14 c-0F134F">{'01'}</span> */}
        </>
      );
    }
  };

  getTotalLend = () => {
    const { totalBorrowUsd } = this.props.lend;
    let res = formatNumber(totalBorrowUsd, 8, {
      cutZero: false,
      miniText: '0.00000001',
      miniTextValue: 0,
      round: true,
      needDolar: true
    });
    return (
      <>
        <span className="fs24 fw500 c-0F134F">
          {totalBorrowUsd !== '--'
            ? res.split('.')[0] + (res.split('.')[1] && res.split('.')[1].length > 0 ? '.' : '')
            : '--'}
        </span>
        <span className="fs14 c-0F134F">{totalBorrowUsd !== '--' && res.split('.')[1]}</span>
      </>
    );
  };

  getTotalMint = () => {
    const { inFreeze, transferringSoon } = this.props.lend;
    let totalMiningrewards = BigNumber(inFreeze).plus(transferringSoon);
    if (totalMiningrewards.gt(0)) {
      let res = formatNumber(totalMiningrewards, 8, {
        cutZero: false,
        miniText: '0.00000001',
        round: true,
        needDolar: true
      });
      return (
        <>
          <span className="fs24 fw500 c-0F134F">
            {res.split('.')[0] + (res.split('.')[1] && res.split('.')[1].length > 0 ? '.' : '')}
          </span>
          {res.split('.')[1] && <span className="fs14 c-0F134F">{res.split('.')[1]}</span>}
        </>
      );
    } else if (totalMiningrewards.eq(0)) {
      return <span className="fs24 fw500 c-0F134F">{'$0'}</span>;
    } else {
      return <span className="fs24 fw500 c-0F134F">{'--'}</span>;
    }
  };

  getTotalMortgage = () => {
    const { userDepositDataSource } = this.props.lend;
    let totalMortgage = BigNumber(0);
    if (userDepositDataSource && userDepositDataSource.length > 0) {
      userDepositDataSource.map((item, index) => {
        if (item.account_entered) {
          totalMortgage = totalMortgage.plus(BigNumber(item.deposited_usd));
        }
      });
    }
    return formatNumber(totalMortgage, 3, { miniText: 0.001, needDolar: true });
  };

  setHover = () => {
    this.setState({
      hoverStatus: true
    });
  };

  setLeave = () => {
    this.setState({
      hoverStatus: false
    });
  };

  render() {
    const { isConnected, multyRealStart } = this.props.network;
    const { borrowLimit, inFreeze, transferringSoon } = this.props.lend;
    const { hoverStatus } = this.state;
    let totalMiningrewards = BigNumber(inFreeze).plus(transferringSoon);
    return (
      <div className="account-container">
        <div className="flexB title">
          <span className="content">{intl.get('index.acc_title')}</span>
          <Tooltip title={intl.getHTML('index.acc_helphover')} arrowPointAtCenter placement="bottomRight">
            <span className="tooltip-icon"></span>
          </Tooltip>
        </div>
        <div className="canvasBox">
          <div className="ellipse-color">
            <img src={Triangle} className="Triangle" style={{ transform: `rotate(${this.getRiskValue()}turn)` }} />
            {isConnected ? (
              <div
                className="canvas-text"
                onMouseOver={() => {
                  this.setHover();
                }}
                onMouseLeave={() => {
                  this.setLeave();
                }}
              >
                {hoverStatus ? this.canvasHover() : this.canvasText()}
              </div>
            ) : (
              <div
                className="canvas-text"
                onClick={e => {
                  this.showLoginModal(e);
                }}
              >
                <p className="not-connect">{intl.get('index.acc_notconnected')}</p>
                <p className="big">--</p>
              </div>
            )}
          </div>
        </div>
        {isConnected && (
          <div className="countDatas">
            <div className="fs12 c-84869E">{intl.get('index.acc_totalsupply')}</div>
            <div className="value mb16">{this.getTotalDeposit()}</div>
            <div className="fs12 c-84869E">{intl.get('index.acc_totalborrow')}</div>
            <div className="value">{this.getTotalLend()}</div>
            <div className="more">
              {multyRealStart ? (
                <>
                  <Tooltip
                    overlayClassName="tool-top-right"
                    placement="topRight"
                    title={intl.get('index.acc_rewards_hover')}
                  >
                    <div className="fs12 c-84869E with-icon">{intl.get('index.my_miningrewards')}</div>
                  </Tooltip>
                  {totalMiningrewards > 0 ? (
                    <Tooltip
                      placement="bottomLeft"
                      title={
                        <div className="info-tooltip">
                          <div>
                            {intl.get('index.my_miningrewards_soon')} :{' '}
                            {formatNumber(transferringSoon, 3, { miniText: 0.001, needDolar: true })}
                          </div>
                          <div>
                            {intl.get('index.my_miningrewards_freeze')} :{' '}
                            {formatNumber(inFreeze, 3, { miniText: 0.001, needDolar: true })}
                          </div>
                        </div>
                      }
                    >
                      <div className="value">{this.getTotalMint()}</div>
                    </Tooltip>
                  ) : (
                    <div className="value">{this.getTotalMint()}</div>
                  )}
                </>
              ) : (
                <>
                  <p className="mb10">
                    <span className="fs12 c-84869E">{intl.get('index.acc_maxborrow')}</span>
                    <span className="fs14 fw500 c-0F134F">
                      {formatNumber(borrowLimit, 3, { miniText: 0.001, needDolar: true })}
                    </span>
                  </p>
                  <p className="mb0">
                    <span className="fs12 c-84869E">{intl.get('index.acc_pledge')}</span>
                    <span className="fs14 fw500 c-0F134F">{this.getTotalMortgage()}</span>
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Account;
