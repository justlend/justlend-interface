import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react';
import ReactECharts from 'echarts-for-react';
import isMobile from 'ismobilejs';
import * as echarts from 'echarts';
import moment from 'moment';
import { formatFiatValue } from '../../../utils/formatters';
import { emptyReactNodeNew, BigNumber } from '../../../utils/helper';
import Stores from '../../../stores';

export const HistoricalChart = observer(({ timeFrame }) => {
  const [mobile] = useState(isMobile(window.navigator).any);
  const { dashboardStore, lend } = Stores;
  const { theme } = lend;
  const is24h = timeFrame === '1D';
  const chartHeight = 150;

  /**
   * @param {Array} data - The chart data from the store.
   * @returns {object} - The option object for ECharts.
   */
  const getChartOption = data => {
    const dates = data?.supplyList?.map(item =>
      moment(item.time).utc()
        .startOf('hour')
        .format(is24h ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD')
    ) || [];
    const supplyData = data?.supplyList?.map(item => item.value) || [];
    const borrowData = data?.borrowList?.map(item => item.value) || [];
    const collateralData = data?.collateralList?.map(item => item.value) || [];
    const newBorrowData = borrowData.map((item, index) => {
      if (+item == 0) return item;
      if (BigNumber(item).div(collateralData[index]).lt(0.015))
        return BigNumber(collateralData[index]).times(0.015).toString();
      return item;
    });

    const isWhite = theme === 'white';

    const option = {
      grid: [
        {
          top: '5%',
          height: '35%',
          left: 0,
          right: 0,
          bottom: 0,
          containLabel: true
        },
        {
          top: '42%',
          height: '58%',
          left: 0,
          right: 0,
          bottom: 0,
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
          show: false,
          type: 'category',
          gridIndex: 1,
          data: dates,
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: { show: false }
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
          min: Math.min(...supplyData),
          max: Math.max(...supplyData),
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
        trigger: 'axis',
        confine: mobile,
        backgroundColor: isWhite ? '#fff' : 'rgba(64, 65, 74, 1)',
        borderColor: isWhite ? '#fff' : 'rgba(64, 65, 74, 1)',
        borderRadius: 10,
        padding: 0,
        textStyle: { color: 'rgba(255, 255, 255, 0.6)' },
        formatter: params => {
          const { dataIndex, name } = params[0];
          let tooltipHtml = `
            <div class="tooltip-elements">
              <div class="tooltip-title"><span>${name}<span class="local">(UTC)</span></span></div>
              <div class="tooltip-element">
                <div class="tooltip-name"><em class=${'tooltip-block-supply'}></em> ${intl.get(
            'jlv2.home.supplied'
          )}</div>
                <div class="tooltip-value"> ${formatFiatValue(supplyData[dataIndex])}</div>
              </div>
              <div class="tooltip-element">
                <div class="tooltip-name"><em class=${'tooltip-block-collateral'}></em> ${intl.get(
            'jlv2.home.borrowed'
          )}</div>
                <div class="tooltip-value"> ${formatFiatValue(borrowData[dataIndex])}</div>
              </div>
              <div class="tooltip-element">
                <div class="tooltip-name"><em class=${'tooltip-block-borrow'}></em> ${intl.get(
            'jlv2.market.collateral'
          )}</div>
                <div class="tooltip-value"> ${formatFiatValue(collateralData[dataIndex])}</div>
              </div>
            </div>`;
          return tooltipHtml;
        }
      },
      series: [
        {
          data: supplyData,
          type: 'line',
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: true,
          symbolSize: 8,
          showSymbol: false,
          symbol: 'circle',
          name: 'Supply',
          lineStyle: {
            width: 1,
            color: isWhite ? '#24B887' : '#24B887'
          },
          itemStyle: {
            color: isWhite ? '#24B887' : '#61EA00',
            borderColor: '#fff',
            borderWidth: 3,
            shadowOffsetX: 0
          }
        },
        {
          data: newBorrowData,
          type: 'bar',
          yAxisIndex: 1,
          xAxisIndex: 1,
          stack: 'a',
          barMaxWidth: 40,
          name: 'Borrow',
          itemStyle: {
            color: isWhite ? '#5C49FC' : '#3D2EB8',
            borderRadius: [1, 1, 0, 0]
          }
        },
        {
          data: collateralData,
          type: 'bar',
          yAxisIndex: 1,
          xAxisIndex: 1,
          stack: 'a',
          barMaxWidth: 40,
          name: 'Collateral',
          itemStyle: {
            color: isWhite ? '#ED9938' : '#ED9938',
            borderRadius: [1, 1, 0, 0]
          }
        }
      ]
    };

    return option;
  };

  if (dashboardStore.chartLoading) {
    return null;
  }

  if (!dashboardStore.chartData?.supplyList?.length) {
    return (
      <div className="chart-placeholder" style={{ height: chartHeight }}>
        {emptyReactNodeNew()}
      </div>
    );
  }

  return (
    <ReactECharts
      option={getChartOption(dashboardStore.chartData)}
      style={{ height: chartHeight, width: '100%' }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
});
