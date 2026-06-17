import { Checkbox } from 'antd';
import ReactEcharts from 'echarts-for-react/lib';
import { inject, observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import { Config } from '../../../config';
import { BigNumber, formatNumber, isMobile } from '../../../utils/helper';
import { tryFormatNumber, checkIfShouldShowMintApyDetail } from './utils';
import { InterestRateMobileTooltip } from './InterestRateMobileTooltip';
const { miningSymbol, miningNewSymbol } = Config;
@inject('lend')
@inject('market')
@observer
class InterestRateModel extends React.Component {
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

  getEchartsOption(shouldShowMintApyDetail) {
    const { mobile, isHovering } = this.state;
    const { lang, theme } = this.props.lend;
    const { jTokenData } = this.props;
    const isWhite = theme === 'white';
    const { borrowList, supplyList, baseList, mintApy, mintApyTRX, mintApyWithUSDD, current } = jTokenData;

    return {
      backgroundColor: mobile ? (isWhite ? '#ffffff' : 'rgba(255, 255, 255, 0.06)') : 'transparent',
      tooltip: {
        show: true,
        showContent: !mobile,
        // showContent: isHovering,
        trigger: 'axis',
        alwaysShowContent: !mobile && !isHovering,
        // alwaysShowContent: false,
        // hideDelay: 0,
        axisPointer: {
          show: true,
          type: 'line',
          animation: false,
          lineStyle: {
            color: isWhite ? 'rgba(34,35,43,0.4)' : 'rgba(255, 255, 255, 0.4)',
            type: 'dashed'
          },
          label: {
            precision: 2
            // show: true,
            // formatter: function (params) {
            //   return `${params.value}%`;
            // }
          }
        },
        backgroundColor: isWhite ? '#ffffff' : '#40414A',
        borderWidth: '0',
        borderRadius: '10',
        padding: 0,
        textStyle: {
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'PingFang SC',
          fontSize: '14px',
          opacity: 0.1
        },
        formatter: function (params) {
          let baseDeposit = '--';
          let mint = Config.usddMint.includes(jTokenData.jtokenAddress) ? mintApyWithUSDD : mintApy;
          let mint2 = mintApyTRX;
          if (!shouldShowMintApyDetail) {
            mint = 0;
            mint2 = 0;
          }
          if (mint !== '--') {
            if (params[1].value.includes('<')) {
              baseDeposit = params[1].value;
            } else {
              const value = BigNumber(params[1].value)
                .minus(BigNumber(mint)._toFixed(2, 1))
                .minus(BigNumber(mint2)._toFixed(2, 1))
                .toNumber();
              baseDeposit = formatNumber(value, 2);
            }
          }
          const { current, collateralSymbol } = jTokenData;
          const model = jTokenData.model.filter(item => !item.current);

          let useRateDisplay,
            depositApyDisplay,
            baseDepositApyDisplay,
            mintApyDisplay,
            mintApyTRXDisplay,
            borrowAPyDisplay;
          let wstDepositBaseApyDisplay, wstApyDisplay;
          if (isHovering) {
            const useRate = BigNumber(model[params[0].dataIndex].base).times(100);
            useRateDisplay = `${Number(tryFormatNumber(BigNumber(useRate).gt(100) ? 100 : useRate, 2))}%`;
            depositApyDisplay = `${params[1].value}%`;
            baseDepositApyDisplay = `${baseDeposit}%`;
            mintApyDisplay = `${tryFormatNumber(mint, 2, { miniText: 0.01, per: true })}%`;
            mintApyTRXDisplay = `${tryFormatNumber(mint2, 2, { miniText: 0.01, per: true })}%`;
            borrowAPyDisplay = `${params[0].value}%`;

            wstDepositBaseApyDisplay = `${tryFormatNumber(BigNumber(model[params[0].dataIndex].supply).times(100), 2, {
              miniText: 0.01,
              per: true,
              defaultSymbol: true
            })}%`;
            wstApyDisplay = `${tryFormatNumber(BigNumber(jTokenData?.underlyingIncrementApy).times(100), 2, {
              miniText: 0.01,
              per: true,
              defaultSymbol: true
            })}%`;

            if (Config.holdingTokens.includes(collateralSymbol)) {
              let resultApy = BigNumber(BigNumber(model[params[0].dataIndex].supply).plus(1))
                .times(BigNumber(jTokenData?.underlyingIncrementApy).plus(1))
                .minus(1);

              depositApyDisplay = `${tryFormatNumber(BigNumber(resultApy).times(100), 2, {
                miniText: 0.01,
                per: true
              })}%`;
            }
          } else {
            const useRate = BigNumber(current.base);
            useRateDisplay = `${tryFormatNumber(BigNumber(useRate).gt(100) ? 100 : useRate, 2)}%`;
            baseDepositApyDisplay = `${tryFormatNumber(
              collateralSymbol === 'wstUSDT' ? current.baseApyWithIncrement : current.supply,
              2,
              { miniText: 0.01, per: true, defaultSymbol: true }
            )}%`;
            mintApyDisplay = `${tryFormatNumber(mint, 2, { miniText: 0.01, per: true })}%`;
            mintApyTRXDisplay = `${tryFormatNumber(mint2, 2, { miniText: 0.01, per: true })}%`;
            borrowAPyDisplay = `${tryFormatNumber(current.borrow, 2, { miniText: 0.01, per: true })}%`;
            let depositApy = tryFormatNumber(
              BigNumber(
                tryFormatNumber(collateralSymbol === 'wstUSDT' ? current.baseApyWithIncrement : current.supply, 2, {
                  miniText: 0.01,
                  per: true
                })
              )
                .plus(tryFormatNumber(mint, 2, { miniText: 0.01, per: true }))
                .plus(tryFormatNumber(mint2, 2, { miniText: 0.01, per: true })),
              2,
              { miniText: 0.01, per: true }
            );

            depositApyDisplay = `${
              depositApy === '--'
                ? tryFormatNumber(
                    BigNumber(collateralSymbol === 'wstUSDT' ? current.baseApyWithIncrement : current.supply)
                      .plus(mint)
                      .plus(mint2),
                    2,
                    { miniText: 0.01, per: true }
                  )
                : depositApy
            }%`;

            wstDepositBaseApyDisplay = `${tryFormatNumber(current.supply, 2, {
              miniText: 0.01,
              per: true,
              defaultSymbol: true
            })}%`;
            wstApyDisplay = `${tryFormatNumber(BigNumber(jTokenData?.underlyingIncrementApy).times(100), 2, {
              miniText: 0.01,
              per: true,
              defaultSymbol: true
            })}%`;

            if (Config.holdingTokens.includes(collateralSymbol)) {
              let resultApy = BigNumber(BigNumber(BigNumber(current.supply).div(100)).plus(1))
                .times(BigNumber(jTokenData?.underlyingIncrementApy).plus(1))
                .minus(1);

              depositApyDisplay = `${tryFormatNumber(BigNumber(resultApy).times(100), 2, {
                miniText: 0.01,
                per: true
              })}%`;
            }
          }

          return `<div class="chart-tooltip interest-rate">
              <header class="chart-tooltip-header">
                <span class="label color-light">${intl.get(
                  'market.detail_use_rate'
                )}</span><span class="value color-primary">${useRateDisplay}</span>
              </header>
              <main>
                <div class="item">
                  <span class="label ${lang}">
                      <span class="color-primary fs12">${intl.get('lend.depositapy')}</span>
                    </span>
                  <div class="value-wrap">
                    <span class="value deposit">${depositApyDisplay}</span>
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
                  shouldShowMintApyDetail && !Config.holdingTokens.includes(collateralSymbol)
                    ? 'item wst-item'
                    : 'item hide-item'
                }">
                  <span class="label color-light">${intl.get('risk_tip.basic_apy1')}</span>
                  <div class="value-wrap">
                    <span class="value normal-weight color-light">${baseDepositApyDisplay}</span>
                  </div>
                </div>
                <div class="${
                  shouldShowMintApyDetail && !Config.holdingTokens.includes(collateralSymbol) && Number(mint)
                    ? 'item wst-item'
                    : 'item hide-item'
                }">
                  <span class="label color-light">${intl.get('risk_tip.mining_apy2', { miningSymbol })}</span>
                  <div class="value-wrap">
                    <span class="value normal-weight color-light">${mintApyDisplay}</span>
                  </div>
                </div>
                <div class="${
                  shouldShowMintApyDetail && !Config.holdingTokens.includes(collateralSymbol) && Number(mint2)
                    ? 'item wst-item'
                    : 'item hide-item'
                }">
                  <span class="label color-light">${intl.get('risk_tip.mining_apy2', {
                    miningSymbol: miningNewSymbol
                  })}</span>
                  <div class="value-wrap">
                    <span class="value normal-weight color-light">${mintApyTRXDisplay}</span>
                  </div>
                </div>

                <div class="${Config.holdingTokens.includes(collateralSymbol) ? 'item wst-item ' : 'item hide-item'}">
                  <span class="label color-light">${intl.get('risk_tip.strx_apy1')}</span>
                  <div class="value-wrap">
                    <span class="value normal-weight color-light">${wstDepositBaseApyDisplay}</span>
                  </div>
                </div>
                <div class="${Config.holdingTokens.includes(collateralSymbol) ? 'item wst-item' : 'item hide-item'}">
                  <span class="label color-light">${intl.get(
                    collateralSymbol === 'sTRX' ? 'risk_tip.strx_apy3' : 'risk_tip.wstUSDT_apy1'
                  )}</span>
                  <div class="value-wrap">
                    <span class="value normal-weight color-light">${wstApyDisplay}</span>
                  </div>
                </div>
                <div class="${
                  Config.holdingTokens.includes(collateralSymbol) && shouldShowMintApyDetail
                    ? 'item wst-item'
                    : 'item hide-item'
                }">
                  <span class="label color-light">${intl.get('v2.market_detail_mint_apy')}</span>
                  <div class="value-wrap">
                    <span class="value normal-weight color-light">${mintApyDisplay}</span>
                  </div>
                </div>

                <div class="item">
                  <span class="color-primary fs12">${intl.get('market.borrow_apy')}</span>
                  <div class="value-wrap">
                    <span class="value borrow">${borrowAPyDisplay}</span>
                  </div>
                </div>
              </main>
            </div>`;
        },
        extraCssText: `z-index: 999; opacity: 1`
      },
      grid: mobile
        ? {
            top: 40,
            left: 15,
            right: 15,
            bottom: 0,
            containLabel: true
          }
        : {
            top: '40px',
            left: 10,
            right: 10,
            bottom: '0%',
            containLabel: true
          },
      yAxis: {
        offset: 0,
        name: '',
        nameLocation: 'end',
        nameGap: mobile ? 15 : 20,
        nameTextStyle: {
          fontSize: '12px',
          lineHeight: 16,
          color: isWhite ? 'rgba(34,35,43,0.6)' : 'rgba(255,255,255,0.6)',
          fontFamily: 'Avenir Next',
          align: mobile ? 'left' : 'middle',
          padding: mobile ? [0, 0, 0, -25] : [0, 0, 0, -30],
          width: 10
        },
        // boundaryGap: ['20%', '20%'],
        type: 'value',
        axisLine: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'solid',
            color: [isWhite ? 'rgba(34,35,43,0.06)' : 'rgba(255,255,255,0.06)']
          }
        },
        splitNumber: 4,
        axisTick: {
          show: false
        },
        axisLabel: {
          textStyle: {
            color: isWhite ? 'rgba(34,35,43,0.6)' : 'rgba(255,255,255,0.6)',
            fontSize: '10px',
            lineHeight: 14,
            fontFamily: 'Avenir Next',
            padding: [0, 0, 0, 0]
          }
        }
      },
      xAxis: {
        type: 'category',
        name: '',
        data: baseList,
        axisLine: {
          lineStyle: {
            color: ['rgba(255,255,255,0.06)']
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisPointer: {
          show: true,
          label: {
            show: !isHovering && !mobile,
            color: '#fff',
            backgroundColor: '#40414A',
            padding: [3, 5, 3, 5],
            margin: -205,
            lineHeight: 18,
            shadowBlur: 0,
            formatter: function (params, text) {
              const useRate = BigNumber(current.base);
              const currentXDisplay = tryFormatNumber(BigNumber(useRate).gt(100) ? 100 : useRate, 2);
              return intl.get('market.current') + `: ${intl.get('market.detail_use_rate')} ${currentXDisplay}%`;
            }
          }
        },
        axisLabel: {
          interval: 0,
          formatter: function (value, idx) {
            if (idx % 10 === 0 && idx !== 0) {
              return idx;
            } else {
              return null;
            }
          },
          textStyle: {
            color: isWhite ? 'rgba(34,35,43,0.6)' : 'rgba(255,255,255,0.6)',
            fontSize: '10px',
            lineHeight: 14,
            fontFamily: 'Avenir Next',
            padding: [0, 0, 0, 0]
          }
        }
      },
      series: [
        {
          name: intl.get('market.borrow_apy'),
          type: 'line',
          hoverAnimation: false,
          silent: true,
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
              // shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(255, 255, 255, 0.5)',
              color: '#18C19F',
              borderColor: '#ffffff',
              borderWidth: 3
            }
          },
          data: borrowList,
          showSymbol: true,
          symbolSize: 12
          // markPoint: {
          //   symbol: 'circle',
          //   symbolSize: 0.01,
          //   data: markPoint,
          //   label: {
          //     show: !isHovering,
          //     distance: [70, 0]
          //   }
          // }
        },
        {
          name: intl.get('market.deposit_apy'),
          type: 'line',
          silent: true,
          itemStyle: {
            normal: {
              opacity: 0,
              color: isWhite ? '#4b52df' : '#9195fb',
              lineStyle: {
                width: 3
              }
            },
            emphasis: {
              opacity: 1,
              shadowOffsetX: 0,
              shadowColor: 'rgba(255, 255, 255, 0.5)',
              color: isWhite ? '#4b52df' : '#9195fb',
              borderColor: '#ffffff',
              borderWidth: 3
            }
          },
          hoverAnimation: false,
          data: supplyList,
          showSymbol: true,
          symbolSize: 12
        }
      ]
    };
  }

  showTooltipForCurrentData = () => {
    const instance = this.echartRef?.getEchartsInstance();
    // console.log('ECharts instance:', instance);
    if (!instance) return;
    if (!this.props.jTokenData.model?.length) {
      setTimeout(this.showTooltipForCurrentData, 1000);
      return;
    }
    const idx = this.props.jTokenData.model.findIndex(item => item.current);
    // console.log('show tooitp', instance);

    instance.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex: idx
    });
    this.props.market.setInterestRateGraphIndex(-1);
  };
  hideTooltip = () => {
    const instance = this.echartRef?.getEchartsInstance();
    instance &&
      instance.dispatchAction({
        type: 'hideTip'
      });
  };

  onChartHightLight = params => {
    if (!this.state.mobile) {
      return;
    }

    if (!params || !params.batch || !params.batch[0]) {
      return;
    }

    this.props.market.setInterestRateGraphIndex(params.batch[0].dataIndex);
  };
  onShowMintApyChange = e => {
    this.setState({
      isHovering: true
    });
    this.hideTooltip();
    setTimeout(() => {
      this.setState({
        isHovering: false
      });
      this.showTooltipForCurrentData();
    });
    this.props.onShowMintApyChange(e.target.checked);
  };
  onChartReady = () => {
    setTimeout(this.showTooltipForCurrentData, 1000);
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
  initRef = e => {
    this.echartRef = e;
  };
  render() {
    const { jTokenData, showMintApy } = this.props;
    const { openMint } = this.props.lend;
    const { mobile, isHovering } = this.state;
    const onEvents = {
      highlight: this.onChartHightLight
      // downplay: this.onChartDownplay
    };

    const mintApy = Config.usddMint.includes(jTokenData.jtokenAddress)
      ? jTokenData.mintApyWithUSDD
      : jTokenData.mintApy;
    const mintApyTRX = jTokenData.mintApyTRX;
    const apy = mintApy !== '--' && BigNumber(mintApy).gt(0) ? mintApy : mintApyTRX;

    const shouldShowMintApyDetail =
      checkIfShouldShowMintApyDetail(showMintApy, jTokenData.collateralSymbol, apy) && openMint;
    const shouldShowCheckbox = checkIfShouldShowMintApyDetail(true, jTokenData.collateralSymbol, apy) && openMint;

    return (
      <div className="interest-rate-model section">
        <div className="title-wrap">
          <span className="title color-primary">{intl.get('v2.interest_rate_model')}</span>
          {shouldShowCheckbox ? (
            <div className="checkbox-wrap">
              <Checkbox className="show-mint-apy" checked={showMintApy} onChange={this.onShowMintApyChange}>
                <span className="fs12 color-light">{intl.get('modal_mining_apy')}</span>
              </Checkbox>
            </div>
          ) : null}
        </div>
        <div className="section-content">
          <InterestRateMobileTooltip jTokenData={jTokenData} showMintApy={shouldShowMintApyDetail} />
          <div
            style={{ position: 'relative' }}
            onMouseOver={mobile ? null : this.onChartMouseover}
            onMouseOut={this.onChartMouseout}
          >
            <span
              className="fs12 color-light fake-grid-name"
              style={{ position: 'absolute', zIndex: 1, top: mobile ? 10 : 0, left: mobile ? 15 : 0 }}
            >
              APY (%)
            </span>
            <ReactEcharts
              option={this.getEchartsOption(shouldShowMintApyDetail)}
              style={{ height: mobile ? '51.4666vw' : 238 }}
              className="market-detail-echarts-v2 mt-base"
              onEvents={onEvents}
              ref={this.initRef}
              onChartReady={this.onChartReady}
            />
            {mobile && (
              <div className="show-current" onClick={e => this.setState({ dummyProp: true })}>
                <span className="reset-icon"></span>
                <span className="reset-text">{intl.get('show_current')}</span>
              </div>
            )}
          </div>
          <div className="legend-wrap">
            <span className="legend fs12 color-light">{intl.get('market.detail_use_rate')} (%)</span>
            <div className="flex legend">
              <span className="legend-item color-light flex">
                <span className="square deposit"></span>
                <span className="fs12">{intl.get('lend.depositapy')}</span>
              </span>
              <span className="legend-item color-light flex">
                <span className="square borrow"></span>
                <span className="fs12">{intl.get('market.borrow_apy')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export { InterestRateModel };
