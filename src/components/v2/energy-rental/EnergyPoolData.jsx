import React, { useEffect, useState, useRef, useContext } from 'react';
import * as echarts from 'echarts';
import BigNumber from 'bignumber.js';
import { observer } from 'mobx-react';
import isMobile from 'ismobilejs';
import { Tooltip } from 'antd';
import intl from 'react-intl-universal';
import { Config } from '../../../config';
import { StoreContext } from '../../Context/StoreContext';
import rentalAddressSvg from '../../../assets/images/v2/energy-rental/rental_address.svg';
import resourceSuppliersSvg from '../../../assets/images/v2/energy-rental/resource_suppliers.svg';
import { formatNumber } from '../../../utils/helper';
import rentalAddressWhiteSvg from '../../../assets/images/v2/energy-rental/rental_address_white.svg';
import resourceSuppliersWhiteSvg from '../../../assets/images/v2/energy-rental/resource_suppliers_white.svg';

const EnergyPoolData = props => {
  const mobile = isMobile(window.navigator).any;
  const { lend, energyRental } = useContext(StoreContext);
  const chartRef = useRef(null);
  const [poolData, setPoolData] = useState({ historyData: [] });
  const [totalEnergy, setTotalEnergy] = useState('--');
  const [time, setTime] = useState('--');
  const [apy, setApy] = useState('--%');
  const [rentingEnergy, setRentingEnergy] = useState('--');
  const [recoveryEnergy, setRecoveryEnergy] = useState('--');

  useEffect(() => {
    const chartDom = document.getElementById('charts');
    chartRef.current = echarts.init(chartDom);
    return () => {
      if (chartRef.current) {
        chartRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    setPoolData(props.data);

    if (props.data?.latestData) {
      setDefaultData(props.data.latestData);
    }
  }, [props.data]);

  useEffect(() => {
    setApy(BigNumber(energyRental?.marketData?.avgApy6h).times(100).toNumber());
  }, [props.apy]);

  useEffect(() => {
    const historyData = poolData.historyData;

    if (historyData?.length) {
      let timeArr = [];
      let apyArr = [];
      let rentingEnergyArr = [];
      let recoveryEnergyArr = [];

      historyData.forEach(item => {
        apyArr.push(BigNumber(item.totalApy).times(100).toNumber());
        rentingEnergyArr.push(item.rentEnergy);
        recoveryEnergyArr.push(item.recoverEnergy);
        timeArr.push(item.date);
      });

      chartsInit(timeArr, apyArr, rentingEnergyArr, recoveryEnergyArr);
    }
  }, [poolData, lend.theme]);

  const setDefaultData = latestData => {
    setTime(latestData.date);
    setApy(BigNumber(energyRental?.marketData?.avgApy6h).times(100).toNumber());
    setRentingEnergy(latestData.rentEnergy);
    setRecoveryEnergy(latestData.recoverEnergy);
    setTotalEnergy(latestData.totalEnergy);
  };

  const chartsInit = (timeArr, apyArr, rentingEnergyArr, recoveryEnergyArr) => {
    const { theme } = lend;
    const isWhite = theme === 'white';
    let dateTemp = '';
    let diffIdIndex = -1;

    const option = {
      grid: [
        {
          top: '3%',
          height: '37%',
          left: mobile ? 5 : 2,
          right: mobile ? 5 : 2,
          containLabel: true
        },
        {
          top: '40%',
          height: '58%',
          left: mobile ? 5 : 2,
          right: mobile ? 5 : 2,
          containLabel: true
        }
      ],
      xAxis: [
        {
          show: false,
          type: 'category',
          gridIndex: 0,
          data: timeArr,
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: { show: false }
        },
        {
          type: 'category',
          gridIndex: 1,
          data: timeArr,
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
            formatter: function (value, idx) {
              if (!value) return null;

              const valueString = String(value).substring(5, 10);

              if (!dateTemp) {
                dateTemp = valueString;
              }
              if (valueString !== dateTemp && diffIdIndex === -1) {
                diffIdIndex = idx;
              }
              if (!dateTemp || (idx - (diffIdIndex + 4)) % 8 === 0 || idx === 0) {
                return valueString;
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
            },
            align: 'center'
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
          min: Math.min(...apyArr),
          max: Math.max(...apyArr),
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
        showContent: true,
        extraCssText: 'z-index: 9999928492384982394892348928492384293489238492384923849899',
        formatter: function (params) {
          const dataIndex = params[0]?.dataIndex;
          const historyData = poolData.historyData;
          const data = historyData[dataIndex];
          if (data) {
            const time = data.date;
            const apy = data.totalApy;
            const rentingEnergy = data.rentEnergy;
            const recoveryEnergy = data.recoverEnergy;
            const totalEnergy = data.totalEnergy;

            setTime(time);
            setApy(apy * 100);
            setRentingEnergy(rentingEnergy);
            setRecoveryEnergy(recoveryEnergy);
            setTotalEnergy(totalEnergy);
          }
        },
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
        }
      },
      series: [
        {
          data: apyArr,
          type: 'line',
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: true,
          symbolSize: 6,
          showSymbol: false,
          symbol: 'circle',
          stack: 'c',
          name: 'c',
          lineStyle: {
            width: 3,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              {
                offset: 0,
                color: isWhite ? '#5FD2EB' : '#91E8FB'
              },
              {
                offset: 1,
                color: isWhite ? '#1BDCB5' : '#3AFFD7'
              }
            ])
          },
          emphasis: {
            lineStyle: {
              width: 3,
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                {
                  offset: 0,
                  color: isWhite ? '#5FD2EB' : '#91E8FB'
                },
                {
                  offset: 1,
                  color: isWhite ? '#1BDCB5' : '#3AFFD7'
                }
              ])
            },
            itemStyle: {
              color: isWhite ? '#1BDCB5' : '#3BFFD8',
              borderColor: '#ffffff',
              borderWidth: 3,
              shadowOffsetX: 0
            }
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: isWhite ? 'rgba(27, 220, 181, 0.2)' : 'rgba(59, 255, 216, 0.2)'
              },
              {
                offset: 1,
                color: isWhite ? 'rgba(95, 210, 235, 0)' : 'rgba(29, 192, 163, 0)'
              }
            ])
          }
        },
        {
          data: recoveryEnergyArr,
          type: 'bar',
          yAxisIndex: 1,
          xAxisIndex: 1,
          stack: 'a',
          name: 'b',
          itemStyle: {
            color: isWhite ? 'rgba(81, 88, 255, 0.3)' : 'rgba(153, 157, 255, 0.5)',
            borderRadius: [1, 1, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: '#5158ff'
            }
          }
        },
        {
          data: rentingEnergyArr,
          type: 'bar',
          yAxisIndex: 1,
          xAxisIndex: 1,
          stack: 'a',
          name: 'a',
          itemStyle: {
            color: isWhite ? 'rgba(217, 214, 222, 0.2)' : 'rgba(217, 214, 222, 0.15)',
            borderRadius: [1, 1, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: isWhite ? '#B1BCF1' : '#D9D6DE'
            }
          }
        }
      ]
    };
    chartRef.current.setOption(option);
  };

  const getLearnUrl = () => {
    const { lang } = lend;
    const learnUrlNile =
      lang && lang.includes('en')
        ? 'https://justlendorg.zendesk.com/hc/en-us/articles/16512826805785'
        : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/16512826805785';

    const learnUrl =
      lang && lang.includes('en')
        ? 'https://justlendorg.zendesk.com/hc/en-us/articles/17525391458329'
        : 'https://justlendorg.zendesk.com/hc/zh-cn/articles/17525391458329';

    return Config.nile ? learnUrlNile : learnUrl;
  };

  const renderItemData = () => {
    return (
      <div className="energy-pool-data-info">
        <div className="energy-pool-data-info-item">
          <div className="energy-pool-data-info-item-title">
            {!mobile && intl.get('energy_rental.energy_pool_sTrx_APY')}
            <Tooltip
              title={
                <>
                  <span class="mr-5">{intl.get('strx.stake_staking_apy_tip1')}</span>
                  <a class="jl-links" style={{ fontSize: 12 }} href={getLearnUrl()} target="_blank" rel="noreferrer">
                    {intl.get('toast.warning_tip_more')}
                  </a>
                </>
              }
              placement={mobile ? 'topLeft' : 'top'}
              trigger={['click', 'hover']}
              arrowPointAtCenter
              overlayClassName="j-tooltip-dropdown"
            >
              {mobile ? (
                <div className="hover-line">{intl.get('energy_rental.energy_pool_sTrx_APY')}</div>
              ) : (
                <div className="j-tooltip-icon ml-4"></div>
              )}
            </Tooltip>
          </div>
          <div className="energy-pool-data-info-item-value">{formatNumber(apy, 2, { miniText: 0.01 }) + '%'}</div>
        </div>
        <div className="energy-pool-data-info-item">
          <div className="energy-pool-data-info-item-title">{intl.get('energy_rental.energy_pool_renting')}</div>
          <div className="energy-pool-data-info-item-value">{formatNumber(rentingEnergy, 0)}</div>
        </div>
        <div className="energy-pool-data-info-item">
          <div className="energy-pool-data-info-item-title">{intl.get('energy_rental.energy_pool_recovering')}</div>
          <div className="energy-pool-data-info-item-value">{formatNumber(recoveryEnergy, 0)}</div>
        </div>
      </div>
    );
  };

  const onChartMouseout = () => {
    setDefaultData(poolData.latestData);
  };

  return (
    <div className="energy-pool-data-container">
      <div className="energy-pool-data-left">
        <div className="energy-pool-data-content">
          <div className="energy-pool-data-total">
            <div className="energy-pool-data-title">
              {intl.get('energy_rental.energy_pool_total')}
              {mobile && <div className="energy-pool-data-total-time">{time}</div>}
            </div>
            <div className="energy-pool-data-total-value">{formatNumber(totalEnergy, 0)}</div>
            {!mobile && <div className="energy-pool-data-total-time">{time}</div>}
          </div>
          {!mobile && renderItemData()}
        </div>
        <div className="energy-pool-data-chart" onMouseOut={e => onChartMouseout(e)}>
          <div id="charts" style={{ width: '100%', height: 191 }}></div>
          {mobile && renderItemData()}
        </div>
      </div>
      <div className="energy-pool-data-right">
        <div className="energy-pool-data-title">{intl.get('energy_rental.energy_user_scale')}</div>
        <div className="energy-pool-data-user-info">
          <div className="energy-pool-data-user-item">
            <img
              className="energy-pool-user-icon"
              src={lend.theme === 'white' ? rentalAddressWhiteSvg : rentalAddressSvg}
              alt="Rental Addresses"
            />
            <div className="energy-pool-user-item-title">{intl.get('energy_rental.energy_rental_address')}</div>
            <div className="energy-pool-user-item-value">
              {formatNumber(props.data?.userScaleData?.leasingUsers, 0)}
            </div>
          </div>
          <div className="energy-pool-data-user-item">
            <img
              className="energy-pool-user-icon"
              src={lend.theme === 'white' ? resourceSuppliersWhiteSvg : resourceSuppliersSvg}
              alt="Resource Suppliers"
            />
            <div className="energy-pool-user-item-title">{intl.get('energy_rental.energy_resource_suppliers')}</div>
            <div className="energy-pool-user-item-value">
              {formatNumber(props.data?.userScaleData?.resourceProviders, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(EnergyPoolData);
