// src/components/JLv2/Market/MarketInterestInfo.jsx
import React, { useMemo } from 'react';
import { observer } from 'mobx-react';
import ReactECharts from 'echarts-for-react';
import intl from 'react-intl-universal';
import isMobile from 'ismobilejs';
import Store from '../../../stores';
import { formatApyRate, isTrxToken, formatDate } from '../../../utils/formatters';
import Config from '../../../config';
import { cutMiddle, formatNumber, BigNumber, copyToClipboardNew, emptyReactNodeNew } from '../../../utils/helper';

const handleCopy = value => {
  copyToClipboardNew(value, () => {
    const copyEle = document.getElementsByClassName(`copy-${value || ''}`)[0];
    copyEle.classList.add('copied-icon');
    setTimeout(() => {
      copyEle.classList.remove('copied-icon');
    }, 1000);
  });
};

const ParamRow = ({ label, isTrx, value, copy, linkTo }) => (
  <div className="param-row">
    <span className="label">{label}</span>
    <span className="value">
      {value}
      {copy && !isTrx && <span className={`copy-v2 copy-${copy || ''}`} onClick={() => handleCopy(copy)}></span>}
      {linkTo && (
        <a
          className="link-to"
          href={Config.tronscanUrl + (isTrx ? `/token/0` : `/token20/${linkTo}`)}
          target="_blank"
        />
      )}
    </span>
  </div>
);

export const MarketInterestInfo = observer(() => {
  const { marketV2: marketStore, lend } = Store;
  const { marketDetails } = marketStore;
  const { theme } = lend;

  if (!marketDetails) return null;

  const getChartOption = () => {
    const data = marketDetails.interestRateModelCurve;
    const chartData = Array.isArray(data) ? data : [];
    const isMobileDevice = useMemo(() => isMobile(window.navigator).any, []);

    if (chartData[0]) {
      if (chartData[0].utilizationRate != 0) {
        chartData.unshift({
          utilizationRate: 0,
          supplyAPY: null,
          borrowAPY: null
        });
      }
    }

    const isWhite = theme === 'white';
    const percents = chartData.map(item => BigNumber(item.utilizationRate).times(100).toNumber());
    const vaultApy = chartData.map(item => item.supplyAPY);
    const borrowingApy = chartData.map(item => item.borrowAPY);
    const currentRate = BigNumber(marketDetails.currentUtilizationRate).times(100).toNumber();
    const targetRate = BigNumber(marketDetails.targetUtilizationRate).times(100).toNumber();

    let currentOffset = 0;
    let targetOffset = 0;
    let targetValue1 = 94.5;
    let targetValue2 = -40;
    let targetValue3 = 4.5;
    let targetValue4 = 40;
    let targetValue5 = 95.5;
    if (isMobileDevice) {
      targetValue1 = 85;
      targetValue2 = -45;
      targetValue3 = 15;
      targetValue4 = 45;
      targetValue5 = 85;
    }
    if (currentRate >= targetValue1) {
      currentOffset = targetValue2;
    }
    if (currentRate <= targetValue3) {
      currentOffset = targetValue4;
    }
    if (targetRate >= targetValue5) {
      targetOffset = targetValue2;
    }

    if (isMobileDevice && targetRate <= 15) {
      targetOffset = 45;
    }

    const option = {
      legend: {
        top: 0,
        left: 0,
        orient: 'horizontal',
        icon: 'rect',
        itemWidth: 8,
        itemHeight: 8,
        itemStyle: {
          borderWidth: 0
        },
        selectedMode: false,
        textStyle: {
          color: isWhite ? '#737480' : 'rgba(255, 255, 255, 0.6)',
          fontSize: 12,
          fontWeight: 400
        }
      },
      grid: [
        {
          top: 60,
          left: 0,
          right: 10,
          bottom: 0,
          containLabel: true
        }
      ],
      xAxis: [
        {
          type: 'category',
          gridIndex: 0,
          data: percents,
          axisLine: {
            show: true,
            onZero: false,
            lineStyle: {
              color: isWhite ? 'rgba(34,35,43,0.06)' : 'rgba(255,255,255,0.06)'
            }
          },
          axisTick: {
            show: false
          },
          splitNumber: 1,
          axisLabel: {
            interval: 0,
            // textStyle: { color: 'transparent' }
            textStyle: {
              color: isWhite ? '#737480' : 'rgba(255,255,255,0.6)',
              fontSize: '10px',
              lineHeight: 14,
              fontFamily: 'Avenir Next',
              padding: [0, 0, 0, 0]
            },
            align: 'center',
            formatter: function (value) {
              return value == 0 || value == 100 ? `${value}%` : '';
            }
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          gridIndex: 0,
          axisLabel: {
            // clear label word
            formatter: function (value) {
              return '';
            }
          },
          min: Math.min(...borrowingApy, ...vaultApy),
          max: Math.max(...borrowingApy, ...vaultApy),
          show: false
        }
      ],
      axisPointer: {
        link: [
          {
            xAxisIndex: 'all'
          }
        ]
      },
      tooltip: {
        trigger: 'axis',
        confine: isMobileDevice,
        backgroundColor: isWhite ? '#fff' : 'rgba(64, 65, 74, 1)',
        borderColor: isWhite ? '#fff' : 'rgba(64, 65, 74, 1)',
        borderRadius: 10,
        padding: 0,
        textStyle: { color: 'rgba(255, 255, 255, 0.6)' },
        formatter: params => {
          const point = params[0];
          const percent = point.name;
          const borrowApy = formatApyRate(
            params?.find(item => item.seriesName === intl.get('jlv2.market.borrow_apy'))?.value
          );
          const vaultApy = formatApyRate(
            params?.find(item => item.seriesName === intl.get('jlv2.market.supply_apy'))?.value
          );

          let tooltipHtml = `
                <div class="tooltip-elements">
                  <div class="tooltip-title">
                    <div class="tooltip-name">${intl.get('jlv2.market.target_utilization')}</div>
                    <div class="tooltip-value"> ${percent}%</div>
                  </div>
                  <div class="tooltip-element">
                    <div class="tooltip-name">${intl.get('jlv2.market.borrow_rate')}</div>
                    <div class="tooltip-value">${borrowApy}</div>
                  </div>
                  <div class="tooltip-element">
                    <div class="tooltip-name">${intl.get('jlv2.market.vault_apy')}</div>
                    <div class="tooltip-value">${vaultApy}</div>
                  </div>
                </div>`;
          return tooltipHtml;
        }
      },
      series: [
        {
          data: borrowingApy,
          type: 'line',
          xAxisIndex: 0,
          yAxisIndex: 0,
          symbolSize: 8,
          smooth: false,
          showSymbol: false,
          symbol: 'circle',
          name: intl.get('jlv2.market.borrow_apy'),
          rateType: 'borrow', 
          lineStyle: {
            width: isWhite ? 1.5 : 1,
            color: '#9195FB'
          },
          itemStyle: {
            color: '#9195FB',
            borderColor: '#fff',
            borderWidth: 3,
            shadowOffsetX: 0
          },
          emphasis: {
            itemStyle: {
              show: false,
              color: '#9195FB',
              borderColor: '#fff',
              borderWidth: 3,
              shadowOffsetX: 0
            }
          },
          
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                xAxis: currentRate > 100 ? 100 : currentRate,
                lineStyle: { type: 'dashed', color: isWhite ? '#22232B' : 'rgba(255, 255, 255, 0.4)' },
                label: {
                  show: true,
                  position: 'end', 
                  distance: 0,
                  offset: [currentOffset, 20],
                  formatter: `{lineA|${intl.get('jlv2.market.current')}} {lineA|(${formatApyRate(currentRate, true)})}`,
                  rich: {
                    lineA: {
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: '400',
                      lineHeight: 16
                    }
                  },
                  backgroundColor: '#47474B',
                  padding: [2, 6],
                  borderRadius: 2,
                  color: '#fff'
                }
              },
              {
                xAxis: targetRate,
                lineStyle: { type: 'dashed', color: isWhite ? '#22232B' : 'rgba(255, 255, 255, 0.4)' },
                label: {
                  show: true,
                  position: 'end',
                  distance: 0,
                  offset: [targetOffset, -1],
                  formatter: `{lineA|${intl.get('jlv2.market.target')}} {lineA|(${formatApyRate(targetRate, true)})}`,
                  rich: {
                    lineA: {
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: '400',
                      lineHeight: 16
                    }
                  },
                  backgroundColor: '#47474B',
                  padding: [2, 6],
                  borderRadius: 2,
                  color: '#fff'
                }
              }
            ]
          }
        },
        {
          data: vaultApy,
          type: 'line',
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: false,
          symbolSize: 8,
          showSymbol: false,
          symbol: 'circle',
          name: intl.get('jlv2.market.supply_apy'),
          rateType: 'supply', 
          lineStyle: {
            width: isWhite ? 1.5 : 1,
            color: '#18C19F'
          },
          itemStyle: {
            color: '#18C19F',
            borderColor: '#fff',
            borderWidth: 3,
            shadowOffsetX: 0
          },
          emphasis: {
            itemStyle: {
              show: false,
              color: '#18C19F',
              borderColor: '#fff',
              borderWidth: 3,
              shadowOffsetX: 0
            }
          }
        }
      ]
    };

    return option;
  };

  return (
    <div className="market-interest-info panel-v2">
      <div className="panel-title">{intl.get('jlv2.market.market_info')}</div>
      <div className="interest-mode">
        <div className="im-title">{intl.get('jlv2.market.interest_model')}</div>
        <div className="im-token">
          {`${cutMiddle(marketDetails.interestModeAddress || '--', 6, 6)}`}
          <a
            className="link-to"
            href={Config.tronscanUrl + '/contract/' + marketDetails.interestModeAddress}
            target="_blank"
          >
            {' '}
          </a>
        </div>
      </div>
      <div className="content-grid">
        <div className="chart-container">
          {marketDetails?.interestRateModelCurve?.length > 0 ? (
            <ReactECharts option={getChartOption()} style={{ height: 200, width: '100%' }} />
          ) : (
            emptyReactNodeNew()
          )}
        </div>
        <div className="params-list">
          <ParamRow
            label={intl.get('jlv2.market.borrowed_token')}
            value={`${cutMiddle(isTrxToken(marketDetails.borrowAddress) ? '' : marketDetails.borrowAddress, 6, 6)} 
            ${
              isTrxToken(marketDetails.borrowAddress)
                ? marketDetails.borrowSymbol
                : '(' + (marketDetails.borrowSymbol || '--') + ')'
            }
            `}
            copy={marketDetails.borrowAddress}
            isTrx={isTrxToken(marketDetails.borrowAddress)}
            linkTo={marketDetails.borrowAddress}
          />
          <ParamRow
            label={intl.get('jlv2.market.collateraled_token')}
            value={`${cutMiddle(
              isTrxToken(marketDetails.collateralAddress) ? '' : marketDetails.collateralAddress,
              6,
              6
            )} ${
              isTrxToken(marketDetails.collateralAddress)
                ? marketDetails.collateralSymbol
                : '(' + (marketDetails.collateralSymbol || '--') + ')'
            }`}
            copy={marketDetails.collateralAddress}
            isTrx={isTrxToken(marketDetails.collateralAddress)}
            linkTo={marketDetails.collateralAddress}
          />
          <ParamRow label={intl.get('jlv2.market.create_on')} value={formatDate(marketDetails.createDate)} />
          <ParamRow label={intl.get('jlv2.market.borrowers')} value={formatNumber(marketDetails.borrowersCount)} />
          <ParamRow label={intl.get('jlv2.market.liquidation_ltv')} value={formatApyRate(marketDetails.lltv)} />
          <ParamRow
            label={intl.get('jlv2.market.target_utilization')}
            value={formatApyRate(marketDetails.targetUtilizationRate)}
          />
          <ParamRow
            label={intl.get('jlv2.market.liquidator_reward')}
            value={formatApyRate(marketDetails.liquidationPenalty)}
          />
        </div>
      </div>
    </div>
  );
});
