import ReactEcharts from 'echarts-for-react/lib';
import { inject, observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import { amountFormat, formatNumber, isMobile } from '../../../utils/helper';
import { BorrowDetailMobileTooltip } from './BorrowDetailMobileTooltip.jsx';

export function yAxisMaxApy(v) {
  if (v.max !== v.min && v.min !== 0) {
    return v.max * 1.3;
  }

  if (v.max !== v.min) {
    return v.max * 1.4;
  }

  if (v.max !== 0) {
    return v.max * 1.4;
  }

  return 20;
}
export function yAxisMinApy(v) {
  const gap = Number(v.max - v.min);
  if (v.max !== v.min && v.min !== 0) {
    // return gap * -10;
    return gap * -2;
  }
  if (v.max !== v.min) {
    // return v.max * -3;
    return v.max * -2;
  }
  if (v.max !== 0) {
    // return v.max * -3;
    return v.max * -2;
  }
  return -100;
}
export function yAxisMaxSize(v) {
  // return (v.max * 2.5).toFixed(2);
  return (v.max * 2).toFixed(2);
}
function getTooltipData({ params, lang, dataList }) {
  if (!dataList?.length) {
    return {
      dateText: '--',
      borrowedAPY: '--',
      borrowedUSD: '--'
    };
  }
  const data = dataList[params[0].dataIndex];
  const isCurrent = params[0].dataIndex === dataList.length - 1;
  const dateText = `${data.date}`;

  if (data.isFake) {
    return {
      dateText,
      borrowedAPY: '--',
      borrowedUSD: '--',
      isCurrent
    };
  }
  return {
    dateText,
    borrowedAPY: formatNumber(data.borrowedAPY * 100, 2, { miniText: 0.01 }),
    borrowedUSD: amountFormat(data.borrowedUSD, 2, {
      miniText: 0.01
    }),
    isCurrent
  };
}

@inject('lend')
@inject('market')
@observer
class BorrowDetailModel extends React.Component {
  constructor() {
    super();
    this.state = {
      mobile: isMobile().any,
      isHovering: false
    };
    this.echartRef = null;
  }

  componentDidUpdate(prevProps) {
    this.hideTooltip();
    setTimeout(() => {
      this.showTooltipForCurrentData();
    });
  }
  componentWillUnmount() {
    const chartInstance = this.echartRef?.getEchartsInstance();
    if (chartInstance) {
      chartInstance.dispose();
    }
  }

  getChartData() {
    const { dataList } = this.props;
    const dateList = dataList.map(item => item.date);
    const amountList = dataList.map(item => item.borrowedUSD);
    const rateList = dataList.map(item => item.borrowedAPY);
    return {
      dateList,
      amountList,
      rateList,
      dataList
    };
  }

  getEchartsOption() {
    const { mobile } = this.state;
    const { jTokenData } = this.props;
    const { theme, lang } = this.props.lend;
    const isWhite = theme === 'white';
    const { dateList, rateList, amountList, dataList } = this.getChartData();
    const baseBarWidth = mobile ? 7 : 14;
    // const multiply = dataList.length < 10 ? 3 : dataList.length < 16 ? 2 : 1;
    const barWidth = baseBarWidth;
    const interval = function (idx) {
      return idx === 0 || idx % 5 === 4;
    };
    return {
      backgroundColor: mobile ? (isWhite ? '#ffffff' : 'rgba(255, 255, 255, 0.06)') : 'transparent',
      tooltip: {
        trigger: 'axis',
        position: function (point, params, dom, rect, size) {
          var x = 0;
          var y = 0;

          var pointX = point[0];
          var viewWidth = size.viewSize[0];
          var boxWidth = size.contentSize[0];
          var boxHeight = size.contentSize[1];

          var sideExtraWidth = 20;
          if (pointX + sideExtraWidth < boxWidth / 2) {
            x = 0 - sideExtraWidth;
          } else if (viewWidth + sideExtraWidth - pointX < boxWidth / 2) {
            x = viewWidth - boxWidth + sideExtraWidth;
          } else {
            x = pointX - boxWidth / 2;
          }

          y = 20 - boxHeight;

          return [x, y];
        },
        showContent: !mobile,
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
        backgroundColor: isWhite ? '#ffffff' : '#40414A',
        borderWidth: '0',
        borderRadius: '10',
        padding: 0,
        textStyle: {
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'PingFang SC',
          fontSize: '14px'
        },
        formatter: function (params) {
          const { dateText, borrowedAPY, borrowedUSD, isCurrent } = getTooltipData({ params, lang, dataList });
          return `<div class="chart-tooltip interest-rate">
              <header class="chart-tooltip-header">
                <span class="color-light">${dateText} 00:00:00（UTC）</span>
              </header>
              <main>
                <div class="item">
                  <span class="label color-light">
                    <i class="icon icon-line-chart ${isWhite ? 'white' : 'black'}"></i>${intl.get('market.borrow_apy')}
                  </span>
                  <div class="value-wrap">
                    <span class="value borrow">${borrowedAPY + '%'}</span>
                  </div>
                </div>
                <div class="item">
                  <span class="label color-light">
                    <i class="icon icon-bar-chart ${isWhite ? 'white' : 'black'}"></i>
                    ${intl.get('market.borrow_overview')}
                  </span>
                  <div class="value-wrap">
                    <span class="value color-primary">${'$' + borrowedUSD}</span>
                  </div>
                </div>
              </main>
            </div>`;
        },
        extraCssText: 'z-index: 999'
      },
      grid: mobile
        ? {
            top: 15,
            left: 10,
            right: 10,
            bottom: 10,
            containLabel: true
          }
        : {
            top: 5,
            left: 15,
            right: 15,
            bottom: 0,
            containLabel: true
          },
      yAxis: [
        {
          type: 'value',
          show: false,
          position: 'left',
          data: rateList,
          min: yAxisMinApy,
          max: yAxisMaxApy,
          axisLine: {
            onZero: false
          },
          axisLabel: {
            show: false
          }
        },
        {
          type: 'value',
          show: false,
          position: 'left',
          max: yAxisMaxSize,
          axisLine: {
            onZero: false
          },
          axisLabel: {
            show: false
          }
        }
      ],
      xAxis: {
        type: 'category',
        position: 'bottom',

        axisLine: {
          show: false,
          onZero: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: true,
          inside: false,
          align: 'center',
          formatter: (value, idx) => (interval(idx) ? value.split('-').slice(1).join('/') : ''),
          interval: 0,
          margin: 10,
          fontFamily: 'Avenir Next',
          fontSize: 10,
          lineHeight: 17,
          color: isWhite ? 'rgba(34, 35, 43, 0.6)' : 'rgba(255,255,255,0.6)'
        },
        // name: intl.get('market.detail_date'),
        name: '',
        nameLocation: 'start',
        nameTextStyle: {
          fontFamily: 'Avenir Next',
          fontSize: 12,
          lineHeight: 17,
          color: isWhite ? 'rgba(34, 35, 43, 0.6)' : 'rgba(255,255,255,0.6)',
          align: 'left',
          verticalAlign: 'top',
          padding: [10, 0, 0, 0]
        },
        nameGap: 0,
        boundaryGap: ['0%', '0%'],
        data: dateList
      },
      series: [
        {
          name: intl.get('market.borrow_apy'),
          showSymbol: true,
          type: 'line',
          yAxisIndex: 0,
          hoverAnimation: false,
          itemStyle: {
            normal: {
              opacity: 0,
              color: '#18C19F',
              lineStyle: {
                width: 3
              }
            },
            emphasis: {
              opacity: 1,
              shadowOffsetX: 0,
              color: '#18C19F',
              borderColor: '#ffffff',
              borderWidth: 3
            }
          },
          data: rateList,
          symbolSize: 12
        },
        {
          name: intl.get('market.borrow_apy'),
          type: 'bar',
          barMinHeight: 2,
          barWidth: barWidth,
          barCategoryGap: 4,
          yAxisIndex: 1,
          itemStyle: {
            normal: {
              color: 'rgb(24, 193, 159, 0.1)',
              lineStyle: {
                // width: mobile ? 7 : 14
              }
            },
            emphasis: {
              shadowOffsetX: 0,
              shadowColor: 'rgba(255, 255, 255, 0.5)',
              color: '#18C19F'
            }
          },
          hoverAnimation: false,
          data: amountList,
          showSymbol: false,
          symbolSize: 12
        }
      ]
    };
  }

  onChartHightLight = params => {
    if (!this.state.mobile) {
      return;
    }

    if (!params || !params.batch || !params.batch[0]) {
      return;
    }

    this.props.market.setBorrowDetailGraphIndex(params.batch[0].dataIndex);
  };

  initRef = e => {
    this.echartRef = e;
  };

  onChartReady = () => {
    setTimeout(this.showTooltipForCurrentData, 1000);
  };

  showTooltipForCurrentData = () => {
    const instance = this.echartRef?.getEchartsInstance();
    if (!this.props.dataList?.length) {
      setTimeout(this.showTooltipForCurrentData, 1000);
      return;
    }

    instance &&
      instance.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: 29
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
  };

  onChartMouseout = () => {
    this.setState({
      isHovering: false
    });
    this.showTooltipForCurrentData();
  };

  render() {
    const { dataList } = this.props;
    const { mobile } = this.state;
    const onEvents = {
      highlight: this.onChartHightLight
    };
    return (
      <div className="interest-rate-model section mt-base">
        <div className="title-wrap">
          <span className="title color-primary">{intl.get('v2.borrow_detail')}</span>
        </div>
        <div className="section-content">
          <BorrowDetailMobileTooltip dataList={dataList} getTooltipData={getTooltipData} />
          <div
            style={{ position: 'relative' }}
            onMouseOver={mobile ? null : this.onChartMouseover}
            onMouseOut={this.onChartMouseout}
          >
            <ReactEcharts
              option={this.getEchartsOption()}
              style={{ height: mobile ? '38.6666vw' : 218 }}
              className="market-detail-echarts-v2 mt-base"
              ref={this.initRef}
              onEvents={onEvents}
              onChartReady={this.onChartReady}
            />
          </div>
        </div>
      </div>
    );
  }
}
export { BorrowDetailModel };
