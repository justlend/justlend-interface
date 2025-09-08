import ReactEcharts from 'echarts-for-react';
import { inject, observer } from 'mobx-react';
import Intl from 'react-intl-universal';
import React, { Component } from 'react';
import { formatNumber, isMobile } from '../../../utils/helper';
import { tryFormatNumber } from '../market-detail/utils';
import BigNumber from 'bignumber.js';

@inject('lend')
@observer
class MarketChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile().any,
      curParams: {
        trx1wEnergyShow: '--',
        totalApyShow: '--',
        supplyApyShow: '--',
        occupancyRateShow: '--',
        voteApyShow: '--',
        dataIndex: 0
      },
      hasTouchedChart: false,
      isHovering: false,
      labelStatus: true
    };
    this.echartRef = null;
  }

  componentDidUpdate(prevProps) {
    this.hideTooltip();
    setTimeout(() => {
      this.showTooltipForCurrentData();
    });
  }
  getEchartsOption() {
    const { voteApy = 0, type, totalApy } = this.props;
    const { theme } = this.props.lend;
    const { mobile, labelStatus } = this.state;
    const dataList = getDataList(this.props.dataList, voteApy, totalApy);
    const options = getChartOptions({ theme, dataList, type, isMobile: mobile, labelStatus });
    return options;
  }

  onChartHightLight = params => {
    const { dataList } = this.props;
    const batch = params.batch.reduce((acc, cur) => {
      acc[cur.seriesIndex] = cur;
      return acc;
    }, {});
    const data = dataList[batch[0].dataIndex];
    this.setState({
      hasTouchedChart: true,
      curParams: [
        {
          axisValue: data.date,
          value: data.depositedAPY,
          dataIndex: batch[0].dataIndex
        },
        {
          axisValue: data.date,
          value: data.depositedUSD,
          dataIndex: batch[0].dataIndex
        }
      ]
    });
  };

  initRef = e => {
    this.echartRef = e;
  };

  onChartReady = () => {
    setTimeout(this.showTooltipForCurrentData, 800);
  };

  showTooltipForCurrentData = () => {
    const { mobile } = this.state;
    const instance = this.echartRef?.getEchartsInstance();
    if (!this.props.dataList?.length) {
      setTimeout(this.showTooltipForCurrentData, 800);
      return;
    }
    instance &&
      instance.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: this.props.dataList.findIndex(item => item.current) || 0,
        position: mobile ? [40, 10] : [80, 10]
      });
  };

  hideTooltip = () => {
    const instance = this.echartRef?.getEchartsInstance();
    instance &&
      instance.dispatchAction({
        type: 'hideTip'
      });
  };

  onChartMouseover = () => {
    !this.state.isHovering &&
      this.setState({
        isHovering: true
      });

    this.setState({
      labelStatus: false
    });
  };

  onChartMouseout = () => {
    this.setState({
      isHovering: false,
      labelStatus: true
    });
    setTimeout(() => {
      this.showTooltipForCurrentData();
    }, 400);
  };

  render() {
    const { mobile } = this.state;
    const onEvents = {
      // highlight: this.onChartHightLight,
    };

    return (
      <div className="chart" onMouseOut={this.onChartMouseout} onMouseOver={this.onChartMouseover}>
        {/* <span className="color-light fake-label y">Y:</span> */}
        {/* <span className="color-light fake-label x">X:</span> */}
        <ReactEcharts
          option={this.getEchartsOption()}
          ref={this.initRef}
          style={{ height: 194 }}
          className=""
          onChartReady={this.onChartReady}
        />
      </div>
    );
  }
}

function getChartOptions({ theme, dataList, type, isMobile, labelStatus }) {
  const xData = dataList.map(item => item.base * 100);
  const apyData = dataList.map(item => item.totalApy);

  const trxData = dataList.map(item => item.trx1wEnergy * 100);

  const isWhite = theme === 'white';
  const isStake = type === 'stake';
  const serialData = isStake
    ? xData.map((item, index) => {
        return [item, apyData[index]];
      })
    : xData.map((item, index) => {
        return [item, trxData[index]];
      });
  return {
    // background: 'transparent',
    color: [
      {
        type: 'linear',
        x: 1,
        y: 0,
        x2: 0,
        y2: 0,
        colorStops: isStake
          ? [
              {
                offset: 0,
                color: '#9195FB'
              },
              {
                offset: 1,
                color: '#18C19F'
              }
            ]
          : [
              {
                offset: 0,
                color: '#1BDCB5'
              },
              {
                offset: 1,
                color: '#5FD2EB'
              }
            ],
        global: false
      },
      {
        type: 'linear',
        x: 0,
        y: 1,
        x2: 0,
        y2: 0,
        colorStops: isStake
          ? [
              {
                offset: 0,
                color: 'rgba(29, 192, 163, 0)'
              },
              {
                offset: 1,
                color: 'rgba(146, 150, 251, 0.3)'
              }
            ]
          : [
              {
                offset: 0,
                color: 'rgba(29, 192, 163, 0)'
              },
              {
                offset: 1,
                color: 'rgba(134, 255, 231, 0.3)'
              }
            ],
        global: false
      }
    ],
    grid: {
      top: 32,
      left: isMobile ? 0 : 23,
      right: 9,
      bottom: 0,
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      showContent: true,
      extraCssText: 'z-index: 999',
      position: isMobile ? ['10%', '20%'] : undefined,
      // position: function (pos, params, dom, rect, size) {

      //   var obj = { top: 10 };
      //   obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 5;
      //   return obj;
      // },

      axisPointer: {
        type: 'line',
        animation: false,
        lineStyle: {
          color: isWhite ? 'rgb(34, 35, 43, 0.4)' : 'rgba(255, 255, 255, 0.4)',
          type: 'dashed',
          width: 0.5
        },
        label: {
          precision: 2
        }
      },
      backgroundColor: isWhite ? '#ffffff' : '#353745',
      borderWidth: '0',
      padding: 0,
      textStyle: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'PingFang SC',
        fontSize: '14px'
      },
      formatter: function (params) {
        const data = dataList[params[0].dataIndex];
        return type === 'stake'
          ? `<div class="tooltip">
        <header class="header item color-primary">
          <span class="title">${Intl.get('strx.stake_staking_apy')}</span>
          <span class="value">${data.totalApyShow}</span>
        </header>
        <div class="item">
          <span class="title color-light">${Intl.get('strx.energy_rental')} APY</span>
          <span class="value value-wrap">
            <span class="num purple">${data.supplyApyShow}</span>
            <span class="color-light value-extra">
              <span class="">(${Intl.get('strx.stake_data_energy_renting_rate', {
                value: ''
              })} </span>&nbsp;<span class="num color-primary">${data.occupancyRateShow}</span>)
            </span>
          </span>
        </div>
        <div class="item">
          <span class="title color-light">${Intl.get('strx.stake_data_voting_apy')}</span>
          <span class="value">
            <span class="green num">${data.voteApyShow}</span>
          </span>
        </div>
      </div>`
          : `<div class="tooltip energy">
        <div class="item">
          <span class="title color-light">${Intl.get('strx.energy_rent_energy_price')}</span>
          <span class="value value-wrap">
            <span class="num green">${data.trx1wEnergyShow} sun/${Intl.get('strx.energy_day2')}</span>
          </span>
          <span class="color-light value-extra">
              <span>(${Intl.get('strx.stake_data_energy_renting_rate', {
                value: ''
              })} </span>&nbsp;<span class="num color-primary">${data.occupancyRateShow}</span>)
          </span>
        </div>
      </div>`;
      }
    },
    xAxis: {
      type: 'value',
      // interval: 10,
      data: xData,
      boundaryGap: false,
      axisLine: {
        show: true,
        lineStyle: {
          color: isWhite ? 'rgba(34,35,43,0.06)' : 'rgba(255,255,255,0.06)'
        }
      },
      axisLabel: {
        show: true,
        color: isWhite ? 'rgba(34,35,43,0.6)' : 'rgba(255,255,255,0.6)',
        margin: 16,
        fontSize: 10,
        align: 'center',
        fontFamily: 'Avenir Next',
        interval: (idx, item) => {
          return `${item}`.endsWith('0');
        }
      },
      axisPointer: {
        value: dataList.findIndex(item => item.current) || 0,
        label: {
          show: labelStatus,
          formatter: function (params, text) {
            return Intl.get('market.current');
          },
          backgroundColor: 'transparent',
          color: isWhite ? 'rgba(34, 0, 34, 0.6)' : 'rgba(255,255,255,0.6)'
        },
        handle: {
          show: labelStatus,
          color: 'transparent'
        }
      },
      axisTick: { show: false },
      splitLine: {
        show: false
      },
      name: isMobile ? '' : 'X:',
      nameLocation: 'start',
      nameGap: 0,
      nameTextStyle: {
        color: isWhite ? 'rgba(34,35,43,0.6)' : 'rgba(255,255,255,0.6)',
        fontSize: 12,
        lineHeight: 16,
        verticalAlign: 'top',
        fontWeight: 400,
        padding: isMobile ? [13, 12, 0, 0] : isStake ? [35, 16, 0, 0] : [12, 16, 0, 0]
      }
    },
    yAxis: {
      type: 'value',
      splitNumber: 4,
      name: isMobile ? '' : 'Y:',
      nameLocation: 'end',
      nameGap: 55,
      nameTextStyle: {
        color: isWhite ? 'rgba(34,35,43,0.6)' : 'rgba(255,255,255,0.6)',
        fontSize: 12,
        lineHeight: 16,
        verticalAlign: 'top',
        fontWeight: 400,
        padding: isMobile ? [13, 12, 0, 0] : isStake ? [10, 50, 0, 0] : [30, 80, 0, 0]
      },
      axisLabel: {
        show: true,
        color: isWhite ? 'rgba(34,35,43, 0.6)' : 'rgba(255,255,255,0.6)',
        margin: isMobile ? 12 : 20,
        fontSize: 10,
        verticalAlign: 'middle',
        fontFamily: 'Avenir Next',
        formatter(value) {
          return isStake
            ? formatNumber(value, 0)
            : BigNumber(value).lte(0)
            ? 0
            : formatNumber(value, 3, { cutZero: true });
        }
      },
      axisLine: {
        show: false
      },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: {
          color: isWhite ? 'rgba(34,35,43,0.06)' : 'rgba(255,255,255,0.06)'
        }
      }
    },
    series: [
      {
        data: serialData,
        type: 'line',
        areaStyle: {
          color: 'transparent'
        },
        lineStyle: {
          width: 3
        },
        itemStyle: {
          normal: {
            opacity: 0,
            lineStyle: {
              width: 3
            }
          },
          emphasis: {
            opacity: 1,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            color: isStake ? '#9195FB' : '#18C19F',
            borderColor: '#ffffff',
            borderWidth: 3,
            shadowBlur: 2,
            shadowColor: isWhite ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        },
        symbolSize: 6
      },
      {
        data: serialData,
        type: 'line',
        lineStyle: {
          color: 'transparent'
        },
        areaStyle: {},
        itemStyle: {
          show: false,
          normal: {
            opacity: 0
          },
          emphasis: {
            opacity: 0
          }
        }
      }
    ]
  };
}

export { MarketChart };

function getDataList(dataList = [], voteApy, totalApy) {
  const currentSupply = dataList.find(item => item.current);
  if (currentSupply) {
    voteApy = BigNumber(BigNumber(totalApy).toFixed(4, 1)).minus(+BigNumber(currentSupply.supply).toFixed(4, 1));
  } else {
    voteApy = BigNumber(voteApy);
  }
  const voteApyShow = tryFormatNumber(voteApy * 100, 2, { miniText: '0.01' }) + '%';
  return dataList.map(item => {
    const supplyApyShow = tryFormatNumber(item.supply * 100, 2, { miniText: '0.01' }) + '%';
    const totalApy = voteApy.plus(BigNumber(item.supply).toFixed(4, 1)).times(100);

    const totalApyShow = tryFormatNumber(totalApy, 2, { miniText: '0.01' }) + '%';
    const occupancyRateShow = tryFormatNumber(item.base * 100, 2, { round: true }) + '%';
    return {
      ...item,
      totalApy: totalApy.valueOf(),
      value: totalApy.valueOf(),
      trx1wEnergyShow: tryFormatNumber(item.trx1wEnergy * 100, 0, { miniText: '0.001' }),

      voteApyShow,
      supplyApyShow,
      totalApyShow,
      occupancyRateShow
    };
  });
}
