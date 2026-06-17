// src/components/JLv2/Vault/VaultHistoricalChart.jsx
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import intl from 'react-intl-universal';
import ReactECharts from 'echarts-for-react';
import isMobile from 'ismobilejs';
import Store from '../../../stores';
import {
  formatApyRate,
  formatFiatValue,
  formatCompactFiatValue,
  formatTokenAmount,
  getXAxisInterval
} from '../../../utils/formatters';
import * as echarts from 'echarts';
import moment from 'moment';
import BigNumber from 'bignumber.js';
import { Select } from 'antd';
import { useVaultMiningApy } from '../../../utils/hooks/useMining';
import ApyBreakdownTooltip from '../Common/ApyBreakdownTooltip';

const { Option } = Select;

const toFiniteNumber = value => {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
};

// /vault/history-data returns supplyApy and miningUsddApy / miningTrxApy
// all as fractions (e.g. "0.0421" = 4.21%), so consume them directly.
const getHistoryMiningApy = record => {
  const usdd = toFiniteNumber(record?.miningUsddApy ?? record?.miningApyUsdd);
  const trx = toFiniteNumber(record?.miningTrxApy ?? record?.miningApyTrx);
  return { usdd, trx, total: usdd + trx };
};

export const VaultHistoricalChart = observer(() => {
  const { vaultStore, lend } = Store;
  const { historicalData, isLoading, vaultDetails } = vaultStore;

  const [mobile] = useState(isMobile(window.navigator).any);
  const [chartType, setChartType] = useState('usd');
  const { enabled: miningEnabled, baseApy, miningApy } = useVaultMiningApy(vaultDetails.address);

  // The "Current Supply APY" header reflects live values from the mining
  // hook (same source as the breakdown tooltip beside it and the My
  // Position / ActionBox panels). Historical record values are reserved for
  // the chart line, where they belong; mixing the two here used to render a
  // header number that disagreed with its own tooltip.
  const liveBaseApy = baseApy != null ? baseApy : historicalData?.supplyBaseApy || 0;
  const displayLatestSupplyApy = miningEnabled
    ? new BigNumber(liveBaseApy || 0).plus(miningApy?.total || 0).toString()
    : liveBaseApy;

  const onSelectChange = value => {
    setChartType(value);
  };

  const getChartOption = () => {
    const data = historicalData?.historyRecords;
    const type = chartType;
    const isWhite = lend.theme === 'white';
    const chartData = Array.isArray(data) ? data : [];
    const dates = chartData.map(item => moment(item.timestamp)?.utc()?.startOf('hour').format('YYYY-MM-DD HH:mm'));
    const supplied = chartData.map(item => item.supplyTokenAmount);
    const supplyUsd = chartData.map(item => item.supplyUsd);
    const baseApy = chartData.map(item => toFiniteNumber(item.supplyApy));
    const historyMiningApy = chartData.map(getHistoryMiningApy);
    const apy = chartData.map((item, index) => baseApy[index] + historyMiningApy[index].total);

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
              color: isWhite ? '#fff' : 'rgba(255,255,255,0.06)'
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
              color: isWhite ? '#737480' : 'rgba(255,255,255,0.6)',
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
          min: Math.min(...apy),
          max: Math.max(...apy),
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
          const point = params[0];
          const date = point.name;
          // Per-point mining gating: each bar reflects its own historical
          // record. A bar may predate the vault's mining rollout, OR the vault
          // may have since closed mining while past bars retain miningUsddApy
          // — in either case fire icon + breakdown follow this bar's APY, not
          // the live vault-wide miningEnabled flag.
          const pointMiningTotal = historyMiningApy[point.dataIndex]?.total || 0;
          const pointHasMining = pointMiningTotal > 0;

          let tooltipHtml = `
              <div class="tooltip-elements">
                <div class="tooltip-title"><span>${date}<span class="local">(UTC)</span></span></div>
                <div class="tooltip-element">
                  <div class="tooltip-name">${intl.get('jlv2.vault.supply_apy3')}</div>
                  <div class="tooltip-value">
                    ${
                      vaultDetails?.tags?.includes('fire') && !pointHasMining
                        ? '<span class="fire-v2-smallest"></span>'
                        : ''
                    }
                    ${formatApyRate(apy[point.dataIndex])}
                    ${pointHasMining ? '<span class="fire-v2-smallest ml-4"></span>' : ''}
                  </div>
                </div>
                ${(() => {
                  if (!pointHasMining) return '';
                  const pointBase = baseApy[point.dataIndex] || 0;
                  return `<div class="tooltip-apy-breakdown">${formatApyRate(pointBase)} ${intl.get(
                    'mining.breakdown.base_apy'
                  )} + ${formatApyRate(pointMiningTotal)} ${intl.get('mining.breakdown.mining_apy')}</div>`;
                })()}
                ${
                  type === 'usd'
                    ? `<div class="tooltip-element">
                      <div class="tooltip-name"> ${intl.get('jlv2.vault.total_supply')}</div>
                      <div class="tooltip-value"> ${formatCompactFiatValue(supplyUsd[point.dataIndex])}</div>
                    </div>`
                    : `<div class="tooltip-element">
                      <div class="tooltip-name"> ${intl.get('jlv2.vault.total_supply')}</div>
                      <div class="tooltip-value">~ ${formatTokenAmount(supplied[point.dataIndex])} ${
                        vaultDetails?.assetSymbol
                      }</div>
                    </div>`
                }
                ${
                  type === 'amount'
                    ? ''
                    : `<div class="tooltip-element tooltip-no-name-element">
                      <div class="tooltip-name"> </div>
                      <div class="tooltip-value tooltip-value-no-name">~ ${formatTokenAmount(
                        supplied[point.dataIndex]
                      )} ${vaultDetails?.assetSymbol}</div>
                    </div>`
                }
              </div>`;
          return tooltipHtml;
        }
      },
      series: [
        {
          data: apy,
          type: 'line',
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: false,
          symbolSize: 8,
          showSymbol: false,
          symbol: 'circle',
          stack: 'c',
          name: 'Supply',
          lineStyle: {
            width: isWhite ? 2 : 1,
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
        {
          data: type === 'usd' ? supplyUsd : supplied,
          type: 'bar',
          yAxisIndex: 1,
          xAxisIndex: 1,
          stack: 'a',
          barMaxWidth: 40,
          name: 'Collateral',
          itemStyle: {
            color: 'rgba(36, 184, 101, 0.2)',
            borderRadius: [1, 1, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: '#24B865'
            }
          }
        }
      ]
    };

    return option;
  };

  return (
    <div className="vault-historical-chart panel-v2">
      <div className="panel-title">
        {intl.get('jlv2.vault.vault_data')}{' '}
        {vaultDetails.name ? (
          <span className="panel-subtitle">
            {intl.getHTML('jlv2.vault.vault_name', { vaultname: vaultDetails.name })}
          </span>
        ) : null}
        <div className="chart-controls">
          {/* <span>{intl.get('jlv2.vault.filter')}</span> */}
          <div className="countby-select-container pr">
            <Select
              value={chartType}
              onChange={onSelectChange}
              className="countby-select"
              dropdownClassName="v2-select-dropdown"
              getPopupContainer={() => document.querySelector('.countby-select-container')}
            >
              <Option key="USD" value="usd" className="get-select-title">
                {intl.get('jlv2.vault.usd')}
              </Option>
              <Option key="Borrow" value="amount" className="get-select-title">
                {intl.getHTML('jlv2.vault.compute_by_token', { token: vaultDetails?.assetSymbol })}
              </Option>
            </Select>
          </div>
        </div>
      </div>
      <div className="chart-current-data">
        <div>
          <div className="ccd-title">{intl.get('jlv2.vault.current_total_supply')}</div>
          {chartType === 'usd' ? (
            <div className="ccd-value">
              {formatFiatValue(historicalData?.currentSupplyUsd)}{' '}
              <span>≈ {formatTokenAmount(historicalData?.currentSupplyTokenAmount, vaultDetails?.assetSymbol)}</span>
            </div>
          ) : (
            <div className="ccd-value">
              {formatTokenAmount(historicalData?.currentSupplyTokenAmount, vaultDetails?.assetSymbol)}{' '}
              <span>≈ {formatFiatValue(historicalData?.currentSupplyUsd)}</span>
            </div>
          )}
        </div>
        <div>
          <div className="ccd-title">{intl.get('jlv2.vault.supply_apy1')}</div>
          <div className="ccd-value">
            {!miningEnabled && vaultDetails?.tags?.includes('fire') && <span class="fire-v2-small mr-4"></span>}
            {formatApyRate(displayLatestSupplyApy)}
            {miningEnabled && (
              <ApyBreakdownTooltip baseApy={baseApy} miningApy={miningApy} iconClassName="fire-v2-small" />
            )}
          </div>
        </div>
      </div>
      {isLoading ? (
        <div style={{ height: '250px' }}>{intl.get('jlv2.home.loading')}...</div>
      ) : (
        <ReactECharts option={getChartOption()} style={{ height: '250px', width: '100%' }} />
      )}
    </div>
  );
});
