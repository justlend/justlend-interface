import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import { Tabs, Tooltip } from 'antd';
import CountUp from 'react-countup';
import { BigNumber, amountFormat, formatNumber, formatNumberLend } from '../utils/helper';

@inject('network')
@inject('pool')
@inject('lend')
@observer
class ValueIntro extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      mobile: isMobile(window.navigator).any
    };
  }

  onStart() {}

  render() {
    const { dashboardData, defiTVL } = this.props.lend;
    const { poolData } = this.props.pool;

    let prepareDone = defiTVL && dashboardData && poolData['jstlp1'].totalUSD !== '--';

    let totalValue = BigNumber(0);
    if (defiTVL) {
      let justLendTVL = defiTVL.projects.filter(item => item.project === 'JustLend');
      totalValue = BigNumber(justLendTVL[0].locked).integerValue(BigNumber.ROUND_DOWN);
    }

    let deposit = dashboardData ? BigNumber(dashboardData.totalDepositedUSD) : BigNumber(0);
    let liquidityLockValue =
      poolData['jstlp1'].totalUSD !== '--'
        ? poolData['jstlp1'].totalUSD.integerValue(BigNumber.ROUND_DOWN)
        : BigNumber(0);

    let voteLockValue = totalValue.minus(deposit).minus(liquidityLockValue);
    voteLockValue = voteLockValue.gt(0) ? voteLockValue : BigNumber(0);

    let valueArr = [
      {
        name: intl.get('home.total_value_locked'),
        value: prepareDone ? BigNumber(totalValue).toNumber() : '--'
      },
      {
        name: intl.get('home.deposit_value'),
        value: prepareDone ? BigNumber(deposit).toNumber() : '--'
      },
      {
        name: intl.get('home.votes_staked_value'),
        value: prepareDone ? BigNumber(voteLockValue).toNumber() : '--'
      },
      {
        name: intl.get('home.liquidity_mining_staked_value'),
        value: prepareDone ? BigNumber(liquidityLockValue).toNumber() : '--'
      }
    ];

    return (
      <div className="value-intro">
        {valueArr.map((item, index) => {
          return (
            <div className="value-item" key={index}>
              <p className="value-name">
                {item.name}
                {index === 0 && (
                  <Tooltip title={intl.getHTML('home.total_value_locked_tips')} placement="bottomRight">
                    <span className="tooltip-icon"></span>
                  </Tooltip>
                )}
              </p>

              {prepareDone ? (
                <CountUp
                  className="value-number"
                  start={0}
                  duration={1}
                  redraw={true} 
                  separator="," 
                  decimal="." 
                  prefix="$" 
                  end={item.value}
                />
              ) : (
                <p className="value-number">--</p>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}

export default ValueIntro;
