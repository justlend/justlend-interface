// src/components/JLv2/Market/MarketHistoricalChart.jsx
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import ReactECharts from 'echarts-for-react';
import isMobile from 'ismobilejs';
import moment from 'moment';
import Store from '../../../stores';
import { emptyReactNodeNew } from '../../../utils/helper';
import {
  formatApyRate,
  formatCompactFiatValue,
  formatFiatValue,
  formatTokenAmount,
  getXAxisInterval
} from '../../../utils/formatters';
import { Select } from 'antd';

const { Option } = Select;

export const MarketHistoricalChart = observer(() => {
  const { marketV2: marketStore, lend } = Store;
  const { marketHistoricalData, marketDetails, chartLoading } = marketStore;

  const [mobile] = useState(isMobile(window.navigator).any);
  const [chartType, setChartType] = useState('usd');

  const onSelectChange = value => {
    setChartType(value);
  };

  const getChartOption = () => {
    const data = marketHistoricalData?.list;
    const type = chartType;
    const isWhite = lend.theme === 'white';
    const chartData = Array.isArray(data) ? data : [];
    const dates = chartData.map(item =>
      moment(item.timestamp * 1000)
        ?.utc()
        ?.startOf('hour')
        .format('YYYY-MM-DD HH:mm')
    );
    const totalBorrow = chartData.map(item => item.borrowTvl);
    const borrow = chartData.map(item => item.borrow);
    const totalCollateral = chartData.map(item => item.collateralTvl);
    const collateral = chartData.map(item => item.collateral);
    const borrowApy = chartData.map(item => item.borrowApy);
    const vaultApy = chartData.map(item => item.vaultApy);

    let barSeries = [
      {
        data: totalCollateral,
        type: 'bar',
        yAxisIndex: 1,
        xAxisIndex: 1,
        stack: 'a',
        barMaxWidth: 40,
        name: 'totalCollateral',
        itemStyle: {
          color: 'rgba(116, 98, 255, 0.2)',
          borderRadius: [1, 1, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: '#7462FF'
          }
        }
      },
      {
        data: totalBorrow,
        type: 'bar',
        yAxisIndex: 1,
        xAxisIndex: 1,
        stack: 'a',
        barMaxWidth: 40,
        name: 'totalBorrow',
        itemStyle: {
          color: 'rgba(116, 98, 255, 0.1)',
          borderRadius: [1, 1, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: '#7462FF'
          }
        }
      }
    ];

    if (type !== 'usd') {
      barSeries = [
        {
          data: type === 'borrow' ? borrow : collateral,
          type: 'bar',
          yAxisIndex: 1,
          xAxisIndex: 1,
          stack: 'a',
          barMaxWidth: 40,
          name: 'totalCollateral',
          itemStyle: {
            color: 'rgba(116, 98, 255, 0.2)',
            borderRadius: [1, 1, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: '#7462FF'
            }
          }
        }
      ];
    }

    const option = {
      grid: [
        {
          top: '3%',
          height: '35%',
          left: 0,
          right: mobile ? 10 : 5,
          containLabel: true
        },
        {
          top: '40%',
          height: '60%',
          left: 0,
          right: mobile ? 10 : 5,
          containLabel: true
        }
      ],
      xAxis: [
        {
          show: false,
          type: 'category',
          gridIndex: 0,
          data: dates,
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: { show: false }
        },
        {
          type: 'category',
          gridIndex: 1,
          data: dates,
          axisLine: {
            show: true,
            onZero: false,
            lineStyle: {
              color: 'transparent'
            }
          },
          axisTick: {
            show: false
          },
          splitNumber: 1,
          axisLabel: {
            interval: getXAxisInterval(dates.length, mobile),
            // textStyle: { color: 'transparent' }
            textStyle: {
              color: isWhite ? '#737480' : '#FFFFFF',
              fontSize: '10px',
              lineHeight: 14,
              fontFamily: 'Avenir Next',
              padding: [0, 0, 0, 0]
            },
            align: 'center',
            formatter: function (value) {
              return moment(value).format('MM-DD');
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
          min: Math.min(...borrowApy, ...vaultApy),
          max: Math.max(...borrowApy, ...vaultApy),
          show: false
        },
        {
          type: 'value',
          show: false,
          gridIndex: 1,
          axisLabel: {
            // clear label word
            formatter: function (value) {
              return '';
            }
          }
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
        confine: true,
        trigger: 'axis',
        backgroundColor: isWhite ? '#fff' : 'rgba(64, 65, 74, 1)',
        borderColor: isWhite ? '#fff' : 'rgba(64, 65, 74, 1)',
        borderRadius: 10,
        padding: 0,
        textStyle: { color: 'rgba(255, 255, 255, 0.6)' },
        formatter: params => {
          // console.log(params, '******')
          const point = params[0];
          const date = point.name;
          const totalBorrow = formatCompactFiatValue(params?.find(item => item.seriesName === 'totalBorrow')?.value);
          const totalCollateral = formatCompactFiatValue(
            params?.find(item => item.seriesName === 'totalCollateral')?.value
          );
          const vaultApy = formatApyRate(params?.find(item => item.seriesName === 'vaultApy')?.value);
          const borrowApy = formatApyRate(params?.find(item => item.seriesName === 'borrowApy')?.value);

          let tooltipHtml = `
            <div class="tooltip-elements">
              <div class="tooltip-title"><span>${date}<span class="local">(UTC)</span></span></div>
              <div class="tooltip-element">
                <div class="tooltip-name">${intl.get('jlv2.market.borrow_rate')}</div>
                <div class="tooltip-value" style='color: #ED9938;'> ${borrowApy}</div>
              </div>
              <div class="tooltip-element border-bottom">
                <div class="tooltip-name">${intl.get('jlv2.market.vault_apy')}</div>
                <div class="tooltip-value" style='color: #18C19F;'> ${vaultApy}</div>
              </div>
              ${
                type === 'usd'
                  ? `<div class="tooltip-element">
                      <div class="tooltip-name">${intl.get('jlv2.market.total_borrowed')}</div>
                      <div class="tooltip-value"> ${totalBorrow}</div>
                    </div>`
                  : ''
              }
              ${
                type === 'borrow' || type === 'usd'
                  ? `<div class="tooltip-element value ${type === 'borrow' ? 'margin-top-12' : ''}">
                      <div class="tooltip-name">${type === 'borrow' ? intl.get('jlv2.market.total_borrowed') : ''}</div>
                      <div class="tooltip-value"> ~ ${formatTokenAmount(
                        borrow[point.dataIndex],
                        marketDetails?.borrowSymbol
                      )}</div>
                    </div>`
                  : ''
              }
              ${
                type === 'usd'
                  ? `<div class="tooltip-element">
                        <div class="tooltip-name">${intl.get('jlv2.market.total_collateral')}</div>
                        <div class="tooltip-value"> ${totalCollateral}</div>
                      </div>`
                  : ''
              }
              ${
                type === 'collateral' || type === 'usd'
                  ? `<div class="tooltip-element value ${type === 'collateral' ? 'margin-top-12' : ''}">
                      <div class="tooltip-name">${
                        type === 'collateral' ? intl.get('jlv2.market.total_collateral') : ''
                      }</div>
                      <div class="tooltip-value"> ~ ${formatTokenAmount(
                        collateral[point.dataIndex],
                        marketDetails?.collateralSymbol
                      )}</div>
                    </div>`
                  : ''
              }
            </div>`;
          return tooltipHtml;
        }
      },
      series: [
        {
          data: vaultApy,
          type: 'line',
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: false,
          symbolSize: 8,
          showSymbol: false,
          symbol: 'circle',
          name: 'vaultApy',
          lineStyle: {
            width: isWhite ? 1.5 : 1,
            color: '#18C19F'
          },
          itemStyle: {
            color: isWhite ? '#18C19F' : '#61EA00',
            borderColor: '#fff',
            borderWidth: 3,
            shadowOffsetX: 0
          },
          emphasis: {
            itemStyle: {
              color: isWhite ? '#18C19F' : '#61EA00',
              borderColor: '#fff',
              borderWidth: 3,
              shadowOffsetX: 0
            }
          }
        },
        {
          data: borrowApy,
          type: 'line',
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: false,
          symbolSize: 8,
          showSymbol: false,
          symbol: 'circle',
          name: 'borrowApy',
          lineStyle: {
            width: isWhite ? 1.5 : 1,
            color: '#ED9938'
          },
          itemStyle: {
            color: isWhite ? '#ED9938' : '#61EA00',
            borderColor: '#fff',
            borderWidth: 3,
            shadowOffsetX: 0
          },
          emphasis: {
            itemStyle: {
              color: isWhite ? '#ED9938' : '#61EA00',
              borderColor: '#fff',
              borderWidth: 3,
              shadowOffsetX: 0
            }
          }
        },
        ...barSeries
      ]
    };

    return option;
  };

  return (
    <div className="market-historical-chart panel-v2">
      <div className="chart-header">
        <div className="panel-title">
          {intl.get('jlv2.market.market_data')}{' '}
          {marketDetails?.collateralSymbol && marketDetails?.borrowSymbol ? (
            <span className="panel-subtitle">
              {intl.get('jlv2.market.in_market_name')}
              {marketDetails?.marketName}
            </span>
          ) : null}
          <div className="chart-controls">
            {/* <span>{intl.get('jlv2.market.filter')}</span> */}
            <div className="countby-select-container pr">
              <Select
                value={chartType}
                onChange={onSelectChange}
                className="countby-select"
                dropdownClassName="v2-select-dropdown"
                getPopupContainer={() => document.querySelector('.countby-select-container')}
              >
                <Option key="USD" value="usd" className="get-select-title">
                  {intl.get('jlv2.market.usd')}
                </Option>
                <Option key="Borrow" value="borrow" className="get-select-title">
                  {intl.getHTML('jlv2.market.borrow_token_loan', { token: marketDetails?.borrowSymbol })}
                </Option>
                <Option key="Collateral" value="collateral" className="get-select-title">
                  {intl.getHTML('jlv2.market.collateral_token_collateral', { token: marketDetails?.collateralSymbol })}
                </Option>
              </Select>
            </div>
          </div>
        </div>
        <div className="chart-current-data">
          <div>
            <div className="ccd-title">{intl.get('jlv2.market.total_borrowed')}</div>
            <div className="ccd-value">
              {!chartLoading ? (
                chartType === 'usd' ? (
                  <>
                    {formatFiatValue(marketHistoricalData.totalBorrowUsd)}{' '}
                    <span>≈ {formatTokenAmount(marketHistoricalData.totalBorrow, marketDetails?.borrowSymbol)}</span>
                  </>
                ) : (
                  <>
                    {formatTokenAmount(marketHistoricalData.totalBorrow, marketDetails?.borrowSymbol)}{' '}
                    <span>≈ {formatFiatValue(marketHistoricalData.totalBorrowUsd)}</span>
                  </>
                )
              ) : (
                '--'
              )}
            </div>
          </div>
          <div>
            <div className="ccd-title">{intl.get('jlv2.market.total_collateral')}</div>
            <div className="ccd-value">
              {!chartLoading ? (
                chartType === 'usd' ? (
                  <>
                    {formatFiatValue(marketHistoricalData.totalCollateralUsd)}{' '}
                    <span>
                      ≈ {formatTokenAmount(marketHistoricalData.totalCollateral, marketDetails?.collateralSymbol)}
                    </span>
                  </>
                ) : (
                  <>
                    {formatTokenAmount(marketHistoricalData.totalCollateral, marketDetails?.collateralSymbol)}{' '}
                    <span>≈ {formatFiatValue(marketHistoricalData.totalCollateralUsd)}</span>
                  </>
                )
              ) : (
                '--'
              )}
            </div>
          </div>
          <div>
            <div className="ccd-title">{intl.get('jlv2.market.borrow_rate')}</div>
            <div className="ccd-value">
              {!chartLoading ? <span>{formatApyRate(marketHistoricalData.borrowApy)}</span> : '--'}
            </div>
          </div>
        </div>
      </div>
      {chartLoading ? (
        <div style={{ height: '250px' }} className="list-empty">
          {intl.get('jlv2.home.loading')}...
        </div>
      ) : marketHistoricalData?.list?.length > 0 ? (
        <ReactECharts
          option={getChartOption()}
          style={{ height: '250px', width: '100%' }}
          notMerge={true}
          lazyUpdate={true}
        />
      ) : (
        emptyReactNodeNew()
      )}
    </div>
  );
});
