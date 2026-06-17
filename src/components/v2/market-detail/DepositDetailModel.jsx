import { Checkbox } from 'antd';
import ReactEcharts from 'echarts-for-react/lib';
import { inject, observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import { Config } from '../../../config';
import { amountFormat, isMobile, toBigNumberNew, BigNumber } from '../../../utils/helper';
import { yAxisMaxApy, yAxisMaxSize, yAxisMinApy } from './BorrowDetailModel';
import { tryFormatNumber, checkIfShouldShowMintApyDetail } from './utils';
import { DepositDetailMobileTooltip } from './DepositDetailMobileTooltip.jsx';
const { miningSymbol, miningNewSymbol } = Config;
function formatApy(number) {
  if (number == 0) {
    return 0;
  }
  return tryFormatNumber(number * 100, 2, { miniText: 0.01 });
}
function getTooltipData({ params, lang, dataList, collateralSymbol }) {
  if (!dataList?.length) {
    return {
      dateText: '--',
      depositedAPY: '--',
      depositedUSD: '--',
      farmApy: '--',
      farmUsddApy: '--',
      farmTrxApy: '--',
      totalAPY: '--'
    };
  }

  const data = dataList[params[0].dataIndex];
  const isCurrent = params[0].dataIndex === dataList.length - 1;
  const dateText = `${data.date}`;

  if (data.isFake) {
    return {
      dateText,
      depositedAPY: '--',
      totalAPY: '--',
      depositedUSD: '--',
      farmApy: '--',
      farmUsddApy: '--',
      farmTrxApy: '--',
      isFake: data.isFake,
      isCurrent
    };
  }

  return {
    dateText,
    depositedAPY: BigNumber(data.depositedAPY).eq(0) ? '--' : formatApy(data.depositedAPY),
    wstUSDTDepositApyWithIncrement: BigNumber(data.baseApyWithIncrement).eq(0)
      ? 0
      : formatApy(data.baseApyWithIncrement),
    totalAPY: formatApy(
      BigNumber(Config.holdingTokens.includes(collateralSymbol) ? data.baseApyWithIncrement : data.depositedAPY).plus(
        data.farmApy
      )
    ),
    depositedUSD: amountFormat(data.depositedUSD, 2, {
      miniText: 0.01
    }),
    farmApy: formatApy(data.farmApy),
    farmUsddApy: formatApy(data.farmUsddApy),
    farmTrxApy: formatApy(data.farmTrxApy),
    isCurrent,
    underlyingIncrementApy: formatApy(data.underlyingIncrementApy)
  };
}

@inject('lend')
@inject('market')
@observer
class DepositDetailModel extends React.Component {
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
    const { jTokenData } = this.props;
    const { dataList } = this.props;
    const dateList = dataList.map(item => item.date);
    const amountList = dataList.map(item => item.depositedUSD);
    const rateList = dataList.map(item => {
      const baseApy = Number(
        Config.holdingTokens.includes(jTokenData.collateralSymbol)
          ? BigNumber(BigNumber(item.baseApyWithIncrement).plus(1)).times(BigNumber(item.depositedAPY).plus(1)).minus(1)
          : item.depositedAPY
      );
      return Config.holdingTokens.includes(jTokenData.collateralSymbol)
        ? baseApy
        : Number(item.farmApy) > 0
        ? baseApy + Number(item.farmApy)
        : baseApy;
    });

    return {
      dateList,
      amountList,
      rateList,
      dataList
    };
  }
  getEchartsOption() {
    const { jTokenData } = this.props;
    const { mobile, isHovering } = this.state;
    const { theme, lang, openMint } = this.props.lend;
    const isWhite = theme === 'white';
    const { dateList, rateList, amountList, dataList } = this.getChartData();
    const baseBarWidth = mobile ? 7 : 14;
    // const multiply2 = dataList.length < 16 ? 2 : 1;
    // const multiply = dataList.length < 10 ? 3 : multiply2;
    const barWidth = baseBarWidth;
    const interval = function (idx) {
      return idx === 0 || idx % 5 === 4;
    };

    const collateralSymbol = jTokenData?.collateralSymbol;

    return {
      backgroundColor: mobile ? (isWhite ? '#ffffff' : 'rgba(255, 255, 255, 0.06)') : 'transparent',
      tooltip: {
        show: true,
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
        // showContent: !mobile,
        showContent: !mobile,
        axisPointer: {
          show: true,
          type: 'line',
          animation: true,
          lineStyle: {
            color: isWhite ? 'rgba(34,35,43,0.4)' : 'rgba(255, 255, 255, 0.4)',
            type: 'dashed',
            width: 1
          },
          label: {
            show: true,
            precision: 2
          }
        },
        backgroundColor: isWhite ? '#ffffff' : '#40414A',
        borderWidth: '0',
        borderRadius: '10',
        borderColor: 'transparent',
        padding: 0,
        textStyle: {
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'PingFang SC',
          fontSize: 14
        },
        formatter: function (params) {
          const {
            dateText,
            depositedAPY,
            wstUSDTDepositApyWithIncrement,
            depositedUSD,
            farmApy,
            totalAPY,
            farmUsddApy,
            farmTrxApy,
            isFake,
            underlyingIncrementApy,
            isCurrent
          } = getTooltipData({
            params,
            lang,
            dataList,
            collateralSymbol
          });
          const shouldShowMintApyDetail = checkIfShouldShowMintApyDetail(true, collateralSymbol, farmApy);

          return `<div class="chart-tooltip interest-rate">
              <header class="chart-tooltip-header">
                <span class="color-light">${dateText} 00:00:00（UTC）</span>
              </header>
              <main>
                <div class="item">
                  <span class="label ${lang}">
                    <span class="color-primary fs12" style="display:inline-flex;">
                      <i class="icon icon-line-chart ${isWhite ? 'white' : 'black'}"></i>
                      ${intl.get('lend.depositapy')}
                    </span>
                  </span>
                  <div class="value-wrap">
                    <span class="value deposit color-primary">${
                      (shouldShowMintApyDetail && !isFake
                        ? totalAPY
                        : Config.holdingTokens.includes(collateralSymbol)
                        ? wstUSDTDepositApyWithIncrement
                        : depositedAPY) + '%'
                    }
                    <span class="${
                      Config.holdingTokens.includes(collateralSymbol) ? 'compounded-reward-icon' : ''
                    }"></span>
                    <span
                      class="${
                        shouldShowMintApyDetail
                          ? Config.holdingTokens.includes(collateralSymbol)
                            ? 'fire-icon extra-space'
                            : 'fire-icon'
                          : ''
                      }"
                    ></span>
                  </div>
                </div>

                <div class="${
                  shouldShowMintApyDetail && !isFake && !Config.holdingTokens.includes(collateralSymbol)
                    ? 'item wst-item'
                    : 'item hide-item'
                }">
                  <span class="label color-light" style="padding-left: 20px">${intl.get('risk_tip.basic_apy1')}</span>
                  <div class="value-wrap">
                    <span class="value normal-weight color-light">${depositedAPY + '%'}</span>
                  </div>
                </div>
                <div class="${
                  shouldShowMintApyDetail &&
                  !isFake &&
                  !Config.holdingTokens.includes(collateralSymbol) &&
                  farmUsddApy &&
                  farmUsddApy !== '--'
                    ? 'item wst-item'
                    : 'item hide-item'
                }">
                  <span class="label color-light" style="padding-left: 20px">${intl.get('risk_tip.mining_apy2', {
                    miningSymbol
                  })}</span>
                  <div class="value-wrap">
                    <span class="value normal-weight color-light">${farmUsddApy + '%'}</span>
                  </div>
                </div>
                <div class="${
                  shouldShowMintApyDetail &&
                  !isFake &&
                  !Config.holdingTokens.includes(collateralSymbol) &&
                  farmTrxApy &&
                  farmTrxApy !== '--'
                    ? 'item wst-item'
                    : 'item hide-item'
                }">
                  <span class="label color-light" style="padding-left: 20px">${intl.get('risk_tip.mining_apy2', {
                    miningSymbol: miningNewSymbol
                  })}</span>
                  <div class="value-wrap">
                    <span class="value normal-weight color-light">${farmTrxApy + '%'}</span>
                  </div>
                </div>

                <div class="${Config.holdingTokens.includes(collateralSymbol) ? 'item wst-item ' : 'item hide-item'}">
                  <span class="label color-light" style="padding-left: 20px">${intl.get('risk_tip.strx_apy1')}</span>
                  <div class="value-wrap">
                    <span class="value normal-weight color-light">${depositedAPY + '%'}</span>
                  </div>
                </div>
                <div class="${Config.holdingTokens.includes(collateralSymbol) ? 'item wst-item' : 'item hide-item'}">
                  <span class="label color-light" style="padding-left: 20px">${intl.get(
                    collateralSymbol === 'sTRX' ? 'risk_tip.strx_apy3' : 'risk_tip.wstUSDT_apy1'
                  )}</span>
                  <div class="value-wrap">
                    <span class="value normal-weight color-light">${underlyingIncrementApy + '%'}</span>
                  </div>
                </div>
                <div class="${
                  Config.holdingTokens.includes(collateralSymbol) && shouldShowMintApyDetail
                    ? 'item wst-item'
                    : 'item hide-item'
                }">
                  <span class="label color-light">${intl.get('v2.market_detail_mint_apy')}</span>
                  <div class="value-wrap">
                    <span class="value normal-weight color-light">${farmApy + '%'}</span>
                  </div>
                </div>


                <div class="item">
                  <span class="label color-primary"><i class="icon icon-bar-chart ${
                    isWhite ? 'white' : 'black'
                  }"></i>${intl.get('market.deposit_size')}</span>
                  <div class="value-wrap">
                    <span class="value color-primary">${'$' + depositedUSD}</span>
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
          // min: v => v.min,
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
          // margin: 10,
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
          type: 'line',
          // symbol: 'circle',
          symbolSize: 12,
          showSymbol: true,
          yAxisIndex: 0,
          hoverAnimation: false,
          itemStyle: {
            normal: {
              opacity: 0,
              color: isWhite ? '#4b52df' : '#9195fb',
              lineStyle: {
                width: 3
              },
              borderWidth: 0
            },
            emphasis: {
              opacity: 1,
              shadowOffsetX: 0,
              color: isWhite ? '#4b52df' : '#9195fb',
              borderColor: '#ffffff',
              borderWidth: 3
            }
          },
          data: rateList
        },
        {
          name: intl.get('market.deposit_apy'),
          type: 'bar',
          barMinHeight: 2,
          barWidth: barWidth,
          barCategoryGap: 4,
          yAxisIndex: 1,
          itemStyle: {
            normal: {
              color: 'rgb(145, 149, 251, 0.1)',
              lineStyle: {
                // width: mobile ? 7 : 14
              }
            },
            emphasis: {
              shadowOffsetX: 0,
              shadowColor: 'rgba(255, 255, 255, 0.5)',
              color: isWhite ? '#4b52df' : '#9195fb'
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

    this.props.market.setDepositDetailGraphIndex(params.batch[0].dataIndex);
  };

  initRef = e => {
    this.echartRef = e;
  };

  onChartReady = () => {
    this.showTooltipForCurrentData();
    setTimeout(this.showTooltipForCurrentData, 1000);
  };

  showTooltipForCurrentData = () => {
    const instance = this.echartRef?.getEchartsInstance();
    if (!instance) return;
    if (!this.props.dataList?.length) {
      setTimeout(this.showTooltipForCurrentData, 1000);
      return;
    }
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
    const { dataList, jTokenData } = this.props;
    const { mobile } = this.state;
    const onEvents = {
      highlight: this.onChartHightLight
    };

    return (
      <div className="interest-rate-model section mt-base">
        <div className="title-wrap">
          <span className="title color-primary">{intl.get('v2.supply_detail')}</span>
        </div>
        <div className="section-content">
          <DepositDetailMobileTooltip
            dataList={dataList}
            getTooltipData={getTooltipData}
            collateralSymbol={jTokenData?.collateralSymbol}
          />
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
export { DepositDetailModel };
