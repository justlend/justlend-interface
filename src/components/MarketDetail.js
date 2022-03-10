import React from 'react';
import isMobile from 'ismobilejs';
import intl from 'react-intl-universal';
import { inject, observer } from 'mobx-react';
import LeftMenu from './LeftMenu';
import Config from '../config';
import { Table, Tooltip } from 'antd';
import ReactEcharts from 'echarts-for-react';
import { BigNumber, formatNumber, amountFormat, tronscanAddress, renderPercent, getTotalApy } from '../utils/helper';
import { getJTokenDetails } from '../utils/backend';
import '../assets/css/market.scss';
import defaultIcon from '../assets/images/default.svg';

const PAGE_SIZE = 300;

@inject('network')
@inject('lend')
@observer
class MarketDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile(window.navigator).any,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      jTokenData: {
        priceUSD: '--',
        depositHeadcount: '--',
        borrowHeadcount: '--',
        borrowLimit: '--',
        earnUSDPerDay: '--',
        totalReserves: '--',
        reserveFactor: '--',
        collateralFactor: '--',
        collateralSymbol: '--',
        totalSupply: '--',
        oneToExchangeRate: '--'
      },
      jtokenAddress: '',
      borrowList: [],
      supplyList: [],
      baseList: [],
      current: {
        base: '--',
        borrow: '--',
        supply: '--'
      },
      curStatus: true,
      labelStatus: true // current label show or hide
    };
  }

  componentDidMount = async () => {
    await this.props.lend.getMintInfo();
    const startHash = window.location.hash.split('?');
    if (startHash.length > 1) {
      const searchs = startHash[1].split('&');
      searchs.map(item => {
        const param = item.split('=');
        if (param.length > 1 && param[0] === 'jtokenAddress') {
          this.setState({ jtokenAddress: param[1] }, () => {
            this.getJTokenData();
          });
        }
      });
    }
    await this.props.network.getNowTime();
    this.props.network.getCountTime();
  };

  getJTokenData = async () => {
    try {
      const { jtokenAddress } = this.state;
      const res = await getJTokenDetails(jtokenAddress);
      const { assetList } = this.props.lend;
      let mintApyResult = 0;
      const { mintApy } = getTotalApy(res.data, assetList);
      if (BigNumber(mintApy).gte(0)) {
        mintApyResult = mintApy;
      }
      if (!res.success) {
        return;
      }
      this.setState({ jTokenData: res.data }, () => {
        const model = res.data.model;
        let borrowList = [],
          supplyList = [],
          baseList = [];
        model.map(item => {
          if (!item.current) {
            borrowList.push(formatNumber(BigNumber(item.borrow).times(100), 2, { miniText: 0.01, per: true }));
            supplyList.push(
              formatNumber(BigNumber(item.supply).times(100).plus(mintApyResult), 2, { miniText: 0.01, per: true })
            );
            baseList.push(formatNumber(BigNumber(item.base).times(100), 2, { miniText: 0.01, per: true }));
          } else {
            this.setState({
              current: {
                base: BigNumber(item.base).times(100),
                borrow: BigNumber(item.borrow).times(100),
                supply: BigNumber(item.supply).times(100)
              }
            });
          }
        });
        this.setState({
          borrowList,
          supplyList,
          baseList
        });
      });
    } catch (err) {
      console.log('getMarketData', err);
    }
  };

  renderHeader() {
    const { jTokenData, current } = this.state;
    const { assetList } = this.props.lend;
    const { totalApy, depositApy, mintApy } = getTotalApy(jTokenData, assetList);

    return jTokenData && jTokenData.logoUrl ? (
      <div className="market-detail-header flex-between">
        <div className="common-title header-title">
          <img src={jTokenData.logoUrl} alt="logo" />
          <span>{`${jTokenData.collateralName}(${jTokenData.collateralSymbol})`}</span>
        </div>
        <div className="header-info flex-between">
          <div className="">
            <p>{intl.getHTML('market.deposit_size')}</p>
            <p>{amountFormat(jTokenData.depositedUSD, 2, { miniText: 0.01, needDolar: true })}</p>
          </div>
          <div className="">
            <p>{intl.getHTML('market.deposit_apy')}</p>
            <Tooltip
              title={
                <div className="info-tooltip">
                  <div>
                    {intl.get('market.deposit_base_nex')} :{' '}
                    {formatNumber(current.supply, 2, { per: true, miniText: '0.01' })}%
                  </div>
                  <div>
                    {intl.get('market.sun_mining_nex')} : {formatNumber(mintApy, 2, { per: true, miniText: '0.01' })}%
                  </div>
                </div>
              }
              placement="bottomRight"
            >
              <p>
                {formatNumber(totalApy, 2, {
                  cutZero: false,
                  miniText: 0.01,
                  needDolar: false,
                  round: true,
                  per: true
                })}
                %
              </p>
            </Tooltip>
            {/* <p>{formatNumber(jTokenData.depositedAPY, 2, { miniText: 0.01, per: true })}%</p> */}
          </div>
          <div className="">
            <p>{intl.getHTML('market.borrow_size')}</p>
            <p>{amountFormat(jTokenData.borrowedUSD, 2, { miniText: 0.01, needDolar: true })}</p>
            {/* <p>{amountFormat(jTokenData.borrowedUSD, 2, { miniText: 0.01, needDolar: true })}</p> */}
          </div>
          <div className="">
            <p>{intl.getHTML('market.borrow_apy')}</p>
            <p>{formatNumber(BigNumber(jTokenData.borrowedAPY).times(1e2), 2, { miniText: 0.01, per: true })}%</p>
          </div>
        </div>
      </div>
    ) : (
      <div className="market-detail-header flex-between">
        <div className="common-title header-title">
          <span>{'--'}</span>
        </div>
        <div className="header-info flex-between">
          <div className="">
            <p>{intl.getHTML('market.deposit_size')}</p>
            <p>{'--'}</p>
          </div>
          <div className="">
            <p>{intl.getHTML('market.deposit_apy')}</p>
            <p>{'--'}%</p>
            {/* <p>{formatNumber(jTokenData.depositedAPY, 2, { miniText: 0.01, per: true })}%</p> */}
          </div>
          <div className="">
            <p>{intl.getHTML('market.borrow_size')}</p>
            <p>{'--'}</p>
            {/* <p>{amountFormat(jTokenData.borrowedUSD, 2, { miniText: 0.01, needDolar: true })}</p> */}
          </div>
          <div className="">
            <p>{intl.getHTML('market.borrow_apy')}</p>
            <p>{'--'}%</p>
          </div>
        </div>
      </div>
    );
  }

  renderInfo() {
    const { jTokenData } = this.state;
    return (
      <div className="market-detail-info">
        <div className="detail-title">{intl.getHTML('market.detail_data')}</div>
        <div className="detail-info">
          <div className="flex-between">
            <span>{intl.get('market.detail_price')}</span>
            <span>
              {jTokenData.priceUSD == '--'
                ? '--'
                : amountFormat(jTokenData.priceUSD, 2, { miniText: 0.01, needDolar: true })}
            </span>
          </div>
          <div className="flex-between">
            <span>{intl.get('market.detail_number_of_deposit_accounts')}</span>
            <span>{jTokenData.depositHeadcount}</span>
            {/* <span>{amountFormat(jTokenData.depositHeadcount, 2, { miniText: 0.01, needDolar: true })}</span> */}
          </div>
          <div className="flex-between">
            <span>{intl.get('market.detail_number_of_borrow_accounts')}</span>
            <span>{jTokenData.borrowHeadcount}</span>
            {/* <span>{amountFormat(jTokenData.borrowHeadcount, 2, { miniText: 0.01, needDolar: true })}</span> */}
          </div>
          <div className="flex-between">
            <span>{intl.get('market.detail_limitmax')}</span>
            <span>
              {BigNumber(amountFormat(jTokenData.borrowLimit, 2, { miniText: 0.01, needDolar: true })).gt(0)
                ? amountFormat(jTokenData.borrowLimit, 2, { miniText: 0.01, needDolar: true })
                : intl.get('market.detail_none')}
            </span>
          </div>
          <div className="flex-between">
            <span>{intl.get('market.detail_dailyinterest')}</span>
            <span>{formatNumber(jTokenData.earnUSDPerDay, 2, { miniText: 0.01, needDolar: true })}</span>
          </div>
          <div className="flex-between">
            <span>{intl.get('market.detail_reserves')}</span>
            <span>{formatNumber(jTokenData.totalReserves, 6, { miniText: 0.000001 })}</span>
          </div>
          <div className="flex-between">
            <span>{intl.get('market.detail_factor')}</span>
            <span>
              {renderPercent(jTokenData.reserveFactor, { decimal: 16, miniText: '0.0000000000000001', multi100: true })}
            </span>
          </div>
          <div className="flex-between">
            <span>{intl.get('market.detail_collateral')}</span>
            <span>
              {renderPercent(jTokenData.collateralFactor, {
                decimal: 16,
                miniText: '0.0000000000000001',
                multi100: true
              })}
            </span>
          </div>
          <div className="flex-between">
            <span>{intl.getHTML('market.detail_jminted', { value: 'j' + jTokenData.collateralSymbol })}</span>
            <span>{formatNumber(jTokenData.totalSupply, 0, { miniText: 1 })}</span>
          </div>
          <div className="flex-between">
            <span>{intl.getHTML('market.detail_jexchangerate', { value: 'j' + jTokenData.collateralSymbol })}</span>
            <span>
              {BigNumber(jTokenData.oneToExchangeRate).lt(BigNumber(1).div(Config.tokenDefaultPrecision))
                ? '--'
                : '1 ' +
                jTokenData.collateralSymbol +
                ' : ' +
                formatNumber(jTokenData.oneToExchangeRate, 18) +
                ' j' +
                jTokenData.collateralSymbol}
            </span>
          </div>
        </div>
      </div>
    );
  }

  getEchartsOption() {
    const { borrowList, supplyList, baseList, labelStatus } = this.state;
    const { current, jTokenData } = this.state;
    const { assetList } = this.props.lend;
    const { mintApy } = getTotalApy(jTokenData, assetList);
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          animation: false,
          lineStyle: {
            color: 'rgba(69, 77, 226, 0.2)',
            type: 'dashed'
          },
          label: {
            precision: 2
          }
        },
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderWidth: '0',
        textStyle: {
          color: '#333',
          fontFamily: 'AvenirNext-Medium',
          fontSize: '14px'
        },
        formatter: function (params) {
          let baseDeposit = '--';
          if (mintApy !== '--') {
            baseDeposit = formatNumber(BigNumber(params[1].value).minus(mintApy), 2);
          }
          return (
            '<div class="default-text-clone"><p>' +
            intl.get('market.deposit_base_nex') +
            '<span class="blue">' +
            baseDeposit +
            '%</span></p><p>' +
            params[0].seriesName +
            '<span class="green">' +
            formatNumber(params[0].value, 2) +
            '%</span></p></div>'
          );
        }
      },
      grid: {
        left: '0%',
        right: '3%',
        bottom: '5%',
        containLabel: true
      },
      yAxis: {
        name: 'APY(%)',
        nameTextStyle: {
          color: '#84869E',
          align: 'left'
        },
        type: 'value',
        axisLine: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dotted',
            color: ['#ccc']
          }
        },
        splitNumber: 3,
        axisTick: {
          show: false
        },
        axisLabel: {
          textStyle: {
            color: '#84869E'
          }
        }
      },
      xAxis: {
        type: 'category',
        axisPointer: {
          value: Number(formatNumber(current.base, 2)),
          lineStyle: {
            color: '#e9e9e9',
            width: 2
          },
          label: {
            show: labelStatus,
            formatter: function (params, text) {
              return intl.get('market.current');
            },
            backgroundColor: 'rgba(0,0,0,0.5)'
          },
          handle: {
            show: true,
            color: 'transparent'
          }
        },
        name: '',
        nameTextStyle: {
          color: '#84869E'
        },
        data: baseList,
        axisLine: {
          lineStyle: {
            color: ['#E9E9E9']
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          interval: 0,
          formatter: function (value, idx) {
            if (idx % 10 == 0 && idx != 0) {
              return idx;
            } else {
              return null;
            }
          },
          textStyle: {
            color: '#84869E'
          }
        }
      },
      series: [
        {
          name: intl.get('market.borrow_apy'),
          type: 'line',
          hoverAnimation: false,
          itemStyle: {
            normal: {
              color: '#1ED0AC',
              lineStyle: {
                width: 4
              }
            },
            emphasis: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(255, 255, 255, 0.5)',
              color: '#9EF9E6',
              borderColor: '#1ED0AC',
              borderWidth: 3
            }
          },
          data: borrowList,
          showSymbol: false,
          symbolSize: 11
        },
        {
          name: intl.get('market.deposit_apy'),
          type: 'line',
          itemStyle: {
            normal: {
              color: '#3D56D6',
              lineStyle: {
                width: 4
              }
            },
            emphasis: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(255, 255, 255, 0.5)',
              color: '#BBBAFF',
              borderColor: '#3D56D6',
              borderWidth: 3
            }
          },
          hoverAnimation: false,
          data: supplyList,
          showSymbol: false,
          symbolSize: 11
        }
      ]
    };
  }

  judgeBox = () => {
    const { mobile } = this.state;
    if (mobile) this.hideDBox;
  };

  hideDBox = () => {
    this.setState({
      curStatus: false
    });
  };

  showDBox = () => {
    this.setState({
      curStatus: true
    });
  };

  canvasHover = () => {
    this.setState({ labelStatus: false });
  };

  canvasBlur = () => {
    this.setState({ labelStatus: true });
  };

  render() {
    const { mobile, jtokenAddress, current, curStatus, jTokenData, lang } = this.state;
    const { menuFlag } = this.props.network;
    const { assetList } = this.props.lend;
    const { mintApy, totalApy } = getTotalApy(jTokenData, assetList);
    const supplyApy = formatNumber(BigNumber(current.supply).plus(mintApy), 2, {
      cutZero: false,
      miniText: 0.01,
      needDolar: false,
      round: true,
      per: true
    });
    const { multyRealStart } = this.props.network;
    return (
      <div className={mobile ? '' : 'flex-end'}>
        <LeftMenu></LeftMenu>
        <div
          className={
            mobile
              ? 'market-container right-container mobile-right-container'
              : menuFlag
                ? 'market-container right-container'
                : 'market-container right-container max-width'
          }
        >
          {this.renderHeader()}
          <div className="market-info-block flex-between">
            {this.renderInfo()}
            <div
              className="echarts-frame"
              onClick={() => this.judgeBox()}
              onTouchStart={() => this.judgeBox()}
              onTouchMove={() => this.judgeBox()}
              onMouseOver={() => this.hideDBox()}
              onMouseLeave={() => this.showDBox()}
            >
              <span className="echarts-title">
                {intl.getHTML('market.detail_apymodel')}
                <br />
                {multyRealStart ? (
                  ''
                ) : (
                  <p className="echarts-subtitle">{intl.get('market.deposit_apy_include')}</p>
                )}
              </span>
              <span className="left">APY(%)</span>
              <div className="canvas-box" onMouseOver={() => this.canvasHover()} onMouseLeave={() => this.canvasBlur()}>
                <ReactEcharts option={this.getEchartsOption()} className="market-detail-echarts" />
              </div>
              <div className={'default-text ' + (curStatus ? '' : 'hide')}>
                <p>
                  {intl.get('market.deposit_base_nex')}
                  <span className="blue">
                    {formatNumber(current.supply, 2, { miniText: 0.01, per: true })}
                    {'%'}
                  </span>
                </p>
                <p>
                  {intl.get('market.borrow_apy')}
                  <span className="green">
                    {formatNumber(current.borrow, 2, { miniText: 0.01, per: true })}
                    {'%'}
                  </span>
                </p>
              </div>
              <span className="right">{intl.get('market.detail_use_rate') + '(%)'}</span>
              {multyRealStart && !(Config.hideMarketMintIcon.indexOf(jTokenData.collateralSymbol) > -1) && (
                <>
                  <div className="flexB gray-bar">
                    <span className="title">{intl.get('market.detail_distubutedapy')}</span>
                    <span>
                      <span className="data-tip">{intl.get('market.sun_mining_nex')}</span>
                      <span className="data">
                        {formatNumber(mintApy, 2, {
                          cutZero: false,
                          miniText: 0.01,
                          needDolar: false,
                          round: true,
                          per: true
                        })}
                        %
                      </span>
                    </span>
                  </div>
                  <div className="bottom-bar">{intl.get('market.detail_data_hotdesc')}</div>
                </>
              )}
            </div>
          </div>
          <div className="market-footer flex">
            <div className="go-transcan mt20">{tronscanAddress(intl.get('market.detail_go2scan'), jtokenAddress)}</div>
            {/* <a className="mt20 go-sun" href={`${Config.sunUrl}?lang=${lang}#/sun`} target="sunswap">
              {intl.get('market.detail_data_knowsun')}
            </a> */}
          </div>
        </div>
      </div>
    );
  }
}

export default MarketDetail;
