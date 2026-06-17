import { Dropdown, Menu, Select, Tooltip } from 'antd';
import isMobile from 'ismobilejs';
import { inject, observer } from 'mobx-react';
import React from 'react';
import intl from 'react-intl-universal';
import '../../../assets/css/v2/home/home-market-m.scss'; // for order menu
import WBTTIcon from '../../../assets/images/v2/new-icons/wbtt.png';
import Config from '../../../config';
import { getSupplyApyTooltipTitleNew } from '../mobile/HomeMarketList';
import { getMarketDashboardData } from '../../../utils/backend';
import { getIcons, getLendIcons } from '../../../utils/constant';
import defaultIcon from '../../../assets/images/default.svg';
import {
  BigNumber,
  amountFormat,
  formatNumber,
  formatNumberLend,
  getTotalApy,
  goToPage,
  marketLendAvailable,
  renderPercent,
  toFixedDown,
  tooltip,
  goToMarketDetailPage,
  marketListSort
} from '../../../utils/helper';
import { TooltipText } from '../strx/TooltipText';
import { checkIfShouldShowMintApyDetail } from '../market-detail/utils';
const { jtrxAddress } = Config;
const PAGE_SIZE = 300;
const { Option } = Select;
const { miningSymbol } = Config;
@inject('network')
@inject('lend')
@inject('market')
@inject('user')
@inject('app')
@observer
class MarketSummaryV2 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: isMobile(window.navigator).any,
      lang: window.localStorage.getItem('lang') || intl.options.currentLocale,
      marketData: { markets: [] },
      pagination: {
        size: 'small'
      },
      markets: [],
      defaultMarkets: [],
      sortValue: 'default'
    };
  }

  componentDidMount = async () => {
    document.title = 'Market V1 - JustLend DAO';
    this.getMarketData();
    this.props.market.getMintInfo();
    this.props.app.init();
    this.props.lend.setVariablesInterval();
  };
  componentWillUnmount() {
    this.props.lend.clearVariablesInterval();
  }

  setSort = value => {
    this.setState({ sortValue: value });

    const { marketList, assetList, trxPrice } = this.props.market;
    const { userList } = this.props.user;
    const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
    const priceDivisor = BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
      ? Config.oraclePricePrecision
      : Config.tokenDefaultPrecision;
    const { markets, defaultMarkets } = this.state;
    let dataArr = [];
    let marketsNew = markets.map(item => {
      const { depositApy, mintApy, totalApy } = getTotalApy(item, assetList);
      const { assetPrice, collateralDecimal } = marketList[item.jtokenAddress];
      const isUsdd =
        item.jtokenAddress === Config.usddJtoken || item.jtokenAddress === Config.usddoldJtoken;

      return {
        ...item,
        deposit_apy: totalApy,
        // deposit_apy: BigNumber(depositApy).plus(mintApy).toNumber(),
        detail_price: isUsdd
          ? 1
          : BigNumber(assetPrice)
              .times(trxPrice)
              .times(BigNumber(10).pow(collateralDecimal))
              .div(priceDivisor)
              .div(Config.tokenDefaultPrecision)
              .div(Config.defaultPrecision)
              .toNumber(),
        liquidity: BigNumber(marketLendAvailable(marketList[item.jtokenAddress])).toNumber()
      };
    });

    const isDesc = value.includes('desc');
    const sortKey = value.split('-')[0];

    if (value === 'default') {
      dataArr = defaultMarkets;
    } else {
      dataArr = marketsNew.slice().sort((a, b) => (isDesc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]));
    }

    this.setState({ markets: dataArr });
  };

  sortRender = () => {
    const { sortValue } = this.state;
    const isDesc = sortValue.includes('desc');
    const sortType = isDesc ? 'desc' : 'asc';
    const { theme } = this.props.lend;

    const sortOptions = [
      { sortKey: 'depositedUSD', label: intl.get('market.deposit_size') },
      { sortKey: 'deposit_apy', label: intl.get('market.deposit_apy') },
      { sortKey: 'borrowedUSD', label: intl.get('market.borrow_overview') },
      { sortKey: 'borrowedAPY', label: intl.get('market.borrow_apy') },
      { sortKey: 'collateralFactor', label: intl.get('market.detail_collateral') },
      { sortKey: 'detail_price', label: intl.get('v2.market_detail_price_text') },
      { sortKey: 'liquidity', label: intl.get('v2.liquidity') }
    ];

    const menu = (
      <Menu>
        {sortOptions.map(({ sortKey, label }) => {
          return (
            <Menu.Item key={sortKey} onClick={() => this.setSort(`${sortKey}-${isDesc ? 'asc' : 'desc'}`)}>
              <span className={`sort-item ${sortValue.includes(sortKey) ? 'active' : ''}`}>
                <span className="sort-item-text">{label}</span>
                <span className={`sort-item-icon ${sortType} ${sortKey === 'default' ? 'default' : ''}`}></span>
              </span>
            </Menu.Item>
          );
        })}

        <Menu.Item key={`default`} onClick={() => this.setSort(`default`)}>
          <div className={'sort-item' + (sortValue === 'default' ? ' active' : '')}>
            <span className="sort-item-text">{intl.get('show_current')}</span>
            <span className="sort-item-icon default" />
          </div>
        </Menu.Item>
      </Menu>
    );
    return (
      <Dropdown overlayClassName={`${theme} home-market-sort`} placement="bottomRight" overlay={menu} trigger="click">
        <button className={`sort-m ${theme}`}>
          <span className="icon prefix-icon"></span>
          <span className="text">{intl.get('sort')}</span>
          <span className="icon postfix-icon"></span>
        </button>
      </Dropdown>
    );
  };

  marketCardRender = dataSource => {
    const { isConnected } = this.props.network;
    const { theme, openMint } = this.props.lend;
    const { userList } = this.props.user;
    const { isUSDJDisabled, isUSDDOLDDisabled, marketList, assetList, trxPrice, noService, riojBalance } =
      this.props.market;
    const { fullMarketList } = marketListSort(dataSource);
    const trxAssetPrice = userList[jtrxAddress]?.assetPrice || marketList[jtrxAddress]?.assetPrice;
    return (
      <div className="market-cards">
        {fullMarketList.map(item => {
          const { mintApy, mintApyTRX } = getTotalApy(item, assetList);
          const apy = (mintApy !== '--' && BigNumber(mintApy).gt(0)) ? mintApy : mintApyTRX;
          const shouldShowMiningApyDetail =
            checkIfShouldShowMintApyDetail(true, item.collateralSymbol, apy) && openMint;
          return (
            <div
              key={item.jtokenAddress}
              className="market-card"
              onClick={e => {
                let classList = e.target.classList;
                if (classList) {
                  let className = Array.prototype.slice.call(classList);
                  if (
                    className.includes('j-not-used') ||
                    className.includes('not-used-icon') ||
                    className.includes('can-click')
                  )
                    return;
                }

                window.gtag('event', `market_${item?.collateralSymbol?.toLocaleLowerCase()}`, {
                  'event_category': 'H5',
                  'event_label': `market_${item?.collateralSymbol?.toLocaleLowerCase()}`
                });
                goToMarketDetailPage(item.jtokenAddress);
              }}
            >
              <div className="card-top">
                <img
                  className={'mc-logo ' + item?.collateralSymbol?.toLocaleLowerCase()}
                  src={
                    item.collateralSymbol === 'WBTT'
                      ? theme === 'white'
                        ? getIcons(item.collateralSymbol)
                        : WBTTIcon
                      : item.logoUrl
                      ? item.logoUrl
                      : getLendIcons(item?.collateralSymbol)
                  }
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = getLendIcons(item?.collateralSymbol);
                  }}
                  alt=""
                />
                <span className="mc-symbol">{item.collateralSymbol}</span>

                <span className="mc-subtitle">
                  {item.collateralName}
                  {item.collateralSymbol === 'USDDOLD' && miningSymbol === 'USDD' && (
                    <Tooltip
                      overlayClassName={'j-tooltip-dropdown ' + theme}
                      title={isUSDDOLDDisabled ? intl.getHTML('usdd_update.migrate') : intl.get('usdd_update.tip')}
                      trigger="['hover','click']"
                      placement="topLeft"
                      arrowPointAtCenter
                    >
                      <span className={isUSDDOLDDisabled ? 'not-used-icon ml-6 y-4' : 'tip'}></span>
                    </Tooltip>
                  )}
                  {item.collateralSymbol === 'ETH' && (
                    <span className={'des ' + theme}>({intl.get('eth.origin_ethold')})</span>
                  )}
                  {item.collateralSymbol === 'ETHB' && (
                    <span className={'des ' + theme}>({intl.get('eth.origin_eth')})</span>
                  )}
                </span>

                {((Config.riskMarkets.includes(item.collateralSymbol) && item.collateralSymbol !== 'ETH') ||
                  item.collateralSymbol === 'WBTT') && (
                  <div className="token-names flex aic">
                    <Tooltip
                      title={
                        item.collateralSymbol === 'SUNOLD'
                          ? intl.getHTML('risk_tip.sunold_borrow')
                          : intl.getHTML(`risk_tip.${item.collateralSymbol?.toLocaleLowerCase()}_icon`, {
                              link:
                                item.collateralSymbol === 'USDCOLD' ? Config.announceForUSDCOLD : Config.announceLink
                            })
                      }
                      placement="top"
                      trigger="['hover','click']"
                      arrowPointAtCenter
                      overlayClassName={'j-tooltip-dropdown not-used ' + theme}
                    >
                      <em className="not-used-icon ml-6"></em>
                    </Tooltip>
                  </div>
                )}

                {isUSDJDisabled && item?.collateralSymbol === 'USDJ' && (
                  <div className="token-names flex aic">
                    <Tooltip
                      title={intl.get('risk_tip.usdj_icon')}
                      placement="top"
                      trigger="['hover','click']"
                      arrowPointAtCenter
                      overlayClassName={'j-tooltip-dropdown light not-used ' + theme}
                    >
                      <em className="not-used-icon ml-6"></em>
                    </Tooltip>
                  </div>
                )}

                {isUSDDOLDDisabled && item?.collateralDecimal === 'USDDOLD' && (
                  <div className="token-names flex aic">
                    <Tooltip
                      title={intl.getHTML('usdd_update.migrate')}
                      placement="top"
                      trigger="['hover','click']"
                      arrowPointAtCenter
                      overlayClassName={'j-tooltip-dropdown light not-used ' + theme}
                    >
                      <em className="not-used-icon ml-6"></em>
                    </Tooltip>
                  </div>
                )}

                {noService && item.collateralSymbol === 'wstUSDT' ? (
                  <Tooltip
                    title={
                      !riojBalance || !isConnected
                        ? intl.get('home.market_not_useful')
                        : intl.get('home.market_not_useful2')
                    }
                    placement="top"
                    trigger="['hover','click']"
                    arrowPointAtCenter
                    overlayClassName={'j-tooltip-dropdown not-used ' + theme}
                  >
                    <em className="not-used-icon ml-6"></em>
                  </Tooltip>
                ) : null}
              </div>
              <div className="card-bottom">
                <div className="flex aic jcsb">
                  <div className="cb-ele">
                    <div className="cb-title">{intl.get('market.deposit_size')}</div>
                    <div className="cb-value">
                      {amountFormat(item.depositedUSD, 2, { miniText: 0.01, needDolar: true })}
                    </div>
                  </div>
                  <div className="cb-ele cb-right">
                    <div className="cb-title">
                      <TooltipText
                        title={getSupplyApyTooltipTitleNew(item, assetList, openMint)}
                        placement="top"
                        arrowPointAtCenter
                        trigger={['click', 'hover']}
                        overlayClassName="j-tooltip-dropdown"
                      >
                        {intl.get('market.deposit_apy')}
                      </TooltipText>
                    </div>
                    <div className="cb-value pr visible">
                      <span className="single">
                        {formatNumber(getTotalApy(item, assetList).totalApy, 2, {
                          cutZero: false,
                          miniText: 0.01,
                          needDolar: false,
                          per: true
                        })}
                        {'%'}
                      </span>
                      {Config.holdingTokens.includes(item.collateralSymbol) && (
                        <span className="compounded-reward-icon can-click"></span>
                      )}
                      {shouldShowMiningApyDetail && <span className="ic-fire"></span>}
                    </div>
                  </div>
                </div>
                <div className="flex aic jcsb">
                  <div className="cb-ele">
                    <div className="cb-title">{intl.get('market.borrow_overview')}</div>
                    <div className="cb-value">
                      {amountFormat(item.borrowedUSD, 2, { miniText: 0.01, needDolar: true })}
                    </div>
                  </div>
                  <div className="cb-ele cb-right">
                    <div className="cb-title">{intl.get('market.borrow_apy')}</div>
                    <div className="cb-value">
                      {formatNumber(BigNumber(item.borrowedAPY).times(1e2), 2, {
                        cutZero: false,
                        miniText: 0.01,
                        needDolar: false,
                        per: true
                      })}
                      %
                    </div>
                  </div>
                </div>
                <div className="flex aic jcsb">
                  <div className="cb-ele">
                    <div className="cb-title">
                      <TooltipText
                        title={intl.get('v2.market_detail_collateral_tip')}
                        placement="topLeft"
                        // arrowPointAtCenter
                        trigger={['click', 'hover']}
                        overlayClassName="j-tooltip-dropdown"
                      >
                        {intl.get('market.detail_collateral')}
                      </TooltipText>
                    </div>
                    <div className="cb-value">
                      {renderPercent(BigNumber(item.collateralFactor).div(Config.tokenDefaultPrecision), {
                        decimal: 16,
                        miniText: '0.0000000000000001',
                        multi100: true
                      })}
                    </div>
                  </div>
                  <div className="cb-ele cb-right">
                    <div className="cb-title">
                      <TooltipText
                        title={intl.getHTML('v2.price_tooltip')}
                        placement="top"
                        arrowPointAtCenter
                        trigger={['click', 'hover']}
                        overlayClassName="j-tooltip-dropdown"
                      >
                        {intl.get('v2.market_detail_price_text')}
                      </TooltipText>
                    </div>
                    <div className="cb-value">
                      {marketList[item.jtokenAddress] &&
                        formatNumberLend(
                          item.jtokenAddress === Config.usddJtoken ||
                            item.jtokenAddress === Config.usddoldJtoken
                            ? BigNumber(1)
                            : BigNumber(marketList[item.jtokenAddress].assetPrice)
                                .times(trxPrice)
                                .times(BigNumber(10).pow(marketList[item.jtokenAddress].collateralDecimal))
                                // .div(Config.tokenDefaultPrecision)
                                .div(
                                  BigNumber(trxAssetPrice).gte(Config.oraclePricePrecision)
                                    ? Config.oraclePricePrecision
                                    : Config.tokenDefaultPrecision
                                )
                                .div(Config.tokenDefaultPrecision)
                                .div(Config.defaultPrecision),
                          6,
                          {
                            needDolar: true,
                            miniText: '0.000001'
                          }
                        )}
                    </div>
                  </div>
                </div>
                <div className="flex aic jcsb">
                  <div className="cb-ele">
                    <div className="cb-title">
                      <TooltipText
                        title={tooltip(intl.get('v2.tip8'), [
                          {
                            title: intl.get('v2.tip9')
                          },
                          { title: intl.get('v2.tip10') }
                        ])}
                        placement="topLeft"
                        // arrowPointAtCenter
                        trigger={['click', 'hover']}
                        overlayClassName="j-tooltip-dropdown"
                      >
                        {intl.get('v2.liquidity')}
                      </TooltipText>
                    </div>
                    <div className="cb-value">
                      <Tooltip
                        overlayClassName="market-tooltip-overlay short right"
                        placement="bottom"
                        trigger="['hover','click']"
                        title={`${intl.get('v2.utilization_rate')} ${
                          marketList[item.jtokenAddress]
                            ? toFixedDown(
                                BigNumber(marketList[item.jtokenAddress].borrowedUSD)
                                  .div(marketList[item.jtokenAddress].depositedUSD)
                                  .times(100),
                                2
                              )
                            : '--'
                        }%`}
                      >
                        <div className="fw500">
                          {marketList[item.jtokenAddress]
                            ? amountFormat(marketLendAvailable(marketList[item.jtokenAddress]), 2, {
                                miniText: 0.01
                              })
                            : ''}{' '}
                          {item.collateralSymbol}
                        </div>
                        {marketList[item.jtokenAddress] && (
                          <div className="pipe">
                            <div
                              className="active-bar"
                              style={{
                                width:
                                  toFixedDown(
                                    BigNumber(marketList[item.jtokenAddress].borrowedUSD)
                                      .div(marketList[item.jtokenAddress].depositedUSD)
                                      .times(100),
                                    2
                                  ) + '%'
                              }}
                            ></div>
                          </div>
                        )}
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  getMarketData = async () => {
    try {
      let res = await getMarketDashboardData();
      if (!res.success) {
        return;
      }

      let markets = res.data.markets.map(item => {
        return { ...item, key: item.id };
      });

      res.data.markets = markets;
      this.setState({ marketData: res.data, markets, defaultMarkets: markets });
    } catch (err) {
      console.log('getMarketData', err);
    }
  };

  render() {
    const { markets } = this.state;
    return (
      <div className="market-summary-list-v2">
        <div className="msl-title flex aic jcsb w-100">
          <div className="flex aic jcsb w-100">
            <div className="flex aic jcsb all-market">{intl.get('index.markets_title')}</div>
            {this.sortRender()}
          </div>
        </div>
        {this.marketCardRender(markets)}
      </div>
    );
  }
}

export default MarketSummaryV2;
